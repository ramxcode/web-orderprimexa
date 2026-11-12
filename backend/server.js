// Muat dua .env: backend/.env (MONGODB_URI, dll) + root .env (USE_TELEGRAF_BOT, TELEGRAM_BOT_TOKEN, dll)
const _path = require('path');
require('dotenv').config({ path: _path.resolve(__dirname, '.env') });                       // backend/.env — prioritas utama
require('dotenv').config({ path: _path.resolve(__dirname, '../.env'), override: false });   // root .env   — tambahan, tidak override
const express      = require('express');
const cors         = require('cors');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const connectDB    = require('./config/db');
const { initBot }  = require('./services/telegramBot');


const app = express();

// ── Trust Proxy ───────────────────────────────────────────────
// Diperlukan agar express-rate-limit bekerja benar saat
// request masuk lewat proxy (server-frontend.js)
app.set('trust proxy', 1);

// ── Connect DB ───────────────────────────────────────────────
connectDB();

// ── Telegram Bot ─────────────────────────────────────────────
// Jika USE_TELEGRAF_BOT=true → jalankan Telegraf bot menyatu dengan backend.
// Jika USE_TELEGRAF_BOT != true → gunakan bot lama (node-telegram-bot-api).
if (process.env.USE_TELEGRAF_BOT === 'true') {
  // Tunda 1.5 detik agar MongoDB selesai terkoneksi sebelum bot init
  setTimeout(() => {
    require('../telegram/launcher')
      .startTelegrafBot()
      .catch(err => console.error('[TgBot] Gagal start:', err.message));
  }, 1500);
} else {
  initBot();
}

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: function(origin, cb) {
    // Development: izinkan semua origin
    if (process.env.NODE_ENV !== 'production') return cb(null, true);
    // Production: hanya izinkan FRONTEND_URL
    const allowed = (process.env.FRONTEND_URL || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error('CORS tidak diizinkan: ' + origin));
  },
  credentials: true,
}));

// ── Security Headers ──────────────────────────────────────────
app.use((req, res, next) => {
  // Cegah clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Cegah MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Legacy XSS protection (browser lama)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Batasi akses browser API sensitif
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  // Referrer hanya dalam domain
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Content Security Policy — mitigasi XSS, batasi sumber script/style/gambar
  const isDev = process.env.NODE_ENV !== 'production';
  const cspDirectives = [
    "default-src 'self'",
    // script: izinkan 'self' + inline (dibutuhkan halaman existing) + CDN yang dipakai
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://kit.fontawesome.com",
    // style: izinkan 'self' + inline + CDN
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com https://ka-f.fontawesome.com",
    // font
    "font-src 'self' https://fonts.gstatic.com https://ka-f.fontawesome.com https://cdnjs.cloudflare.com data:",
    // gambar: self + data URL + https
    "img-src 'self' data: https:",
    // koneksi API: self + dev tunnel
    isDev
      ? "connect-src 'self' https: wss:"
      : "connect-src 'self'",
    // frame: tidak ada
    "frame-src 'none'",
    // object/embed: tidak ada
    "object-src 'none'",
    // base-uri: hanya self
    "base-uri 'self'",
    // form action: hanya self
    "form-action 'self'",
  ].join('; ');
  res.setHeader('Content-Security-Policy', cspDirectives);
  next();
});



app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Diperlukan untuk membaca httpOnly cookies dari request

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}


// ── Rate Limiting ─────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { success: false, message: 'Terlalu banyak request' } });
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // max 20 percobaan login per 15 menit per IP
  skip: (req) => req.method === 'GET', // hanya skip GET, POST/PUT/DELETE tetap di-limit
  message: { success: false, message: 'Terlalu banyak percobaan, coba lagi dalam 15 menit' }
});
// Rate limiter ketat khusus untuk POST /api/auth/login (anti brute-force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 menit
  max: 10,                    // max 10 percobaan login per IP
  skipSuccessfulRequests: true, // login sukses tidak dihitung
  message: { success: false, message: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);
// Terapkan loginLimiter setelah authLimiter agar yang lolos authLimiter masih di-check loginLimiter
app.post('/api/auth/login', loginLimiter);


// ── CSRF Protection ───────────────────────────────────────────
// Validasi Origin/Referer untuk semua request admin yang mengubah data.
// csurf sudah deprecated — gunakan Origin header check yang lebih sederhana.
// Cookie SameSite=Lax sudah melindungi browser modern, ini lapisan tambahan
// untuk edge case (browser lama, native form POST tanpa JS).
const csrfProtection = (req, res, next) => {
  // Hanya periksa state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) return next();

  // Di development, skip validasi origin
  if (process.env.NODE_ENV !== 'production') return next();

  const origin  = req.headers.origin || '';
  const referer = req.headers.referer || '';
  const allowed = (process.env.FRONTEND_URL || '').split(',').map(s => s.trim()).filter(Boolean);

  // Jika tidak ada FRONTEND_URL di env, skip (konfigurasi belum diset)
  if (allowed.length === 0) return next();

  const isAllowed = allowed.some(url => origin.startsWith(url) || referer.startsWith(url));
  if (!isAllowed) {
    return res.status(403).json({ success: false, message: 'CSRF: Origin tidak diizinkan' });
  }
  next();
};

// ── Honeypot / Attack Trap ────────────────────────────────────
// Deteksi DDoS, port scan, SQLi, XSS, path traversal, env probe, dll.
// Kirim notif Telegram ke admin dan balas dengan decoy response.
app.use(require('./middleware/honeypot'));

// ── Routes ────────────────────────────────────────────────────

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/invoice',  require('./routes/invoice'));
app.use('/api/config',   require('./routes/config'));
app.use('/api/pages',    require('./routes/pages'));
app.use('/api/vouchers', require('./routes/vouchers'));
app.use('/api',          require('./routes/balance'));
// Admin routes — dilindungi CSRF origin check (production only)
app.use('/api/admin',        csrfProtection, require('./routes/admin'));
app.use('/api/admin/gatepay',csrfProtection, require('./routes/gatepay'));
app.use('/api/bot',          csrfProtection, require('./routes/bot-admin'));


// ── Telegram Webhook endpoint ─────────────────────────────────
app.post('/api/telegram/webhook', (req, res) => {
  const { getBot } = require('./services/telegramBot');
  const bot = getBot();
  if (bot) bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ── PayGomerch Webhook (deteksi pembayaran instan) ─────────────────────
// Per docs: POST dengan header X-Signature (HMAC-SHA256 dengan API Key sebagai secret)
app.post('/api/webhook/paygomerch', async (req, res) => {
  try {
    res.sendStatus(200); // Balas cepat agar PayGomerch tidak retry

    const body      = req.body || {};
    const signature = req.headers['x-signature'] || '';

    // Verifikasi signature per docs (HMAC-SHA256 dengan API Key sebagai secret)
    if (signature) {
      const crypto = require('crypto');
      const Config = require('./models/Config');
      const cfg    = await Config.findOne({ key: 'paygomerch_api_key' }).catch(() => null);
      if (cfg?.value) {
        const expected = crypto.createHmac('sha256', cfg.value)
          .update(JSON.stringify(body))
          .digest('hex');
        if (signature !== expected) {
          console.warn('[Webhook] Invalid X-Signature — request ditolak');
          return;
        }
      }
    }

    // Per docs: payload webhook berisi data transaksi
    // Format: { transaction_id, transaction_status, order_id, ... } atau di dalam data
    const pg       = body.data || body;
    const txStatus = (pg.transaction_status || pg.status || '').toLowerCase();
    const pgTxId   = pg.transaction_id || '';

    if (!['settlement','capture','success','paid'].includes(txStatus)) return;

    const Order = require('./models/Order');
    // Cari order by paymentRef = PayGomerch transaction_id (disimpan saat generate-qris)
    const order = pgTxId ? await Order.findOne({ paymentRef: pgTxId }) : null;

    if (order && order.status === 'pending') {
      await Order.findByIdAndUpdate(order._id, { status: 'paid', paidAt: new Date() });
      console.log(`[Webhook] ✅ Order ${order.orderId} → PAID (via PayGomerch webhook)`);
      // Auto-fulfillment: kirim stok otomatis jika processType = auto
      const ordersRoute = require('./routes/orders');
      if (ordersRoute.autoFulfillOrder) setImmediate(() => ordersRoute.autoFulfillOrder(order));
    }
  } catch(e) {
    console.error('[Webhook PayGomerch] Error:', e.message);
  }
});

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'OK', env: process.env.NODE_ENV, time: new Date().toISOString() });
});

// ── 404 Handler ───────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} tidak ditemukan` });
});

// ── Error Handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Primexa Backend berjalan di http://localhost:${PORT}`);
  console.log(`📋 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 API: http://localhost:${PORT}/api/health\n`);
});
