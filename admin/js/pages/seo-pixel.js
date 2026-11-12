function renderSeoPixel() {
    let s = typeof SEO_SETTINGS !== 'undefined' ? SEO_SETTINGS : {
        seoTitle: 'Primexa - Solusi Produk Digital',
        metaDescription: 'Beli produk digital murah, proses cepat, aman dan terpercaya.',
        metaKeywords: 'produk digital, aplikasi premium, voucher game',
        homepageH1: 'Temukan Produk Digital Terbaik untukmu',
        openGraphImage: '',
        allowIndexing: true
    };

    let html = `
        <div class="page-header" style="margin-bottom: 24px;">
            <div>
                <h2 class="page-title">SEO Website</h2>
                <p class="page-subtitle" style="color: var(--text-muted); margin-top: 4px;">Kelola optimasi mesin pencari untuk website toko Anda</p>
            </div>
        </div>

        <div style="display: grid; gap: 1.5rem;">

            <!-- SECTION 1 - SEO Homepage -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">SEO Homepage</h3>
                    <div class="card-subtitle" style="font-size:13px; color:var(--text-muted); margin-top:2px;">Pengaturan ini mempengaruhi tampilan website Anda di Google dan mesin pencari lain.</div>
                </div>
                <div class="card-body cfg-seo-grid">
                    <div>
                        <div class="form-group">
                            <label class="form-label" style="display: flex; justify-content: space-between;">
                                SEO Title
                                <span class="text-muted" id="seoTitleCount">0/60</span>
                            </label>
                            <input type="text" class="form-control" id="seoTitle" value="${s.seoTitle}" oninput="updateSerpPreview()" placeholder="Nama Toko - Deskripsi Singkat">
                            <div class="text-muted text-sm mt-1">Judul yang muncul di tab browser dan hasil pencarian Google.</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label" style="display: flex; justify-content: space-between;">
                                Meta Description
                                <span class="text-muted" id="seoDescCount">0/160</span>
                            </label>
                            <textarea class="form-control" id="seoDesc" rows="3" oninput="updateSerpPreview()" placeholder="Deskripsi singkat tentang toko Anda...">${s.metaDescription}</textarea>
                            <div class="text-muted text-sm mt-1">Deskripsi singkat yang muncul di hasil pencarian di bawah judul.</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Meta Keywords <span class="text-muted" style="font-weight:400;">(Pisahkan dengan koma)</span></label>
                            <input type="text" class="form-control" id="seoKeywords" value="${s.metaKeywords}" placeholder="kata kunci 1, kata kunci 2, ...">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Judul H1 Homepage</label>
                            <input type="text" class="form-control" id="seoH1" value="${s.homepageH1}" placeholder="Judul utama halaman beranda">
                            <div class="text-muted text-sm mt-1">Judul besar yang ditampilkan di bagian hero halaman utama.</div>
                        </div>
                    </div>
                    <div>
                        <label class="form-label">Preview di Mesin Pencari (Google)</label>
                        <div style="background: var(--bg-elevated); padding: 1.25rem; border-radius: var(--radius); border: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                                <div style="width: 24px; height: 24px; background: #ddd; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">🌐</div>
                                <div>
                                    <div style="font-size: 12px; color: var(--text-primary);">Primexa.com</div>
                                    <div style="font-size: 11px; color: var(--text-muted);">https://Primexa.com</div>
                                </div>
                            </div>
                            <h3 id="serpTitlePreview" style="color: #8ab4f8; margin: 0 0 0.5rem; font-size: 18px; font-weight: 400; cursor: pointer; line-height: 1.3;"></h3>
                            <p id="serpDescPreview" style="color: var(--text-secondary); font-size: 13px; line-height: 1.5; margin: 0;"></p>
                        </div>

                        <div class="form-group" style="margin-top: 1.5rem;">
                            <label class="form-label" style="display: flex; justify-content: space-between; align-items: center;">
                                Izinkan Mesin Pencari Mengindex Situs
                                <label class="toggle-switch">
                                    <input type="checkbox" id="allowIndexing" ${s.allowIndexing !== false ? 'checked' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                            </label>
                            <div class="text-muted text-sm mt-1">Jika dimatikan, Google tidak akan mengindeks halaman website Anda.</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SECTION 2 - Open Graph -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Open Graph (Sosial Media)</h3>
                    <div class="card-subtitle" style="font-size:13px; color:var(--text-muted); margin-top:2px;">Pengaturan tampilan ketika link website dibagikan di WhatsApp, Facebook, Twitter, dll.</div>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">Open Graph Image URL</label>
                        <input type="text" class="form-control" id="ogImage" value="${s.openGraphImage}" placeholder="https://domain.com/og-image.jpg">
                        <div class="text-muted text-sm mt-1">
                            <i class="fa-solid fa-circle-info" style="color:var(--accent-light)"></i>
                            Ukuran yang disarankan: <strong>1200×630 px</strong>. OG Title dan Description otomatis mengambil dari SEO Title dan Meta Description di atas.
                        </div>
                    </div>
                    <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-elevated); border-radius: var(--radius); border: 1px solid var(--border);">
                        <div class="text-muted text-sm" style="display:flex; align-items:flex-start; gap:8px;">
                            <i class="fa-solid fa-lightbulb" style="color:#fbbf24; margin-top:2px; flex-shrink:0;"></i>
                            <div>
                                <strong style="color:var(--text-primary);">Tips Open Graph:</strong> Gunakan gambar yang menarik dan menggambarkan bisnis Anda. Gambar ini akan muncul saat seseorang membagikan link toko ke media sosial atau WhatsApp.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tombol Simpan -->
            <div style="display: flex; justify-content: flex-end; gap: 12px; padding-bottom: 16px;">
                <button class="btn btn-outline" onclick="renderSeoPixel()">
                    <i class="fa-solid fa-rotate-left"></i> Reset
                </button>
                <button class="btn btn-primary" onclick="saveSeoPixel()">
                    <i class="fa-solid fa-floppy-disk"></i> Simpan Pengaturan SEO
                </button>
            </div>

        </div>
    `;

    document.getElementById('pageContent').innerHTML = html;

    window.updateSerpPreview = function() {
        let titleEl = document.getElementById('seoTitle');
        let descEl  = document.getElementById('seoDesc');
        if (!titleEl || !descEl) return;

        let titleCount = document.getElementById('seoTitleCount');
        let descCount  = document.getElementById('seoDescCount');
        if (titleCount) {
            titleCount.textContent = titleEl.value.length + '/60';
            titleCount.style.color = titleEl.value.length > 60 ? 'var(--error)' : 'inherit';
        }
        if (descCount) {
            descCount.textContent = descEl.value.length + '/160';
            descCount.style.color = descEl.value.length > 160 ? 'var(--error)' : 'inherit';
        }

        let titlePrev = document.getElementById('serpTitlePreview');
        let descPrev  = document.getElementById('serpDescPreview');
        if (titlePrev) titlePrev.textContent = titleEl.value || 'Judul Halaman';
        if (descPrev)  descPrev.textContent  = descEl.value  || 'Deskripsi halaman akan muncul di sini...';
    };

    updateSerpPreview();
}

function saveSeoPixel() {
    if (!window.SEO_SETTINGS) window.SEO_SETTINGS = {};

    var f  = function(id) { var el = document.getElementById(id); return el ? el.value   : ''; };
    var fc = function(id) { var el = document.getElementById(id); return el ? el.checked : true; };

    window.SEO_SETTINGS.seoTitle       = f('seoTitle');
    window.SEO_SETTINGS.metaDescription = f('seoDesc');
    window.SEO_SETTINGS.metaKeywords   = f('seoKeywords');
    window.SEO_SETTINGS.homepageH1     = f('seoH1');
    window.SEO_SETTINGS.openGraphImage = f('ogImage');
    window.SEO_SETTINGS.allowIndexing  = fc('allowIndexing');

    // Sync ke frontend via localStorage
    try {
        localStorage.setItem('ramx_seo', JSON.stringify(window.SEO_SETTINGS));
    } catch(e) {}

    if (typeof showToast === 'function') {
        showToast('success', 'Pengaturan SEO Website berhasil disimpan!');
    }
}
