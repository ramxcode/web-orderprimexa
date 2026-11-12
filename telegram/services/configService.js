const Config = require('../../backend/models/Config');

let cachedConfig = {};

async function loadConfig() {
  const botSettings = await Config.findOne({ key: 'bot_settings' }) || { value: {} };
  const storeSettings = await Config.findOne({ key: 'store_settings' }) || { value: {} };

  cachedConfig = {
    storeName: storeSettings.value.storeName || 'Primexa',
    bannerUrl: botSettings.value.bannerUrl || '',
    adminIds: botSettings.value.adminIds || [],
    adminUsername: botSettings.value.adminUsername || '',
    adminWhatsapp: botSettings.value.adminWhatsapp || '',
    adminTelegram: botSettings.value.adminTelegram || '',
    minDeposit: botSettings.value.minDeposit || 10000,
    maxDeposit: botSettings.value.maxDeposit || 5000000,
    productsPerPage: botSettings.value.productsPerPage || 9,
    paygomerchApiKey: botSettings.value.paygomerchApiKey || storeSettings.value.paygomerchApiKey || process.env.PAYGOMERCH_API_KEY,
    paymentExpireMinutes: botSettings.value.paymentExpireMinutes || 30,
    defaultLanguage: botSettings.value.defaultLanguage || 'id'
  };
  return cachedConfig;
}

function getConfig() {
  return cachedConfig;
}

/**
 * Kembalikan input yang bisa diterima sendPhoto/replyWithPhoto Telegraf.
 * - URL biasa (http/https) → return as-is (string)
 * - base64 data URL (data:image/...) → convert ke Buffer { source: Buffer }
 * - Kosong → return null
 */
function getBannerInput() {
  const url = cachedConfig.bannerUrl;
  if (!url) return null;
  if (url.startsWith('data:')) {
    const matches = url.match(/^data:[^;]+;base64,(.+)$/);
    if (!matches) return null;
    return { source: Buffer.from(matches[1], 'base64') };
  }
  return url; // plain URL string
}

setInterval(loadConfig, 5 * 60 * 1000);

module.exports = { loadConfig, getConfig, getBannerInput };
