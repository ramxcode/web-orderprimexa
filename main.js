// ── Security Helpers ─────────────────────────────────────────
// Escape HTML special chars — cegah XSS dari data yang di-render ke innerHTML
function _esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
// Validasi URL — hanya izinkan http/https/path relatif, blokir javascript: dan data:
function _safeUrl(url) {
  if (!url) return '#';
  var s = String(url).trim();
  if (/^javascript:/i.test(s) || /^data:/i.test(s) || /^vbscript:/i.test(s)) return '#';
  return s;
}
// Validasi URL untuk <img src> — izinkan data:image/* (base64 upload), blokir data:text/html dll
function _safeImgSrc(url) {
  if (!url) return '';
  var s = String(url).trim();
  // javascript: dan vbscript: selalu berbahaya
  if (/^javascript:/i.test(s) || /^vbscript:/i.test(s)) return '';
  // data:image/* aman untuk img src (tidak bisa eksekusi script)
  if (/^data:image\//i.test(s)) return s;
  // data: tipe lain (text/html, dll) diblokir
  if (/^data:/i.test(s)) return '';
  return s;
}

// ─────────────────────────────────────────────────────────────

function navTo(path, sectionId) {

  history.pushState({ path: path, section: sectionId }, '', path);

  if (sectionId) {
    var el = document.getElementById(sectionId);
    if (el) {
      var navH = (document.getElementById('navbar') || {}).offsetHeight || 70;
      var top  = el.getBoundingClientRect().top + window.scrollY - navH - 16;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Handle browser back/forward
window.addEventListener('popstate', function(e) {
  if (e.state && e.state.section) {
    var el = document.getElementById(e.state.section);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// Pada load: jika path adalah /produk-unggulan atau /produk → scroll ke section
(function handleInitialPath() {
  var path = window.location.pathname.replace(/\/$/, '');
  var sectionMap = {
    '/produk-unggulan': 'products',
    '/produk':          'categorySection',
  };
  var sectionId = sectionMap[path];
  if (sectionId) {
    window.addEventListener('load', function() {
      setTimeout(function() { navTo(path, sectionId); }, 400);
    });
  }
})();

// ===== DATA PRODUK =====
// Diisi dari API (MongoDB) oleh loadFromAPI() di bawah
let products = [];

// ===== DATA BENEFITS =====
// faIcon: class Font Awesome untuk icon benefit
// Referensi icon: https://fontawesome.com/icons
const benefits = [
  { faIcon:"fa-solid fa-shield-halved",    title:"Jujur & Terpercaya",             desc:"Setiap transaksi diproses secara aman dan transparan." },
  { faIcon:"fa-solid fa-credit-card",      title:"Metode Pembayaran Lengkap",      desc:"Mendukung QRIS, e-wallet, transfer bank, dan pembayaran digital lainnya." },
  { faIcon:"fa-solid fa-bolt",             title:"Pengiriman Instan",              desc:"Produk diproses cepat secara otomatis setelah pembayaran berhasil." },
  { faIcon:"fa-solid fa-sack-dollar",      title:"Harga Lebih Murah",              desc:"Dapatkan produk digital premium dengan harga terbaik." },
  { faIcon:"fa-solid fa-gift",             title:"Promo Menarik",                  desc:"Nikmati promo khusus setiap event dan periode tertentu." },
  { faIcon:"fa-brands fa-whatsapp",        title:"Customer Support via WhatsApp",  desc:"Tim support siap membantu pelanggan setiap hari." },
];

// ===== RENDER PRODUCT CARD =====
function renderCard(p) {
  var safeImg  = _esc(p.imageUrl || '');
  var safeIcon = _esc(p.icon || '');
  var safeBg   = _esc(p.bg || '');
  var safeName = _esc(p.name || '');
  var safeBadge= _esc(p.badge || '');
  var safePrice= _esc(p.price || '');
  // slug dipakai di data-* attribute — _esc cukup untuk HTML attribute context
  var slug     = _esc(p.slug || p.id || '');
  var safeId   = _esc(String(p.id || ''));

  var imgContent = safeImg
    ? '<img src="' + safeImg + '" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block" onerror="this.style.display=\'none\'">'
    : '<i class="' + safeIcon + '"></i>';

  return `
    <div class="product-card" data-slug="${slug}" style="animation-delay:${Math.random()*0.3}s;cursor:pointer">
      <div class="product-img" style="background:${safeBg}${safeImg ? ';padding:0;overflow:hidden' : ''}">
        ${imgContent}
        <button class="product-fav ${p.fav ? 'active' : ''}" data-favid="${safeId}" title="Favorite">
          <i class="${p.fav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
        </button>
      </div>
      <div class="product-info">
        <div class="product-cat-badge">${safeBadge}</div>
        <div class="product-name">${safeName}</div>
        <div class="product-price"><strong>${safePrice}</strong></div>
        <button class="btn-buy" data-buyslug="${slug}">
          <i class="fa-solid fa-cart-plus"></i> Beli Sekarang
        </button>
      </div>
    </div>
  `;
}


// ===== RENDER FEATURED =====
function renderFeatured() {
  const sorted = [...products].sort((a, b) => b.terjual - a.terjual).slice(0, 8);
  document.getElementById('featuredGrid').innerHTML = sorted.map(renderCard).join('');
}

// Global: simpan kategori API agar bisa dipakai renderPhoneMockup
var _phoneApiCategories = [];

// ===== RENDER PHONE MOCKUP (Hero) =====
function renderPhoneMockup() {
  // --- Kategori real dari API ---
  var catEl = document.getElementById('phoneMockupCategories');
  if (catEl && _phoneApiCategories.length) {
    var top4cats = _phoneApiCategories.slice(0, 4);
    var catBgs = ['rgba(59,130,246,0.2)','rgba(99,102,241,0.2)','rgba(234,179,8,0.2)','rgba(34,197,94,0.2)'];
    catEl.innerHTML = top4cats.map(function(c, i) {
      var icon     = _esc(c.icon || 'fa-solid fa-box');
      var name     = _esc(c.name || '');
      var nameTrunc = name.length > 7 ? name.substring(0, 7) + '…' : name;
      return '<div class="phone-cat">'
        + '<div class="phone-cat-icon" style="background:' + catBgs[i % catBgs.length] + '">'
        + '<i class="' + icon + '"></i></div>'
        + '<span>' + nameTrunc + '</span>'
        + '</div>';
    }).join('');
  }

  // --- Produk terlaris ---
  var el = document.querySelector('.phone-products');
  if (!el || !products.length) return;
  var top4 = [...products].sort(function(a,b){ return b.terjual - a.terjual; }).slice(0, 4);
  el.innerHTML = top4.map(function(p) {
    var safeImg  = _esc(p.imageUrl || '');
    var safeIcon = _esc(p.icon || '');
    var safeBg   = _esc(p.bg || '');
    var safePrice= _esc(p.price || '');
    var safeName = _esc(p.name || '');
    var img = safeImg
      ? '<img src="' + safeImg + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px;display:block;" onerror="this.style.display=\'none\'">'
      : '<i class="' + safeIcon + '" style="font-size:20px;color:#fff;"></i>';
    var nameTrunc = safeName.length > 10 ? safeName.substring(0, 10) + '…' : safeName;
    return '<div class="phone-product-card">'
      + '<div class="phone-product-img" style="background:' + safeBg + ';padding:' + (safeImg ? '0' : '') + ';overflow:hidden;">' + img + '</div>'
      + '<div class="phone-product-name">' + nameTrunc + '</div>'
      + '<div class="phone-product-price">' + safePrice + '</div>'
      + '</div>';
  }).join('');
}

// ===== FILTER CATEGORY =====
let currentCat = 'aplikasi';

// faIcon: class Font Awesome untuk icon kategori
const catConfig = {
  semua:     { faIcon:'fa-solid fa-border-all',     title:'Semua Produk' },
  aplikasi:  { faIcon:'fa-solid fa-mobile-screen',  title:'Aplikasi Premium' },
  streaming: { faIcon:'fa-solid fa-tv',             title:'Streaming' },
  editing:   { faIcon:'fa-solid fa-scissors',       title:'Editing' },
  design:    { faIcon:'fa-solid fa-palette',        title:'Design' },
  voucher:   { faIcon:'fa-solid fa-gamepad',        title:'Voucher Game' },
};

function filterCat(btn, cat) {
  document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentCat = cat;
  const cfg = catConfig[cat];
  document.getElementById('catSectionIcon').innerHTML = `<i class="${_esc(cfg.faIcon)}"></i>`;
  document.getElementById('catSectionTitle').textContent = cfg.title;
  const filtered = cat === 'semua' ? products : products.filter(p => p.cat === cat);
  document.getElementById('categoryGrid').innerHTML = filtered.map(renderCard).join('');
  document.getElementById('categorySection').scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function renderCategorySection() {
  const cfg = catConfig[currentCat];
  document.getElementById('catSectionIcon').innerHTML = `<i class="${_esc(cfg.faIcon)}"></i>`;
  const filtered = products.filter(p => p.cat === currentCat);
  document.getElementById('categoryGrid').innerHTML = filtered.map(renderCard).join('');
}


// ===== RENDER BENEFITS =====
function renderBenefits(data) {
  document.getElementById('benefitsGrid').innerHTML = data.map(b => `
    <div class="benefit-card">
      <div class="benefit-icon-wrap"><i class="${_esc(b.faIcon)}"></i></div>
      <div class="benefit-content">
        <div class="benefit-title">${_esc(b.title)}</div>
        <div class="benefit-desc">${_esc(b.desc)}</div>
      </div>
    </div>
  `).join('');
}


// ===== INIT =====
// Render kosong dulu, lalu load dari API (MongoDB)
renderFeatured();
renderCategorySection();

// ===== LOAD PRODUK & KATEGORI DARI API =====
async function loadFromAPI() {
  var apiBase = (window.RAMX_CONFIG && window.RAMX_CONFIG.apiUrl) ? window.RAMX_CONFIG.apiUrl : '/api';

  try {
    // 1. Load categories dari admin MongoDB
    var catRes = await fetch(apiBase + '/admin/categories');
    var catJson = await catRes.json();
    var apiCategories = (catJson.success && Array.isArray(catJson.data)) ? catJson.data.filter(function(c){ return c.isActive !== false; }) : [];
    _phoneApiCategories = apiCategories; // expose ke renderPhoneMockup

    // Rebuild catConfig dari API
    apiCategories.forEach(function(c) {
      var slug = c.slug || c.name.toLowerCase().replace(/\s+/g, '-');
      catConfig[slug] = { faIcon: c.icon || 'fa-solid fa-box', title: c.name };
    });

    // Rebuild cat-pills dari API
    var pillsEl = document.getElementById('catPills');
    if (pillsEl) {
      var pillsHTML = '<button class="cat-pill active" data-cat="semua" onclick="filterCat(this,\'semua\')"><i class="fa-solid fa-border-all"></i> Semua</button>';
      apiCategories.forEach(function(c) {
        var slug    = _esc(c.slug || c.name.toLowerCase().replace(/\s+/g, '-'));
        var icon    = _esc(c.icon || 'fa-solid fa-box');
        var cname   = _esc(c.name || '');
        // slug dipakai dalam onclick string — gunakan JSON.stringify agar karakter khusus aman
        var slugJs  = JSON.stringify(c.slug || c.name.toLowerCase().replace(/\s+/g, '-'));
        pillsHTML += '<button class="cat-pill" data-cat="' + slug + '" onclick="filterCat(this,' + slugJs + ')"><i class="' + icon + '"></i> ' + cname + '</button>';
      });
      pillsEl.innerHTML = pillsHTML;
    }

    // Set currentCat ke kategori pertama dari API (jika ada)
    if (apiCategories.length > 0) {
      currentCat = apiCategories[0].slug || apiCategories[0].name.toLowerCase().replace(/\s+/g, '-');
      var cfg = catConfig[currentCat];
      if (cfg) {
        var iconEl  = document.getElementById('catSectionIcon');
        var titleEl = document.getElementById('catSectionTitle');
        if (iconEl) iconEl.innerHTML = '<i class="' + _esc(cfg.faIcon) + '"></i>';
        if (titleEl) titleEl.textContent = cfg.title;
      }

    } else {
      // Tidak ada kategori — tampilkan semua
      currentCat = 'semua';
    }
  } catch(e) {
    console.warn('[loadFromAPI] categories error:', e.message);
  }

  try {
    // 2. Load products dari backend
    var prodRes = await fetch(apiBase + '/products?limit=100');
    var prodJson = await prodRes.json();
    if (prodJson.success && Array.isArray(prodJson.data)) {
      products = prodJson.data.map(function(p) {
        // Cocokkan cat dengan slug kategori dari apiCategories
        // p.category bisa berupa ObjectId, slug, atau nama — cari kecocokan
        var foundCat = null;
        if (p.category) {
          foundCat = apiCategories.find(function(c) {
            return c._id === p.category
              || c.slug === p.category
              || (c.name && c.name.toLowerCase().replace(/\s+/g, '-') === String(p.category).toLowerCase().replace(/\s+/g, '-'));
          });
        }
        var catSlug = foundCat
          ? (foundCat.slug || foundCat.name.toLowerCase().replace(/\s+/g, '-'))
          : (p.category ? String(p.category).toLowerCase().replace(/\s+/g, '-') : '');
        var catName  = foundCat ? foundCat.name : (p.categoryName || p.category || '');
        // Cari harga minimum dari variants jika ada
        var minPrice = p.minPrice || p.basePrice || p.price || 0;
        if (Array.isArray(p.variants) && p.variants.length > 0) {
          var prices = p.variants.map(function(v){ return v.price || 0; }).filter(function(x){ return x > 0; });
          if (prices.length) minPrice = Math.min.apply(null, prices);
        }
        return {
          id:       p._id,
          _id:      p._id,
          name:     p.name || 'Produk',
          slug:     p.slug || '',
          cat:      catSlug,
          badge:    catName,
          price:    'Mulai Rp' + Number(minPrice).toLocaleString('id-ID'),
          icon:     p.icon || 'fa-solid fa-box',
          bg:       p.bgColor || p.color || 'linear-gradient(135deg,#1a1a2e,#16213e)',
          imageUrl: p.imageUrl || '',
          terjual:  p.soldCount || p.sold || 0,
          fav:      false,
        };
      });
      // Urutkan A-Z berdasarkan nama produk
      products.sort(function(a,b){ return a.name.localeCompare(b.name,'id'); });
    }
  } catch(e) {
    console.warn('[loadFromAPI] products error:', e.message);
  }

  // Re-render setelah data loaded
  renderFeatured();
  renderCategorySection();
  renderPhoneMockup();
}

// Jalankan load dari API
loadFromAPI();

// ===== APPLY ADMIN CONFIG FROM LOCALSTORAGE =====
// Semua perubahan yang disimpan di admin panel (Konfigurasi Umum)
// akan diterapkan ke frontend melalui localStorage.

function _setText(id, val) {
  var el = document.getElementById(id);
  if (el && val !== undefined && val !== '') el.textContent = val;
}

function applyAdminConfig() {
  try {
    // ── 1. Hero & Tampilan Toko ──────────────────────────────
    var hero = JSON.parse(localStorage.getItem('ramx_hero') || 'null');
    if (hero) {
      _setText('heroBadgeText', hero.badgeText);

      // Judul hero (baris baru jadi <br>) — strip tag berbahaya, pertahankan <br>
      if (hero.title) {
        var titleEl = document.getElementById('heroTitle');
        if (titleEl) {
          // Hanya izinkan <br> — strip semua tag lain
          var safeTitle = _esc(hero.title).replace(/&lt;br&gt;/gi, '<br>');
          titleEl.innerHTML = safeTitle;
        }
      }

      // Subtitle — sama, strip tag berbahaya
      if (hero.subtitle) {
        var subEl = document.getElementById('heroSubtitle');
        if (subEl) {
          var safeSub = _esc(hero.subtitle).replace(/&lt;br&gt;/gi, '<br>');
          subEl.innerHTML = safeSub;
        }
      }

      // Tombol utama — pertahankan icon-nya, sanitasi URL dan teks
      if (hero.btn1Text) {
        var b1 = document.getElementById('heroBtn1');
        if (b1) {
          var icon1 = b1.querySelector('i');
          // Gunakan textNode untuk teks — cegah HTML injection di label tombol
          b1.innerHTML = icon1 ? icon1.outerHTML + ' ' : '';
          b1.appendChild(document.createTextNode(hero.btn1Text));
          if (hero.btn1Url) b1.href = _safeUrl(hero.btn1Url);
        }
      }

      // Tombol sekunder — sama
      if (hero.btn2Text) {
        var b2 = document.getElementById('heroBtn2');
        if (b2) {
          var icon2 = b2.querySelector('i');
          b2.innerHTML = icon2 ? icon2.outerHTML + ' ' : '';
          b2.appendChild(document.createTextNode(hero.btn2Text));
          if (hero.btn2Url) b2.href = _safeUrl(hero.btn2Url);
        }
      }

      // Statistik
      if (hero.stats && hero.stats.length >= 3) {
        _setText('stat1Num',   hero.stats[0].number);
        _setText('stat1Label', hero.stats[0].label);
        _setText('stat2Num',   hero.stats[1].number);
        _setText('stat2Label', hero.stats[1].label);
        _setText('stat3Num',   hero.stats[2].number);
        _setText('stat3Label', hero.stats[2].label);
      }

      // Nama toko di section "Kenapa Pilih X?"
      if (hero.shopName) _setText('shopNameBenefit', hero.shopName);
    }

    // ── 2. Detail Toko ───────────────────────────────────────
    var store = JSON.parse(localStorage.getItem('ramx_store') || 'null');
    if (store) {
      if (store.storeName) {
        // Navbar logo text
        var navLogo = document.querySelector('.nav-logo .logo-text');
        if (navLogo) navLogo.textContent = store.storeName;
        // Footer logo text
        var footerLogo = document.querySelector('.footer-logo .logo-text');
        if (footerLogo) footerLogo.textContent = store.storeName;
        // Benefits title & page title
        _setText('shopNameBenefit', store.storeName);
        document.title = _esc(store.storeName) + ' - Solusi Produk Digital';


      }
      if (store.storeDescription) {
        _setText('footerDesc', store.storeDescription);
      }
    }

    // ── 3. Informasi Kontak & Social ─────────────────────────
    var contact = JSON.parse(localStorage.getItem('ramx_contact') || 'null');
    if (contact) {
      // Nomor WhatsApp untuk tombol WA
      if (contact.whatsappNumber) {
        waNum = contact.whatsappNumber.replace(/\D/g, '');
        if (waNum.startsWith('0')) waNum = '62' + waNum.slice(1);
      }
      // Social media links di footer
      var socialBtns = document.querySelectorAll('.footer-socials .social-btn');
      var socialMap = [
        { key: 'facebookUrl',  idx: 0 },
        { key: 'instagramUrl', idx: 1 },
        { key: 'tiktokUrl',    idx: 2 },
        { key: 'youtubeUrl',   idx: 3 }
      ];
      socialMap.forEach(function(s) {
        if (contact[s.key] && socialBtns[s.idx]) {
          socialBtns[s.idx].href = _safeUrl(contact[s.key]);
        }
      });

    }

    // ── 4. Live Chat (WA bubble) ─────────────────────────────
    var lc = JSON.parse(localStorage.getItem('ramx_livechat') || 'null');
    if (lc) {
      var waFloat = document.getElementById('waFloat');
      if (waFloat) {
        // Tampilkan / sembunyikan floating WA
        var showOnMobile  = lc.showOnMobile  !== false;
        var showOnDesktop = lc.showOnDesktop !== false;
        var isMobile = window.innerWidth < 768;
        if ((isMobile && !showOnMobile) || (!isMobile && !showOnDesktop) || lc.isActive === false) {
          waFloat.style.display = 'none';
        }
      }
      // Teks tooltip bubble
      if (lc.tooltipMessage) {
        var bubble = document.getElementById('waBubble');
        if (bubble) {
          var closeBtn = bubble.querySelector('.wa-bubble-close');
          bubble.childNodes.forEach(function(n) {
            if (n.nodeType === Node.TEXT_NODE) bubble.removeChild(n);
          });
          bubble.insertBefore(document.createTextNode(lc.tooltipMessage + ' '), bubble.firstChild);
        }
      }
      // Warna tombol WA
      if (lc.buttonColor) {
        var waBtn = document.querySelector('.wa-btn');
        if (waBtn) waBtn.style.background = lc.buttonColor;
      }
    }

    // ── 5. Fitur Unggulan (Benefits) ─────────────────────────
    var savedBenefits = JSON.parse(localStorage.getItem('ramx_benefits') || 'null');
    if (savedBenefits && savedBenefits.length > 0) {
      renderBenefits(savedBenefits);
    } else {
      renderBenefits(benefits); // fallback ke data default
    }

  } catch(e) {
    // Jika localStorage tidak tersedia, gunakan data default
    renderBenefits(benefits);
  }
}

applyAdminConfig();

// Fetch hero config dari backend (MongoDB) — key: hero_settings
async function applyHeroFromAPI() {
  try {
    var r = await fetch('/api/config/hero_settings');
    if (!r.ok) return;
    var j = await r.json();
    if (!j.success || !j.data) return;
    var hero = j.data;

    // Badge — textContent aman
    var badgeEl = document.getElementById('heroBadgeText');
    if (badgeEl && hero.badgeText) badgeEl.textContent = hero.badgeText;

    // Judul hero — escape dulu, hanya <br> yang diizinkan
    var titleEl = document.getElementById('heroTitle');
    if (titleEl && hero.title) {
      titleEl.innerHTML = _esc(hero.title).replace(/\n/g, '<br>');
    }

    // Subtitle — sama, hanya <br> yang diizinkan
    var subEl = document.getElementById('heroSubtitle');
    if (subEl && hero.subtitle) {
      subEl.innerHTML = _esc(hero.subtitle).replace(/\n/g, '<br>');
    }

    // Tombol utama — textNode untuk label, _safeUrl untuk href
    if (hero.btn1Text) {
      var b1 = document.getElementById('heroBtn1');
      if (b1) {
        var ic1 = b1.querySelector('i');
        b1.innerHTML = ic1 ? ic1.outerHTML + ' ' : '';
        b1.appendChild(document.createTextNode(hero.btn1Text));
        if (hero.btn1Url) b1.href = _safeUrl(hero.btn1Url);
      }
    }

    // Tombol sekunder
    if (hero.btn2Text) {
      var b2 = document.getElementById('heroBtn2');
      if (b2) {
        var ic2 = b2.querySelector('i');
        b2.innerHTML = ic2 ? ic2.outerHTML + ' ' : '';
        b2.appendChild(document.createTextNode(hero.btn2Text));
        if (hero.btn2Url) b2.href = _safeUrl(hero.btn2Url);
      }
    }

    // Statistik — textContent aman
    if (hero.stats && hero.stats.length >= 3) {
      var s = function(id, val) { var el = document.getElementById(id); if (el && val) el.textContent = val; };
      s('stat1Num', hero.stats[0].number); s('stat1Label', hero.stats[0].label);
      s('stat2Num', hero.stats[1].number); s('stat2Label', hero.stats[1].label);
      s('stat3Num', hero.stats[2].number); s('stat3Label', hero.stats[2].label);
    }

    // Nama toko — textContent aman
    if (hero.shopName) { var snEl = document.getElementById('shopNameBenefit'); if (snEl) snEl.textContent = hero.shopName; }

    // Simpan ke localStorage
    try { localStorage.setItem('ramx_hero', JSON.stringify(hero)); } catch(e) {}
  } catch(e) { /* silent — gunakan fallback localStorage */ }
}

applyHeroFromAPI();

// Fetch Detail Toko dari MongoDB — key: store_settings
async function applyStoreFromAPI() {
  try {
    var r = await fetch('/api/config/store_settings');
    if (!r.ok) return;
    var j = await r.json();
    if (!j.success || !j.data) return;
    var s = j.data;
    // Nama toko di navbar & footer
    if (s.storeName) {
      var navLogo = document.querySelector('.nav-logo .logo-text');
      if (navLogo) navLogo.textContent = s.storeName;
      var footerLogo = document.querySelector('.footer-logo .logo-text');
      if (footerLogo) footerLogo.textContent = s.storeName;
      var shopBen = document.getElementById('shopNameBenefit');
      if (shopBen) shopBen.textContent = s.storeName;
      document.title = _esc(s.storeName) + ' - Solusi Produk Digital';


    }
    // Deskripsi di footer
    if (s.storeDescription) {
      var fdesc = document.getElementById('footerDesc');
      if (fdesc) fdesc.textContent = s.storeDescription;
    }
    // Logo
    if (s.logoUrl) {
      var safeLogoUrl = _safeImgSrc(s.logoUrl); // _safeImgSrc: izinkan data:image/* (base64 upload)

      // Cari semua logo-icon (div huruf) dan ganti dengan img
      document.querySelectorAll('.nav-logo .logo-icon, .footer-logo .logo-icon').forEach(function(icon) {
        if (!icon.dataset.origHtml) icon.dataset.origHtml = icon.innerHTML;
        // Hapus background biru dengan !important agar override CSS gradient
        icon.style.setProperty('background', 'none', 'important');
        icon.style.setProperty('background-image', 'none', 'important');
        icon.style.setProperty('border-radius', '0', 'important');
        icon.style.setProperty('box-shadow', 'none', 'important');
        icon.style.setProperty('padding', '0', 'important');
        icon.style.setProperty('width', 'auto', 'important');
        icon.style.setProperty('height', 'auto', 'important');
        icon.innerHTML = '<img src="' + safeLogoUrl + '" style="height:32px;width:auto;max-width:120px;object-fit:contain;display:block;" ' +
          'onerror="var p=this.parentElement;p.style.cssText=\'\';p.innerHTML=p.dataset.origHtml||\'R\'">';
      });
      // Juga update img tag yang sudah ada (logo-img)
      document.querySelectorAll('.logo-img').forEach(function(img) { img.src = safeLogoUrl; img.style.display = 'block'; });
      // Inject logo kecil ke phone mockup header (ganti bintang)
      var phoneLogoEl = document.getElementById('phoneMockupHeaderLogo');
      if (phoneLogoEl) {
        window._phoneLogoFallback = function(el) {
          el.parentElement.innerHTML = '<i class="fa-solid fa-star" style="font-size:10px;color:#3b82f6"></i>';
        };
        phoneLogoEl.innerHTML = '<img src="' + safeLogoUrl + '" style="height:18px;width:auto;max-width:40px;object-fit:contain;display:block;" onerror="_phoneLogoFallback(this)">';
      }
    }
    // Favicon
    if (s.faviconUrl) {
      var fav = document.querySelector('link[rel="icon"]') || document.createElement('link');
      fav.rel = 'icon'; fav.href = _safeImgSrc(s.faviconUrl); // _safeImgSrc: izinkan data:image/* (base64)
      document.head.appendChild(fav);
    }


    try { localStorage.setItem('ramx_store', JSON.stringify(s)); } catch(e) {}
  } catch(e) {}
}
applyStoreFromAPI();

// Fetch Informasi Kontak dari MongoDB — contact_config atau store_settings
async function applyContactFromAPI() {
  try {
    // Coba contact_config dulu, fallback ke store_settings
    var r = await fetch('/api/config/contact_config');
    var j = null;
    if (r.ok) {
      j = await r.json();
    }
    // Jika contact_config tidak ada, ambil dari store_settings
    if (!j || !j.success || !j.data) {
      r = await fetch('/api/config/store_settings');
      if (!r.ok) return;
      j = await r.json();
    }
    if (!j.success || !j.data) return;
    var c = j.data;
    // WhatsApp float button
    if (c.whatsappNumber) {
      var waBtn = document.getElementById('waFloat');
      if (waBtn) {
        var cleanWaNum = String(c.whatsappNumber).replace(/[^0-9]/g, '');
        if (cleanWaNum.startsWith('0')) cleanWaNum = '62' + cleanWaNum.slice(1);
        waBtn.addEventListener('click', function() { window.open('https://wa.me/' + cleanWaNum, '_blank', 'noopener,noreferrer'); });
      }

    }
    // Footer social links
    var links = {
      instagramUrl: '.footer-social a[href*="instagram"], #footerInstagram',
      tiktokUrl:    '.footer-social a[href*="tiktok"], #footerTiktok',
      facebookUrl:  '.footer-social a[href*="facebook"], #footerFacebook',
      telegramUrl:  '.footer-social a[href*="t.me"], #footerTelegram',
      discordUrl:   '.footer-social a[href*="discord"], #footerDiscord',
    };
    Object.keys(links).forEach(function(key) {
      if (!c[key]) return;
      var el = document.querySelector(links[key]);
      if (el) el.href = _safeUrl(c[key]);
    });

    // Footer contact info
    if (c.contactEmail) { var em = document.getElementById('footerEmail'); if (em) em.textContent = c.contactEmail; }
    if (c.phoneNumber)  { var ph = document.getElementById('footerPhone'); if (ph) ph.textContent = c.phoneNumber; }
    if (c.address)      { var ad = document.getElementById('footerAddress'); if (ad) ad.textContent = c.address; }
    try { localStorage.setItem('ramx_contact', JSON.stringify(c)); } catch(e) {}
  } catch(e) {}
}
applyContactFromAPI();


// ===== FAV TOGGLE =====
function toggleFav(e, id) {
  e.preventDefault(); e.stopPropagation();
  const p = products.find(x => x.id === id);
  if (p) { p.fav = !p.fav; renderFeatured(); renderCategorySection(); }
}

// ===== ADD TO CART TOAST =====
function addCart(e, name) {
  e.preventDefault(); e.stopPropagation();
  showToast(`<i class="fa-solid fa-cart-plus"></i> ${_esc(name)} ditambahkan ke keranjang!`);
}


function showToast(msg) {
  const t = document.getElementById('toast');
  t.innerHTML = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ===== THEME TOGGLE =====
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
  const icon = document.getElementById('themeIcon');
  if (current === 'dark') {
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  } else {
    icon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  }
}

// ===== MOBILE SEARCH TOGGLE =====
function toggleMobileSearch() {
  const bar = document.getElementById('mobileSearchbar');
  const isOpen = bar.classList.toggle('open');
  if (isOpen) {
    // Tutup menu jika sedang terbuka
    document.getElementById('mobileMenu').classList.remove('open');
    document.getElementById('mobileOverlay').classList.remove('open');
    document.body.style.overflow = '';
    // Fokus ke input search
    setTimeout(() => document.getElementById('mobileSearchInput').focus(), 100);
  }
}

// ===== MOBILE MENU =====
function toggleMobileMenu() {
  const menu    = document.getElementById('mobileMenu');
  const overlay = document.getElementById('mobileOverlay');
  const isOpen  = menu.classList.toggle('open');
  overlay.classList.toggle('open', isOpen);
  // Cegah scroll body saat menu terbuka
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

// Sinkronisasi tombol tema mobile dengan kondisi saat ini
function updateMobileThemeBtn() {
  const theme    = document.documentElement.getAttribute('data-theme');
  const icon     = document.getElementById('mobileThemeIcon');
  const text     = document.getElementById('mobileThemeText');
  if (!icon || !text) return;
  if (theme === 'light') {
    icon.className = 'fa-solid fa-moon';
    text.textContent = 'Dark Mode';
  } else {
    icon.className = 'fa-solid fa-sun';
    text.textContent = 'Light Mode';
  }
}

// ===== WHATSAPP =====
let waNum = '628123456789';
function closeWaBubble() { document.getElementById('waBubble').style.display = 'none'; }
function openWA() {
  var cleanNum = String(waNum).replace(/[^0-9]/g, '');
  window.open('https://wa.me/' + cleanNum + '?text=' + encodeURIComponent('Halo, saya butuh bantuan di Primexa'), '_blank', 'noopener,noreferrer');
}


// Admin Panel telah dipindahkan ke Admin Dashboard > Kustomisasi > Konfigurasi Umum






// ===== SCROLL ANIMATION =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.product-card, .benefit-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  observer.observe(el);
});

// ===== WA BUBBLE AUTO-HIDE =====
setTimeout(() => {
  const b = document.getElementById('waBubble');
  if (b) b.style.animation = 'fadeIn 0.4s ease';
}, 2000);

/* ============================================================
   WIDGET SYSTEM
   Membaca ramx_widgets dari localStorage (disimpan admin)
   dan merender popup, notif bar, floating button, dsb.
   ============================================================ */
(function initWidgets() {
  var widgets = [];
  try { widgets = JSON.parse(localStorage.getItem('ramx_widgets') || '[]'); } catch(e) { return; }
  if (!widgets || !widgets.length) return;

  var now = new Date();

  widgets.forEach(function(w) {
    if (!w.isActive) return;
    if (w.startAt && new Date(w.startAt) > now) return;
    if (w.endAt   && new Date(w.endAt)   < now) return;

    if (w.oncePerSession) {
      var key = 'wgt_seen_' + w.id;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    }

    var delay = (parseInt(w.delaySeconds) || 0) * 1000;
    setTimeout(function() {
      if      (w.type === 'popup')            renderPopupWidget(w);
      else if (w.type === 'notification-bar') renderNotifBar(w);
      else if (w.type === 'floating-button')  renderFloatingBtn(w);
      else if (w.type === 'floating-image')   renderFloatingImage(w);
      else if (w.type === 'toast')            renderToastWidget(w);
    }, delay);
  });

  /* Popup — sesuai design screenshot */
  function renderPopupWidget(w) {
    var el = document.createElement('div');
    el.id  = 'wgt-' + w.id;
    el.setAttribute('style', [
      'position:fixed','inset:0','z-index:99999',
      'display:flex','align-items:center','justify-content:center',
      'padding:16px','box-sizing:border-box',
      'background:rgba(0,0,0,0.72)',
      'animation:wgtFadeIn 0.3s ease',
    ].join(';'));

    var bannerContent;
    if (w.imageUrl) {
      bannerContent = '<img src="' + _safeImgSrc(w.imageUrl) + '" alt="" style="width:100%;display:block;max-height:320px;object-fit:cover;">';


    } else {
      bannerContent = [
        '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;',
          'min-height:280px;padding:32px 24px;text-align:center;gap:20px;">',
          '<div style="font-size:clamp(18px,5vw,26px);font-weight:900;color:#fff;line-height:1.25;letter-spacing:0.3px;">',
            _esc(w.title || 'PEMBERITAHUAN'),
          '</div>',
          '<div style="font-size:72px;line-height:1;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">',
            '&#x261D;&#xFE0F;',
          '</div>',
          '<div style="font-size:clamp(13px,3.5vw,17px);font-weight:900;color:#fff;letter-spacing:3px;text-transform:uppercase;">',
            'KLIK BANNER INI',
          '</div>',
        '</div>',
      ].join('');
    }

    // TIDAK pakai inline onclick agar aman dari HTML-entity decode bypass
    // Click akan dilampirkan via addEventListener setelah render

    var descHtml = '';
    if (w.description || w.buttonText) {
      descHtml = [
        '<div style="padding:18px 22px 16px;background:#fff;text-align:center;">',
          w.title && !w.imageUrl ? '' : '<div style="font-size:14px;font-weight:800;color:#111;letter-spacing:0.5px;margin-bottom:5px;text-transform:uppercase;">' + _esc(w.title || 'PEMBERITAHUAN') + '</div>',
          w.description ? '<div style="font-size:13px;color:#555;line-height:1.5;">' + _esc(w.description) + '</div>' : '',
          w.buttonText ? '<a class="wgt-btn-link" href="' + _safeUrl(w.linkUrl||'#') + '" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:12px;padding:9px 24px;background:#2563eb;color:#fff;border-radius:8px;font-weight:700;font-size:13px;text-decoration:none;">' + _esc(w.buttonText) + '</a>' : '',
        '</div>',
      ].join('');
    }

    el.innerHTML = [
      '<div style="position:relative;max-width:420px;width:100%;border-radius:14px;overflow:hidden;',
        'box-shadow:0 24px 80px rgba(0,0,0,0.65);">',
        '<button class="wgt-close-btn" style="',
          'position:absolute;top:10px;right:10px;z-index:10;',
          'background:rgba(0,0,0,0.55);color:#fff;border:none;border-radius:50%;',
          'width:32px;height:32px;font-size:20px;cursor:pointer;font-weight:700;',
          'line-height:32px;text-align:center;padding:0;">&times;</button>',
        '<div class="wgt-banner-inner" style="background:linear-gradient(160deg,#1a56db 0%,#2563eb 60%,#1d4ed8 100%);"' + (w.linkUrl ? ' style="cursor:pointer;"' : '') + '>',
          bannerContent,
        '</div>',
        descHtml,
      '</div>',
    ].join('');

    document.body.appendChild(el);

    // Pasang click handler via addEventListener — aman dari HTML entity decode bypass
    var closeBtn = el.querySelector('.wgt-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', function() { closeWgt(w.id); });

    if (w.linkUrl) {
      var bannerInner = el.querySelector('.wgt-banner-inner');
      if (bannerInner) {
        var safeWgtUrl = _safeUrl(w.linkUrl);
        bannerInner.style.cursor = 'pointer';
        bannerInner.addEventListener('click', function() {
          window.open(safeWgtUrl, '_blank', 'noopener,noreferrer');
          closeWgt(w.id);
        });
      }
    }

    el.addEventListener('click', function(e) { if (e.target === el) closeWgt(w.id); });
  }


  /* Notification Bar */
  function renderNotifBar(w) {
    var isTop = (w.position !== 'bottom');
    var el = document.createElement('div');
    el.id  = 'wgt-' + w.id;
    el.setAttribute('style', [
      'position:fixed', isTop ? 'top:0' : 'bottom:0', 'left:0', 'right:0',
      'z-index:99998', 'background:linear-gradient(90deg,#1a56db,#7c3aed)',
      'color:#fff', 'display:flex', 'align-items:center',
      'justify-content:center', 'gap:10px', 'padding:10px 16px',
      'font-size:14px', 'font-weight:600', 'flex-wrap:wrap',
      'animation:wgtSlideDown 0.4s ease',
    ].join(';'));
    el.innerHTML = [
      w.title       ? '<span>' + _esc(w.title) + '</span>' : '',
      w.description ? '<span style="opacity:0.85;font-weight:400;">' + _esc(w.description) + '</span>' : '',
      w.buttonText && w.linkUrl ? '<a href="' + _safeUrl(w.linkUrl) + '" target="_blank" rel="noopener noreferrer" style="background:#fff;color:#1a56db;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;text-decoration:none;">' + _esc(w.buttonText) + '</a>' : '',
      '<button class="wgt-notif-close" style="background:none;border:none;color:#fff;font-size:22px;cursor:pointer;opacity:0.8;line-height:1;margin-left:4px;">&times;</button>',
    ].join('');
    document.body.appendChild(el);
    var nb = el.querySelector('.wgt-notif-close');
    if (nb) nb.addEventListener('click', function() { closeWgt(w.id); });

  }

  /* Floating Button */
  function renderFloatingBtn(w) {
    if (!w.linkUrl) return;
    var pos = w.position || 'bottom-right';
    var el  = document.createElement('a');
    el.id   = 'wgt-' + w.id;
    el.href = _safeUrl(w.linkUrl);

    el.target = '_blank';
    var posStyle = pos === 'bottom-left' ? 'bottom:90px;left:20px' : 'bottom:90px;right:20px';
    el.setAttribute('style', [
      'position:fixed', posStyle, 'z-index:9998',
      'background:linear-gradient(135deg,#2563eb,#7c3aed)',
      'color:#fff', 'border-radius:50px', 'padding:12px 20px',
      'font-size:14px', 'font-weight:700', 'text-decoration:none',
      'box-shadow:0 4px 20px rgba(37,99,235,0.4)',
      'display:flex', 'align-items:center', 'gap:8px',
      'animation:wgtBounceIn 0.5s ease',
    ].join(';'));
    el.innerHTML = '<i class="fa-solid fa-message"></i> ' + _esc(w.buttonText || 'Chat');
    document.body.appendChild(el);
  }

  /* Floating Image */
  function renderFloatingImage(w) {
    if (!w.imageUrl) return;
    var pos    = w.position || 'bottom-right';
    var el     = document.createElement('div');
    el.id      = 'wgt-' + w.id;
    var posStyle = pos === 'bottom-left' ? 'bottom:100px;left:16px' : 'bottom:100px;right:16px';
    el.setAttribute('style', ['position:fixed', posStyle, 'z-index:9997', 'animation:wgtBounceIn 0.5s ease'].join(';'));
    el.innerHTML = [
      '<div style="position:relative;">',
        '<img class="wgt-float-img" src="' + _safeImgSrc(w.imageUrl) + '" style="width:120px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.3);cursor:pointer;">',


        '<button class="wgt-float-close" style="position:absolute;top:-6px;right:-6px;background:#e74c3c;color:#fff;border:none;border-radius:50%;width:22px;height:22px;font-size:13px;cursor:pointer;line-height:22px;">&times;</button>',
      '</div>',
    ].join('');
    document.body.appendChild(el);
    // Pasang event listeners setelah render — aman dari HTML entity decode bypass
    var img = el.querySelector('.wgt-float-img');
    if (img && w.linkUrl) {
      var safeUrl = _safeUrl(w.linkUrl);
      img.addEventListener('click', function() { window.open(safeUrl, '_blank', 'noopener,noreferrer'); });
    }
    var closeBtn = el.querySelector('.wgt-float-close');
    if (closeBtn) closeBtn.addEventListener('click', function() { closeWgt(w.id); });
  }


  /* Toast */
  function renderToastWidget(w) {
    var el = document.createElement('div');
    el.id  = 'wgt-' + w.id;
    el.setAttribute('style', [
      'position:fixed', 'bottom:80px', 'right:20px', 'z-index:9997',
      'background:#1e293b', 'color:#fff', 'border-radius:10px',
      'padding:14px 18px', 'max-width:300px',
      'box-shadow:0 8px 32px rgba(0,0,0,0.4)',
      'animation:wgtSlideIn 0.4s ease',
    ].join(';'));
    el.innerHTML = [
      w.title       ? '<div style="font-weight:700;margin-bottom:4px;">' + _esc(w.title) + '</div>' : '',
      w.description ? '<div style="font-size:13px;opacity:0.85;">' + _esc(w.description) + '</div>'  : '',
      w.buttonText && w.linkUrl ? '<a href="' + _safeUrl(w.linkUrl) + '" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;color:#60a5fa;font-size:13px;font-weight:600;text-decoration:none;">' + _esc(w.buttonText) + ' \u2192</a>' : '',
      '<button class="wgt-toast-close" style="position:absolute;top:8px;right:10px;background:none;border:none;color:rgba(255,255,255,0.5);font-size:18px;cursor:pointer;">&times;</button>',
    ].join('');
    document.body.appendChild(el);
    var tc = el.querySelector('.wgt-toast-close');
    if (tc) tc.addEventListener('click', function() { closeWgt(w.id); });
    setTimeout(function() { closeWgt(w.id); }, 6000);

  }

})();


function closeWgt(id) {
  var el = document.getElementById('wgt-' + id);
  if (!el) return;
  el.style.opacity    = '0';
  el.style.transition = 'opacity 0.25s ease';
  setTimeout(function() { if (el && el.parentNode) el.parentNode.removeChild(el); }, 280);
}

/* Keyframe animations untuk semua widget */
(function() {
  var s = document.createElement('style');
  s.textContent = [
    '@keyframes wgtFadeIn    { from{opacity:0}                             to{opacity:1} }',
    '@keyframes wgtSlideDown { from{transform:translateY(-100%);opacity:0} to{transform:translateY(0);opacity:1} }',
    '@keyframes wgtSlideIn   { from{transform:translateX(120%);opacity:0}  to{transform:translateX(0);opacity:1} }',
    '@keyframes wgtBounceIn  { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }',
  ].join('');
  document.head.appendChild(s);
})();

/* ============================================================
   AUTH STATE — Navbar Login / User Menu
   ============================================================ */
(function initAuthState() {
  var user = null;
  try { user = JSON.parse(localStorage.getItem('ramx_auth_user') || 'null'); } catch(e) {}

  var loginBtn       = document.getElementById('navLoginBtn');
  var userMenu       = document.getElementById('navUserMenu');
  var userName       = document.getElementById('navUserName');
  var userEmail      = document.getElementById('navUserEmail');
  var adminDashLink  = document.getElementById('navAdminDashboard');
  var userDashLink   = document.getElementById('navUserDashboard');

  if (!loginBtn || !userMenu) return;

  if (user) {
    loginBtn.style.display = 'none';
    userMenu.style.display = 'block';
    if (userName)  userName.textContent  = user.name  || user.telegram || 'Akun';
    if (userEmail) userEmail.textContent = user.email || ('@' + user.telegram) || '-';

    // Dashboard user — tampil untuk semua user login
    if (userDashLink) userDashLink.style.display = 'flex';

    // Admin Dashboard — hanya admin
    if (adminDashLink && user.role === 'admin') {
      adminDashLink.style.display = 'flex';
      if (userDashLink) userDashLink.style.display = 'none'; // admin pakai admin link
    }

    // Profil link
    var profileLink = document.getElementById('navProfileLink');
    if (profileLink) {
      profileLink.href = (user.role === 'admin') ? '/admin/account-profile' : '/profile';
    }
  } else {
    loginBtn.style.display = '';
    userMenu.style.display = 'none';
  }
})();

function toggleNavUserDropdown() {
  var dd = document.getElementById('navUserDropdown');
  if (!dd) return;
  var isOpen = dd.style.display === 'block';
  dd.style.display = isOpen ? 'none' : 'block';
}

async function handleLogout() {
  // Minta server hapus httpOnly cookie — JS tidak bisa hapus httpOnly cookie sendiri
  try {
    var apiBase = (window.RAMX_CONFIG && window.RAMX_CONFIG.apiUrl) || '/api';
    await fetch(apiBase + '/auth/logout', { method: 'POST', credentials: 'include' });
  } catch(e) { /* tetap lanjut logout meski request gagal */ }
  localStorage.removeItem('ramx_auth_user');
  localStorage.removeItem('ramx_token');
  localStorage.removeItem('ramx_remember');
  window.location.reload();
}


/* Tutup user dropdown saat klik di luar */
document.addEventListener('click', function(e) {
  var menu = document.getElementById('navUserMenu');
  var dd   = document.getElementById('navUserDropdown');
  if (!menu || !dd) return;
  if (!menu.contains(e.target)) {
    dd.style.display = 'none';
  }
});

// ── Product card — delegated click handlers (H3 fix) ──────────────
// Navigasi via data-slug (tidak pernah di-eval sebagai JS)
document.addEventListener('click', function(e) {
  // Klik tombol Beli Sekarang
  var buyBtn = e.target.closest('[data-buyslug]');
  if (buyBtn) {
    e.stopPropagation();
    window.location.href = '/b/' + buyBtn.dataset.buyslug;
    return;
  }
  // Klik tombol Favorit
  var favBtn = e.target.closest('[data-favid]');
  if (favBtn) {
    e.stopPropagation();
    toggleFav(e, favBtn.dataset.favid);
    return;
  }
  // Klik card (bukan tombol di dalamnya)
  var card = e.target.closest('.product-card[data-slug]');
  if (card && !e.target.closest('button')) {
    window.location.href = '/b/' + card.dataset.slug;
  }
});
