var _pgConnected   = false;  // apakah PayGomerch terhubung
var _pgHasKey      = false;  // apakah API key sudah diset
var _pgLastSync    = null;   // timestamp sync terakhir (localStorage)

// Ambil lastSync dari localStorage
function _getLastSync() {
  return localStorage.getItem('pg_last_sync') || null;
}
function _setLastSync() {
  var now = new Date().toLocaleString('id-ID', { hour12:false });
  localStorage.setItem('pg_last_sync', now);
  return now;
}
function _lastSyncLabel() {
  var t = _getLastSync();
  if (!t) return 'Belum pernah';
  return t;
}

// ── Renderer utama (async) ───────────────────────────────────
async function renderPaymentMethods() {
  const el = document.getElementById('pageContent');
  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Metode Pembayaran</div>
        <div class="page-subtitle">Kelola metode pembayaran yang tersedia di checkout</div>
      </div>
      <div class="page-actions">
        <span style="font-size:12px;color:var(--text-muted)">
          Sinkronisasi provider dilakukan dari halaman
          <a href="/admin/payment-gateway" onclick="navigate('payment-gateway'); return false;" style="color:var(--accent-light);cursor:pointer;text-decoration:underline;font-family:inherit;background:none;border:none;">Payment Gateway</a>
        </span>
      </div>
    </div>
    <div id="pmBody" style="padding-top:6px;"><div class="skeleton" style="height:520px;border-radius:16px;"></div></div>
  `;

  // Deteksi provider aktif
  var _activeProvider = localStorage.getItem('pg_active_provider') || 'paygomerch';
  window._pmActiveProvider = _activeProvider;

  if (_activeProvider === 'gatepay') {
    // Cek koneksi PayGomerch
    try {
      var apiBase = typeof API_BASE !== 'undefined' ? API_BASE : (window.location.origin + '/api');
      var gpCfg = await fetch(apiBase + '/admin/gatepay/settings', {
        headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('ramx_admin_token') || localStorage.getItem('ramx_token') || '') }
      });
      var gpData = await gpCfg.json();
      _pgHasKey = !!(gpData?.data?.hasKey);
      if (_pgHasKey) {
        try {
          var gpTest = await fetch(apiBase + '/admin/gatepay/test', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + (localStorage.getItem('ramx_admin_token') || localStorage.getItem('ramx_token') || '')
            }
          });
          _pgConnected = gpTest.ok;
          if (_pgConnected) _setLastSync();
        } catch(e) { _pgConnected = false; }
      } else { _pgConnected = false; }
    } catch(e) { _pgHasKey = false; _pgConnected = false; }
  } else {
    // Cek koneksi PayGomerch (existing behavior)
    try {
      var cfg = await api.payment.getSettings();
      _pgHasKey = !!(cfg?.data?.hasKey);
      if (_pgHasKey) {
        try {
          await api.payment.testConnection();
          _pgConnected = true;
          _setLastSync();
        } catch(e) { _pgConnected = false; }
      } else { _pgConnected = false; }
    } catch(e) { _pgHasKey = false; _pgConnected = false; }
  }

  _renderPMBody();
}

function _renderPMBody() {
  var methods = PAYMENT_METHODS;
  var total    = methods.length;
  var aktif    = methods.filter(function(m){ return m.active; }).length;
  var nonaktif = total - aktif;
  var lastSync = _lastSyncLabel();

  // Deteksi provider aktif untuk banner
  var _activeProv = window._pmActiveProvider || localStorage.getItem('pg_active_provider') || 'paygomerch';
  var _isGatePay  = _activeProv === 'gatepay';
  var _provName   = _isGatePay ? 'GatePay' : 'PayGomerch';
  var _provColor  = _isGatePay ? '#10b981' : '#818cf8';
  var _provBg     = _isGatePay ? 'rgba(16,185,129,.08),rgba(5,150,105,.05)' : 'rgba(99,102,241,.08),rgba(59,130,246,.05)';
  var _provBorder = _isGatePay ? 'rgba(16,185,129,.2)' : 'rgba(99,102,241,.2)';
  var _provIcon   = _isGatePay ? 'fa-bolt' : 'fa-building-columns';
  var _provIconBg = _isGatePay ? 'rgba(16,185,129,.15)' : 'rgba(99,102,241,.15)';

  // Status badge untuk banner
  var pgBadge = !_pgHasKey
    ? '<span style="font-size:11px;padding:3px 10px;border-radius:99px;background:rgba(251,146,60,.1);color:#fb923c;border:1px solid rgba(251,146,60,.25);font-weight:700;">⚠️ API Key Belum Diatur</span>'
    : _pgConnected
      ? '<span style="font-size:11px;padding:3px 10px;border-radius:99px;background:rgba(34,197,94,.1);color:#4ade80;border:1px solid rgba(34,197,94,.25);font-weight:700;">🔗 Terhubung</span>'
      : '<span style="font-size:11px;padding:3px 10px;border-radius:99px;background:rgba(239,68,68,.1);color:#f87171;border:1px solid rgba(239,68,68,.25);font-weight:700;">❌ Koneksi Gagal</span>';

  var html = `
    <!-- Provider Status Banner -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;
        background:linear-gradient(135deg,${_provBg});
        border:1px solid ${_provBorder};border-radius:14px;margin-top:4px;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:40px;height:40px;border-radius:10px;background:${_provIconBg};display:flex;align-items:center;justify-content:center;">
          <i class="fa-solid ${_provIcon}" style="color:${_provColor};font-size:16px;"></i>
        </div>
        <div>
          <div style="font-size:14px;font-weight:800;color:var(--text);">${_provName} · QRIS Gateway</div>
          <div style="font-size:12px;color:var(--text-muted);">Terakhir sync: <strong style="color:var(--text);">${lastSync}</strong></div>
        </div>
        ${pgBadge}
      </div>
      <div style="display:flex;gap:8px;">
        ${!_isGatePay ? `<button id="pgSyncBtn" onclick="pmSyncNow()" style="display:inline-flex;align-items:center;gap:7px;
            padding:8px 16px;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.25);
            border-radius:10px;color:#818cf8;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">
          <i class="fa-solid fa-rotate"></i> Sync Sekarang
        </button>` : `<button onclick="navigate('payment-transactions')" style="display:inline-flex;align-items:center;gap:7px;
            padding:8px 16px;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.25);
            border-radius:10px;color:#10b981;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">
          <i class="fa-solid fa-receipt"></i> Daftar Transaksi
        </button>`}
        <button onclick="navigate('payment-gateway')" style="display:inline-flex;align-items:center;gap:7px;
            padding:8px 16px;background:transparent;border:1px solid var(--border);
            border-radius:10px;color:var(--text-muted);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">
          <i class="fa-solid fa-key"></i> Pengaturan
        </button>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="pm-stats-row">
      <div class="pm-stat-card">
        <div class="pm-stat-icon blue"><i class="fa-solid fa-credit-card"></i></div>
        <div>
          <div class="pm-stat-label">Total Metode</div>
          <div class="pm-stat-value">${total}</div>
        </div>
      </div>
      <div class="pm-stat-card">
        <div class="pm-stat-icon green"><i class="fa-solid fa-circle-check"></i></div>
        <div>
          <div class="pm-stat-label">Aktif</div>
          <div class="pm-stat-value" style="color:var(--success)">${aktif}</div>
        </div>
      </div>
      <div class="pm-stat-card">
        <div class="pm-stat-icon red"><i class="fa-solid fa-circle-xmark"></i></div>
        <div>
          <div class="pm-stat-label">Nonaktif</div>
          <div class="pm-stat-value" style="color:var(--error)">${nonaktif}</div>
        </div>
      </div>
      <div class="pm-stat-card">
        <div class="pm-stat-icon purple"><i class="fa-solid fa-rotate"></i></div>
        <div>
          <div class="pm-stat-label">Terakhir Sync</div>
          <div class="pm-stat-value" style="font-size:14px;" id="pmLastSyncVal">${lastSync}</div>
        </div>
      </div>
    </div>

    <!-- Filter Row -->
    <div class="pm-filter-row">
      <div style="flex:1;min-width:200px;position:relative">
        <i class="fa-solid fa-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px"></i>
        <input type="text" class="form-control" placeholder="Cari nama atau kode..." style="padding-left:36px" id="pmSearch" oninput="filterPM()">
      </div>
      <!-- Selalu 2 kolom sejajar -->
      <div style="display:flex;gap:8px;flex:1;min-width:0;">
        <select class="form-control" style="flex:1;min-width:0;" id="pmGroupFilter" onchange="filterPM()">
          <option value="">Semua Group</option>
          <option value="qris">QRIS</option>
          <option value="saldo">Saldo</option>
        </select>
        <select class="form-control" style="flex:1;min-width:0;" id="pmStatusFilter" onchange="filterPM()">
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>
      <button class="btn btn-primary btn-sm" onclick="addPaymentMethod()" style="white-space:nowrap;">
        <i class="fa-solid fa-plus"></i> Tambah Metode
      </button>
    </div>

    <!-- Table -->
    <div class="card" style="padding:0;overflow:hidden;border-radius:12px">
      <div class="table-wrap" style="border-radius:0">
        <table class="data-table" id="pmTable">
          <thead>
            <tr>
              <th style="width:40px"><input type="checkbox" onclick="selectAllPM(this)" style="width:15px;height:15px;cursor:pointer"></th>
              <th>METODE PEMBAYARAN</th>
              <th>GROUP</th>
              <th>PROVIDER</th>
              <th>BIAYA</th>
              <th>MIN / MAX</th>
              <th>STATUS</th>
              <th>AKSI</th>
            </tr>
          </thead>
          <tbody id="pmTableBody">
            ${renderPMRows(PAYMENT_METHODS)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('pmBody').innerHTML = html;
}

// ── Sync sekarang ─────────────────────────────────────────────
async function pmSyncNow() {
  var btn = document.getElementById('pgSyncBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyinkronkan...'; }

  try {
    if (!_pgHasKey) {
      showToast('warning', 'API Key GatePay belum diatur. Silakan atur di Pengaturan.');
      navigate('payment-gateway');
      return;
    }
    await api.payment.testConnection();
    _pgConnected = true;
    var synced = _setLastSync();
    showToast('success', '✅ GatePay terhubung! Sync berhasil.');

    // Update UI tanpa full reload
    var lbl = document.getElementById('pmLastSyncVal');
    if (lbl) lbl.textContent = synced;

    // Re-render banner
    _renderPMBody();
  } catch(e) {
    _pgConnected = false;
    showToast('error', '❌ Gagal terhubung: ' + (e.message || 'Cek API Key di Pengaturan'));
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Sync Sekarang'; }
  }
}

// ── PM_META ───────────────────────────────────────────────────
const PM_META = {
  qris:     { icon:'fa-qrcode',           group:'QRIS',            groupColor:'var(--accent-light)', provider:'QRIS GatePay · GatePay', min:'-', max:'Rp 10.000.000' },
  transfer: { icon:'fa-building-columns', group:'Transfer Bank',   groupColor:'var(--info)',         provider:'BCA, Mandiri, BNI', min:'Rp 10.000', max:'Rp 50.000.000' },
  ewallet:  { icon:'fa-wallet',           group:'E-Wallet',        groupColor:'var(--purple)',       provider:'GoPay, OVO, ShopeePay, Dana', min:'-', max:'-' },
  va:       { icon:'fa-credit-card',      group:'Virtual Account', groupColor:'var(--warning)',      provider:'BCA, Mandiri, BNI', min:'Rp 10.000', max:'Rp 50.000.000' },
  balance:  { icon:'fa-coins',            group:'Saldo',           groupColor:'var(--success)',      provider:'Sistem', min:'-', max:'-' },
};

function renderPMRows(data) {
  if (!data || !data.length) return `
    <tr><td colspan="8">
      <div class="empty-state"><i class="fa-solid fa-credit-card"></i>
        <h3>Tidak ada metode pembayaran</h3><p>Tambahkan metode baru</p>
      </div>
    </td></tr>`;

  return data.map(function(m) {
    var meta     = PM_META[m.id] || { icon:'fa-circle-dot', group:m.id, groupColor:'var(--text-muted)', provider:'-', min:'-', max:'-' };
    var isActive = m.active;
    var statusBg = isActive ? 'var(--success-bg)' : 'var(--error-bg)';
    var statusCl = isActive ? 'var(--success)'    : 'var(--error)';
    var statusLb = isActive ? 'Aktif'             : 'Nonaktif';

    // Badge tambahan untuk QRIS sesuai provider aktif
    var pgBadgeExtra = '';
    if (m.id === 'qris') {
      var _activePg = window._pmActiveProvider || localStorage.getItem('pg_active_provider') || 'paygomerch';
      var _isGp = _activePg === 'gatepay';
      // Override provider text in PM_META for this render
      meta = Object.assign({}, meta, {
        provider: _isGp ? 'GatePay' : 'QRIS GatePay'
      });
      if (_pgConnected || _pgHasKey) {
        pgBadgeExtra = _isGp
          ? '<span style="margin-left:6px;font-size:9px;font-weight:800;padding:2px 7px;border-radius:99px;background:rgba(16,185,129,.12);color:#10b981;border:1px solid rgba(16,185,129,.25);">⚡ GATEPAY</span>'
          : '<span style="margin-left:6px;font-size:9px;font-weight:800;padding:2px 7px;border-radius:99px;background:rgba(34,197,94,.12);color:#4ade80;border:1px solid rgba(34,197,94,.25);">🔗 GATEPAY</span>';
      } else if (_pgHasKey) {
        pgBadgeExtra = '<span style="margin-left:6px;font-size:9px;font-weight:800;padding:2px 7px;border-radius:99px;background:rgba(239,68,68,.1);color:#f87171;border:1px solid rgba(239,68,68,.2);">⚠ GAGAL</span>';
      } else {
        pgBadgeExtra = '<span style="margin-left:6px;font-size:9px;font-weight:800;padding:2px 7px;border-radius:99px;background:rgba(251,146,60,.1);color:#fb923c;border:1px solid rgba(251,146,60,.25);">⚠ BELUM SETUP</span>';
      }
    }

    return '<tr>'
      + '<td><input type="checkbox" class="pm-checkbox" style="width:15px;height:15px;cursor:pointer"></td>'
      + '<td><div class="pm-method-cell">'
      +   '<div class="pm-icon-box"><i class="fa-solid ' + meta.icon + '"></i></div>'
      +   '<div><div class="pm-name">' + m.name + pgBadgeExtra + '</div>'
      +   '<div class="pm-code">' + m.id.toUpperCase() + '</div></div>'
      + '</div></td>'
      + '<td><span class="badge" style="background:' + meta.groupColor + '22;color:' + meta.groupColor + ';border:1px solid ' + meta.groupColor + '44">' + meta.group + '</span></td>'
      + '<td style="font-size:12px;color:var(--text-secondary)">' + meta.provider + '</td>'
      + '<td style="font-weight:700;color:var(--success)">' + m.fee + '</td>'
      + '<td style="font-size:12px;color:var(--text-muted)">' + meta.min + (meta.max !== '-' ? '<br>' + meta.max : '') + '</td>'
      + '<td>'
      +   '<div style="display:flex;align-items:center;gap:8px">'
      +     '<span style="background:' + statusBg + ';color:' + statusCl + ';padding:3px 9px;border-radius:99px;font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px">'
      +       '<span style="width:6px;height:6px;border-radius:50%;background:currentColor;display:inline-block"></span>' + statusLb
      +     '</span>'
      +     '<label class="switch"><input type="checkbox" ' + (isActive ? 'checked' : '') + ' onchange="togglePM(\'' + m.id + '\',this)"><span class="switch-track"></span></label>'
      +   '</div>'
      + '</td>'
      + '<td>'
      +   '<div class="action-btns">'
      +     '<button class="btn btn-outline btn-xs" onclick="editPaymentMethod(\'' + m.id + '\')"><i class="fa-solid fa-pen"></i> Edit</button>'
      +     '<button class="btn btn-ghost btn-icon" onclick="deletePM(\'' + m.id + '\')" title="Hapus"><i class="fa-solid fa-trash" style="font-size:12px;color:var(--error)"></i></button>'
      +   '</div>'
      + '</td>'
      + '</tr>';
  }).join('');
}

// ── Filter, Toggle, dll ──────────────────────────────────────
function filterPM() {
  var q  = (document.getElementById('pmSearch')?.value  || '').toLowerCase();
  var gs = (document.getElementById('pmGroupFilter')?.value  || '');
  var ss = (document.getElementById('pmStatusFilter')?.value || '');

  var filtered = PAYMENT_METHODS.filter(function(m) {
    var matchQ = !q  || m.name.toLowerCase().includes(q) || m.id.includes(q);
    var matchG = !gs || m.id === gs || (gs === 'bank' && m.id === 'transfer') || (gs === 'saldo' && m.id === 'balance');
    var matchS = !ss || (ss === 'active' ? m.active : !m.active);
    return matchQ && matchG && matchS;
  });

  var body = document.getElementById('pmTableBody');
  if (body) body.innerHTML = renderPMRows(filtered);
}

function togglePM(id, el) {
  var m = PAYMENT_METHODS.find(function(x){ return x.id === id || x._id === id; });
  if (m) {
    m.active = el.checked;
    showToast(el.checked ? 'success' : 'warning', m.name + (el.checked ? ' diaktifkan!' : ' dinonaktifkan!'));
    setTimeout(filterPM, 200);
    // Sync ke MongoDB
    if (typeof api !== 'undefined') {
      api.payment.toggleMethod(m._id || m.id, m.active)
        .catch(function(e){ console.warn('[pm] toggle error:', e.message); });
    }
  }
}

function selectAllPM(el) {
  document.querySelectorAll('.pm-checkbox').forEach(function(cb){ cb.checked = el.checked; });
}

function editPaymentMethod(id) {
  var m = PAYMENT_METHODS.find(function(x){ return x.id === id || x._id === id; });
  if (!m) return;
  openModal('Edit ' + m.name,
    '<div class="form-group"><label class="form-label">Nama Metode</label>'
    + '<input type="text" class="form-control" id="pmEditName" value="' + (m.name || '') + '"></div>'
    + '<div class="form-group"><label class="form-label">Biaya Admin</label>'
    + '<input type="text" class="form-control" id="pmEditFee" value="' + (m.fee || '') + '"></div>'
    + '<div class="form-group"><label class="form-label">Deskripsi</label>'
    + '<input type="text" class="form-control" id="pmEditDesc" value="' + (m.desc || '') + '"></div>'
    + '<div class="form-group"><label class="form-label">Min. Transaksi</label>'
    + '<input type="number" class="form-control" id="pmEditMin" value="' + (m.min || 0) + '" placeholder="0"></div>'
    + '<div class="form-group"><label class="form-label">Max. Transaksi</label>'
    + '<input type="number" class="form-control" id="pmEditMax" value="' + (m.max || 0) + '" placeholder="0"></div>',
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-primary" onclick="saveEditPM(\'' + (m._id || m.id) + '\')">Simpan</button>'
  );
}

function saveEditPM(id) {
  var name = (document.getElementById('pmEditName') || {}).value || '';
  var fee  = (document.getElementById('pmEditFee')  || {}).value || '';
  var desc = (document.getElementById('pmEditDesc') || {}).value || '';
  var min  = parseInt((document.getElementById('pmEditMin') || {}).value) || 0;
  var max  = parseInt((document.getElementById('pmEditMax') || {}).value) || 0;
  if (!name.trim()) { showToast('error', 'Nama metode wajib diisi!'); return; }

  // Update lokal
  var m = PAYMENT_METHODS.find(function(x){ return x._id === id || x.id === id; });
  if (m) { m.name = name; m.fee = fee; m.desc = desc; m.min = min; m.max = max; }
  closeModal();
  showToast('success', 'Metode pembayaran diperbarui!');
  renderPaymentMethods();

  // Sync ke MongoDB
  if (typeof api !== 'undefined') {
    api.payment.updateMethod(id, { name: name, fee: fee, desc: desc, min: min, max: max })
      .catch(function(e) { console.warn('[pm] update error:', e.message); });
  }
}

function addPaymentMethod() {
  openModal('Tambah Metode Pembayaran',
    '<div class="form-group"><label class="form-label">Nama Metode <span style="color:var(--error)">*</span></label>'
    + '<input type="text" class="form-control" id="pmAddName" placeholder="Contoh: Dana"></div>'
    + '<div class="form-group"><label class="form-label">Kode Metode <span style="color:var(--error)">*</span></label>'
    + '<input type="text" class="form-control" id="pmAddCode" placeholder="Contoh: DANA"></div>'
    + '<div class="form-group"><label class="form-label">Biaya Admin</label>'
    + '<input type="text" class="form-control" id="pmAddFee" placeholder="Contoh: 1% atau Rp 2.500"></div>'
    + '<div class="form-group"><label class="form-label">Provider</label>'
    + '<input type="text" class="form-control" id="pmAddProvider" placeholder="Nama provider..."></div>'
    + '<div class="form-group"><label class="form-label">Deskripsi</label>'
    + '<input type="text" class="form-control" id="pmAddDesc" placeholder="Deskripsi singkat..."></div>',
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-primary" onclick="saveAddPM()">Tambah</button>'
  );
}

function saveAddPM() {
  var name     = (document.getElementById('pmAddName')     || {}).value || '';
  var code     = (document.getElementById('pmAddCode')     || {}).value || '';
  var fee      = (document.getElementById('pmAddFee')      || {}).value || 'Gratis';
  var provider = (document.getElementById('pmAddProvider') || {}).value || 'Sistem';
  var desc     = (document.getElementById('pmAddDesc')     || {}).value || '';
  if (!name.trim()) { showToast('error', 'Nama metode wajib diisi!'); return; }
  if (!code.trim()) { showToast('error', 'Kode metode wajib diisi!'); return; }

  var newM = {
    id: 'pm_' + Date.now(), code: code.toUpperCase(), name: name,
    icon: 'fa-credit-card', group: 'Other', provider: provider,
    active: true, fee: fee, min: 0, max: 0, desc: desc, needsSetup: false,
  };

  // Update lokal
  PAYMENT_METHODS.push(newM);
  closeModal();
  showToast('success', 'Metode berhasil ditambahkan!');
  renderPaymentMethods();

  // Sync ke MongoDB
  if (typeof api !== 'undefined') {
    api.payment.createMethod(newM)
      .then(function(r) { if (r.success && r.data?._id) newM._id = r.data._id; })
      .catch(function(e) { console.warn('[pm] create error:', e.message); });
  }
}

function deletePM(id) {
  var m = PAYMENT_METHODS.find(function(x){ return x._id === id || x.id === id; });
  confirmAction('Hapus Metode',
    'Apakah Anda yakin ingin menghapus metode <strong>' + (m ? m.name : id) + '</strong>?',
    'confirmDeletePM(\'' + id + '\')', true
  );
}

function confirmDeletePM(id) {
  var m = PAYMENT_METHODS.find(function(x){ return x._id === id || x.id === id; });
  var idx = PAYMENT_METHODS.findIndex(function(x){ return x._id === id || x.id === id; });
  if (idx >= 0) PAYMENT_METHODS.splice(idx, 1);
  showToast('success', 'Metode berhasil dihapus!');
  renderPaymentMethods();

  // Sync ke MongoDB
  if (typeof api !== 'undefined' && m) {
    api.payment.deleteMethod(m._id || id)
      .catch(function(e) { console.warn('[pm] delete error:', e.message); });
  }
}
