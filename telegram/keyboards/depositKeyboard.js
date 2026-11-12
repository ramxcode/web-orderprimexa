const { Markup } = require('telegraf');

function getDepositKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('10.000', 'dep:10000'), Markup.button.callback('25.000', 'dep:25000')],
    [Markup.button.callback('50.000', 'dep:50000'), Markup.button.callback('100.000', 'dep:100000')],
    [Markup.button.callback('Nominal Lainnya', 'dep:custom')]
  ]);
}

function getDepositCheckKeyboard(depositId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔄 Cek Pembayaran', `dck:${depositId}`)],
    [Markup.button.callback('❌ Batalkan', `dcn:${depositId}`)]
  ]);
}

module.exports = { getDepositKeyboard, getDepositCheckKeyboard };
