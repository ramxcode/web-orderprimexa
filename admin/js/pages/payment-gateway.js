function paymentTabs(active) {
  var tabs = [
    { key: 'payment-gateway',      icon: 'fa-key',     label: 'Pengaturan' },
    { key: 'payment-transactions', icon: 'fa-receipt',  label: 'Daftar Transaksi' },
  ];
  return '<div style="display:flex;gap:6px;margin-bottom:28px;background:var(--card-bg);border:1px solid var(--border);border-radius:12px;padding:5px;width:fit-content;">' +
    tabs.map(function(t) {
      var isActive = t.key === active;
      return '<button onclick="navigate(\'' + t.key + '\')" style="' +
        'display:inline-flex;align-items:center;gap:7px;padding:8px 18px;border-radius:8px;border:none;' +
        'font-size:13px;font-weight:' + (isActive ? '700' : '500') + ';font-family:inherit;cursor:pointer;transition:all .15s;' +
        (isActive ? 'background:var(--accent);color:#fff;' : 'background:transparent;color:var(--text-muted);') +
      '">' +
        '<i class="fa-solid ' + t.icon + '" style="font-size:12px;"></i>' + t.label +
      '</button>';
    }).join('') +
  '</div>';
}

// Status badge helper
function pgStatusBadge(status) {
  var map = {
    settlement: { bg: 'rgba(34,197,94,.12)', color: '#4ade80', border: 'rgba(34,197,94,.25)', label: 'Sukses' },
    pending:    { bg: 'rgba(251,146,60,.1)', color: '#fb923c', border: 'rgba(251,146,60,.25)', label: 'Pending' },
    expire:     { bg: 'rgba(156,163,175,.1)', color: '#9ca3af', border: 'rgba(156,163,175,.2)', label: 'Expired' },
    cancel:     { bg: 'rgba(239,68,68,.1)', color: '#f87171', border: 'rgba(239,68,68,.2)', label: 'Dibatalkan' },
  };
  var s = map[status] || { bg: 'rgba(255,255,255,.06)', color: 'var(--text-muted)', border: 'var(--border)', label: status || '-' };
  return '<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;background:' + s.bg + ';color:' + s.color + ';border:1px solid ' + s.border + ';">' + s.label + '</span>';
}

function pgFmt(amount) {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
}

// ── Provider Registry ────────────────────────────────────────
var PG_PROVIDERS = [
  { id:'paygomerch', name:'PayGomerch',          label:'PayGomerch (GoPay Merchant)', desc:'GoPay Merchant',  type:'QRIS', icon:'fa-qrcode', color:'#6366f1', docs:'https://pay-gomerch.web.id' },
  { id:'gatepay',    name:'GatePay', label:'GatePay',        desc:'QRIS GatePay', type:'QRIS', icon:'fa-bolt',   color:'#10b981', docs:'https://gatepay.biz.id' }
];

function _pgGetActive()   { return localStorage.getItem('pg_active_provider')  || 'paygomerch'; }
function _pgGetEditing()  { return localStorage.getItem('pg_editing_provider') || ''; }
function _pgGetGp()       { try { return JSON.parse(localStorage.getItem('gp_settings')||'{}'); } catch(e){ return {}; } }
function _pgSaveGp(d)     { localStorage.setItem('gp_settings', JSON.stringify(d)); }

function pgSetActiveProvider(val) {
  localStorage.setItem('pg_active_provider', val);
  var providerLabel = val === 'paygomerch' ? 'PayGomerch' : 'GatePay';
  showToast('success', 'Provider aktif diubah ke ' + providerLabel);

  // Simpan ke backend agar generate-qris tahu provider aktif
  try {
    var apiBase = typeof API_BASE !== 'undefined' ? API_BASE : (window.location.origin + '/api');
    fetch(apiBase + '/admin/payment/active-provider', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (localStorage.getItem('ramx_admin_token') || localStorage.getItem('ramx_token') || '')
      },
      body: JSON.stringify({ provider: val })
    }).catch(function(e) { console.warn('[PG] save active provider error:', e.message); });
  } catch(e) {}

  // Auto-rename metode QRIS di database sesuai provider aktif
  var newQrisName = val === 'gatepay' ? 'QRIS GatePay' : 'QRIS GoPay Merchant';
  api.payment.getMethods().then(function(res) {
    var methods = res.data || res.methods || [];
    var qris = methods.find(function(m) {
      return m.id === 'qris' || (m.name || '').toUpperCase().includes('QRIS');
    });
    if (!qris) return;
    api.payment.updateMethod(qris._id || qris.id, { name: newQrisName }).then(function() {
      // Update in-memory jika halaman payment-methods sudah dimuat
      if (typeof PAYMENT_METHODS !== 'undefined' && Array.isArray(PAYMENT_METHODS)) {
        var idx = PAYMENT_METHODS.findIndex(function(m) { return m.id === 'qris' || (m.name||'').toUpperCase().includes('QRIS'); });
        if (idx >= 0) PAYMENT_METHODS[idx].name = newQrisName;
      }
      showToast('info', 'Metode pembayaran diperbarui: ' + newQrisName);
    }).catch(function() {});
  }).catch(function() {});

  // Re-render halaman agar dropdown dan kartu terupdate
  renderPaymentSettings();
}

function pgEditProvider(id) {
  var cur = _pgGetEditing();
  localStorage.setItem('pg_editing_provider', cur === id ? '' : id);
  renderPaymentSettings();
}

function pgRemoveProvider(id) {
  if (!confirm('Hapus konfigurasi ' + id + '?')) return;
  if (id === 'gatepay') {
    localStorage.removeItem('gp_settings');
    if (_pgGetActive() === 'gatepay')   localStorage.setItem('pg_active_provider', 'paygomerch');
    if (_pgGetEditing() === 'gatepay')  localStorage.removeItem('pg_editing_provider');
    showToast('success', 'Konfigurasi GatePay dihapus');
    renderPaymentSettings();
  }
}

// ─────────────────────────────────────────────────────────────
// PAGE 1: PENGATURAN (multi-provider)
// ─────────────────────────────────────────────────────────────
async function renderPaymentSettings() {
  var el = document.getElementById('pageContent');
  el.innerHTML =
    '<h1 class="page-title">Payment Gateway</h1>' +
    '<p class="page-subtitle" style="margin-bottom:24px;">Pilih provider pembayaran untuk menerima transaksi dari customer</p>' +
    paymentTabs('payment-gateway') +
    '<div id="pgSettingsContent"><div class="skeleton" style="height:500px;border-radius:16px;"></div></div>';

  var pgData = {};
  try { var res = await api.payment.getSettings(); pgData = res.data || {}; } catch(e) {}
  // Ambil GatePay settings dari backend
  var gpData = _pgGetGp();
  try {
    var apiBase = typeof API_BASE !== 'undefined' ? API_BASE : (window.location.origin + '/api');
    var gpRes = await fetch(apiBase + '/admin/gatepay/settings', {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('ramx_admin_token') || localStorage.getItem('ramx_token') || '') }
    });
    if (gpRes.ok) { var gpJson = await gpRes.json(); if (gpJson.data) { gpData = gpJson.data; _pgSaveGp(gpData); } }
  } catch(e) {}

  // Auto-sync: pastikan provider aktif di localStorage tersimpan ke backend DB
  try {
    var _localProv = localStorage.getItem('pg_active_provider') || 'paygomerch';
    var apiBase2 = typeof API_BASE !== 'undefined' ? API_BASE : (window.location.origin + '/api');
    fetch(apiBase2 + '/admin/payment/active-provider', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (localStorage.getItem('ramx_admin_token') || localStorage.getItem('ramx_token') || '')
      },
      body: JSON.stringify({ provider: _localProv })
    }).catch(function() {});
  } catch(e) {}

  renderProviderPage(pgData, gpData);
}

function renderProviderPage(pgData, gpData) {
  gpData = gpData || _pgGetGp();
  var active  = _pgGetActive();
  var editing = _pgGetEditing();

  // Provider selector options
  var options = PG_PROVIDERS.map(function(p) {
    var cfg = p.id === 'paygomerch' ? pgData : gpData;
    var ok  = !!(cfg.hasKey || cfg.apiKey);
    return '<option value="' + p.id + '"' + (active === p.id ? ' selected' : '') + '>' +
      (p.label || p.name) + ' — ' + (ok ? '● Aktif' : '○ Belum Dikonfigurasi') +
    '</option>';
  }).join('');

  // Provider cards
  var cards = PG_PROVIDERS.map(function(p) {
    var cfg     = p.id === 'paygomerch' ? pgData : gpData;
    var ok      = !!(cfg.hasKey || cfg.apiKey);
    var isActive= active === p.id;
    var isEdit  = editing === p.id;
    return '<div class="card" style="padding:18px 20px;margin-bottom:12px;">' +
      '<div style="display:flex;align-items:center;gap:14px;">' +
        '<div style="width:42px;height:42px;border-radius:11px;background:' + p.color + '1a;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
          '<i class="fa-solid ' + p.icon + '" style="color:' + p.color + ';font-size:17px;"></i>' +
        '</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:15px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px;">' +
            p.name +
            (isActive
              ? '<span style="font-size:10px;font-weight:700;padding:2px 9px;border-radius:99px;background:rgba(74,222,128,.12);color:#4ade80;border:1px solid rgba(74,222,128,.25);">● Aktif</span>'
              : '') +
          '</div>' +
          '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">' +
            (p.desc ? 'Provider: ' + p.desc + ' &nbsp;·&nbsp; ' : '') +
            'Status auth: <span style="color:' + (ok ? '#4ade80' : '#fb923c') + ';font-weight:700;">' + (ok ? 'ok' : 'belum dikonfigurasi') + '</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:7px;flex-shrink:0;">' +
          (p.id === 'gatepay'
            ? '<button id="pgTestBtn" onclick="pgTestConnection()" style="display:inline-flex;align-items:center;gap:5px;padding:7px 13px;background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--text-muted);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;"><i class="fa-solid fa-rotate"></i> Sync</button>'
            : '<button onclick="pgTestGatePay()" style="display:inline-flex;align-items:center;gap:5px;padding:7px 13px;background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--text-muted);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;"><i class="fa-solid fa-plug"></i> Test</button>') +
          '<button onclick="pgEditProvider(\'' + p.id + '\')" style="display:inline-flex;align-items:center;gap:5px;padding:7px 13px;background:' + (isEdit ? 'var(--accent)' : 'transparent') + ';border:1px solid ' + (isEdit ? 'var(--accent)' : 'var(--border)') + ';border-radius:8px;color:' + (isEdit ? '#fff' : 'var(--text-muted)') + ';font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;"><i class="fa-solid fa-pen"></i> Edit</button>' +
          (p.id !== 'paygomerch'
            ? '<button onclick="pgRemoveProvider(\'' + p.id + '\')" style="display:inline-flex;align-items:center;gap:5px;padding:7px 13px;background:transparent;border:1px solid rgba(239,68,68,.3);border-radius:8px;color:#f87171;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;"><i class="fa-solid fa-trash"></i> Hapus</button>'
            : '') +
        '</div>' +
      '</div>' +
      // Expand form
      (isEdit
        ? '<div style="margin-top:18px;padding-top:18px;border-top:1px solid var(--border);">' +
            (p.id === 'paygomerch' ? pgPayGomercFormHTML(pgData) : pgGatePayFormHTML(gpData)) +
          '</div>'
        : '') +
    '</div>';
  }).join('');

  document.getElementById('pgSettingsContent').innerHTML =
    // Selector card
    '<div class="card" style="padding:22px;margin-bottom:20px;">' +
      '<div style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:4px;">Pilih Penyedia (Provider)</div>' +
      '<div style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">Hanya satu payment gateway yang aktif sebagai provider utama sekaligus.</div>' +
      '<label style="display:block;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">Provider Aktif</label>' +
      '<select onchange="pgSetActiveProvider(this.value)" style="width:100%;padding:11px 14px;background:var(--surface);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;font-family:inherit;outline:none;cursor:pointer;-webkit-appearance:none;appearance:none;background-image:url(\'data:image/svg+xml;utf8,<svg fill=\\\'%238b8fa8\\\' viewBox=\\\'0 0 20 20\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\'><path d=\\\'M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z\\\'/></svg>\');background-repeat:no-repeat;background-position:right 12px center;background-size:16px;padding-right:36px;">' + options.replace(/<option /g, '<option style="background:#1a1c28;color:#e2e4f0;" ') + '</select>' +
    '</div>' +
    // Provider list
    cards;
}


// ─────────────────────────────────────────────────────────────
// FORM: PayGomerch Settings (dipanggil via pgEditProvider)
// ─────────────────────────────────────────────────────────────
function pgPayGomercFormHTML(data) {
  var backendUrl = window.location.origin + '/api/admin/payment/webhook';
  return '<div style="max-width:700px;display:flex;flex-direction:column;gap:18px;">' +
    // API Key section
    '<div>' +
      '<div style="font-size:15px;font-weight:800;color:var(--text);margin-bottom:6px;display:flex;align-items:center;gap:9px;">' +
        '<i class="fa-solid fa-key" style="color:var(--accent);font-size:14px;"></i> API Key PayGomerch' +
      '</div>' +
      '<div style="font-size:12px;color:var(--text-muted);margin-bottom:14px;">Dapatkan dari <a href="https://gatepay.biz.id/dashboard" target="_blank" style="color:var(--accent);text-decoration:none;">dashboard GatePay</a> → Settings → API Key</div>' +
      (data.hasKey
        ? '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.2);border-radius:9px;margin-bottom:12px;font-size:13px;overflow:hidden;">' +
            '<i class="fa-solid fa-circle-check" style="color:#4ade80;flex-shrink:0;"></i>' +
            '<span style="font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">' + (data.apiKey||'••••••••••••••••') + '</span>' +
          '</div>'
        : '') +
      '<label style="display:block;font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:7px;text-transform:uppercase;letter-spacing:.4px;">' + (data.hasKey ? 'Ganti API Key (isi jika ingin mengganti)' : 'Masukkan API Key') + '</label>' +
      '<div style="position:relative;">' +
        '<input id="pgApiKeyInput" type="password" placeholder="agp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" style="width:100%;padding:11px 44px 11px 14px;background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:9px;color:var(--text);font-size:13px;font-family:monospace;outline:none;box-sizing:border-box;">' +
        '<button onclick="pgToggleKey()" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:transparent;border:none;color:var(--text-muted);cursor:pointer;">' +
          '<i id="pgKeyEye" class="fa-regular fa-eye" style="font-size:14px;"></i>' +
        '</button>' +
      '</div>' +
    '</div>' +
    // Buttons
    '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      '<button id="pgSaveBtn" onclick="pgSaveSettings()" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:var(--accent);border:none;border-radius:9px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;"><i class="fa-solid fa-floppy-disk"></i> Simpan API Key</button>' +
    '</div>' +
    // Webhook
    '<div style="border-top:1px solid var(--border);padding-top:16px;">' +
      '<div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:6px;"><i class="fa-solid fa-webhook" style="color:#8b5cf6;margin-right:8px;"></i>Webhook URL</div>' +
      '<div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">Daftarkan URL ini di dashboard GatePay untuk notifikasi real-time.</div>' +
      '<div style="display:flex;align-items:center;gap:10px;">' +
        '<input type="text" value="' + backendUrl + '" readonly style="flex:1;padding:10px 14px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:9px;color:var(--text);font-size:12px;font-family:monospace;outline:none;">' +
        '<button onclick="pgCopyWebhook(\'' + backendUrl + '\')" style="padding:9px 14px;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.25);border-radius:9px;color:#818cf8;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;"><i class="fa-regular fa-copy"></i> Salin</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

// Keep original renderSettingsForm for backward compat (called after save reload)
function renderSettingsForm(data) {
  renderProviderPage(data);
}

// ─────────────────────────────────────────────────────────────
// FORM: PayGomerch Settings (gatepay.biz.id)
// ─────────────────────────────────────────────────────────────
function pgGatePayFormHTML(data) {
  data = data || {};
  var s = data.settings || {};
  var webhookUrl = window.location.origin + '/api/admin/gatepay/webhook';
  return '<div style="max-width:700px;display:flex;flex-direction:column;gap:20px;">' +

    // Info Banner
    '<div style="padding:14px 16px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);border-radius:10px;font-size:13px;display:flex;align-items:flex-start;gap:10px;">' +
      '<i class="fa-solid fa-bolt" style="color:#10b981;margin-top:2px;flex-shrink:0;"></i>' +
      '<span style="color:var(--text-muted);">Payment gateway QRIS <a href="https://gatepay.biz.id" target="_blank" style="color:#10b981;font-weight:700;">GatePay</a>. Dapatkan API Key dari menu <strong style="color:var(--text);">Kredensial &amp; APK</strong> di dashboard GatePay.</span>' +
    '</div>' +

    // Section 1: API Key
    '<div class="card" style="padding:20px;">' +
      '<div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:4px;display:flex;align-items:center;gap:8px;"><i class="fa-solid fa-key" style="color:#10b981;"></i> API Key</div>' +
      '<div style="font-size:12px;color:var(--text-muted);margin-bottom:14px;">Format: <code style="background:rgba(255,255,255,.07);padding:2px 7px;border-radius:5px;font-size:11px;">gpk_live_xxxxxxxxxxxx</code></div>' +
      (data.hasKey
        ? '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.2);border-radius:9px;margin-bottom:12px;">' +
            '<i class="fa-solid fa-circle-check" style="color:#4ade80;flex-shrink:0;"></i>' +
            '<span style="font-size:13px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">' + (data.apiKey || '••••••••••••') + '</span>' +
          '</div>'
        : '') +
      '<label style="display:block;font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:7px;text-transform:uppercase;letter-spacing:.4px;">' + (data.hasKey ? 'Ganti API Key' : 'Masukkan API Key') + '</label>' +
      '<div style="position:relative;">' +
        '<input id="gpApiKey" type="password" placeholder="gpk_live_xxxxxxxxxxxx" style="width:100%;padding:11px 44px 11px 14px;background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:9px;color:var(--text);font-size:13px;font-family:monospace;outline:none;box-sizing:border-box;">' +
        '<button onclick="pgToggleGpKey()" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:transparent;border:none;color:var(--text-muted);cursor:pointer;"><i id="gpKeyEye" class="fa-regular fa-eye" style="font-size:14px;"></i></button>' +
      '</div>' +
      '<div style="margin-top:12px;display:flex;gap:10px;">' +
        '<button onclick="pgSaveGatePay()" style="display:inline-flex;align-items:center;gap:7px;padding:9px 18px;background:#10b981;border:none;border-radius:9px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;"><i class="fa-solid fa-floppy-disk"></i> Simpan API Key</button>' +
        '<button onclick="pgTestGatePay()" style="display:inline-flex;align-items:center;gap:7px;padding:9px 16px;background:transparent;border:1px solid var(--border);border-radius:9px;color:var(--text-muted);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;"><i class="fa-solid fa-plug"></i> Test Koneksi</button>' +
      '</div>' +
    '</div>' +

    // Webhook Secret
    '<div class="card" style="padding:20px;">' +
      '<div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:4px;display:flex;align-items:center;gap:8px;"><i class="fa-solid fa-shield-halved" style="color:#f59e0b;"></i> Webhook Secret</div>' +
      '<div style="font-size:12px;color:var(--text-muted);margin-bottom:14px;">Untuk verifikasi tanda tangan (HMAC) webhook. Ambil dari menu <strong style="color:var(--text);">Developer</strong> di dashboard GatePay.</div>' +
      '<label style="display:block;font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:7px;text-transform:uppercase;letter-spacing:.4px;">Webhook Secret</label>' +
      '<div style="position:relative;">' +
        '<input id="gpWebhookSecret" type="password" placeholder="whsec_xxxxxxxxxxxxxxxx" style="width:100%;padding:11px 44px 11px 14px;background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:9px;color:var(--text);font-size:13px;font-family:monospace;outline:none;box-sizing:border-box;">' +
        '<button onclick="var i=document.getElementById(\'gpWebhookSecret\');i.type=i.type===\'password\'?\'text\':\'password\';" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:transparent;border:none;color:var(--text-muted);cursor:pointer;"><i class="fa-regular fa-eye" style="font-size:14px;"></i></button>' +
      '</div>' +
      '<button onclick="pgSaveWebhookSecret()" style="margin-top:12px;display:inline-flex;align-items:center;gap:7px;padding:9px 18px;background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.3);border-radius:9px;color:#f59e0b;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;"><i class="fa-solid fa-floppy-disk"></i> Simpan Webhook Secret</button>' +
    '</div>' +

    // Alur Lengkap (sesuai docs terbaru)
    '<div class="card" style="padding:20px;">' +
      '<div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:8px;"><i class="fa-solid fa-route" style="color:#8b5cf6;"></i> Alur Pembayaran GatePay</div>' +
      '<ol style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:8px;">' +
        ['Customer checkout → sistem buat transaksi via <code style="background:rgba(255,255,255,.07);padding:1px 5px;border-radius:4px;">POST /api/qrisgatepay/v1/payments</code>',
         'Respons berisi <strong style="color:var(--text);">payment_link</strong> (checkout hosted) dan <strong style="color:var(--text);">qr_string</strong>',
         'Redirect customer ke <strong style="color:var(--text);">payment_link</strong> atau render sendiri <strong style="color:var(--text);">qr_string</strong> sebagai QR code',
         'Customer scan & bayar — QRIS aktif default 5 menit (atur via <code style="background:rgba(255,255,255,.07);padding:1px 5px;border-radius:4px;">expiry_minutes</code>)',
         'GatePay kirim webhook <code style="background:rgba(255,255,255,.07);padding:1px 5px;border-radius:4px;">payment.paid</code> ke URL webhook',
         'Sistem verifikasi HMAC signature & update status order',
        ].map(function(s) { return '<li style="font-size:13px;color:var(--text-muted);line-height:1.6;">' + s + '</li>'; }).join('') +
      '</ol>' +
    '</div>' +

  '</div>';
}

function pgToggleGpKey() {
  var inp = document.getElementById('gpApiKey');
  var ico = document.getElementById('gpKeyEye');
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  if (ico) ico.className = inp.type === 'password' ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
}

async function pgSaveGatePay() {
  var apiKey = (document.getElementById('gpApiKey')?.value || '').trim();
  if (!apiKey) { showToast('error', 'Masukkan API Key GatePay'); return; }
  try {
    var apiBase = typeof API_BASE !== 'undefined' ? API_BASE : (window.location.origin + '/api');
    var res = await fetch(apiBase + '/admin/gatepay/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (localStorage.getItem('ramx_admin_token') || localStorage.getItem('ramx_token') || '')
      },
      body: JSON.stringify({ apiKey })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.message);
    _pgSaveGp({ hasKey: true, apiKey: apiKey.slice(0,8) + '••••••••' + apiKey.slice(-4) });
    showToast('success', 'API Key GatePay berhasil disimpan!');
    renderPaymentSettings();
  } catch (e) {
    showToast('error', e.message || 'Gagal menyimpan API Key');
  }
}

async function pgSaveWebhookSecret() {
  var secret = (document.getElementById('gpWebhookSecret')?.value || '').trim();
  if (!secret) { showToast('error', 'Webhook Secret wajib diisi'); return; }
  try {
    var apiBase = typeof API_BASE !== 'undefined' ? API_BASE : (window.location.origin + '/api');
    var res = await fetch(apiBase + '/admin/gatepay/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (localStorage.getItem('ramx_admin_token') || localStorage.getItem('ramx_token') || '')
      },
      body: JSON.stringify({ apiKey: undefined, webhookSecret: secret })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.message);
    showToast('success', 'Webhook Secret GatePay berhasil disimpan!');
  } catch (e) {
    showToast('error', e.message || 'Gagal simpan Webhook Secret');
  }
}

async function pgTestGatePay() {
  showToast('info', 'Menguji koneksi ke GatePay...');
  try {
    var apiBase = typeof API_BASE !== 'undefined' ? API_BASE : (window.location.origin + '/api');
    var res = await fetch(apiBase + '/admin/gatepay/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (localStorage.getItem('ramx_admin_token') || localStorage.getItem('ramx_token') || '')
      }
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.message);
    showToast('success', data.message || 'Koneksi GatePay berhasil!');
  } catch (e) {
    showToast('error', e.message || 'Gagal koneksi ke GatePay');
  }
}

function pgToggleKey() {
  var inp  = document.getElementById('pgApiKeyInput');
  var icon = document.getElementById('pgKeyEye');
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  if (icon) icon.className = inp.type === 'password' ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
}

async function pgSaveSettings() {
  var key = (document.getElementById('pgApiKeyInput')?.value || '').trim();
  if (!key) { showToast('error', 'Masukkan API Key terlebih dahulu'); return; }

  var btn = document.getElementById('pgSaveBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

  try {
    await api.payment.saveSettings({ apiKey: key });
    showToast('success', 'API Key berhasil disimpan!');
    document.getElementById('pgApiKeyInput').value = '';
    // Reload page
    var res = await api.payment.getSettings();
    renderSettingsForm(res.data || {});
  } catch(e) {
    showToast('error', e.message || 'Gagal menyimpan');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan API Key';
  }
}

async function pgTestConnection() {
  var btn = document.getElementById('pgTestBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menguji...';
  try {
    var res = await api.payment.testConnection();
    showToast('success', res.message || 'Koneksi berhasil!');
  } catch(e) {
    showToast('error', e.message || 'Gagal konek ke PayGomerch');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-plug"></i> Test Koneksi';
  }
}

function pgCopyWebhook(url) {
  navigator.clipboard.writeText(url).then(function() {
    showToast('success', 'URL webhook disalin!');
  }).catch(function() {
    showToast('info', url);
  });
}

// ─────────────────────────────────────────────────────────────
// PAGE 2: DAFTAR TRANSAKSI
// ─────────────────────────────────────────────────────────────
var _pgTransactions = [];
var _pgFilter = 'all';

async function renderPaymentTransactions() {
  var provider = _pgGetActive();
  var providerName = provider === 'gatepay' ? 'GatePay' : 'PayGomerch';
  var el = document.getElementById('pageContent');
  el.innerHTML =
    '<h1 class="page-title">Daftar Transaksi</h1>' +
    '<p class="page-subtitle" style="margin-bottom:24px;">Riwayat transaksi <strong>' + providerName + '</strong> secara real-time</p>' +
    paymentTabs('payment-transactions') +
    '<div id="pgTxContent"><div class="skeleton" style="height:500px;border-radius:16px;"></div></div>';

  await pgLoadTransactions();
}

async function pgLoadTransactions() {
  var container = document.getElementById('pgTxContent');
  if (!container) return;

  var provider = _pgGetActive();

  try {
    var transactions = [];
    if (provider === 'gatepay') {
      // Ambil transaksi PayGomerch dari backend DB
      var apiBase = typeof API_BASE !== 'undefined' ? API_BASE : (window.location.origin + '/api');
      var gpRes = await fetch(apiBase + '/admin/gatepay/transactions', {
        headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('ramx_admin_token') || localStorage.getItem('ramx_token') || '') }
      });
      var gpJson = await gpRes.json();
      if (!gpRes.ok) throw new Error(gpJson.message || 'Gagal memuat transaksi GatePay');
      transactions = gpJson.data?.transactions || [];
    } else {
      // Ambil transaksi PayGomerch seperti biasa
      var res = await api.payment.getTransactions();
      transactions = (res.data?.transactions) || [];
    }
    _pgTransactions = transactions;
    renderTransactionTable(_pgTransactions);
  } catch(e) {
    container.innerHTML =
      '<div class="card" style="padding:30px;text-align:center;">' +
        '<i class="fa-solid fa-triangle-exclamation" style="font-size:32px;color:#f59e0b;margin-bottom:12px;display:block;"></i>' +
        '<div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:8px;">' + (e.message || 'Gagal memuat transaksi') + '</div>' +
        (e.message?.includes('belum diatur')
          ? '<button onclick="navigate(\'payment-gateway\')" style="margin-top:12px;padding:10px 20px;background:var(--accent);border:none;border-radius:10px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;"><i class="fa-solid fa-key"></i> Atur API Key</button>'
          : '<button onclick="pgLoadTransactions()" style="margin-top:12px;padding:10px 20px;background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--text-muted);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;"><i class="fa-solid fa-rotate-right"></i> Coba Lagi</button>'
        ) +
      '</div>';
  }
}

function renderTransactionTable(txList) {
  var container = document.getElementById('pgTxContent');
  if (!container) return;

  // Filter
  var filtered = _pgFilter === 'all' ? txList : txList.filter(function(t) { return t.status === _pgFilter; });

  // Stats
  var total      = txList.length;
  var success    = txList.filter(function(t){ return t.status === 'settlement'; }).length;
  var pending    = txList.filter(function(t){ return t.status === 'pending'; }).length;
  var totalAmnt  = txList.filter(function(t){ return t.status === 'settlement'; }).reduce(function(a,t){ return a + (t.amount||0); }, 0);

  container.innerHTML =
    // Summary cards
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:20px;">' +
      [
        { label:'Total Transaksi', val: total, icon:'fa-list', color:'#6366f1' },
        { label:'Sukses', val: success, icon:'fa-circle-check', color:'#4ade80' },
        { label:'Pending', val: pending, icon:'fa-clock', color:'#fb923c' },
        { label:'Total Pendapatan', val: pgFmt(totalAmnt), icon:'fa-wallet', color:'#10b981' },
      ].map(function(s) {
        return '<div class="card" style="padding:16px 18px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);">' + s.label + '</span>' +
            '<div style="width:32px;height:32px;border-radius:8px;background:' + s.color + '1a;display:flex;align-items:center;justify-content:center;">' +
              '<i class="fa-solid ' + s.icon + '" style="font-size:13px;color:' + s.color + ';"></i>' +
            '</div>' +
          '</div>' +
          '<div style="font-size:20px;font-weight:800;color:var(--text);">' + s.val + '</div>' +
        '</div>';
      }).join('') +
    '</div>' +

    // Filter + Refresh toolbar
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px;">' +
      '<div style="display:flex;gap:6px;background:var(--card-bg);border:1px solid var(--border);border-radius:10px;padding:4px;">' +
        [['all','Semua'],['settlement','Sukses'],['pending','Pending'],['expire','Expired'],['cancel','Dibatalkan']].map(function(f) {
          return '<button onclick="pgSetFilter(\'' + f[0] + '\')" style="padding:6px 14px;border-radius:7px;border:none;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .15s;' +
            (_pgFilter === f[0] ? 'background:var(--accent);color:#fff;' : 'background:transparent;color:var(--text-muted);') + '">' + f[1] + '</button>';
        }).join('') +
      '</div>' +
      '<button onclick="pgLoadTransactions()" style="display:inline-flex;align-items:center;gap:7px;padding:8px 16px;background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--text-muted);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">' +
        '<i class="fa-solid fa-rotate-right" style="font-size:12px;"></i> Refresh' +
      '</button>' +
    '</div>' +

    // Table
    '<div class="card" style="overflow:hidden;">' +
      (filtered.length === 0
        ? '<div style="padding:48px;text-align:center;">' +
            '<i class="fa-solid fa-receipt" style="font-size:36px;color:var(--text-muted);opacity:.4;display:block;margin-bottom:12px;"></i>' +
            '<div style="font-size:14px;color:var(--text-muted);">Tidak ada transaksi</div>' +
          '</div>'
        : '<div style="overflow-x:auto;">' +
            '<table style="width:100%;border-collapse:collapse;min-width:600px;">' +
              '<thead>' +
                '<tr style="border-bottom:1px solid var(--border);">' +
                  ['ID Transaksi','Waktu','Jumlah','Metode','Status','Issuer','Aksi'].map(function(h) {
                    return '<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);">' + h + '</th>';
                  }).join('') +
                '</tr>' +
              '</thead>' +
              '<tbody>' +
                filtered.map(function(tx) {
                  return '<tr style="border-bottom:1px solid var(--border);transition:background .15s;" onmouseover="this.style.background=\'rgba(255,255,255,.02)\'" onmouseout="this.style.background=\'\'">' +
                    '<td style="padding:14px 16px;"><span style="font-size:12px;font-family:monospace;color:var(--text);font-weight:600;">' + (tx.id||'-') + '</span></td>' +
                    '<td style="padding:14px 16px;font-size:12px;color:var(--text-muted);">' + (tx.time||'-') + '</td>' +
                    '<td style="padding:14px 16px;font-size:14px;font-weight:700;color:var(--text);">' + pgFmt(tx.amount) + '</td>' +
                    '<td style="padding:14px 16px;"><span style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:capitalize;">' + (tx.payment_type||'-') + '</span></td>' +
                    '<td style="padding:14px 16px;">' + pgStatusBadge(tx.status) + '</td>' +
                    '<td style="padding:14px 16px;font-size:12px;color:var(--text-muted);text-transform:capitalize;">' + (tx.issuer||'-') + '</td>' +
                    '<td style="padding:14px 16px;">' +
                      (tx.status === 'pending'
                        ? '<button onclick="pgCancelTx(\'' + tx.id + '\')" style="padding:5px 12px;background:transparent;border:1px solid rgba(239,68,68,.3);border-radius:7px;color:#f87171;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;">Batalkan</button>'
                        : '<span style="font-size:11px;color:var(--text-muted);">—</span>') +
                    '</td>' +
                  '</tr>';
                }).join('') +
              '</tbody>' +
            '</table>' +
          '</div>'
      ) +
    '</div>';
}

function pgSetFilter(f) {
  _pgFilter = f;
  renderTransactionTable(_pgTransactions);
}

async function pgCancelTx(txId) {
  if (!confirm('Batalkan transaksi ' + txId + '?')) return;
  try {
    await api.payment.cancelQris(txId);
    showToast('success', 'Transaksi berhasil dibatalkan');
    pgLoadTransactions();
  } catch(e) {
    showToast('error', e.message || 'Gagal membatalkan transaksi');
  }
}
