const { getFeaturedProducts } = require('../services/productService');

async function showPopular(ctx) {
  try {
    const products = await getFeaturedProducts(10);
    let msg = `<blockquote><b>🔥 PRODUK TERLARIS</b></blockquote>\n\n`;
    products.forEach((p, i) => {
      const terjual = (p.sold_count || 0).toLocaleString('id-ID');
      msg += `🏆 <b>${p.name}</b>\nTerjual: ${terjual} pcs\n\n`;
    });
    await ctx.reply(msg.trim(), { parse_mode: 'HTML' });
  } catch (err) {
    console.error(err);
  }
}

module.exports = { showPopular };
