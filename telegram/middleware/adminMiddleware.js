const { getConfig } = require('../services/configService');

module.exports = async (ctx, next) => {
  const config = getConfig();
  const userId = String(ctx.from.id);
  if (!config.adminIds.includes(userId)) {
    return ctx.reply('Akses ditolak.');
  }
  return next();
};
