const TgUser = require('../models/TgUser');
const TgOrder = require('../models/TgOrder');
const formatRupiah = require('../utils/formatRupiah');

exports.showStats = async (ctx) => {
  const users = await TgUser.countDocuments();
  const orders = await TgOrder.countDocuments();
  const successOrders = await TgOrder.countDocuments({ status: 'success' });
  const agg = await TgOrder.aggregate([{$match:{status:'success'}}, {$group:{_id:null, total:{$sum:"$total_price"}}}]);
  const rev = agg.length > 0 ? agg[0].total : 0;
  
  const msg = `📊 <b>Statistik Bot</b>\n\nTotal User: ${users}\nTotal Order: ${orders}\nOrder Sukses: ${successOrders}\nRevenue: ${formatRupiah(rev)}`;
  await ctx.reply(msg, { parse_mode: 'HTML' });
};
exports.registerCallbacks = (bot) => {};
