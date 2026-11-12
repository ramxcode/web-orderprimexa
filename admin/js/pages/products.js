var _prdActiveId = null; // tracking ID produk yang sedang diedit/dihapus

function renderProducts() {
  // Urutkan produk A-Z berdasarkan nama
  PRODUCTS.sort(function(a,b){ return (a.name||'').localeCompare(b.name||'','id'); });
  var total  = PRODUCTS.length;
  var aktif  = PRODUCTS.filter(function(p){ return p.isActive; }).length;
  var withVar= PRODUCTS.filter(function(p){ return p.variantCount > 0; }).length;

  var html = '<div class="page-header">'
    + '<div><div class="page-title">Manajemen Produk</div>'
    + '<div class="page-subtitle">Kelola produk, markup harga, gambar, dan deskripsi.</div></div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    + '<button class="btn btn-outline btn-sm" onclick="navigate(\'add-product\')" style="border-color:var(--success);color:var(--success)">'
    + '<i class="fa-solid fa-plus"></i> Produk Lokal</button>'
    + '<button class="btn btn-outline btn-sm" onclick="showToast(\'info\',\'Membuka sinkronisasi produk...\')">'
    + '<i class="fa-solid fa-rotate"></i> Sync Produk</button></div></div>'

    // Stats
    + '<div class="pm-stats-row" style="grid-template-columns:repeat(3,1fr)">'
    + '<div class="pm-stat-card"><div class="pm-stat-icon blue"><i class="fa-solid fa-boxes-stacked"></i></div>'
    + '<div><div class="pm-stat-label">Total Produk</div><div class="pm-stat-value">' + total + '</div></div></div>'
    + '<div class="pm-stat-card"><div class="pm-stat-icon green"><i class="fa-solid fa-circle-check"></i></div>'
    + '<div><div class="pm-stat-label">Produk Aktif</div><div class="pm-stat-value" style="color:var(--success)">' + aktif + '</div></div></div>'
    + '<div class="pm-stat-card"><div class="pm-stat-icon purple"><i class="fa-solid fa-sliders"></i></div>'
    + '<div><div class="pm-stat-label">Dengan Varian</div><div class="pm-stat-value" style="color:var(--purple)">' + withVar + '</div></div></div>'
    + '</div>'

    // Filters
    + '<div class="card mb-16">'
    + '<div class="pm-filter-row" style="margin-bottom:0;flex-wrap:wrap">'
    + '<div style="flex:1;min-width:200px;position:relative">'
    + '<i class="fa-solid fa-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px"></i>'
    + '<input type="text" class="form-control" placeholder="Cari nama produk, ID..." style="padding-left:36px" id="prdSearch" oninput="filterProducts()">'
    + '</div>'
    + '<select class="form-control" style="width:160px" id="prdCatFilter" onchange="filterProducts()">'
    + '<option value="">Semua Kategori</option>'
    + CATEGORIES.map(function(c){ return '<option value="' + c.id + '">' + c.name + '</option>'; }).join('')
    + '</select>'
    + '<select class="form-control" style="width:140px" id="prdStatusFilter" onchange="filterProducts()">'
    + '<option value="">Semua Status</option><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select>'
    + '<select class="form-control" style="width:140px" id="prdSourceFilter" onchange="filterProducts()">'
    + '<option value="">Semua Sumber</option><option value="lokal">Lokal</option><option value="supplier">Supplier/API</option></select>'
    + '<button class="btn btn-outline btn-sm" onclick="resetPrdFilter()" id="prdResetBtn" style="display:none"><i class="fa-solid fa-rotate-left"></i> Reset</button>'
    + '</div></div>'

    // Bulk action bar
    + '<div id="prdBulkBar" style="display:none;background:var(--accent-subtle);border:1px solid var(--accent);border-radius:var(--radius);padding:10px 16px;margin-bottom:12px;display:none;align-items:center;gap:12px">'
    + '<span id="prdBulkCount" style="font-size:13px;color:var(--accent-light);font-weight:600">0 dipilih</span>'
    + '<button class="btn btn-outline btn-xs" onclick="bulkProductAction(\'active\')"><i class="fa-solid fa-circle-check"></i> Aktifkan</button>'
    + '<button class="btn btn-outline btn-xs" onclick="bulkProductAction(\'inactive\')"><i class="fa-solid fa-circle-xmark"></i> Nonaktifkan</button>'
    + '<button class="btn btn-ghost btn-xs" onclick="bulkProductAction(\'delete\')" style="color:var(--error)"><i class="fa-solid fa-trash"></i> Hapus</button>'
    + '</div>'

    // Table
    + '<div class="card" style="padding:0;overflow:hidden">'
    + '<div class="table-wrap"><table class="data-table"><thead><tr>'
    + '<th style="width:40px"><input type="checkbox" id="prdSelectAll" onclick="selectAllProducts(this)" style="width:15px;height:15px;cursor:pointer"></th>'
    + '<th>PRODUK</th><th>KATEGORI</th><th>VARIAN</th><th>STATUS</th><th>AKSI</th>'
    + '</tr></thead><tbody id="prdTableBody">'
    + renderProductRows(PRODUCTS)
    + '</tbody></table></div>'
    + renderPrdPagination(PRODUCTS.length)
    + '</div>';

  document.getElementById('pageContent').innerHTML = html;
}

function getCatName(categoryId) {
  var c = CATEGORIES.find(function(x){ return x.id === categoryId; });
  return c ? c.name : '-';
}

function renderProductRows(data) {
  if (!data.length) return '<tr><td colspan="6"><div class="empty-state"><i class="fa-solid fa-boxes-stacked"></i>'
    + '<h3>Belum ada produk</h3><p>Tambahkan produk baru atau sync dari supplier</p>'
    + '<button class="btn btn-primary btn-sm" onclick="navigate(\'add-product\')"><i class="fa-solid fa-plus"></i> Tambah Produk</button></div></td></tr>';

  return data.map(function(p) {
    var srcColor = p.source === 'lokal' ? 'var(--success)' : 'var(--accent-light)';
    var srcBg    = p.source === 'lokal' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)';
    var srcLabel = p.source === 'lokal' ? 'Lokal' : 'Supplier';
    var srcIcon  = p.source === 'lokal' ? 'fa-house' : 'fa-plug';
    return '<tr>'
      + '<td><input type="checkbox" class="prd-check" data-id="' + p.id + '" onclick="updateBulkBar()" style="width:15px;height:15px;cursor:pointer"></td>'
      + '<td><div style="display:flex;align-items:center;gap:12px">'
      + (p.imageUrl
        ? '<div style="width:38px;height:38px;border-radius:9px;overflow:hidden;flex-shrink:0;background:var(--accent-subtle);display:flex;align-items:center;justify-content:center;color:var(--accent-light);position:relative"><img src="' + p.imageUrl + '" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'"><i class="fa-solid fa-box" style="position:absolute;font-size:14px;display:none" id="prd-icon-' + p.id + '"></i></div>'
        : '<div style="width:38px;height:38px;border-radius:9px;background:var(--accent-subtle);display:flex;align-items:center;justify-content:center;color:var(--accent-light);flex-shrink:0"><i class="fa-solid ' + (p.icon || 'fa-box') + '"></i></div>'
      )
      + '<div><div style="font-weight:700;color:var(--text-primary)">' + p.name + '</div>'
      + '<div style="display:flex;align-items:center;gap:6px;margin-top:3px">'
      + '<span style="font-size:10px;color:var(--text-muted);font-family:monospace">' + p.id + '</span>'
      + '<span style="background:' + srcBg + ';color:' + srcColor + ';font-size:10px;font-weight:600;padding:2px 7px;border-radius:99px;border:1px solid ' + srcColor + '44">'
      + '<i class="fa-solid ' + srcIcon + '" style="font-size:9px"></i> ' + srcLabel + '</span>'
      + (p.isFeatured ? '<span style="background:rgba(245,158,11,0.12);color:var(--warning);font-size:10px;font-weight:600;padding:2px 7px;border-radius:99px;border:1px solid rgba(245,158,11,0.3)"><i class="fa-solid fa-star" style="font-size:9px"></i> Unggulan</span>' : '')
      + '</div></div></div></td>'
      + '<td><span style="background:var(--accent-subtle);color:var(--accent-light);font-size:11px;font-weight:600;padding:3px 10px;border-radius:99px">' + getCatName(p.categoryId) + '</span></td>'
      + '<td style="font-weight:700;color:var(--text-primary)">' + p.activeVariants + '<span style="color:var(--text-muted);font-weight:400">/' + p.variantCount + '</span></td>'
      + '<td><label class="switch"><input type="checkbox" ' + (p.isActive ? 'checked' : '') + ' onchange="toggleProduct(\'' + p.id + '\',this)"><span class="switch-track"></span></label></td>'
      + '<td><div class="action-btns">'
      + '<button class="btn btn-outline btn-xs" onclick="goToEditProduct(\'' + p.id + '\')"><i class="fa-solid fa-pen"></i> Edit</button>'
      + '<button class="btn btn-outline btn-xs" onclick="goToVariants(\'' + p.id + '\',\'' + p.name + '\')" style="border-color:var(--success);color:var(--success)"><i class="fa-solid fa-sliders"></i> Kelola Varian</button>'
      + '<button class="btn btn-ghost btn-icon" onclick="deleteProduct(\'' + p.id + '\')" title="Hapus"><i class="fa-solid fa-trash" style="color:var(--error);font-size:12px"></i></button>'
      + '</div></td>'
      + '</tr>';
  }).join('');
}

function renderPrdPagination(total) {
  return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid var(--border);flex-wrap:wrap;gap:8px">'
    + '<span style="font-size:12px;color:var(--text-muted)">Menampilkan ' + total + ' produk</span>'
    + '<div style="display:flex;align-items:center;gap:8px">'
    + '<select class="form-control" style="width:80px;padding:4px 8px;font-size:12px"><option>10</option><option>25</option><option>50</option></select>'
    + '<div style="display:flex;gap:6px">'
    + '<button class="btn btn-outline btn-xs" disabled><i class="fa-solid fa-chevron-left"></i></button>'
    + '<button class="btn btn-primary btn-xs">1</button>'
    + '<button class="btn btn-outline btn-xs" disabled><i class="fa-solid fa-chevron-right"></i></button>'
    + '</div></div></div>';
}

function filterProducts() {
  var q   = (document.getElementById('prdSearch').value || '').toLowerCase();
  var cat = document.getElementById('prdCatFilter').value;
  var st  = document.getElementById('prdStatusFilter').value;
  var src = document.getElementById('prdSourceFilter').value;
  var filtered = PRODUCTS.filter(function(p) {
    return (!q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
      && (!cat || p.categoryId === cat)
      && (!st  || (st === 'active' ? p.isActive : !p.isActive))
      && (!src || p.source === src);
  });
  var btn = document.getElementById('prdResetBtn');
  if (btn) btn.style.display = (q || cat || st || src) ? 'inline-flex' : 'none';
  var body = document.getElementById('prdTableBody');
  if (body) body.innerHTML = renderProductRows(filtered);
}

function resetPrdFilter() {
  ['prdSearch','prdCatFilter','prdStatusFilter','prdSourceFilter'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
  filterProducts();
}

function goToVariants(productId, productName) {
  // Simpan context produk yang akan difilter di halaman Product Variant
  window._variantProductFilter = { id: productId, name: productName };
  navigate('product-variants');
}

function toggleProduct(id, el) {
  var p = PRODUCTS.find(function(x){ return x.id === id; });
  if (p) { p.isActive = el.checked; showToast(el.checked ? 'success' : 'warning', p.name + (el.checked ? ' diaktifkan!' : ' dinonaktifkan!')); }
}

function selectAllProducts(el) {
  document.querySelectorAll('.prd-check').forEach(function(cb) { cb.checked = el.checked; });
  updateBulkBar();
}

function updateBulkBar() {
  var checked = document.querySelectorAll('.prd-check:checked');
  var bar = document.getElementById('prdBulkBar');
  var cnt = document.getElementById('prdBulkCount');
  if (bar) bar.style.display = checked.length ? 'flex' : 'none';
  if (cnt) cnt.textContent = checked.length + ' dipilih';
}

function bulkProductAction(action) {
  var checked = document.querySelectorAll('.prd-check:checked');
  if (!checked.length) return;
  var msgs = { active:'diaktifkan', inactive:'dinonaktifkan', delete:'dihapus' };
  showToast('success', checked.length + ' produk berhasil ' + msgs[action] + '!');
  document.querySelectorAll('.prd-check').forEach(function(cb){ cb.checked = false; });
  var all = document.getElementById('prdSelectAll'); if (all) all.checked = false;
  updateBulkBar();
}

function goToEditProduct(id) {
  _prdActiveId = id;
  navigate('edit-product');
}

function deleteProduct(id) {
  var p = PRODUCTS.find(function(x){ return x.id === id; });
  if (!p) return;
  _prdActiveId = id;
  openModal('Hapus Produk',
    '<div style="text-align:center;padding:8px">'
    + '<i class="fa-solid fa-triangle-exclamation" style="font-size:36px;color:var(--error);margin-bottom:12px"></i>'
    + '<p style="font-size:14px;color:var(--text-secondary)">Hapus produk <strong style="color:var(--text-primary)">' + p.name + '</strong>?<br>'
    + '<span style="font-size:12px;color:var(--text-muted)">Semua varian terkait juga akan dihapus dari tampilan.</span></p></div>',
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-danger" onclick="confirmDeleteProduct()">Ya, Hapus</button>'
  );
}

function confirmDeleteProduct() {
  if (!_prdActiveId) return;
  var idx = PRODUCTS.findIndex(function(x){ return x.id === _prdActiveId; });
  var deleted = idx > -1 ? PRODUCTS[idx] : null;
  if (idx > -1) PRODUCTS.splice(idx, 1);
  var deletedId = _prdActiveId;
  _prdActiveId = null;
  closeModal();
  renderProducts();
  showToast('success', 'Produk berhasil dihapus!');
  // Sync ke MongoDB
  if (typeof api !== 'undefined' && deleted) {
    api.products.delete(deleted._id || deletedId).catch(function(e){ console.warn('[products] delete error:', e.message); });
  }
}

/* ============================================================
   ADD PRODUCT PAGE
   ============================================================ */
function renderAddProduct() {
  var html = '<div class="page-header">'
    + '<div><div class="page-title">Tambah Produk Lokal</div>'
    + '<div class="page-subtitle">Isi informasi produk baru untuk toko Anda.</div></div>'
    + '<button class="btn btn-outline btn-sm" onclick="navigate(\'products\')"><i class="fa-solid fa-arrow-left"></i> Kembali</button>'
    + '</div>'

    + '<div class="card" style="max-width:720px">'
    + '<div class="card-title" style="margin-bottom:20px"><i class="fa-solid fa-box" style="color:var(--accent-light)"></i> Informasi Produk</div>'
    + '<div style="display:grid;gap:16px">'

    + '<div class="form-group"><label class="form-label">Nama Produk <span style="color:var(--error)">*</span></label>'
    + '<input type="text" class="form-control" id="addPrdName" placeholder="Nama produk..." oninput="autoProductSlug(this)"></div>'

    + '<div class="form-group"><label class="form-label">Kategori Produk <span style="color:var(--error)">*</span></label>'
    + '<select class="form-control" id="addPrdCat"><option value="">-- Pilih Kategori --</option>'
    + CATEGORIES.filter(function(c){ return c.source === 'lokal'; }).map(function(c){ return '<option value="' + c.id + '">' + c.name + '</option>'; }).join('')
    + '</select></div>'

    + '<div class="form-group"><label class="form-label">Slug URL</label>'
    + '<input type="text" class="form-control" id="addPrdSlug" placeholder="slug-otomatis"></div>'

    + '<div class="form-group"><label class="form-label">Gambar Produk</label>'
    + '<div id="addPrdDropzone" class="img-upload-zone" onclick="document.getElementById(\'addPrdImg\').click()" ondragover="event.preventDefault()" ondrop="handleImgDrop(event,\'addPrdPreview\')">'
    + '<i class="fa-solid fa-cloud-arrow-up" style="font-size:28px;color:var(--text-muted);margin-bottom:8px"></i>'
    + '<p style="font-size:13px;color:var(--text-muted);margin:0">Klik atau drag & drop gambar di sini</p>'
    + '<p style="font-size:11px;color:var(--text-muted);margin:4px 0 0">JPG, PNG, WEBP • Maks. 2MB</p>'
    + '</div>'
    + '<input type="file" id="addPrdImg" accept="image/*" style="display:none" onchange="previewImg(this,\'addPrdPreview\')">'
    + '<div id="addPrdPreview" style="display:none;margin-top:10px;position:relative;width:fit-content">'
    + '<img style="max-width:120px;max-height:120px;border-radius:10px;border:1px solid var(--border)"><button onclick="clearImg(\'addPrdPreview\')" style="position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;background:var(--error);border:none;color:#fff;font-size:11px;cursor:pointer"><i class="fa-solid fa-xmark"></i></button></div>'
    + '<div style="margin-top:10px">'
    + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><div style="flex:1;height:1px;background:var(--border)"></div><span style="font-size:11px;color:var(--text-muted);white-space:nowrap;padding:0 8px">— atau URL gambar —</span><div style="flex:1;height:1px;background:var(--border)"></div></div>'
    + '<div style="display:flex;gap:8px">'
    + '<input type="text" class="form-control" id="addPrdImgUrl" placeholder="https://... (Google, Gstatic, dll)" style="font-size:12px" oninput="previewImgUrl(\'addPrdImgUrl\',\'addPrdUrlPreview\')">'
    + '<button class="btn btn-outline btn-sm" onclick="previewImgUrl(\'addPrdImgUrl\',\'addPrdUrlPreview\')" title="Preview gambar"><i class="fa-solid fa-eye"></i></button>'
    + '</div>'
    + '<div id="addPrdUrlPreview" style="display:none;margin-top:8px;position:relative;width:fit-content">'
    + '<img style="max-width:120px;max-height:120px;border-radius:10px;border:2px solid var(--accent)">'
    + '<button onclick="clearUrlPreview(\'addPrdImgUrl\',\'addPrdUrlPreview\')" style="position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;background:var(--error);border:none;color:#fff;font-size:11px;cursor:pointer"><i class="fa-solid fa-xmark"></i></button></div>'
    + '<div style="font-size:11px;color:var(--text-muted);margin-top:5px"><i class="fa-solid fa-circle-info" style="color:var(--accent-light)"></i> Kalau keduanya diisi, gambar dari <strong>upload</strong> yang dipakai.</div>'
    + '</div></div>'

    + '<div class="form-group"><label class="form-label">Catatan / Deskripsi Produk</label>'
    + '<textarea class="form-control" id="addPrdDesc" rows="3" placeholder="Deskripsi produk, syarat, atau info tambahan..."></textarea></div>'

    + '<div class="form-group"><label class="form-label">Normalisasi Nomor Tujuan</label>'
    + '<select class="form-control" id="addPrdNorm">'
    + '<option value="none">Tidak Ada</option><option value="auto">Otomatis</option>'
    + '<option value="phone">Nomor Telepon</option><option value="pulsa">Pulsa / Paket Data</option>'
    + '<option value="ewallet">E-Wallet</option><option value="pelanggan">Nomor Pelanggan</option>'
    + '<option value="user">Username / Email</option></select>'
    + '<div style="font-size:11px;color:var(--text-muted);margin-top:5px"><i class="fa-solid fa-circle-info" style="color:var(--accent-light)"></i> Normalisasi otomatis akan membersihkan input nomor sebelum dikirim ke provider.</div></div>'

    + '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px">'
    + '<div class="form-group"><label class="form-label">Status Produk</label><div style="display:flex;align-items:center;gap:10px;margin-top:6px"><label class="switch"><input type="checkbox" id="addPrdStatus" checked><span class="switch-track"></span></label><span style="font-size:13px;color:var(--text-secondary)">Aktif</span></div></div>'
    + '<div class="form-group"><label class="form-label">Produk Unggulan</label><div style="display:flex;align-items:center;gap:10px;margin-top:6px"><label class="switch"><input type="checkbox" id="addPrdFeatured"><span class="switch-track"></span></label><span style="font-size:13px;color:var(--text-secondary)"><i class="fa-solid fa-star" style="color:var(--warning)"></i> Unggulan</span></div></div>'
    + '<div class="form-group"><label class="form-label">Tampilkan di Website</label><div style="display:flex;align-items:center;gap:10px;margin-top:6px"><label class="switch"><input type="checkbox" id="addPrdWeb" checked><span class="switch-track"></span></label><span style="font-size:13px;color:var(--text-secondary)">Tampil</span></div></div>'
    + '<div class="form-group"><label class="form-label">Tampilkan di Bot</label><div style="display:flex;align-items:center;gap:10px;margin-top:6px"><label class="switch"><input type="checkbox" id="addPrdBot" checked><span class="switch-track"></span></label><span style="font-size:13px;color:var(--text-secondary)">Tampil</span></div></div>'
    + '</div>'

    + '<div style="display:flex;gap:10px;justify-content:flex-end;padding-top:8px;border-top:1px solid var(--border)">'
    + '<button class="btn btn-outline" onclick="navigate(\'products\')">Batal</button>'
    + '<button class="btn btn-primary" onclick="saveNewProduct()"><i class="fa-solid fa-floppy-disk"></i> Simpan Produk</button>'
    + '</div></div></div>';

  document.getElementById('pageContent').innerHTML = html;
}

function autoProductSlug(inp) {
  var slug = inp.value.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
  var s = document.getElementById('addPrdSlug'); if (s) s.value = slug;
}

function previewImg(input, previewId) {
  var file = input.files[0]; if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showToast('error','Gambar maksimal 2MB!'); return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    var prev = document.getElementById(previewId);
    if (prev) { prev.style.display = 'block'; var img = prev.querySelector('img'); if (img) img.src = e.target.result; }
  };
  reader.readAsDataURL(file);
}

function handleImgDrop(event, previewId) {
  event.preventDefault();
  var file = event.dataTransfer.files[0]; if (!file) return;
  var fakeInput = { files: [file] }; previewImg(fakeInput, previewId);
}

function clearImg(previewId) {
  var prev = document.getElementById(previewId);
  if (prev) { prev.style.display = 'none'; var img = prev.querySelector('img'); if (img) img.src = ''; }
}

function previewImgUrl(urlInputId, previewId) {
  var urlInput = document.getElementById(urlInputId);
  var url = urlInput ? urlInput.value.trim() : '';
  var prev = document.getElementById(previewId);
  if (!prev) return;
  if (!url) { prev.style.display = 'none'; return; }
  var img = prev.querySelector('img');
  if (!img) return;
  img.onerror = function() {
    prev.style.display = 'none';
    img.onerror = null;
    showToast('warning', 'URL gambar gagal dimuat. Coba salin ulang URL-nya.');
  };
  img.onload = function() {
    prev.style.display = 'block';
    img.onerror = null;
    // Update thumbnail kiri (editImgThumb) secara real-time
    var thumb = document.getElementById('editImgThumb');
    if (thumb) {
      thumb.style.overflow = 'hidden';
      thumb.innerHTML = '<img src="' + url + '" style="width:100%;height:100%;object-fit:cover">';
    }
  };
  img.src = url;
}

function clearUrlPreview(urlInputId, previewId) {
  var inp = document.getElementById(urlInputId); if (inp) inp.value = '';
  var prev = document.getElementById(previewId);
  if (prev) { prev.style.display = 'none'; var img = prev.querySelector('img'); if (img) img.src = ''; }
}

function saveNewProduct() {
  var name = (document.getElementById('addPrdName').value || '').trim();
  var cat  = document.getElementById('addPrdCat').value;
  if (!name) { showToast('error','Nama produk wajib diisi!'); return; }
  if (!cat)  { showToast('error','Pilih kategori produk!'); return; }
  var imgSrc = '';
  var filePrev = document.querySelector('#addPrdPreview img');
  if (filePrev && filePrev.src && filePrev.src.startsWith('data:')) imgSrc = filePrev.src;
  if (!imgSrc) { var urlInp = document.getElementById('addPrdImgUrl'); if (urlInp) imgSrc = urlInp.value.trim(); }
  var desc = (document.getElementById('addPrdDesc') ? document.getElementById('addPrdDesc').value : '').trim();
  var newPrd = { id:'PRD' + (PRODUCTS.length + 1).toString().padStart(3,'0'), categoryId:cat, name:name, slug:document.getElementById('addPrdSlug').value, description:desc, icon:'fa-box', source:'lokal', isActive:document.getElementById('addPrdStatus').checked, isFeatured:document.getElementById('addPrdFeatured').checked, showInBot:document.getElementById('addPrdBot').checked, variantCount:0, activeVariants:0, normalizeTarget:document.getElementById('addPrdNorm').value, imageUrl:imgSrc, createdAt:new Date().toISOString().split('T')[0] };
  PRODUCTS.push(newPrd);
  showToast('success','Produk berhasil dibuat! Anda dapat menambahkan varian sekarang.');
  if (typeof api !== 'undefined') {
    api.products.create({ name:newPrd.name, slug:newPrd.slug, category:newPrd.categoryId, description:newPrd.description, source:'lokal', isActive:newPrd.isActive, isFeatured:newPrd.isFeatured, imageUrl:newPrd.imageUrl }).then(function(r){ if(r.success&&r.data?._id) newPrd._id=r.data._id; }).catch(function(e){ console.warn('[products] create error:', e.message); });
  }
  setTimeout(function(){ navigate('edit-product'); }, 800);
}

/* ============================================================
   EDIT PRODUCT PAGE
   ============================================================ */
function renderEditProduct() {
  var p = (_prdActiveId ? PRODUCTS.find(function(x){ return x.id === _prdActiveId; }) : null) || PRODUCTS[0];
  if (!p) { navigate('products'); return; }
  var variantsOfProduct = PRODUCT_VARIANTS.filter(function(v){ return v.productId === p.id; });

  var html = '<div class="page-header">'
    + '<div><div class="page-title">Edit Produk</div>'
    + '<div class="page-subtitle">' + p.name + '</div></div>'
    + '<div style="display:flex;gap:8px">'
    + '<button class="btn btn-ghost btn-icon" onclick="deleteProduct(\'' + p.id + '\')" title="Hapus Produk" style="color:var(--error)"><i class="fa-solid fa-trash"></i></button>'
    + '<button class="btn btn-outline btn-sm" onclick="navigate(\'products\')"><i class="fa-solid fa-arrow-left"></i> Kembali</button>'
    + '</div></div>'

    + '<div style="display:grid;gap:20px;max-width:960px">'

    + '<div class="card"><div class="card-header"><div>'
    + '<div class="card-title"><i class="fa-solid fa-circle-info" style="color:var(--accent-light)"></i> Informasi Produk</div>'
    + '<div class="card-subtitle">Produk lokal dapat diatur penuh dari panel admin.</div></div></div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-top:16px">'
    + infoRow('fa-boxes-stacked','Nama Produk', p.name)
    + infoRow('fa-layer-group','Kategori', getCatName(p.categoryId))
    + infoRow(p.source === 'lokal' ? 'fa-house' : 'fa-plug','Sumber', p.source === 'lokal' ? 'Lokal' : 'Supplier')
    + infoRow('fa-fingerprint','Supplier ID', p.supplierId || 'N/A')
    + infoRow('fa-sliders','Jumlah Varian', p.variantCount + ' varian')
    + infoRow('fa-rotate','Terakhir Sync', p.lastSyncedAt || 'Belum pernah sync')
    + '</div></div>'

    + '<div class="card"><div class="card-header"><div>'
    + '<div class="card-title"><i class="fa-solid fa-image" style="color:var(--purple)"></i> Custom Gambar</div>'
    + '<div class="card-subtitle">Upload gambar custom untuk mengganti gambar dari supplier.</div></div></div>'
    + '<div style="display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:start;margin-top:16px">'
    + (p.imageUrl
        ? '<div id="editImgThumb" style="width:100px;height:100px;border-radius:12px;background:var(--accent-subtle);overflow:hidden;flex-shrink:0"><img src="' + p.imageUrl + '" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:36px;color:var(--accent-light)"><i class="fa-solid ' + (p.icon || 'fa-box') + '"></i></div></div>'
        : '<div id="editImgThumb" style="width:100px;height:100px;border-radius:12px;background:var(--accent-subtle);display:flex;align-items:center;justify-content:center;font-size:36px;color:var(--accent-light)"><i class="fa-solid ' + (p.icon || 'fa-box') + '"></i></div>'
      )
    + '<div style="display:flex;flex-direction:column;gap:12px">'
    + '<div class="img-upload-zone" onclick="document.getElementById(\'editPrdImg\').click()" ondragover="event.preventDefault()" ondrop="handleImgDrop(event,\'editPrdPreview\')" style="padding:20px">'
    + '<i class="fa-solid fa-cloud-arrow-up" style="font-size:24px;color:var(--text-muted);margin-bottom:8px"></i>'
    + '<p style="font-size:12px;color:var(--text-muted);margin:0">Klik atau drag & drop • JPG, PNG, WEBP • Maks. 2MB</p></div>'
    + '<input type="file" id="editPrdImg" accept="image/*" style="display:none" onchange="previewImg(this,\'editPrdPreview\')">'
    + '<div id="editPrdPreview" style="display:none;position:relative;width:fit-content"><img style="max-width:80px;max-height:80px;border-radius:8px;border:1px solid var(--border)"><button onclick="clearImg(\'editPrdPreview\')" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--error);border:none;color:#fff;font-size:10px;cursor:pointer"><i class="fa-solid fa-xmark"></i></button></div>'
    + '<div style="margin-top:8px">'
    + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px"><div style="flex:1;height:1px;background:var(--border)"></div><span style="font-size:11px;color:var(--text-muted);white-space:nowrap;padding:0 8px">— atau URL gambar —</span><div style="flex:1;height:1px;background:var(--border)"></div></div>'
    + '<div style="display:flex;gap:8px">'
    + '<input type="text" class="form-control" id="editPrdImgUrl" placeholder="https://... (Google, Gstatic, dll)" style="font-size:12px" value="' + (p.imageUrl && !p.imageUrl.startsWith('data:') ? p.imageUrl : '') + '" oninput="previewImgUrl(\'editPrdImgUrl\',\'editPrdUrlPreview\')">'
    + '<button class="btn btn-outline btn-sm" onclick="previewImgUrl(\'editPrdImgUrl\',\'editPrdUrlPreview\')" title="Preview"><i class="fa-solid fa-eye"></i></button>'
    + '</div>'
    + '<div id="editPrdUrlPreview" style="display:none;margin-top:6px;position:relative;width:fit-content">'
    + '<img style="max-width:80px;max-height:80px;border-radius:8px;border:2px solid var(--accent)">'
    + '<button onclick="clearUrlPreview(\'editPrdImgUrl\',\'editPrdUrlPreview\')" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--error);border:none;color:#fff;font-size:10px;cursor:pointer"><i class="fa-solid fa-xmark"></i></button></div>'
    + '</div>'
    + '<label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;color:var(--text-secondary)">'
    + '<input type="checkbox" id="removeCustomImg"> Hapus gambar custom dan gunakan gambar supplier</label>'
    + '</div></div></div>'

    + '<div class="card"><div class="card-header"><div>'
    + '<div class="card-title"><i class="fa-solid fa-gear" style="color:var(--warning)"></i> Pengaturan Produk</div>'
    + '<div class="card-subtitle">Nama, kategori, catatan, dan slug produk dapat diubah.</div></div></div>'
    + '<div style="display:grid;gap:14px;margin-top:16px">'
    + '<div class="form-group"><label class="form-label">Nama Produk <span style="color:var(--error)">*</span></label><input type="text" class="form-control" id="editPrdName" value="' + p.name + '" oninput="autoProductSlugEdit(this)"></div>'
    + '<div class="form-group"><label class="form-label">Kategori Produk</label><select class="form-control" id="editPrdCat">'
    + CATEGORIES.map(function(c){ return '<option value="' + c.id + '" ' + (c.id === p.categoryId ? 'selected' : '') + '>' + c.name + '</option>'; }).join('')
    + '</select></div>'
    + '<div class="form-group"><label class="form-label">Slug URL</label>'
    + '<input type="text" class="form-control" id="editPrdSlug" value="' + p.slug + '">'
    + '<div style="font-size:11px;color:var(--text-muted);margin-top:4px">Slug saat ini: <code style="background:var(--bg-elevated);padding:2px 6px;border-radius:4px">' + p.slug + '</code></div></div>'
    + '<div class="form-group"><label class="form-label">Catatan / Deskripsi</label>'
    + '<textarea class="form-control" rows="3" id="editPrdDesc" placeholder="Deskripsi produk...">' + (p.description || '') + '</textarea></div>'
    + '<div class="form-group"><label class="form-label">Normalisasi Nomor Tujuan</label>'
    + '<select class="form-control"><option value="none" ' + (p.normalizeTarget==='none'?'selected':'') + '>Tidak Ada</option>'
    + '<option value="auto" ' + (p.normalizeTarget==='auto'?'selected':'') + '>Otomatis</option>'
    + '<option value="phone" ' + (p.normalizeTarget==='phone'?'selected':'') + '>Nomor Telepon</option>'
    + '<option value="email" ' + (p.normalizeTarget==='email'?'selected':'') + '>Username / Email</option></select></div>'
    + '<div class="form-group"><label class="form-label">Status Produk</label>'
    + '<div style="display:flex;align-items:center;gap:10px;margin-top:6px"><label class="switch"><input type="checkbox" id="editPrdStatus" ' + (p.isActive ? 'checked' : '') + '><span class="switch-track"></span></label>'
    + '<span style="font-size:13px;color:var(--text-secondary)">Aktif</span></div></div>'
    + '<div class="form-group"><label class="form-label">Produk Unggulan</label>'
    + '<div style="display:flex;align-items:center;gap:10px;margin-top:6px"><label class="switch"><input type="checkbox" id="editPrdFeatured" ' + (p.isFeatured ? 'checked' : '') + '><span class="switch-track"></span></label>'
    + '<span style="font-size:13px;color:var(--text-secondary)"><i class="fa-solid fa-star" style="color:var(--warning)"></i> Unggulan</span></div></div>'
    + '</div></div>'

    // Card D: Varian
    + '<div class="card"><div class="card-header"><div>'
    + '<div class="card-title"><i class="fa-solid fa-sliders" style="color:var(--success)"></i> Varian Produk (' + variantsOfProduct.length + ')</div>'
    + '<div class="card-subtitle">Atur harga dan markup untuk setiap varian.</div></div>'
    + '<button class="btn btn-outline btn-sm" onclick="goToVariants(\'' + p.id + '\',\'' + p.name + '\')"><i class="fa-solid fa-arrow-up-right-from-square"></i> Kelola Varian</button></div>'
    + '<div class="table-wrap" style="margin-top:16px"><table class="data-table"><thead><tr>'
    + '<th>NAMA VARIAN</th><th>HARGA MODAL</th><th>MARKUP</th><th>HARGA JUAL</th><th>STOK</th><th>STATUS</th></tr></thead><tbody>'
    + (variantsOfProduct.length ? variantsOfProduct.map(function(v){
        var profit = v.sellingPrice - v.costPrice;
        return '<tr>'
          + '<td><div style="font-weight:600;color:var(--text-primary)">' + v.name + '</div>'
          + '<div style="font-size:11px;color:var(--text-muted)">' + (v.processType === 'auto' ? '<i class="fa-solid fa-robot"></i> Auto' : '<i class="fa-solid fa-user"></i> Manual') + '</div></td>'
          + '<td style="color:var(--text-secondary)">' + formatRp(v.costPrice) + '</td>'
          + '<td style="color:var(--success);font-weight:600">+' + formatRp(profit) + '</td>'
          + '<td style="font-weight:700;color:var(--text-primary)">' + formatRp(v.sellingPrice) + '</td>'
          + '<td style="font-weight:700">' + v.stock + '</td>'
          + '<td><span class="badge ' + (v.isActive ? 'badge-success' : 'badge-error') + '">' + (v.isActive ? 'Aktif' : 'Nonaktif') + '</span></td>'
          + '</tr>';
      }).join('') : '<tr><td colspan="6"><div class="empty-state" style="padding:24px"><i class="fa-solid fa-sliders"></i><p>Belum ada varian. Klik "Kelola Varian" untuk menambah.</p></div></td></tr>')
    + '</tbody></table></div></div>'

    // Footer
    + '<div style="display:flex;gap:10px;justify-content:flex-end;padding:16px 0">'
    + '<button class="btn btn-outline" onclick="navigate(\'products\')">Batal</button>'
    + '<button class="btn btn-primary" onclick="saveEditProduct()"><i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan</button>'
    + '</div></div>';

  document.getElementById('pageContent').innerHTML = html;
  // Thumbnail kiri (editImgThumb) sudah tampilkan gambar (URL maupun base64)
  // Preview bawah hanya muncul saat user aktif upload file baru atau ganti URL
}
// (saveEditProduct follows below)

function saveEditProduct() {
  var p = (_prdActiveId ? PRODUCTS.find(function(x){ return x.id === _prdActiveId; }) : null) || PRODUCTS[0];
  if (!p) return;
  var nameEl    = document.getElementById('editPrdName');
  var catEl     = document.getElementById('editPrdCat');
  var slugEl    = document.getElementById('editPrdSlug');
  var descEl    = document.getElementById('editPrdDesc');
  var statusEl  = document.getElementById('editPrdStatus');
  var featEl    = document.getElementById('editPrdFeatured');
  var name = nameEl ? nameEl.value.trim() : p.name;
  if (!name) { showToast('error', 'Nama produk wajib diisi!'); return; }
  p.name        = name;
  p.categoryId  = catEl   ? catEl.value    : p.categoryId;
  p.slug        = slugEl  ? slugEl.value   : p.slug;
  p.description = descEl  ? descEl.value   : p.description;
  p.isActive    = statusEl ? statusEl.checked : p.isActive;
  p.isFeatured  = featEl  ? featEl.checked  : p.isFeatured;
  // Ambil gambar: file upload diprioritaskan, lalu URL
  var filePrev2 = document.querySelector('#editPrdPreview img');
  if (filePrev2 && filePrev2.src && filePrev2.src.startsWith('data:')) { p.imageUrl = filePrev2.src; }
  else { var urlInp2 = document.getElementById('editPrdImgUrl'); if (urlInp2 && urlInp2.value.trim()) p.imageUrl = urlInp2.value.trim(); }
  showToast('success', 'Produk "' + name + '" berhasil disimpan!');
  // Sync ke MongoDB
  if (typeof api !== 'undefined' && p._id) {
    api.products.update(p._id, { name:p.name, slug:p.slug, category:p.categoryId, description:p.description, isActive:p.isActive, isFeatured:p.isFeatured, imageUrl:p.imageUrl }).catch(function(e){ console.warn('[products] update error:', e.message); });
  }
  _prdActiveId = null;
  navigate('products');
}

function infoRow(icon, label, value) {
  return '<div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:10px;padding:12px">'
    + '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px"><i class="fa-solid ' + icon + '" style="margin-right:5px"></i>' + label + '</div>'
    + '<div style="font-size:13px;font-weight:600;color:var(--text-primary)">' + value + '</div></div>';
}

function autoProductSlugEdit(inp) {
  var slug = inp.value.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-');
  var s = document.getElementById('editPrdSlug'); if (s) s.value = slug;
}
