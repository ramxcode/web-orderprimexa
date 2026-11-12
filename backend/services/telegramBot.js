// backend/services/telegramBot.js — v4 Stable Auto Order Bot

const TelegramBot = require('node-telegram-bot-api');
const OtpCode     = require('../models/OtpCode');
const User        = require('../models/User');

let bot        = null;
let _botOnline = false;
let _botInfo   = { username: '', firstName: '', id: null };

// Session: chatId -> { state, products, page, category }
const _sessions = new Map();

/* ══════════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════════ */
async function initBotFromDB() {
  try {
    // Tunggu mongoose terhubung dulu sebelum baca config
    // (initBot() dipanggil bersamaan connectDB() yang async)
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      await new Promise(function(resolve, reject) {
        var timeout = setTimeout(function() {
          reject(new Error('Mongoose belum terhubung setelah 20 detik'));
        }, 20000);
        if (mongoose.connection.readyState === 1) {
          clearTimeout(timeout); return resolve();
        }
        mongoose.connection.once('connected', function() {
          clearTimeout(timeout); resolve();
        });
        mongoose.connection.once('error', function(err) {
          clearTimeout(timeout); reject(err);
        });
      });
    }
    const Config = require('../models/Config');
    const botCfg = await Config.findOne({ key: 'bot_settings' });
    const token  = (botCfg && botCfg.value && botCfg.value.token)
                   || process.env.TELEGRAM_BOT_TOKEN;
    if (!token || token.includes('xxx')) {
      console.warn('⚠️  Token bot belum diset — bot tidak aktif');
      return null;
    }
    return _startBot(token);
  } catch(e) {
    console.error('initBotFromDB error:', e.message);
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (token && !token.includes('xxx')) return _startBot(token);
    return null;
  }
}

async function initBot() {
  // Guard: jangan start old bot jika Telegraf bot sudah aktif
  if (process.env.USE_TELEGRAF_BOT === 'true') {
    console.log('[telegramBot] USE_TELEGRAF_BOT=true → skip initBot (old bot).');
    return null;
  }
  return initBotFromDB();
}

async function reinitBot(newToken) {
  if (!newToken || newToken.trim().length < 20) throw new Error('Token tidak valid');
  const Config = require('../models/Config');
  await Config.findOneAndUpdate(
    { key: 'bot_settings' },
    { $set: { 'value.token': newToken.trim() } },
    { upsert: true, new: true }
  );
  if (bot) {
    try { await bot.stopPolling(); } catch(e) {}
    bot = null; _botOnline = false;
  }
  return _startBot(newToken.trim());
}

async function _startBot(token) {
  try {
    const mode = process.env.TELEGRAM_MODE || 'polling';
    if (mode === 'webhook') {
      bot = new TelegramBot(token);
      const webhookUrl = (process.env.TELEGRAM_WEBHOOK_URL || '') + '/api/telegram/webhook';
      await bot.setWebHook(webhookUrl);
      console.log('✅ Bot webhook:', webhookUrl);
    } else {
      bot = new TelegramBot(token, {
        polling: {
          interval : 1000,
          autoStart: true,
          params   : { timeout: 10, allowed_updates: ['message','callback_query'] }
        }
      });
    }

    const me = await bot.getMe();
    _botInfo   = { username: me.username || '', firstName: me.first_name || '', id: me.id };
    _botOnline = true;
    console.log('✅ Bot aktif: @' + me.username + ' (id:' + me.id + ')');

    // Set bot commands menu
    _setBotCommands().catch(() => {});

    _registerHandlers();

    bot.on('polling_error', function(err) {
      // Abaikan error ETELEGRAM biasa (mis. message not modified)
      if (err.code !== 'ETELEGRAM') {
        console.error('Polling error:', err.code, err.message);
        if (err.code === 'EFATAL' || err.code === 'ENOTFOUND') {
          _botOnline = false;
        }
      }
    });

    return bot;
  } catch(e) {
    _botOnline = false;
    bot        = null;
    console.error('_startBot error:', e.message);
    throw e;
  }
}

async function _setBotCommands() {
  if (!bot) return;
  try {
    await bot.setMyCommands([
      { command: 'start',   description: 'Start the bot' },
      { command: 'balance', description: 'View Balance' },
      { command: 'stock',   description: 'View Stock' },
    ]);
  } catch(e) { /* ignore */ }
}

/* ══════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════ */
async function _getStore() {
  try {
    const Config = require('../models/Config');
    const sc = await Config.findOne({ key: 'store_settings' });
    const bc = await Config.findOne({ key: 'bot_settings' });
    return {
      name      : (sc && sc.value && sc.value.storeName) || 'Primexa',
      bannerUrl : (bc && bc.value && bc.value.bannerUrl) || null,
    };
  } catch(e) { return { name: 'Primexa', bannerUrl: null }; }
}

function _fmtRp(n) {
  return 'Rp. ' + (Number(n) || 0).toLocaleString('id-ID');
}

function _dateStr() {
  var d      = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  var months = ['Januari','Februari','Maret','April','Mei','Juni','Juli',
                'Agustus','September','Oktober','November','Desember'];
  var pad = function(n) { return String(n).padStart(2,'0'); };
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() +
    ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

// Keyboard utama bot
function _mainKbd(saldo) {
  return {
    keyboard: [
      [{ text: 'Daftar Produk' }, { text: 'Saldo: ' + _fmtRp(saldo) }],
      [{ text: 'Riwayat Transaksi' }],
      [{ text: 'Produk Populer' }, { text: 'Pusat Bantuan' }],
    ],
    resize_keyboard: true,
  };
}

function _numKbd(saldo, numCount, page, pages) {
  var numRows = [];
  var row     = [];
  for (var i = 1; i <= numCount; i++) {
    row.push({ text: String(i) });
    if (row.length === 3) { numRows.push(row); row = []; }
  }
  if (row.length) numRows.push(row);

  var navRow = [];
  if (page > 1)     navRow.push({ text: 'Prev' });
  if (page < pages) navRow.push({ text: 'Next' });

  var rows = [
    [{ text: 'Daftar Produk' }, { text: 'Saldo: ' + _fmtRp(saldo) }],
  ].concat(numRows);
  if (navRow.length) rows.push(navRow);
  rows.push([{ text: 'Riwayat Transaksi' }]);
  rows.push([{ text: 'Produk Populer' }, { text: 'Pusat Bantuan' }]);

  return { keyboard: rows, resize_keyboard: true };
}

async function _getUser(msg) {
  var username = (msg.from.username || '').toLowerCase();
  var chatId   = String(msg.chat.id);
  var user     = null;
  if (username) {
    user = await User.findOneAndUpdate(
      { telegramUsername: username },
      { $set: { telegramChatId: chatId },
        $setOnInsert: { name: msg.from.first_name || username, role: 'customer', balance: 0 } },
      { upsert: true, new: true }
    ).catch(function() { return null; });
  } else {
    user = await User.findOne({ telegramChatId: chatId }).catch(function() { return null; });
  }
  return user;
}

function _safe(text) {
  // Escape characters yang bisa break Markdown v1
  return String(text || '').replace(/([_*`\[])/g, '\\$1');
}

/* ══════════════════════════════════════════════════════════════
   HANDLERS
   ══════════════════════════════════════════════════════════════ */
function _registerHandlers() {
  bot.removeAllListeners('message');
  bot.removeAllListeners('polling_error');

  /* ── /start ──────────────────────────────────────────────── */
  bot.onText(/\/start(?:\s+(.+))?/, function(msg, match) {
    var payload = match ? match[1] : null;
    var chatId  = String(msg.chat.id);
    _getUser(msg).then(function(user) {
      // OTP deep-link
      if (payload && payload.startsWith('otp_')) {
        try {
          var decoded  = Buffer.from(payload.slice(4), 'base64').toString('utf8');
          var parts    = decoded.split(':');
          var tgUser   = parts[0];
          var code     = parts[1];
          _sendOtpMsg(chatId, code).catch(function() {});
          OtpCode.findOneAndUpdate({ identifier: tgUser.toLowerCase(), code }, { chatId }).catch(function() {});
        } catch(e) { _sendWelcome(msg, chatId, user).catch(function() {}); }
        return;
      }
      _sendWelcome(msg, chatId, user).catch(function(e) {
        console.error('sendWelcome error:', e.message);
      });
    }).catch(function(e) { console.error('/start error:', e.message); });
  });

  /* ── /saldo ──────────────────────────────────────────────── */
  bot.onText(/\/saldo/, function(msg) {
    var chatId = String(msg.chat.id);
    _getUser(msg).then(function(user) {
      var saldo = (user && user.balance) || 0;
      bot.sendMessage(chatId,
        'Saldo kamu saat ini: *' + _fmtRp(saldo) + '*',
        { parse_mode: 'Markdown', reply_markup: _mainKbd(saldo) }
      ).catch(function() {});
    }).catch(function() {});
  });

  /* ── /stok ───────────────────────────────────────────────── */
  bot.onText(/\/stok/, function(msg) {
    var chatId = String(msg.chat.id);
    _getUser(msg).then(function(user) {
      _showProductList(chatId, msg, 1, true, user).catch(function(e) {
        console.error('/stok error:', e.message);
      });
    }).catch(function() {});
  });

  /* ── /produk ─────────────────────────────────────────────── */
  bot.onText(/\/produk/, function(msg) {
    var chatId = String(msg.chat.id);
    _getUser(msg).then(function(user) {
      _showProductList(chatId, msg, 1, false, user).catch(function(e) {
        console.error('/produk error:', e.message);
      });
    }).catch(function() {});
  });

  /* ── /otp ────────────────────────────────────────────────── */
  bot.onText(/\/otp(?:\s+(.+))?/, function(msg, match) {
    var chatId     = String(msg.chat.id);
    var identifier = (match && match[1]) ? match[1].trim().toLowerCase() : null;
    if (!identifier) {
      bot.sendMessage(chatId, 'Format: /otp email@kamu.com').catch(function() {});
      return;
    }
    OtpCode.findOne({ identifier: identifier, expiresAt: { $gt: new Date() } })
      .then(function(record) {
        if (!record) {
          bot.sendMessage(chatId, 'Tidak ada OTP aktif. Minta OTP baru dari website.').catch(function() {});
          return;
        }
        _sendOtpMsg(chatId, record.code).catch(function() {});
        OtpCode.updateOne({ _id: record._id }, { chatId }).catch(function() {});
      }).catch(function() {});
  });

  /* ── /balance (alias /saldo) ─────────────────────────────── */
  bot.onText(/\/balance/, function(msg) {
    var chatId = String(msg.chat.id);
    _getUser(msg).then(function(user) {
      var saldo = (user && user.balance) || 0;
      bot.sendMessage(chatId,
        'Saldo kamu saat ini: *' + _fmtRp(saldo) + '*',
        { parse_mode: 'Markdown', reply_markup: _mainKbd(saldo) }
      ).catch(function() {});
    }).catch(function() {});
  });

  /* ── /stock (alias /stok) ────────────────────────────────── */
  bot.onText(/\/stock/, function(msg) {
    var chatId = String(msg.chat.id);
    _getUser(msg).then(function(user) {
      _showProductList(chatId, msg, 1, true, user).catch(function(e) {
        console.error('/stock error:', e.message);
      });
    }).catch(function() {});
  });


  bot.on('message', function(msg) {
    // Abaikan commands
    if (!msg.text || msg.text.startsWith('/')) return;

    var chatId  = String(msg.chat.id);
    var text    = msg.text.trim();
    var session = _sessions.get(chatId) || {};

    _getUser(msg).then(function(user) {
      var saldo = (user && user.balance) || 0;

      // ── Menu utama ──
      if (text === 'Daftar Produk') {
        return _showProductList(chatId, msg, 1, false, user);
      }
      if (text.indexOf('Saldo') === 0) {
        return bot.sendMessage(chatId,
          'Saldo kamu: *' + _fmtRp(saldo) + '*',
          { parse_mode: 'Markdown', reply_markup: _mainKbd(saldo) }
        );
      }
      if (text === 'Riwayat Transaksi') { return _showHistory(chatId, user, saldo); }
      if (text === 'Produk Populer')    { return _showFeatured(chatId, msg, user); }
      if (text === 'Pusat Bantuan')     { return _showBantuan(chatId, saldo); }
      if (text === 'Cara Order')        { return _showCaraOrder(chatId, saldo); }
      if (text === 'Informasi')         { return _showInfo(chatId, saldo); }
      if (text === 'Menu Utama')        {
        _sessions.delete(chatId);
        return _sendWelcome(msg, chatId, user);
      }

      // ── Pagination ──
      if (text === 'Prev' && session.state === 'list') {
        var prevPage = Math.max(1, (session.page || 1) - 1);
        return _showProductList(chatId, msg, prevPage, false, user);
      }
      if (text === 'Next' && session.state === 'list') {
        return _showProductList(chatId, msg, (session.page || 1) + 1, false, user);
      }

      // ── Nomor produk ──
      if (session.state === 'list' && /^\d+$/.test(text)) {
        var idx      = parseInt(text) - 1;
        var products = session.products || [];
        if (idx >= 0 && idx < products.length) {
          return _showProductDetail(chatId, products[idx], saldo);
        }
      }

    }).catch(function(e) {
      console.error('Message handler error:', e.message);
    });
  });
}

/* ══════════════════════════════════════════════════════════════
   SCREENS
   ══════════════════════════════════════════════════════════════ */

async function _sendWelcome(msg, chatId, user) {
  var store    = await _getStore();
  var username = (msg.from.username || '').toLowerCase();
  var firstName= msg.from.first_name || username || 'pengguna';
  var saldo    = (user && user.balance) || 0;

  // Ambil total transaksi user (jumlah order sukses)
  var trxUser = 0;
  try {
    var Order = require('../models/Order');
    if (user) {
      var userOrders = await Order.aggregate([
        { $match: { userId: user._id, status: { $in: ['paid','completed','settlement','success'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);
      trxUser = (userOrders[0] && userOrders[0].total) || 0;
    }
  } catch(e) {}

  // Statistik toko — khusus pengguna & transaksi via bot
  var totalUsers = 0, totalTrx = 0;
  try {
    var User   = require('../models/User');
    var Order2 = require('../models/Order');
    // Hanya hitung user yang pernah pakai bot Telegram (punya telegramChatId)
    totalUsers = await User.countDocuments({ telegramChatId: { $exists: true, $ne: '' } });
    // Hitung semua transaksi (semua status, bukan hanya sukses)
    totalTrx   = await Order2.countDocuments({});
  } catch(e) {}


  var text =
    'Halo, ' + firstName + '\n' +
    '<i>' + _dateStr() + '</i>\n\n' +
    '<blockquote><b>Informasi Pengguna</b></blockquote>\n' +
    'ID Pengguna: <code>' + msg.from.id + '</code>\n' +
    'Username: @' + (username || '-') + '\n' +
    'Transaksi: ' + _fmtRp(trxUser) + '\n' +
    'Saldo: <b>' + _fmtRp(saldo) + '</b>\n\n' +
    '<blockquote><b>Statistik Toko</b></blockquote>\n' +
    'Total Pengguna: ' + totalUsers + ' Pengguna\n' +
    'Total Transaksi: ' + totalTrx + ' Transaksi\n\n' +
    '<blockquote><b>Pintasan Perintah</b></blockquote>\n' +
    '/start - Mulai bot\n' +
    '/saldo - Lihat Saldo\n' +
    '/stok - Lihat Stok';

  var replyMarkup = _mainKbd(saldo);

  // Tambah inline keyboard dengan Web App button jika URL tersedia
  var appUrl     = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0].trim() : null;
  var miniAppUrl = appUrl && appUrl.startsWith('https') ? appUrl + '/tgapp' : null;
  if (miniAppUrl) {
    replyMarkup = {
      keyboard: [
        [{ text: 'Buka Mini App', web_app: { url: miniAppUrl } }],
        [{ text: 'Daftar Produk' }, { text: 'Saldo: ' + _fmtRp(saldo) }],
        [{ text: 'Riwayat Transaksi' }],
        [{ text: 'Produk Populer' }, { text: 'Pusat Bantuan' }],
      ],
      resize_keyboard: true,
    };
  }

  try {
    if (store.bannerUrl) {
      await bot.sendPhoto(chatId, store.bannerUrl, {
        caption      : text,
        parse_mode   : 'HTML',
        reply_markup : replyMarkup,
      });
    } else {
      await bot.sendMessage(chatId, text, { parse_mode: 'HTML', reply_markup: replyMarkup });
    }

    // Set menu button sekali untuk chat ini (Mini App button)
    if (miniAppUrl) {
      bot.setChatMenuButton({
        chat_id     : chatId,
        menu_button : { type: 'web_app', text: 'Buka Toko', web_app: { url: miniAppUrl } },
      }).catch(function() {});
    }
  } catch(e) {
    // Fallback tanpa foto
    bot.sendMessage(chatId, text, { parse_mode: 'HTML', reply_markup: _mainKbd(saldo) }).catch(function() {});
  }
}

/* ── Product List ────────────────────────────────────────────── */
var PRODUCTS_PER_PAGE = 10;

async function _showProductList(chatId, msg, page, stokOnly, user) {
  var saldo = (user && user.balance) || 0;
  try {
    var Product = require('../models/Product');
    var filter  = { isActive: true };
    if (stokOnly) filter['variants.0'] = { $exists: true }; // ada variants

    var allProducts = await Product.find(filter)
      .sort({ category: 1, sortOrder: 1, createdAt: -1 })
      .lean();

    var total = allProducts.length;
    var pages = Math.ceil(total / PRODUCTS_PER_PAGE) || 1;
    page      = Math.min(Math.max(1, page), pages);

    var start = (page - 1) * PRODUCTS_PER_PAGE;
    var slice = allProducts.slice(start, start + PRODUCTS_PER_PAGE);

    // Group by category
    var grouped = {};
    slice.forEach(function(p, i) {
      var cat = p.category || 'Umum';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({ p: p, num: start + i + 1 });
    });

    // Build text
    var lines = ['Tekan *nomor produk* di bawah untuk lanjut.', ''];
    Object.keys(grouped).forEach(function(cat) {
      lines.push('| ' + cat);
      lines.push('');
      grouped[cat].forEach(function(item) {
        var stockTotal = 0;
        if (item.p.variants && item.p.variants.length) {
          item.p.variants.forEach(function(v) { stockTotal += (v.stock || 0); });
        } else {
          stockTotal = item.p.stock || 0;
        }
        lines.push(item.num + '. ' + item.p.name + (stokOnly ? ' - Stok: ' + stockTotal : ''));
      });
      lines.push('');
    });

    if (!slice.length) { lines = ['Belum ada produk tersedia.']; }
    else { lines.push('Halaman *' + page + '/' + pages + '*'); }

    var text = lines.join('\n');

    // Save session
    _sessions.set(chatId, { state: 'list', products: slice, page: page });

    await bot.sendMessage(chatId, text, {
      parse_mode   : 'Markdown',
      reply_markup : _numKbd(saldo, slice.length, page, pages),
    });
  } catch(e) {
    console.error('_showProductList error:', e.message);
    bot.sendMessage(chatId, 'Gagal memuat produk. Coba lagi.', { reply_markup: _mainKbd(saldo) }).catch(function() {});
  }
}

/* ── Product Detail ──────────────────────────────────────────── */
async function _showProductDetail(chatId, product, saldo) {
  try {
    var variants    = product.variants || [];
    var prices      = variants.map(function(v) { return v.price || 0; });
    var minPrice    = prices.length ? Math.min.apply(null, prices) : (product.price || 0);
    var maxPrice    = prices.length ? Math.max.apply(null, prices) : (product.price || 0);
    var totalStock  = variants.reduce(function(s, v) { return s + (v.stock || 0); }, 0) || (product.stock || 0);
    var priceStr    = (minPrice === maxPrice) ? _fmtRp(minPrice) : _fmtRp(minPrice) + ' s/d ' + _fmtRp(maxPrice);

    var text = '*' + product.name + '*\n\n' +
      'Kategori: ' + (product.category || '-') + '\n' +
      'Harga: ' + priceStr + '\n' +
      'Stok: ' + totalStock + ' tersedia\n';

    if (product.description) {
      text += '\n' + product.description + '\n';
    }

    if (variants.length) {
      text += '\nVarian:\n';
      variants.forEach(function(v, i) {
        text += (i+1) + '. ' + (v.name || v.label || 'Varian '+(i+1)) +
          ' - ' + _fmtRp(v.price) + ' (Stok: ' + (v.stock || 0) + ')\n';
      });
    }

    text += '\nUntuk memesan, kunjungi website kami.';

    await bot.sendMessage(chatId, text, {
      parse_mode   : 'Markdown',
      reply_markup : {
        keyboard: [
          [{ text: 'Daftar Produk' }, { text: 'Saldo ' + _fmtRp(saldo) }],
          [{ text: 'Menu Utama' }],
        ],
        resize_keyboard: true,
      },
    });
  } catch(e) {
    console.error('_showProductDetail error:', e.message);
    bot.sendMessage(chatId, 'Gagal memuat detail produk.', { reply_markup: _mainKbd(saldo) }).catch(function() {});
  }
}

/* ── Featured ────────────────────────────────────────────────── */
async function _showFeatured(chatId, msg, user) {
  var saldo = (user && user.balance) || 0;
  try {
    var Product  = require('../models/Product');
    var featured = await Product.find({ isActive: true, isFeatured: true }).limit(10).lean();

    if (!featured.length) {
      return bot.sendMessage(chatId, 'Belum ada produk populer.', { reply_markup: _mainKbd(saldo) });
    }

    var text = '*Produk Populer*\n\n';
    featured.forEach(function(p, i) {
      var price = (p.variants && p.variants.length) ? (p.variants[0].price || 0) : (p.price || 0);
      text += (i+1) + '. *' + p.name + '* - ' + _fmtRp(price) + '\n';
    });
    text += '\nKetik nomor produk untuk detail.';

    _sessions.set(chatId, { state: 'list', products: featured, page: 1 });

    await bot.sendMessage(chatId, text, {
      parse_mode   : 'Markdown',
      reply_markup : _numKbd(saldo, featured.length, 1, 1),
    });
  } catch(e) {
    bot.sendMessage(chatId, 'Gagal memuat produk populer.', { reply_markup: _mainKbd(saldo) }).catch(function() {});
  }
}

/* ── History ─────────────────────────────────────────────────── */
async function _showHistory(chatId, user, saldo) {
  if (!user) {
    return bot.sendMessage(chatId,
      'Akun tidak ditemukan. Daftar di website terlebih dahulu.',
      { reply_markup: _mainKbd(saldo) }
    );
  }
  try {
    var Order  = require('../models/Order');
    var orders = await Order.find({ userId: user._id })
      .sort({ createdAt: -1 }).limit(5).lean();

    if (!orders.length) {
      return bot.sendMessage(chatId, 'Belum ada transaksi.', { reply_markup: _mainKbd(saldo) });
    }

    var emoji = { pending:'⏳', paid:'💳', processing:'⚙️', completed:'✅', cancelled:'❌', refunded:'↩️' };
    var text  = '*Riwayat Transaksi (5 Terakhir)*\n\n';
    orders.forEach(function(o) {
      var ic   = emoji[o.status] || '❓';
      var date = new Date(o.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' });
      text += ic + ' *' + o.orderId + '*\n';
      text += '  Tanggal: ' + date + '\n';
      text += '  Total: ' + _fmtRp(o.total) + '\n';
      text += '  Status: ' + o.status + '\n\n';
    });

    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: _mainKbd(saldo) });
  } catch(e) {
    bot.sendMessage(chatId, 'Gagal memuat riwayat.', { reply_markup: _mainKbd(saldo) }).catch(function() {});
  }
}

/* ── Cara Order ──────────────────────────────────────────────── */
async function _showCaraOrder(chatId, saldo) {
  try {
    var store = await _getStore();
    var text =
      'Cara Order di ' + store.name + '\n\n' +
      '1. Tekan Daftar Produk\n' +
      '2. Pilih produk yang diinginkan\n' +
      '3. Lakukan pembayaran\n' +
      '4. Pesanan diproses otomatis\n' +
      '5. Produk dikirim ke akun/email\n\n' +
      'Untuk pemesanan, kunjungi website kami.';
    await bot.sendMessage(chatId, text, { reply_markup: _mainKbd(saldo) });
  } catch(e) {
    bot.sendMessage(chatId, 'Terjadi kesalahan.', { reply_markup: _mainKbd(saldo) }).catch(function() {});
  }
}

/* ── Informasi ───────────────────────────────────────────────── */
async function _showInfo(chatId, saldo) {
  try {
    var store  = await _getStore();
    var appUrl = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')[0].trim()
      : 'Hubungi admin';
    // Tidak pakai Markdown agar URL tidak break
    var text =
      'Informasi ' + store.name + '\n\n' +
      'Website: ' + appUrl + '\n' +
      'Bot: @' + (_botInfo.username || '-') + '\n\n' +
      'Kami menyediakan berbagai produk digital dengan pengiriman otomatis.\n\n' +
      'Butuh bantuan? Hubungi admin melalui website.';
    await bot.sendMessage(chatId, text, { reply_markup: _mainKbd(saldo) });
  } catch(e) {
    bot.sendMessage(chatId, 'Terjadi kesalahan.', { reply_markup: _mainKbd(saldo) }).catch(function() {});
  }
}

/* ── Pusat Bantuan ───────────────────────────────────────────── */
async function _showBantuan(chatId, saldo) {
  try {
    var store  = await _getStore();
    var appUrl = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')[0].trim()
      : null;

    var text =
      '<blockquote><b>🛒 Pusat Bantuan</b></blockquote>\n' +
      'Halo! Kami siap membantu kamu.\n\n' +
      '<b>Cara menghubungi kami:</b>\n' +
      '\u2022 Kunjungi website: ' + (appUrl || '-') + '\n' +
      '\u2022 Bot: @' + (_botInfo.username || '-') + '\n\n' +
      '<b>Pertanyaan Umum:</b>\n' +
      '\u2022 /start — Lihat informasi akun\n' +
      '\u2022 /saldo — Cek saldo kamu\n' +
      '\u2022 /stok — Lihat produk tersedia\n\n' +
      'Produk kami dikirim otomatis setelah pembayaran berhasil. ' +
      'Jika ada masalah dengan pesanan, hubungi admin via website.';

    await bot.sendMessage(chatId, text, {
      parse_mode   : 'HTML',
      reply_markup : _mainKbd(saldo),
    });
  } catch(e) {
    bot.sendMessage(chatId, 'Terjadi kesalahan.', { reply_markup: _mainKbd(saldo) }).catch(function() {});
  }
}

/* ── OTP ─────────────────────────────────────────────────────── */
async function _sendOtpMsg(chatId, code) {
  if (!bot) return;
  var store = await _getStore();
  await bot.sendMessage(chatId,
    'Kode Verifikasi ' + store.name + '\n\n' +
    'Kode OTP Anda: ' + code + '\n\n' +
    'Berlaku 5 menit. Jangan bagikan ke siapapun.'
  );
}

/* ══════════════════════════════════════════════════════════════
   PUBLIC API
   ══════════════════════════════════════════════════════════════ */
async function sendOtpDirect(chatId, code) {
  if (!bot) return false;
  try { await _sendOtpMsg(chatId, code); return true; }
  catch(e) { console.error('sendOtpDirect error:', e.message); return false; }
}

function getBot()       { return bot; }
function getBotStatus() {
  return {
    isOnline  : _botOnline,
    username  : _botInfo.username,
    firstName : _botInfo.firstName,
    id        : _botInfo.id,
  };
}

module.exports = { initBot, initBotFromDB, reinitBot, getBot, getBotStatus, sendOtpDirect };
