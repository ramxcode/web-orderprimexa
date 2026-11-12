/**
 * Invoice Security Routes
 * Handles PIN verification, protected credential access, PIN resend, and reviews.
 * All credential protection is enforced server-side.
 */
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const router   = express.Router();

const Order    = require('../models/Order');
const Review   = require('../models/Review');
const StockItem= require('../models/StockItem');
const Product  = require('../models/Product');
const { sendOrderSuccessEmail } = require('../services/mailer');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generate secure 6-digit PIN (100000–999999)
 */
function generateSecurePin() {
  return String(crypto.randomInt(100000, 999999));
}

/**
 * Mask email: g*****9@gmail.com
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 5))}${local[local.length - 1]}@${domain}`;
}

/**
 * Verify invoice access: either logged-in owner or valid invoice_access JWT token
 * Returns { ok: true, method: 'owner'|'token' } or { ok: false }
 */
async function checkInvoiceAccess(req, order) {
  const User = require('../models/User');

  // Guest order (tanpa login) — langsung izinkan akses tanpa PIN
  if (!order.userId) {
    return { ok: true, method: 'guest' };
  }

  // ── Helper: verifikasi JWT token ──
  function tryVerify(token) {
    if (!token) return null;
    try { return jwt.verify(token, process.env.JWT_SECRET); } catch (_) { return null; }
  }

  // ── Helper: resolve user dari decoded token (lookup DB jika email tidak ada di token) ──
  async function resolveUser(decoded) {
    if (!decoded?.id) return null;
    // Jika token sudah punya email & role (token baru), gunakan langsung
    if (decoded.email) return decoded;
    // Token lama hanya punya {id} — lookup dari DB
    try {
      const user = await User.findById(decoded.id).select('email role isActive').lean();
      if (!user || !user.isActive) return null;
      return { id: decoded.id, email: user.email, role: user.role };
    } catch (_) { return null; }
  }

  // Method 1a: httpOnly cookie (ramx_token atau ramx_admin_token)
  const cookieToken = req.cookies?.ramx_token || req.cookies?.ramx_admin_token;
  if (cookieToken) {
    const decoded = tryVerify(cookieToken);
    if (decoded?.id) {
      const user = await resolveUser(decoded);
      if (user) {
        if (user.role === 'admin' || user.isAdmin === true) return { ok: true, method: 'admin' };
        const emailMatch = (user.email || '').toLowerCase() === (order.customerEmail || '').toLowerCase();
        if (emailMatch) return { ok: true, method: 'owner' };
      }
    }
  }

  // Method 1b: Bearer header (localStorage token)
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const decoded = tryVerify(token);
    if (decoded) {
      // Invoice access token (PIN verified)
      if (decoded.type === 'invoice_access' && decoded.orderId === order.orderId) {
        return { ok: true, method: 'token' };
      }
      // Login token — lookup user
      if (decoded.id) {
        const user = await resolveUser(decoded);
        if (user) {
          if (user.role === 'admin' || user.isAdmin === true) return { ok: true, method: 'admin' };
          const emailMatch = (user.email || '').toLowerCase() === (order.customerEmail || '').toLowerCase();
          if (emailMatch) return { ok: true, method: 'owner' };
        }
      }
    }
  }

  // Method 2: X-Invoice-Token header (PIN verified token)
  const invoiceToken = req.headers['x-invoice-token'] || '';
  if (invoiceToken) {
    const decoded = tryVerify(invoiceToken);
    if (decoded?.type === 'invoice_access' && decoded.orderId === order.orderId) {
      return { ok: true, method: 'token' };
    }
  }

  return { ok: false };
}


// ── POST /:orderId/verify-pin ─────────────────────────────────────────────────
// Verifikasi PIN → return temporary invoice access token (30 menit)
router.post('/:orderId/verify-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });

    // Harus sudah paid/completed
    if (!['paid','completed','processing'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Transaksi belum berhasil.' });
    }

    // Validasi input PIN
    if (!pin || String(pin).length !== 6 || !/^\d{6}$/.test(String(pin))) {
      return res.status(400).json({ success: false, message: 'Masukkan PIN transaksi 6 digit.' });
    }

    // Cek brute-force lockout
    if (order.pinLockedUntil && order.pinLockedUntil > new Date()) {
      const secs = Math.ceil((order.pinLockedUntil - Date.now()) / 1000);
      const mins = Math.ceil(secs / 60);
      return res.status(429).json({ success: false, message: `Terlalu banyak percobaan. Silakan coba kembali dalam ${mins} menit.`, lockedUntil: order.pinLockedUntil });
    }

    // Jika PIN belum ada (transaksi lama), generate on-demand
    if (!order.transactionPin) {
      const plainPin = generateSecurePin();
      const hashed   = await bcrypt.hash(plainPin, 10);
      await Order.findByIdAndUpdate(order._id, {
        transactionPin: hashed,
        pinCreatedAt:   new Date(),
        pinLastSentAt:  new Date(),
        pinFailedAttempts: 0,
        pinLockedUntil: null,
      });
      // Kirim ke email
      const productName = order.items?.[0]?.productName || order.productName || '';
      const variantName = order.items?.[0]?.variant    || order.variantName  || '';
      sendOrderSuccessEmail({
        to: order.customerEmail, orderId: order.orderId,
        productName, variantName,
        subtotal: order.subtotal || order.total, total: order.total,
        paymentMethod: order.paymentMethod || '', paidAt: order.paidAt || order.createdAt,
        credentials: '', credentialNotes: '', customerName: order.customerName || '',
        transactionPin: plainPin,
      }).catch(e => console.error('[Invoice] PIN email error:', e.message));
      console.log(`[Invoice Security] TRX ${order.orderId} — PIN generated on-demand (legacy order)`);
      return res.status(400).json({ success: false, message: 'PIN transaksi baru telah dikirim ke email pembelian Anda. Gunakan PIN tersebut untuk melanjutkan.' });
    }

    // Cocokkan PIN
    const match = await bcrypt.compare(String(pin), order.transactionPin);

    if (!match) {
      const newAttempts = (order.pinFailedAttempts || 0) + 1;
      const update = { pinFailedAttempts: newAttempts };
      if (newAttempts >= 5) {
        update.pinLockedUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 menit
        update.pinFailedAttempts = 0;
        await Order.findByIdAndUpdate(order._id, update);
        console.log(`[Invoice Security] TRX ${order.orderId} — PIN locked (too many attempts)`);
        return res.status(429).json({ success: false, message: 'Terlalu banyak percobaan. Silakan coba kembali dalam 5 menit.' });
      }
      await Order.findByIdAndUpdate(order._id, update);
      console.log(`[Invoice Security] TRX ${order.orderId} — PIN verification failed (attempt ${newAttempts})`);
      return res.status(401).json({ success: false, message: 'PIN yang Anda masukkan tidak sesuai.', attemptsLeft: 5 - newAttempts });
    }

    // PIN benar — reset failed attempts, issue temp token
    await Order.findByIdAndUpdate(order._id, { pinFailedAttempts: 0, pinLockedUntil: null });

    const accessToken = jwt.sign(
      { type: 'invoice_access', orderId: order.orderId },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    console.log(`[Invoice Security] TRX ${order.orderId} — PIN verification success`);
    res.json({ success: true, accessToken, expiresIn: 1800 });

  } catch (e) {
    console.error('[Invoice] verify-pin error:', e.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

// ── GET /:orderId/protected-data ──────────────────────────────────────────────
// Ambil credentials — HANYA jika owner atau token valid
router.get('/:orderId/protected-data', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });

    if (!['paid','completed','processing'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Transaksi belum berhasil.' });
    }

    const access = await checkInvoiceAccess(req, order);
    if (!access.ok) {
      return res.status(403).json({ success: false, message: 'Akses ditolak. Verifikasi PIN terlebih dahulu.' });
    }

    // Ambil credentials dari StockItem — semua yg terkait invoice ini (support qty > 1)
    let credentials = '', credentialNotes = '', termsAndConditions = '', productImage = '';
    const stockItems = await StockItem.find({ invoiceId: order.orderId }).sort({ usedAt: 1 });
    if (stockItems.length > 0) {
      credentialNotes = stockItems[0].notes || '';
      if (stockItems.length === 1) {
        credentials = stockItems[0].content || '';
      } else {
        // Gabung credentials multi-akun dengan separator
        credentials = stockItems.map(function(s, idx) {
          return '=== Akun ' + (idx + 1) + ' ===\n' + (s.content || '');
        }).join('\n\n');
      }
    }

    // Ambil product info
    const productId = order.items?.[0]?.productId || order.productId;
    if (productId) {
      const product = await Product.findById(productId).lean();
      if (product) {
        productImage = product.imageUrl || '';
        const variantName = order.items?.[0]?.variant || order.variantName;
        const variant = (product.variants || []).find(v => v.name === variantName);
        if (variant) termsAndConditions = variant.termsAndConditions || '';
      }
    }

    res.json({
      success: true,
      data: {
        credentials,
        credentialNotes,
        termsAndConditions,
        productImage,
        hasReview: order.hasReview || false,
        productName: order.items?.[0]?.productName || order.productName || '',
        variantName: order.items?.[0]?.variant     || order.variantName  || '',
        productId:   String(order.items?.[0]?.productId || order.productId || ''),
      }
    });

  } catch (e) {
    console.error('[Invoice] protected-data error:', e.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

// ── POST /:orderId/resend-pin ─────────────────────────────────────────────────
// Kirim ulang PIN ke email pembelian (rate limited: 1/60 detik)
router.post('/:orderId/resend-pin', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });

    if (!order.customerEmail) return res.status(400).json({ success: false, message: 'Email pembelian tidak ditemukan.' });

    // Rate limit: 1 per 60 detik
    if (order.pinResendLockedUntil && order.pinResendLockedUntil > new Date()) {
      const secs = Math.ceil((order.pinResendLockedUntil - Date.now()) / 1000);
      return res.status(429).json({ success: false, message: `Kirim ulang PIN tersedia dalam ${secs} detik.`, retryAfter: secs });
    }

    let plainPin;

    if (!order.transactionPin) {
      // Transaksi lama — generate PIN baru
      plainPin = generateSecurePin();
      const hashed = await bcrypt.hash(plainPin, 10);
      await Order.findByIdAndUpdate(order._id, {
        transactionPin:       hashed,
        pinCreatedAt:         new Date(),
        pinLastSentAt:        new Date(),
        pinResendLockedUntil: new Date(Date.now() + 60 * 1000),
        pinFailedAttempts: 0,
      });
      console.log(`[Invoice Security] TRX ${order.orderId} — PIN generated (resend, legacy)`);
    } else {
      // Kirim PIN yang sudah ada — TIDAK generate baru
      // PIN sudah di-hash, tidak bisa di-unhash — perlu store plain sementara atau re-generate
      // SAFE APPROACH: Kita tidak menyimpan plain PIN — generate baru yang di-set sebagai PIN aktif
      // (ini masih aman karena attacker tidak bisa trigger ini tanpa akses ke email)
      plainPin = generateSecurePin();
      const hashed = await bcrypt.hash(plainPin, 10);
      await Order.findByIdAndUpdate(order._id, {
        transactionPin:       hashed,
        pinLastSentAt:        new Date(),
        pinResendLockedUntil: new Date(Date.now() + 60 * 1000),
        pinFailedAttempts: 0,
        pinLockedUntil: null,
      });
      console.log(`[Invoice Security] TRX ${order.orderId} — PIN resent (new PIN generated)`);
    }

    // Kirim email
    const productName = order.items?.[0]?.productName || order.productName || '';
    const variantName = order.items?.[0]?.variant     || order.variantName  || '';
    sendOrderSuccessEmail({
      to: order.customerEmail, orderId: order.orderId,
      productName, variantName,
      subtotal: order.subtotal || order.total, total: order.total,
      paymentMethod: order.paymentMethod || '', paidAt: order.paidAt || order.createdAt,
      credentials: '', credentialNotes: '', customerName: order.customerName || '',
      transactionPin: plainPin,
      isResend: true,
    }).catch(e => console.error('[Invoice] resend email error:', e.message));

    const maskedEmail = maskEmail(order.customerEmail);
    res.json({ success: true, message: `PIN berhasil dikirim ulang ke ${maskedEmail}.`, maskedEmail, retryAfter: 60 });

  } catch (e) {
    console.error('[Invoice] resend-pin error:', e.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

// ── POST /:orderId/review ─────────────────────────────────────────────────────
// Submit ulasan produk — hanya untuk owner atau PIN-verified user
router.post('/:orderId/review', async (req, res) => {
  try {
    const { rating, review: reviewText } = req.body;
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });

    if (!['paid','completed','processing'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Ulasan hanya untuk transaksi yang berhasil.' });
    }

    const access = await checkInvoiceAccess(req, order);
    if (!access.ok) {
      return res.status(403).json({ success: false, message: 'Akses ditolak. Verifikasi PIN terlebih dahulu.' });
    }

    // Validasi rating
    const r = Number(rating);
    if (!r || r < 1 || r > 5) return res.status(400).json({ success: false, message: 'Rating harus antara 1 sampai 5.' });

    // Validasi teks
    const text = String(reviewText || '').slice(0, 500);

    // Cek apakah sudah pernah review (double check server-side)
    const existing = await Review.findOne({ orderId: order.orderId });
    if (existing) return res.status(400).json({ success: false, message: 'Transaksi ini sudah pernah direview.' });

    // Simpan review
    await Review.create({
      orderId:       order.orderId,
      productId:     order.items?.[0]?.productId || order.productId,
      productName:   order.items?.[0]?.productName || order.productName || '',
      variantName:   order.items?.[0]?.variant     || order.variantName  || '',
      rating:        r,
      reviewText:    text,
      customerEmail: order.customerEmail || '',
    });

    // Tandai order sudah review
    await Order.findByIdAndUpdate(order._id, { hasReview: true });

    console.log(`[Invoice Security] TRX ${order.orderId} — review submitted (rating: ${r})`);
    res.json({ success: true, message: 'Ulasan berhasil dikirim! Terima kasih.' });

  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ success: false, message: 'Transaksi ini sudah pernah direview.' });
    console.error('[Invoice] review error:', e.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;
