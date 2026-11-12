const { loadConfig, getConfig } = require('../services/configService');

module.exports = {
  initBotConfig: async () => {
    await loadConfig();
  },
  getBotConfig: () => {
    return getConfig();
  }
};
