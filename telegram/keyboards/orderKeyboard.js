const { Markup } = require('telegraf');

function getOrderKeyboard(productId, variantId, qty) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('-10', `q:-10:${productId}:${variantId}`),
      Markup.button.callback('-1', `q:-1:${productId}:${variantId}`),
      Markup.button.callback(`x${qty}`, 'ignore'),
      Markup.button.callback('+1', `q:+1:${productId}:${variantId}`),
      Markup.button.callback('+10', `q:+10:${productId}:${variantId}`)
    ],
    [Markup.button.callback('✅ Bayar Dengan Saldo', `bs:${productId}:${variantId}:${qty}`)],
    [Markup.button.callback('✅ Bayar Dengan QRIS', `bq:${productId}:${variantId}:${qty}`)],
    [Markup.button.callback('↻ Muat Ulang', `pv:${productId}:${variantId}`), Markup.button.callback('⬅️ Kembali', `pd:${productId}`)]
  ]);
}

function getInsufficientBalanceKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('💰 Deposit', 'dep:custom')],
    [Markup.button.callback('⬅️ Kembali', 'p:1')]
  ]);
}

function getOrderConfirmKeyboard(depositId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔄 Cek Pembayaran', `dck:${depositId}`)],
    [Markup.button.callback('❌ Batalkan', `dcn:${depositId}`)]
  ]);
}

module.exports = { getOrderKeyboard, getInsufficientBalanceKeyboard, getOrderConfirmKeyboard };
