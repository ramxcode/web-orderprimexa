// ===== ROUTE MAP =====
const ROUTES = {
  // Panel Admin
  'dashboard':          renderDashboard,
  'analytics':          renderAnalytics,
  'topup':              renderTopUp,
  'orders':             renderOrders,
  'database':           renderDatabase,
  'payment-methods':    renderPaymentMethods,
  'payment-gateway':    renderPaymentSettings,     // fix: was renderPaymentGateway (undefined)
  'payment-settings':   renderPaymentSettings,     // alias agar tab Pengaturan tidak redirect ke dashboard
  'payment-transactions': renderPaymentTransactions,
  'api-payment':        renderApiPayment,
  'sync-products':      renderSyncProducts,
  // Bot Settings
  'bot-settings':       renderBotSettings,
  'bot-messages':       renderBotMessages,
  'bot-integration':    renderBotIntegration,
  'bot-logs':           renderBotLogs,
  // Kelola Produk
  'products':           renderProducts,
  'categories':         renderCategories,
  'product-types':      renderProductTypes,
  'product-variants':   renderProductVariants,
  'stock-data':         renderStockData,
  'featured-products':  renderFeaturedProducts,
  'flash-sale':         renderFlashSale,
  // Kustomisasi
  'general-config':     renderGeneralConfig,
  'static-pages':       renderStaticPages,
  'seo-pixel':          renderSeoPixel,
  'widget':             renderWidget,
  // Pelanggan
  'customers':          renderCustomers,
  'customer-detail':    renderCustomerDetail,
  'customer-edit':      renderCustomerEdit,
  'vouchers':           renderVouchers,
  // Manajemen Tim
  'team-users':         renderTeamUsers,
  'team-create':        renderTeamCreate,
  'team-roles':         renderTeamRoles,
  'team-logs':          renderTeamLogs,
  // Akun
  'account-profile':    renderAccountProfile,
  'account-security':   renderAccountSecurity,
  'account-password':   renderAccountPassword,
  // Sub-pages (Tambah / Edit — tidak ada di sidebar tapi harus punya route)
  'add-product':        renderAddProduct,
  'edit-product':       renderEditProduct,
  'voucher-form':       renderVoucherForm,
};

// ===== ROUTER =====
function navigate(page) {
  history.pushState({}, '', '/admin/' + page);
  handleRoute();
}

function handleRoute() {
  // Baca halaman dari pathname: /admin/dashboard → 'dashboard'
  const rawPath = location.pathname.replace(/^\/admin\/?/, '') || 'dashboard';
  const page    = rawPath.split('/')[0] || 'dashboard';
  const renderer = ROUTES[page] || renderDashboard;

  // Show skeleton
  document.getElementById('pageContent').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="skeleton" style="height:140px;border-radius:16px"></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
        ${Array(4).fill('<div class="skeleton" style="height:100px;border-radius:12px"></div>').join('')}
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px">
        <div class="skeleton" style="height:300px;border-radius:12px"></div>
        <div class="skeleton" style="height:300px;border-radius:12px"></div>
      </div>
    </div>`;

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Auto-expand correct accordion
  const botPages     = ['bot-settings','bot-messages','bot-integration','bot-logs'];
  const paymentPages = ['payment-methods','payment-gateway'];
  const productPages = ['products','categories','product-types','product-variants','stock-data','featured-products','flash-sale'];
  const customPages  = ['general-config','static-pages','seo-pixel','widget'];
  const custPages    = ['customers','vouchers'];
  const helpPages    = ['sync-products'];
  const teamPages    = ['team-users','team-create','team-roles','team-logs'];
  const acctPages    = ['account-profile','account-security','account-password'];

  if (botPages.includes(page))          openAccordion('bot');
  else if (paymentPages.includes(page)) openAccordion('payment');
  else if (productPages.includes(page)) openAccordion('products');
  else if (customPages.includes(page))  openAccordion('custom');
  else if (custPages.includes(page))    openAccordion('customer');
  else if (helpPages.includes(page))    openAccordion('help');
  else if (teamPages.includes(page))    openAccordion('team');
  else if (acctPages.includes(page))    openAccordion('account');
  else openAccordion('panel');

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebarOverlay').classList.remove('show');
  document.body.style.overflow = '';

  // Close profile dropdown
  closeProfileDropdown();

  // Prefetch fresh data from MongoDB, then render
  (async () => {
    try {
      if (typeof store !== 'undefined') await store.prefetch(page);
    } catch(e) { /* use static fallback */ }
    try {
      renderer();
    } catch(e) {
      console.error('Page render error:', e);
      // Jangan biarkan halaman terjebak di skeleton — tampilkan pesan error
      const el = document.getElementById('pageContent');
      if (el) el.innerHTML = `
        <div class="card" style="text-align:center;padding:40px;color:var(--text-muted)">
          <i class="fa-solid fa-triangle-exclamation" style="font-size:32px;color:var(--warning);margin-bottom:12px;display:block"></i>
          <div style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:8px">Gagal memuat halaman</div>
          <div style="font-size:13px;margin-bottom:16px">${e.message || 'Terjadi kesalahan tidak terduga'}</div>
          <button class="btn btn-outline btn-sm" onclick="handleRoute()">
            <i class="fa-solid fa-rotate-right"></i> Coba Lagi
          </button>
        </div>`;
    }
    // Re-apply logo setelah render (sidebar tidak berubah tapi logo-box bisa ter-reset)
    if (typeof window._applyAdminLogo === 'function') window._applyAdminLogo();
  })();
}


window.addEventListener('popstate', handleRoute);
window.addEventListener('DOMContentLoaded', async () => {
  applyTheme();
  initTooltips();

  // ── Auth Guard ──────────────────────────────────────────────
  // Token dari localStorage dipakai sebagai Bearer fallback.
  // Autentikasi sesungguhnya diverifikasi oleh server via httpOnly cookie.
  // JANGAN redirect ke login hanya karena localStorage kosong —
  // user mungkin punya cookie yang valid.
  const token = localStorage.getItem('ramx_admin_token') ||
                localStorage.getItem('ramx_token') ||
                sessionStorage.getItem('ramx_token') || '';

  // Verifikasi ke backend — kirim cookie httpOnly (credentials:include) + Bearer header sebagai fallback
  try {
    const apiBase = (() => {
      const h = window.location.hostname;
      if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:5000/api';
      return window.location.origin + '/api';
    })();
    const res = await fetch(apiBase + '/auth/me', {
      headers: { 'Authorization': 'Bearer ' + (token || '') },
      credentials: 'include',   // kirim httpOnly cookie secara otomatis
    });
    if (!res.ok) throw new Error('Unauthorized');
    // Apply avatar admin jika ada
    try {
      var meData = await res.json();
      var adminUser = meData.user || meData;
      if (adminUser && adminUser.avatar) {
        var imgHtml = '<img src="' + adminUser.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display=\'none\'">';
        ['profile-avatar','topbar-avatar','dropdown-avatar'].forEach(function(id) {
          var el = document.querySelector('.' + id);
          if (el) { el.innerHTML = imgHtml; el.style.fontSize = '0'; }
        });
      }
    } catch(e) { /* silent */ }
  } catch (e) {
    // Token/cookie tidak valid → hapus cookie (server) + localStorage, redirect ke login
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch(_) {}
    localStorage.removeItem('ramx_admin_token');
    localStorage.removeItem('ramx_token');
    sessionStorage.removeItem('ramx_token');
    window.location.replace('/admin/login');
    return;
  }


  // Token valid → muat logo & nama toko dari config, lalu render halaman
  // Simpan di window agar bisa dipanggil ulang setelah navigate
  window._applyAdminLogo = function() {
    try {
      var safeUrl    = window._adminLogoUrl    || '';
      var faviconUrl = window._adminFaviconUrl || '';
      var storeName  = window._adminStoreName  || '';
      // Apply logo ke sidebar logo-box
      var logoBox  = document.querySelector('.logo-box');
      var logoText = document.querySelector('.logo-text');
      if (logoBox && safeUrl) {
        logoBox.innerHTML = '<img src="' + safeUrl + '" style="width:100%;height:100%;object-fit:contain;border-radius:7px;" onerror="this.style.display=\'none\'">';
        logoBox.style.background = 'transparent';
        logoBox.style.boxShadow  = 'none';
      }
      if (logoText && storeName) logoText.textContent = storeName;
      // Apply favicon ke tab browser
      if (faviconUrl) {
        var favEl = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
        if (!favEl) {
          favEl = document.createElement('link');
          favEl.rel = 'icon';
          document.head.appendChild(favEl);
        }
        favEl.href = faviconUrl;
      }
      // Update title tab
      if (storeName) {
        document.title = 'Admin Panel \u2014 ' + storeName;
      }
    } catch(e) {}
  };

  try {
    var cfgR = await fetch('/api/config/store_settings', { credentials: 'include' });
    if (cfgR.ok) {
      var cfgJ = await cfgR.json();
      var cfg  = cfgJ.data || cfgJ.value || cfgJ;
      // Validasi URL helper
      function _admSafeUrl(u) {
        if (!u) return '';
        if (/^data:image\//i.test(u) || /^https?:\/\//i.test(u)) return u;
        return '';
      }
      var rawLogo    = cfg.logoUrl    || '';
      var rawFavicon = cfg.faviconUrl || '';
      if (_admSafeUrl(rawLogo))    window._adminLogoUrl    = rawLogo;
      if (_admSafeUrl(rawFavicon)) window._adminFaviconUrl = rawFavicon;
      if (cfg.storeName)           window._adminStoreName  = cfg.storeName;
      window._applyAdminLogo();
    }
  } catch(e) { /* silent — fallback ke default */ }

  const rawPath = location.pathname.replace(/^\/admin\/?/, '');
  if (!rawPath || rawPath === 'login') {
    history.replaceState({}, '', '/admin/dashboard');
  }
  handleRoute();
});

// ===== ACCORDION =====
function toggleAccordion(id) {
  const menu  = document.getElementById(id + 'Menu');
  const arrow = document.getElementById(id + 'Arrow');
  if (!menu) return;
  const isOpen = menu.classList.toggle('open');
  if (arrow) {
    arrow.className = `fa-solid fa-chevron-${isOpen ? 'up' : 'down'} nav-arrow`;
  }
}

function openAccordion(id) {
  const menu  = document.getElementById(id + 'Menu');
  const arrow = document.getElementById(id + 'Arrow');
  if (!menu) return;
  menu.classList.add('open');
  if (arrow) arrow.className = 'fa-solid fa-chevron-up nav-arrow';
}

// ===== SIDEBAR COLLAPSE (desktop) =====
function toggleCollapse() {
  const sidebar  = document.getElementById('sidebar');
  const wrapper  = document.getElementById('mainWrapper');
  const icon     = document.getElementById('collapseIcon');
  const isCollapsed = sidebar.classList.toggle('collapsed');
  wrapper.classList.toggle('collapsed', isCollapsed);
  if (icon) {
    icon.className = isCollapsed
      ? 'fa-solid fa-angles-right'
      : 'fa-solid fa-angles-left';
  }
  // Add data-tooltip to nav links for collapsed state
  document.querySelectorAll('.nav-link').forEach(el => {
    el.setAttribute('data-tooltip', el.querySelector('span')?.textContent || '');
  });
  localStorage.setItem('sidebarCollapsed', isCollapsed ? '1' : '0');
}

// ===== SIDEBAR MOBILE =====
function toggleSidebarMobile() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  const isOpen   = sidebar.classList.toggle('mobile-open');
  overlay.classList.toggle('show', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeSidebarMobile() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebarOverlay').classList.remove('show');
  document.body.style.overflow = '';
}

// ===== PROFILE DROPDOWN =====
function toggleProfileDropdown() {
  const dd      = document.getElementById('profileDropdown');
  const toggle  = document.getElementById('profileToggle');
  const isOpen  = dd.classList.toggle('open');
  toggle.classList.toggle('open', isOpen);
  if (isOpen) {
    document.addEventListener('click', outsideProfileClose, { once: true });
  }
}

function outsideProfileClose(e) {
  const toggle = document.getElementById('profileToggle');
  if (toggle && !toggle.contains(e.target)) closeProfileDropdown();
}

function closeProfileDropdown() {
  document.getElementById('profileDropdown')?.classList.remove('open');
  document.getElementById('profileToggle')?.classList.remove('open');
}

// ===== THEME =====
const THEME_KEY = 'adminTheme';

function applyTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);

  // Restore sidebar collapse
  if (localStorage.getItem('sidebarCollapsed') === '1') {
    const sidebar = document.getElementById('sidebar');
    const wrapper = document.getElementById('mainWrapper');
    const icon    = document.getElementById('collapseIcon');
    sidebar?.classList.add('collapsed');
    wrapper?.classList.add('collapsed');
    if (icon) icon.className = 'fa-solid fa-angles-right';
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeIcon(next);
  showToast('success', `Mode ${next === 'dark' ? 'gelap' : 'terang'} aktif`);
  // Re-render charts jika di halaman dashboard atau analytics
  const page = location.pathname.replace(/^\/admin\/?/, '').split('/')[0];
  if (page === 'dashboard')  setTimeout(initDashboardCharts, 50);
  if (page === 'analytics')  setTimeout(updateAnalyticsData, 50);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (icon) icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

// ===== TOOLTIPS (collapsed sidebar) =====
function initTooltips() {
  document.querySelectorAll('.nav-link').forEach(el => {
    el.setAttribute('data-tooltip', el.querySelector('span')?.textContent || '');
  });
}

// ===== GLOBAL SEARCH =====
document.getElementById('globalSearch')?.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && this.value.trim()) {
    navigate('orders');
    setTimeout(() => {
      const el = document.getElementById('orderSearch');
      if (el) { el.value = this.value; this.value = ''; onOrderSearch(el.value); }
    }, 200);
  }
});

// ===== KEYBOARD SHORTCUT =====
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('globalSearch')?.focus();
  }
  if (e.key === 'Escape') { closeModal(); closeProfileDropdown(); }
});

// ===== PRINT INVOICE (global) =====
function printInvoice(id) {
  closeModal();
  showToast('info', `Mencetak invoice ${id}...`);
}
