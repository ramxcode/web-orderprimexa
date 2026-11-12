var _ptActiveId = null;

function renderProductTypes() {
  var html = '<div class="page-header">'
    + '<div><div class="page-title">Product Type</div>'
    + '<div class="page-subtitle">Kelola jenis atau kelompok varian produk.</div></div>'
    + '<button class="btn btn-primary" onclick="openAddType()"><i class="fa-solid fa-plus"></i> Tambah Type</button></div>'

    + '<div class="card mb-16"><div class="pm-filter-row" style="margin-bottom:0">'
    + '<div style="flex:1;position:relative"><i class="fa-solid fa-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px"></i>'
    + '<input type="text" class="form-control" placeholder="Cari product type..." style="padding-left:36px" id="ptSearch" oninput="filterTypes()"></div>'
    + '<select class="form-control" style="width:150px" id="ptStatusFilter" onchange="filterTypes()">'
    + '<option value="">Semua Status</option><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select>'
    + '</div></div>'

    + '<div class="card" style="padding:0;overflow:hidden">'
    + '<div class="table-wrap"><table class="data-table"><thead><tr>'
    + '<th>NAMA TYPE</th><th>SLUG</th><th>DESKRIPSI</th><th>JML VARIAN</th><th>URUTAN</th><th>STATUS</th><th>AKSI</th>'
    + '</tr></thead><tbody id="ptTableBody">'
    + renderTypeRows(PRODUCT_TYPES)
    + '</tbody></table></div>'
    + renderPtPagination(PRODUCT_TYPES.length)
    + '</div>';

  document.getElementById('pageContent').innerHTML = html;
}

function renderTypeRows(data) {
  if (!data.length) return '<tr><td colspan="7"><div class="empty-state"><i class="fa-solid fa-tags"></i><h3>Belum ada product type</h3><p>Tambahkan type seperti Android, iOS, Private, dll.</p></div></td></tr>';
  var typeIcons = { android:'fa-android', ios:'fa-apple', private:'fa-lock', sharing:'fa-share-nodes', bulanan:'fa-calendar', tahunan:'fa-calendar-days', lifetime:'fa-infinity' };
  return data.map(function(t) {
    var icon = typeIcons[t.slug] || 'fa-tag';
    return '<tr>'
      + '<td><div style="display:flex;align-items:center;gap:10px">'
      + '<div style="width:34px;height:34px;border-radius:8px;background:var(--accent-subtle);display:flex;align-items:center;justify-content:center;color:var(--accent-light)">'
      + '<i class="fa-solid ' + icon + '"></i></div>'
      + '<span style="font-weight:700;color:var(--text-primary)">' + t.name + '</span></div></td>'
      + '<td><code style="background:var(--bg-elevated);padding:3px 8px;border-radius:5px;font-size:11px;color:var(--text-secondary)">' + t.slug + '</code></td>'
      + '<td style="font-size:12px;color:var(--text-muted)">' + t.description + '</td>'
      + '<td style="font-weight:700;color:var(--text-primary)">' + t.variantCount + '</td>'
      + '<td style="color:var(--text-secondary)">' + t.order + '</td>'
      + '<td><label class="switch"><input type="checkbox" ' + (t.isActive ? 'checked' : '') + ' onchange="toggleType(\'' + t.id + '\',this)"><span class="switch-track"></span></label></td>'
      + '<td><div class="action-btns">'
      + '<button class="btn btn-outline btn-xs" onclick="openEditType(\'' + t.id + '\')"><i class="fa-solid fa-pen"></i> Edit</button>'
      + '<button class="btn btn-ghost btn-icon" onclick="deleteType(\'' + t.id + '\')"><i class="fa-solid fa-trash" style="color:var(--error);font-size:12px"></i></button>'
      + '</div></td></tr>';
  }).join('');
}

function renderPtPagination(total) {
  return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid var(--border)">'
    + '<span style="font-size:12px;color:var(--text-muted)">' + total + ' product type</span>'
    + '<div style="display:flex;gap:6px"><button class="btn btn-outline btn-xs" disabled><i class="fa-solid fa-chevron-left"></i></button>'
    + '<button class="btn btn-primary btn-xs">1</button>'
    + '<button class="btn btn-outline btn-xs" disabled><i class="fa-solid fa-chevron-right"></i></button></div></div>';
}

function filterTypes() {
  var q  = (document.getElementById('ptSearch').value || '').toLowerCase();
  var st = document.getElementById('ptStatusFilter').value;
  var filtered = PRODUCT_TYPES.filter(function(t) {
    return (!q || t.name.toLowerCase().includes(q) || t.slug.includes(q))
      && (!st || (st === 'active' ? t.isActive : !t.isActive));
  });
  var body = document.getElementById('ptTableBody');
  if (body) body.innerHTML = renderTypeRows(filtered);
}

function toggleType(id, el) {
  var t = PRODUCT_TYPES.find(function(x){ return x.id === id; });
  if (t) { t.isActive = el.checked; showToast(el.checked ? 'success' : 'warning', t.name + (el.checked ? ' diaktifkan!' : ' dinonaktifkan!')); }
}

function buildTypeModal(t) {
  var obj = t || { name:'', slug:'', description:'', order: PRODUCT_TYPES.length + 1, isActive:true };
  return '<div style="display:grid;gap:14px">'
    + '<div class="form-group"><label class="form-label">Nama Type <span style="color:var(--error)">*</span></label>'
    + '<input type="text" class="form-control" id="ptName" value="' + obj.name + '" oninput="autoTypeSlug(this)" placeholder="Contoh: Android"></div>'
    + '<div class="form-group"><label class="form-label">Slug</label>'
    + '<input type="text" class="form-control" id="ptSlug" value="' + obj.slug + '" placeholder="android"></div>'
    + '<div class="form-group"><label class="form-label">Deskripsi</label>'
    + '<input type="text" class="form-control" id="ptDesc" value="' + obj.description + '" placeholder="Deskripsi singkat..."></div>'
    + '<div class="form-group"><label class="form-label">Urutan</label>'
    + '<input type="number" class="form-control" id="ptOrder" value="' + obj.order + '" min="1"></div>'
    + '<div class="form-group"><label class="form-label">Status</label>'
    + '<div style="display:flex;align-items:center;gap:10px;margin-top:6px"><label class="switch"><input type="checkbox" id="ptStatus" ' + (obj.isActive ? 'checked' : '') + '><span class="switch-track"></span></label>'
    + '<span style="font-size:13px;color:var(--text-secondary)">Aktif</span></div></div>'
    + '</div>';
}

function autoTypeSlug(inp) {
  var slug = inp.value.toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-');
  var s = document.getElementById('ptSlug'); if (s) s.value = slug;
}

function openAddType() {
  _ptActiveId = null;
  openModal('Tambah Product Type', buildTypeModal(null),
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-primary" onclick="saveType()"><i class="fa-solid fa-floppy-disk"></i> Simpan</button>'
  );
}

function openEditType(id) {
  var t = PRODUCT_TYPES.find(function(x){ return x.id === id; });
  if (!t) return;
  _ptActiveId = id;
  openModal('Edit Product Type — ' + t.name, buildTypeModal(t),
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-primary" onclick="saveType()"><i class="fa-solid fa-floppy-disk"></i> Simpan</button>'
  );
}

function saveType() {
  var name = (document.getElementById('ptName').value || '').trim();
  if (!name) { showToast('error','Nama type wajib diisi!'); return; }
  var slug   = document.getElementById('ptSlug').value;
  var desc   = document.getElementById('ptDesc').value;
  var order  = parseInt(document.getElementById('ptOrder').value) || 1;
  var active = document.getElementById('ptStatus').checked;

  if (_ptActiveId) {
    var t = PRODUCT_TYPES.find(function(x){ return x.id === _ptActiveId; });
    if (t) { t.name = name; t.slug = slug; t.description = desc; t.order = order; t.isActive = active; }
    closeModal(); showToast('success', 'Product type berhasil diperbarui!');
  } else {
    PRODUCT_TYPES.push({ id:'pt'+Date.now(), name:name, slug:slug, description:desc, order:order, isActive:active, variantCount:0 });
    closeModal(); showToast('success', 'Product type berhasil ditambahkan!');
  }
  _ptActiveId = null;
  renderProductTypes();
}

function deleteType(id) {
  var t = PRODUCT_TYPES.find(function(x){ return x.id === id; });
  if (!t) return;
  _ptActiveId = id;
  openModal('Hapus Product Type',
    '<p style="font-size:14px;color:var(--text-secondary)">Hapus type <strong style="color:var(--error)">' + t.name + '</strong>? Varian yang terhubung tidak akan terhapus.</p>',
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-danger" onclick="confirmDeleteType()">Hapus</button>'
  );
}

function confirmDeleteType() {
  if (!_ptActiveId) return;
  var idx = PRODUCT_TYPES.findIndex(function(x){ return x.id === _ptActiveId; });
  if (idx > -1) PRODUCT_TYPES.splice(idx, 1);
  _ptActiveId = null;
  closeModal();
  renderProductTypes();
  showToast('success', 'Product type berhasil dihapus!');
}
