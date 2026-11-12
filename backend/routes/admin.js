const router    = require('express').Router();
const mongoose  = require('mongoose');
const User      = require('../models/User');
const Order     = require('../models/Order');
const Product   = require('../models/Product');
const Category  = require('../models/Category');
const PaymentMethod = require('../models/PaymentMethod');
const auth      = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// Seed default payment methods on first load
PaymentMethod.seedDefaults().catch(() => {});

// ── Payment Methods CRUD ──────────────────────────────────────
router.get('/payment-methods', auth, adminOnly, async (req, res) => {
  try {
    const methods = await PaymentMethod.find().sort({ sortOrder: 1, createdAt: 1 });
    res.json({ success: true, data: methods });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/payment-methods', auth, adminOnly, async (req, res) => {
  try {
    const method = await PaymentMethod.create(req.body);
    res.status(201).json({ success: true, data: method });
  } catch(e) { res.status(400).json({ success: false, message: e.message }); }
});

router.put('/payment-methods/:id', auth, adminOnly, async (req, res) => {
  try {
    const method = await PaymentMethod.findByIdAndUpdate(
      req.params.id, { $set: req.body }, { new: true, runValidators: true }
    );
    if (!method) return res.status(404).json({ success: false, message: 'Metode tidak ditemukan' });
    res.json({ success: true, data: method });
  } catch(e) { res.status(400).json({ success: false, message: e.message }); }
});

router.put('/payment-methods/:id/toggle', auth, adminOnly, async (req, res) => {
  try {
    const method = await PaymentMethod.findByIdAndUpdate(
      req.params.id, { $set: { active: req.body.active } }, { new: true }
    );
    if (!method) return res.status(404).json({ success: false, message: 'Metode tidak ditemukan' });
    res.json({ success: true, data: method });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/payment-methods/:id', auth, adminOnly, async (req, res) => {
  try {
    await PaymentMethod.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Metode pembayaran dihapus' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Orders status update ──────────────────────────────────────
router.put('/orders/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const param    = req.params.id;
    const update   = { $set: { status: req.body.status } };
    let order;
    // Coba by MongoDB _id terlebih dahulu, lalu fallback ke orderId (RX...)
    if (mongoose.Types.ObjectId.isValid(param)) {
      order = await Order.findByIdAndUpdate(param, update, { new: true });
    }
    if (!order) {
      order = await Order.findOneAndUpdate({ orderId: param }, update, { new: true });
    }
    if (!order) return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    res.json({ success: true, data: order });
  } catch(e) { res.status(400).json({ success: false, message: e.message }); }
});


// ── Dashboard Stats ──────────────────────────────────────────
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalOrders, totalProducts, recentOrders] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'name email'),
    ]);

    const revenue = await Order.aggregate([
      { $match: { status: { $in: ['paid','completed'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers, totalOrders, totalProducts,
        revenue: revenue[0]?.total || 0,
        recentOrders,
      }
    });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Users ────────────────────────────────────────────────────
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, q } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (q) filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(Number(limit)).skip((Number(page)-1)*Number(limit));
    const total = await User.countDocuments(filter);

    // Attach orderCount per user (efficient: one aggregate for all users)
    const userIds = users.map(u => u._id);
    const orderCounts = await Order.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    orderCounts.forEach(r => { countMap[r._id.toString()] = r.count; });

    const data = users.map(u => {
      const obj = u.toJSON();
      obj.orderCount = countMap[u._id.toString()] || 0;
      return obj;
    });

    res.json({ success: true, data, total });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Get single user ──────────────────────────────────────────
router.get('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    const [orderCount, completedOrders, totalSpent] = await Promise.all([
      Order.countDocuments({ userId: user._id }),
      Order.countDocuments({ userId: user._id, status: { $in: ['completed','paid'] } }),
      Order.aggregate([
        { $match: { userId: user._id, status: { $in: ['completed','paid'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
    ]);
    const recentOrders = await Order.find({ userId: user._id })
      .sort({ createdAt: -1 }).limit(5)
      .populate('productId', 'name');
    res.json({
      success: true,
      data: {
        ...user.toJSON(),
        orderCount,
        completedOrders,
        totalSpent: totalSpent[0]?.total || 0,
        recentOrders,
      }
    });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { password, confirmPassword, ...updateData } = req.body;

    // Hash password baru jika diberikan
    if (password) {
      if (password.length < 6) return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
      const bcrypt = require('bcryptjs');
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    res.json({ success: true, data: user });
  } catch(e) { res.status(400).json({ success: false, message: e.message }); }
});

router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ success: false, message: 'Tidak bisa hapus akun sendiri' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User dihapus' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Team Management (admin & staff) ──────────────────────────
router.get('/team/users', auth, adminOnly, async (req, res) => {
  try {
    const { q, role, status } = req.query;
    const filter = { role: { $in: ['admin', 'staff'] } };
    if (role && ['admin','staff'].includes(role)) filter.role = role;
    if (q) filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
    if (status === 'active')   filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/team/users', auth, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role, isActive } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    if (!['admin','staff'].includes(role))
      return res.status(400).json({ success: false, message: 'Role tidak valid. Gunakan admin atau staff' });
    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password minimal 8 karakter' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, passwordHash, role,
      isActive: isActive !== false,
      isVerified: true,
    });
    res.status(201).json({ success: true, data: user });
  } catch(e) { res.status(400).json({ success: false, message: e.message }); }
});

router.put('/team/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    if (password) {
      if (password.length < 8) return res.status(400).json({ success: false, message: 'Password minimal 8 karakter' });
      const bcrypt = require('bcryptjs');
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    res.json({ success: true, data: user });
  } catch(e) { res.status(400).json({ success: false, message: e.message }); }
});

router.delete('/team/users/:id', auth, adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'Tidak bisa hapus akun sendiri' });
    const user = await User.findById(req.params.id);
    if (!user || !['admin','staff'].includes(user.role))
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Pengguna dihapus' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});


router.get('/categories', async (req, res) => {
  try {
    const cats = await Category.find().sort({ sortOrder: 1 });
    res.json({ success: true, data: cats });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/categories', auth, adminOnly, async (req, res) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json({ success: true, data: cat });
  } catch(e) { res.status(400).json({ success: false, message: e.message }); }
});

router.put('/categories/:id', auth, adminOnly, async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: cat });
  } catch(e) { res.status(400).json({ success: false, message: e.message }); }
});

router.delete('/categories/:id', auth, adminOnly, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Kategori dihapus' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Webhook Telegram (untuk mode webhook) ───────────────────
router.post('/telegram/webhook', (req, res) => {
  const { getBot } = require('../services/telegramBot');
  const bot = getBot();
  if (bot) bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ══════════════════════════════════════════════════════════════
// PAYMENT GATEWAY — PayGomerch Proxy
// ══════════════════════════════════════════════════════════════
const https  = require('https');
const Config = require('../models/Config');
const PAYGOMERCH_BASE = 'v1-api.pay-gomerch.web.id';

// Helper: call GatePay API
function callPayGomerch(path, body, apiKey) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: PAYGOMERCH_BASE,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'Content-Length': Buffer.byteLength(payload),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: { success: false, raw: data } }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// GET /api/admin/payment/settings — ambil API key
router.get('/payment/settings', auth, adminOnly, async (req, res) => {
  try {
    const cfg = await Config.findOne({ key: 'paygomerch_api_key' });
    const wh  = await Config.findOne({ key: 'paygomerch_webhook_secret' });
    const apiKey = cfg?.value || '';
    // Mask key untuk display
    const masked = apiKey ? apiKey.slice(0,6) + '•'.repeat(Math.max(0,apiKey.length-10)) + apiKey.slice(-4) : '';
    res.json({ success: true, data: { apiKey: masked, hasKey: !!apiKey, webhookSecret: wh?.value || '' } });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/admin/payment/settings — simpan API key & webhook secret
router.put('/payment/settings', auth, adminOnly, async (req, res) => {
  try {
    const { apiKey, webhookSecret } = req.body;
    if (apiKey !== undefined) {
      await Config.findOneAndUpdate({ key: 'paygomerch_api_key' }, { value: apiKey }, { upsert: true });
    }
    if (webhookSecret !== undefined) {
      await Config.findOneAndUpdate({ key: 'paygomerch_webhook_secret' }, { value: webhookSecret }, { upsert: true });
    }
    res.json({ success: true, message: 'Pengaturan payment gateway disimpan' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/admin/payment/test — test koneksi
router.post('/payment/test', auth, adminOnly, async (req, res) => {
  try {
    const cfg = await Config.findOne({ key: 'paygomerch_api_key' });
    if (!cfg?.value) return res.status(400).json({ success: false, message: 'API Key belum diatur' });
    const result = await callPayGomerch('/transactions', {}, cfg.value);
    if (result.status === 200 && result.body.success) {
      res.json({ success: true, message: 'Koneksi berhasil! API Key valid.' });
    } else {
      res.status(400).json({ success: false, message: 'API Key tidak valid atau gagal konek.' });
    }
  } catch(e) { res.status(500).json({ success: false, message: 'Gagal konek ke PayGomerch: ' + e.message }); }
});

// POST /api/admin/payment/transactions — daftar transaksi (dari DB lokal)
router.post('/payment/transactions', auth, adminOnly, async (req, res) => {
  try {
    const cfg = await Config.findOne({ key: 'paygomerch_api_key' });
    if (!cfg?.value) return res.status(400).json({ success: false, message: 'API Key belum diatur. Silakan atur di Pengaturan Payment.' });
    const result = await callPayGomerch('/transactions', req.body || {}, cfg.value);
    res.status(result.status).json(result.body);
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/admin/payment/qris/generate — POST /api/admin/payment/qris/generate
router.post('/payment/qris/generate', auth, adminOnly, async (req, res) => {
  try {
    const cfg = await Config.findOne({ key: 'paygomerch_api_key' });
    if (!cfg?.value) return res.status(400).json({ success: false, message: 'API Key belum diatur' });
    const result = await callPayGomerch('/qris/generate', req.body, cfg.value);
    res.status(result.status).json(result.body);
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/admin/payment/qris/status — POST /api/admin/payment/qris/status
router.post('/payment/qris/status', auth, adminOnly, async (req, res) => {
  try {
    const cfg = await Config.findOne({ key: 'paygomerch_api_key' });
    if (!cfg?.value) return res.status(400).json({ success: false, message: 'API Key belum diatur' });
    const result = await callPayGomerch('/qris/status', req.body, cfg.value);
    res.status(result.status).json(result.body);
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/admin/payment/qris/cancel — POST /api/admin/payment/qris/cancel
router.post('/payment/qris/cancel', auth, adminOnly, async (req, res) => {
  try {
    const cfg = await Config.findOne({ key: 'paygomerch_api_key' });
    if (!cfg?.value) return res.status(400).json({ success: false, message: 'API Key belum diatur' });

    // Ambil reference dari body
    let body = req.body;
    let ref = null;
    if (typeof body === 'string') {
      ref = body;
    } else if (body && typeof body === 'object') {
      ref = body.reference || body.transaction_id || body.orderId || body.id || null;
    }

    // Panggil PayGomerch cancel (opsional, tidak block jika gagal)
    let pgResult = null;
    if (ref) {
      try {
        pgResult = await callPayGomerch('/qris/cancel', body, cfg.value);
      } catch(_) {}
    }

    // Update status order lokal ke 'cancelled'
    const txId = ref || (body && (body.transaction_id || body.orderId));
    if (txId) {
      const mongoose = require('mongoose');
      const update = { $set: { status: 'cancelled' } };
      if (mongoose.Types.ObjectId.isValid(txId)) {
        await Order.findByIdAndUpdate(txId, update).catch(() => {});
      } else {
        await Order.findOneAndUpdate({ $or: [{ orderId: txId }, { paymentRef: txId }] }, update).catch(() => {});
      }
    }

    const pgBody = pgResult?.body || {};
    res.json({ success: true, message: 'Transaksi berhasil dibatalkan', data: pgBody });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/admin/payment/active-provider — provider aktif (paygomerch atau gatepay)
router.get('/payment/active-provider', async (req, res) => {
  try {
    const cfg = await Config.findOne({ key: 'active_payment_provider' });
    res.json({ success: true, provider: cfg?.value || 'paygomerch' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/admin/payment/active-provider — simpan provider aktif
router.put('/payment/active-provider', auth, adminOnly, async (req, res) => {
  try {
    const { provider } = req.body;
    if (!provider || !['paygomerch','gatepay'].includes(provider)) {
      return res.status(400).json({ success: false, message: 'Provider tidak valid' });
    }
    await Config.findOneAndUpdate(
      { key: 'active_payment_provider' },
      { key: 'active_payment_provider', value: provider },
      { upsert: true }
    );
    res.json({ success: true, message: 'Provider aktif diubah ke ' + provider });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/admin/payment/webhook — receive PayGomerch webhook
router.post('/payment/webhook', async (req, res) => {
  try {
    const crypto = require('crypto');
    const cfg    = await Config.findOne({ key: 'paygomerch_api_key' });
    const apiKey = cfg?.value || '';
    const sig    = req.headers['x-signature'] || '';
    const payload = JSON.stringify(req.body);
    const expected = crypto.createHmac('sha256', apiKey).update(payload).digest('hex');
    if (apiKey && sig !== expected) return res.status(401).json({ success: false, message: 'Invalid signature' });
    const { transaction } = req.body;
    if (transaction?.status === 'settlement') {
      // TODO: update order status jika ada
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Database Overview (Realtime MongoDB Stats) ───────────────
router.get('/database', auth, adminOnly, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) return res.status(503).json({ success: false, message: 'Database belum terhubung' });

    // Ambil dbStats dan daftar koleksi secara paralel
    const [dbStats, collNames] = await Promise.all([
      db.command({ dbStats: 1, scale: 1 }),
      db.listCollections().toArray(),
    ]);

    // Ambil stats tiap koleksi (paralel, max 20 collection)
    const collStats = await Promise.all(
      collNames.slice(0, 20).map(async (col) => {
        try {
          const s = await db.command({ collStats: col.name, scale: 1 });
          return {
            name:       col.name,
            count:      s.count      || 0,
            size:       s.size       || 0,
            avgObjSize: s.avgObjSize || 0,
          };
        } catch { return { name: col.name, count: 0, size: 0, avgObjSize: 0 }; }
      })
    );

    // Sort: yang punya dokumen lebih banyak di atas, lalu yang kosong di bawah
    collStats.sort((a, b) => b.count - a.count);

    // Ambil versi MongoDB
    let mongoVersion = 'Atlas Cloud';
    try {
      const buildInfo = await db.command({ buildInfo: 1 });
      mongoVersion = buildInfo.version || 'Atlas Cloud';
    } catch {}

    res.json({
      success:        true,
      status:         'connected',
      storageSize:    dbStats.storageSize || dbStats.dataSize || 0,
      totalDocuments: dbStats.objects     || 0,
      version:        mongoVersion,
      collections:    collStats,
    });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

/* ── GET /api/admin/analytics ─────────────────────────────────── */
router.get('/analytics', auth, adminOnly, async (req, res) => {
  try {
    const { period = 'year', from, to } = req.query;
    const now = new Date();
    let startDate, endDate = new Date();
    switch (period) {
      case 'today':     startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case 'yesterday': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                        endDate   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, -1); break;
      case 'week':      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
      case 'month':     startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'year':      startDate = new Date(now.getFullYear(), 0, 1); break;
      case 'custom':    startDate = new Date(from); endDate = new Date(to); break;
      default:          startDate = new Date(now.getFullYear(), 0, 1);
    }
    const match = { createdAt: { $gte: startDate, $lte: endDate }, status: { $in: ['paid','completed'] } };
    const [summary, byHour] = await Promise.all([
      Order.aggregate([{ $match: match }, { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } }]),
      Order.aggregate([{ $match: { createdAt: { $gte: startDate, $lte: endDate } } }, { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } }]),
    ]);
    const hourly = Array(24).fill(0);
    byHour.forEach(h => { if (h._id >= 0 && h._id < 24) hourly[h._id] = h.count; });
    res.json({ success: true, data: { revenue: summary[0]?.revenue || 0, profit: summary[0]?.revenue || 0, orders: summary[0]?.count || 0, hourly } });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

/* ── STOCK ITEMS CRUD ─────────────────────────────────────────── */
const StockItem = require('../models/StockItem');

router.get('/stock-items', auth, adminOnly, async (req, res) => {
  try {
    const { productId, variantId, status, q, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (productId) filter.productId = productId;
    if (variantId) filter.variantId = variantId;
    if (status)    filter.status    = status;
    if (q)         filter.content   = { $regex: q, $options: 'i' };
    const [data, total] = await Promise.all([
      StockItem.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit)).populate('productId','name variants'),
      StockItem.countDocuments(filter),
    ]);
    // Resolve variantName dari embedded variants (bukan separate collection)
    const enriched = data.map(item => {
      const obj = item.toObject();
      if (item.variantId && item.productId && item.productId.variants) {
        const v = item.productId.variants.find(
          vv => vv._id && vv._id.toString() === item.variantId.toString()
        );
        if (v) obj.variantId = { _id: v._id, name: v.name };
      }
      // Hapus array variants dari productId agar response tidak membengkak
      if (obj.productId && obj.productId.variants) delete obj.productId.variants;
      return obj;
    });
    res.json({ success: true, data: enriched, total });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/stock-items', auth, adminOnly, async (req, res) => {
  try {
    const { productId, variantId, content, notes, expiredAt } = req.body;
    // Support bulk insert (array of content lines)
    const lines = Array.isArray(content) ? content : String(content).split('\n').map(s=>s.trim()).filter(Boolean);
    const docs  = lines.map(c => ({ productId, variantId: variantId || undefined, content: c, notes: notes || '', expiredAt: expiredAt || undefined }));
    const created = await StockItem.insertMany(docs);

    // Sync Product.variants[].stock dengan jumlah StockItem tersedia
    try {
      if (variantId) {
        // Hitung total StockItem available untuk varian ini
        const availableCount = await StockItem.countDocuments({ variantId, status: 'available' });
        await Product.updateOne(
          { 'variants._id': variantId },
          { $set: { 'variants.$.stock': availableCount } }
        );
      }
    } catch(syncErr) { /* sync gagal tidak batalkan simpan */ }

    res.json({ success: true, message: `${created.length} item stok berhasil ditambahkan`, data: created });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/stock-items/:id', auth, adminOnly, async (req, res) => {
  try {
    const item = await StockItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item tidak ditemukan' });
    res.json({ success: true, data: item });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/stock-items/:id', auth, adminOnly, async (req, res) => {
  try {
    await StockItem.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Item stok dihapus' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/stock-items/bulk-delete', auth, adminOnly, async (req, res) => {
  try {
    const { ids } = req.body;
    await StockItem.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${ids.length} item dihapus` });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
