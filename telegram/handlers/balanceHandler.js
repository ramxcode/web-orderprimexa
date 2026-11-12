const { getDepositKeyboard } = require('../keyboards/depositKeyboard');
const formatRupiah = require('../utils/formatRupiah');

async function showBalance(ctx) {
  const msg =
    `<blockquote><b>💳 Detail Saldo</b></blockquote>\n` +
    `Saldo Saat Ini: <b>${formatRupiah(ctx.tgUser.balance)}</b>\n\n` +
    `<i>Pilih nominal top up untuk lanjut</i>`;
  await ctx.reply(msg, { parse_mode: 'HTML', ...getDepositKeyboard() });
}

async function handleCustomAmount(ctx) {
  await ctx.reply('Silakan ketik nominal deposit (contoh: 50000)');
  ctx.session = ctx.session || {};
  ctx.session.awaitingDepositAmount = true;
}

module.exports = { showBalance, handleCustomAmount };
