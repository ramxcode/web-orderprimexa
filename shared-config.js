/**
 * shared-config.js
 * Fetch store_settings dari MongoDB dan apply logo + favicon ke semua halaman.
 * Di-include di setiap halaman frontend yang butuh logo/favicon sinkron.
 */
(function() {
  // ── Mini security helpers (self-contained, tidak bergantung main.js) ──
  function _scEsc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function _scSafeUrl(url) {
    if (!url) return '';
    var s = String(url).trim();
    if (/^javascript:/i.test(s) || /^data:/i.test(s) || /^vbscript:/i.test(s)) return '';
    return _scEsc(s);
  }
  // Khusus untuk <img src> dan <link rel="icon"> — izinkan data:image/* (base64 upload)
  function _scSafeImgSrc(url) {
    if (!url) return '';
    var s = String(url).trim();
    if (/^javascript:/i.test(s) || /^vbscript:/i.test(s)) return '';
    // data:image/* aman untuk img src / favicon (tidak bisa eksekusi script)
    if (/^data:image\//i.test(s)) return s;
    // data: tipe lain diblokir
    if (/^data:/i.test(s)) return '';
    return _scEsc(s);
  }

  function applyLogoIcon(logoUrl) {
    var safeUrl = _scSafeImgSrc(logoUrl); // izinkan base64 logo
    if (!safeUrl) return;
    // Selector diperluas: cakup .logo-icon di mana saja (dashboard, frontend, dll)
    document.querySelectorAll('.logo-icon').forEach(function(icon) {
      if (!icon.dataset.origHtml) icon.dataset.origHtml = icon.innerHTML;
      // Hapus background biru dengan !important agar override CSS class
      icon.style.setProperty('background', 'none', 'important');
      icon.style.setProperty('background-image', 'none', 'important');
      icon.style.setProperty('border-radius', '0', 'important');
      icon.style.setProperty('box-shadow', 'none', 'important');
      icon.style.setProperty('padding', '0', 'important');
      icon.style.setProperty('width', 'auto', 'important');
      icon.style.setProperty('height', 'auto', 'important');
      icon.innerHTML = '<img src="' + safeUrl + '" '
        + 'style="height:32px;width:auto;max-width:120px;object-fit:contain;display:block;" '
        + 'onerror="'
        +   'var p=this.parentElement;'
        +   'p.style.cssText=\'\';'
        +   'p.innerHTML=p.dataset.origHtml||\'R\''
        + '">';
    });
  }

  function applyFavicon(faviconUrl) {
    var safeUrl = _scSafeImgSrc(faviconUrl); // izinkan base64 favicon
    if (!safeUrl) return;

    var link = document.querySelector('link[rel="icon"]')
             || document.querySelector('link[rel="shortcut icon"]')
             || document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = safeUrl;
    document.head.appendChild(link);
  }

  async function loadStoreConfig() {
    try {
      // Cache-busting: tambah timestamp agar perubahan config langsung berlaku (L1 fix)
      var r = await fetch('/api/config/store_settings?_=' + Date.now());
      if (!r.ok) return;
      var j = await r.json();
      if (!j.success || !j.data) return;
      var s = j.data;
      if (s.logoUrl)    applyLogoIcon(s.logoUrl);
      if (s.faviconUrl) applyFavicon(s.faviconUrl);
      if (s.storeName) {
        // Update semua logo-text yang ada di halaman — set seluruh teks dengan storeName dari DB
        var cleanName = String(s.storeName);
        document.querySelectorAll('.logo-text').forEach(function(el) {
          el.textContent = cleanName;
        });
      }
    } catch(e) { /* silent */ }
  }

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadStoreConfig);
  } else {
    loadStoreConfig();
  }
})();

