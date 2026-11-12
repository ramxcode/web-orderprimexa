const log = (...args) => console.log('[TgBot]', ...args);
const info = (...args) => console.info('[TgBot] [INFO]', ...args);
const warn = (...args) => console.warn('[TgBot] [WARN]', ...args);
const error = (...args) => console.error('[TgBot] [ERROR]', ...args);

module.exports = { log, info, warn, error };
