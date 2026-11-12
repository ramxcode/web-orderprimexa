const { getMainKeyboard } = require('../keyboards/mainKeyboard');
const TgUser = require('../models/TgUser');
const TgOrder = require('../models/TgOrder');
const formatRupiah = require('../utils/formatRupiah');
const { formatDateWIB } = require('../utils/dateHelper');

module.exports = async (ctx) => {
  try {
    const user = ctx.tgUser;
    const totalUsers = await TgUser.countDocuments();
    const totalTx = await TgOrder.countDocuments();
    
    const msg =
      `Halo, ${user.first_name}\n` +
      `${formatDateWIB(new Date())}\n\n` +
      `<blockquote><b>Informasi Pengguna</b></blockquote>\n` +
      `ID Pengguna: <code>${user.telegram_id}</code>\n` +
      `Username: @${user.username || '-'}\n` +
      `Transaksi: ${formatRupiah(user.total_spending)}\n` +
      `Saldo: <b>${formatRupiah(user.balance)}</b>\n\n` +
      `<blockquote><b>Statistik Toko</b></blockquote>\n` +
      `Total Pengguna: ${totalUsers} Pengguna\n` +
      `Total Transaksi: ${totalTx} Transaksi\n\n` +
      `<blockquote><b>Pintasan Perintah</b></blockquote>\n` +
      `/start - Mulai bot\n` +
      `/saldo - Lihat Saldo\n` +
      `/stok - Lihat Stok`;


    const { getConfig, getBannerInput } = require('../services/configService');
    const banner = getBannerInput();
    if (banner) {
      await ctx.replyWithPhoto(banner, { caption: msg, parse_mode: 'HTML', ...getMainKeyboard(user.balance) });
    } else {
      await ctx.reply(msg, { parse_mode: 'HTML', ...getMainKeyboard(user.balance) });
    }
  } catch (err) {
    console.error(err);
    await ctx.reply('Terjadi kesalahan.');
  }
};
