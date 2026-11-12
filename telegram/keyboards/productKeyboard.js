const { Markup } = require('telegraf');

function getProductListKeyboard(products, page, totalPages) {
  // Numbered buttons dalam grid, max 6 per baris — sesuai referensi
  const nums = products.map((p, i) =>
    Markup.button.callback(String((page - 1) * 9 + i + 1), `pd:${p._id}`)
  );

  // Susun dalam baris max 6 tombol
  const numRows = [];
  for (let i = 0; i < nums.length; i += 6) {
    numRows.push(nums.slice(i, i + 6));
  }

  // Navigasi halaman
  const nav = [];
  if (page > 1)          nav.push(Markup.button.callback('⬅️ Sebelumnya', `p:${page - 1}`));
  if (page < totalPages) nav.push(Markup.button.callback('Berikutnya ➡️', `p:${page + 1}`));
  if (nav.length > 0) numRows.push(nav);

  return Markup.inlineKeyboard(numRows);
}

function getProductDetailKeyboard(product) {
  const buttons = product.variants.filter(v => v.showInBot && v.isActive).map(v => {
    return [Markup.button.callback(`${v.name} - Rp ${v.price}`, `pv:${product._id}:${v._id}`)];
  });
  
  buttons.push([Markup.button.callback('↻ Muat Ulang', `pd:${product._id}`)]);
  buttons.push([Markup.button.callback('⬅️ Kembali', 'p:1')]);
  
  return Markup.inlineKeyboard(buttons);
}

module.exports = { getProductListKeyboard, getProductDetailKeyboard };
