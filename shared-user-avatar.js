/**
 * shared-user-avatar.js
 * Script universal: fetch /auth/me dan apply avatar ke semua elemen
 * avatar di halaman (sidebar, topbar, dropdown) tanpa mengubah fillUser.
 * Include di akhir <body> setiap halaman yang butuh avatar.
 */
(function() {
  var API = (function() {
    var h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:5000/api';
    return location.origin + '/api';
  })();

  function getToken() {
    return localStorage.getItem('ramx_token')
        || sessionStorage.getItem('ramx_token')
        || localStorage.getItem('ramx_admin_token')
        || null;
  }

  function applyAvatarToEl(el, avatarUrl, init) {
    if (!el) return;
    el.style.overflow = 'hidden';
    el.innerHTML = '<img src="' + avatarUrl + '" '
      + 'style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" '
      + 'onerror="this.remove();this.parentElement.textContent=\'' + init + '\'">';
    el.style.fontSize = '0';
    el.style.padding = '0';
  }

  async function applyUserAvatar() {
    var token = getToken();
    // Jangan return early jika tidak ada token di localStorage —
    // user mungkin punya httpOnly cookie yang valid
    try {
      var headers = {};
      if (token) headers['Authorization'] = 'Bearer ' + token;
      var r = await fetch(API + '/auth/me', {
        headers: headers,
        credentials: 'include', // kirim httpOnly cookie secara otomatis
      });
      if (!r.ok) return;

      var data = await r.json();
      var u = data.user || data;
      if (!u || !u.avatar) return;

      var name = u.name || u.telegram || '?';
      var init = name.substring(0, 1).toUpperCase();

      // User dashboard: by ID
      ['sidebarAvatar', 'topbarAvatar', 'profileAvatarBig'].forEach(function(id) {
        applyAvatarToEl(document.getElementById(id), u.avatar, init);
      });

      // Admin panel: by class
      ['.profile-avatar', '.topbar-avatar', '.dropdown-avatar'].forEach(function(sel) {
        document.querySelectorAll(sel).forEach(function(el) {
          applyAvatarToEl(el, u.avatar, init);
        });
      });

      // Update localStorage cache dengan avatar terbaru
      try {
        var cached = JSON.parse(localStorage.getItem('ramx_auth_user') || 'null');
        if (cached) { cached.avatar = u.avatar; localStorage.setItem('ramx_auth_user', JSON.stringify(cached)); }
      } catch(e) { /* silent */ }

    } catch(e) { /* silent */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyUserAvatar);
  } else {
    applyUserAvatar();
  }
})();
