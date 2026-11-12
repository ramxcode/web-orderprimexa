const { Markup } = require('telegraf');

async function showHistory(ctx) {
  const msg =
    `<blockquote><b>📋 Riwayat Transaksi</b></blockquote>\n` +
    `<i>Pilih kategori untuk dilihat</i>`;
  const kb = Markup.inlineKeyboard([
    [Markup.button.callback('Pesanan', 'ho:1'), Markup.button.callback('Deposit', 'hd:1')]
  ]);
  await ctx.reply(msg, { parse_mode: 'HTML', ...kb });
}

module.exports = { showHistory };
