const TgUser = require('../models/TgUser');
const { Markup } = require('telegraf');
const helpHandler = require('../handlers/helpHandler');

module.exports = (bot) => {
  bot.action('hlp:lang', async (ctx) => {
    await ctx.answerCbQuery();
    const kb = Markup.inlineKeyboard([
      [Markup.button.callback('🇮🇩 Indonesia', 'lang:id'), Markup.button.callback('🇬🇧 English', 'lang:en')],
      [Markup.button.callback('⬅️ Kembali', 'hlp:back')]
    ]);
    try { await ctx.editMessageText('Pilih Bahasa:', kb); } catch(e){}
  });

  bot.action(/^lang:(.+)$/, async (ctx) => {
    const lang = ctx.match[1];
    ctx.tgUser.language = lang;
    await ctx.tgUser.save();
    await ctx.answerCbQuery('Bahasa diubah', {show_alert:true});
    await helpHandler.showHelp(ctx);
  });

  bot.action('hlp:cnt', async (ctx) => {
    await ctx.answerCbQuery();
    const kb = Markup.inlineKeyboard([
      [Markup.button.url('WhatsApp', 'https://wa.me/628123456789'), Markup.button.url('Telegram', 'https://t.me/admin')],
      [Markup.button.callback('⬅️ Kembali', 'hlp:back')]
    ]);
    try { await ctx.editMessageText('Hubungi Admin:', kb); } catch(e){}
  });

  bot.action('hlp:back', async (ctx) => {
    await ctx.answerCbQuery();
    await helpHandler.showHelp(ctx);
  });
};
