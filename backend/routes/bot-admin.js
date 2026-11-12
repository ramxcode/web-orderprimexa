// backend/routes/bot-admin.js — Admin bot management API

const router    = require('express').Router();
const auth      = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { reinitBot, getBotStatus, getBot } = require('../services/telegramBot');
const Config    = require('../models/Config');

/* ── GET /api/bot/status — realtime bot status ─────────────── */
router.get('/status', auth, adminOnly, async (req, res) => {
  try {
    const status = getBotStatus();

    // Ambil token dari DB (masked)
    const botCfg = await Config.findOne({ key: 'bot_settings' });
    const token  = botCfg?.value?.token || '';
    const masked = token.length > 10
      ? token.slice(0, 6) + ':' + '*'.repeat(10) + '...' + token.slice(-4)
      : '';

    const settings = botCfg?.value || {};

    res.json({
      success: true,
      ...status,
      tokenMasked   : masked,
      hasToken      : !!token,
      otpEnabled    : settings.otpEnabled !== false,
      template      : settings.template || 'photo',
      bannerUrl     : settings.bannerUrl || null,
    });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── POST /api/bot/connect — save token + reinit live ──────── */
router.post('/connect', auth, adminOnly, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || token.trim().length < 20) {
      return res.status(400).json({ success: false, message: 'Token tidak valid (terlalu pendek)' });
    }

    const info = await reinitBot(token.trim());
    const status = getBotStatus();

    res.json({
      success    : true,
      message    : `Bot @${status.username} berhasil terhubung!`,
      isOnline   : status.isOnline,
      username   : status.username,
      firstName  : status.firstName,
      id         : status.id,
    });
  } catch(e) {
    res.status(400).json({
      success : false,
      message : 'Gagal menghubungkan bot: ' + (e.message || 'Token tidak valid'),
    });
  }
});

/* ── POST /api/bot/test — kirim pesan test ──────────────────── */
router.post('/test', auth, adminOnly, async (req, res) => {
  try {
    const bot = getBot();
    if (!bot) return res.status(400).json({ success: false, message: 'Bot tidak aktif. Hubungkan token dulu.' });

    let { chatId } = req.body;
    if (!chatId || !chatId.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Chat ID atau @username wajib diisi' });
    }
    chatId = chatId.toString().trim();

    // Jika berupa @username atau username, cari chatId di database User
    if (isNaN(chatId)) {
      const User = require('../models/User');
      const username = chatId.replace(/^@/, '').toLowerCase();
      const user = await User.findOne({ telegramUsername: username }).select('telegramChatId telegramUsername');

      if (!user) {
        return res.status(404).json({
          success : false,
          message : `User @${username} tidak ditemukan di database. Pastikan user sudah daftar dengan username ini.`,
        });
      }
      if (!user.telegramChatId) {
        return res.status(400).json({
          success : false,
          message : `@${username} belum pernah /start ke bot ini. Minta user kirim /start ke @${getBotStatus().username} dulu.`,
        });
      }
      chatId = user.telegramChatId;
    }

    const status = getBotStatus();
    await bot.sendMessage(chatId,
      `✅ *Test Bot Berhasil!*\n\n` +
      `Bot *@${status.username}* aktif dan terhubung.\n` +
      `Waktu: ${new Date().toLocaleString('id-ID')}`,
      { parse_mode: 'Markdown' }
    );

    res.json({ success: true, message: 'Pesan test berhasil dikirim' });
  } catch(e) {
    res.status(500).json({ success: false, message: 'Gagal kirim test: ' + e.message });
  }
});

/* ── GET /api/bot/settings — ambil semua pengaturan bot ──────── */
router.get('/settings', auth, adminOnly, async (req, res) => {
  try {
    const botCfg   = await Config.findOne({ key: 'bot_settings' });
    const storeCfg = await Config.findOne({ key: 'store_settings' });

    const settings = botCfg?.value || {};
    // Jangan expose token ke client
    const safe = { ...settings };
    delete safe.token;

    res.json({
      success   : true,
      settings  : safe,
      storeName : storeCfg?.value?.storeName || 'Primexa',
    });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── POST /api/bot/settings — simpan pengaturan bot ──────────── */
router.post('/settings', auth, adminOnly, async (req, res) => {
  try {
    const {
      otpEnabled, template, bannerUrl, categories,
      // Telegraf bot fields (dibaca oleh telegram/services/configService.js)
      adminIds, adminUsername, adminWhatsapp, adminTelegram,
      minDeposit, maxDeposit, productsPerPage,
      paymentExpireMinutes, defaultLanguage, paygomerchApiKey,
    } = req.body;

    const botCfg  = await Config.findOne({ key: 'bot_settings' });
    const current = botCfg?.value || {};

    const updated = {
      ...current,                             // preserve token & existing fields
      otpEnabled           : otpEnabled !== false,
      template             : template    || 'photo',
      bannerUrl            : bannerUrl   || current.bannerUrl   || null,
      categories           : categories  || current.categories  || [],
      // Telegraf bot settings
      adminIds             : Array.isArray(adminIds) ? adminIds : (typeof adminIds === 'string' ? adminIds.split(',').map(s => s.trim()).filter(Boolean) : current.adminIds || []),
      adminUsername        : adminUsername        ?? current.adminUsername        ?? '',
      adminWhatsapp        : adminWhatsapp        ?? current.adminWhatsapp        ?? '',
      adminTelegram        : adminTelegram        ?? current.adminTelegram        ?? '',
      minDeposit           : Number(minDeposit)   || current.minDeposit           || 10000,
      maxDeposit           : Number(maxDeposit)   || current.maxDeposit           || 5000000,
      productsPerPage      : Number(productsPerPage) || current.productsPerPage   || 9,
      paymentExpireMinutes : Number(paymentExpireMinutes) || current.paymentExpireMinutes || 30,
      defaultLanguage      : defaultLanguage      || current.defaultLanguage      || 'id',
      // API key hanya update jika diisi (tidak menghapus yang sudah ada)
      ...(paygomerchApiKey ? { paygomerchApiKey } : {}),
    };

    await Config.findOneAndUpdate(
      { key: 'bot_settings' },
      { value: updated },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Pengaturan bot disimpan' });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── POST /api/bot/start ─────────────────────────────────────── */
router.post('/start', auth, adminOnly, async (req, res) => {
  try {
    const botCfg = await Config.findOne({ key: 'bot_settings' });
    if (!botCfg?.value?.token) return res.status(400).json({ success: false, message: 'Token bot belum dikonfigurasi. Atur token terlebih dahulu.' });
    await reinitBot(botCfg.value.token);
    res.json({ success: true, message: 'Bot berhasil dijalankan!' });
  } catch(e) {
    res.status(500).json({ success: false, message: 'Gagal menjalankan bot: ' + e.message });
  }
});

/* ── POST /api/bot/stop ──────────────────────────────────────── */
router.post('/stop', auth, adminOnly, async (req, res) => {
  try {
    const { getBot } = require('../services/telegramBot');
    const bot = getBot();
    if (bot && bot.stopPolling) await bot.stopPolling();
    res.json({ success: true, message: 'Bot berhasil dihentikan!' });
  } catch(e) {
    res.status(500).json({ success: false, message: 'Gagal menghentikan bot: ' + e.message });
  }
});

/* ── POST /api/bot/restart ───────────────────────────────────── */
router.post('/restart', auth, adminOnly, async (req, res) => {
  try {
    const botCfg = await Config.findOne({ key: 'bot_settings' });
    if (!botCfg?.value?.token) return res.status(400).json({ success: false, message: 'Token bot belum dikonfigurasi.' });
    await reinitBot(botCfg.value.token);
    res.json({ success: true, message: 'Bot berhasil di-restart!' });
  } catch(e) {
    res.status(500).json({ success: false, message: 'Gagal restart bot: ' + e.message });
  }
});

/* ── GET /api/bot/messages ───────────────────────────────────── */
router.get('/messages', auth, adminOnly, async (req, res) => {
  try {
    const cfg = await Config.findOne({ key: 'bot_messages' });
    const defaults = {
      welcome: 'Halo {nama_customer}! 👋\nSelamat datang di {nama_toko}!\n\nAda yang bisa kami bantu?',
      success: '✅ Pembayaran berhasil!\n\nInvoice: {invoice}\nProduk: {produk}\nTotal: {total}\nStatus: {status}\n\nTerima kasih telah berbelanja!',
      failed:  '❌ Pembayaran gagal.\n\nInvoice: {invoice}\nProduk: {produk}\nTotal: {total}\n\nSilakan coba lagi atau hubungi support.',
      pending: '⏳ Menunggu pembayaran.\n\nInvoice: {invoice}\nProduk: {produk}\nTotal: {total}\n\nSelesaikan pembayaran sebelum batas waktu.',
    };
    res.json({ success: true, messages: cfg?.value || defaults });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── POST /api/bot/messages ──────────────────────────────────── */
router.post('/messages', auth, adminOnly, async (req, res) => {
  try {
    const { welcome, success: successMsg, failed, pending } = req.body;
    await Config.findOneAndUpdate(
      { key: 'bot_messages' },
      { value: { welcome, success: successMsg, failed, pending } },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: 'Pesan bot berhasil disimpan ke database!' });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* ── GET /api/bot/logs ───────────────────────────────────────── */
router.get('/logs', auth, adminOnly, async (req, res) => {
  try {
    const cfg = await Config.findOne({ key: 'bot_logs' });
    res.json({ success: true, logs: cfg?.value || [] });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
