const productHandler = require('../handlers/productHandler');
const { getProductById, getVariantById } = require('../services/productService');
const { getOrderKeyboard } = require('../keyboards/orderKeyboard');
const formatRupiah = require('../utils/formatRupiah');

module.exports = (bot) => {
  bot.action(/^p:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const page = parseInt(ctx.match[1]);
    await productHandler.showProductList(ctx, page);
  });

  bot.action(/^pd:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const id = ctx.match[1];
    await productHandler.showProductDetail(ctx, id);
  });

  bot.action(/^pv:(.+):(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const pid = ctx.match[1];
    const vid = ctx.match[2];
    const variant = await getVariantById(pid, vid);
    if (!variant) return;

    const qty = 1;
    const msg = `<b>Konfirmasi Pesanan</b>\n\nVariant: ${variant.name}\nHarga: ${formatRupiah(variant.price)}\nQty: ${qty}\nTotal: ${formatRupiah(variant.price * qty)}`;
    const kb = getOrderKeyboard(pid, vid, qty);
    
    try {
      if (ctx.callbackQuery.message.photo) {
        await ctx.editMessageCaption(msg, { parse_mode: 'HTML', ...kb });
      } else {
        await ctx.editMessageText(msg, { parse_mode: 'HTML', ...kb });
      }
    } catch(e) {}
  });
};
