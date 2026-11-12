function renderFeaturedProducts() {
  var html = '<div class="page-header">'
    + '<div><div class="page-title">Produk Unggulan</div>'
    + '<div class="page-subtitle">Atur produk yang ditampilkan sebagai pilihan utama di halaman toko.</div></div>'
    + '<button class="btn btn-primary" onclick="openAddFeatured()"><i class="fa-solid fa-plus"></i> Tambah Unggulan</button></div>'

    // Stats
    + '<div class="pm-stats-row" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px">'
    + '<div class="pm-stat-card"><div class="pm-stat-icon green"><i class="fa-solid fa-star"></i></div><div><div class="pm-stat-label">Total Unggulan</div><div class="pm-stat-value">' + FEATURED_PRODUCTS.length + '</div></div></div>'
    + '<div class="pm-stat-card"><div class="pm-stat-icon blue"><i class="fa-solid fa-circle-check"></i></div><div><div class="pm-stat-label">Aktif</div><div class="pm-stat-value" style="color:var(--success)">' + FEATURED_PRODUCTS.filter(function(f){ return f.status === 'active'; }).length + '</div></div></div>'
    + '<div class="pm-stat-card"><div class="pm-stat-icon purple"><i class="fa-solid fa-clock"></i></div><div><div class="pm-stat-label">Terjadwal</div><div class="pm-stat-value" style="color:var(--purple)">' + FEATURED_PRODUCTS.filter(function(f){ return f.status === 'scheduled'; }).length + '</div></div></div>'
    + '</div>'

    // Filters
    + '<div class="card mb-16"><div class="pm-filter-row" style="margin-bottom:0">'
    + '<div style="flex:1;min-width:180px;position:relative">'
    + '<i class="fa-solid fa-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px"></i>'
    + '<input type="text" class="form-control" placeholder="Cari produk unggulan..." style="padding-left:36px" id="ftSearch" oninput="filterFeatured()">'
    + '</div>'
    + '<select class="form-control" style="width:160px" id="ftCatFilter" onchange="filterFeatured()">'
    + '<option value="">Semua Kategori</option>'
    + CATEGORIES.map(function(c){ return '<option value="' + c.name + '">' + c.name + '</option>'; }).join('')
    + '</select>'
    + '<select class="form-control" style="width:140px" id="ftStatusFilter" onchange="filterFeatured()">'
    + '<option value="">Semua Status</option><option value="active">Aktif</option><option value="scheduled">Terjadwal</option><option value="expired">Berakhir</option></select>'
    + '</div></div>'

    // Drag hint
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:12px;color:var(--text-muted)">'
    + '<i class="fa-solid fa-grip-vertical"></i> Drag baris untuk mengubah urutan tampil di toko</div>'

    // Table
    + '<div class="card" style="padding:0;overflow:hidden">'
    + '<div class="table-wrap"><table class="data-table"><thead><tr>'
    + '<th style="width:30px"></th><th>PRODUK</th><th>KATEGORI</th><th>HARGA MULAI</th><th>URUTAN</th><th>PERIODE TAMPIL</th><th>STATUS</th><th>AKSI</th>'
    + '</tr></thead>'
    + '<tbody id="ftTableBody" ondragover="ftDragOver(event)" ondrop="ftDrop(event)">'
    + renderFeaturedRows(FEATURED_PRODUCTS)
    + '</tbody></table></div></div>';

  document.getElementById('pageContent').innerHTML = html;
  initFtDragDrop();
}

function getFtStatusBadge(status) {
  var map = { active: ['badge-success','fa-circle-check','Aktif'], scheduled: ['badge-warning','fa-clock','Terjadwal'], expired: ['badge-error','fa-circle-xmark','Berakhir'] };
  var m = map[status] || map['expired'];
  return '<span class="badge ' + m[0] + '"><i class="fa-solid ' + m[1] + '"></i> ' + m[2] + '</span>';
}

function renderFeaturedRows(data) {
  if (!data.length) return '<tr><td colspan="8"><div class="empty-state"><i class="fa-solid fa-star"></i><h3>Tidak ada produk unggulan</h3><p>Tambahkan produk untuk ditampilkan sebagai unggulan</p></div></td></tr>';
  return data.map(function(f, idx) {
    return '<tr draggable="true" data-id="' + f.id + '" data-idx="' + idx + '" class="ft-row" ondragstart="ftDragStart(event,this)">'
      + '<td><i class="fa-solid fa-grip-vertical" style="color:var(--text-muted);cursor:grab;font-size:14px"></i></td>'
      + '<td><div style="display:flex;align-items:center;gap:12px">'
      + '<div style="width:38px;height:38px;border-radius:9px;background:var(--accent-subtle);display:flex;align-items:center;justify-content:center;color:var(--accent-light)"><i class="fa-solid ' + f.icon + '"></i></div>'
      + '<div><div style="font-weight:700;color:var(--text-primary)">' + f.productName + '</div>'
      + '<div style="font-size:11px;color:var(--text-muted)">' + f.productId + '</div></div></div></td>'
      + '<td><span style="background:var(--accent-subtle);color:var(--accent-light);font-size:11px;font-weight:600;padding:3px 10px;border-radius:99px">' + f.category + '</span></td>'
      + '<td style="font-weight:700;color:var(--success)">Mulai ' + formatRp(f.startPrice) + '</td>'
      + '<td><div style="display:flex;align-items:center;gap:6px">'
      + '<button class="btn btn-ghost btn-icon" onclick="moveFt(\'' + f.id + '\',-1)" ' + (idx === 0 ? 'disabled' : '') + '><i class="fa-solid fa-chevron-up" style="font-size:11px"></i></button>'
      + '<span style="font-weight:700;color:var(--text-primary);min-width:20px;text-align:center">' + f.order + '</span>'
      + '<button class="btn btn-ghost btn-icon" onclick="moveFt(\'' + f.id + '\',1)" ' + (idx === data.length-1 ? 'disabled' : '') + '><i class="fa-solid fa-chevron-down" style="font-size:11px"></i></button>'
      + '</div></td>'
      + '<td style="font-size:12px;color:var(--text-muted)">' + f.startDate + ' — ' + f.endDate + '</td>'
      + '<td>' + getFtStatusBadge(f.status) + '</td>'
      + '<td><div class="action-btns">'
      + '<button class="btn btn-outline btn-xs" onclick="editFeatured(\'' + f.id + '\')"><i class="fa-solid fa-pen"></i></button>'
      + '<button class="btn btn-ghost btn-icon" onclick="deleteFeatured(\'' + f.id + '\')"><i class="fa-solid fa-trash" style="color:var(--error);font-size:12px"></i></button>'
      + '</div></td></tr>';
  }).join('');
}

// ---- Real HTML5 Drag & Drop ----
var _ftDragSrcIdx = null;

function initFtDragDrop() {
  // already using inline event handlers for draggable rows
}

function ftDragStart(event, row) {
  _ftDragSrcIdx = parseInt(row.getAttribute('data-idx'));
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', _ftDragSrcIdx);
  row.style.opacity = '0.5';
}

function ftDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  var target = event.target.closest('tr.ft-row');
  document.querySelectorAll('tr.ft-row').forEach(function(r){ r.classList.remove('drag-over'); });
  if (target) target.classList.add('drag-over');
}

function ftDrop(event) {
  event.preventDefault();
  var target = event.target.closest('tr.ft-row');
  document.querySelectorAll('tr.ft-row').forEach(function(r){ r.classList.remove('drag-over'); r.style.opacity = '1'; });
  if (!target || _ftDragSrcIdx === null) return;
  var destIdx = parseInt(target.getAttribute('data-idx'));
  if (_ftDragSrcIdx === destIdx) return;
  // Reorder array
  var item = FEATURED_PRODUCTS.splice(_ftDragSrcIdx, 1)[0];
  FEATURED_PRODUCTS.splice(destIdx, 0, item);
  FEATURED_PRODUCTS.forEach(function(f, i){ f.order = i + 1; });
  _ftDragSrcIdx = null;
  showToast('success', 'Urutan produk unggulan diperbarui!');
  renderFeaturedProducts();
}

function filterFeatured() {
  var q   = (document.getElementById('ftSearch').value || '').toLowerCase();
  var cat = document.getElementById('ftCatFilter').value;
  var st  = document.getElementById('ftStatusFilter').value;
  var filtered = FEATURED_PRODUCTS.filter(function(f) {
    return (!q || f.productName.toLowerCase().includes(q))
      && (!cat || f.category === cat)
      && (!st || f.status === st);
  });
  var body = document.getElementById('ftTableBody');
  if (body) body.innerHTML = renderFeaturedRows(filtered);
}

function moveFt(id, dir) {
  var idx = FEATURED_PRODUCTS.findIndex(function(f){ return f.id === id; });
  if (idx < 0) return;
  var newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= FEATURED_PRODUCTS.length) return;
  var tmp = FEATURED_PRODUCTS[idx]; FEATURED_PRODUCTS[idx] = FEATURED_PRODUCTS[newIdx]; FEATURED_PRODUCTS[newIdx] = tmp;
  FEATURED_PRODUCTS.forEach(function(f,i){ f.order = i+1; });
  renderFeaturedProducts();
}

function openAddFeatured() {
  openModal('Tambah Produk Unggulan',
    '<div style="display:grid;gap:12px">'
    + '<div class="form-group"><label class="form-label">Pilih Produk</label>'
    + '<select class="form-control"><option value="">-- Pilih Produk --</option>'
    + PRODUCTS.filter(function(p){ return p.isActive; }).map(function(p){ return '<option value="' + p.id + '">' + p.name + '</option>'; }).join('')
    + '</select></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
    + '<div class="form-group"><label class="form-label">Tanggal Mulai</label><input type="date" class="form-control" value="2026-07-01"></div>'
    + '<div class="form-group"><label class="form-label">Tanggal Selesai</label><input type="date" class="form-control" value="2026-12-31"></div>'
    + '</div>'
    + '<div class="form-group"><label class="form-label">Status</label>'
    + '<select class="form-control"><option value="active">Aktif</option><option value="scheduled">Terjadwal</option></select></div>'
    + '</div>',
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-primary" onclick="closeModal();showToast(\'success\',\'Produk unggulan ditambahkan!\')"><i class="fa-solid fa-floppy-disk"></i> Simpan</button>'
  );
}

function editFeatured(id) {
  var f = FEATURED_PRODUCTS.find(function(x){ return x.id === id; }); if (!f) return;
  openModal('Edit Produk Unggulan — ' + f.productName,
    '<div style="display:grid;gap:12px">'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
    + '<div class="form-group"><label class="form-label">Tanggal Mulai</label><input type="date" class="form-control" value="' + f.startDate + '"></div>'
    + '<div class="form-group"><label class="form-label">Tanggal Selesai</label><input type="date" class="form-control" value="' + f.endDate + '"></div>'
    + '</div>'
    + '<div class="form-group"><label class="form-label">Status</label>'
    + '<select class="form-control"><option value="active" ' + (f.status==='active'?'selected':'') + '>Aktif</option><option value="scheduled" ' + (f.status==='scheduled'?'selected':'') + '>Terjadwal</option></select></div>'
    + '</div>',
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-primary" onclick="closeModal();showToast(\'success\',\'Produk unggulan diperbarui!\')"><i class="fa-solid fa-floppy-disk"></i> Simpan</button>'
  );
}

function deleteFeatured(id) {
  var f = FEATURED_PRODUCTS.find(function(x){ return x.id === id; }); if (!f) return;
  openModal('Hapus dari Unggulan',
    '<p style="font-size:14px;color:var(--text-secondary)">Hapus <strong style="color:var(--text-primary)">' + f.productName + '</strong> dari daftar produk unggulan?</p>',
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-danger" onclick="closeModal();FEATURED_PRODUCTS.splice(FEATURED_PRODUCTS.findIndex(function(x){return x.id===\'' + id + '\';}),1);renderFeaturedProducts();showToast(\'success\',\'Dihapus dari unggulan!\')">Hapus</button>'
  );
}
