const Product = require('../../backend/models/Product');
const { Markup } = require('telegraf');

exports.listProducts = async (ctx) => {
  const prods = await Product.find().limit(10);
  let kb = prods.map(p => [Markup.button.callback(`${p.isActive ? '✅' : '❌'} ${p.name}`, `ap:tog:${p._id}`)]);
  await ctx.reply('Kelola Produk:', Markup.inlineKeyboard(kb));
};

exports.registerCallbacks = (bot) => {
  bot.action(/^ap:tog:(.+)$/, async (ctx) => {
    const id = ctx.match[1];
    const p = await Product.findById(id);
    p.isActive = !p.isActive;
    await p.save();
    await ctx.answerCbQuery('Status diubah');
    exports.listProducts(ctx); // re-render
  });
};
