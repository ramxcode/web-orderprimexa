const logger = require('../utils/logger');

module.exports = (bot) => {
  bot.catch((err, ctx) => {
    logger.error(`Error for ${ctx.updateType}`, err);
    try {
      ctx.reply('❌ Terjadi kesalahan...').catch(() => {});
    } catch(e) {}
  });
};
