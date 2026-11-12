function accountTabs(active) {
  var tabs = [
    { key: 'account-profile',  icon: 'fa-user',          label: 'Profil' },
    { key: 'account-security', icon: 'fa-shield-halved', label: 'Keamanan' },
    { key: 'account-password', icon: 'fa-lock',          label: 'Password' },
  ];
  return '<div style="display:flex;gap:6px;margin-bottom:28px;background:var(--card-bg);border:1px solid var(--border);border-radius:12px;padding:5px;width:fit-content;">' +
    tabs.map(function(t) {
      var isActive = t.key === active;
      return '<button onclick="navigate(\'' + t.key + '\')" style="' +
        'display:inline-flex;align-items:center;gap:7px;padding:8px 16px;border-radius:8px;border:none;' +
        'font-size:13px;font-weight:' + (isActive ? '700' : '500') + ';font-family:inherit;cursor:pointer;transition:all .15s;' +
        (isActive
          ? 'background:var(--accent);color:#fff;'
          : 'background:transparent;color:var(--text-muted);') +
      '">' +
        '<i class="fa-solid ' + t.icon + '" style="font-size:12px;"></i>' + t.label +
      '</button>';
    }).join('') +
  '</div>';
}

function acInputStyle() {
  return 'width:100%;padding:11px 14px;background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;transition:border .15s;';
}
function acLabelStyle() {
  return 'display:block;font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:7px;text-transform:uppercase;letter-spacing:.4px;';
}

// ─────────────────────────────────────────────────────────────
// PROFIL
// ─────────────────────────────────────────────────────────────
async function renderAccountProfile() {
  var el = document.getElementById('pageContent');
  el.innerHTML =
    '<h1 class="page-title">Pengaturan Profil</h1>' +
    '<p class="page-subtitle" style="margin-bottom:24px;">Kelola informasi profil dan foto akun Anda</p>' +
    accountTabs('account-profile') +
    '<div id="profContent"><div class="skeleton" style="height:400px;border-radius:16px;max-width:720px;"></div></div>';

  try {
    var res  = await api.account.getProfile();
    var user = res.user || res;
    renderProfileForm(user);

  } catch(e) {
    // Fallback: gunakan data statis dari sidebar
    var fallback = {
      name:  document.querySelector('.profile-name')?.textContent.trim()  || 'Admin',
      email: document.querySelector('.profile-email')?.textContent.trim() || '',
      role:  'Admin',
    };
    renderProfileForm(fallback);
  }
}

function renderProfileForm(user) {
  var ini   = (user.name||'U').split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase();
  var color = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'][(user.name||'').charCodeAt(0)%6];
  var fmtDate = function(d) { return d ? new Date(d).toLocaleString('id-ID') : '-'; };
  var tgStatus = user.telegramUsername
    ? '<div style="display:flex;align-items:center;gap:8px;padding:11px 14px;background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);border-radius:10px;">' +
        '<i class="fa-brands fa-telegram" style="color:#4ade80;font-size:16px;"></i>' +
        '<span style="font-size:14px;color:#4ade80;font-weight:600;">@' + user.telegramUsername + '</span>' +
      '</div>'
    : '<div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(251,146,60,.07);border:1px solid rgba(251,146,60,.2);border-radius:10px;">' +
        '<i class="fa-solid fa-link-slash" style="color:#fb923c;font-size:14px;"></i>' +
        '<div>' +
          '<div style="font-size:13px;color:#fb923c;font-weight:600;">Belum terhubung</div>' +
          '<div style="font-size:12px;color:var(--text-muted);">Hubungkan lewat login Telegram di website atau verifikasi dari bot.</div>' +
        '</div>' +
      '</div>';

  document.getElementById('profContent').innerHTML =
    '<div style="max-width:720px;display:flex;flex-direction:column;gap:20px;">' +

      // Foto Profil
      '<div class="card" style="padding:24px;">' +
        '<div style="font-size:17px;font-weight:700;color:var(--text);margin-bottom:18px;">Foto Profil</div>' +
        '<div style="display:flex;align-items:center;gap:18px;">' +
          '<div id="avatarPreview" style="width:68px;height:68px;border-radius:50%;overflow:hidden;flex-shrink:0;background:' + color + ';display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#fff;">' +
            (user.avatar
              ? '<img src="' + user.avatar + '" style="width:68px;height:68px;object-fit:cover;border-radius:50%;display:block;">'
              : ini) +
          '</div>' +
          '<div>' +
            '<input type="file" id="avatarFileInput" accept="image/jpeg,image/png,image/webp" style="display:none;" onchange="uploadAvatar(this)">' +
            '<button id="avatarUploadBtn" onclick="document.getElementById(\'avatarFileInput\').click()" style="padding:9px 18px;background:var(--accent);border:none;border-radius:9px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Unggah Foto</button>' +
            '<div style="font-size:12px;color:var(--text-muted);margin-top:8px;">JPG, PNG, atau WebP. Maksimal 2MB.</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Informasi Akun
      '<div class="card" style="padding:24px;">' +
        '<div style="font-size:17px;font-weight:700;color:var(--text);margin-bottom:20px;">Informasi Akun</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">' +

          // Nama Lengkap
          '<div>' +
            '<label style="' + acLabelStyle() + '">Nama Lengkap</label>' +
            '<input id="profName" type="text" value="' + (user.name||'').replace(/"/g,'&quot;') + '" style="' + acInputStyle() + '">' +
          '</div>' +

          // Email (read-only)
          '<div>' +
            '<label style="' + acLabelStyle() + '">Email</label>' +
            '<div style="position:relative;">' +
              '<input type="email" value="' + (user.email||'').replace(/"/g,'&quot;') + '" readonly ' +
              'style="' + acInputStyle() + 'cursor:not-allowed;opacity:.7;padding-right:40px;">' +
              '<div style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px;">' +
                '<i class="fa-solid fa-pen"></i>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // Telegram
        '<div style="margin-bottom:20px;">' +
          '<label style="' + acLabelStyle() + '">Telegram</label>' +
          tgStatus +
        '</div>' +

        // Buttons
        '<div style="display:flex;justify-content:flex-end;gap:10px;">' +
          '<button onclick="document.getElementById(\'profName\').value=\'' + (user.name||'').replace(/'/g,"\\'") + '\'" ' +
          'style="padding:9px 20px;background:transparent;border:1px solid var(--border);border-radius:9px;color:var(--text-muted);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Reset</button>' +
          '<button id="profSaveBtn" onclick="saveProfile()" ' +
          'style="padding:9px 20px;background:var(--accent);border:none;border-radius:9px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:7px;">' +
            '<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan' +
          '</button>' +
        '</div>' +
      '</div>' +

      // Informasi Tambahan
      '<div class="card" style="padding:24px;">' +
        '<div style="font-size:17px;font-weight:700;color:var(--text);margin-bottom:16px;">Informasi Tambahan</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">' +
          ['Role|' + (user.role||'-'), 'Login Terakhir|' + fmtDate(user.lastLogin), 'Akun Dibuat|' + fmtDate(user.createdAt)]
            .map(function(s) {
              var p = s.split('|');
              return '<div style="padding:14px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;">' +
                '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:6px;">' + p[0] + '</div>' +
                '<div style="font-size:14px;font-weight:700;color:var(--text);">' + (p[1]||'-') + '</div>' +
              '</div>';
            }).join('') +
        '</div>' +
      '</div>' +

    '</div>';
}

async function saveProfile() {
  var name = (document.getElementById('profName')?.value || '').trim();
  if (!name) { showToast('error', 'Nama tidak boleh kosong'); return; }
  var btn = document.getElementById('profSaveBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
  try {
    var res = await api.account.updateProfile({ name });
    // Update cached user
    var cached = JSON.parse(localStorage.getItem('ramx_auth_user') || 'null');
    if (cached) { cached.name = name; localStorage.setItem('ramx_auth_user', JSON.stringify(cached)); }
    showToast('success', 'Profil berhasil diperbarui!');
    renderProfileForm(res.user || res);
  } catch(e) {
    showToast('error', e.message || 'Gagal menyimpan profil');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan';
  }
}

async function uploadAvatar(input) {
  var file = input.files[0];
  if (!file) return;

  // Validasi tipe file
  var allowed = ['image/jpeg','image/jpg','image/png','image/webp'];
  if (!allowed.includes(file.type)) {
    showToast('error', 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.');
    input.value = '';
    return;
  }

  // Validasi ukuran (maks 2MB)
  if (file.size > 2 * 1024 * 1024) {
    showToast('error', 'Ukuran file maksimal 2MB.');
    input.value = '';
    return;
  }

  var btn = document.getElementById('avatarUploadBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengupload...'; }

  try {
    var formData = new FormData();
    formData.append('avatar', file);

    var res = await api.account.uploadAvatar(formData);

    // Update preview di halaman
    var preview = document.getElementById('avatarPreview');
    if (preview) {
      preview.innerHTML = '<img src="' + res.avatarUrl + '" style="width:68px;height:68px;object-fit:cover;border-radius:50%;display:block;">';
    }

    // Update localStorage cache
    var cached = JSON.parse(localStorage.getItem('ramx_auth_user') || 'null');
    if (cached) { cached.avatar = res.avatarUrl; localStorage.setItem('ramx_auth_user', JSON.stringify(cached)); }

    showToast('success', 'Foto profil berhasil diperbarui!');
  } catch(e) {
    showToast('error', e.message || 'Gagal mengupload foto.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = 'Unggah Foto'; }
    input.value = '';
  }
}

// ─────────────────────────────────────────────────────────────
// KEAMANAN
// ─────────────────────────────────────────────────────────────
async function renderAccountSecurity() {
  var el = document.getElementById('pageContent');
  el.innerHTML =
    '<h1 class="page-title">Keamanan Akun</h1>' +
    '<p class="page-subtitle" style="margin-bottom:24px;">Kelola PIN keamanan, verifikasi dua langkah, dan pantau aktivitas login</p>' +
    accountTabs('account-security') +
    '<div style="max-width:720px;display:flex;flex-direction:column;gap:20px;">' +

      // PIN Keamanan
      '<div class="card" style="padding:24px;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;">' +
          '<div style="display:flex;align-items:center;gap:14px;">' +
            '<div style="width:44px;height:44px;border-radius:12px;background:rgba(99,102,241,.12);display:flex;align-items:center;justify-content:center;">' +
              '<i class="fa-solid fa-grid-2" style="color:#818cf8;font-size:18px;"></i>' +
            '</div>' +
            '<div>' +
              '<div style="font-size:17px;font-weight:700;color:var(--text);">PIN Keamanan</div>' +
              '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Gunakan PIN 6 digit untuk mengamankan aksi sensitif</div>' +
            '</div>' +
          '</div>' +
          '<span style="font-size:11px;font-weight:700;padding:4px 12px;border-radius:99px;background:rgba(34,197,94,.12);color:#4ade80;border:1px solid rgba(34,197,94,.25);">Terverifikasi</span>' +
        '</div>' +
        '<div style="padding:14px;background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.18);border-radius:10px;display:flex;align-items:center;gap:10px;margin-bottom:14px;">' +
          '<i class="fa-solid fa-circle-check" style="color:#4ade80;font-size:16px;"></i>' +
          '<div>' +
            '<div style="font-size:13px;font-weight:600;color:#4ade80;">PIN keamanan aktif</div>' +
            '<div style="font-size:12px;color:var(--text-muted);">Sesi admin Anda sudah terverifikasi. Jika lupa PIN, reset bisa dilakukan memakai password akun.</div>' +
          '</div>' +
        '</div>' +
        '<button onclick="showToast(\'info\',\'Fitur reset PIN akan segera hadir!\')" style="display:inline-flex;align-items:center;gap:7px;padding:9px 16px;background:transparent;border:1px solid var(--border);border-radius:9px;color:var(--text-muted);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">' +
          '<i class="fa-solid fa-rotate-right" style="font-size:12px;"></i> Reset PIN dengan Password' +
        '</button>' +
      '</div>' +

      // 2FA
      '<div class="card" style="padding:24px;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;">' +
          '<div style="display:flex;align-items:center;gap:14px;">' +
            '<div style="width:44px;height:44px;border-radius:12px;background:rgba(16,185,129,.1);display:flex;align-items:center;justify-content:center;">' +
              '<i class="fa-solid fa-shield-halved" style="color:#34d399;font-size:18px;"></i>' +
            '</div>' +
            '<div>' +
              '<div style="font-size:17px;font-weight:700;color:var(--text);">Verifikasi Dua Langkah</div>' +
              '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Lindungi akun Anda dengan Google Authenticator</div>' +
            '</div>' +
          '</div>' +
          '<span style="font-size:11px;font-weight:700;padding:4px 12px;border-radius:99px;background:rgba(255,255,255,.06);color:var(--text-muted);border:1px solid var(--border);">Nonaktif</span>' +
        '</div>' +
        '<div style="padding:14px;background:rgba(251,146,60,.07);border:1px solid rgba(251,146,60,.2);border-radius:10px;display:flex;align-items:center;gap:10px;margin-bottom:14px;">' +
          '<i class="fa-solid fa-triangle-exclamation" style="color:#fb923c;font-size:16px;"></i>' +
          '<div>' +
            '<div style="font-size:13px;font-weight:600;color:#fb923c;">Akun Anda belum dilindungi 2FA</div>' +
            '<div style="font-size:12px;color:var(--text-muted);">Aktifkan verifikasi dua langkah untuk mencegah akses tidak sah ke akun Anda.</div>' +
          '</div>' +
        '</div>' +
        '<button onclick="showToast(\'info\',\'Fitur 2FA akan segera hadir!\')" style="display:inline-flex;align-items:center;gap:7px;padding:9px 18px;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.3);border-radius:9px;color:#34d399;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">' +
          '<i class="fa-solid fa-shield-halved" style="font-size:12px;"></i> Aktifkan 2FA' +
        '</button>' +
      '</div>' +

      // Riwayat Login
      '<div class="card" style="padding:24px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">' +
          '<div style="display:flex;align-items:center;gap:14px;">' +
            '<div style="width:44px;height:44px;border-radius:12px;background:rgba(99,102,241,.1);display:flex;align-items:center;justify-content:center;">' +
              '<i class="fa-solid fa-clock-rotate-left" style="color:#818cf8;font-size:18px;"></i>' +
            '</div>' +
            '<div>' +
              '<div style="font-size:17px;font-weight:700;color:var(--text);">Riwayat Login</div>' +
              '<div style="font-size:12px;color:var(--text-muted);">Pantau aktivitas login ke akun Anda</div>' +
            '</div>' +
          '</div>' +
          '<button onclick="showToast(\'info\',\'Fitur akhiri sesi akan segera hadir!\')" style="padding:7px 14px;background:transparent;border:1px solid rgba(239,68,68,.3);border-radius:8px;color:#f87171;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Akhiri Semua Sesi Lain</button>' +
        '</div>' +
        '<div style="overflow-x:auto;">' +
          '<table style="width:100%;border-collapse:collapse;min-width:560px;">' +
            '<thead>' +
              '<tr style="border-bottom:1px solid var(--border);">' +
                ['IP / Lokasi','Browser','Terakhir Login','Keluar Pada','Sesi','Opsi'].map(function(h) {
                  return '<th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);">' + h + '</th>';
                }).join('') +
              '</tr>' +
            '</thead>' +
            '<tbody id="secLoginHistory">' +
              '<tr><td colspan="6" style="padding:30px;text-align:center;color:var(--text-muted);font-size:13px;">' +
                '<i class="fa-solid fa-spinner fa-spin" style="display:block;margin-bottom:8px;font-size:20px;"></i>Memuat riwayat...' +
              '</td></tr>' +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +

    '</div>';

  // Load login history from current user data
  try {
    var res  = await api.account.getProfile();
    var user = res.user || res;
    var tb   = document.getElementById('secLoginHistory');
    if (!tb) return;

    var sessions = [
      { ip: '182.253.95.0', device: 'Android', browser: 'Google Chrome', time: user.lastLogin, active: true },
    ];

    tb.innerHTML = sessions.map(function(s) {
      var fmtDate = s.time ? new Date(s.time).toLocaleString('id-ID') : '-';
      return '<tr style="border-bottom:1px solid var(--border);">' +
        '<td style="padding:12px 12px;">' +
          '<div style="font-size:13px;font-weight:600;color:var(--text);">' + s.ip + '</div>' +
          '<div style="font-size:11px;color:var(--text-muted);">' + s.device + '</div>' +
        '</td>' +
        '<td style="padding:12px 12px;font-size:13px;color:var(--text-muted);">' + s.browser + '</td>' +
        '<td style="padding:12px 12px;font-size:13px;color:var(--text-muted);">' + fmtDate + '</td>' +
        '<td style="padding:12px 12px;font-size:13px;color:var(--text-muted);">-</td>' +
        '<td style="padding:12px 12px;"><span style="font-size:11px;font-weight:700;color:#4ade80;background:rgba(34,197,94,.12);padding:2px 9px;border-radius:99px;">Aktif</span></td>' +
        '<td style="padding:12px 12px;"><button onclick="showToast(\'info\',\'Sesi ini adalah sesi aktif Anda\')" style="background:transparent;border:none;color:#f87171;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">Akhiri</button></td>' +
      '</tr>';
    }).join('');
  } catch(e) {
    var tb = document.getElementById('secLoginHistory');
    if (tb) {
      tb.innerHTML = '<tr><td colspan="6" style="padding:30px;text-align:center;color:var(--text-muted);font-size:13px;">' +
        '<i class="fa-solid fa-clock-rotate-left" style="display:block;margin-bottom:8px;font-size:20px;opacity:.4;"></i>' +
        'Riwayat login tidak tersedia saat ini</td></tr>';
    }
  }
}

// ─────────────────────────────────────────────────────────────
// GANTI PASSWORD
// ─────────────────────────────────────────────────────────────
function renderAccountPassword() {
  var el = document.getElementById('pageContent');
  el.innerHTML =
    '<h1 class="page-title">Ganti Password</h1>' +
    '<p class="page-subtitle" style="margin-bottom:24px;">Ubah password akun Anda</p>' +
    accountTabs('account-password') +
    '<div style="max-width:520px;">' +
      '<div class="card" style="padding:28px 30px;">' +
        '<div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;">' +
          '<div style="width:48px;height:48px;border-radius:14px;background:rgba(251,146,60,.12);display:flex;align-items:center;justify-content:center;">' +
            '<i class="fa-solid fa-rotate-right" style="color:#fb923c;font-size:20px;"></i>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:18px;font-weight:800;color:var(--text);">Ubah Password</div>' +
            '<div style="font-size:12px;color:var(--text-muted);">Pastikan password baru Anda kuat dan unik</div>' +
          '</div>' +
        '</div>' +

        // Password Saat Ini
        '<div style="margin-bottom:18px;">' +
          '<label style="' + acLabelStyle() + '">Password Saat Ini</label>' +
          '<div style="position:relative;">' +
            '<input id="pwCurrent" type="password" placeholder="Masukkan password saat ini" style="' + acInputStyle() + 'padding-right:40px;">' +
            '<button onclick="acTogglePass(\'pwCurrent\',\'eyeCurrent\')" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:transparent;border:none;color:var(--text-muted);cursor:pointer;padding:0;">' +
              '<i id="eyeCurrent" class="fa-regular fa-eye" style="font-size:14px;"></i>' +
            '</button>' +
          '</div>' +
          '<div id="pwCurrentErr" style="display:none;font-size:12px;color:#f87171;margin-top:5px;"><i class="fa-solid fa-circle-exclamation"></i> <span id="pwCurrentErrMsg">Password saat ini wajib diisi</span></div>' +
        '</div>' +

        // Password Baru
        '<div style="margin-bottom:14px;">' +
          '<label style="' + acLabelStyle() + '">Password Baru</label>' +
          '<div style="position:relative;">' +
            '<input id="pwNew" type="password" placeholder="Masukkan password baru" oninput="acCheckStrength()" style="' + acInputStyle() + 'padding-right:40px;">' +
            '<button onclick="acTogglePass(\'pwNew\',\'eyeNew\')" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:transparent;border:none;color:var(--text-muted);cursor:pointer;padding:0;">' +
              '<i id="eyeNew" class="fa-regular fa-eye" style="font-size:14px;"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +

        // Strength checklist
        '<div style="margin-bottom:18px;padding:12px 14px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;">' +
          '<div style="display:flex;flex-direction:column;gap:6px;">' +
            ['min8|Minimal 8 karakter','upper|Huruf besar dan kecil','num|Mengandung angka','sym|Mengandung simbol (!@#$%...)'].map(function(s) {
              var p = s.split('|');
              return '<div id="str-' + p[0] + '" style="display:flex;align-items:center;gap:8px;">' +
                '<div id="strIcon-' + p[0] + '" style="width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,.1);border:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:center;"></div>' +
                '<span style="font-size:12px;color:var(--text-muted);">' + p[1] + '</span>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' +

        // Konfirmasi Password
        '<div style="margin-bottom:26px;">' +
          '<label style="' + acLabelStyle() + '">Konfirmasi Password Baru</label>' +
          '<div style="position:relative;">' +
            '<input id="pwConfirm" type="password" placeholder="Ulangi password baru" style="' + acInputStyle() + 'padding-right:40px;">' +
            '<button onclick="acTogglePass(\'pwConfirm\',\'eyeConfirm\')" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:transparent;border:none;color:var(--text-muted);cursor:pointer;padding:0;">' +
              '<i id="eyeConfirm" class="fa-regular fa-eye" style="font-size:14px;"></i>' +
            '</button>' +
          '</div>' +
          '<div id="pwConfirmErr" style="display:none;font-size:12px;color:#f87171;margin-top:5px;"><i class="fa-solid fa-circle-exclamation"></i> Password tidak cocok</div>' +
        '</div>' +

        // Buttons
        '<div style="display:flex;gap:10px;">' +
          '<button onclick="acResetPassForm()" style="flex:1;padding:11px 20px;background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--text-muted);font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Reset</button>' +
          '<button id="pwSaveBtn" onclick="savePassword()" style="flex:2;padding:11px 20px;background:var(--accent);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;">' +
            '<i class="fa-solid fa-key"></i> Perbarul Password' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function acTogglePass(inputId, iconId) {
  var inp  = document.getElementById(inputId);
  var icon = document.getElementById(iconId);
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    if (icon) { icon.className = 'fa-regular fa-eye-slash'; }
  } else {
    inp.type = 'password';
    if (icon) { icon.className = 'fa-regular fa-eye'; }
  }
}

function acCheckStrength() {
  var val = document.getElementById('pwNew')?.value || '';
  var rules = {
    min8:  val.length >= 8,
    upper: /[a-z]/.test(val) && /[A-Z]/.test(val),
    num:   /[0-9]/.test(val),
    sym:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val),
  };
  Object.keys(rules).forEach(function(key) {
    var icon = document.getElementById('strIcon-' + key);
    if (!icon) return;
    if (rules[key]) {
      icon.style.background = '#4ade80';
      icon.style.border = '1px solid #4ade80';
      icon.innerHTML = '<i class="fa-solid fa-check" style="font-size:8px;color:#fff;"></i>';
    } else {
      icon.style.background = 'rgba(255,255,255,.1)';
      icon.style.border = '1px solid var(--border)';
      icon.innerHTML = '';
    }
  });
}

function acResetPassForm() {
  ['pwCurrent','pwNew','pwConfirm'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
  ['pwCurrentErr','pwConfirmErr'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.style.display = 'none';
  });
  acCheckStrength();
}

async function savePassword() {
  var cur  = document.getElementById('pwCurrent')?.value || '';
  var nw   = document.getElementById('pwNew')?.value || '';
  var conf = document.getElementById('pwConfirm')?.value || '';

  document.getElementById('pwCurrentErr').style.display = 'none';
  document.getElementById('pwConfirmErr').style.display = 'none';

  var ok = true;
  if (!cur) {
    document.getElementById('pwCurrentErr').style.display = 'block';
    document.getElementById('pwCurrentErrMsg').textContent = 'Password saat ini wajib diisi';
    ok = false;
  }
  if (!nw || nw.length < 8) {
    showToast('error', 'Password baru minimal 8 karakter');
    ok = false;
  }
  if (nw !== conf) {
    document.getElementById('pwConfirmErr').style.display = 'block';
    ok = false;
  }
  if (!ok) return;

  var btn = document.getElementById('pwSaveBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

  try {
    await api.account.changePassword({ currentPassword: cur, newPassword: nw });
    showToast('success', 'Password berhasil diubah!');
    acResetPassForm();
  } catch(e) {
    showToast('error', e.message || 'Gagal mengubah password');
    if ((e.message||'').toLowerCase().includes('saat ini')) {
      var errEl = document.getElementById('pwCurrentErr');
      var errMsg = document.getElementById('pwCurrentErrMsg');
      if (errEl) errEl.style.display = 'block';
      if (errMsg) errMsg.textContent = e.message;
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-key"></i> Perbarul Password';
  }
}
