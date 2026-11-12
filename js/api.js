const API_BASE = window.RAMX_CONFIG?.apiUrl || '/api';

const api = {
  _token() {
    return localStorage.getItem('ramx_token') || '';
  },

  _headers(isJson = true) {
    const h = {};
    if (isJson) h['Content-Type'] = 'application/json';
    const t = this._token();
    // Kirim Bearer sebagai fallback selama transisi — cookie httpOnly lebih diutamakan server
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  },

  async _req(method, path, body) {
    try {
      const res = await fetch(API_BASE + path, {
        method,
        headers: this._headers(),
        // credentials:'include' → browser kirim httpOnly cookie secara otomatis di setiap request
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.message || 'Request gagal');
        // Teruskan data server ke error agar bisa cek requiresVerification dll
        err.data = data;
        throw err;
      }
      return data;
    } catch(e) {
      throw e;
    }
  },

  get:    (path)        => api._req('GET',    path),
  post:   (path, body)  => api._req('POST',   path, body),
  put:    (path, body)  => api._req('PUT',    path, body),
  delete: (path)        => api._req('DELETE', path),

  // ── Auth ──────────────────────────────────────────────────
  auth: {
    register:      (data) => api.post('/auth/register', data),
    login:         (data) => api.post('/auth/login', data),
    me:            ()     => api.get('/auth/me'),
    sendOtp:       (data) => api.post('/auth/telegram/send-otp', data),
    verifyOtp:     (data) => api.post('/auth/telegram/verify-otp', data),
    verifyEmail:   (token)=> api.get('/auth/verify-email?token=' + encodeURIComponent(token)),
    resendVerification: (email) => api.post('/auth/resend-verification', { email }),
    async logout() {
      // Minta server hapus httpOnly cookie (JS tidak bisa hapus cookie httpOnly sendiri)
      try { await fetch(API_BASE + '/auth/logout', { method: 'POST', credentials: 'include' }); } catch(e) {}
      // Bersihkan juga data localStorage
      localStorage.removeItem('ramx_token');
      localStorage.removeItem('ramx_auth_user');
      localStorage.removeItem('ramx_remember');
      window.location.href = '/login';
    },
    setSession(token, user) {
      // Token disimpan untuk backward compat + UX (nama user di navbar)
      // Keamanan sesungguhnya kini dari httpOnly cookie yang di-set server
      if (token) localStorage.setItem('ramx_token', token);
      localStorage.setItem('ramx_auth_user', JSON.stringify(user));
    },
    getUser() {
      try { return JSON.parse(localStorage.getItem('ramx_auth_user') || 'null'); } catch(e){ return null; }
    },
    isLoggedIn() { return !!this.getUser(); },
    isAdmin()    { const u = this.getUser(); return u?.role === 'admin'; },
    updateProfile: (data)             => api.put('/auth/profile', data),
    changePassword: (data)            => api.put('/auth/change-password', data),
  },


  // ── Products ──────────────────────────────────────────────
  products: {
    list:   (params = '') => api.get('/products' + (params ? '?'+params : '')),
    get:    (id)          => api.get('/products/' + id),
    create: (data)        => api.post('/products', data),
    update: (id, data)    => api.put('/products/' + id, data),
    delete: (id)          => api.delete('/products/' + id),
  },

  // ── Orders ────────────────────────────────────────────────
  orders: {
    list:       (params = '') => api.get('/orders' + (params ? '?'+params : '')),
    track:      (id)          => api.get('/orders/track/' + id),
    create:     (data)        => api.post('/orders', data),
    setStatus:  (id, status)  => api.put('/orders/' + id + '/status', { status }),
    delete:     (id)          => api.delete('/orders/' + id),
  },

  // ── Config ────────────────────────────────────────────────
  config: {
    getAll:  ()           => api.get('/config'),
    get:     (key)        => api.get('/config/' + key),
    set:     (key, value) => api.put('/config/' + key, { value }),
    bulk:    (configs)    => api.post('/config/bulk', { configs }),
  },

  // ── Static Pages ─────────────────────────────────────────
  pages: {
    get:    (slug)        => api.get('/pages/' + slug),
    update: (slug, data)  => api.put('/pages/' + slug, data),
  },

  // ── Admin ─────────────────────────────────────────────────
  admin: {
    stats:          ()                => api.get('/admin/stats'),
    users:          (params = '')     => api.get('/admin/users' + (params ? '?'+params : '')),
    getUser:        (id)              => api.get('/admin/users/' + id),
    updateUser:     (id, data)        => api.put('/admin/users/' + id, data),
    deleteUser:     (id)              => api.delete('/admin/users/' + id),
    categories:     ()                => api.get('/admin/categories'),
    createCategory: (data)            => api.post('/admin/categories', data),
    updateCategory: (id, data)        => api.put('/admin/categories/' + id, data),
    deleteCategory: (id)              => api.delete('/admin/categories/' + id),
  },

  // ── Team Management ───────────────────────────────────────
  team: {
    users:  (params = '') => api.get('/admin/team/users' + (params ? '?'+params : '')),
    create: (data)        => api.post('/admin/team/users', data),
    update: (id, data)    => api.put('/admin/team/users/' + id, data),
    delete: (id)          => api.delete('/admin/team/users/' + id),
  },

  // ── Payment Gateway (PayGomerch) ──────────────────────────
  payment: {
    getSettings:       ()     => api.get('/admin/payment/settings'),
    saveSettings:      (data) => api.put('/admin/payment/settings', data),
    testConnection:    ()     => api.post('/admin/payment/test', {}),
    getTransactions:   ()     => api.post('/admin/payment/transactions', {}),
    generateQris:      (data) => api.post('/admin/payment/qris/generate', data),
    getQrisStatus:     (id)   => api.post('/admin/payment/qris/status', { transaction_id: id }),
    cancelQris:        (id)   => api.post('/admin/payment/qris/cancel', { transaction_id: id }),
  },
};

window.api = api;
