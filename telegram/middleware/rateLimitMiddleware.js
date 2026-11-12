const limitMap = new Map();

module.exports = async (ctx, next) => {
  if (!ctx.from) return next();
  const id = ctx.from.id;
  const now = Date.now();
  
  if (!limitMap.has(id)) {
    limitMap.set(id, { count: 1, resetAt: now + 60000 });
  } else {
    const data = limitMap.get(id);
    if (now > data.resetAt) {
      data.count = 1;
      data.resetAt = now + 60000;
    } else {
      data.count++;
      if (data.count > 30) {
        if (data.count === 31) {
          try { await ctx.reply('⚠️ Anda mengirim pesan terlalu cepat. Tunggu beberapa saat.'); } catch(e){}
        }
        return;
      }
    }
  }
  return next();
};
