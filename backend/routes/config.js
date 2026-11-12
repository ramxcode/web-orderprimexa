const router    = require('express').Router();
const Config    = require('../models/Config');
const auth      = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// ── Daftar key yang BOLEH diakses publik (whitelist) ─────────
// Semua key lain (api_key, secret, token, dll) hanya untuk admin
const PUBLIC_CONFIG_KEYS = new Set([
  'store_settings',
  'hero_settings',
  'benefit_settings',
  'live_chat',
  'widget_settings',
  'theme_settings',
  'category_pills_settings',
  'page_settings',
  'category_config',
  'notification_settings',
  'social_links',
  'contact_settings',
  'contact_config',       // info kontak publik (WA, phone, email, dll)
  'seo_settings',
  'homepage_sections',
  'promo_settings',
]);


// Sub-field sensitif yang harus dihapus dari store_settings sebelum dikirim publik
const SENSITIVE_STORE_FIELDS = [
  'telegramBotToken', 'telegramBotUsername', 'telegramChatId',
  'botToken', 'apiKey', 'secretKey', 'apiSecret', 'webhookSecret',
];

// Helper: apakah key config bersifat sensitif/rahasia?
function isSensitiveKey(key) {
  if (!PUBLIC_CONFIG_KEYS.has(key)) return true; // tidak ada di whitelist = sensitif
  return false;
}

// Helper: hapus sub-field sensitif dari store_settings
function sanitizeStoreSettings(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const safe = { ...obj };
  SENSITIVE_STORE_FIELDS.forEach(f => delete safe[f]);
  return safe;
}

// GET /api/config — publik, hanya kembalikan whitelist key
router.get('/', async (req, res) => {
  try {
    const configs = await Config.find({});
    const result  = {};
    configs.forEach(c => { result[c.key] = c.value; });

    // Cek apakah request dari admin (punya token valid)
    const token = req.cookies?.ramx_token || req.cookies?.ramx_admin_token
                || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

    let isAdmin = false;
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        isAdmin = (decoded.role === 'admin' || decoded.role === 'staff');
      } catch(e) { /* token invalid / expired — tetap perlakukan sebagai publik */ }
    }

    if (isAdmin) {
      // Admin: kirim semua config (termasuk sensitif)
      return res.json({ success: true, data: result });
    }

    // Publik: hanya kirim whitelist key, hapus sub-field sensitif
    const safeResult = {};
    for (const key of PUBLIC_CONFIG_KEYS) {
      if (result[key] !== undefined) {
        safeResult[key] = key === 'store_settings'
          ? sanitizeStoreSettings(result[key])
          : result[key];
      }
    }
    res.json({ success: true, data: safeResult });

  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/config/:key — baca satu config
router.get('/:key', async (req, res) => {
  try {
    const key = req.params.key;

    // Blokir akses ke key sensitif untuk non-admin
    if (isSensitiveKey(key)) {
      // Cek auth
      const token = req.cookies?.ramx_token || req.cookies?.ramx_admin_token
                  || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
      if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin' && decoded.role !== 'staff') {
          return res.status(403).json({ success: false, message: 'Forbidden' });
        }
      } catch(e) {
        return res.status(401).json({ success: false, message: 'Token tidak valid' });
      }
    }

    const cfg = await Config.findOne({ key });
    if (!cfg) return res.status(404).json({ success: false, message: 'Config tidak ditemukan' });

    // Untuk store_settings, hapus sub-field sensitif jika akses publik
    let value = cfg.value;
    if (key === 'store_settings') {
      const token = req.cookies?.ramx_token || req.cookies?.ramx_admin_token
                  || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
      let isAdmin = false;
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          isAdmin = (decoded.role === 'admin' || decoded.role === 'staff');
        } catch(e) {}
      }
      if (!isAdmin) value = sanitizeStoreSettings(value);
    }

    res.json({ success: true, data: value });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});



// PUT /api/config/:key — admin only
router.put('/:key', auth, adminOnly, async (req, res) => {
  try {
    const cfg = await Config.findOneAndUpdate(
      { key: req.params.key },
      { value: req.body.value },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: cfg });
  } catch(e) { res.status(400).json({ success: false, message: e.message }); }
});

// POST /api/config/bulk — simpan banyak config sekaligus (admin)
router.post('/bulk', auth, adminOnly, async (req, res) => {
  try {
    const { configs } = req.body; // { key: value, ... }
    const ops = Object.entries(configs).map(([key, value]) => ({
      updateOne: { filter: { key }, update: { value }, upsert: true }
    }));
    await Config.bulkWrite(ops);
    res.json({ success: true, message: 'Konfigurasi disimpan' });
  } catch(e) { res.status(400).json({ success: false, message: e.message }); }
});

module.exports = router;
