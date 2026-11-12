const TgDeposit = require('../models/TgDeposit');

exports.listDeposits = async (ctx) => {
  const deps = await TgDeposit.find().sort({created_at:-1}).limit(10);
  let msg = '10 Deposit Terbaru:\n\n';
  deps.forEach(d => {
    msg += `${d.deposit_id} - Rp${d.amount} - ${d.status}\n`;
  });
  await ctx.reply(msg);
};
exports.registerCallbacks = (bot) => {};
