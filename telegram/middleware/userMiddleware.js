const TgUser = require('../models/TgUser');

module.exports = async (ctx, next) => {
  if (ctx.from && !ctx.from.is_bot) {
    const user = await TgUser.findOrCreate(ctx.from);
    if (user.status === 'banned') {
      if (ctx.callbackQuery) await ctx.answerCbQuery('Akun Anda dibanned', { show_alert: true });
      else await ctx.reply('❌ Akun Anda telah dibanned.');
      return;
    }
    ctx.tgUser = user;
  }
  return next();
};
