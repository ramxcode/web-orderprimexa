const { createDeposit, checkDepositStatus } = require('../services/depositService');
const { getDepositCheckKeyboard } = require('../keyboards/depositKeyboard');
const TgDeposit = require('../models/TgDeposit');

module.exports = (bot) => {
  bot.action(/^dep:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const amount = parseInt(ctx.match[1]);
    try {
      const dep = await createDeposit(ctx.tgUser, amount);
      await ctx.replyWithPhoto(dep.qris_url, {
        caption: `Deposit QRIS\nNominal: Rp ${amount}\nScan QR untuk membayar.`,
        ...getDepositCheckKeyboard(dep.deposit_id)
      });
    } catch(e) {
      await ctx.reply('Gagal buat QRIS.');
    }
  });

  bot.action('dep:custom', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session = ctx.session || {};
    ctx.session.awaitingDepositAmount = true;
    await ctx.reply('Silakan ketik nominal deposit (contoh: 50000)');
  });

  bot.action(/^dck:(.+)$/, async (ctx) => {
    const depId = ctx.match[1];
    try {
      const dep = await checkDepositStatus(depId);
      if (dep.status === 'paid') {
        await ctx.answerCbQuery('Pembayaran Berhasil!', {show_alert:true});
        await ctx.editMessageCaption('✅ Deposit Berhasil ditambahkan ke saldo.');
      } else {
        await ctx.answerCbQuery('Belum dibayar atau pending.');
      }
    } catch(e) {
      await ctx.answerCbQuery('Gagal cek status');
    }
  });

  bot.action(/^dcn:(.+)$/, async (ctx) => {
    const depId = ctx.match[1];
    await ctx.answerCbQuery('Dibatalkan');
    try {
      await TgDeposit.updateOne({ deposit_id: depId }, { status: 'cancelled' });
      await ctx.editMessageCaption('❌ Deposit Dibatalkan.');
    } catch(e){}
  });
};
