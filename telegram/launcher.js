'use strict';
// telegram/launcher.js
// Menjalankan Telegraf Bot sebagai bagian dari proses backend.
// Tidak memanggil dotenv atau mongoose.connect (sudah dilakukan backend).
// Dipanggil dari backend/server.js setelah DB terkoneksi.

let _bot     = null;
let _started = false;

async function startTelegrafBot() {
  if (_started) return _bot;

  const logger = require('./utils/logger');

  try {
    const { Telegraf, session } = require('telegraf');

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || token.length < 20 || token.includes('xxxxxxx')) {
      logger.warn('[TgBot] TELEGRAM_BOT_TOKEN belum dikonfigurasi — bot tidak dijalankan.');
      return null;
    }

    const botConfig           = require('./config/botConfig');
    const userMiddleware      = require('./middleware/userMiddleware');
    const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');
    const errorMiddleware     = require('./middleware/errorMiddleware');
    const startHandler        = require('./handlers/startHandler');
    const menuHandler         = require('./handlers/menuHandler');
    const productCallbacks    = require('./callbacks/productCallbacks');
    const orderCallbacks      = require('./callbacks/orderCallbacks');
    const depositCallbacks    = require('./callbacks/depositCallbacks');
    const historyCallbacks    = require('./callbacks/historyCallbacks');
    const helpCallbacks       = require('./callbacks/helpCallbacks');
    const adminHandler        = require('./admin/adminHandler');
    const { createDeposit }   = require('./services/depositService');
    const formatRupiah        = require('./utils/formatRupiah');
    const { getDepositCheckKeyboard } = require('./keyboards/depositKeyboard');
    const { loadConfig, getConfig }   = require('./services/configService');

    // Init config dari MongoDB (DB sudah terkoneksi oleh backend)
    await loadConfig();
    logger.info('[TgBot] Config berhasil dimuat dari MongoDB.');

    _bot = new Telegraf(token);

    _bot.use(session());
    _bot.use(rateLimitMiddleware);
    _bot.use(userMiddleware);
    errorMiddleware(_bot);

    _bot.start(startHandler);
    menuHandler(_bot);

    // Handler teks bebas untuk input nominal deposit custom
    _bot.on('text', async (ctx, next) => {
      if (ctx.session && ctx.session.awaitingDepositAmount) {
        ctx.session.awaitingDepositAmount = false;
        const raw    = ctx.message.text.replace(/\D/g, '');
        const amount = parseInt(raw, 10);
        const cfg    = getConfig();
        const minDep = cfg.minDeposit || 10000;
        const maxDep = cfg.maxDeposit || 5000000;

        if (!raw || isNaN(amount) || amount < minDep) {
          return ctx.reply('Nominal tidak valid. Minimum deposit ' + formatRupiah(minDep));
        }
        if (amount > maxDep) {
          return ctx.reply('Melebihi batas maksimum deposit ' + formatRupiah(maxDep));
        }

        try {
          const dep = await createDeposit(ctx.tgUser, amount);
          await ctx.replyWithPhoto(dep.qris_url, {
            caption:
              '<b>TOP-UP TERKONFIRMASI</b>\n\n' +
              'Jenis: Top-Up Saldo\n' +
              'Nominal: <b>' + formatRupiah(amount) + '</b>\n' +
              'ID Transaksi: <code>' + dep.deposit_id + '</code>\n\n' +
              'Silakan scan QRIS di atas untuk menyelesaikan pembayaran.',
            parse_mode: 'HTML',
            reply_markup: getDepositCheckKeyboard(dep.deposit_id).reply_markup,
          });
        } catch(e) {
          logger.error('[TgBot] createDeposit error:', e.message);
          await ctx.reply('Gagal membuat QRIS. Silakan coba kembali.');
        }
        return;
      }
      return next();
    });

    productCallbacks(_bot);
    orderCallbacks(_bot);
    depositCallbacks(_bot);
    historyCallbacks(_bot);
    helpCallbacks(_bot);
    adminHandler(_bot);

    _bot.launch({ dropPendingUpdates: true });
    _started = true;

    logger.info('[TgBot] Telegraf Bot berhasil dijalankan menyatu dengan backend.');

    // Graceful shutdown — daftarkan hanya jika belum ada handler
    if (process.listenerCount('SIGINT') === 0) {
      process.once('SIGINT',  () => _bot && _bot.stop('SIGINT'));
    }
    if (process.listenerCount('SIGTERM') === 0) {
      process.once('SIGTERM', () => _bot && _bot.stop('SIGTERM'));
    }

    return _bot;

  } catch(err) {
    const logger = require('./utils/logger');
    logger.error('[TgBot] Gagal menjalankan Telegraf Bot:', err.message);
    _started = false;
    return null;
  }
}

function getTelegrafBot() { return _bot; }
function isBotStarted()   { return _started; }

module.exports = { startTelegrafBot, getTelegrafBot, isBotStarted };
