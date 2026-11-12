const TgOrder = require('../models/TgOrder');
const { Markup } = require('telegraf');

exports.listOrders = async (ctx) => {
  const orders = await TgOrder.find().sort({created_at:-1}).limit(10);
  let msg = '10 Order Terbaru:\n\n';
  orders.forEach(o => {
    msg += `${o.order_id} - ${o.status}\n`;
  });
  await ctx.reply(msg);
};
exports.registerCallbacks = (bot) => {};
