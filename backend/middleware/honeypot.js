/**
 * honeypot.js — Jebakan untuk DDoS & Penetration Testing
 * Detects suspicious requests and:
 *  1. Returns convincing decoy responses (to waste attacker time)
 *  2. Sends Telegram alert to all admin accounts
 * Mount: app.use(honeypot) BEFORE all other routes in server.js
 */
'use strict';

const https = require('https');

// Cooldown per IP (avoid flooding Telegram)
const _notifCooldown = new Map(); // "ip|type" -> timestamp
const COOLDOWN_MS    = 60 * 1000; // 1 menit per IP per trap type

// DDoS rate tracker
const _ipHitCount  = new Map(); // ip -> { count, start }
const DDOS_WINDOW  = 10 * 1000; // 10 detik
const DDOS_THRESH  = 60;        // > 60 req/10s = suspicious

// ── Trap definitions ──────────────────────────────────────────────
const PATH_TRAPS = [
  { type: 'env-file',         rx: /^\/(\.env|env\.json|\.env\.\w+|config\.json|secrets?\.json)/i },
  { type: 'git-probe',        rx: /^\/(\.git|\.svn|\.hg)(\/|$)/i },
  { type: 'php-scanner',      rx: /\.(php|php3|php4|phtml|asp|aspx|jsp|cfm)(\?|$)/i },
  { type: 'admin-panel-scan', rx: /^\/(wp-admin|wp-login|xmlrpc\.php|phpmyadmin|adminer|cpanel|webmin)/i },
  { type: 'debug-info',       rx: /^\/(debug|actuator|server-status|server-info|_profiler|console)(\/|$)/i },
  { type: 'shell-probe',      rx: /\/(shell|cmd|backdoor|c99|r57|webshell)\b/i },
  { type: 'pentest-path',     rx: /^\/(test|scan|probe|hack|exploit|injection|payload|vuln|fuzz)(\/|$)/i },
  { type: 'aws-metadata',     rx: /\/(169\.254\.169\.254|metadata\.google\.internal)/i },
  { type: 'sys-file',         rx: /\/(etc\/passwd|etc\/shadow|proc\/self|windows\/system32)/i },
  { type: 'sqli-attempt',     rx: /\/(graphql|gql)(\?|$)/i },
];

const UA_TRAPS = [
  { type: 'scanner-ua', rx: /\b(sqlmap|nmap|masscan|nikto|dirbuster|gobuster|wfuzz|hydra|metasploit|acunetix|nessus|nuclei|ffuf|feroxbuster|dirb|wpscan|havij|shodan|censys)\b/i },
];

const BODY_TRAPS = [
  { type: 'sqli-attempt',   rx: /(\bunion\b.+\bselect\b|\bselect\b.+\bfrom\b|\bdrop\b.+\btable\b|--|;--|xp_cmdshell|information_schema)/i },
  { type: 'xss-attempt',    rx: /(<script|javascript:|onerror\s*=|onload\s*=|alert\s*\(|document\.cookie)/i },
  { type: 'path-traversal', rx: /(\.\.\/)|(\.\.\\)|(\.\.%2F)|(\.\.%5C)/i },
  { type: 'cmd-injection',  rx: /(\|\s*(ls|dir|cat|id|whoami|uname|cmd\.exe|\/bin\/sh|\/bin\/bash)|\$\()/i },
  { type: 'ssrf-attempt',   rx: /(file:\/\/|dict:\/\/|gopher:\/\/|http:\/\/(127\.0\.0\.1|localhost|169\.254|10\.|192\.168)\b)/i },
];

// ── Decoy responses ───────────────────────────────────────────────
function _decoy(type, res) {
  res.setHeader('X-Powered-By', 'PHP/7.4.3');
  res.setHeader('Server', 'Apache/2.4.41 (Ubuntu)');
  if (type === 'env-file') {
    return res.status(200).type('text/plain').send(
      'APP_ENV=production\nAPP_KEY=base64:FAKEKEYLOL_HoneypotActivated\nDB_PASSWORD=gotcha\nSECRET=you_got_trapped'
    );
  }
  if (type === 'debug-info') return res.status(200).json({ debug: false, version: '1.0.0', honeypot: true });
  if (type === 'sqli-attempt') return res.status(200).json({ errors: [{ message: 'Syntax error near SELECT' }] });
  if (type === 'aws-metadata') return res.status(200).type('text/plain').send('ami-id\nhostname\niam/\n');
  if (type === 'php-scanner') return res.status(200).type('text/html').send('<?php echo "Access denied"; ?>');
  return res.status(403).type('text/html').send('<html><body><h1>403 Forbidden</h1><p>Access denied.</p></body></html>');
}

// ── Telegram alert ────────────────────────────────────────────────
async function _sendAlert({ type, ip, method, path, ua, body }) {
  try {
    const Config = require('../models/Config');
    const User   = require('../models/User');
    const botCfg = await Config.findOne({ key: 'bot_settings' });
    const token  = (botCfg && botCfg.value && botCfg.value.token) || process.env.TELEGRAM_BOT_TOKEN;
    if (!token || token.includes('xxx')) return;

    const admins = await User.find({ role: 'admin', telegramChatId: { $exists: true, $ne: '' } }).select('telegramChatId').lean();
    if (!admins.length) return;

    // Format waktu: "2026-08-30 21:50:58" (YYYY-MM-DD HH:mm:ss)
    const d  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const pad = n => String(n).padStart(2, '0');
    const now = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate())
              + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());

    const uaShort  = (ua || '').slice(0, 200);
    const bodyLine = body ? ('\nBody: ' + String(body).slice(0, 100)) : '';

    // Format tepat seperti yang diinginkan — tanpa emoji, label bold, nilai plain
    const text =
      '*Honeypot Triggered*\n\n' +
      '*Trap:* ' + type + '\n' +
      '*IP:* ' + ip + '\n' +
      '*Method:* ' + method + '\n' +
      '*Path:* ' + path.slice(0, 150) + '\n' +
      '*UA:* ' + uaShort + bodyLine + '\n' +
      '*Time:* ' + now;

    for (const admin of admins) {
      try {
        const payload = JSON.stringify({ chat_id: admin.telegramChatId, text, parse_mode: 'Markdown' });
        await _tgPost(token, payload);
      } catch(e) {}
    }
  } catch(e) {
    console.error('[Honeypot] alert error:', e.message);
  }
}

function _tgPost(token, payload) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.telegram.org',
      path: '/bot' + token + '/sendMessage',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    };
    const req = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d)); });
    req.on('error', reject);
    req.write(payload); req.end();
  });
}

// ── Helpers ───────────────────────────────────────────────────────
function _ip(req) {
  return ((req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket?.remoteAddress || 'unknown';
}

function _ddosCheck(ip) {
  const now = Date.now();
  const e = _ipHitCount.get(ip) || { count: 0, start: now };
  if (now - e.start > DDOS_WINDOW) { _ipHitCount.set(ip, { count: 1, start: now }); return false; }
  e.count++; _ipHitCount.set(ip, e);
  return e.count > DDOS_THRESH;
}

function _cooldown(ip, type) {
  const key = ip + '|' + type;
  const last = _notifCooldown.get(key) || 0;
  if (Date.now() - last < COOLDOWN_MS) return false;
  _notifCooldown.set(key, Date.now());
  return true;
}

// ── Main middleware ───────────────────────────────────────────────
function honeypot(req, res, next) {
  const ip     = _ip(req);
  const method = req.method;
  const path   = req.path || req.url || '/';
  const ua     = req.headers['user-agent'] || '';

  // Skip health check
  if (path === '/health' || path === '/favicon.ico') return next();

  // 1. DDoS flood
  if (_ddosCheck(ip)) {
    if (_cooldown(ip, 'ddos-flood')) setImmediate(() => _sendAlert({ type: 'ddos-flood', ip, method, path, ua }));
    return setTimeout(() => { if (!res.headersSent) res.status(429).json({ error: 'Too Many Requests' }); }, 2000);
  }

  // 2. Path traps
  for (const t of PATH_TRAPS) {
    if (t.rx.test(path)) {
      if (_cooldown(ip, t.type)) setImmediate(() => _sendAlert({ type: t.type, ip, method, path, ua }));
      return _decoy(t.type, res);
    }
  }

  // 3. UA scanner
  for (const t of UA_TRAPS) {
    if (t.rx.test(ua)) {
      if (_cooldown(ip, t.type)) setImmediate(() => _sendAlert({ type: t.type, ip, method, path, ua }));
      return _decoy(t.type, res);
    }
  }

  // 4. Body/query injection
  let combined = JSON.stringify(req.query || {});
  if (['POST','PUT','PATCH'].includes(method)) {
    try { combined += ' ' + JSON.stringify(req.body || ''); } catch(e) {}
  }
  for (const t of BODY_TRAPS) {
    if (t.rx.test(combined)) {
      if (_cooldown(ip, t.type)) setImmediate(() => _sendAlert({ type: t.type, ip, method, path, ua, body: combined.slice(0, 200) }));
      return _decoy(t.type, res);
    }
  }

  next();
}

module.exports = honeypot;
