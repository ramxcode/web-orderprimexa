const router      = require('express').Router();
const jwt         = require('jsonwebtoken');
const crypto      = require('crypto');
const User        = require('../models/User');
const OtpCode     = require('../models/OtpCode');
const EmailToken  = require('../models/EmailToken');
const { sendOtpDirect }        = require('../services/telegramBot');
const { sendVerificationEmail } = require('../services/mailer');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ── Helper: set httpOnly cookie ───────────────────────────────
// Cookie tidak bisa diakses JavaScript → aman dari XSS token theft
function setCookieToken(res, token, isAdmin = false) {
  const isProd   = process.env.NODE_ENV === 'production';
  const maxAge   = 7 * 24 * 60 * 60 * 1000; // 7 hari (ms)
  const opts = {
    httpOnly: true,          // JavaScript tidak bisa baca cookie ini
    secure:   isProd,        // Hanya HTTPS di production
    sameSite: 'Lax',         // Lax: aman dari CSRF, tetap dikirim saat navigasi biasa
    maxAge,
    path: '/',
  };
  // Set cookie user biasa
  res.cookie('ramx_token', token, opts);
  // Jika admin, set juga cookie admin khusus (nama berbeda untuk kejelasan)
  if (isAdmin) res.cookie('ramx_admin_token', token, { ...opts, path: '/api/admin' });
}

// ── Helper: clear semua auth cookies ─────────────────────────
function clearAuthCookies(res) {
  const opts = { httpOnly: true, sameSite: 'Lax', path: '/' };
  res.clearCookie('ramx_token', opts);
  res.clearCookie('ramx_admin_token', { ...opts, path: '/api/admin' });
}


async function sendVerifEmail(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

  await EmailToken.deleteMany({ userId: user._id, type: 'verify' });
  await EmailToken.create({ userId: user._id, token, type: 'verify', expiresAt });

  const frontendUrl = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5500';
  const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

  await sendVerificationEmail({ to: user.email, userName: user.name, verifyUrl });
  return token;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, telegramUsername } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });

    const user = await User.create({
      name, email, phone,
      passwordHash: password,
      telegramUsername: telegramUsername ? telegramUsername.replace(/^@/, '').toLowerCase() : undefined,
      isVerified: false, // Harus verifikasi email dulu
    });

    // Kirim email verifikasi (tidak block response jika gagal)
    const emailSent = await sendVerifEmail(user).catch(() => false);

    res.status(201).json({
      success: true,
      message: 'Akun berhasil dibuat! Cek email Anda untuk verifikasi.',
      emailSent,
      requiresVerification: true,
      email: user.email,
    });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.passwordHash) return res.status(401).json({ success: false, message: 'Email atau password salah' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ success: false, message: 'Email atau password salah' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Akun dinonaktifkan' });

    // Cek verifikasi email
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        requiresVerification: true,
        email: user.email,
        message: 'Email belum diverifikasi. Cek inbox Anda atau minta kirim ulang.',
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const tok = sign(user._id);
    // Set httpOnly cookie (aman dari XSS) + tetap kirim token di body (backward compat)
    const isAdmin = user.role === 'admin';
    setCookieToken(res, tok, isAdmin);
    res.json({ success: true, token: tok, user });

  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/auth/verify-email?token=xxx
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Token tidak ditemukan' });

    const record = await EmailToken.findOne({ token, type: 'verify', expiresAt: { $gt: new Date() } });
    if (!record) return res.status(400).json({ success: false, message: 'Link verifikasi tidak valid atau sudah kadaluarsa' });

    // Update user jadi verified
    const user = await User.findByIdAndUpdate(record.userId, { isVerified: true }, { new: true });
    await record.deleteOne();

    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    // Langsung login setelah verifikasi
    const tok = sign(user._id);
    setCookieToken(res, tok, user.role === 'admin');
    res.json({ success: true, message: 'Email berhasil diverifikasi!', token: tok, user });

  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email wajib diisi' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'Email tidak terdaftar' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'Email sudah diverifikasi' });

    await sendVerifEmail(user);
    res.json({ success: true, message: 'Email verifikasi sudah dikirim ulang' });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/auth/telegram/send-otp
router.post('/telegram/send-otp', async (req, res) => {
  try {
    let { telegramUsername } = req.body;
    if (!telegramUsername) return res.status(400).json({ success: false, message: 'Username Telegram wajib diisi' });
    telegramUsername = telegramUsername.replace(/^@/, '').toLowerCase();

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OtpCode.deleteMany({ identifier: telegramUsername });

    const user = await User.findOne({ telegramUsername });
    const chatId = user?.telegramChatId || null;

    await OtpCode.create({ identifier: telegramUsername, code, type: 'telegram', chatId, expiresAt });

    let sent = false;
    if (chatId) sent = await sendOtpDirect(chatId, code);

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'PrimexaBot';
    const payload = Buffer.from(`${telegramUsername}:${code}`).toString('base64');
    const deepLink = `https://t.me/${botUsername}?start=otp_${payload}`;

    res.json({ success: true, sentDirect: sent, deepLink, botUsername,
      message: sent ? 'OTP dikirim langsung ke Telegram Anda' : 'Buka link bot untuk menerima OTP' });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/auth/telegram/verify-otp
router.post('/telegram/verify-otp', async (req, res) => {
  try {
    let { telegramUsername, code } = req.body;
    if (!telegramUsername || !code) return res.status(400).json({ success: false, message: 'Username dan kode OTP wajib diisi' });
    telegramUsername = telegramUsername.replace(/^@/, '').toLowerCase();

    const otp = await OtpCode.findOne({ identifier: telegramUsername, code, expiresAt: { $gt: new Date() } });
    if (!otp) return res.status(400).json({ success: false, message: 'Kode OTP salah atau sudah kadaluarsa' });

    await otp.deleteOne();

    let user = await User.findOne({ telegramUsername });
    if (!user) {
      user = await User.create({ name: telegramUsername, telegramUsername, isVerified: true });
    }
    if (otp.chatId) {
      user.telegramChatId = otp.chatId;
      await user.save({ validateBeforeSave: false });
    }

    const tok = sign(user._id);
    setCookieToken(res, tok, user.role === 'admin');
    res.json({ success: true, token: tok, user, isNewUser: !user.email });

  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/auth/profile — update nama sendiri
router.put('/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Nama tidak boleh kosong' });
    const user = await User.findByIdAndUpdate(req.user._id, { name: name.trim() }, { new: true });
    res.json({ success: true, user });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/auth/change-password — ganti password sendiri
router.put('/change-password', require('../middleware/auth'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'Password baru minimal 8 karakter' });

    const bcrypt = require('bcryptjs');
    const user   = await User.findById(req.user._id).select('+passwordHash');
    if (!user.passwordHash) return res.status(400).json({ success: false, message: 'Akun ini tidak memiliki password (login via Telegram)' });

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) return res.status(401).json({ success: false, message: 'Password saat ini salah' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Password berhasil diubah' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/auth/avatar — upload & simpan foto profil
router.post('/avatar', require('../middleware/auth'), async (req, res) => {
  try {
    const multer = require('multer');
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Hanya file gambar yang diizinkan'));
        }
        cb(null, true);
      }
    }).single('avatar');

    upload(req, res, async (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      if (!req.file) return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });

      // Convert buffer ke base64 data URL
      const base64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      const dataUrl = `data:${mimeType};base64,${base64}`;

      await User.findByIdAndUpdate(req.user._id, { avatar: dataUrl });

      res.json({ success: true, message: 'Foto profil berhasil diperbarui', avatarUrl: dataUrl });
    });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/auth/logout — hapus cookie httpOnly (hanya server yang bisa hapus httpOnly cookie)
router.post('/logout', (req, res) => {
  clearAuthCookies(res);
  res.json({ success: true, message: 'Berhasil logout' });
});

module.exports = router;
