var _spActiveId = null;

/* ── Default content untuk halaman sistem ── */
var DEFAULT_PAGE_CONTENT = {
  terms: `<h2>Syarat &amp; Ketentuan</h2>
<p>Dengan menggunakan layanan Primexa, Anda menyetujui syarat dan ketentuan berikut ini secara keseluruhan.</p>
<h3>1. Ketentuan Umum</h3>
<p>Primexa adalah toko produk digital yang menyediakan berbagai kebutuhan aplikasi premium, streaming, editing, desain, dan voucher game.</p>
<h3>2. Pembelian &amp; Pembayaran</h3>
<p>Setiap pembelian bersifat final setelah pembayaran dikonfirmasi. Pastikan data yang Anda masukkan sudah benar sebelum melakukan checkout.</p>
<h3>3. Pengiriman Produk</h3>
<p>Produk digital dikirimkan secara <strong>otomatis dan instan</strong> setelah pembayaran terverifikasi — biasanya kurang dari 5 menit.</p>
<h3>4. Garansi</h3>
<p>Setiap produk dilengkapi garansi sesuai ketentuan masing-masing produk. Detail garansi tercantum di halaman setiap produk.</p>
<h3>5. Larangan Penggunaan</h3>
<ul><li>Menggunakan produk untuk tujuan ilegal</li><li>Menjual kembali tanpa izin tertulis</li><li>Melakukan kecurangan dalam proses pembayaran</li></ul>
<h3>6. Pembatasan Tanggung Jawab</h3>
<p>Primexa tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari penggunaan produk kami.</p>
<h3>7. Perubahan Ketentuan</h3>
<p>Primexa berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan berlaku efektif setelah dipublikasikan.</p>
<h3>8. Hubungi Kami</h3>
<p>Pertanyaan? Hubungi kami di <a href="mailto:support@Primexa.id">support@Primexa.id</a> atau WhatsApp.</p>`,

  privacy: `<h2>Kebijakan Privasi</h2>
<p>Kami berkomitmen penuh untuk melindungi privasi dan keamanan data pribadi Anda.</p>
<h3>1. Data yang Kami Kumpulkan</h3>
<p>Kami mengumpulkan: nama, email, nomor telepon, data transaksi, dan data penggunaan website.</p>
<h3>2. Penggunaan Data</h3>
<ul><li>Memproses dan mengirimkan pesanan</li><li>Memberikan dukungan pelanggan</li><li>Mengirimkan notifikasi transaksi</li></ul>
<h3>3. Keamanan Data</h3>
<p>Kami menerapkan enkripsi SSL dan sistem proteksi berlapis untuk melindungi data Anda.</p>
<h3>4. Berbagi Data</h3>
<p>Kami <strong>tidak menjual</strong> data pribadi Anda. Data hanya dibagikan ke mitra pembayaran untuk memproses transaksi.</p>
<h3>5. Cookie</h3>
<p>Website kami menggunakan cookie untuk meningkatkan pengalaman pengguna. Anda dapat menonaktifkannya via pengaturan browser.</p>
<h3>6. Hak-hak Anda</h3>
<ul><li>Mengakses data yang kami simpan</li><li>Memperbarui atau mengoreksi data</li><li>Meminta penghapusan data</li></ul>
<h3>7. Kontak</h3>
<p>Untuk pertanyaan privasi: <a href="mailto:privacy@Primexa.id">privacy@Primexa.id</a></p>`,

  faq: JSON.stringify([
    { cat: "Pembelian & Pembayaran", items: [
      { q: "Apa saja metode pembayaran yang tersedia?", a: "Kami mendukung Transfer Bank (BCA, Mandiri, BNI, BRI), QRIS, GoPay, OVO, Dana, ShopeePay, dan kartu kredit/debit Visa/Mastercard." },
      { q: "Berapa lama proses pengiriman produk digital?", a: "Produk digital dikirim <strong>otomatis dan instan</strong> setelah pembayaran terverifikasi — biasanya kurang dari 5 menit." },
      { q: "Apakah ada biaya tambahan saat checkout?", a: "Tidak ada biaya tersembunyi. Harga yang tertera adalah harga final." }
    ]},
    { cat: "Produk & Akun", items: [
      { q: "Bagaimana cara menggunakan produk yang saya beli?", a: "Setelah pembayaran berhasil, Anda akan menerima instruksi lengkap melalui email dan/atau WhatsApp." },
      { q: "Apakah akun yang saya beli aman digunakan?", a: "Ya, semua produk telah diverifikasi dan aman digunakan. Kami memberikan garansi ganti akun jika ada masalah dalam periode garansi." },
      { q: "Berapa lama masa garansi produk?", a: "Masa garansi bervariasi 1–30 hari tergantung produk. Detail tercantum di halaman produk." }
    ]},
    { cat: "Refund & Keluhan", items: [
      { q: "Apakah bisa refund jika produk tidak sesuai?", a: "Refund bisa dilakukan jika produk tidak berfungsi sesuai deskripsi dan masih dalam periode garansi." },
      { q: "Bagaimana cara melaporkan masalah?", a: "Hubungi CS kami via WhatsApp atau email ke support@Primexa.id. Sertakan nomor order Anda." }
    ]}
  ])
};

/* ── Helper: baca localStorage, fallback ke default ── */
function getPageContent(slug) {
  var saved = localStorage.getItem('ramx_page_' + slug);
  return saved !== null ? saved : (DEFAULT_PAGE_CONTENT[slug] || '');
}

/* ── Helper: escape HTML untuk attr ── */
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Slug lama yang tidak bisa dihapus ── */
var CORE_SLUGS = ['terms','privacy'];

/* ── Render daftar halaman statis ── */
function renderStaticPages() {
  // Load deleted pages from localStorage
  var deleted = [];
  try { deleted = JSON.parse(localStorage.getItem('ramx_deleted_pages') || '[]'); } catch(e){}

  var pages = typeof STATIC_PAGES !== 'undefined'
    ? STATIC_PAGES.filter(p => !deleted.includes(p.id))
    : [];

  var total  = pages.length;
  var aktif  = pages.filter(p => p.isActive).length;
  var sistem = pages.filter(p => CORE_SLUGS.includes(p.slug)).length;
  var custom = total - sistem;

  var html = `
    <div class="page-header">
      <div>
        <h2>Halaman Statis</h2>
        <p class="text-muted">Kelola halaman statis dan sistem toko Anda</p>
      </div>
      <button class="btn btn-primary" onclick="renderStaticPageForm()">
        <i class="fa-solid fa-plus"></i> Buat Halaman
      </button>
    </div>

    <div class="stats-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:2rem;">
      <div class="card"><div class="card-body"><div class="text-muted">Total Halaman</div><h3>${total}</h3></div></div>
      <div class="card"><div class="card-body"><div class="text-muted">Aktif</div><h3>${aktif}</h3></div></div>
      <div class="card"><div class="card-body"><div class="text-muted">Sistem</div><h3>${sistem}</h3></div></div>
      <div class="card"><div class="card-body"><div class="text-muted">Custom</div><h3>${custom}</h3></div></div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="data-table w-100">
          <thead><tr>
            <th>Halaman</th>
            <th>Slug / URL</th>
            <th>Status</th>
            <th>Tipe</th>
            <th class="text-right">Aksi</th>
          </tr></thead>
          <tbody>
  `;

  if (total === 0) {
    html += `<tr><td colspan="5">
      <div class="empty-state text-center p-4">
        <i class="fa-solid fa-file-lines text-muted fa-3x mb-3"></i>
        <h4>Belum ada halaman</h4>
        <p class="text-muted">Mulai dengan membuat halaman baru</p>
      </div></td></tr>`;
  } else {
    pages.forEach(page => {
      var isCore     = CORE_SLUGS.includes(page.slug);
      var slugUrl    = '/' + page.slug;
      var fullUrl    = window.location.origin + slugUrl;
      var hasSaved   = localStorage.getItem('ramx_page_' + page.slug) !== null;
      var lockIcon   = isCore ? ' <i class="fa-solid fa-lock text-muted" title="Tidak bisa dihapus"></i>' : '';
      var savedBadge = hasSaved ? '<span class="badge badge-success" style="font-size:10px;margin-left:6px;">Diedit</span>' : '';
      var tipeLabel  = isCore ? 'Sistem' : 'Custom';
      var tipeBadge  = isCore ? 'badge-gray' : 'badge-primary';

      html += `
        <tr>
          <td><strong>${page.title}</strong>${lockIcon}${savedBadge}</td>
          <td><code>${slugUrl}</code></td>
          <td>${typeof statusBadge === 'function'
            ? statusBadge(page.isActive ? 'aktif' : 'nonaktif')
            : (page.isActive ? '<span class="badge badge-success">Aktif</span>' : '<span class="badge badge-error">Nonaktif</span>')
          }</td>
          <td><span class="badge ${tipeBadge}">${tipeLabel}</span></td>
          <td class="text-right">
            <div class="action-buttons" style="display:flex;gap:.4rem;justify-content:flex-end;align-items:center;flex-wrap:wrap;">
              <button class="btn btn-sm btn-outline" onclick="renderStaticPageForm('${page.id}')" title="Edit konten">
                <i class="fa-solid fa-edit"></i> Edit
              </button>
              <a href="${slugUrl}" target="_blank" class="btn btn-sm btn-outline" title="Lihat halaman (${fullUrl})">
                <i class="fa-solid fa-external-link-alt"></i>
              </a>
              <button class="btn btn-sm btn-outline" onclick="copyPageUrl('${page.slug}')" title="Salin URL">
                <i class="fa-solid fa-copy"></i>
              </button>
              ${!isCore
                ? `<button class="btn btn-sm btn-danger" onclick="confirmDeleteStaticPage('${page.id}')" title="Hapus halaman">
                    <i class="fa-solid fa-trash"></i>
                  </button>`
                : (hasSaved
                    ? `<button class="btn btn-sm btn-ghost" onclick="resetPageContent('${page.slug}')" title="Reset ke default" style="font-size:12px;padding:6px 8px;">
                        <i class="fa-solid fa-rotate-left"></i>
                      </button>`
                    : '')
              }
            </div>
          </td>
        </tr>
      `;
    });
  }

  html += `</tbody></table></div></div>`;
  document.getElementById('pageContent').innerHTML = html;
}

/* ── Form edit halaman ── */
function renderStaticPageForm(id) {
  id = id || null;
  _spActiveId = id;

  var deleted = [];
  try { deleted = JSON.parse(localStorage.getItem('ramx_deleted_pages') || '[]'); } catch(e){}
  var pages = typeof STATIC_PAGES !== 'undefined' ? STATIC_PAGES.filter(p => !deleted.includes(p.id)) : [];

  var page    = id ? pages.find(p => p.id == id) : null;
  var isCore  = page && CORE_SLUGS.includes(page.slug);
  var slug    = page ? page.slug : '';
  var isFaq   = slug === 'faq';

  var savedContent = getPageContent(slug);
  var contentEditor = '';

  if (isFaq) {
    var faqData = [];
    try { faqData = JSON.parse(savedContent); } catch(e) { faqData = []; }
    contentEditor = renderFaqEditor(faqData);
  } else {
    contentEditor = `
      <div class="editor-toolbar" style="border:1px solid var(--border);border-bottom:none;padding:.5rem;display:flex;gap:.5rem;border-radius:var(--radius) var(--radius) 0 0;background:var(--bg-elevated);flex-wrap:wrap;">
        <button class="btn btn-xs btn-ghost" onclick="wrapText('spContent','<strong>','</strong>')" title="Bold"><i class="fa-solid fa-bold"></i></button>
        <button class="btn btn-xs btn-ghost" onclick="wrapText('spContent','<em>','</em>')" title="Italic"><i class="fa-solid fa-italic"></i></button>
        <button class="btn btn-xs btn-ghost" onclick="wrapText('spContent','<u>','</u>')" title="Underline"><i class="fa-solid fa-underline"></i></button>
        <span style="border-left:1px solid var(--border);margin:0 .25rem;"></span>
        <button class="btn btn-xs btn-ghost" onclick="wrapText('spContent','<h2>','</h2>')">H2</button>
        <button class="btn btn-xs btn-ghost" onclick="wrapText('spContent','<h3>','</h3>')">H3</button>
        <button class="btn btn-xs btn-ghost" onclick="wrapText('spContent','<p>','</p>')">P</button>
        <span style="border-left:1px solid var(--border);margin:0 .25rem;"></span>
        <button class="btn btn-xs btn-ghost" onclick="wrapText('spContent','<ul>\\n  <li>','</li>\\n</ul>')"><i class="fa-solid fa-list-ul"></i></button>
        <button class="btn btn-xs btn-ghost" onclick="wrapText('spContent','<a href=\\'\\'>','</a>')"><i class="fa-solid fa-link"></i></button>
        <div style="flex:1;"></div>
        <button class="btn btn-xs btn-outline" onclick="resetContentToDefault('${slug}')"><i class="fa-solid fa-rotate-left"></i> Reset Default</button>
      </div>
      <textarea class="form-control" id="spContent"
        style="min-height:400px;border-radius:0 0 var(--radius) var(--radius);font-family:monospace;font-size:13px;line-height:1.6;"
        placeholder="Tulis konten HTML di sini...">${escHtml(savedContent)}</textarea>
      <div style="margin-top:6px;font-size:12px;color:var(--text-muted);">
        <i class="fa-solid fa-circle-info"></i> Gunakan tag HTML: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;&lt;li&gt;, &lt;strong&gt;, &lt;a href=""&gt;
      </div>
    `;
  }

  var html = `
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:1rem;">
        <button class="btn btn-outline" onclick="renderStaticPages()"><i class="fa-solid fa-arrow-left"></i></button>
        <div>
          <h2>${id ? 'Edit: ' + (page ? page.title : '') : 'Buat Halaman Baru'}</h2>
          ${page ? `<p class="text-muted" style="margin:0;font-size:13px;">
            URL: <a href="/${slug}" target="_blank" style="color:var(--accent);">
              ${window.location.origin}/${slug}
            </a>
            ${isCore ? '&nbsp;<i class="fa-solid fa-lock" title="Halaman sistem"></i>' : ''}
          </p>` : ''}
        </div>
      </div>
      ${id ? `<a href="/${slug}" target="_blank" class="btn btn-outline" style="gap:6px;">
        <i class="fa-solid fa-external-link-alt"></i> Lihat Halaman
      </a>` : ''}
    </div>

    <div style="display:grid;grid-template-columns:6fr 4fr;gap:1.5rem;" class="form-grid-layout">
      <div class="left-col">
        <div class="card mb-3">
          <div class="card-header">
            <h3 class="card-title">${isFaq ? 'Editor FAQ' : 'Konten Halaman'}</h3>
          </div>
          <div class="card-body">
            ${!isFaq && !isCore ? `
            <div class="form-group">
              <label class="form-label">Judul <span class="text-danger">*</span></label>
              <input type="text" class="form-control" id="spTitle" value="${page ? escHtml(page.title) : ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Slug URL</label>
              <div style="display:flex;align-items:center;gap:.5rem;">
                <span class="text-muted">/</span>
                <input type="text" class="form-control" id="spSlug" value="${slug}">
              </div>
            </div>
            ` : ''}
            <div class="form-group">
              <label class="form-label">Konten</label>
              ${contentEditor}
            </div>
          </div>
        </div>
      </div>

      <div class="right-col">
        <div class="card mb-3">
          <div class="card-header"><h3 class="card-title">Info Halaman</h3></div>
          <div class="card-body">
            <div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);">
                <span>Slug</span><code>/${slug || '—'}</code>
              </div>
              <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);">
                <span>Status</span><span class="badge badge-success">Aktif</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:6px 0;">
                <span>Konten tersimpan</span>
                <span>${localStorage.getItem('ramx_page_'+slug) !== null ? '<span class="badge badge-success">Ya</span>' : '<span class="badge badge-gray">Default</span>'}</span>
              </div>
            </div>
            <button class="btn btn-outline w-100" onclick="copyPageUrl('${slug}')">
              <i class="fa-solid fa-copy"></i> Salin URL Halaman
            </button>
          </div>
        </div>

        <div class="card mb-3">
          <div class="card-header"><h3 class="card-title">SEO</h3></div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label" style="display:flex;justify-content:space-between;">
                Meta Title <span class="text-muted" id="spMetaTitleCount">0/60</span>
              </label>
              <input type="text" class="form-control" id="spMetaTitle" value="${page ? escHtml(page.metaTitle || '') : ''}"
                oninput="document.getElementById('spMetaTitleCount').textContent=this.value.length+'/60'">
            </div>
            <div class="form-group">
              <label class="form-label" style="display:flex;justify-content:space-between;">
                Meta Description <span class="text-muted" id="spMetaDescCount">0/160</span>
              </label>
              <textarea class="form-control" id="spMetaDesc" rows="3"
                oninput="document.getElementById('spMetaDescCount').textContent=this.value.length+'/160'">${page ? escHtml(page.metaDescription || '') : ''}</textarea>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:.75rem;justify-content:flex-end;">
          <button class="btn btn-outline" onclick="renderStaticPages()">Batal</button>
          <button class="btn btn-primary" onclick="saveStaticPage('${slug}', ${isFaq})">
            <i class="fa-solid fa-save"></i> Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('pageContent').innerHTML = html;
}

/* ── Editor FAQ: render form struktural ── */
function renderFaqEditor(faqData) {
  window.faqCats = JSON.parse(JSON.stringify(faqData));
  return buildFaqEditorHtml(window.faqCats);
}

function buildFaqEditorHtml(data) {
  var html = '<div id="faqEditorWrap">';
  html += '<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;"><i class="fa-solid fa-circle-info"></i> Edit pertanyaan dan jawaban. Klik "Tambah" untuk menambah item baru.</p>';

  data.forEach(function(cat, ci) {
    html += `<div class="card mb-2" style="border:1px solid var(--border);">
      <div class="card-body" style="padding:14px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <i class="fa-solid fa-grip-vertical text-muted" style="cursor:grab;"></i>
          <input class="form-control" style="font-weight:700;font-size:14px;" value="${escHtml(cat.cat)}" id="faqCat_${ci}" placeholder="Nama Kategori">
          <button class="btn btn-sm btn-danger" onclick="deleteFaqCat(${ci})"><i class="fa-solid fa-trash"></i></button>
        </div>`;

    cat.items.forEach(function(item, ii) {
      html += `<div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px;">
        <div style="display:flex;gap:8px;align-items:flex-start;">
          <div style="flex:1;">
            <input class="form-control mb-2" style="font-size:13px;font-weight:600;" value="${escHtml(item.q)}" placeholder="Pertanyaan" id="faqQ_${ci}_${ii}">
            <textarea class="form-control" style="font-size:13px;min-height:70px;" placeholder="Jawaban" id="faqA_${ci}_${ii}">${escHtml(item.a)}</textarea>
          </div>
          <button class="btn btn-sm btn-ghost" style="color:var(--error);padding:6px;" onclick="deleteFaqItem(${ci},${ii})"><i class="fa-solid fa-times"></i></button>
        </div>
      </div>`;
    });

    html += `<button class="btn btn-sm btn-outline" style="margin-top:4px;" onclick="addFaqItem(${ci})">
        <i class="fa-solid fa-plus"></i> Tambah Pertanyaan
      </button>
      </div></div>`;
  });

  html += `<button class="btn btn-outline" onclick="addFaqCat()" style="width:100%;margin-top:8px;">
    <i class="fa-solid fa-folder-plus"></i> Tambah Kategori
  </button></div>`;

  return html;
}

function syncFaqFromDOM() {
  if (!window.faqCats) return;
  window.faqCats.forEach(function(cat, ci) {
    var catEl = document.getElementById('faqCat_'+ci);
    if (catEl) cat.cat = catEl.value;
    cat.items.forEach(function(item, ii) {
      var q = document.getElementById('faqQ_'+ci+'_'+ii);
      var a = document.getElementById('faqA_'+ci+'_'+ii);
      if (q) item.q = q.value;
      if (a) item.a = a.value;
    });
  });
}

function refreshFaqEditor() {
  var wrap = document.getElementById('faqEditorWrap');
  if (wrap && wrap.parentNode) {
    var parent = wrap.parentNode;
    parent.innerHTML = '<label class="form-label">Konten</label>' + buildFaqEditorHtml(window.faqCats);
  }
}

function addFaqCat() {
  if (!window.faqCats) window.faqCats = [];
  syncFaqFromDOM();
  window.faqCats.push({ cat: 'Kategori Baru', items: [] });
  refreshFaqEditor();
}

function deleteFaqCat(ci) {
  if (confirm('Hapus kategori ini beserta semua pertanyaannya?')) {
    syncFaqFromDOM();
    window.faqCats.splice(ci, 1);
    refreshFaqEditor();
  }
}

function addFaqItem(ci) {
  syncFaqFromDOM();
  window.faqCats[ci].items.push({ q: '', a: '' });
  refreshFaqEditor();
}

function deleteFaqItem(ci, ii) {
  syncFaqFromDOM();
  window.faqCats[ci].items.splice(ii, 1);
  refreshFaqEditor();
}

/* ── Simpan halaman ke localStorage ── */
function saveStaticPage(slug, isFaq) {
  var content = '';
  if (isFaq === true || isFaq === 'true') {
    syncFaqFromDOM();
    content = JSON.stringify(window.faqCats);
  } else {
    var el = document.getElementById('spContent');
    if (!el) {
      if (typeof showToast === 'function') showToast('error', 'Konten tidak ditemukan');
      return;
    }
    content = el.value.trim();
  }

  if (slug) {
    localStorage.setItem('ramx_page_' + slug, content);
    if (typeof showToast === 'function') showToast('success', 'Halaman "/' + slug + '" berhasil disimpan! Perubahan langsung aktif di website.');
  } else {
    var titleEl = document.getElementById('spTitle');
    if (!titleEl || !titleEl.value.trim()) {
      if (typeof showToast === 'function') showToast('error', 'Judul halaman wajib diisi');
      return;
    }
    var newSlug = titleEl.value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    localStorage.setItem('ramx_page_' + newSlug, content);
    if (typeof showToast === 'function') showToast('success', 'Halaman baru berhasil disimpan');
  }
  renderStaticPages();
}

/* ── Reset konten ke default (dari tabel) ── */
function resetPageContent(slug) {
  if (confirm('Reset konten ke default? Perubahan yang disimpan akan hilang.')) {
    localStorage.removeItem('ramx_page_' + slug);
    if (typeof showToast === 'function') showToast('success', 'Konten direset ke default');
    renderStaticPages();
  }
}

/* ── Reset konten ke default (dari form editor) ── */
function resetContentToDefault(slug) {
  if (confirm('Reset konten ke default?')) {
    var el = document.getElementById('spContent');
    if (el) el.value = DEFAULT_PAGE_CONTENT[slug] || '';
    if (typeof showToast === 'function') showToast('info', 'Konten direset. Klik Simpan untuk menyimpan.');
  }
}

/* ── Salin URL halaman ke clipboard ── */
function copyPageUrl(slug) {
  if (!slug) return;
  var url = window.location.origin + '/' + slug;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function() {
      if (typeof showToast === 'function') showToast('success', 'URL disalin: ' + url);
    }).catch(function() {
      fallbackCopy(url);
    });
  } else {
    fallbackCopy(url);
  }
}

function fallbackCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed'; ta.style.top = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); if (typeof showToast === 'function') showToast('success', 'URL disalin: ' + text); }
  catch(e) { if (typeof showToast === 'function') showToast('error', 'Gagal menyalin URL'); }
  document.body.removeChild(ta);
}

/* ── Delete halaman (non-core) ── */
function confirmDeleteStaticPage(id) {
  var deleted = [];
  try { deleted = JSON.parse(localStorage.getItem('ramx_deleted_pages') || '[]'); } catch(e){}

  var page = typeof STATIC_PAGES !== 'undefined' ? STATIC_PAGES.find(p => p.id == id) : null;

  if (!page) {
    if (typeof showToast === 'function') showToast('error', 'Halaman tidak ditemukan');
    return;
  }
  if (CORE_SLUGS.includes(page.slug)) {
    if (typeof showToast === 'function') showToast('error', 'Halaman sistem (terms/privacy) tidak dapat dihapus');
    return;
  }
  if (confirm('Yakin ingin menghapus halaman "' + page.title + '"? Tindakan ini tidak bisa dibatalkan.')) {
    // Hapus konten
    localStorage.removeItem('ramx_page_' + page.slug);
    // Tandai sebagai deleted
    if (!deleted.includes(id)) deleted.push(id);
    localStorage.setItem('ramx_deleted_pages', JSON.stringify(deleted));
    if (typeof showToast === 'function') showToast('success', 'Halaman "' + page.title + '" berhasil dihapus');
    renderStaticPages();
  }
}

/* ── Helper: wrap teks di textarea ── */
function wrapText(id, before, after) {
  var el = document.getElementById(id);
  if (!el) return;
  var s = el.selectionStart, e = el.selectionEnd;
  var sel = el.value.substring(s, e) || 'teks';
  el.value = el.value.substring(0, s) + before + sel + after + el.value.substring(e);
  el.selectionStart = s + before.length;
  el.selectionEnd   = s + before.length + sel.length;
  el.focus();
}
