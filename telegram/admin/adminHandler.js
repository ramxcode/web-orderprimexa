const { getAdminKeyboard } = require('../keyboards/adminKeyboard');
const adminProductHandler = require('./adminProductHandler');
const adminOrderHandler = require('./adminOrderHandler');
const adminUserHandler = require('./adminUserHandler');
const adminDepositHandler = require('./adminDepositHandler');
const adminStatsHandler = require('./adminStatsHandler');
const { getMainKeyboard } = require('../keyboards/mainKeyboard');

module.exports = (bot) => {
  bot.command('admin', async (ctx) => {
    await ctx.reply('Menu Admin:', getAdminKeyboard());
  });

  bot.hears('📦 Kelola Produk', adminProductHandler.listProducts);
  bot.hears('💰 Kelola Saldo', adminUserHandler.manageBalance);
  bot.hears('📋 Daftar Pesanan', adminOrderHandler.listOrders);
  bot.hears('💳 Daftar Deposit', adminDepositHandler.listDeposits);
  bot.hears('👥 Data User', adminUserHandler.listUsers);
  bot.hears('📊 Statistik', adminStatsHandler.showStats);
  bot.hears('🔙 Menu Utama', (ctx) => {
    ctx.reply('Kembali ke Menu Utama', getMainKeyboard(ctx.tgUser.balance));
  });

  adminProductHandler.registerCallbacks(bot);
  adminOrderHandler.registerCallbacks(bot);
  adminUserHandler.registerCallbacks(bot);
  adminDepositHandler.registerCallbacks(bot);
  adminStatsHandler.registerCallbacks(bot);
};
