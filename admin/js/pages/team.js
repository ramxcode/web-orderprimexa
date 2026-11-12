function teamInitials(name) {
  return (name||'U').split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase();
}
function teamColor(name) {
  var p = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];
  return p[(name||'').charCodeAt(0) % p.length];
}
function teamFmtDate(d) {
  if (!d) return 'Belum pernah';
  var dt = new Date(d);
  return dt.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) + ' ' +
         dt.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
}
function teamTimeAgo(d) {
  if (!d) return 'Belum pernah';
  var diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60)      return diff + 'd lalu';
  if (diff < 3600)    return Math.floor(diff/60) + ' mnt lalu';
  if (diff < 86400)   return Math.floor(diff/3600) + ' jam lalu';
  if (diff < 604800)  return Math.floor(diff/86400) + ' hari lalu';
  return teamFmtDate(d);
}

var _allTeamUsers = [];
window._teamMap   = {};

// ─────────────────────────────────────────────────────────────
// MANAJEMEN PENGGUNA
// ─────────────────────────────────────────────────────────────
async function renderTeamUsers() {
  var el = document.getElementById('pageContent');
  el.innerHTML =
    '<div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;">' +
      '<div>' +
        '<h1 class="page-title">Manajemen Pengguna</h1>' +
        '<p class="page-subtitle">Kelola admin dan staff toko Anda</p>' +
      '</div>' +
      '<button onclick="navigate(\'team-create\')" style="display:inline-flex;align-items:center;gap:8px;padding:10px 18px;background:var(--accent);border:none;border-radius:10px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;">' +
        '<i class="fa-solid fa-user-plus"></i> Tambah Pengguna' +
      '</button>' +
    '</div>' +

    // Filters
    '<div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">' +
      '<div style="flex:1;min-width:200px;position:relative;">' +
        '<i class="fa-solid fa-magnifying-glass" style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px;pointer-events:none;"></i>' +
        '<input id="teamSearch" type="text" placeholder="Cari nama atau email..." oninput="filterTeamUsers()" ' +
        'style="width:100%;padding:10px 14px 10px 36px;background:var(--card-bg);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;">' +
      '</div>' +
      '<select id="teamRoleFilter" onchange="filterTeamUsers()" style="padding:10px 14px;background:var(--card-bg);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;cursor:pointer;outline:none;">' +
        '<option value="">Semua Role</option>' +
        '<option value="admin">Admin</option>' +
        '<option value="staff">Staff</option>' +
      '</select>' +
      '<select id="teamStatusFilter" onchange="filterTeamUsers()" style="padding:10px 14px;background:var(--card-bg);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;cursor:pointer;outline:none;">' +
        '<option value="">Semua Status</option>' +
        '<option value="active">Aktif</option>' +
        '<option value="inactive">Nonaktif</option>' +
      '</select>' +
    '</div>' +

    // Table
    '<div class="card" style="padding:0;overflow:hidden;">' +
      '<div style="overflow-x:auto;">' +
        '<table style="width:100%;border-collapse:collapse;min-width:680px;">' +
          '<thead>' +
            '<tr style="border-bottom:1px solid var(--border);">' +
              '<th style="padding:13px 20px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);">Pengguna</th>' +
              '<th style="padding:13px 12px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);">Role</th>' +
              '<th style="padding:13px 12px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);">Status</th>' +
              '<th style="padding:13px 12px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);">Telegram</th>' +
              '<th style="padding:13px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);">Login Terakhir</th>' +
              '<th style="padding:13px 20px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);">Aksi</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody id="teamTableBody">' +
            '<tr><td colspan="6" style="padding:40px;text-align:center;">' +
              '<div class="skeleton" style="height:44px;border-radius:8px;margin-bottom:10px;"></div>' +
              '<div class="skeleton" style="height:44px;border-radius:8px;"></div>' +
            '</td></tr>' +
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';

  await loadTeamUsers();
}

async function loadTeamUsers() {
  try {
    var res = await api.team.getAll();
    _allTeamUsers = res.data || [];
    window._teamMap = {};
    _allTeamUsers.forEach(function(u) { window._teamMap[u._id] = u; });
    filterTeamUsers();
  } catch(e) {
    var tb = document.getElementById('teamTableBody');
    if (tb) tb.innerHTML = '<tr><td colspan="6" style="padding:40px;text-align:center;color:#f87171;">' +
      '<i class="fa-solid fa-circle-exclamation" style="display:block;font-size:28px;margin-bottom:8px;"></i>' +
      (e.message || 'Gagal memuat data') + '</td></tr>';
  }
}

function filterTeamUsers() {
  var q      = (document.getElementById('teamSearch')?.value || '').toLowerCase();
  var role   = document.getElementById('teamRoleFilter')?.value || '';
  var status = document.getElementById('teamStatusFilter')?.value || '';
  var list   = _allTeamUsers.filter(function(u) {
    var mQ = !q || (u.name||'').toLowerCase().indexOf(q) > -1 || (u.email||'').toLowerCase().indexOf(q) > -1;
    var mR = !role   || u.role === role;
    var mS = !status || (status === 'active' ? u.isActive !== false : u.isActive === false);
    return mQ && mR && mS;
  });
  renderTeamRows(list);
}

function renderTeamRows(list) {
  var tb = document.getElementById('teamTableBody');
  if (!tb) return;
  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="6" style="padding:40px;text-align:center;color:var(--text-muted);">' +
      '<i class="fa-solid fa-users-slash" style="font-size:28px;display:block;margin-bottom:8px;opacity:.4;"></i>Tidak ada pengguna</td></tr>';
    return;
  }

  var roleBadge = {
    admin: 'background:rgba(99,102,241,.15);color:#818cf8;border:1px solid rgba(99,102,241,.3);',
    staff: 'background:rgba(16,185,129,.12);color:#34d399;border:1px solid rgba(16,185,129,.25);',
  };
  var btnBase = 'width:28px;height:28px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:background .12s;font-family:inherit;font-size:11px;background:transparent;border:1px solid var(--border);color:var(--text-muted);';
  var btnDanger = 'width:28px;height:28px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:11px;background:transparent;border:1px solid rgba(239,68,68,.3);color:#f87171;';

  var rows = list.map(function(u) {
    var ini    = teamInitials(u.name);
    var color  = teamColor(u.name);
    var aktif  = u.isActive !== false;
    var tg     = u.telegramUsername ? ('@' + u.telegramUsername) : 'Belum';
    var badge  = roleBadge[u.role] || 'background:rgba(255,255,255,.06);color:var(--text-muted);';
    var roleLabel = u.role === 'admin' ? 'Admin' : u.role === 'staff' ? 'Staff' : u.role;

    return '<tr style="border-bottom:1px solid var(--border);transition:background .12s;" onmouseover="this.style.background=\'rgba(255,255,255,.025)\'" onmouseout="this.style.background=\'\'">' +
      // Pengguna
      '<td style="padding:13px 20px;">' +
        '<div style="display:flex;align-items:center;gap:11px;">' +
          '<div style="width:36px;height:36px;border-radius:10px;background:' + color + ';display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0;">' + ini + '</div>' +
          '<div>' +
            '<div style="font-weight:600;font-size:14px;color:var(--text);">' + (u.name||'-') + '</div>' +
            '<div style="font-size:12px;color:var(--text-muted);">' + (u.email||'') + '</div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      // Role
      '<td style="padding:13px 12px;text-align:center;">' +
        '<span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;' + badge + '">' + roleLabel + '</span>' +
      '</td>' +
      // Status
      '<td style="padding:13px 12px;text-align:center;">' +
        '<span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:99px;' +
          (aktif ? 'background:rgba(34,197,94,.12);color:#4ade80;border:1px solid rgba(34,197,94,.25);' : 'background:rgba(239,68,68,.1);color:#f87171;border:1px solid rgba(239,68,68,.2);') +
          '">' + (aktif ? 'Aktif' : 'Nonaktif') + '</span>' +
      '</td>' +
      // Telegram
      '<td style="padding:13px 12px;text-align:center;">' +
        '<span style="font-size:12px;background:rgba(255,255,255,.06);padding:3px 9px;border-radius:99px;color:var(--text-muted);">' + tg + '</span>' +
      '</td>' +
      // Login Terakhir
      '<td style="padding:13px 12px;font-size:12px;color:var(--text-muted);">' +
        '<div>' + teamTimeAgo(u.lastLogin) + '</div>' +
        (u.lastLogin ? '<div style="font-size:11px;opacity:.6;">' + teamFmtDate(u.lastLogin) + '</div>' : '') +
      '</td>' +
      // Aksi
      '<td style="padding:13px 20px;text-align:center;">' +
        '<div style="display:flex;align-items:center;justify-content:center;gap:5px;">' +
          '<button onclick="teamDeleteUser(\'' + u._id + '\')" title="Hapus" style="' + btnDanger + '"><i class="fa-solid fa-trash" style="font-size:11px;"></i></button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  });
  tb.innerHTML = rows.join('');
}

async function teamDeleteUser(id) {
  var u = window._teamMap[id];
  if (!u) return;
  if (!confirm('Hapus pengguna "' + u.name + '"?\n\nTindakan ini tidak bisa dibatalkan.')) return;
  try {
    await api.team.delete(id);
    showToast('success', 'Pengguna berhasil dihapus');
    await loadTeamUsers();
  } catch(e) {
    showToast('error', e.message || 'Gagal menghapus pengguna');
  }
}

// ─────────────────────────────────────────────────────────────
// TAMBAH PENGGUNA
// ─────────────────────────────────────────────────────────────
function renderTeamCreate() {
  var el = document.getElementById('pageContent');
  var inputStyle = 'width:100%;padding:11px 14px;background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;transition:border .15s;';
  var labelStyle = 'display:block;font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:7px;text-transform:uppercase;letter-spacing:.4px;';

  el.innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">' +
      '<button onclick="navigate(\'team-users\')" style="width:34px;height:34px;border-radius:10px;background:var(--card-bg);border:1px solid var(--border);color:var(--text-muted);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
        '<i class="fa-solid fa-arrow-left" style="font-size:13px;"></i>' +
      '</button>' +
      '<div>' +
        '<h1 class="page-title" style="margin:0;">Tambah Pengguna</h1>' +
        '<p class="page-subtitle" style="margin:0;">Buat akun admin atau staff baru</p>' +
      '</div>' +
    '</div>' +

    '<div style="margin-top:24px;max-width:680px;">' +
      '<div class="card" style="padding:28px 30px;">' +

        // Nama
        '<div style="margin-bottom:18px;">' +
          '<label style="' + labelStyle + '">Nama Lengkap <span style="color:#f87171;">*</span></label>' +
          '<input id="tcName" type="text" placeholder="Nama pengguna" style="' + inputStyle + '">' +
          '<div id="tcNameErr" style="display:none;font-size:12px;color:#f87171;margin-top:5px;"><i class="fa-solid fa-circle-exclamation"></i> Nama wajib diisi</div>' +
        '</div>' +

        // Email
        '<div style="margin-bottom:18px;">' +
          '<label style="' + labelStyle + '">Email <span style="color:#f87171;">*</span></label>' +
          '<input id="tcEmail" type="email" placeholder="email@example.com" style="' + inputStyle + '">' +
          '<div id="tcEmailErr" style="display:none;font-size:12px;color:#f87171;margin-top:5px;"><i class="fa-solid fa-circle-exclamation"></i> Email tidak valid atau sudah terdaftar</div>' +
        '</div>' +

        // Role
        '<div style="margin-bottom:18px;">' +
          '<label style="' + labelStyle + '">Role <span style="color:#f87171;">*</span></label>' +
          '<select id="tcRole" style="width:100%;padding:11px 14px;background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;font-family:inherit;outline:none;cursor:pointer;">' +
            '<option value="">Pilih Role</option>' +
            '<option value="admin">Admin</option>' +
            '<option value="staff">Staff</option>' +
          '</select>' +
          '<div style="font-size:11px;color:var(--text-muted);margin-top:6px;">' +
            '<span style="color:#818cf8;font-weight:600;">Admin</span>: manager operasional. ' +
            '<span style="color:#34d399;font-weight:600;">Staff</span>: operator / CS.' +
          '</div>' +
          '<div id="tcRoleErr" style="display:none;font-size:12px;color:#f87171;margin-top:5px;"><i class="fa-solid fa-circle-exclamation"></i> Role wajib dipilih</div>' +
        '</div>' +

        // Password
        '<div style="margin-bottom:18px;">' +
          '<label style="' + labelStyle + '">Password <span style="color:#f87171;">*</span></label>' +
          '<input id="tcPassword" type="password" placeholder="Minimal 8 karakter" style="' + inputStyle + '">' +
          '<div id="tcPassErr" style="display:none;font-size:12px;color:#f87171;margin-top:5px;"><i class="fa-solid fa-circle-exclamation"></i> Password minimal 8 karakter</div>' +
        '</div>' +

        // Konfirmasi Password
        '<div style="margin-bottom:22px;">' +
          '<label style="' + labelStyle + '">Konfirmasi Password <span style="color:#f87171;">*</span></label>' +
          '<input id="tcPasswordConf" type="password" placeholder="Ulangi password" style="' + inputStyle + '">' +
          '<div id="tcPassConfErr" style="display:none;font-size:12px;color:#f87171;margin-top:5px;"><i class="fa-solid fa-circle-exclamation"></i> Password tidak cocok</div>' +
        '</div>' +

        // Toggle Aktif
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;padding:14px 16px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;">' +
          '<label style="position:relative;display:inline-block;width:44px;height:24px;cursor:pointer;flex-shrink:0;">' +
            '<input type="checkbox" id="tcActive" checked style="opacity:0;width:0;height:0;position:absolute;" onchange="tcToggle(this)">' +
            '<span id="tcActiveBg" style="position:absolute;inset:0;border-radius:99px;transition:.2s;background:#4ade80;">' +
              '<span id="tcActiveThumb" style="position:absolute;left:22px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 1px 4px rgba(0,0,0,.3);"></span>' +
            '</span>' +
          '</label>' +
          '<div>' +
            '<div style="font-size:14px;font-weight:600;color:var(--text);">Aktifkan akun</div>' +
            '<div style="font-size:12px;color:var(--text-muted);">Nonaktifkan jika ingin membuat akun tanpa akses langsung</div>' +
          '</div>' +
        '</div>' +

        // Tombol
        '<div style="display:flex;gap:12px;">' +
          '<button onclick="navigate(\'team-users\')" style="flex:1;padding:12px 20px;background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--text-muted);font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Batal</button>' +
          '<button id="tcSaveBtn" onclick="saveTeamCreate()" style="flex:2;padding:12px 20px;background:var(--accent);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;">' +
            '<i class="fa-solid fa-user-plus"></i> Tambah Pengguna' +
          '</button>' +
        '</div>' +

      '</div>' +
    '</div>';
}

function tcToggle(cb) {
  var bg    = document.getElementById('tcActiveBg');
  var thumb = document.getElementById('tcActiveThumb');
  if (bg)    bg.style.background = cb.checked ? '#4ade80' : 'rgba(255,255,255,.15)';
  if (thumb) thumb.style.left    = cb.checked ? '22px' : '2px';
}

async function saveTeamCreate() {
  var name     = (document.getElementById('tcName')?.value || '').trim();
  var email    = (document.getElementById('tcEmail')?.value || '').trim();
  var role     = document.getElementById('tcRole')?.value || '';
  var pass     = document.getElementById('tcPassword')?.value || '';
  var passConf = document.getElementById('tcPasswordConf')?.value || '';
  var isActive = document.getElementById('tcActive')?.checked !== false;

  // Reset errors
  ['tcNameErr','tcEmailErr','tcRoleErr','tcPassErr','tcPassConfErr'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.style.display = 'none';
  });

  var ok = true;
  if (!name) { document.getElementById('tcNameErr').style.display = 'block'; ok = false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById('tcEmailErr').style.display = 'block'; ok = false; }
  if (!role) { document.getElementById('tcRoleErr').style.display = 'block'; ok = false; }
  if (!pass || pass.length < 8) { document.getElementById('tcPassErr').style.display = 'block'; ok = false; }
  if (pass !== passConf) { document.getElementById('tcPassConfErr').style.display = 'block'; ok = false; }
  if (!ok) return;

  var btn = document.getElementById('tcSaveBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Membuat akun...';

  try {
    await api.team.create({ name, email, role, password: pass, isActive });
    showToast('success', 'Pengguna "' + name + '" berhasil dibuat!');
    setTimeout(function() { navigate('team-users'); }, 900);
  } catch(e) {
    showToast('error', e.message || 'Gagal membuat pengguna');
    if ((e.message||'').toLowerCase().includes('email')) {
      document.getElementById('tcEmailErr').style.display = 'block';
    }
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Tambah Pengguna';
  }
}

// ─────────────────────────────────────────────────────────────
// ROLES & HAK AKSES
// ─────────────────────────────────────────────────────────────
function renderTeamRoles() {
  var el = document.getElementById('pageContent');
  el.innerHTML =
    '<div class="page-header">' +
      '<h1 class="page-title">Roles &amp; Hak Akses</h1>' +
      '<p class="page-subtitle">Informasi akses untuk setiap role pengguna</p>' +
    '</div>' +

    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-top:4px;">' +

      // Super Admin
      roleCard({
        icon: 'fa-crown', iconBg: '#ef4444', title: 'Super Admin',
        desc: 'Pemilik bisnis. Akses penuh tanpa batas.',
        color: '#ef4444',
        permissions: [
          'Semua fitur panel admin',
          'Manajemen tim & pengguna',
          'Konfigurasi sistem',
          'Akses data sensitif',
          'Tidak dapat dihapus',
        ],
        locked: true,
      }) +

      // Admin
      roleCard({
        icon: 'fa-user-tie', iconBg: '#6366f1', title: 'Admin',
        desc: 'Manager operasional. Akses penuh kecuali konfigurasi kritis.',
        color: '#818cf8',
        permissions: [
          'Kelola produk & kategori',
          'Kelola pesanan pelanggan',
          'Manajemen pelanggan',
          'Kustomisasi toko',
          'Tidak bisa akses Manajemen Tim',
        ],
        locked: false,
      }) +

      // Staff
      roleCard({
        icon: 'fa-headset', iconBg: '#10b981', title: 'Staff',
        desc: 'Operator / CS. Akses terbatas untuk operasional harian.',
        color: '#34d399',
        permissions: [
          'Lihat & proses pesanan',
          'Kelola data pelanggan',
          'Lihat laporan dasar',
          'Tidak bisa edit produk',
          'Tidak bisa akses konfigurasi',
        ],
        locked: false,
      }) +

    '</div>' +

    '<div class="card" style="margin-top:24px;padding:20px 24px;background:rgba(99,102,241,.06);border:1px solid rgba(99,102,241,.2);">' +
      '<div style="display:flex;gap:12px;align-items:flex-start;">' +
        '<i class="fa-solid fa-circle-info" style="color:#818cf8;font-size:16px;margin-top:2px;flex-shrink:0;"></i>' +
        '<div>' +
          '<div style="font-weight:700;color:var(--text);margin-bottom:4px;">Sistem Roles Saat Ini</div>' +
          '<div style="font-size:13px;color:var(--text-muted);line-height:1.7;">Sistem ini menggunakan role-based access control (RBAC). Setiap pengguna memiliki satu role yang menentukan akses mereka. ' +
          'Role <strong style="color:#ef4444;">Super Admin</strong> tidak dapat diubah atau dihapus. ' +
          'Gunakan menu <strong style="color:#818cf8;">Tambah Pengguna</strong> untuk membuat akun Admin atau Staff baru.</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function roleCard(opts) {
  var perms = opts.permissions.map(function(p) {
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);">' +
      '<i class="fa-solid fa-check" style="color:' + opts.color + ';font-size:11px;flex-shrink:0;"></i>' +
      '<span style="font-size:13px;color:var(--text-muted);">' + p + '</span>' +
    '</div>';
  }).join('');

  return '<div class="card" style="padding:24px;">' +
    '<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">' +
      '<div style="width:48px;height:48px;border-radius:14px;background:' + opts.iconBg + '22;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
        '<i class="fa-solid ' + opts.icon + '" style="color:' + opts.iconBg + ';font-size:20px;"></i>' +
      '</div>' +
      '<div>' +
        '<div style="font-size:18px;font-weight:800;color:var(--text);">' + opts.title + '</div>' +
        '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">' + opts.desc + '</div>' +
      '</div>' +
    '</div>' +
    '<div style="margin-bottom:16px;">' + perms + '</div>' +
    (opts.locked
      ? '<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;font-size:12px;color:#f87171;">' +
          '<i class="fa-solid fa-lock" style="font-size:11px;"></i> Akses penuh (tidak dapat diubah)' +
        '</div>'
      : '') +
  '</div>';
}

// ─────────────────────────────────────────────────────────────
// LOG AKTIVITAS
// ─────────────────────────────────────────────────────────────
async function renderTeamLogs() {
  var el = document.getElementById('pageContent');
  el.innerHTML =
    '<div class="page-header">' +
      '<h1 class="page-title">Log Aktivitas</h1>' +
      '<p class="page-subtitle">Riwayat aktivitas admin dan staff</p>' +
    '</div>' +

    // Filter bar
    '<div style="display:grid;grid-template-columns:1fr auto;gap:12px;margin-bottom:20px;">' +
      '<input id="logSearch" type="text" placeholder="Cari nama, aksi, IP..." oninput="filterLogs()" ' +
        'style="padding:10px 14px;background:var(--card-bg);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;outline:none;">' +
      '<button onclick="loadLogs()" style="padding:10px 16px;background:var(--accent);border:none;border-radius:10px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:7px;">' +
        '<i class="fa-solid fa-rotate-right"></i> Refresh' +
      '</button>' +
    '</div>' +

    '<div class="card" style="padding:0;overflow:hidden;">' +
      '<div id="logsTableWrap" style="overflow-x:auto;">' +
        '<div style="padding:40px;text-align:center;">' +
          '<div class="skeleton" style="height:44px;border-radius:8px;margin-bottom:8px;"></div>' +
          '<div class="skeleton" style="height:44px;border-radius:8px;margin-bottom:8px;"></div>' +
          '<div class="skeleton" style="height:44px;border-radius:8px;"></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  await loadLogs();
}

var _allLogs = [];

async function loadLogs() {
  try {
    // Ambil riwayat login/aktivitas dari recent users data
    var res  = await api.team.getAll();
    var users = res.data || [];

    // Buat synthetic log dari data user yang ada
    _allLogs = users.map(function(u) {
      return {
        user: u,
        action: 'Login',
        target: '-',
        ip: '-',
        time: u.lastLogin || u.createdAt,
      };
    }).filter(function(l) { return l.time; })
      .sort(function(a, b) { return new Date(b.time) - new Date(a.time); });

    renderLogs(_allLogs);
  } catch(e) {
    var wrap = document.getElementById('logsTableWrap');
    if (wrap) wrap.innerHTML = '<div style="padding:40px;text-align:center;color:#f87171;">' +
      '<i class="fa-solid fa-circle-exclamation" style="font-size:28px;display:block;margin-bottom:8px;"></i>' +
      (e.message || 'Gagal memuat log') + '</div>';
  }
}

function filterLogs() {
  var q = (document.getElementById('logSearch')?.value || '').toLowerCase();
  var list = _allLogs.filter(function(l) {
    return !q ||
      (l.user?.name||'').toLowerCase().indexOf(q) > -1 ||
      (l.action||'').toLowerCase().indexOf(q) > -1 ||
      (l.ip||'').indexOf(q) > -1;
  });
  renderLogs(list);
}

function renderLogs(list) {
  var wrap = document.getElementById('logsTableWrap');
  if (!wrap) return;

  if (!list.length) {
    wrap.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted);">' +
      '<i class="fa-solid fa-clock-rotate-left" style="font-size:28px;display:block;margin-bottom:8px;opacity:.4;"></i>Tidak ada log aktivitas</div>';
    return;
  }

  var actionColor = {
    Login:  { bg:'rgba(99,102,241,.12)', color:'#818cf8', icon:'fa-right-to-bracket' },
    Create: { bg:'rgba(34,197,94,.12)',  color:'#4ade80', icon:'fa-plus' },
    Update: { bg:'rgba(251,191,36,.12)', color:'#fbbf24', icon:'fa-pen' },
    Delete: { bg:'rgba(239,68,68,.12)',  color:'#f87171', icon:'fa-trash' },
  };

  var rows = list.map(function(l) {
    var ini   = teamInitials(l.user?.name);
    var color = teamColor(l.user?.name);
    var ac    = actionColor[l.action] || actionColor['Login'];

    return '<tr style="border-bottom:1px solid var(--border);transition:background .12s;" onmouseover="this.style.background=\'rgba(255,255,255,.025)\'" onmouseout="this.style.background=\'\'">' +
      '<td style="padding:12px 20px;font-size:12px;color:var(--text-muted);white-space:nowrap;">' +
        '<div>' + teamTimeAgo(l.time) + '</div>' +
        '<div style="font-size:11px;opacity:.6;">' + teamFmtDate(l.time) + '</div>' +
      '</td>' +
      '<td style="padding:12px 12px;">' +
        '<div style="display:flex;align-items:center;gap:9px;">' +
          '<div style="width:30px;height:30px;border-radius:8px;background:' + color + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;">' + ini + '</div>' +
          '<div>' +
            '<div style="font-size:13px;font-weight:600;color:var(--text);">' + (l.user?.name||'-') + '</div>' +
            '<div style="font-size:11px;color:var(--text-muted);">' + (l.user?.role||'') + '</div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td style="padding:12px 12px;">' +
        '<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;background:' + ac.bg + ';color:' + ac.color + ';">' +
          '<i class="fa-solid ' + ac.icon + '" style="font-size:10px;"></i> ' + l.action +
        '</span>' +
      '</td>' +
      '<td style="padding:12px 12px;font-size:13px;color:var(--text-muted);">' + (l.target||'-') + '</td>' +
      '<td style="padding:12px 12px;font-size:12px;color:var(--text-muted);font-family:monospace;">' + (l.ip||'-') + '</td>' +
    '</tr>';
  }).join('');

  wrap.innerHTML =
    '<table style="width:100%;border-collapse:collapse;min-width:640px;">' +
      '<thead>' +
        '<tr style="border-bottom:1px solid var(--border);">' +
          '<th style="padding:12px 20px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);">Waktu</th>' +
          '<th style="padding:12px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);">User</th>' +
          '<th style="padding:12px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);">Aksi</th>' +
          '<th style="padding:12px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);">Target</th>' +
          '<th style="padding:12px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);">IP Address</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>';
}
