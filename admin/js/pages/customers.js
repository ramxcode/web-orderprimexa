/* ============================================================
   CUSTOMERS.JS — Manajemen Pelanggan Admin
   ============================================================ */

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// LIST PAGE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function renderCustomers() {
  const el = document.getElementById('pageContent');
  el.innerHTML = `
  <div class="page-header">
    <div>
      <h1 class="page-title">Manajemen Pelanggan</h1>
      <p class="page-subtitle">Kelola data pelanggan/buyer toko Anda</p>
    </div>
  </div>

  <!-- Info Banner -->
  <div id="custBanner" style="display:none;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.22);border-radius:12px;padding:13px 18px;margin-bottom:20px;font-size:13px;color:#86efac;">
    <i class="fa-solid fa-circle-info" style="margin-right:6px;"></i><span id="custBannerText"></span>
  </div>

  <!-- Stats -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;" id="custStats">
    ${[1,2,3].map(()=>`<div class="skeleton" style="height:82px;border-radius:12px;"></div>`).join('')}
  </div>

  <!-- Search + Filters -->
  <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
    <div style="flex:1;min-width:220px;position:relative;">
      <i class="fa-solid fa-magnifying-glass" style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px;pointer-events:none;"></i>
      <input id="custSearch" type="text" placeholder="Cari nama, email, atau no. HP..."
        style="width:100%;padding:10px 14px 10px 36px;background:var(--card-bg);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;"
        oninput="filterCustomers()">
    </div>
    <select id="custStatusFilter" onchange="filterCustomers()"
      style="padding:10px 14px;background:var(--card-bg);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;cursor:pointer;outline:none;">
      <option value="">Semua Status</option>
      <option value="active">Aktif</option>
      <option value="inactive">Nonaktif</option>
    </select>
    <select id="custVerifFilter" onchange="filterCustomers()"
      style="padding:10px 14px;background:var(--card-bg);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;cursor:pointer;outline:none;">
      <option value="">Semua Verifikasi</option>
      <option value="verified">Terverifikasi</option>
      <option value="unverified">Belum Verifikasi</option>
    </select>
  </div>

  <!-- Table -->
  <div class="card" style="padding:0;overflow:hidden;">
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;min-width:780px;">
        <thead>
          <tr style="border-bottom:1px solid var(--border);">
            ${['Pelanggan','Pesanan','Saldo','Status','Verifikasi','Telegram','Terdaftar','Aksi'].map((h,i)=>`
            <th style="padding:13px ${i===0?'20px':'12px'};text-align:${[1,2,3,4,5].includes(i)?'center':i===7?'center':'left'};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);white-space:nowrap;">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody id="custTableBody">
          <tr><td colspan="8" style="padding:40px;text-align:center;">
            <div class="skeleton" style="height:44px;border-radius:8px;margin-bottom:10px;"></div>
            <div class="skeleton" style="height:44px;border-radius:8px;"></div>
          </td></tr>
        </tbody>
      </table>
    </div>
  </div>`;

  await loadCustomers();
}

let _allCustomers = [];

async function loadCustomers() {
  // Cek token dulu sebelum request
  const token = localStorage.getItem('ramx_token') || '';
  if (!token) {
    const tb = document.getElementById('custTableBody');
    const st = document.getElementById('custStats');
    if (st) st.innerHTML = '';
    if (tb) tb.innerHTML = `<tr><td colspan="8" style="padding:40px;text-align:center;">
      <div style="max-width:380px;margin:0 auto;">
        <div style="width:56px;height:56px;border-radius:16px;background:rgba(251,146,60,.12);border:1px solid rgba(251,146,60,.25);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
          <i class="fa-solid fa-lock" style="font-size:22px;color:#fb923c;"></i>
        </div>
        <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px;">Belum Login sebagai Admin</div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">Silakan login terlebih dahulu dengan akun admin untuk mengakses data pelanggan.</div>
        <a href="/login" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:var(--accent);border-radius:10px;color:#fff;font-size:13px;font-weight:700;text-decoration:none;">
          <i class="fa-solid fa-right-to-bracket"></i> Login Sekarang
        </a>
      </div>
    </td></tr>`;
    return;
  }

  try {
    const res = await api.customers.getAll({ limit: 100 });
    _allCustomers = Array.isArray(res.data) ? res.data : [];

    // Stats
    const total    = _allCustomers.length;
    const aktif    = _allCustomers.filter(u => u.isActive !== false).length;
    const verified = _allCustomers.filter(u => u.isVerified).length;

    // Gateway banner
    try {
      const gw = await api.config.getAll();
      const gwName = (gw.data || []).find(c => c.key === 'active_gateway')?.value || 'Default';
      const banner = document.getElementById('custBanner');
      document.getElementById('custBannerText').innerHTML =
        `Tambah saldo manual untuk pelanggan aktif. Gateway saat ini: <strong>${gwName}</strong>.`;
      if (banner) banner.style.display = '';
    } catch(e) {}

    // Render stats
    const statEl = document.getElementById('custStats');
    if (statEl) statEl.innerHTML = `
      ${custStatCard('#818cf8','fa-users','rgba(99,102,241,.15)',total,'Total Pelanggan')}
      ${custStatCard('#4ade80','fa-circle-check','rgba(34,197,94,.15)',aktif,'Aktif')}
      ${custStatCard('#a78bfa','fa-envelope-circle-check','rgba(167,139,250,.15)',verified,'Email Terverifikasi')}`;

    renderCustomerRows(_allCustomers);
  } catch(e) {
    const tb = document.getElementById('custTableBody');
    const isAuthErr = e.message && (e.message.includes('Token') || e.message.includes('401') || e.message.includes('Unauthorized') || e.message.includes('tidak ditemukan'));
    if (tb) {
      if (isAuthErr) {
        tb.innerHTML = `<tr><td colspan="8" style="padding:40px;text-align:center;">
          <div style="max-width:380px;margin:0 auto;">
            <div style="width:56px;height:56px;border-radius:16px;background:rgba(251,146,60,.12);border:1px solid rgba(251,146,60,.25);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
              <i class="fa-solid fa-shield-halved" style="font-size:22px;color:#fb923c;"></i>
            </div>
            <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px;">Sesi Login Habis</div>
            <div style="font-size:13px;color:var(--text-muted);margin-bottom:20px;">Token tidak valid atau sudah kadaluarsa. Silakan login ulang sebagai admin.</div>
            <a href="/login" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:var(--accent);border-radius:10px;color:#fff;font-size:13px;font-weight:700;text-decoration:none;">
              <i class="fa-solid fa-right-to-bracket"></i> Login Ulang
            </a>
          </div>
        </td></tr>`;
      } else {
        tb.innerHTML = `<tr><td colspan="8" style="padding:32px;text-align:center;color:var(--text-muted);">
          <i class="fa-solid fa-circle-exclamation" style="font-size:24px;display:block;margin-bottom:8px;color:#f87171;"></i>
          Gagal memuat: ${e.message}
        </td></tr>`;
      }
    }
  }
}


function custStatCard(color, icon, bg, value, label) {
  return `<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:12px;padding:18px 20px;display:flex;align-items:center;gap:14px;">
    <div style="width:44px;height:44px;border-radius:10px;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <i class="fa-solid ${icon}" style="color:${color};font-size:18px;"></i>
    </div>
    <div>
      <div style="font-size:26px;font-weight:800;color:var(--text);line-height:1;">${value}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:3px;">${label}</div>
    </div>
  </div>`;
}

function filterCustomers() {
  const q      = (document.getElementById('custSearch') ? document.getElementById('custSearch').value : '').toLowerCase();
  const status = document.getElementById('custStatusFilter') ? document.getElementById('custStatusFilter').value : '';
  const verif  = document.getElementById('custVerifFilter') ? document.getElementById('custVerifFilter').value : '';
  const list   = _allCustomers.filter(function(u) {
    var mQ = !q || (u.name||'').toLowerCase().indexOf(q)>-1 ||
               (u.email||'').toLowerCase().indexOf(q)>-1 || (u.phone||'').indexOf(q)>-1;
    var mS = !status || (status==='active' ? u.isActive!==false : u.isActive===false);
    var mV = !verif  || (verif==='verified' ? u.isVerified : !u.isVerified);
    return mQ && mS && mV;
  });
  renderCustomerRows(list);
}

// Store list for indexed access from inline handlers
window._custMap = {};

function renderCustomerRows(list) {
  const tbody = document.getElementById('custTableBody');
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="padding:40px;text-align:center;color:var(--text-muted);"><i class="fa-solid fa-users-slash" style="font-size:28px;display:block;margin-bottom:8px;opacity:.4;"></i>Tidak ada pelanggan</td></tr>';
    return;
  }

  // Store in map for safe access
  window._custMap = {};
  list.forEach(function(u) { window._custMap[u._id] = u; });

  var rows = list.map(function(u) {
    var ini   = custInitials(u.name);
    var color = custColor(u.name);
    var aktif = u.isActive !== false;
    var saldo = 'Rp ' + Number(u.balance||0).toLocaleString('id-ID');
    var tg    = u.telegramUsername ? ('@' + u.telegramUsername) : 'Belum';
    var tgl   = custTimeAgo(u.createdAt);
    var id    = u._id;

    var verifBadge = u.isVerified
      ? '<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);color:#4ade80;font-size:11px;font-weight:600;padding:3px 9px;border-radius:99px;white-space:nowrap;"><i class="fa-solid fa-circle-check" style="font-size:10px;"></i>Verified</span>'
      : '<span style="background:rgba(251,146,60,.12);border:1px solid rgba(251,146,60,.25);color:#fb923c;font-size:11px;font-weight:600;padding:3px 9px;border-radius:99px;">Belum</span>';

    var toggleBg    = aktif ? '#4ade80' : 'rgba(255,255,255,.15)';
    var thumbLeft   = aktif ? '20px' : '2px';

    return '<tr style="border-bottom:1px solid var(--border);transition:background .12s;" onmouseover="this.style.background=\'rgba(255,255,255,.025)\'" onmouseout="this.style.background=\'\'">' +
      '<td style="padding:13px 20px;">' +
        '<div style="display:flex;align-items:center;gap:11px;">' +
          '<div style="width:36px;height:36px;border-radius:10px;background:' + color + ';display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0;overflow:hidden;">' +
            (u.avatar
              ? '<img src="' + u.avatar + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\';this.parentElement.textContent=\'' + ini + '\'">'
              : ini) +
          '</div>' +
          '<div>' +
            '<div style="font-weight:600;font-size:14px;color:var(--text);">' + (u.name||'-') + '</div>' +
            '<div style="font-size:12px;color:var(--text-muted);">' + (u.email||'') + '</div>' +
            (u.phone ? '<div style="font-size:11px;color:var(--text-muted);">' + u.phone + '</div>' : '') +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td style="padding:13px 12px;text-align:center;font-weight:700;color:var(--text-muted);">' + (u.orderCount || 0) + '</td>' +
      '<td style="padding:13px 12px;text-align:center;font-size:13px;color:var(--text-muted);">' + saldo + '</td>' +
      '<td style="padding:13px 12px;text-align:center;">' +
        '<label style="position:relative;display:inline-block;width:40px;height:22px;cursor:pointer;">' +
          '<input type="checkbox" ' + (aktif ? 'checked' : '') + ' style="opacity:0;width:0;height:0;position:absolute;" onchange="toggleCustStatus(\'' + id + '\',this)">' +
          '<span id="trk-' + id + '" style="position:absolute;inset:0;border-radius:99px;transition:.2s;background:' + toggleBg + ';"></span>' +
          '<span id="thm-' + id + '" style="position:absolute;left:' + thumbLeft + ';top:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 1px 4px rgba(0,0,0,.3);"></span>' +
        '</label>' +
      '</td>' +
      '<td style="padding:13px 12px;text-align:center;">' + verifBadge + '</td>' +
      '<td style="padding:13px 12px;text-align:center;"><span style="font-size:12px;background:rgba(255,255,255,.06);padding:3px 9px;border-radius:99px;color:var(--text-muted);">' + tg + '</span></td>' +
      '<td style="padding:13px 12px;font-size:12px;color:var(--text-muted);white-space:nowrap;">' + tgl + '</td>' +
      '<td style="padding:13px 20px;">' +
        '<div style="display:flex;align-items:center;justify-content:center;gap:5px;">' +
          '<button onclick="navigate(\'customer-detail/' + id + '\')" title="Detail" style="' + custActionBtn() + '"><i class="fa-solid fa-eye" style="font-size:11px;"></i></button>' +
          '<button onclick="custEdit(\'' + id + '\')" title="Edit" style="' + custActionBtn('edit') + '"><i class="fa-solid fa-pen" style="font-size:11px;"></i></button>' +
          '<button onclick="custOpenSaldo(\'' + id + '\')" title="Atur Saldo" style="' + custActionBtn() + '"><i class="fa-solid fa-wallet" style="font-size:11px;"></i></button>' +
          '<button onclick="custDelete(\'' + id + '\')" title="Hapus" style="' + custActionBtn('danger') + '"><i class="fa-solid fa-trash" style="font-size:11px;"></i></button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  });
  tbody.innerHTML = rows.join('');
}

// Safe wrappers — read name & balance from _custMap
function custOpenSaldo(id) {
  var u = window._custMap[id];
  if (!u) return;
  openAturSaldo(u._id, u.name, u.balance||0);
}
function custDelete(id) {
  var u = window._custMap[id];
  if (!u) return;
  deleteCust(u._id, u.name);
}
function custEdit(id) {
  navigate('customer-edit/' + id);
}

function custActionBtn(type) {
  type = type || '';
  var base = 'width:28px;height:28px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:background .12s;font-family:inherit;font-size:11px;';
  if (type === 'danger') return base + 'background:transparent;border:1px solid rgba(239,68,68,.3);color:#f87171;';
  if (type === 'edit')   return base + 'background:transparent;border:1px solid rgba(99,102,241,.35);color:#818cf8;';
  return base + 'background:transparent;border:1px solid var(--border);color:var(--text-muted);';
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DETAIL PAGE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function renderCustomerDetail() {
  // Baca ID dari pathname: /admin/customer-detail/ID
  const parts = window.location.pathname.replace(/^\/admin\//, '').split('/');
  const id    = parts[1] || '';
  if (!id) { navigate('customers'); return; }

  const el = document.getElementById('pageContent');
  el.innerHTML = `
  <div class="page-header" style="margin-bottom:24px;">
    <div style="display:flex;align-items:center;gap:14px;">
      <button onclick="navigate('customers')" title="Kembali"
        style="width:36px;height:36px;border:1px solid var(--border);background:var(--card-bg);border-radius:10px;cursor:pointer;color:var(--text-muted);display:flex;align-items:center;justify-content:center;">
        <i class="fa-solid fa-arrow-left" style="font-size:13px;"></i>
      </button>
      <div>
        <h1 class="page-title" style="margin:0;">Detail Pelanggan</h1>
        <p class="page-subtitle" id="cdSubtitle" style="margin:0;">Memuat...</p>
      </div>
    </div>
    <div style="display:flex;gap:10px;">
      <button id="cdBtnSaldo" style="display:flex;align-items:center;gap:7px;padding:9px 18px;background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.3);border-radius:10px;color:#4ade80;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">
        <i class="fa-solid fa-wallet"></i>Atur Saldo
      </button>
      <button id="cdBtnEdit" style="display:flex;align-items:center;gap:7px;padding:9px 18px;background:var(--accent);border:none;border-radius:10px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">
        <i class="fa-solid fa-pen"></i>Edit
      </button>
    </div>
  </div>

  <div id="cdGrid" style="display:grid;grid-template-columns:320px 1fr;gap:20px;align-items:start;">
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div class="card" id="cdProfile" style="padding:28px 22px;text-align:center;">
        <div class="skeleton" style="width:72px;height:72px;border-radius:18px;margin:0 auto 14px;"></div>
        <div class="skeleton" style="height:18px;width:55%;margin:0 auto 8px;border-radius:6px;"></div>
        <div class="skeleton" style="height:13px;width:75%;margin:0 auto 24px;border-radius:6px;"></div>
        <div class="skeleton" style="height:160px;border-radius:8px;"></div>
      </div>
      <div class="card" id="cdStats"><div class="skeleton" style="height:100px;border-radius:8px;"></div></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div class="card" id="cdOrders"><div class="skeleton" style="height:180px;border-radius:8px;"></div></div>
      <div class="card" id="cdAudit"><div class="skeleton" style="height:100px;border-radius:8px;"></div></div>
    </div>
  </div>

  <!-- Modal Saldo -->
  <div id="modalSaldo" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;align-items:center;justify-content:center;backdrop-filter:blur(4px);">
    <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:20px;padding:28px;width:100%;max-width:460px;margin:16px;box-shadow:0 32px 80px rgba(0,0,0,.5);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
        <div>
          <div style="font-size:17px;font-weight:800;color:var(--text);">Penyesuaian Saldo Pelanggan</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:2px;" id="mSaldoName"></div>
        </div>
        <button onclick="closeModalSaldo()" style="width:30px;height:30px;border:1px solid var(--border);background:transparent;border-radius:8px;cursor:pointer;color:var(--text-muted);font-size:14px;flex-shrink:0;">âœ•</button>
      </div>
      <div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;padding:13px 16px;margin-bottom:16px;font-size:13px;color:var(--text-muted);">
        Saldo saat ini: <strong id="mSaldoCurrent" style="color:var(--text);">Rp 0</strong>
      </div>
      <label style="font-size:13px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:6px;">Saldo Akhir Buyer</label>
      <input type="number" id="mSaldoInput" min="0" value="0"
        style="width:100%;padding:12px 14px;background:var(--input-bg,rgba(255,255,255,.05));border:2px solid var(--accent);border-radius:10px;color:var(--text);font-size:16px;font-weight:700;font-family:inherit;outline:none;box-sizing:border-box;margin-bottom:6px;">
      <p style="font-size:12px;color:var(--text-muted);margin:0 0 14px;">Nilai ini adalah saldo akhir buyer. Sistem akan menghitung penambahan atau pengurangan secara otomatis.</p>
      <label style="font-size:13px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:6px;">Catatan</label>
      <textarea id="mSaldoCatatan" rows="3" placeholder="Opsional, untuk audit trail"
        style="width:100%;padding:11px 14px;background:var(--input-bg,rgba(255,255,255,.05));border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;outline:none;resize:vertical;box-sizing:border-box;margin-bottom:14px;"></textarea>
      <div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:10px;padding:12px 14px;margin-bottom:20px;font-size:12px;color:#86efac;">
        <strong>Catatan:</strong> Ubah nilai saldo di atas menjadi nilai akhir yang diinginkan. Sistem mencatat perbedaannya sebagai audit.
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button onclick="closeModalSaldo()" style="padding:10px 18px;background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--text-muted);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Batal</button>
        <button id="mSaldoBtn" onclick="simpanSaldo()" style="display:flex;align-items:center;gap:8px;padding:10px 20px;background:var(--accent);border:none;border-radius:10px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">
          <i class="fa-solid fa-floppy-disk"></i>Simpan Penyesuaian
        </button>
      </div>
    </div>
  </div>`;

  try {
    const res = await api.customers.getById(id);
    const u   = res.data;
    if (!u) throw new Error('Pelanggan tidak ditemukan');

    document.getElementById('cdSubtitle').textContent = u.name;
    document.getElementById('cdBtnSaldo').onclick = () => openAturSaldo(u._id, u.name, u.balance||0);
    document.getElementById('cdBtnEdit').onclick  = function() { navigate('customer-edit/' + u._id); };

    // Profile card
    const ini   = custInitials(u.name);
    const color = custColor(u.name);
    const join  = u.createdAt ? new Date(u.createdAt).toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '-';
    const last  = u.lastLogin ? new Date(u.lastLogin).toLocaleString('id-ID') : 'Belum pernah';
    document.getElementById('cdProfile').innerHTML = `
      <div style="width:72px;height:72px;border-radius:18px;background:${color};display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;color:#fff;margin:0 auto 14px;">${ini}</div>
      <div style="font-size:19px;font-weight:800;color:var(--text);margin-bottom:3px;">${u.name}</div>
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">${u.email||'-'}</div>
      ${u.isVerified
        ? `<div style="display:inline-flex;align-items:center;gap:5px;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);color:#4ade80;font-size:12px;font-weight:600;padding:5px 12px;border-radius:99px;margin-bottom:20px;"><i class="fa-solid fa-circle-check"></i>Email Terverifikasi</div>`
        : `<div style="display:inline-flex;align-items:center;gap:5px;background:rgba(251,146,60,.12);border:1px solid rgba(251,146,60,.25);color:#fb923c;font-size:12px;font-weight:600;padding:5px 12px;border-radius:99px;margin-bottom:20px;"><i class="fa-solid fa-triangle-exclamation"></i>Belum Diverifikasi</div>`}
      <div style="border-top:1px solid var(--border);padding-top:16px;text-align:left;">
        ${cdRow('No. HP', u.phone||'-')}
        ${cdRow('Saldo', `<span style="color:#4ade80;font-weight:700;">Rp ${Number(u.balance||0).toLocaleString('id-ID')}</span>`)}
        ${cdRow('Status', u.isActive!==false?`<span style="color:#4ade80;font-weight:600;">Aktif</span>`:`<span style="color:#f87171;font-weight:600;">Nonaktif</span>`)}
        ${cdRow('Terdaftar', join)}
        ${cdRow('Telegram', u.telegramUsername?`@${u.telegramUsername}`:'Belum terhubung')}
        ${cdRow('Login Terakhir', last)}
      </div>`;

    // Stats
    document.getElementById('cdStats').innerHTML = `
      <h3 style="font-size:15px;font-weight:700;margin:0 0 14px;">Statistik Pesanan</h3>
      ${cdStatRow('Total Pesanan', u.orderCount||0, 'var(--text)')}
      ${cdStatRow('Pesanan Selesai', u.completedOrders||0, '#4ade80')}
      ${cdStatRow('Total Belanja', 'Rp '+ Number(u.totalSpent||0).toLocaleString('id-ID'), '#818cf8')}`;

    // Orders
    const orders = u.recentOrders || [];
    document.getElementById('cdOrders').innerHTML = `
      <h3 style="font-size:15px;font-weight:700;margin:0 0 16px;">Pesanan Terakhir</h3>
      ${!orders.length
        ? `<div style="text-align:center;padding:32px;color:var(--text-muted);"><i class="fa-solid fa-cart-shopping" style="font-size:28px;display:block;margin-bottom:10px;opacity:.35;"></i>Belum ada pesanan</div>`
        : `<table style="width:100%;border-collapse:collapse;">
            <thead><tr style="border-bottom:1px solid var(--border);">
              ${['ORDER ID','PRODUK','TOTAL','STATUS','TANGGAL'].map(h=>`<th style="padding:9px 8px;text-align:left;font-size:10px;font-weight:700;letter-spacing:.5px;color:var(--text-muted);">${h}</th>`).join('')}
            </tr></thead>
            <tbody>${orders.map(o=>`
              <tr style="border-bottom:1px solid var(--border);">
                <td style="padding:10px 8px;font-size:12px;font-family:monospace;color:#818cf8;">#${(o._id||'').slice(-8).toUpperCase()}</td>
                <td style="padding:10px 8px;font-size:13px;color:var(--text);">${o.productId?.name||o.productName||'-'}</td>
                <td style="padding:10px 8px;font-size:13px;color:var(--text);">Rp ${Number(o.total||0).toLocaleString('id-ID')}</td>
                <td style="padding:10px 8px;"><span style="font-size:11px;padding:3px 8px;border-radius:99px;font-weight:600;background:${o.status==='completed'?'rgba(34,197,94,.12)':'rgba(251,146,60,.12)'};color:${o.status==='completed'?'#4ade80':'#fb923c'};">${o.status||'-'}</span></td>
                <td style="padding:10px 8px;font-size:12px;color:var(--text-muted);">${o.createdAt?new Date(o.createdAt).toLocaleDateString('id-ID'):'-'}</td>
              </tr>`).join('')}
            </tbody></table>`}`;

    // Audit
    document.getElementById('cdAudit').innerHTML = `
      <h3 style="font-size:15px;font-weight:700;margin:0 0 14px;">Audit Balance Terakhir</h3>
      <div style="text-align:center;padding:20px;color:var(--text-muted);">
        <i class="fa-solid fa-clock-rotate-left" style="font-size:22px;display:block;margin-bottom:8px;opacity:.35;"></i>
        Belum ada audit balance
      </div>`;

  } catch(e) {
    showToast('error', e.message || 'Gagal memuat data pelanggan');
    navigate('customers');
  }
}

function cdRow(label, value) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:13px;">
    <span style="color:var(--text-muted);">${label}</span>
    <span style="color:var(--text);font-weight:500;text-align:right;max-width:60%;">${value}</span>
  </div>`;
}

function cdStatRow(label, value, color) {
  return `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:14px;">
    <span style="color:var(--text-muted);">${label}</span>
    <span style="color:${color};font-weight:700;">${value}</span>
  </div>`;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ACTIONS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function toggleCustStatus(id, cb) {
  var isActive = cb.checked;
  var track = document.getElementById('trk-' + id);
  var thumb = document.getElementById('thm-' + id);
  if (track) track.style.background = isActive ? '#4ade80' : 'rgba(255,255,255,.15)';
  if (thumb) thumb.style.left = isActive ? '20px' : '2px';
  try {
    await api.customers.update(id, { isActive: isActive });
    var u = _allCustomers.find(function(x) { return x._id === id; });
    if (u) u.isActive = isActive;
    showToast('success', 'Pelanggan ' + (isActive ? 'diaktifkan' : 'dinonaktifkan'));
  } catch(e) {
    cb.checked = !isActive;
    if (track) track.style.background = !isActive ? '#4ade80' : 'rgba(255,255,255,.15)';
    if (thumb) thumb.style.left = !isActive ? '20px' : '2px';
    showToast('error', e.message || 'Gagal update status');
  }
}

let _saldoUserId = null, _saldoCurrent = 0;
function openAturSaldo(id, name, currentBalance) {
  _saldoUserId = id; _saldoCurrent = currentBalance;

  // Inject modal to body if not already in DOM (e.g. called from list page, not detail page)
  if (!document.getElementById('modalSaldo')) {
    var modalEl = document.createElement('div');
    modalEl.id = 'modalSaldo';
    modalEl.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
    modalEl.innerHTML =
      '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:20px;padding:28px;width:100%;max-width:460px;margin:16px;box-shadow:0 32px 80px rgba(0,0,0,.5);">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">' +
          '<div>' +
            '<div style="font-size:17px;font-weight:800;color:var(--text);">Penyesuaian Saldo Pelanggan</div>' +
            '<div style="font-size:13px;color:var(--text-muted);margin-top:2px;" id="mSaldoName"></div>' +
          '</div>' +
          '<button onclick="closeModalSaldo()" style="width:30px;height:30px;border:1px solid var(--border);background:transparent;border-radius:8px;cursor:pointer;color:var(--text-muted);font-size:14px;flex-shrink:0;">\u2715</button>' +
        '</div>' +
        '<div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;padding:13px 16px;margin-bottom:16px;font-size:13px;color:var(--text-muted);">' +
          'Saldo saat ini: <strong id="mSaldoCurrent" style="color:var(--text);">Rp 0</strong>' +
        '</div>' +
        '<label style="font-size:13px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:6px;">Saldo Akhir Buyer</label>' +
        '<input type="number" id="mSaldoInput" min="0" value="0" style="width:100%;padding:12px 14px;background:var(--input-bg,rgba(255,255,255,.05));border:2px solid var(--accent);border-radius:10px;color:var(--text);font-size:16px;font-weight:700;font-family:inherit;outline:none;box-sizing:border-box;margin-bottom:6px;">' +
        '<p style="font-size:12px;color:var(--text-muted);margin:0 0 14px;">Nilai ini adalah saldo akhir buyer. Sistem akan menghitung penambahan atau pengurangan secara otomatis.</p>' +
        '<label style="font-size:13px;font-weight:600;color:var(--text-muted);display:block;margin-bottom:6px;">Catatan</label>' +
        '<textarea id="mSaldoCatatan" rows="3" placeholder="Opsional, untuk audit trail" style="width:100%;padding:11px 14px;background:var(--input-bg,rgba(255,255,255,.05));border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;outline:none;resize:vertical;box-sizing:border-box;margin-bottom:14px;"></textarea>' +
        '<div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:10px;padding:12px 14px;margin-bottom:20px;font-size:12px;color:#86efac;">' +
          '<strong>Catatan:</strong> Ubah nilai saldo di atas menjadi nilai akhir yang diinginkan. Sistem mencatat perbedaannya sebagai audit.' +
        '</div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
          '<button onclick="closeModalSaldo()" style="padding:10px 18px;background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--text-muted);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Batal</button>' +
          '<button id="mSaldoBtn" onclick="simpanSaldo()" style="display:flex;align-items:center;gap:8px;padding:10px 20px;background:var(--accent);border:none;border-radius:10px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">' +
            '<i class="fa-solid fa-floppy-disk"></i>Simpan Penyesuaian' +
          '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modalEl);
  }

  document.getElementById('mSaldoName').textContent    = name;
  document.getElementById('mSaldoCurrent').textContent = 'Rp ' + Number(currentBalance).toLocaleString('id-ID');
  document.getElementById('mSaldoInput').value         = currentBalance;
  document.getElementById('mSaldoCatatan').value       = '';
  var m = document.getElementById('modalSaldo');
  if (m) m.style.display = 'flex';
}

function closeModalSaldo() {
  const m = document.getElementById('modalSaldo');
  if (m) m.style.display = 'none';
}

async function simpanSaldo() {
  const newBal = Number(document.getElementById('mSaldoInput').value) || 0;
  const note   = document.getElementById('mSaldoCatatan').value.trim();
  const btn    = document.getElementById('mSaldoBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
  try {
    await api.customers.update(_saldoUserId, { balance: newBal, balanceNote: note });
    // update local cache
    const u = _allCustomers.find(x => x._id === _saldoUserId);
    if (u) u.balance = newBal;
    showToast('success', 'Saldo berhasil diperbarui!');
    closeModalSaldo();
    if (location.pathname.includes('customer-detail')) renderCustomerDetail();
    else filterCustomers();
  } catch(e) {
    showToast('error', e.message || 'Gagal simpan saldo');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Penyesuaian';
  }
}

async function deleteCust(id, name) {
  if (!confirm(`Hapus pelanggan "${name}"?\nTindakan ini tidak dapat dibatalkan.`)) return;
  try {
    await api.customers.delete(id);
    _allCustomers = _allCustomers.filter(u => u._id !== id);
    filterCustomers();
    showToast('success', `Pelanggan ${name} dihapus`);
  } catch(e) {
    showToast('error', e.message || 'Gagal hapus pelanggan');
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// UTILS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function custInitials(name) {
  return (name || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
}
function custColor(name) {
  const palette = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];
  return palette[(name||'').charCodeAt(0) % palette.length];
}
function custTimeAgo(dateStr) {
  if (!dateStr) return '-';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)      return `${diff}d lalu`;
  if (diff < 3600)    return `${Math.floor(diff/60)} menit lalu`;
  if (diff < 86400)   return `${Math.floor(diff/3600)} jam lalu`;
  if (diff < 604800)  return `${Math.floor(diff/86400)} hari lalu`;
  if (diff < 2592000) return `${Math.floor(diff/604800)} minggu lalu`;
  return new Date(dateStr).toLocaleDateString('id-ID');
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// EDIT PAGE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function renderCustomerEdit() {
  var parts = window.location.pathname.replace(/^\/admin\//, '').split('/');
  var id    = parts[1] || '';
  if (!id) { navigate('customers'); return; }

  var el = document.getElementById('pageContent');
  el.innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">' +
      '<button onclick="navigate(\'customers\')" style="width:34px;height:34px;border-radius:10px;background:var(--card-bg);border:1px solid var(--border);color:var(--text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
        '<i class="fa-solid fa-arrow-left" style="font-size:13px;"></i>' +
      '</button>' +
      '<div>' +
        '<h1 class="page-title" style="margin:0;">Edit Pelanggan</h1>' +
        '<p class="page-subtitle" id="editSubtitle" style="margin:0;">Memuat data...</p>' +
      '</div>' +
    '</div>' +
    '<div id="editFormWrap" style="margin-top:24px;max-width:680px;">' +
      '<div class="skeleton" style="height:500px;border-radius:16px;"></div>' +
    '</div>';

  try {
    var res  = await api.customers.getById(id);
    var user = res.data || res;

    document.getElementById('editSubtitle').textContent =
      (user.name || '') + (user.email ? ' \u2014 ' + user.email : '');

    var isActive = user.isActive !== false;
    var fmtDate  = function(d) { return d ? new Date(d).toLocaleString('id-ID') : 'Belum pernah'; };

    var infoRows = [
      ['Terdaftar', fmtDate(user.createdAt)],
      ['Login Terakhir', fmtDate(user.lastLogin)],
      ['Email Verifikasi', fmtDate(user.verifiedAt)],
      ['Total Pesanan', (user.orderCount || 0) + ' pesanan'],
    ].map(function(row) {
      return '<div>' +
        '<div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px;">' + row[0] + '</div>' +
        '<div style="font-size:13px;color:var(--text);">' + row[1] + '</div>' +
      '</div>';
    }).join('');

    var inputStyle = 'width:100%;padding:11px 14px;background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;';
    var labelStyle = 'display:block;font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:7px;text-transform:uppercase;letter-spacing:.4px;';

    document.getElementById('editFormWrap').innerHTML =
      '<div class="card" style="padding:28px 30px;">' +

        // Nama
        '<div style="margin-bottom:18px;">' +
          '<label style="' + labelStyle + '">Nama Lengkap <span style="color:#f87171;">*</span></label>' +
          '<input id="editName" type="text" value="' + (user.name||'').replace(/"/g,'&quot;') + '" style="' + inputStyle + '">' +
          '<div id="editNameErr" style="display:none;font-size:12px;color:#f87171;margin-top:5px;"><i class="fa-solid fa-circle-exclamation"></i> Nama wajib diisi</div>' +
        '</div>' +

        // Email
        '<div style="margin-bottom:18px;">' +
          '<label style="' + labelStyle + '">Email <span style="color:#f87171;">*</span></label>' +
          '<input id="editEmail" type="email" value="' + (user.email||'').replace(/"/g,'&quot;') + '" style="' + inputStyle + '">' +
          '<div id="editEmailErr" style="display:none;font-size:12px;color:#f87171;margin-top:5px;"><i class="fa-solid fa-circle-exclamation"></i> Email tidak valid</div>' +
        '</div>' +

        // No HP
        '<div style="margin-bottom:18px;">' +
          '<label style="' + labelStyle + '">No. HP</label>' +
          '<input id="editPhone" type="tel" value="' + (user.phone||'').replace(/"/g,'&quot;') + '" placeholder="Kosongkan jika tidak diisi" style="' + inputStyle + '">' +
        '</div>' +

        // Password
        '<div style="margin-bottom:18px;">' +
          '<label style="' + labelStyle + '">Password Baru</label>' +
          '<input id="editPassword" type="password" placeholder="Kosongkan jika tidak ingin mengubah" style="' + inputStyle + '">' +
        '</div>' +

        // Konfirmasi Password
        '<div style="margin-bottom:22px;">' +
          '<label style="' + labelStyle + '">Konfirmasi Password Baru</label>' +
          '<input id="editPasswordConfirm" type="password" placeholder="Ulangi password baru" style="' + inputStyle + '">' +
          '<div id="editPassErr" style="display:none;font-size:12px;color:#f87171;margin-top:5px;"><i class="fa-solid fa-circle-exclamation"></i> Password tidak cocok</div>' +
        '</div>' +

        // Toggle aktif
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;padding:14px 16px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;">' +
          '<label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer;flex-shrink:0;">' +
            '<input type="checkbox" id="editActive" ' + (isActive ? 'checked' : '') + ' style="opacity:0;width:0;height:0;position:absolute;" onchange="custEditToggle(this)">' +
            '<span id="editActiveBg" style="position:absolute;inset:0;border-radius:99px;transition:.2s;background:' + (isActive ? '#4ade80' : 'rgba(255,255,255,.15)') + ';">' +
              '<span id="editActiveThumb" style="position:absolute;left:' + (isActive ? '22px' : '2px') + ';top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 1px 4px rgba(0,0,0,.3);"></span>' +
            '</span>' +
          '</label>' +
          '<div>' +
            '<div style="font-size:14px;font-weight:600;color:var(--text);">Akun aktif</div>' +
            '<div style="font-size:12px;color:var(--text-muted);">Nonaktifkan untuk memblokir akses pelanggan</div>' +
          '</div>' +
        '</div>' +

        // Info akun
        '<div style="margin-bottom:28px;padding:18px 20px;background:rgba(255,255,255,.025);border:1px solid var(--border);border-radius:12px;">' +
          '<div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:14px;">Info Akun</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;">' + infoRows + '</div>' +
        '</div>' +

        // Buttons
        '<div style="display:flex;gap:12px;">' +
          '<button onclick="navigate(\'customers\')" style="flex:1;padding:12px 20px;background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--text-muted);font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Batal</button>' +
          '<button id="editSaveBtn" onclick="saveCustomerEdit(\'' + id + '\')" style="flex:2;padding:12px 20px;background:var(--accent);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;">' +
            '<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan' +
          '</button>' +
        '</div>' +

      '</div>';

  } catch(e) {
    document.getElementById('editFormWrap').innerHTML =
      '<div class="card" style="padding:40px;text-align:center;color:var(--text-muted);">' +
        '<i class="fa-solid fa-circle-exclamation" style="font-size:28px;display:block;margin-bottom:10px;color:#f87171;"></i>' +
        'Gagal memuat data: ' + e.message +
      '</div>';
  }
}

function custEditToggle(cb) {
  var bg    = document.getElementById('editActiveBg');
  var thumb = document.getElementById('editActiveThumb');
  if (bg)    bg.style.background = cb.checked ? '#4ade80' : 'rgba(255,255,255,.15)';
  if (thumb) thumb.style.left    = cb.checked ? '22px' : '2px';
}

async function saveCustomerEdit(id) {
  var name     = (document.getElementById('editName')?.value || '').trim();
  var email    = (document.getElementById('editEmail')?.value || '').trim();
  var phone    = (document.getElementById('editPhone')?.value || '').trim();
  var pass     = document.getElementById('editPassword')?.value || '';
  var passConf = document.getElementById('editPasswordConfirm')?.value || '';
  var isActive = document.getElementById('editActive')?.checked !== false;

  // Reset errors
  ['editNameErr','editEmailErr','editPassErr'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.style.display = 'none';
  });

  var ok = true;
  if (!name) {
    document.getElementById('editNameErr').style.display = 'block';
    ok = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('editEmailErr').style.display = 'block';
    ok = false;
  }
  if (pass && pass !== passConf) {
    document.getElementById('editPassErr').style.display = 'block';
    ok = false;
  }
  if (!ok) return;

  var btn = document.getElementById('editSaveBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

  try {
    var payload = { name: name, email: email, isActive: isActive };
    if (phone) payload.phone    = phone;
    if (pass)  payload.password = pass;

    await api.customers.update(id, payload);
    showToast('success', 'Data pelanggan berhasil diperbarui!');
    setTimeout(function() { navigate('customers'); }, 900);
  } catch(e) {
    showToast('error', e.message || 'Gagal menyimpan perubahan');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan';
  }
}

