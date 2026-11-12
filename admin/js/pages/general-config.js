var _bnActiveId = null;
var _cfgAccordions = { hero: false, store: false, contact: false, social: false, benefits: false };

// Default initializers if global objects are not defined yet
if (typeof FRONTEND_CONFIG === 'undefined') {
    window.FRONTEND_CONFIG = {
        shopName: 'Primexa',
        hero: { badgeText: '🚀 Reseller Resmi', title: 'Topup Game Termurah', subtitle: 'Proses cepat dan otomatis 24 jam.', btn1Text: 'Beli Sekarang', btn1Url: '/produk', btn2Text: 'Daftar Reseller', btn2Url: '/register' },
        stats: [{number: '1M+', label: 'Transaksi'}, {number: '500K+', label: 'Pelanggan'}, {number: '99%', label: 'Sukses'}]
    };
}
if (typeof STORE_SETTINGS === 'undefined') {
    window.STORE_SETTINGS = { storeName: 'Primexa', websiteUrl: 'https://Primexa.com', storeDescription: '', faviconUrl: '', logoUrl: '', contactEmail: '', phoneNumber: '', whatsappNumber: '', address: '', instagramUrl: '', tiktokUrl: '', facebookUrl: '', telegramUrl: '', discordUrl: '', telegramBotToken: '', telegramBotUsername: '' };
}
if (typeof LIVE_CHAT_SETTINGS === 'undefined') {
    window.LIVE_CHAT_SETTINGS = { isActive: true, tooltipMessage: 'Butuh Bantuan?', defaultMessage: 'Halo admin', position: 'Kanan Bawah', buttonColor: '#25D366', showOnMobile: true, showOnDesktop: true, delaySeconds: 3 };
}
if (typeof SOCIAL_PROOF_SETTINGS === 'undefined') {
    window.SOCIAL_PROOF_SETTINGS = { isActive: true, sourceType: 'Transaksi Asli', title: 'Transaksi Berhasil', messageTemplate: '{customer} baru saja membeli {product}', position: 'Kiri Bawah', intervalSeconds: 5, displayDuration: 3, maxPerSession: 10, anonymizeCustomer: true };
}
if (typeof FEATURED_BENEFITS === 'undefined') {
    window.FEATURED_BENEFITS = [];
}

function renderGeneralConfig() {
    // Tampilkan loading sementara data diambil dari MongoDB
    var pc = document.getElementById('pageContent');
    if (pc) pc.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;gap:16px">' +
        '<i class="fa-solid fa-spinner fa-spin" style="font-size:32px;color:var(--accent)"></i>' +
        '<span style="color:var(--text-muted);font-size:14px">Memuat konfigurasi...</span></div>';

    // Load dari MongoDB lalu render form
    _loadAllConfigFromAPI().then(function() {
        _doRenderGeneralConfig();
    }).catch(function() {
        _doRenderGeneralConfig(); // fallback ke defaults jika API error
    });
}

// Load semua config dari MongoDB dan merge ke global objects
async function _loadAllConfigFromAPI() {
    try {
        var r = await api.config.getAll();
        if (!r.success || !r.data) return;
        var d = r.data;

        // Hero config — cek hero_settings (existing) atau hero_config (baru)
        var heroData = d.hero_settings || d.hero_config;
        if (heroData && typeof heroData === 'object') {
            if (!window.FRONTEND_CONFIG) window.FRONTEND_CONFIG = {};
            window.FRONTEND_CONFIG.hero = Object.assign({}, FRONTEND_CONFIG.hero || {}, heroData);
            if (heroData.stats) window.FRONTEND_CONFIG.stats = heroData.stats;
            if (heroData.shopName) window.FRONTEND_CONFIG.shopName = heroData.shopName;
        }

        // Store config — store_settings (existing) atau store_config (baru)
        var storeData = d.store_settings || d.store_config;
        if (storeData && typeof storeData === 'object') {
            if (!window.STORE_SETTINGS) window.STORE_SETTINGS = {};
            Object.assign(window.STORE_SETTINGS, storeData);
        }

        // Contact config — contact_config atau fallback ke store_settings
        if (d.contact_config && typeof d.contact_config === 'object') {
            if (!window.STORE_SETTINGS) window.STORE_SETTINGS = {};
            Object.assign(window.STORE_SETTINGS, d.contact_config);
        }

        // Live chat config — live_chat (existing) atau livechat_config (baru)
        var lcData = d.live_chat || d.livechat_config;
        if (lcData && typeof lcData === 'object') {
            if (!window.LIVE_CHAT_SETTINGS) window.LIVE_CHAT_SETTINGS = {};
            Object.assign(window.LIVE_CHAT_SETTINGS, lcData);
        }

        // Social proof
        if (d.social_config && typeof d.social_config === 'object') {
            if (!window.SOCIAL_PROOF_SETTINGS) window.SOCIAL_PROOF_SETTINGS = {};
            Object.assign(window.SOCIAL_PROOF_SETTINGS, d.social_config);
        }
    } catch(e) {
        console.warn('[general-config] Gagal load dari API:', e.message);
    }
}

// Render form dengan data yang sudah dimerge dari MongoDB
function _doRenderGeneralConfig() {
    var html = '<div class="page-header" style="margin-bottom: 24px;">' +
        '<h2 class="page-title">Konfigurasi Umum</h2>' +
        '<p class="page-subtitle" style="color: var(--text-muted); margin-top: 4px;">Kelola pengaturan umum toko Anda</p>' +
        '</div>';

    html += '<div style="display:flex; flex-direction:column; gap:16px;">';

    html += buildAccordion('hero',     'Hero & Tampilan Toko',  'Atur konten hero section dan statistik pada halaman utama webstore.', 'fa-star',     'orange',   buildHeroConfig(),        'saveHeroSection');
    html += buildAccordion('store',    'Detail Toko',           'Atur informasi dasar toko agar pelanggan mengenal brand Anda.',        'fa-store',    '#007bff',  buildStoreConfig(),       'saveStoreSection');
    html += buildAccordion('contact',  'Informasi Kontak',      'Permudah pelanggan menghubungi Anda dan tautkan media sosial.',        'fa-phone',    '#28a745',  buildContactConfig(),     'saveContactSection');
    html += buildAccordion('social',   'Social Proof',          'Yakinkan pengunjung dengan pemberitahuan transaksi sukses.',           'fa-users',    '#6f42c1',  buildSocialProofConfig(), 'saveSocialSection');
    html += buildAccordion('benefits', 'Fitur Unggulan',        'Atur fitur unggulan pada website agar lebih meyakinkan customer.',    'fa-sparkles', '#ffc107',  buildBenefitsConfig(),    'saveBenefitsSection');

    html += '</div>';

    document.getElementById('pageContent').innerHTML = html;

    updateLiveChatPreview();
    updateSocialProofPreview();
    toggleLiveChatFields();
    toggleSocialProofFields();
    renderBenefitsList();
}

function buildAccordion(id, title, desc, icon, color, content, saveFn) {
    var isOpen = _cfgAccordions[id] ? 'display:block;' : 'display:none;';
    var chevron = _cfgAccordions[id] ? 'fa-chevron-up' : 'fa-chevron-down';
    var borderStyle = _cfgAccordions[id] ? 'border-bottom:1px solid var(--border);' : '';

    var html = '<div class="card" style="margin:0; overflow:hidden;">';

    // Header
    html += '<div class="card-header" style="cursor:pointer; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; ' + borderStyle + '" id="acc-header-' + id + '" onclick="toggleConfigAccordion(\'' + id + '\')">' +
            '<div style="display:flex; align-items:center; gap:16px;">' +
                '<div style="width:40px; height:40px; border-radius:8px; background:color-mix(in srgb, ' + color + ' 15%, transparent); color:' + color + '; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">' +
                    '<i class="fa-solid ' + icon + '"></i>' +
                '</div>' +
                '<div>' +
                    '<div style="font-weight:600; font-size:16px; color:var(--text-primary);">' + title + '</div>' +
                    '<div style="font-size:13px; color:var(--text-muted); margin-top:2px;">' + desc + '</div>' +
                '</div>' +
            '</div>' +
            '<i id="acc-icon-' + id + '" class="fa-solid ' + chevron + '" style="color:var(--text-muted); flex-shrink:0;"></i>' +
        '</div>';

    // Save buttons row inside content
    var saveRow = '<div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px; padding-top:16px; border-top:1px solid var(--border);">' +
        '<button class="btn btn-outline" onclick="toggleConfigAccordion(\'' + id + '\')">' +
            '<i class="fa-solid fa-xmark"></i> Tutup' +
        '</button>' +
        '<button class="btn btn-primary" onclick="' + saveFn + '()">' +
            '<i class="fa-solid fa-floppy-disk"></i> Simpan' +
        '</button>' +
        '</div>';

    // Content
    html += '<div id="acc-content-' + id + '" style="padding:20px; box-sizing:border-box; overflow-x:hidden; max-width:100%; ' + isOpen + '">' + content + saveRow + '</div>';

    html += '</div>';
    return html;
}

function toggleConfigAccordion(id) {
    _cfgAccordions[id] = !_cfgAccordions[id];
    var content = document.getElementById('acc-content-' + id);
    var icon    = document.getElementById('acc-icon-' + id);
    var header  = document.getElementById('acc-header-' + id);
    if (_cfgAccordions[id]) {
        content.style.display = 'block';
        icon.className = 'fa-solid fa-chevron-up';
        if (header) header.style.borderBottom = '1px solid var(--border)';
    } else {
        content.style.display = 'none';
        icon.className = 'fa-solid fa-chevron-down';
        if (header) header.style.borderBottom = 'none';
    }
}

function buildHeroConfig() {
    var hc = FRONTEND_CONFIG.hero || {};
    var sc = FRONTEND_CONFIG.stats || [{}, {}, {}];
    
    var html = '<div style="margin-bottom:24px;">' +
        '<h4 style="margin-bottom:16px; display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-image" style="color:var(--text-muted);"></i> Hero Banner</h4>' +
        '<div class="form-group">' +
            '<label class="form-label">Badge Text</label>' +
            '<input type="text" id="cfg-badge-text" class="form-control" value="' + (hc.badgeText || '') + '">' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">Judul Hero</label>' +
            '<textarea id="cfg-hero-title" class="form-control" rows="2">' + (hc.title || '') + '</textarea>' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">Subtitle</label>' +
            '<textarea id="cfg-hero-subtitle" class="form-control" rows="3">' + (hc.subtitle || '') + '</textarea>' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">Tombol Utama</label>' +
            '<input type="text" id="cfg-btn1" class="form-control" style="margin-bottom:6px" value="' + (hc.btn1Text || '') + '" placeholder="Teks tombol">' +
            '<input type="text" id="cfg-btn1-url" class="form-control" value="' + (hc.btn1Url || '/produk') + '" placeholder="URL tujuan (misal: /produk atau https://...">' +
            '<small style="color:var(--text-muted);font-size:11px">URL tempat tombol mengarah saat diklik</small>' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">Tombol Sekunder</label>' +
            '<input type="text" id="cfg-btn2" class="form-control" style="margin-bottom:6px" value="' + (hc.btn2Text || '') + '" placeholder="Teks tombol">' +
            '<input type="text" id="cfg-btn2-url" class="form-control" value="' + (hc.btn2Url || '/register') + '" placeholder="URL tujuan (misal: /register atau https://...">' +
            '<small style="color:var(--text-muted);font-size:11px">URL tempat tombol mengarah saat diklik</small>' +
        '</div>' +
        '</div>';

    html += '<hr style="border-color:var(--border); margin:24px 0;">';
    
    html += '<div style="margin-bottom:24px;">' +
        '<h4 style="margin-bottom:16px; display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-chart-bar" style="color:var(--text-muted);"></i> Statistik Hero</h4>' +
        '<div class="cfg-grid-3">';
        
    for (var i=0; i<3; i++) {
        var statNum = sc[i] ? sc[i].number : '';
        var statLbl = sc[i] ? sc[i].label : '';
        html += '<div style="background:var(--bg-elevated); padding:16px; border-radius:8px; border:1px solid var(--border);">' +
            '<div style="margin-bottom:8px; font-weight:600; color:var(--text-muted);">Stat ' + (i+1) + '</div>' +
            '<input type="text" id="cfg-stat' + (i+1) + '-num" class="form-control" style="margin-bottom:8px;" placeholder="Angka" value="' + statNum + '">' +
            '<input type="text" id="cfg-stat' + (i+1) + '-label" class="form-control" placeholder="Label" value="' + statLbl + '">' +
        '</div>';
    }
    
    html += '</div></div>';
    
    html += '<div class="form-group">' +
        '<label class="form-label">Nama Toko (Untuk Benefit Section)</label>' +
        '<input type="text" id="cfg-shopname" class="form-control" value="' + (FRONTEND_CONFIG.shopName || '') + '">' +
    '</div>';

    return html;
}

function buildStoreConfig() {
    var ss = STORE_SETTINGS;
    
    var html = '<div class="cfg-grid-2-1">' +
        '<div>' +
            '<div class="form-group">' +
                '<label class="form-label">Nama Toko <span style="color:var(--error);">*</span></label>' +
                '<input type="text" id="cfg-store-name" class="form-control" value="' + (ss.storeName || '') + '" oninput="updateBrowserPreview()">' +
                '<div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Digunakan pada title, header, invoice, dan email</div>' +
            '</div>' +
            
            '<div class="form-group">' +
                '<label class="form-label">URL Website</label>' +
                '<div style="display:flex; gap:8px;">' +
                    '<input type="text" id="cfg-website-url" class="form-control" value="' + (ss.websiteUrl || '') + '" readonly style="background:var(--bg-elevated);">' +
                    '<button class="btn btn-outline" onclick="window.open(\'' + (ss.websiteUrl || '#') + '\', \'_blank\')"><i class="fa-solid fa-external-link"></i></button>' +
                '</div>' +
            '</div>' +
            
            '<div class="form-group">' +
                '<label class="form-label">Deskripsi Toko</label>' +
                '<textarea id="cfg-store-desc" class="form-control" rows="4" maxlength="500" oninput="document.getElementById(\'desc-count\').innerText=this.value.length+\'/500\'">' + (ss.storeDescription || '') + '</textarea>' +
                '<div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted); margin-top:4px;">' +
                    '<span>Deskripsi singkat untuk SEO dan footer</span>' +
                    '<span id="desc-count">' + (ss.storeDescription ? ss.storeDescription.length : 0) + '/500</span>' +
                '</div>' +
            '</div>' +
            
            '<hr style="border-color:var(--border); margin:24px 0;">' +
            
            '<div class="cfg-flex-logo">' +
                '<div>' +
                    '<label class="form-label">Favicon</label>' +
                    '<div style="display:flex; align-items:center; gap:12px;">' +
                        '<div id="cfg-favicon-preview" style="width:40px; height:40px; border-radius:8px; background:var(--bg-elevated); border:1px dashed var(--border); display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">' +
                            (ss.faviconUrl ? '<img src="'+ss.faviconUrl+'" style="width:100%; height:100%; object-fit:cover;">' : '<i class="fa-solid fa-globe" style="color:var(--text-muted);"></i>') +
                        '</div>' +
                        '<div>' +
                            '<div style="display:flex; gap:8px;">' +
                                '<button class="btn btn-sm btn-outline" onclick="document.getElementById(\'cfg-favicon-input\').click()">Unggah</button>' +
                                '<button class="btn btn-sm btn-ghost" onclick="resetFavicon()" style="color:var(--error);">Reset</button>' +
                            '</div>' +
                            '<input type="file" id="cfg-favicon-input" hidden accept="image/png,image/jpeg" onchange="handleFaviconUpload(this)">' +
                            '<div style="font-size:11px; color:var(--text-muted); margin-top:6px;">PNG/JPEG, rasio 1:1, maks. 1 MB</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div>' +
                    '<label class="form-label">Site Logo</label>' +
                    '<div style="display:flex; align-items:center; gap:12px;">' +
                        '<div id="cfg-logo-preview" style="width:100px; height:36px; border-radius:4px; background:var(--bg-elevated); border:1px dashed var(--border); display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">' +
                            (ss.logoUrl ? '<img src="'+ss.logoUrl+'" style="max-width:100%; max-height:100%; object-fit:contain;">' : '<i class="fa-solid fa-image" style="color:var(--text-muted);"></i>') +
                        '</div>' +
                        '<div>' +
                            '<div style="display:flex; gap:8px;">' +
                                '<button class="btn btn-sm btn-outline" onclick="document.getElementById(\'cfg-logo-input\').click()">Unggah</button>' +
                                '<button class="btn btn-sm btn-ghost" onclick="resetLogo()" style="color:var(--error);">Reset</button>' +
                            '</div>' +
                            '<input type="file" id="cfg-logo-input" hidden accept="image/png,image/jpeg" onchange="handleLogoUpload(this)">' +
                            '<div style="font-size:11px; color:var(--text-muted); margin-top:6px;">PNG/JPEG, 460×120px, maks. 1 MB</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            
        '</div>' +
        
        // Browser Preview
        '<div class="cfg-preview-pane">' +
            '<div style="background:var(--bg-elevated); border:1px solid var(--border); border-radius:8px; overflow:hidden;">' +
                '<div style="background:#202124; padding:8px 12px; display:flex; align-items:center; gap:8px;">' +
                    '<div style="display:flex; gap:6px;">' +
                        '<div style="width:10px; height:10px; border-radius:50%; background:#ed6a5e;"></div>' +
                        '<div style="width:10px; height:10px; border-radius:50%; background:#f4bf4f;"></div>' +
                        '<div style="width:10px; height:10px; border-radius:50%; background:#61c554;"></div>' +
                    '</div>' +
                    '<div style="background:#323639; border-radius:4px 4px 0 0; padding:6px 12px; display:flex; align-items:center; gap:8px; flex:1; max-width:200px; margin-left:12px;">' +
                        '<div id="bp-favicon" style="width:14px; height:14px; background:#fff; border-radius:50%; overflow:hidden;">' +
                            (ss.faviconUrl ? '<img src="'+ss.faviconUrl+'" style="width:100%; height:100%;">' : '') +
                        '</div>' +
                        '<div id="bp-title" style="color:#e8eaed; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + (ss.storeName || 'Store Name') + '</div>' +
                    '</div>' +
                '</div>' +
                '<div style="background:#fff; height:150px; padding:16px;">' +
                    '<div id="bp-logo" style="width:100px; height:30px; background:#f1f3f4; border-radius:4px; display:flex; align-items:center; justify-content:center;">' +
                        (ss.logoUrl ? '<img src="'+ss.logoUrl+'" style="max-width:100%; max-height:100%;">' : '<span style="color:#bdc1c6; font-size:10px;">LOGO</span>') +
                    '</div>' +
                    '<div style="width:100%; height:10px; background:#f1f3f4; border-radius:2px; margin-top:24px;"></div>' +
                    '<div style="width:60%; height:10px; background:#f1f3f4; border-radius:2px; margin-top:8px;"></div>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    return html;
}

function buildContactConfig() {
    var ss = STORE_SETTINGS;
    
    var html = '<div class="form-group">' +
            '<label class="form-label">Email Kontak</label>' +
            '<input type="email" id="cfg-email" class="form-control" value="' + (ss.contactEmail || '') + '">' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">Nomor Telepon</label>' +
            '<input type="tel" id="cfg-phone" class="form-control" value="' + (ss.phoneNumber || '') + '">' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">WhatsApp (Untuk CS & Notifikasi)</label>' +
            '<div style="position:relative;">' +
                '<i class="fa-brands fa-whatsapp" style="position:absolute; left:12px; top:10px; color:#25D366; font-size:18px;"></i>' +
                '<input type="text" id="cfg-whatsapp" class="form-control" style="padding-left:40px;" value="' + (ss.whatsappNumber || '') + '">' +
            '</div>' +
            '<div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Format internasional tanpa + dan spasi. Contoh: 6281234567890</div>' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">Alamat Lengkap</label>' +
            '<textarea id="cfg-address" class="form-control" rows="3">' + (ss.address || '') + '</textarea>' +
        '</div>';

    html += '<hr style="border-color:var(--border); margin:24px 0;">';
    
    html += '<h4 style="margin-bottom:16px; display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-share-nodes" style="color:var(--text-muted);"></i> Media Sosial</h4>';
    html +=
        '<div class="form-group">' +
            '<label class="form-label"><i class="fa-brands fa-instagram" style="color:#E1306C; margin-right:4px;"></i> Instagram</label>' +
            '<input type="text" id="cfg-instagram" class="form-control" placeholder="https://instagram.com/..." value="' + (ss.instagramUrl || '') + '">' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label"><i class="fa-brands fa-tiktok" style="color:var(--text-primary); margin-right:4px;"></i> TikTok</label>' +
            '<input type="text" id="cfg-tiktok" class="form-control" placeholder="https://tiktok.com/@..." value="' + (ss.tiktokUrl || '') + '">' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label"><i class="fa-brands fa-facebook" style="color:#1877F2; margin-right:4px;"></i> Facebook</label>' +
            '<input type="text" id="cfg-facebook" class="form-control" placeholder="https://facebook.com/..." value="' + (ss.facebookUrl || '') + '">' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label"><i class="fa-brands fa-telegram" style="color:#0088cc; margin-right:4px;"></i> Telegram</label>' +
            '<input type="text" id="cfg-telegram" class="form-control" placeholder="https://t.me/..." value="' + (ss.telegramUrl || '') + '">' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label"><i class="fa-brands fa-discord" style="color:#5865F2; margin-right:4px;"></i> Discord</label>' +
            '<input type="text" id="cfg-discord" class="form-control" placeholder="https://discord.gg/..." value="' + (ss.discordUrl || '') + '">' +
        '</div>';

    // ── Telegram Bot OTP Config ──
    var savedBotCfg = {};
    try { savedBotCfg = JSON.parse(localStorage.getItem('ramx_general_config') || '{}'); } catch(e){}
    var botToken    = savedBotCfg.telegramBotToken    || ss.telegramBotToken    || '';
    var botUsername = savedBotCfg.telegramBotUsername || ss.telegramBotUsername || '';

    html += '<hr style="border-color:var(--border); margin:24px 0;">';
    html += '<div style="border:1px solid rgba(42,171,238,0.25); border-radius:12px; border-left:4px solid #2AABEE; background:rgba(42,171,238,0.05); padding:20px; margin-bottom:24px;">' +
        '<div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">' +
            '<i class="fa-brands fa-telegram" style="font-size:22px; color:#2AABEE;"></i>' +
            '<div>' +
                '<h4 style="margin:0; font-size:15px;">Telegram Bot — OTP Login</h4>' +
                '<p style="margin:4px 0 0; font-size:12px; color:var(--text-muted);">Digunakan untuk kirim kode verifikasi ke pengguna saat login/daftar via Telegram</p>' +
            '</div>' +
        '</div>' +
        '<div style="background:rgba(42,171,238,0.08); border:1px solid rgba(42,171,238,0.2); border-radius:8px; padding:12px; margin-bottom:16px; font-size:12px; color:#93c5fd; line-height:1.6;">' +
            '<b>Cara mendapatkan Bot Token:</b><br>' +
            '1. Buka Telegram, cari <b>@BotFather</b><br>' +
            '2. Kirim perintah <code style="background:rgba(0,0,0,0.3);padding:1px 5px;border-radius:4px;">/newbot</code><br>' +
            '3. Ikuti instruksi dan salin token yang diberikan<br>' +
            '4. Paste token di field di bawah ini' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label"><i class="fa-solid fa-key" style="margin-right:4px;"></i> Bot Token</label>' +
            '<div style="position:relative;">' +
                '<input type="password" id="cfg-bot-token" class="form-control" placeholder="123456789:AAHxxxxxxxxxxxxxxxxxxxxxx" value="' + botToken + '" style="padding-right:44px;">' +
                '<button type="button" onclick="toggleBotTokenVis()" id="botTokenEye" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:14px;"><i class="fa-solid fa-eye"></i></button>' +
            '</div>' +
            '<p style="font-size:11px; color:var(--text-muted); margin-top:4px;">⚠️ Jaga kerahasiaan token ini. Jangan dibagikan ke siapapun.</p>' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label"><i class="fa-brands fa-telegram" style="color:#2AABEE; margin-right:4px;"></i> Username Bot (tanpa @)</label>' +
            '<div style="position:relative;">' +
                '<span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:14px;">@</span>' +
                '<input type="text" id="cfg-bot-username" class="form-control" placeholder="NamaBotKamu" value="' + botUsername + '" style="padding-left:28px;">' +
            '</div>' +
            '<p style="font-size:11px; color:var(--text-muted); margin-top:4px;">Username bot yang akan diarahkan ke pengguna untuk mendapat OTP.</p>' +
        '</div>' +
    '</div>';

    // Live Chat Widget Card
    var lc = LIVE_CHAT_SETTINGS;
    var lcChecked = lc.isActive ? 'checked' : '';
    var lcBadge = lc.isActive ? '<span class="badge badge-success" id="lc-status-badge">Aktif</span>' : '<span class="badge badge-error" id="lc-status-badge">Nonaktif</span>';
    
    html += '<div style="margin-top:32px; border:1px solid var(--border); border-radius:8px; border-left:4px solid #007bff; background:var(--bg-elevated); padding:20px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">' +
            '<div style="display:flex; align-items:center; gap:12px;">' +
                '<i class="fa-brands fa-whatsapp" style="font-size:24px; color:#25D366;"></i>' +
                '<h4 style="margin:0;">Live Chat Widget</h4>' +
                lcBadge +
            '</div>' +
            '<label class="switch">' +
                '<input type="checkbox" id="cfg-lc-active" ' + lcChecked + ' onchange="toggleLiveChatFields()">' +
                '<span class="switch-track"></span>' +
            '</label>' +
        '</div>' +
        '<p style="color:var(--text-muted); font-size:14px; margin-bottom:16px;">Tampilkan tombol chat WhatsApp floating di website.</p>' +
        '<div style="background:color-mix(in srgb, var(--warning) 15%, transparent); color:var(--warning); padding:12px; border-radius:6px; font-size:13px; margin-bottom:20px; display:flex; gap:8px;">' +
            '<i class="fa-solid fa-triangle-exclamation" style="margin-top:2px;"></i>' +
            '<span>Widget menggunakan nomor WhatsApp pada bagian informasi kontak. Pastikan nomor sudah diisi dengan benar.</span>' +
        '</div>' +
        
        '<div id="lc-fields" class="cfg-grid-2-1">' +
            '<div>' +
                '<div class="form-group">' +
                    '<label class="form-label">Pesan Tooltip</label>' +
                    '<input type="text" id="cfg-lc-tooltip" class="form-control" value="' + (lc.tooltipMessage || '') + '" oninput="updateLiveChatPreview()">' +
                '</div>' +
                '<div class="form-group">' +
                    '<label class="form-label">Pesan Default Chat</label>' +
                    '<input type="text" id="cfg-lc-message" class="form-control" value="' + (lc.defaultMessage || '') + '">' +
                '</div>' +
                '<div class="cfg-grid-2">' +
                    '<div class="form-group">' +
                        '<label class="form-label">Posisi</label>' +
                        '<select id="cfg-lc-position" class="form-control">' +
                            '<option value="Kanan Bawah" ' + (lc.position==='Kanan Bawah'?'selected':'') + '>Kanan Bawah</option>' +
                            '<option value="Kiri Bawah" ' + (lc.position==='Kiri Bawah'?'selected':'') + '>Kiri Bawah</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label class="form-label">Warna Tombol</label>' +
                        '<div style="display:flex; gap:8px;">' +
                            '<input type="color" id="cfg-lc-color" class="form-control" style="width:50px; padding:2px;" value="' + (lc.buttonColor || '#25D366') + '" onchange="updateLiveChatPreview()">' +
                            '<input type="text" class="form-control" value="' + (lc.buttonColor || '#25D366') + '" readonly id="cfg-lc-color-text" style="background:var(--bg-primary);">' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="cfg-grid-3" style="margin-top:8px;">' +
                    '<div class="form-group">' +
                        '<label class="form-label" style="display:flex; justify-content:space-between;">Mobile <input type="checkbox" id="cfg-lc-mobile" ' + (lc.showOnMobile?'checked':'') + '></label>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label class="form-label" style="display:flex; justify-content:space-between;">Desktop <input type="checkbox" id="cfg-lc-desktop" ' + (lc.showOnDesktop?'checked':'') + '></label>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label class="form-label">Delay Tampil (detik)</label>' +
                        '<input type="number" id="cfg-lc-delay" class="form-control" value="' + (lc.delaySeconds || 0) + '">' +
                    '</div>' +
                '</div>' +
            '</div>' +
            
            // Live Chat Preview
            '<div class="cfg-preview-pane" style="background:var(--bg-primary); border:1px solid var(--border); border-radius:8px; position:relative; overflow:hidden; min-height:160px; display:flex; align-items:center; justify-content:center;">' +
                '<div style="position:absolute; bottom:20px; right:20px; display:flex; align-items:center; gap:12px;">' +
                    '<div id="lc-preview-tooltip" style="background:var(--bg-card); padding:8px 12px; border-radius:20px; font-size:12px; font-weight:600; box-shadow:0 4px 6px rgba(0,0,0,0.1);">' + (lc.tooltipMessage || 'Butuh Bantuan?') + '</div>' +
                    '<div id="lc-preview-btn" style="width:50px; height:50px; border-radius:50%; background:' + (lc.buttonColor || '#25D366') + '; display:flex; align-items:center; justify-content:center; color:#fff; font-size:24px; box-shadow:0 4px 6px rgba(0,0,0,0.2);">' +
                        '<i class="fa-brands fa-whatsapp"></i>' +
                    '</div>' +
                '</div>' +
                '<div style="color:var(--text-muted); font-size:12px; position:absolute; top:12px;">Preview</div>' +
            '</div>' +
            
        '</div>' +
    '</div>';

    return html;
}

function buildSocialProofConfig() {
    var sp = SOCIAL_PROOF_SETTINGS;
    var spChecked = sp.isActive ? 'checked' : '';
    
    var html = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">' +
        '<div>' +
            '<h4 style="margin:0;">Aktifkan Social Proof</h4>' +
            '<p style="color:var(--text-muted); font-size:13px; margin-top:4px;">Tampilkan popup notifikasi pembelian untuk meningkatkan kepercayaan.</p>' +
        '</div>' +
        '<label class="switch">' +
            '<input type="checkbox" id="cfg-sp-active" ' + spChecked + ' onchange="toggleSocialProofFields()">' +
            '<span class="switch-track"></span>' +
        '</label>' +
    '</div>';

    html += '<div id="sp-fields" class="cfg-grid-2-1">' +
        '<div>' +
            '<div class="form-group">' +
                '<label class="form-label">Sumber Data</label>' +
                '<select id="cfg-sp-source" class="form-control">' +
                    '<option value="Transaksi Asli" ' + (sp.sourceType==='Transaksi Asli'?'selected':'') + '>Transaksi Asli (Hanya pesanan sukses)</option>' +
                    '<option value="Data Dummy" ' + (sp.sourceType==='Data Dummy'?'selected':'') + '>Data Dummy (Auto-generate)</option>' +
                    '<option value="Gabungan" ' + (sp.sourceType==='Gabungan'?'selected':'') + '>Gabungan (Transaksi Asli + Dummy jika sepi)</option>' +
                '</select>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Judul Notifikasi</label>' +
                '<input type="text" id="cfg-sp-title" class="form-control" value="' + (sp.title || '') + '" oninput="updateSocialProofPreview()">' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">Template Pesan</label>' +
                '<textarea id="cfg-sp-template" class="form-control" rows="2" oninput="updateSocialProofPreview()">' + (sp.messageTemplate || '') + '</textarea>' +
                '<div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;">' +
                    '<button class="btn btn-xs btn-outline" onclick="insertVariable(\'{customer}\')">{customer}</button>' +
                    '<button class="btn btn-xs btn-outline" onclick="insertVariable(\'{product}\')">{product}</button>' +
                    '<button class="btn btn-xs btn-outline" onclick="insertVariable(\'{city}\')">{city}</button>' +
                    '<button class="btn btn-xs btn-outline" onclick="insertVariable(\'{amount}\')">{amount}</button>' +
                    '<button class="btn btn-xs btn-outline" onclick="insertVariable(\'{time}\')">{time}</button>' +
                '</div>' +
            '</div>' +
            
            '<div class="cfg-grid-2">' +
                '<div class="form-group">' +
                    '<label class="form-label">Posisi</label>' +
                    '<select id="cfg-sp-position" class="form-control">' +
                        '<option value="Kiri Bawah" ' + (sp.position==='Kiri Bawah'?'selected':'') + '>Kiri Bawah</option>' +
                        '<option value="Kanan Bawah" ' + (sp.position==='Kanan Bawah'?'selected':'') + '>Kanan Bawah</option>' +
                    '</select>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label class="form-label">Sembunyikan Nama Customer</label>' +
                    '<div style="margin-top:8px;">' +
                        '<label class="switch">' +
                            '<input type="checkbox" id="cfg-sp-anon" ' + (sp.anonymizeCustomer?'checked':'') + ' onchange="updateSocialProofPreview()">' +
                            '<span class="switch-track"></span>' +
                        '</label>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            
            '<div class="cfg-grid-3">' +
                '<div class="form-group">' +
                    '<label class="form-label">Interval (detik)</label>' +
                    '<input type="number" id="cfg-sp-interval" class="form-control" value="' + (sp.intervalSeconds || 5) + '">' +
                '</div>' +
                '<div class="form-group">' +
                    '<label class="form-label">Durasi (detik)</label>' +
                    '<input type="number" id="cfg-sp-duration" class="form-control" value="' + (sp.displayDuration || 3) + '">' +
                '</div>' +
                '<div class="form-group">' +
                    '<label class="form-label">Maks. per Sesi</label>' +
                    '<input type="number" id="cfg-sp-max" class="form-control" value="' + (sp.maxPerSession || 10) + '">' +
                '</div>' +
            '</div>' +
        '</div>' +
        
        // Preview
        '<div class="cfg-preview-pane">' +
            '<div style="background:var(--bg-primary); border:1px solid var(--border); border-radius:8px; height:100%; min-height:200px; position:relative; overflow:hidden;">' +
                '<div style="color:var(--text-muted); font-size:12px; position:absolute; top:12px; left:12px;">Preview</div>' +
                '<div id="sp-preview-box" style="position:absolute; bottom:20px; left:20px; right:20px; background:var(--bg-card); border-radius:8px; padding:12px; box-shadow:0 4px 12px rgba(0,0,0,0.15); display:flex; gap:12px; align-items:center;">' +
                    '<div style="width:40px; height:40px; background:color-mix(in srgb, var(--accent) 15%, transparent); color:var(--accent); border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">' +
                        '<i class="fa-solid fa-shopping-bag"></i>' +
                    '</div>' +
                    '<div style="flex:1; overflow:hidden;">' +
                        '<div id="sp-preview-title" style="font-weight:600; font-size:13px; margin-bottom:2px; color:var(--text-primary);">' + (sp.title || 'Transaksi Berhasil') + '</div>' +
                        '<div id="sp-preview-msg" style="font-size:12px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + (sp.messageTemplate || '') + '</div>' +
                        '<div style="font-size:10px; color:var(--text-muted); margin-top:4px;">Beberapa detik yang lalu</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div style="background:var(--bg-elevated); padding:12px; border-radius:6px; font-size:12px; color:var(--text-muted); margin-top:12px;">' +
                '<i class="fa-solid fa-circle-info" style="margin-right:6px;"></i> Jika fitur anonim aktif, nama "Budi Santoso" akan tampil sebagai "B*** dari Jakarta".' +
            '</div>' +
        '</div>' +
    '</div>';

    return html;
}

function buildBenefitsConfig() {
    var html = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">' +
        '<div></div>' +
        '<button class="btn btn-primary btn-sm" onclick="openAddBenefit()"><i class="fa-solid fa-plus"></i> Tambah Fitur</button>' +
    '</div>';

    html += '<div class="cfg-grid-2-1">' +
        '<div>' +
            '<div id="benefitsList"></div>' +
        '</div>' +
        '<div class="cfg-preview-pane">' +
            '<div style="background:var(--bg-primary); border:1px solid var(--border); border-radius:8px; padding:20px;">' +
                '<div style="color:var(--text-muted); font-size:12px; margin-bottom:16px; text-align:center;">Preview Tampilan (Web)</div>' +
                '<div id="benefits-preview-grid" style="display:flex; flex-direction:column; gap:12px;"></div>' +
            '</div>' +
        '</div>' +
    '</div>';

    return html;
}

// ==========================================
// ACTION & TOGGLE HANDLERS
// ==========================================

function toggleLiveChatFields() {
    var isActive = document.getElementById('cfg-lc-active').checked;
    var fields = document.getElementById('lc-fields');
    var badge = document.getElementById('lc-status-badge');
    
    if (isActive) {
        fields.style.opacity = '1';
        fields.style.pointerEvents = 'auto';
        if (badge) { badge.className = 'badge badge-success'; badge.innerText = 'Aktif'; }
    } else {
        fields.style.opacity = '0.5';
        fields.style.pointerEvents = 'none';
        if (badge) { badge.className = 'badge badge-error'; badge.innerText = 'Nonaktif'; }
    }
}

function toggleSocialProofFields() {
    var isActive = document.getElementById('cfg-sp-active').checked;
    var fields = document.getElementById('sp-fields');
    if (isActive) {
        fields.style.display = '';
    } else {
        fields.style.display = 'none';
    }
}

function updateLiveChatPreview() {
    var tooltip = document.getElementById('cfg-lc-tooltip') ? document.getElementById('cfg-lc-tooltip').value : '';
    var color = document.getElementById('cfg-lc-color') ? document.getElementById('cfg-lc-color').value : '#25D366';
    
    var ttElem = document.getElementById('lc-preview-tooltip');
    var btnElem = document.getElementById('lc-preview-btn');
    var cText = document.getElementById('cfg-lc-color-text');
    
    if (ttElem) {
        ttElem.innerText = tooltip || '...';
        ttElem.style.display = tooltip ? 'block' : 'none';
    }
    if (btnElem) btnElem.style.background = color;
    if (cText) cText.value = color;
}

function insertVariable(variable) {
    var txt = document.getElementById('cfg-sp-template');
    var start = txt.selectionStart;
    var end = txt.selectionEnd;
    var text = txt.value;
    txt.value = text.slice(0, start) + variable + text.slice(end);
    txt.focus();
    txt.selectionStart = txt.selectionEnd = start + variable.length;
    updateSocialProofPreview();
}

function updateSocialProofPreview() {
    var title = document.getElementById('cfg-sp-title') ? document.getElementById('cfg-sp-title').value : '';
    var msg = document.getElementById('cfg-sp-template') ? document.getElementById('cfg-sp-template').value : '';
    var anon = document.getElementById('cfg-sp-anon') ? document.getElementById('cfg-sp-anon').checked : false;
    
    var tElem = document.getElementById('sp-preview-title');
    var mElem = document.getElementById('sp-preview-msg');
    
    if (tElem) tElem.innerText = title || '...';
    if (mElem) {
        // mock replace
        var parsed = msg;
        parsed = parsed.replace(/{customer}/g, anon ? 'B***' : 'Budi Santoso');
        parsed = parsed.replace(/{product}/g, 'Mobile Legends 86 Diamonds');
        parsed = parsed.replace(/{city}/g, 'Jakarta');
        parsed = parsed.replace(/{amount}/g, 'Rp 23.000');
        parsed = parsed.replace(/{time}/g, '2 menit lalu');
        mElem.innerText = parsed || '...';
    }
}

function updateBrowserPreview() {
    var name = document.getElementById('cfg-store-name').value;
    var t = document.getElementById('bp-title');
    if (t) t.innerText = name || 'Store Name';
}

function handleFaviconUpload(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            // Convert ke 32x32 PNG via Canvas (favicon standard size)
            var img = new Image();
            img.onload = function() {
                var canvas = document.createElement('canvas');
                canvas.width = 32; canvas.height = 32;
                var ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, 32, 32);
                // Cover crop: gambar dipotong tengah agar pas 32x32
                var size = Math.min(img.width, img.height);
                var sx = (img.width - size) / 2;
                var sy = (img.height - size) / 2;
                ctx.drawImage(img, sx, sy, size, size, 0, 0, 32, 32);
                var faviconDataUrl = canvas.toDataURL('image/png');
                // Update preview di form
                document.getElementById('cfg-favicon-preview').innerHTML =
                    '<img src="' + faviconDataUrl + '" style="width:100%; height:100%; object-fit:cover; image-rendering:crisp-edges;">';
                // Update browser preview mockup
                var bpFav = document.getElementById('bp-favicon');
                if (bpFav) bpFav.innerHTML = '<img src="' + faviconDataUrl + '" style="width:100%; height:100%;">';
                // Langsung update favicon browser tab
                var link = document.querySelector('link[rel="icon"]') || document.createElement('link');
                link.rel = 'icon'; link.type = 'image/png'; link.href = faviconDataUrl;
                document.head.appendChild(link);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function handleLogoUpload(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('cfg-logo-preview').innerHTML = '<img src="' + e.target.result + '" style="max-width:100%; max-height:100%; object-fit:contain;">';
            var bpLogo = document.getElementById('bp-logo');
            if (bpLogo) bpLogo.innerHTML = '<img src="' + e.target.result + '" style="max-width:100%; max-height:100%;">';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function resetFavicon() {
    document.getElementById('cfg-favicon-input').value = '';
    document.getElementById('cfg-favicon-preview').innerHTML = '<i class="fa-solid fa-globe" style="color:var(--text-muted);"></i>';
    var bpFav = document.getElementById('bp-favicon');
    if (bpFav) bpFav.innerHTML = '';
}

function resetLogo() {
    document.getElementById('cfg-logo-input').value = '';
    document.getElementById('cfg-logo-preview').innerHTML = '<i class="fa-solid fa-image" style="color:var(--text-muted);"></i>';
    var bpLogo = document.getElementById('bp-logo');
    if (bpLogo) bpLogo.innerHTML = '<span style="color:#bdc1c6; font-size:10px;">LOGO</span>';
}

// ==========================================
// FEATURED BENEFITS CRUD
// ==========================================

function renderBenefitsList() {
    var list = document.getElementById('benefitsList');
    var grid = document.getElementById('benefits-preview-grid');
    if (!list || !grid) return;
    
    if (!FEATURED_BENEFITS || FEATURED_BENEFITS.length === 0) {
        list.innerHTML = '<div class="empty-state">' +
            '<i class="fa-solid fa-sparkles"></i>' +
            '<h4>Belum ada fitur unggulan</h4>' +
            '<p>Tambahkan fitur unggulan untuk meyakinkan customer Anda.</p>' +
            '</div>';
        grid.innerHTML = '<div style="text-align:center; color:var(--text-muted); font-size:12px; padding:20px;">Preview kosong</div>';
        return;
    }
    
    // Sort by order
    var sorted = [...FEATURED_BENEFITS].sort((a,b) => (a.order||0) - (b.order||0));
     var html = '<div style="display:flex; flex-direction:column; gap:10px;">';
    var gridHtml = '';
    
    sorted.forEach(function(b) {
        var activeBadge = b.isActive ? '<span class="badge badge-success">Aktif</span>' : '<span class="badge badge-error">Nonaktif</span>';
        var opacity = b.isActive ? '1' : '0.6';

        html += '<div class="benefit-item" style="opacity:'+opacity+';">' +
            '<i class="fa-solid fa-grip-lines" style="color:var(--text-muted); cursor:grab; flex-shrink:0;"></i>' +
            '<div style="width:36px; height:36px; border-radius:8px; background:color-mix(in srgb, '+b.iconColor+' 15%, transparent); color:'+b.iconColor+'; display:flex; align-items:center; justify-content:center; flex-shrink:0;">' +
                '<i class="fa-solid '+b.icon+'"></i>' +
            '</div>' +
            '<div class="benefit-item-info">' +
                '<div class="bi-title">'+b.title+'</div>' +
                '<div class="bi-desc">'+b.description+'</div>' +
            '</div>' +
            '<div class="benefit-item-actions">' +
                activeBadge +
                '<button class="btn btn-sm btn-ghost" onclick="openEditBenefit(\''+b.id+'\')"><i class="fa-solid fa-pencil"></i></button>' +
                '<button class="btn btn-sm btn-ghost" onclick="deleteBenefit(\''+b.id+'\')" style="color:var(--error);"><i class="fa-solid fa-trash"></i></button>' +
            '</div>' +
        '</div>';
        
        if (b.isActive) {
            gridHtml += '<div style="background:var(--bg-card); border-radius:8px; padding:12px; display:flex; gap:12px; align-items:center; box-shadow:0 2px 4px rgba(0,0,0,0.05);">' +
                '<div style="width:32px; height:32px; border-radius:6px; background:color-mix(in srgb, '+b.iconColor+' 15%, transparent); color:'+b.iconColor+'; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:14px;">' +
                    '<i class="fa-solid '+b.icon+'"></i>' +
                '</div>' +
                '<div>' +
                    '<div style="font-size:13px; font-weight:600;">'+b.title+'</div>' +
                    '<div style="font-size:11px; color:var(--text-muted);">'+b.description+'</div>' +
                '</div>' +
            '</div>';
        }
    });
    
    html += '</div>';
    list.innerHTML = html;
    grid.innerHTML = gridHtml || '<div style="text-align:center; color:var(--text-muted); font-size:12px; padding:20px;">Tidak ada fitur aktif</div>';
}

function openAddBenefit() {
    _bnActiveId = null;
    var order = FEATURED_BENEFITS.length + 1;
    
    var body = '<div class="form-group">' +
        '<label class="form-label">Icon (FontAwesome Class) <a href="https://fontawesome.com/icons" target="_blank" style="font-size:12px; color:var(--accent); float:right;">Cari Icon</a></label>' +
        '<input type="text" id="bn-icon" class="form-control" placeholder="fa-bolt" value="fa-bolt">' +
    '</div>' +
    '<div class="form-group">' +
        '<label class="form-label">Warna Icon</label>' +
        '<input type="color" id="bn-color" class="form-control" style="width:100%; height:40px; padding:2px;" value="#ffc107">' +
    '</div>' +
    '<div class="form-group">' +
        '<label class="form-label">Judul</label>' +
        '<input type="text" id="bn-title" class="form-control" placeholder="Proses Cepat">' +
    '</div>' +
    '<div class="form-group">' +
        '<label class="form-label">Deskripsi</label>' +
        '<textarea id="bn-desc" class="form-control" rows="2" placeholder="Pesanan diproses otomatis 24 jam"></textarea>' +
    '</div>' +
    '<div class="cfg-grid-2">' +
        '<div class="form-group">' +
            '<label class="form-label">Urutan</label>' +
            '<input type="number" id="bn-order" class="form-control" value="'+order+'">' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">Status</label>' +
            '<div style="margin-top:8px;">' +
                '<label class="switch">' +
                    '<input type="checkbox" id="bn-active" checked>' +
                    '<span class="switch-track"></span>' +
                '</label>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    var footer = '<button class="btn btn-outline" onclick="closeModal()">Batal</button>' +
        '<button class="btn btn-primary" onclick="saveBenefit()">Simpan</button>';
        
    openModal('Tambah Fitur Unggulan', body, footer);
}

function openEditBenefit(id) {
    _bnActiveId = id;
    var b = FEATURED_BENEFITS.find(x => x.id === id);
    if (!b) return;
    
    var activeStr = b.isActive ? 'checked' : '';
    
    var body = '<div class="form-group">' +
        '<label class="form-label">Icon (FontAwesome Class) <a href="https://fontawesome.com/icons" target="_blank" style="font-size:12px; color:var(--accent); float:right;">Cari Icon</a></label>' +
        '<input type="text" id="bn-icon" class="form-control" value="' + (b.icon || '') + '">' +
    '</div>' +
    '<div class="form-group">' +
        '<label class="form-label">Warna Icon</label>' +
        '<input type="color" id="bn-color" class="form-control" style="width:100%; height:40px; padding:2px;" value="' + (b.iconColor || '#ffc107') + '">' +
    '</div>' +
    '<div class="form-group">' +
        '<label class="form-label">Judul</label>' +
        '<input type="text" id="bn-title" class="form-control" value="' + (b.title || '') + '">' +
    '</div>' +
    '<div class="form-group">' +
        '<label class="form-label">Deskripsi</label>' +
        '<textarea id="bn-desc" class="form-control" rows="2">' + (b.description || '') + '</textarea>' +
    '</div>' +
    '<div class="cfg-grid-2">' +
        '<div class="form-group">' +
            '<label class="form-label">Urutan</label>' +
            '<input type="number" id="bn-order" class="form-control" value="' + (b.order || 0) + '">' +
        '</div>' +
        '<div class="form-group">' +
            '<label class="form-label">Status</label>' +
            '<div style="margin-top:8px;">' +
                '<label class="switch">' +
                    '<input type="checkbox" id="bn-active" ' + activeStr + '>' +
                    '<span class="switch-track"></span>' +
                '</label>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    var footer = '<button class="btn btn-outline" onclick="closeModal()">Batal</button>' +
        '<button class="btn btn-primary" onclick="saveBenefit()">Simpan</button>';
        
    openModal('Edit Fitur Unggulan', body, footer);
}

function saveBenefit() {
    var title = document.getElementById('bn-title').value;
    if (!title) {
        showToast('error', 'Judul fitur wajib diisi!');
        return;
    }
    
    var data = {
        icon: document.getElementById('bn-icon').value,
        iconColor: document.getElementById('bn-color').value,
        title: title,
        description: document.getElementById('bn-desc').value,
        order: parseInt(document.getElementById('bn-order').value) || 0,
        isActive: document.getElementById('bn-active').checked
    };
    
    if (_bnActiveId) {
        var idx = FEATURED_BENEFITS.findIndex(x => x.id === _bnActiveId);
        if (idx !== -1) {
            data.id = _bnActiveId;
            FEATURED_BENEFITS[idx] = data;
            showToast('success', 'Fitur berhasil diperbarui!');
        }
    } else {
        data.id = 'bn_' + Date.now();
        FEATURED_BENEFITS.push(data);
        showToast('success', 'Fitur berhasil ditambahkan!');
    }
    
    closeModal();
    renderBenefitsList();
}

function deleteBenefit(id) {
    _bnActiveId = id;
    var b = FEATURED_BENEFITS.find(x => x.id === id);
    if (!b) return;
    
    var body = '<p>Apakah Anda yakin ingin menghapus fitur <strong>' + b.title + '</strong>?</p>';
    var footer = '<button class="btn btn-outline" onclick="closeModal()">Batal</button>' +
        '<button class="btn btn-danger" onclick="confirmDeleteBenefit()">Ya, Hapus</button>';
        
    openModal('Hapus Fitur', body, footer);
}

function confirmDeleteBenefit() {
    if (_bnActiveId) {
        FEATURED_BENEFITS = FEATURED_BENEFITS.filter(x => x.id !== _bnActiveId);
        showToast('success', 'Fitur berhasil dihapus!');
        renderBenefitsList();
    }
    closeModal();
}

// ==========================================
// MAIN SAVE FUNCTION
// ==========================================

function saveGeneralConfig() {
    // 1. FRONTEND_CONFIG updates
    if (!window.FRONTEND_CONFIG) window.FRONTEND_CONFIG = {};
    if (!window.FRONTEND_CONFIG.hero) window.FRONTEND_CONFIG.hero = {};
    if (!window.FRONTEND_CONFIG.stats) window.FRONTEND_CONFIG.stats = [{},{},{}];
    
    window.FRONTEND_CONFIG.hero.badgeText = document.getElementById('cfg-badge-text').value;
    window.FRONTEND_CONFIG.hero.title = document.getElementById('cfg-hero-title').value;
    window.FRONTEND_CONFIG.hero.subtitle = document.getElementById('cfg-hero-subtitle').value;
    window.FRONTEND_CONFIG.hero.btn1Text = document.getElementById('cfg-btn1').value;
    window.FRONTEND_CONFIG.hero.btn2Text = document.getElementById('cfg-btn2').value;
    
    window.FRONTEND_CONFIG.stats[0] = { number: document.getElementById('cfg-stat1-num').value, label: document.getElementById('cfg-stat1-label').value };
    window.FRONTEND_CONFIG.stats[1] = { number: document.getElementById('cfg-stat2-num').value, label: document.getElementById('cfg-stat2-label').value };
    window.FRONTEND_CONFIG.stats[2] = { number: document.getElementById('cfg-stat3-num').value, label: document.getElementById('cfg-stat3-label').value };
    
    window.FRONTEND_CONFIG.shopName = document.getElementById('cfg-shopname').value;
    
    // 2. STORE_SETTINGS updates
    if (!window.STORE_SETTINGS) window.STORE_SETTINGS = {};
    window.STORE_SETTINGS.storeName = document.getElementById('cfg-store-name').value;
    window.STORE_SETTINGS.storeDescription = document.getElementById('cfg-store-desc').value;
    // Check if new images uploaded (mock implementation doesn't actually upload, just uses existing or data URL if available)
    var favPreview = document.getElementById('cfg-favicon-preview').querySelector('img');
    if (favPreview) window.STORE_SETTINGS.faviconUrl = favPreview.src;
    else window.STORE_SETTINGS.faviconUrl = '';
    
    var logoPreview = document.getElementById('cfg-logo-preview').querySelector('img');
    if (logoPreview) window.STORE_SETTINGS.logoUrl = logoPreview.src;
    else window.STORE_SETTINGS.logoUrl = '';
    
    window.STORE_SETTINGS.contactEmail = document.getElementById('cfg-email').value;
    window.STORE_SETTINGS.phoneNumber = document.getElementById('cfg-phone').value;
    window.STORE_SETTINGS.whatsappNumber = document.getElementById('cfg-whatsapp').value;
    window.STORE_SETTINGS.address = document.getElementById('cfg-address').value;
    
    window.STORE_SETTINGS.instagramUrl = document.getElementById('cfg-instagram').value;
    window.STORE_SETTINGS.tiktokUrl = document.getElementById('cfg-tiktok').value;
    window.STORE_SETTINGS.facebookUrl = document.getElementById('cfg-facebook').value;
    window.STORE_SETTINGS.telegramUrl = document.getElementById('cfg-telegram').value;
    window.STORE_SETTINGS.discordUrl = document.getElementById('cfg-discord').value;
    
    // 3. LIVE_CHAT_SETTINGS updates
    if (!window.LIVE_CHAT_SETTINGS) window.LIVE_CHAT_SETTINGS = {};
    window.LIVE_CHAT_SETTINGS.isActive = document.getElementById('cfg-lc-active').checked;
    window.LIVE_CHAT_SETTINGS.tooltipMessage = document.getElementById('cfg-lc-tooltip').value;
    window.LIVE_CHAT_SETTINGS.defaultMessage = document.getElementById('cfg-lc-message').value;
    window.LIVE_CHAT_SETTINGS.position = document.getElementById('cfg-lc-position').value;
    window.LIVE_CHAT_SETTINGS.buttonColor = document.getElementById('cfg-lc-color').value;
    window.LIVE_CHAT_SETTINGS.showOnMobile = document.getElementById('cfg-lc-mobile').checked;
    window.LIVE_CHAT_SETTINGS.showOnDesktop = document.getElementById('cfg-lc-desktop').checked;
    window.LIVE_CHAT_SETTINGS.delaySeconds = parseInt(document.getElementById('cfg-lc-delay').value) || 0;
    
    // 4. SOCIAL_PROOF_SETTINGS updates
    if (!window.SOCIAL_PROOF_SETTINGS) window.SOCIAL_PROOF_SETTINGS = {};
    window.SOCIAL_PROOF_SETTINGS.isActive = document.getElementById('cfg-sp-active').checked;
    window.SOCIAL_PROOF_SETTINGS.sourceType = document.getElementById('cfg-sp-source').value;
    window.SOCIAL_PROOF_SETTINGS.title = document.getElementById('cfg-sp-title').value;
    window.SOCIAL_PROOF_SETTINGS.messageTemplate = document.getElementById('cfg-sp-template').value;
    window.SOCIAL_PROOF_SETTINGS.position = document.getElementById('cfg-sp-position').value;
    window.SOCIAL_PROOF_SETTINGS.anonymizeCustomer = document.getElementById('cfg-sp-anon').checked;
    window.SOCIAL_PROOF_SETTINGS.intervalSeconds = parseInt(document.getElementById('cfg-sp-interval').value) || 5;
    window.SOCIAL_PROOF_SETTINGS.displayDuration = parseInt(document.getElementById('cfg-sp-duration').value) || 3;
    window.SOCIAL_PROOF_SETTINGS.maxPerSession = parseInt(document.getElementById('cfg-sp-max').value) || 10;
    
    showToast('success', 'Konfigurasi berhasil disimpan!');

    // Sync ke MongoDB via Config model
    if (typeof api !== 'undefined') {
      var configPayload = {
        frontend_config:      window.FRONTEND_CONFIG      || {},
        store_settings:       window.STORE_SETTINGS       || {},
        live_chat_settings:   window.LIVE_CHAT_SETTINGS   || {},
        social_proof_settings:window.SOCIAL_PROOF_SETTINGS|| {},
      };
      api.config.update('general', configPayload).catch(function(e) {
        console.warn('[config] Gagal sync ke MongoDB:', e.message);
      });
    }
}

/* ============================================================
   PER-SECTION SAVE FUNCTIONS
   Dipanggil oleh tombol Simpan di dalam setiap accordion card
   ============================================================ */

function saveHeroSection() {
    if (!window.FRONTEND_CONFIG) window.FRONTEND_CONFIG = {};
    if (!window.FRONTEND_CONFIG.hero) window.FRONTEND_CONFIG.hero = {};
    if (!window.FRONTEND_CONFIG.stats) window.FRONTEND_CONFIG.stats = [{},{},{}];

    var f = function(id) { var el = document.getElementById(id); return el ? el.value : ''; };

    window.FRONTEND_CONFIG.hero.badgeText = f('cfg-badge-text');
    window.FRONTEND_CONFIG.hero.title     = f('cfg-hero-title');
    window.FRONTEND_CONFIG.hero.subtitle  = f('cfg-hero-subtitle');
    window.FRONTEND_CONFIG.hero.btn1Text  = f('cfg-btn1');
    window.FRONTEND_CONFIG.hero.btn1Url   = f('cfg-btn1-url');
    window.FRONTEND_CONFIG.hero.btn2Text  = f('cfg-btn2');
    window.FRONTEND_CONFIG.hero.btn2Url   = f('cfg-btn2-url');

    window.FRONTEND_CONFIG.stats[0] = { number: f('cfg-stat1-num'), label: f('cfg-stat1-label') };
    window.FRONTEND_CONFIG.stats[1] = { number: f('cfg-stat2-num'), label: f('cfg-stat2-label') };
    window.FRONTEND_CONFIG.stats[2] = { number: f('cfg-stat3-num'), label: f('cfg-stat3-label') };

    window.FRONTEND_CONFIG.shopName = f('cfg-shopname');

    var heroData = {
        badgeText : f('cfg-badge-text'),
        title     : f('cfg-hero-title'),
        subtitle  : f('cfg-hero-subtitle'),
        btn1Text  : f('cfg-btn1'),
        btn1Url   : f('cfg-btn1-url') || '/produk',
        btn2Text  : f('cfg-btn2'),
        btn2Url   : f('cfg-btn2-url') || '/register',
        shopName  : f('cfg-shopname'),
        stats: [
            { number: f('cfg-stat1-num'), label: f('cfg-stat1-label') },
            { number: f('cfg-stat2-num'), label: f('cfg-stat2-label') },
            { number: f('cfg-stat3-num'), label: f('cfg-stat3-label') }
        ]
    };

    // === Sync ke localStorage (same-browser) ===
    try { localStorage.setItem('ramx_hero', JSON.stringify(heroData)); } catch(e) {}

    // === Simpan ke MongoDB via API (key: hero_settings) ===
    api.config.update('hero_settings', heroData)
        .then(function() { showToast('success', 'Hero & Tampilan Toko berhasil disimpan!'); })
        .catch(function(e) { showToast('error', 'Gagal simpan ke server: ' + (e.message || 'error')); });
}

function saveStoreSection() {
    if (!window.STORE_SETTINGS) window.STORE_SETTINGS = {};

    var f = function(id) { var el = document.getElementById(id); return el ? el.value : ''; };

    window.STORE_SETTINGS.storeName         = f('cfg-store-name');
    window.STORE_SETTINGS.storeDescription  = f('cfg-store-desc');

    var faviconUrl = '';
    var logoUrl = '';
    var favPreview = document.getElementById('cfg-favicon-preview');
    if (favPreview) { var favImg = favPreview.querySelector('img'); if (favImg) { faviconUrl = favImg.src; window.STORE_SETTINGS.faviconUrl = faviconUrl; } }
    var logoPreview = document.getElementById('cfg-logo-preview');
    if (logoPreview) { var logoImg = logoPreview.querySelector('img'); if (logoImg) { logoUrl = logoImg.src; window.STORE_SETTINGS.logoUrl = logoUrl; } }

    var storeData = {
        storeName        : f('cfg-store-name'),
        storeDescription : f('cfg-store-desc'),
        faviconUrl       : faviconUrl,
        logoUrl          : logoUrl
    };

    // === Sync ke localStorage (same-browser) ===
    try { localStorage.setItem('ramx_store', JSON.stringify(storeData)); } catch(e) {}

    // === Simpan ke MongoDB via API (key: store_settings) ===
    api.config.update('store_settings', storeData)
        .then(function() { showToast('success', 'Detail Toko berhasil disimpan!'); })
        .catch(function(e) { showToast('error', 'Gagal simpan ke server: ' + (e.message || 'error')); });
}

function saveContactSection() {
    if (!window.STORE_SETTINGS)     window.STORE_SETTINGS    = {};
    if (!window.LIVE_CHAT_SETTINGS) window.LIVE_CHAT_SETTINGS = {};

    var f  = function(id) { var el = document.getElementById(id); return el ? el.value   : ''; };
    var fc = function(id) { var el = document.getElementById(id); return el ? el.checked : false; };

    window.STORE_SETTINGS.contactEmail   = f('cfg-email');
    window.STORE_SETTINGS.phoneNumber    = f('cfg-phone');
    window.STORE_SETTINGS.whatsappNumber = f('cfg-whatsapp');
    window.STORE_SETTINGS.address        = f('cfg-address');
    window.STORE_SETTINGS.instagramUrl   = f('cfg-instagram');
    window.STORE_SETTINGS.tiktokUrl      = f('cfg-tiktok');
    window.STORE_SETTINGS.facebookUrl    = f('cfg-facebook');
    window.STORE_SETTINGS.telegramUrl    = f('cfg-telegram');
    window.STORE_SETTINGS.discordUrl     = f('cfg-discord');

    window.LIVE_CHAT_SETTINGS.isActive       = fc('cfg-lc-active');
    window.LIVE_CHAT_SETTINGS.tooltipMessage = f('cfg-lc-tooltip');
    window.LIVE_CHAT_SETTINGS.defaultMessage = f('cfg-lc-message');
    window.LIVE_CHAT_SETTINGS.position       = f('cfg-lc-position');
    window.LIVE_CHAT_SETTINGS.buttonColor    = f('cfg-lc-color');
    window.LIVE_CHAT_SETTINGS.showOnMobile   = fc('cfg-lc-mobile');
    window.LIVE_CHAT_SETTINGS.showOnDesktop  = fc('cfg-lc-desktop');
    window.LIVE_CHAT_SETTINGS.delaySeconds   = parseInt(f('cfg-lc-delay')) || 0;

    var contactData = {
        whatsappNumber : f('cfg-whatsapp'),
        phoneNumber    : f('cfg-phone'),
        contactEmail   : f('cfg-email'),
        address        : f('cfg-address'),
        instagramUrl   : f('cfg-instagram'),
        tiktokUrl      : f('cfg-tiktok'),
        facebookUrl    : f('cfg-facebook'),
        telegramUrl    : f('cfg-telegram'),
        discordUrl     : f('cfg-discord')
    };
    var livechatData = {
        isActive       : fc('cfg-lc-active'),
        tooltipMessage : f('cfg-lc-tooltip'),
        defaultMessage : f('cfg-lc-message'),
        buttonColor    : f('cfg-lc-color'),
        showOnMobile   : fc('cfg-lc-mobile'),
        showOnDesktop  : fc('cfg-lc-desktop'),
        delaySeconds   : parseInt(f('cfg-lc-delay')) || 0
    };

    // === Sync ke localStorage (same-browser) ===
    try {
        localStorage.setItem('ramx_contact', JSON.stringify({
            ...contactData,
            telegramBotToken    : f('cfg-bot-token'),
            telegramBotUsername : f('cfg-bot-username')
        }));
        var existingCfg = {};
        try { existingCfg = JSON.parse(localStorage.getItem('ramx_general_config') || '{}'); } catch(e) {}
        existingCfg.telegramBotToken    = f('cfg-bot-token');
        existingCfg.telegramBotUsername = f('cfg-bot-username');
        existingCfg.storeName           = window.STORE_SETTINGS.storeName || 'Primexa';
        localStorage.setItem('ramx_general_config', JSON.stringify(existingCfg));
        localStorage.setItem('ramx_livechat', JSON.stringify(livechatData));
    } catch(e) {}

    // === Simpan ke MongoDB via API ===
    Promise.all([
        api.config.update('contact_config', contactData),
        api.config.update('live_chat', livechatData)
    ])
        .then(function() { showToast('success', 'Informasi Kontak berhasil disimpan!'); })
        .catch(function(e) { showToast('error', 'Gagal simpan ke server: ' + (e.message || 'error')); });
}

function toggleBotTokenVis() {
    var inp = document.getElementById('cfg-bot-token');
    var eye = document.getElementById('botTokenEye');
    if (!inp) return;
    var isPass = inp.type === 'password';
    inp.type = isPass ? 'text' : 'password';
    eye.innerHTML = '<i class="fa-solid ' + (isPass ? 'fa-eye-slash' : 'fa-eye') + '"></i>';
}

function saveSocialSection() {
    if (!window.SOCIAL_PROOF_SETTINGS) window.SOCIAL_PROOF_SETTINGS = {};

    var f  = function(id) { var el = document.getElementById(id); return el ? el.value   : ''; };
    var fc = function(id) { var el = document.getElementById(id); return el ? el.checked : false; };

    window.SOCIAL_PROOF_SETTINGS.isActive          = fc('cfg-sp-active');
    window.SOCIAL_PROOF_SETTINGS.sourceType        = f('cfg-sp-source');
    window.SOCIAL_PROOF_SETTINGS.title             = f('cfg-sp-title');
    window.SOCIAL_PROOF_SETTINGS.messageTemplate   = f('cfg-sp-template');
    window.SOCIAL_PROOF_SETTINGS.position          = f('cfg-sp-position');
    window.SOCIAL_PROOF_SETTINGS.anonymizeCustomer = fc('cfg-sp-anon');
    window.SOCIAL_PROOF_SETTINGS.intervalSeconds   = parseInt(f('cfg-sp-interval')) || 5;
    window.SOCIAL_PROOF_SETTINGS.displayDuration   = parseInt(f('cfg-sp-duration')) || 3;
    window.SOCIAL_PROOF_SETTINGS.maxPerSession     = parseInt(f('cfg-sp-max')) || 10;

    // === Sync ke frontend via localStorage ===
    try {
        localStorage.setItem('ramx_social', JSON.stringify(window.SOCIAL_PROOF_SETTINGS));
    } catch(e) {}

    showToast('success', 'Social Proof berhasil disimpan!');
}

function saveBenefitsSection() {
    renderBenefitsList();
    renderBenefitPreview();

    // === Sync ke frontend via localStorage ===
    try {
        var benefitsToSave = (window.FEATURED_BENEFITS && window.FEATURED_BENEFITS.length > 0)
            ? window.FEATURED_BENEFITS
            : [];
        localStorage.setItem('ramx_benefits', JSON.stringify(benefitsToSave));
    } catch(e) {}

    showToast('success', 'Fitur Unggulan berhasil disimpan!');
}



