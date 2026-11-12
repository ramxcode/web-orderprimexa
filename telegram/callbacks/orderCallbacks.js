const { getVariantById } = require('../services/productService');
const { createOrder } = require('../services/orderService');
const { getOrderKeyboard, getInsufficientBalanceKeyboard, getOrderConfirmKeyboard } = require('../keyboards/orderKeyboard');
const formatRupiah = require('../utils/formatRupiah');

const _processing = new Set();

module.exports = (bot) => {
  bot.action(/^q:([+-]\d+):(.+):(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const text = ctx.callbackQuery.message.caption || ctx.callbackQuery.message.text;
    const matchQty = text.match(/Qty:\s*(\d+)/);
    let qty = matchQty ? parseInt(matchQty[1]) : 1;
    qty += parseInt(ctx.match[1]);
    if (qty < 1) qty = 1;

    const pid = ctx.match[2];
    const vid = ctx.match[3];
    const variant = await getVariantById(pid, vid);
    if (!variant) return;

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

  bot.action(/^bs:(.+):(.+):(\d+)$/, async (ctx) => {
    const key = ctx.from.id + ':' + ctx.callbackQuery.id;
    if (_processing.has(key)) return ctx.answerCbQuery('Sedang diproses...');
    _processing.add(key);

    const pid = ctx.match[1];
    const vid = ctx.match[2];
    const qty = parseInt(ctx.match[3]);

    const res = await createOrder(ctx.tgUser, pid, vid, qty, 'balance');
    if (!res.success) {
      _processing.delete(key);
      if (res.error === 'Insufficient balance') {
        await ctx.answerCbQuery('Saldo tidak cukup!', {show_alert:true});
        try { await ctx.editMessageReplyMarkup(getInsufficientBalanceKeyboard().reply_markup); } catch(e){}
      } else {
        await ctx.answerCbQuery(res.error, {show_alert:true});
      }
      return;
    }

    await ctx.answerCbQuery('Pesanan Berhasil!');
    _processing.delete(key);
    try {
      await ctx.editMessageText(`✅ <b>Pesanan Sukses!</b>\nID: ${res.order.order_id}\nStatus: Processing`, { parse_mode: 'HTML' });
    } catch(e) {}
  });

  bot.action(/^bq:(.+):(.+):(\d+)$/, async (ctx) => {
    const key = ctx.from.id + ':' + ctx.callbackQuery.id;
    if (_processing.has(key)) return ctx.answerCbQuery('Sedang diproses...');
    _processing.add(key);

    const pid = ctx.match[1];
    const vid = ctx.match[2];
    const qty = parseInt(ctx.match[3]);

    const res = await createOrder(ctx.tgUser, pid, vid, qty, 'qris');
    if (!res.success) {
      _processing.delete(key);
      return ctx.answerCbQuery(res.error, {show_alert:true});
    }

    await ctx.answerCbQuery('Lanjut ke pembayaran QRIS');
    _processing.delete(key);
    
    try {
      const dep = res.deposit;
      await ctx.replyWithPhoto(dep.qris_url, { 
        caption: `Scan QRIS untuk membayar.\nTotal: ${formatRupiah(dep.amount)}`, 
        ...getOrderConfirmKeyboard(dep.deposit_id) 
      });
    } catch(e) {}
  });
};
