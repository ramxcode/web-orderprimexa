const { Markup } = require('telegraf');
const formatRupiah = require('../utils/formatRupiah');

function getMainKeyboard(balance) {
  return Markup.keyboard([
    ['Daftar Produk', `Saldo: ${formatRupiah(balance)}`],
    ['Riwayat Transaksi'],
    ['Produk Populer', 'Pusat Bantuan']
  ]).resize();
}

module.exports = { getMainKeyboard };
