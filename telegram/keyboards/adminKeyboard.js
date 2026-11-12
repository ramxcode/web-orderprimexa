const { Markup } = require('telegraf');

function getAdminKeyboard() {
  return Markup.keyboard([
    ['📦 Kelola Produk', '💰 Kelola Saldo'],
    ['📋 Daftar Pesanan', '💳 Daftar Deposit'],
    ['👥 Data User', '📊 Statistik'],
    ['⚙️ Pengaturan', '🔙 Menu Utama']
  ]).resize();
}

module.exports = { getAdminKeyboard };
