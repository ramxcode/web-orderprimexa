const router    = require('express').Router();
const Order     = require('../models/Order');
const Config    = require('../models/Config');
const https     = require('https');
const auth      = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { sendPendingPaymentEmail, sendFailedOrderEmail, sendExpiredOrderEmail } = require('../services/mailer');


// Status mapping
const PENDING_STATUSES  = ['pending', 'waiting_payment', 'unpaid'];
const SUCCESS_STATUSES  = ['paid', 'completed', 'processing', 'settlement', 'success'];
const INACTIVE_STATUSES = ['expired', 'cancelled', 'failed', 'cancel', 'expire'];


// Helper: call PayGomerch (same hostname as admin.js)
const PAYGOMERCH_BASE = 'v1-api.pay-gomerch.web.id';
function callPayGomerch(path, body, apiKey) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: PAYGOMERCH_BASE, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey, 'Content-Length': Buffer.byteLength(payload) },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { reject(new Error('Invalid JSON: ' + data.slice(0,200))); }
      });
    });
    req.on('error', reject);
    req.write(payload); req.end();
  });
}

// Helper: call GatePay API (gatepay.biz.id)
const GATEPAY_HOST = 'gatepay.biz.id';
const crypto = require('crypto');
function callGatePay(method, path, body, apiKey, idempotencyKey) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    // Generate Idempotency-Key: gunakan yang diberikan, atau auto-generate
    const idemKey = idempotencyKey || crypto.randomUUID();
    const opts = {
      hostname: GATEPAY_HOST, port: 443, path, method,
      headers: {
        'x-api-key': apiKey, 'content-type': 'application/json', 'accept': 'application/json',
        'Idempotency-Key': idemKey,
        ...(postData ? { 'content-length': Buffer.byteLength(postData) } : {}),
      },
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) return reject(new Error(parsed.message || parsed.error || 'GatePay error ' + res.statusCode));
          resolve(parsed);
        } catch (e) { reject(new Error('Invalid JSON from GatePay: ' + data.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// Helper: detect active payment provider from Config DB
async function getActiveProvider() {
  try {
    const cfg = await Config.findOne({ key: 'active_payment_provider' });
    return cfg?.value || 'paygomerch';
  } catch(e) { return 'paygomerch'; }
}

// ── Telegram: notifikasi pesanan masuk ke admin ──────────────────
const _notifiedOrders = new Set(); // anti-duplicate per session
async function _notifyAdminNewOrder(order, statusLabel) {
  const key = (order.orderId || String(order._id)) + '|' + (statusLabel || 'new');
  if (_notifiedOrders.has(key)) return;
  _notifiedOrders.add(key);
  try {
    const User    = require('../models/User');
    const { getBot } = require('../services/telegramBot');
    const bot = getBot();
    if (!bot) return;

    const admins = await User.find({ role: 'admin', telegramChatId: { $exists: true, $ne: '' } }).select('telegramChatId').lean();
    if (!admins.length) return;

    // Format waktu WIB: "30/08/2026, 22.13 WIB"
    const d   = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const pad = n => String(n).padStart(2, '0');
    const waktu = pad(d.getDate()) + '/' + pad(d.getMonth()+1) + '/' + d.getFullYear()
                + ', ' + pad(d.getHours()) + '.' + pad(d.getMinutes()) + ' WIB';

    const item   = (order.items && order.items[0]) || {};
    const produk = item.productName || order.productName || '—';
    const varian = item.variant     || order.variantName || '—';
    const qty    = item.quantity    || order.qty         || 1;
    const email  = order.customerEmail || '—';
    const nama   = order.customerName  || '—';
    const status = statusLabel || order.status || 'pending';
    const total  = Number(order.total || 0).toLocaleString('id-ID');
    const pm     = order.paymentMethod || '—';
    const storeUrl  = process.env.STORE_URL || process.env.FRONTEND_URL || 'http://localhost:5500';
    const adminLink = storeUrl + '/admin/orders';

    const text =
      '📦 *PESANAN MASUK* 〃\n\n' +
      '*Order ID:* #' + (order.orderId || '—') + '\n' +
      '*Status:* ' + status + '\n' +
      '*Waktu:* ' + waktu + '\n' +
      '*Customer:* ' + email + '\n' +
      '*Nama:* ' + nama + '\n\n' +
      '*Produk:* ' + produk + '\n' +
      '*Varian:* ' + varian + '\n' +
      '*Quantity:* ' + qty + '\n' +
      '*Data:* ' + email + '\n\n' +
      '*Metode Pembayaran:* ' + pm + '\n' +
      '*Total:* Rp ' + total;

    const opts = {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '🔍 Lihat Pesanan', url: adminLink }]] }
    };

    for (const admin of admins) {
      try { await bot.sendMessage(admin.telegramChatId, text, opts); } catch(e) {}
    }
  } catch(e) { console.error('[OrderNotif] error:', e.message); }
}

// GET /api/orders
router.get('/', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user._id };
    const { status, page = 1, limit = 20 } = req.query;
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page)-1)*Number(limit))
      .populate('userId', 'name email');
    const total = await Order.countDocuments(filter);

    res.json({ success: true, data: orders, total });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// Auto-fulfillment: assign StockItem ke order jika processType = auto
async function autoFulfillOrder(order) {
  try {
    const Product   = require('../models/Product');
    const StockItem = require('../models/StockItem');
    const { sendOrderSuccessEmail } = require('../services/mailer');

    const productId  = (order.items?.[0]?.productId) || order.productId;
    const variantName= (order.items?.[0]?.variant)   || order.variantName || '';
    if (!productId) return;

    const product = await Product.findById(productId);
    if (!product) return;

    // Cari variant yang sesuai
    const variant = product.variants.find(function(v){
      return v.name === variantName;
    });
    if (!variant) return;
    if (variant.processType !== 'auto') return; // Manual = admin kirim sendiri

    // Tentukan qty yang dipesan
    const orderedQty = (order.items?.[0]?.quantity) || order.qty || 1;

    // Ambil sejumlah StockItem sesuai qty
    const stockItems = [];
    for (let i = 0; i < orderedQty; i++) {
      const item = await StockItem.findOneAndUpdate(
        { productId: product._id, variantId: variant._id, status: 'available' },
        { status: 'used', invoiceId: order.orderId, usedAt: new Date() },
        { new: true }
      );
      if (item) stockItems.push(item);
      else break; // stok habis
    }
    const stockItem = stockItems.length > 0 ? stockItems[0] : null; // referensi utama

    // Gabungkan credentials dari semua stockItems
    const combinedCredentials = stockItems.map(function(s, idx) {
      var prefix = stockItems.length > 1 ? '=== Akun ' + (idx + 1) + ' ===\n' : '';
      return prefix + (s.content || '');
    }).join('\n\n');
    const combinedNotes = stockItems.length > 0 ? (stockItems[0].notes || '') : '';

    if (stockItem) {
      // Generate PIN 6 digit (jika belum ada)
      const crypto = require('crypto');
      const bcrypt = require('bcryptjs');
      let transactionPin = null;
      const freshOrder = await Order.findById(order._id);
      if (!freshOrder.transactionPin) {
        const plainPin  = String(crypto.randomInt(100000, 999999));
        const hashedPin = await bcrypt.hash(plainPin, 10);
        await Order.findByIdAndUpdate(order._id, {
          transactionPin: hashedPin,
          pinCreatedAt:   new Date(),
          pinLastSentAt:  new Date(),
        });
        transactionPin = plainPin; // hanya digunakan sekali untuk email
        console.log(`[Invoice Security] TRX ${order.orderId} — PIN generated`);
      }

      // Update order ke completed
      await Order.findByIdAndUpdate(order._id, {
        status: 'completed',
        completedAt: new Date()
      });
      // Notif Telegram ke admin — order completed/paid
      const completedOrder = { ...order, status: 'completed' };
      setImmediate(() => _notifyAdminNewOrder(completedOrder, 'paid'));
      // Sync jumlah stok di Product.variants
      const availCount = await StockItem.countDocuments({
        variantId: variant._id, status: 'available'
      });
      await Product.findOneAndUpdate(
        { _id: product._id, 'variants._id': variant._id },
        { $set: { 'variants.$.stock': availCount } }
      );
      console.log('[AutoFulfill] ✅ Order', order.orderId, '→ completed,', stockItems.length, 'StockItem(s) assigned');

      // Kirim email dengan kredensial + PIN ke customer
      const toEmail = order.customerEmail;
      if (toEmail) {
        const productName = order.items?.[0]?.productName || order.productName || product.name || '';
        setImmediate(async () => {
          await sendOrderSuccessEmail({
            to:              toEmail,
            orderId:         order.orderId,
            productName:     productName,
            variantName:     variantName,
            subtotal:        order.subtotal || order.total,
            total:           order.total,
            paymentMethod:   order.paymentMethod || '',
            paidAt:          order.paidAt || new Date(),
            credentials:     combinedCredentials,
            credentialNotes: combinedNotes,
            customerName:    order.customerName || '',
            transactionPin:  transactionPin || null,
          });
          if (transactionPin) console.log(`[Invoice Security] TRX ${order.orderId} — PIN email sent`);
        });
      }
    } else {
      console.warn('[AutoFulfill] ⚠️ Stok habis untuk order', order.orderId, '— processType auto tapi tidak ada stok tersedia');
    }
  } catch(e) {
    console.error('[AutoFulfill] Error:', e.message);
  }
}

// Helper: trigger failed email non-blocking (anti-duplicate + no-success-override)
async function _triggerFailedEmail(order) {
  if (!order.customerEmail) return;
  if (order.failedEmailSentAt) return; // sudah pernah dikirim
  if (SUCCESS_STATUSES.includes(order.status)) return; // jangan override success
  const item = order.items?.[0] || {};
  try {
    const Product = require('../models/Product');
    let productImage = order.productImage || '';
    if (!productImage) {
      const pid = item.productId || order.productId;
      if (pid) { const p = await Product.findById(pid).lean(); if (p) productImage = p.imageUrl || ''; }
    }
    const sent = await sendFailedOrderEmail({
      to:            order.customerEmail,
      orderId:       order.orderId,
      productName:   item.productName || order.productName || '',
      variantName:   item.variant     || order.variantName  || '',
      productPrice:  item.price       || order.subtotal     || order.total || 0,
      totalPayment:  order.total || 0,
      paymentMethod: order.paymentMethod || '',
      productImage,
      customerName:  order.customerName || '',
    });
    if (sent) await Order.findByIdAndUpdate(order._id, { failedEmailSentAt: new Date() });
  } catch(e) {
    console.error(`[Email][Payment Failed] TRX ${order.orderId} error:`, e.message);
  }
}

router.get('/track/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    // Auto-cek status ke payment provider jika masih pending dan ada paymentRef
    if (order.status === 'pending' && order.paymentRef) {
      try {
        const provider = await getActiveProvider();

        if (provider === 'gatepay') {
          // ── GatePay status check ─────────────────────────────────
          const cfg = await Config.findOne({ key: 'gatepay_api_key' });
          if (cfg?.value) {
            try {
              const gpResult = await callGatePay('GET', '/api/qrisgatepay/v1/payments/' + order.paymentRef, null, cfg.value);
              const gpData = gpResult?.data || gpResult || {};
              const txStatus = (gpData.status || '').toLowerCase();
              console.log('[Track] GatePay status check:', order.orderId,
                '→ txStatus:', txStatus || '(empty)',
                '| raw:', JSON.stringify(gpResult).slice(0, 500));
              if (['settlement','capture','success','paid'].includes(txStatus)) {
                await Order.findByIdAndUpdate(order._id, { status: 'paid', paidAt: new Date() });
                order.status = 'paid';
                order.paidAt = new Date();
                setImmediate(() => autoFulfillOrder(order));
              } else if (['failed','failure','deny','denied','cancel','cancelled','error','payment_failed',
                          'expire','expired'].includes(txStatus)) {
                if (!SUCCESS_STATUSES.includes(order.status)) {
                  await Order.findByIdAndUpdate(order._id, { status: 'cancelled' });
                  order.status = 'cancelled';
                  const isExpired = ['expire','expired','cancel'].includes(txStatus);
                  console.log(`[Track] TRX ${order.orderId} → ${isExpired ? 'EXPIRED' : 'FAILED'} (txStatus: ${txStatus})`);
                  const freshOrder = await Order.findById(order._id).lean();
                  if (freshOrder && !freshOrder.failedEmailSentAt && freshOrder.customerEmail) {
                    const item = freshOrder.items?.[0] || {};
                    if (isExpired) {
                      setImmediate(async () => {
                        try {
                          const sent = await sendExpiredOrderEmail({
                            to:           freshOrder.customerEmail,
                            orderId:      freshOrder.orderId,
                            productName:  item.productName || freshOrder.productName || '',
                            variantName:  item.variant     || freshOrder.variantName  || '',
                            totalPayment: freshOrder.total || 0,
                            customerName: freshOrder.customerName || '',
                          });
                          if (sent) await Order.findByIdAndUpdate(freshOrder._id, { failedEmailSentAt: new Date() });
                        } catch(e) { console.error('[Email][Expired] error:', e.message); }
                      });
                    } else {
                      setImmediate(() => _triggerFailedEmail(freshOrder));
                    }
                  }
                }
              }
            } catch(gpErr) { console.error('[Track] GatePay status error:', gpErr.message); }
          } else {
            console.warn('[Track] gatepay_api_key tidak dikonfigurasi — skip status check');
          }

        } else {
          // ── PayGomerch status check (existing) ──────────────────
          const cfg = await Config.findOne({ key: 'paygomerch_api_key' });
          if (cfg?.value) {
            const sr = await callPayGomerch('/qris/status', { transaction_id: order.paymentRef }, cfg.value);
            // PayGomerch bisa return flat { transaction_id, transaction_status, ... }
            // atau wrapped { success, data: { transaction_id, transaction_status, ... } }
            const body = sr.body || {};
            const pg   = body.data && typeof body.data === 'object' ? body.data : body;
            // Cek di semua kemungkinan field
            const txStatus = (pg.transaction_status || pg.status || body.transaction_status || body.status || '').toLowerCase();
            console.log('[Track] PayGomerch status check:', order.orderId,
              '→ txStatus:', txStatus || '(empty)',
              '| httpStatus:', sr.status,
              '| raw:', JSON.stringify(body).slice(0, 500));
            if (['settlement','capture','success','paid'].includes(txStatus)) {
              await Order.findByIdAndUpdate(order._id, { status: 'paid', paidAt: new Date() });
              order.status = 'paid';
              order.paidAt = new Date();
              setImmediate(() => autoFulfillOrder(order));
            } else if (['failed','failure','deny','denied','cancel','cancelled','error','payment_failed',
                        'expire','expired'].includes(txStatus)) {
              // PayGomerch pakai 'expire' dan 'cancel' per docs
              // Jangan override jika sudah success
              if (!SUCCESS_STATUSES.includes(order.status)) {
                await Order.findByIdAndUpdate(order._id, { status: 'cancelled' });
                order.status = 'cancelled';
                const isExpired = ['expire','expired','cancel'].includes(txStatus);
                console.log(`[Track] TRX ${order.orderId} → ${isExpired ? 'EXPIRED' : 'FAILED'} (txStatus: ${txStatus})`);
                const freshOrder = await Order.findById(order._id).lean();
                if (freshOrder && !freshOrder.failedEmailSentAt && freshOrder.customerEmail) {
                  const item = freshOrder.items?.[0] || {};
                  if (isExpired) {
                    setImmediate(async () => {
                      try {
                        const sent = await sendExpiredOrderEmail({
                          to:           freshOrder.customerEmail,
                          orderId:      freshOrder.orderId,
                          productName:  item.productName || freshOrder.productName || '',
                          variantName:  item.variant     || freshOrder.variantName  || '',
                          totalPayment: freshOrder.total || 0,
                          customerName: freshOrder.customerName || '',
                        });
                        if (sent) await Order.findByIdAndUpdate(freshOrder._id, { failedEmailSentAt: new Date() });
                      } catch(e) { console.error('[Email][Expired] error:', e.message); }
                    });
                  } else {
                    setImmediate(() => _triggerFailedEmail(freshOrder));
                  }
                }
              }
            }

          } else {
            console.warn('[Track] paygomerch_api_key tidak dikonfigurasi — skip status check');
          }
        }
      } catch(trackErr) { console.error('[Track] status check error:', trackErr.message); }
    }

    res.json({ success: true, data: order });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/orders
router.post('/', async (req, res) => {
  try {
    // ── Optional Auth: isi req.user jika user sudah login (cookie / Bearer) ──
    // Tidak reject jika tidak ada token — hanya diperlukan untuk balance payment
    if (!req.user) {
      try {
        const jwt  = require('jsonwebtoken');
        const User = require('../models/User');
        const cookieToken  = req.cookies?.ramx_token || req.cookies?.ramx_admin_token;
        const bearerHeader = req.headers.authorization || '';
        const bearerToken  = bearerHeader.startsWith('Bearer ') ? bearerHeader.slice(7) : null;
        const rawToken = cookieToken || bearerToken;
        if (rawToken) {
          const decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
          const user    = await User.findById(decoded.id).select('-passwordHash');
          if (user && user.isActive) req.user = user;
        }
      } catch(_) { /* token invalid/expired — biarkan req.user tetap null */ }
    }

    const pm = (req.body.paymentMethod || '').toLowerCase();

    // ── Pembayaran via Saldo ──────────────────────────────────────
    if (pm === 'balance') {
      // Harus login
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Login diperlukan untuk pembayaran via saldo.' });
      }

      const User = require('../models/User');
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });

      const total = Number(req.body.total) || 0;

      // Cek kecukupan saldo
      if (user.balance < total) {
        const kurang = total - user.balance;
        return res.status(400).json({
          success: false,
          insufficientBalance: true,
          message:
            `Saldo tidak cukup. Saldo Anda: Rp ${user.balance.toLocaleString('id-ID')}, ` +
            `dibutuhkan: Rp ${total.toLocaleString('id-ID')} ` +
            `(kurang Rp ${kurang.toLocaleString('id-ID')}). ` +
            `Silakan top-up saldo terlebih dahulu atau gunakan metode pembayaran QRIS.`,
          currentBalance: user.balance,
          required: total,
          shortage: kurang,
        });
      }

      // Saldo cukup → potong saldo secara atomik
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id, balance: { $gte: total } },   // kondisi atomik: pastikan masih cukup
        { $inc: { balance: -total } },
        { new: true }
      );
      if (!updatedUser) {
        return res.status(400).json({
          success: false,
          insufficientBalance: true,
          message: 'Saldo tidak cukup. Silakan top-up terlebih dahulu atau gunakan QRIS.',
        });
      }

      // Buat order langsung dengan status 'paid'
      const order = await Order.create({
        ...req.body,
        userId:        user._id,
        status:        'paid',
        paidAt:        new Date(),
        paymentMethod: 'balance',
      });

      res.status(201).json({ success: true, data: order });

      // Notif Telegram admin
      setImmediate(() => _notifyAdminNewOrder(order, 'paid'));

      // Auto-fulfill langsung (kirim akun ke customer)
      setImmediate(() => autoFulfillOrder(order));

      return; // selesai, jangan lanjut ke blok di bawah
    }

    // ── Pembayaran selain saldo (QRIS, dll) ──────────────────────
    const order = await Order.create({
      ...req.body,
      userId: req.user?._id,
    });
    res.status(201).json({ success: true, data: order });

    // Notif Telegram ke admin — non-blocking
    setImmediate(() => _notifyAdminNewOrder(order, order.status || 'pending'));

    // Kirim pending email untuk balance payment (non-QRIS) — non-blocking
    // QRIS payment akan kirim email dari generate-qris setelah QRIS berhasil dibuat
    if (pm === 'balance' && order.customerEmail && !order.pendingEmailSentAt) {
      const item = order.items?.[0] || {};
      setImmediate(async () => {
        try {
          const sent = await sendPendingPaymentEmail({
            to:            order.customerEmail,
            orderId:       order.orderId,
            productName:   item.productName || order.productName || '',
            variantName:   item.variant     || order.variantName  || '',
            productPrice:  item.price       || order.subtotal     || order.total || 0,
            totalPayment:  order.total || 0,
            paymentMethod: order.paymentMethod || '',
            expiresAt:     null,
            productImage:  order.productImage || '',
            customerName:  order.customerName || '',
          });
          if (sent) {
            await Order.findByIdAndUpdate(order._id, { pendingEmailSentAt: new Date() });
          }
        } catch(emailErr) {
          console.error(`[Email][Pending Payment] TRX ${order.orderId} error:`, emailErr.message);
        }
      });
    }
  } catch(e) { res.status(400).json({ success: false, message: e.message }); }
});


// GET /api/orders/:orderId/result — publik, data NON-SENSITIF saja
// Credentials TIDAK dikembalikan di sini — gunakan /api/invoice/:orderId/protected-data
router.get('/:orderId/result', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId })
      .select('-transactionPin -pinFailedAttempts -pinLockedUntil -pinResendLockedUntil');
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    const isSuccessful = ['paid','completed','processing'].includes(order.status);
    let productImage = '';

    if (isSuccessful) {
      const Product = require('../models/Product');
      const productId = order.items?.[0]?.productId || order.productId;
      if (productId) {
        const product = await Product.findById(productId).lean();
        if (product) productImage = product.imageUrl || '';
      }
    }

    res.json({
      success: true,
      data: {
        status:        order.status,
        order,
        locked:        isSuccessful,   // credentials terkunci — fetch via /protected-data
        hasReview:     order.hasReview || false,
        productImage,
        // TIDAK ada: credentials, credentialNotes, termsAndConditions
      }
    });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/:orderId/generate-qris', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    const provider = await getActiveProvider();

    if (provider === 'gatepay') {
      // ── GatePay QRIS ──────────────────────────────────────────
      const cfg = await Config.findOne({ key: 'gatepay_api_key' });
      if (!cfg?.value) return res.status(400).json({ success: false, message: 'API Key GatePay belum diatur' });

      const payload = { amount: Number(order.total) };
      if (order.orderId) payload.order_id = order.orderId;
      const gpResult = await callGatePay('POST', '/api/qrisgatepay/v1/payments', payload, cfg.value, order.orderId);

      // Normalize response: GatePay → { data: { reference, qr_string, payment_link, ... } }
      const gpData = gpResult?.data || gpResult || {};
      const ref = gpData.reference || gpData.order_id || gpData.id || '';
      if (ref) {
        await Order.findByIdAndUpdate(order._id, { paymentRef: String(ref) });
      }

      // Map ke format yang kompatibel dengan frontend (qr_string, checkout_url)
      const normalizedData = {
        success: true,
        data: {
          transaction_id: ref,
          qr_string:      gpData.qr_string   || '',
          qr_url:         gpData.qr_url       || '',
          checkout_url:   gpData.payment_link  || gpData.checkout_url || '',
          amount:         gpData.amount        || order.total,
          reference:      ref,
        }
      };
      res.json({ success: true, data: normalizedData });

    } else {
      // ── PayGomerch QRIS (existing behavior) ───────────────────
      const cfg = await Config.findOne({ key: 'paygomerch_api_key' });
      if (!cfg?.value) return res.status(400).json({ success: false, message: 'Payment gateway belum dikonfigurasi' });

      const result = await callPayGomerch('/qris/generate', { amount: order.total }, cfg.value);

      if (result.body) {
        const pg = result.body?.data || result.body;
        const txId = pg?.transaction_id || pg?.id || '';
        if (txId) {
          await Order.findByIdAndUpdate(order._id, { paymentRef: String(txId) });
        }
        res.json({ success: true, data: result.body });
      } else {
        res.status(400).json({ success: false, message: 'Gagal membuat QRIS' });
        return;
      }
    }

    // Kirim pending email setelah QRIS berhasil dibuat — non-blocking, anti-duplicate
    if (order.customerEmail && !order.pendingEmailSentAt &&
        !SUCCESS_STATUSES.includes(order.status) &&
        !INACTIVE_STATUSES.includes(order.status)) {
      const item = order.items?.[0] || {};
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      setImmediate(async () => {
        try {
          const sent = await sendPendingPaymentEmail({
            to:            order.customerEmail,
            orderId:       order.orderId,
            productName:   item.productName || order.productName || '',
            variantName:   item.variant     || order.variantName  || '',
            productPrice:  item.price       || order.subtotal     || order.total || 0,
            totalPayment:  order.total || 0,
            paymentMethod: order.paymentMethod || 'QRIS',
            expiresAt,
            productImage:  order.productImage || '',
            customerName:  order.customerName || '',
          });
          if (sent) {
            await Order.findByIdAndUpdate(order._id, { pendingEmailSentAt: new Date() });
          }
        } catch(emailErr) {
          console.error(`[Email][Pending Payment] TRX ${order.orderId} QRIS error:`, emailErr.message);
        }
      });
    }
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});


// PUT /api/orders/:id/status — admin only
router.put('/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const TERMINAL_FAILED = ['failed','cancelled','cancel'];
    // Guard: jangan izinkan SUCCESS → FAILED
    const existing = await Order.findById(req.params.id).lean();
    if (existing && SUCCESS_STATUSES.includes(existing.status) && TERMINAL_FAILED.includes(status)) {
      return res.status(400).json({ success: false, message: 'Tidak dapat mengubah status sukses menjadi gagal.' });
    }

    const update = { status };
    if (status === 'paid')      update.paidAt      = new Date();
    if (status === 'completed') update.completedAt = new Date();

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    res.json({ success: true, data: order });

    // Trigger email gagal ketika admin set status ke failed/cancelled
    if (TERMINAL_FAILED.includes(status) && order.customerEmail && !order.failedEmailSentAt) {
      setImmediate(() => _triggerFailedEmail(order.toObject ? order.toObject() : order));
    }
    // Trigger autoFulfill ketika admin set paid
    if (status === 'paid') {
      setImmediate(() => autoFulfillOrder(order));
    }
  } catch(e) { res.status(400).json({ success: false, message: e.message }); }
});


// DELETE /api/orders/:id — admin only
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Order dihapus' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// Export router DAN autoFulfillOrder agar bisa dipanggil dari server.js webhook
module.exports = router;
module.exports.autoFulfillOrder = autoFulfillOrder;

