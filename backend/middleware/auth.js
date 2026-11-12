const jwt  = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function authMiddleware(req, res, next) {
  try {
    // ── Dual Auth: Cookie (lebih aman) ATAU Bearer header (backward compat) ──
    // 1. Coba dari httpOnly cookie dulu (tidak bisa dicuri XSS)
    let token = req.cookies?.ramx_token || req.cookies?.ramx_admin_token;

    // 2. Fallback ke Authorization: Bearer header (untuk klien lama / API call)
    if (!token) {
      const header = req.headers.authorization || '';
      token = header.startsWith('Bearer ') ? header.slice(7) : null;
    }

    if (!token) return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-passwordHash');
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Akun tidak aktif atau tidak ditemukan' });

    req.user = user;
    next();
  } catch(e) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa' });
  }
};

