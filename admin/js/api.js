/**
 * Admin API Client
 * Menghubungkan admin panel ke backend MongoDB secara realtime.
 * Semua CRUD tersimpan ke database — bukan ke static data.js.
 */

// ── Base URL ─────────────────────────────────────────────────
const API_BASE = (() => {
  const h = window.location.hostname;
  // Localhost: langsung ke backend port 5000
  if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:5000/api';
  // Devtunnel / production: gunakan proxy /api/* di server-frontend.js (port 5500)
  // sehingga tidak perlu akses devtunnel port 5000 secara langsung
  return window.location.origin + '/api';
})();

// ── Token helper ──────────────────────────────────────────────
function _getToken() {
  return localStorage.getItem('ramx_admin_token') ||
         localStorage.getItem('ramx_token') ||
         sessionStorage.getItem('ramx_token') || '';
}

// ── HTTP helper ───────────────────────────────────────────────
async function _req(method, path, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      // Bearer header dipertahankan sebagai fallback selama transisi ke cookie auth
      'Authorization': 'Bearer ' + _getToken(),
    },
    // credentials:'include' → browser kirim httpOnly cookie secara otomatis
    credentials: 'include',
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  let res;
  try {
    res = await fetch(API_BASE + path, opts);
  } catch (err) {
    throw new Error('Tidak bisa terhubung ke server: ' + err.message);
  }
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) throw new Error(data.message || 'Request gagal (' + res.status + ')');
  return data;
}


// ── API Object ────────────────────────────────────────────────
const api = {

  // ── Dashboard ──────────────────────────────────────────────
  dashboard: {
    getStats: () => _req('GET', '/admin/stats'),
  },

  // ── Database ────────────────────────────────────────────────
  database: {
    getStats: () => _req('GET', '/admin/database'),
  },

  // ── Pesanan ────────────────────────────────────────────────
  orders: {
    getAll:       (p = {})   => _req('GET',  '/orders?' + new URLSearchParams(p)),
    getById:      (id)       => _req('GET',  '/orders/' + id),
    updateStatus: (id, status) => _req('PUT', '/admin/orders/' + id + '/status', { status }),
  },

  // ── Pembayaran (PayGomerch + Methods) ──────────────────────
  payment: {
    // PayGomerch gateway
    getSettings:     ()       => _req('GET',  '/admin/payment/settings'),
    updateSettings:  (data)   => _req('PUT',  '/admin/payment/settings', data),
    saveSettings:    (data)   => _req('PUT',  '/admin/payment/settings', data), // alias updateSettings
    testConnection:  ()       => _req('POST', '/admin/payment/test'),
    getTransactions: (filter) => _req('POST', '/admin/payment/transactions', filter || {}),
    generateQris:    (data)   => _req('POST', '/admin/payment/qris/generate', data),
    qrisStatus:      (data)   => _req('POST', '/admin/payment/qris/status', data),
    qrisCancel:      (data)   => _req('POST', '/admin/payment/qris/cancel', data),
    cancelQris:      (data)   => _req('POST', '/admin/payment/qris/cancel', data), // alias qrisCancel

    // Payment methods CRUD (MongoDB)
    getMethods:    ()          => _req('GET',    '/admin/payment-methods'),
    createMethod:  (data)      => _req('POST',   '/admin/payment-methods', data),
    updateMethod:  (id, data)  => _req('PUT',    '/admin/payment-methods/' + id, data),
    deleteMethod:  (id)        => _req('DELETE', '/admin/payment-methods/' + id),
    toggleMethod:  (id, active) => _req('PUT',   '/admin/payment-methods/' + id + '/toggle', { active }),
  },

  // ── Produk ─────────────────────────────────────────────────
  products: {
    getAll:  (p = {}) => _req('GET',    '/products?' + new URLSearchParams(p)),
    getById: (id)     => _req('GET',    '/products/' + id),
    create:  (data)   => _req('POST',   '/products', data),
    update:  (id, data) => _req('PUT',  '/products/' + id, data),
    delete:  (id)     => _req('DELETE', '/products/' + id),
  },

  // ── Kategori ───────────────────────────────────────────────
  categories: {
    getAll:  ()          => _req('GET',    '/admin/categories'),
    create:  (data)      => _req('POST',   '/admin/categories', data),
    update:  (id, data)  => _req('PUT',    '/admin/categories/' + id, data),
    delete:  (id)        => _req('DELETE', '/admin/categories/' + id),
  },

  // ── Pelanggan ──────────────────────────────────────────────
  customers: {
    getAll:        (p = {}) => _req('GET', '/admin/users?' + new URLSearchParams({ ...p, role: 'customer' })),
    getById:       (id)     => _req('GET', '/admin/users/' + id),
    update:        (id, data) => _req('PUT', '/admin/users/' + id, data),
    updateBalance: (id, data) => _req('PUT', '/admin/users/' + id, data),
    delete:        (id)     => _req('DELETE', '/admin/users/' + id),
  },

  // ── Voucher ────────────────────────────────────────────────
  vouchers: {
    getAll:  ()           => _req('GET',    '/vouchers/admin'),
    create:  (data)       => _req('POST',   '/vouchers/admin', data),
    update:  (id, data)   => _req('PUT',    '/vouchers/admin/' + id, data),
    delete:  (id)         => _req('DELETE', '/vouchers/admin/' + id),
    toggle:  (id, active) => _req('PUT',    '/vouchers/admin/' + id, { isActive: active }),
    getPublic: ()         => _req('GET',    '/vouchers/public'),
    validate: (data)      => _req('POST',   '/vouchers/validate', data),
  },

  // ── Manajemen Tim ──────────────────────────────────────────
  team: {
    getAll:  (p = {}) => _req('GET',    '/admin/team/users?' + new URLSearchParams(p)),
    create:  (data)   => _req('POST',   '/admin/team/users', data),
    update:  (id, data) => _req('PUT',  '/admin/team/users/' + id, data),
    delete:  (id)     => _req('DELETE', '/admin/team/users/' + id),
  },

  // ── Konfigurasi ────────────────────────────────────────────
  config: {
    get:    (key)         => _req('GET', '/config/' + key),
    update: (key, value)  => _req('PUT', '/config/' + key, { value }),
    getAll: ()            => _req('GET', '/config'),
  },

  // ── Halaman Statis ─────────────────────────────────────────
  pages: {
    getAll:    ()          => _req('GET',    '/pages'),
    getBySlug: (slug)      => _req('GET',    '/pages/' + slug),
    create:    (data)      => _req('POST',   '/pages', data),
    update:    (id, data)  => _req('PUT',    '/pages/' + id, data),
    delete:    (id)        => _req('DELETE', '/pages/' + id),
  },

  // ── Akun Saya ──────────────────────────────────────────────
  account: {
    getProfile:     () =>     _req('GET', '/auth/me'),
    updateProfile:  (data) => _req('PUT', '/auth/profile', data),
    changePassword: (data) => _req('PUT', '/auth/change-password', data),
    uploadAvatar: function(formData) {
      // Kirim dengan credentials:'include' agar httpOnly cookie ikut dikirim
      // Authorization header tetap sebagai fallback selama transisi
      var token = localStorage.getItem('ramx_admin_token') || localStorage.getItem('ramx_token') || '';
      return fetch(API_BASE + '/auth/avatar', {
        method: 'POST',
        headers: token ? { 'Authorization': 'Bearer ' + token } : {},
        credentials: 'include',
        body: formData,
      }).then(function(r) {
        return r.json().then(function(json) {
          if (!r.ok || !json.success) throw new Error(json.message || 'Upload gagal');
          return json;
        });
      });
    },

  },

  // ── Bot Telegram ───────────────────────────────────────────
  bot: {
    getStatus:    ()           => _req('GET',  '/bot/status'),
    connect:      (token)      => _req('POST', '/bot/connect',   { token }),
    test:         (chatId)     => _req('POST', '/bot/test',      { chatId }),
    start:        ()           => _req('POST', '/bot/start'),
    stop:         ()           => _req('POST', '/bot/stop'),
    restart:      ()           => _req('POST', '/bot/restart'),
    getSettings:  ()           => _req('GET',  '/bot/settings'),
    saveSettings: (data)       => _req('POST', '/bot/settings',  data),
    getMessages:  ()           => _req('GET',  '/bot/messages'),
    saveMessages: (data)       => _req('POST', '/bot/messages',  data),
    getLogs:      ()           => _req('GET',  '/bot/logs'),
  },

  // ── Analitik ────────────────────────────────────────────────
  analytics: {
    getStats: (period, from, to) => {
      const p = new URLSearchParams({ period: period || 'year' });
      if (from) p.append('from', from);
      if (to)   p.append('to', to);
      return _req('GET', '/admin/analytics?' + p);
    },
  },

  // ── Stok Items ───────────────────────────────────────────────
  stockItems: {
    getAll:   (params = {}) => _req('GET',    '/admin/stock-items?' + new URLSearchParams(params)),
    create:   (data)        => _req('POST',   '/admin/stock-items', data),
    update:   (id, data)    => _req('PUT',    '/admin/stock-items/' + id, data),
    delete:   (id)          => _req('DELETE', '/admin/stock-items/' + id),
    bulkDelete: (ids)       => _req('POST',   '/admin/stock-items/bulk-delete', { ids }),
  },

};
