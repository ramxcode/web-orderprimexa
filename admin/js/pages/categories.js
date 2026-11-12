function renderCategories() {
  var html = '<div class="page-header">'
    + '<div><div class="page-title">Kelola Kategori</div>'
    + '<div class="page-subtitle">Atur kategori produk lokal dan produk dari supplier.</div></div>'
    + '<button class="btn btn-primary" onclick="openAddCategory()">'
    + '<i class="fa-solid fa-plus"></i> Tambah Kategori</button></div>'

    + '<div class="card mb-16">'
    + '<div class="pm-filter-row" style="margin-bottom:0">'
    + '<div style="flex:1;min-width:180px;position:relative">'
    + '<i class="fa-solid fa-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px"></i>'
    + '<input type="text" class="form-control" placeholder="Cari kategori..." style="padding-left:36px" id="catSearch" oninput="filterCategories()">'
    + '</div>'
    + '<select class="form-control" style="width:160px" id="catSourceFilter" onchange="filterCategories()">'
    + '<option value="">Semua Sumber</option><option value="lokal">Lokal</option><option value="supplier">Supplier/API</option></select>'
    + '<select class="form-control" style="width:160px" id="catStatusFilter" onchange="filterCategories()">'
    + '<option value="">Semua Status</option><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select>'
    + '<button class="btn btn-primary btn-sm" onclick="filterCategories()"><i class="fa-solid fa-magnifying-glass"></i></button>'
    + '<button class="btn btn-outline btn-sm" onclick="resetCatFilter()" id="catResetBtn" style="display:none"><i class="fa-solid fa-rotate-left"></i> Reset</button>'
    + '</div></div>'

    + '<div class="card" style="padding:0;overflow:hidden">'
    + '<div class="table-wrap"><table class="data-table" id="catTable"><thead><tr>'
    + '<th>KATEGORI</th><th>SUMBER</th><th>PRODUK</th><th>URUTAN</th><th>STATUS</th><th>TAMPIL DI BOT</th><th>AKSI</th>'
    + '</tr></thead><tbody id="catTableBody">'
    + '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)"><i class="fa-solid fa-spinner fa-spin"></i> Memuat...</td></tr>'
    + '</tbody></table></div>'
    + '<div id="catPagination">' + renderCatPagination(0) + '</div>'
    + '</div>';

  document.getElementById('pageContent').innerHTML = html;

  // Load from MongoDB, then re-render rows
  if (typeof store !== 'undefined' && typeof store._categories === 'function') {
    store._categories().then(function() {
      var tb = document.getElementById('catTableBody');
      if (tb) tb.innerHTML = renderCategoryRows(CATEGORIES);
      var pg = document.getElementById('catPagination');
      if (pg) pg.innerHTML = renderCatPagination(CATEGORIES.length);
    }).catch(function() {
      var tb = document.getElementById('catTableBody');
      if (tb) tb.innerHTML = renderCategoryRows(CATEGORIES);
    });
  } else {
    var tb = document.getElementById('catTableBody');
    if (tb) tb.innerHTML = renderCategoryRows(CATEGORIES);
  }
}

function getCatBadge(source) {
  if (source === 'lokal') return '<span class="badge" style="background:rgba(16,185,129,0.12);color:var(--success);border:1px solid rgba(16,185,129,0.3)"><i class="fa-solid fa-house"></i> Lokal</span>';
  return '<span class="badge" style="background:rgba(59,130,246,0.12);color:var(--accent-light);border:1px solid rgba(59,130,246,0.3)"><i class="fa-solid fa-plug"></i> Supplier</span>';
}

function renderCategoryRows(data) {
  if (!data.length) return '<tr><td colspan="7"><div class="empty-state"><i class="fa-solid fa-layer-group"></i><h3>Tidak ada kategori</h3><p>Tambahkan kategori baru</p></div></td></tr>';
  return data.map(function(c) {
    return '<tr>'
      + '<td><div style="display:flex;align-items:center;gap:12px">'
      + '<div style="width:36px;height:36px;border-radius:9px;background:var(--accent-subtle);display:flex;align-items:center;justify-content:center;color:var(--accent-light)">'
      + '<i class="fa-solid ' + c.icon + '"></i></div>'
      + '<div><div style="font-weight:700;color:var(--text-primary)">' + c.name + '</div>'
      + '<div style="font-size:11px;color:var(--text-muted);font-family:monospace">' + c.slug + '</div></div></div></td>'
      + '<td>' + getCatBadge(c.source) + '</td>'
      + '<td style="font-weight:700;color:var(--text-primary)">' + c.productCount + '</td>'
      + '<td style="color:var(--text-secondary)">' + c.order + '</td>'
      + '<td><label class="switch"><input type="checkbox" ' + (c.isActive ? 'checked' : '') + ' onchange="toggleCatField(\'' + c.id + '\',\'status\',this)"><span class="switch-track"></span></label></td>'
      + '<td><label class="switch"><input type="checkbox" ' + (c.showInBot ? 'checked' : '') + ' onchange="toggleCatField(\'' + c.id + '\',\'bot\',this)"><span class="switch-track"></span></label></td>'
      + '<td><div class="action-btns">'
      + '<button class="btn btn-outline btn-xs" onclick="openEditCategory(\'' + c.id + '\')"><i class="fa-solid fa-pen"></i> Edit</button>'
      + (c.source === 'lokal' ? '<button class="btn btn-ghost btn-icon" onclick="deleteCat(\'' + c.id + '\')" title="Hapus"><i class="fa-solid fa-trash" style="color:var(--error);font-size:12px"></i></button>' : '')
      + '</div></td>'
      + '</tr>';
  }).join('');
}

function renderCatPagination(total) {
  return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid var(--border)">'
    + '<span style="font-size:12px;color:var(--text-muted)">Menampilkan ' + total + ' kategori</span>'
    + '<div style="display:flex;gap:6px">'
    + '<button class="btn btn-outline btn-xs" disabled><i class="fa-solid fa-chevron-left"></i></button>'
    + '<button class="btn btn-primary btn-xs">1</button>'
    + '<button class="btn btn-outline btn-xs" disabled><i class="fa-solid fa-chevron-right"></i></button>'
    + '</div></div>';
}

function filterCategories() {
  var q = (document.getElementById('catSearch').value || '').toLowerCase();
  var src = document.getElementById('catSourceFilter').value;
  var st = document.getElementById('catStatusFilter').value;
  var filtered = CATEGORIES.filter(function(c) {
    return (!q || c.name.toLowerCase().includes(q) || c.slug.includes(q))
      && (!src || c.source === src)
      && (!st || (st === 'active' ? c.isActive : !c.isActive));
  });
  var btn = document.getElementById('catResetBtn');
  if (btn) btn.style.display = (q || src || st) ? 'inline-flex' : 'none';
  var body = document.getElementById('catTableBody');
  if (body) body.innerHTML = renderCategoryRows(filtered);
}

function resetCatFilter() {
  document.getElementById('catSearch').value = '';
  document.getElementById('catSourceFilter').value = '';
  document.getElementById('catStatusFilter').value = '';
  filterCategories();
}

function toggleCatField(id, type, el) {
  var c = CATEGORIES.find(function(x){ return x.id === id; });
  if (!c) return;
  if (type === 'status') { c.isActive = el.checked; showToast(el.checked ? 'success' : 'warning', c.name + (el.checked ? ' diaktifkan!' : ' dinonaktifkan!')); }
  else { c.showInBot = el.checked; showToast('info', c.name + ' bot: ' + (el.checked ? 'Aktif' : 'Nonaktif')); }
  // Sync ke MongoDB
  if (typeof store !== 'undefined') store.saveCategory(c, false);
}

function deleteCat(id) {
  var c = CATEGORIES.find(function(x){ return x.id === id; });
  if (!c) return;
  if (c.productCount > 0) {
    openModal('Tidak Dapat Dihapus',
      '<div style="text-align:center;padding:16px"><i class="fa-solid fa-triangle-exclamation" style="font-size:40px;color:var(--warning);margin-bottom:16px"></i>'
      + '<p style="color:var(--text-secondary);font-size:14px;line-height:1.6">Kategori <strong style="color:var(--text-primary)">' + c.name + '</strong> masih memiliki <strong style="color:var(--warning)">' + c.productCount + ' produk</strong>.<br>Pindahkan produk ke kategori lain terlebih dahulu.</p></div>',
      '<button class="btn btn-primary" onclick="closeModal()">Mengerti</button>'
    );
    return;
  }
  openModal('Hapus Kategori',
    '<p style="color:var(--text-secondary);font-size:14px">Yakin ingin menghapus kategori <strong style="color:var(--error)">' + c.name + '</strong>? Tindakan ini tidak dapat dibatalkan.</p>',
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-danger" onclick="deleteCatFinal(\'' + id + '\')">Hapus</button>'
  );
}

function buildCatModal(cat) {
  var isEdit = !!cat;
  var c = cat || { name:'', slug:'', icon:'fa-tag', description:'', order: CATEGORIES.length + 1, isActive:true, showInBot:false };
  return '<div style="display:grid;gap:14px">'
    + '<div class="form-group"><label class="form-label">Nama Kategori <span style="color:var(--error)">*</span></label>'
    + '<input type="text" class="form-control" id="catName" value="' + c.name + '" oninput="autoSlug(this)" placeholder="Nama kategori..."></div>'
    + '<div class="form-group"><label class="form-label">Slug URL</label>'
    + '<input type="text" class="form-control" id="catSlug" value="' + c.slug + '" placeholder="slug-url-otomatis"></div>'
    + '<div class="form-group"><label class="form-label">URL Icon (Font Awesome class)</label>'
    + '<div style="display:flex;gap:8px;align-items:center">'
    + '<input type="text" class="form-control" id="catIcon" value="' + c.icon + '" oninput="previewCatIcon(this)" placeholder="fa-tag">'
    + '<div id="catIconPreview" style="width:38px;height:38px;border-radius:9px;background:var(--accent-subtle);display:flex;align-items:center;justify-content:center;color:var(--accent-light);flex-shrink:0"><i class="fa-solid ' + c.icon + '"></i></div>'
    + '</div></div>'
    + '<div class="form-group"><label class="form-label">Deskripsi</label>'
    + '<textarea class="form-control" id="catDesc" rows="2" placeholder="Deskripsi singkat kategori...">' + (c.description||'') + '</textarea></div>'
    + '<div class="form-group"><label class="form-label">Urutan</label>'
    + '<input type="number" class="form-control" id="catOrder" value="' + c.order + '" min="1"></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'
    + '<div class="form-group"><label class="form-label">Status</label>'
    + '<div style="display:flex;align-items:center;gap:10px;margin-top:6px">'
    + '<label class="switch"><input type="checkbox" id="catStatus" ' + (c.isActive ? 'checked' : '') + '><span class="switch-track"></span></label>'
    + '<span style="font-size:13px;color:var(--text-secondary)">Aktif</span></div></div>'
    + '<div class="form-group"><label class="form-label">Tampil di Bot</label>'
    + '<div style="display:flex;align-items:center;gap:10px;margin-top:6px">'
    + '<label class="switch"><input type="checkbox" id="catBot" ' + (c.showInBot ? 'checked' : '') + '><span class="switch-track"></span></label>'
    + '<span style="font-size:13px;color:var(--text-secondary)">Ya</span></div></div>'
    + '</div></div>';
}

function autoSlug(inp) {
  var slug = inp.value.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
  var s = document.getElementById('catSlug');
  if (s) s.value = slug;
}

function previewCatIcon(inp) {
  var prev = document.getElementById('catIconPreview');
  if (prev) prev.innerHTML = '<i class="fa-solid ' + inp.value + '"></i>';
}

function openAddCategory() {
  openModal('Tambah Kategori', buildCatModal(null),
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-primary" onclick="saveCat(null)"><i class="fa-solid fa-floppy-disk"></i> Simpan</button>'
  );
}

function openEditCategory(id) {
  var c = CATEGORIES.find(function(x){ return x.id === id; });
  if (!c) return;
  openModal('Edit Kategori', buildCatModal(c),
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-primary" onclick="saveCat(\'' + id + '\')"><i class="fa-solid fa-floppy-disk"></i> Simpan</button>'
  );
}

function saveCat(id) {
  var name = document.getElementById('catName').value.trim();
  if (!name) { showToast('error', 'Nama kategori wajib diisi!'); return; }
  if (id) {
    var c = CATEGORIES.find(function(x){ return x.id === id; });
    if (c) {
      c.name = name;
      c.slug = document.getElementById('catSlug').value;
      c.icon = document.getElementById('catIcon').value;
      c.description = document.getElementById('catDesc').value;
      c.order = parseInt(document.getElementById('catOrder').value) || 1;
      c.isActive = document.getElementById('catStatus').checked;
      c.showInBot = document.getElementById('catBot').checked;
    }
    closeModal(); showToast('success', 'Kategori berhasil diperbarui!');
    // Sync ke MongoDB
    if (typeof store !== 'undefined' && c) store.saveCategory(c, false);
  } else {
    var newCat = { id:'cat'+Date.now(), name:name, slug:document.getElementById('catSlug').value, icon:document.getElementById('catIcon').value, description:document.getElementById('catDesc').value, source:'lokal', order:parseInt(document.getElementById('catOrder').value)||1, isActive:document.getElementById('catStatus').checked, showInBot:document.getElementById('catBot').checked, productCount:0, createdAt:new Date().toISOString().split('T')[0] };
    CATEGORIES.push(newCat);
    closeModal(); showToast('success', 'Kategori berhasil ditambahkan!');
    // Sync ke MongoDB
    if (typeof store !== 'undefined') store.saveCategory(newCat, true);
  }
  renderCategories();
}

function deleteCatFinal(id) {
  closeModal();
  var idx = CATEGORIES.findIndex(function(x){ return x.id === id; });
  var deleted = idx >= 0 ? CATEGORIES[idx] : null;
  if (idx >= 0) CATEGORIES.splice(idx, 1);
  renderCategories();
  showToast('success', 'Kategori dihapus!');
  // Sync ke MongoDB
  if (typeof store !== 'undefined' && deleted) {
    store.deleteCategory(deleted._id || deleted.id);
  }
}
