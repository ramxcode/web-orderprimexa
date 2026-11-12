const { Markup } = require('telegraf');

async function showHelp(ctx) {
  const msg =
    `<blockquote><b>🛒 Pusat Bantuan</b></blockquote>\n` +
    `<i>Silakan hubungi admin kami untuk bantuan lebih lanjut.</i>`;
  const kb = Markup.inlineKeyboard([
    [Markup.button.callback('Pengaturan Bahasa', 'hlp:lang')],
    [Markup.button.callback('Hubungi Admin', 'hlp:cnt')]
  ]);
  if (ctx.callbackQuery) {
    try { await ctx.editMessageText(msg, { parse_mode: 'HTML', ...kb }); } catch(e){}
  } else {
    await ctx.reply(msg, { parse_mode: 'HTML', ...kb });
  }
}
module.exports = { showHelp };
