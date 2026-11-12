const TgUser = require('../models/TgUser');

exports.listUsers = async (ctx) => {
  const users = await TgUser.find().sort({created_at:-1}).limit(10);
  let msg = '10 User Terbaru:\n\n';
  users.forEach(u => {
    msg += `${u.telegram_id} - ${u.first_name}\n`;
  });
  await ctx.reply(msg);
};

exports.manageBalance = async (ctx) => {
  await ctx.reply('Fitur tambah/kurang saldo. Silakan via DB atau fitur lengkap segera.');
};

exports.registerCallbacks = (bot) => {};
