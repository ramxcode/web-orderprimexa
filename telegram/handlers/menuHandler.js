const productHandler = require('./productHandler');
const balanceHandler = require('./balanceHandler');
const historyHandler = require('./historyHandler');
const popularHandler = require('./popularHandler');
const helpHandler = require('./helpHandler');

module.exports = (bot) => {
  bot.hears('Daftar Produk', (ctx) => productHandler.showProductList(ctx));
  bot.hears(/^Saldo:/, (ctx) => balanceHandler.showBalance(ctx));
  bot.hears('Riwayat Transaksi', (ctx) => historyHandler.showHistory(ctx));
  bot.hears('Produk Populer', (ctx) => popularHandler.showPopular(ctx));
  bot.hears('Pusat Bantuan', (ctx) => helpHandler.showHelp(ctx));
};
