const { getUserOrders } = require('../services/orderService');
const depService = require('../services/depositService');

module.exports = (bot) => {
  bot.action(/^ho:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const page = parseInt(ctx.match[1]);
    const { orders, totalPages } = await getUserOrders(ctx.from.id, page);
    let msg = `📦 <b>Riwayat Pesanan</b> (Hal ${page}/${totalPages||1})\n\n`;
    orders.forEach(o => {
      msg += `${o.order_id} - ${o.product_name} (${o.status})\n`;
    });
    try { await ctx.editMessageText(msg, { parse_mode: 'HTML' }); } catch(e){}
  });

  bot.action(/^hd:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const page = parseInt(ctx.match[1]);
    const { deposits, totalPages } = await depService.getUserDeposits(ctx.from.id, page);
    let msg = `💳 <b>Riwayat Deposit</b> (Hal ${page}/${totalPages||1})\n\n`;
    deposits.forEach(d => {
      msg += `${d.deposit_id} - Rp${d.amount} (${d.status})\n`;
    });
    try { await ctx.editMessageText(msg, { parse_mode: 'HTML' }); } catch(e){}
  });
};
