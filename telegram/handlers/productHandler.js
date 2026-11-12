const { getActiveProducts, getProductById } = require('../services/productService');
const { getProductListKeyboard, getProductDetailKeyboard } = require('../keyboards/productKeyboard');
const { timeNowWIB } = require('../utils/dateHelper');
const formatRupiah = require('../utils/formatRupiah');

async function showProductList(ctx, page = 1) {
  try {
    const { products, totalPages } = await getActiveProducts(page);
    let msg = `<blockquote><b>🛒 Daftar Produk</b></blockquote>\n`;
    msg += `<i>Tekan <b>nomor produk</b> di bawah untuk lanjut.</i>\n\n`;
    products.forEach((p, i) => {
      msg += `${(page - 1) * 9 + i + 1}. ${p.name}\n`;
    });
    msg += `\n<i>Halaman ${page} dari ${totalPages || 1}</i>`;

    const kb = getProductListKeyboard(products, page, totalPages);

    if (ctx.callbackQuery) {
      try { await ctx.editMessageText(msg, { parse_mode: 'HTML', ...kb }); }
      catch (e) { if (!e.message.includes('not modified')) throw e; }
    } else {
      await ctx.reply(msg, { parse_mode: 'HTML', ...kb });
    }
  } catch (err) {
    console.error(err);
  }
}

async function showProductDetail(ctx, productId) {
  try {
    const product = await getProductById(productId);
    if (!product) return ctx.answerCbQuery('Produk tidak ditemukan', {show_alert: true});

    let msg = `<blockquote><b>${product.name}</b></blockquote>\n`;
    if (product.description) msg += `${product.description}\n`;
    msg += `\nTotal Terjual: <b>${(product.sold_count || 0).toLocaleString('id-ID')} pcs</b>\n\n`;
    msg += `<b>Produk Tersedia</b>\n`;

    product.variants.filter(v => v.showInBot && v.isActive).forEach(v => {
      const stok = v.stock === -1 ? '∞' : v.stock;
      msg += `• ${v.name} — <b>${formatRupiah(v.price)}</b> (${stok})\n`;
    });

    msg += `\n<i>↻ Diperbarui pada ${timeNowWIB()}</i>`;

    const kb = getProductDetailKeyboard(product);
    
    if (product.imageUrl) {
      if (ctx.callbackQuery && ctx.callbackQuery.message.photo) {
        try {
          await ctx.editMessageMedia({ type: 'photo', media: product.imageUrl, caption: msg, parse_mode: 'HTML' }, kb);
        } catch(e) { 
          if (!e.message.includes('not modified')) throw e;
        }
      } else {
        await ctx.replyWithPhoto(product.imageUrl, { caption: msg, parse_mode: 'HTML', ...kb });
      }
    } else {
      if (ctx.callbackQuery) {
        try { await ctx.editMessageText(msg, { parse_mode: 'HTML', ...kb }); }
        catch(e) { if (!e.message.includes('not modified')) throw e; }
      } else {
        await ctx.reply(msg, { parse_mode: 'HTML', ...kb });
      }
    }
  } catch (err) {
    console.error(err);
  }
}

module.exports = { showProductList, showProductDetail };
