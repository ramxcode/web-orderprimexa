const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const PORT = process.env.FRONTEND_PORT || 5500;
const ROOT = __dirname;

// ── MIME types ────────────────────────────────────────────────
const MIME = {
  '.html'  : 'text/html; charset=utf-8',
  '.css'   : 'text/css; charset=utf-8',
  '.js'    : 'application/javascript; charset=utf-8',
  '.json'  : 'application/json; charset=utf-8',
  '.png'   : 'image/png',
  '.jpg'   : 'image/jpeg',
  '.jpeg'  : 'image/jpeg',
  '.gif'   : 'image/gif',
  '.svg'   : 'image/svg+xml',
  '.ico'   : 'image/x-icon',
  '.woff'  : 'font/woff',
  '.woff2' : 'font/woff2',
  '.ttf'   : 'font/ttf',
  '.webp'  : 'image/webp',
};

function getMime(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

// ── Security Headers ──────────────────────────────────────────
// Ditambahkan ke semua response HTML/static (bukan hanya /api/*)
// agar header tetap ada meski suatu hari tidak pakai tunnel proxy
function addSecurityHeaders(res) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://kit.fontawesome.com",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com https://ka-f.fontawesome.com",
    "font-src 'self' https://fonts.gstatic.com https://ka-f.fontawesome.com https://cdnjs.cloudflare.com data:",
    "img-src 'self' data: https:",
    "connect-src 'self' https: wss:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '));
}

function serveFile(res, filePath) {
  try {
    const content = fs.readFileSync(filePath);
    addSecurityHeaders(res);
    const mime = getMime(filePath);
    const headers = { 'Content-Type': mime };
    // Disable cache untuk HTML dan JS agar perubahan langsung berlaku
    if (mime.startsWith('text/html') || mime === 'application/javascript') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }
    res.writeHead(200, headers);
    res.end(content);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// ── Server ────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const parsed   = url.parse(req.url);
  const pathname = decodeURIComponent(parsed.pathname).replace(/\?.*$/, '');
  const filePath = path.join(ROOT, pathname);

  // 0. Proxy /api/* ke backend (localhost:5000)
  if (pathname.startsWith('/api/') || pathname === '/api') {
    // Forward IP asli client ke backend agar express-rate-limit bisa bedakan per-user
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const proxyHeaders = {
      ...req.headers,
      host: 'localhost:5000',
      'x-forwarded-for': clientIp,
      'x-real-ip': clientIp,
    };
    const options = {
      hostname : 'localhost',
      port     : process.env.BACKEND_PORT || 5000,
      path     : req.url,
      method   : req.method,
      headers  : proxyHeaders,
    };
    const proxy = http.request(options, (backendRes) => {
      res.writeHead(backendRes.statusCode, backendRes.headers);
      backendRes.pipe(res, { end: true });
    });
    proxy.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Backend tidak tersedia di port 5000' }));
    });
    req.pipe(proxy, { end: true });
    return;
  }

  // 1. Coba serve file langsung (CSS, JS, gambar, dll.)
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(res, filePath);
  }

  // 2. Coba serve index.html di dalam direktori
  const dirIndex = path.join(filePath, 'index.html');
  if (fs.existsSync(dirIndex)) {
    return serveFile(res, dirIndex);
  }

  // 3. SPA Fallback: /admin/* → /admin/index.html
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const adminIndex = path.join(ROOT, 'admin', 'index.html');
    if (fs.existsSync(adminIndex)) return serveFile(res, adminIndex);
  }

  // 4. Halaman frontend lain (login, register, dll.)
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length >= 1) {
    const sectionIndex = path.join(ROOT, parts[0], 'index.html');
    if (fs.existsSync(sectionIndex)) return serveFile(res, sectionIndex);
  }

  // 5. Root SPA fallback → index.html
  const rootIndex = path.join(ROOT, 'index.html');
  if (fs.existsSync(rootIndex)) return serveFile(res, rootIndex);

  // 6. 404
  addSecurityHeaders(res);
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end('<h1>404 - Not Found</h1><p>Path: ' + pathname + '</p>');

});

server.listen(PORT, () => {
  console.log('\n\uD83C\uDF10 Frontend Server berjalan!');
  console.log('   Local:   http://localhost:' + PORT);
  console.log('   Admin:   http://localhost:' + PORT + '/admin/dashboard');
  console.log('\n   Clean URL aktif \u2014 tidak ada # di URL!\n');
});
