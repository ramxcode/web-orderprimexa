require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// ── Guard: jangan start jika backend sudah mengelola bot ini ──────────────
// Ketika USE_TELEGRAF_BOT=true, backend/server.js sudah menjalankan bot
// via telegram/launcher.js. Menjalankan index.js secara bersamaan akan
// menyebabkan 409 Conflict (dua polling dengan token yang sama).
if (process.env.USE_TELEGRAF_BOT === 'true') {
  console.log('[telegram/index.js] USE_TELEGRAF_BOT=true → bot sudah dikelola backend. index.js tidak akan start.');
  process.exit(0);
}

const { Telegraf, session } = require('telegraf');
const mongoose = require('mongoose');

const botConfig = require('./config/botConfig');
const logger = require('./utils/logger');
const userMiddleware = require('./middleware/userMiddleware');
const adminMiddleware = require('./middleware/adminMiddleware');
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

const startHandler = require('./handlers/startHandler');
const menuHandler = require('./handlers/menuHandler');

const productCallbacks = require('./callbacks/productCallbacks');
const orderCallbacks = require('./callbacks/orderCallbacks');
const depositCallbacks = require('./callbacks/depositCallbacks');
const historyCallbacks = require('./callbacks/historyCallbacks');
const helpCallbacks = require('./callbacks/helpCallbacks');

const adminHandler = require('./admin/adminHandler');
const { createDeposit } = require('./services/depositService');
const formatRupiah = require('./utils/formatRupiah');
const { getDepositCheckKeyboard } = require('./keyboards/depositKeyboard');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || 'DUMMY_TOKEN');

bot.use(session());
bot.use(rateLimitMiddleware);
bot.use(userMiddleware);
errorMiddleware(bot);

bot.start(startHandler);
menuHandler(bot);

// Catching custom amount input
bot.on('text', async (ctx, next) => {
  if (ctx.session && ctx.session.awaitingDepositAmount) {
    ctx.session.awaitingDepositAmount = false;
    const amount = parseInt(ctx.message.text.replace(/\D/g, ''));
    if (isNaN(amount) || amount < 10000) {
      return ctx.reply('Nominal tidak valid. Minimal Rp 10.000');
    }
    try {
      const dep = await createDeposit(ctx.tgUser, amount);
      await ctx.replyWithPhoto(dep.qris_url, {
        caption: `Deposit QRIS\nNominal: ${formatRupiah(amount)}\nScan QR untuk membayar.`,
        ...getDepositCheckKeyboard(dep.deposit_id)
      });
    } catch(e) {
      await ctx.reply('Gagal buat QRIS.');
    }
    return;
  }
  return next();
});

productCallbacks(bot);
orderCallbacks(bot);
depositCallbacks(bot);
historyCallbacks(bot);
helpCallbacks(bot);

// Admin route
bot.use(bot.url(/^\/admin/i, adminMiddleware));
adminHandler(bot);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shop';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    logger.info('Connected to MongoDB');
    await botConfig.initBotConfig();
    bot.launch();
    logger.info('Telegram Bot is running');
  })
  .catch(err => logger.error('MongoDB connection error:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
