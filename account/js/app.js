/* ============================================================
   ACCOUNT APP.JS — Router & Auth untuk Customer Portal
   ============================================================ */

// ── Constants ─────────────────────────────────────────────────
var ACCT_BASE = '/account';
var _profileTab = 'profil';
var _selectedNominal = 0;
var _balanceTab = 'saldo';
var _wishlistSort = 'terbaru';

// ── Route Map ─────────────────────────────────────────────────
var ACCT_ROUTES = {
  'dashboard':    function() { renderDashboard(); },
  'orders':       function() { renderOrders(); },
  'order-detail': function() { renderOrderDetail(); },
  'balance':      function() { renderBalance(); },
  'wishlist':     function() { renderWishlist(); },
  'profile':      function() { _profileTab = 'profil';   renderProfile(); },
  'profile-security': function() { _profileTab = 'keamanan'; renderProfile(); },
  'profile-password': function() { _profileTab = 'password'; renderProfile(); },
};

// ── Navigation ────────────────────────────────────────────────
function acctNavigate(page, params) {
  var path = ACCT_BASE + '/' + page;
  history.pushState({ page: page, params: params || {} }, '', path);
  _renderPage(page, params);
}

function _renderPage(page, params) {
  // Tutup mobile drawer
  acctCloseMobileDrawer();

  // Update active sidebar
  document.querySelectorAll('.acct-nav-link').forEach(function(el) {
    el.classList.remove('active');
  });
  var activeLink = document.querySelector('.acct-nav-link[data-page="' + page + '"]');
  if (activeLink) activeLink.classList.add('active');

  // Render page
  acctPageLoading();
  var renderer = ACCT_ROUTES[page];
  if (renderer) {
    try { renderer(); } catch(e) { console.error('Page error:', e); }
  } else {
    document.getElementById('acctPageContent').innerHTML =
      '<div style="padding:40px;text-align:center;color:var(--text-muted);">Halaman tidak ditemukan</div>';
  }
}

window.addEventListener('popstate', function(e) {
  var state = e.state || {};
  var page = state.page || 'dashboard';
  _renderPage(page, state.params);
});

// ── Auth ──────────────────────────────────────────────────────
async function acctInitAuth() {
  var overlay = document.getElementById('acctAuthOverlay');
  if (overlay) overlay.style.display = 'flex';

  var token = localStorage.getItem('ramx_token') || '';
  if (!token) {
    window.location.href = '/login?redirect=' + encodeURIComponent(location.pathname);
    return;
  }

  try {
    var res  = await acctApi.auth.me();
    var user = res.user || res.data || res;

    if (!user || !user.id) throw new Error('Not authenticated');

    // Store user globally
    _acctUser.id    = user.id;
    _acctUser.name  = user.name || user.fullName || 'Pengguna';
    _acctUser.email = user.email || '';
    _acctUser.phone = user.phone || user.phoneNumber || '';
    _acctUser.balance = user.balance || 0;
    _acctUser.avatar  = user.avatar || user.avatarUrl || null;
    _acctUser.telegram = user.telegramUsername || null;
    _acctUser.emailVerified = !!user.emailVerifiedAt;
    _acctUser.phoneVerified = !!user.phoneVerifiedAt;

    // Update UI
    _acctUpdateUserUI();

    // Hide overlay
    if (overlay) overlay.style.display = 'none';

    // Fetch dashboard stats in background
    _acctLoadStats();

    // Render current page
    var page = _acctPageFromPath();
    if (!page || page === 'index.html') {
      history.replaceState({ page: 'dashboard' }, '', ACCT_BASE + '/dashboard');
      _renderPage('dashboard');
    } else {
      _renderPage(page);
    }

  } catch(e) {
    localStorage.removeItem('ramx_token');
    localStorage.removeItem('ramx_auth_user');
    window.location.href = '/login?redirect=' + encodeURIComponent(location.pathname);
  }
}

function _acctPageFromPath() {
  var pathname = location.pathname;
  if (pathname.startsWith(ACCT_BASE + '/')) {
    return pathname.slice(ACCT_BASE.length + 1).split('/')[0] || 'dashboard';
  }
  return 'dashboard';
}

async function _acctLoadStats() {
  try {
    // Gunakan data lokal dulu (dummy)
    _acctStats.balance        = _acctUser.balance;
    _acctStats.totalOrders    = _acctOrders.length;
    _acctStats.pendingPayment = _acctOrders.filter(function(o){ return o.status === 'pending_payment'; }).length;
    _acctStats.wishlistCount  = _acctWishlist.length;
    acctUpdateSidebarBalance(_acctUser.balance);
  } catch(e) { /* silent */ }
}

// ── Update User UI ────────────────────────────────────────────
function _acctUpdateUserUI() {
  var name  = _acctUser.name;
  var email = _acctUser.email;
  var ini   = name.split(' ').map(function(w){ return w[0]; }).join('').slice(0,2).toUpperCase();
  var bal   = acctFmtRp(_acctUser.balance);

  var els = {
    'acctSidebarName':    function(el){ el.textContent = name; },
    'acctSidebarEmail':   function(el){ el.textContent = email; },
    'acctSidebarAvatar':  function(el){ el.textContent = ini; },
    'acctSidebarBalance': function(el){ el.textContent = bal; },
    'acctTopbarName':     function(el){ el.textContent = name; },
    'acctTopbarAvatar':   function(el){ el.textContent = ini; },
    'acctDdName':         function(el){ el.textContent = name; },
    'acctDdEmail':        function(el){ el.textContent = email; },
    'acctDdAvatar':       function(el){ el.textContent = ini; },
  };
  Object.keys(els).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) els[id](el);
  });
}

// ── Sidebar ───────────────────────────────────────────────────
function acctToggleSidebar() {
  var sidebar = document.getElementById('acctSidebar');
  var wrapper = document.getElementById('acctWrapper');
  var isCollapsed = sidebar.classList.toggle('collapsed');
  if (wrapper) wrapper.classList.toggle('sidebar-collapsed', isCollapsed);
  localStorage.setItem('acct_sidebar_collapsed', isCollapsed ? '1' : '0');
}

function acctToggleMobileDrawer() {
  var sidebar  = document.getElementById('acctSidebar');
  var overlay  = document.getElementById('acctDrawerOverlay');
  var isOpen = sidebar.classList.toggle('mobile-open');
  if (overlay) overlay.classList.toggle('show', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function acctCloseMobileDrawer() {
  var sidebar = document.getElementById('acctSidebar');
  var overlay = document.getElementById('acctDrawerOverlay');
  sidebar.classList.remove('mobile-open');
  if (overlay) overlay.classList.remove('show');
  document.body.style.overflow = '';
}

// ── Profile Dropdown ──────────────────────────────────────────
function acctToggleDropdown() {
  var dd = document.getElementById('acctProfileDropdown');
  if (!dd) return;
  var isOpen = dd.classList.toggle('show');
  if (isOpen) {
    setTimeout(function() {
      document.addEventListener('click', _closeDropdownOutside, { once: true });
    }, 10);
  }
}

function _closeDropdownOutside(e) {
  var dd = document.getElementById('acctProfileDropdown');
  var btn = document.getElementById('acctProfileToggle');
  if (dd && !dd.contains(e.target) && btn && !btn.contains(e.target)) {
    dd.classList.remove('show');
  }
}

// ── Logout ────────────────────────────────────────────────────
function acctLogout() {
  acctCloseModal();
  acctModal(
    'Keluar dari akun?',
    '<p style="color:var(--text-secondary);font-size:14px;line-height:1.6;margin:0;">Anda perlu login kembali untuk mengakses dashboard pelanggan.</p>',
    '<button onclick="acctCloseModal()" style="padding:10px 20px;background:transparent;color:var(--text-muted);border:1px solid var(--border);border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Batal</button>' +
    '<button onclick="_acctDoLogout()" style="padding:10px 20px;background:#ef4444;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">Keluar</button>'
  );
}

function _acctDoLogout() {
  localStorage.removeItem('ramx_token');
  localStorage.removeItem('ramx_auth_user');
  acctCloseModal();
  acctToast('info', 'Anda berhasil keluar.', 2000);
  setTimeout(function() { window.location.href = '/login'; }, 1200);
}

// ── Theme ─────────────────────────────────────────────────────
function acctToggleTheme() {
  var isDark = document.body.classList.toggle('light-mode');
  var icon   = document.getElementById('acctThemeIcon');
  if (icon) icon.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  localStorage.setItem('acct_theme', isDark ? 'light' : 'dark');
}

function acctApplyTheme() {
  var theme = localStorage.getItem('acct_theme') || 'dark';
  var icon  = document.getElementById('acctThemeIcon');
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    if (icon) icon.className = 'fa-solid fa-moon';
  } else {
    document.body.classList.remove('light-mode');
    if (icon) icon.className = 'fa-solid fa-sun';
  }
}

function acctApplySidebarState() {
  var collapsed = localStorage.getItem('acct_sidebar_collapsed') === '1';
  var sidebar   = document.getElementById('acctSidebar');
  var wrapper   = document.getElementById('acctWrapper');
  if (collapsed && sidebar) {
    sidebar.classList.add('collapsed');
    if (wrapper) wrapper.classList.add('sidebar-collapsed');
  }
}

// ── Init ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', function() {
  acctApplyTheme();
  acctApplySidebarState();
  acctInitAuth();
});
