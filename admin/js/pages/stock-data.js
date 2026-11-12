var _stokActiveId = null; // tracking ID untuk edit/delete stok

function renderStockData() {
  var total    = STOCK_ITEMS.length;
  var tersedia = STOCK_ITEMS.filter(function(s){ return s.status === 'available'; }).length;
  var terpakai = STOCK_ITEMS.filter(function(s){ return s.status === 'used'; }).length;
  var ditahan  = STOCK_ITEMS.filter(function(s){ return s.status === 'reserved'; }).length;
  var expired  = STOCK_ITEMS.filter(function(s){ return s.status === 'expired'; }).length;

  // Track hidden items
  if (!window._stockHidden) window._stockHidden = {};

  var html = '<div class="page-header">'
    + '<div><div class="page-title">Data Stok</div>'
    + '<div class="page-subtitle">Kelola data akun, kode, lisensi, atau informasi digital yang dikirim otomatis.</div></div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    + '<button class="btn btn-outline btn-sm" onclick="importStok()"><i class="fa-solid fa-file-import"></i> Bulk Import</button>'
    + '<button class="btn btn-primary btn-sm" onclick="openAddStok()"><i class="fa-solid fa-plus"></i> Tambah Data</button>'
    + '</div></div>'

    // Stats
    + '<div class="pm-stats-row" style="grid-template-columns:repeat(5,1fr)">'
    + statStok('fa-database','blue','Total','',total)
    + statStok('fa-circle-check','green','Tersedia','var(--success)',tersedia)
    + statStok('fa-rotate','purple','Terpakai','var(--purple)',terpakai)
    + statStok('fa-lock','yellow','Ditahan','var(--warning)',ditahan)
    + statStok('fa-clock-rotate-left','red','Kedaluwarsa','var(--error)',expired)
    + '</div>'

    // Filters
    + '<div class="card mb-16"><div class="pm-filter-row" style="margin-bottom:0;flex-wrap:wrap">'
    + '<div style="flex:1;min-width:180px;position:relative">'
    + '<i class="fa-solid fa-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px"></i>'
    + '<input type="text" class="form-control" placeholder="Cari data stok..." style="padding-left:36px" id="stokSearch" oninput="filterStok()">'
    + '</div>'
    + '<select class="form-control" style="width:180px" id="stokPrdFilter" onchange="filterStok()">'
    + '<option value="">Semua Produk</option>'
    + PRODUCTS.map(function(p){ return '<option value="' + p.id + '">' + p.name + '</option>'; }).join('')
    + '</select>'
    + '<select class="form-control" style="width:180px" id="stokVarFilter" onchange="filterStok()">'
    + '<option value="">Semua Varian</option>'
    + PRODUCT_VARIANTS.map(function(v){ return '<option value="' + v.id + '">' + v.productName + ' — ' + v.name + '</option>'; }).join('')
    + '</select>'
    + '<select class="form-control" style="width:140px" id="stokStatusFilter" onchange="filterStok()">'
    + '<option value="">Semua Status</option><option value="available">Tersedia</option><option value="used">Terpakai</option><option value="reserved">Ditahan</option><option value="expired">Kedaluwarsa</option><option value="invalid">Invalid</option></select>'
    + '<button class="btn btn-outline btn-sm" onclick="resetStokFilter()"><i class="fa-solid fa-rotate-left"></i></button>'
    + '</div></div>'

    // Bulk bar
    + '<div id="stokBulkBar" style="display:none;background:var(--accent-subtle);border:1px solid var(--accent);border-radius:var(--radius);padding:10px 16px;margin-bottom:12px;align-items:center;gap:12px;flex-wrap:wrap">'
    + '<span id="stokBulkCount" style="font-size:13px;color:var(--accent-light);font-weight:600">0 dipilih</span>'
    + '<button class="btn btn-outline btn-xs" onclick="showToast(\'info\',\'Mengekspor data terpilih...\')"><i class="fa-solid fa-file-export"></i> Export Terpilih</button>'
    + '<button class="btn btn-ghost btn-xs" onclick="showToast(\'success\',\'Stok terpakai dihapus!\')"><i class="fa-solid fa-trash"></i> Hapus Terpakai</button>'
    + '</div>'

    // Table
    + '<div class="card" style="padding:0;overflow:hidden">'
    + '<div class="table-wrap"><table class="data-table"><thead><tr>'
    + '<th style="width:40px"><input type="checkbox" id="stokSelectAll" onclick="selectAllStok(this)" style="width:15px;height:15px;cursor:pointer"></th>'
    + '<th>DATA</th><th>VARIAN</th><th>PRODUK</th><th>STATUS</th><th>INVOICE</th><th>DIBUAT</th><th>DIGUNAKAN</th><th>AKSI</th>'
    + '</tr></thead><tbody id="stokTableBody">'
    + renderStokRows(STOCK_ITEMS)
    + '</tbody></table></div>'
    + renderStokPagination(STOCK_ITEMS.length)
    + '</div>';

  document.getElementById('pageContent').innerHTML = html;
}

function statStok(icon, colorClass, label, valueColor, value) {
  var colors = { blue:'var(--accent-subtle);color:var(--accent-light)', green:'var(--success-bg);color:var(--success)', purple:'var(--purple-bg);color:var(--purple)', yellow:'var(--warning-bg);color:var(--warning)', red:'var(--error-bg);color:var(--error)' };
  var c = colors[colorClass] || colors['blue'];
  return '<div class="pm-stat-card"><div class="pm-stat-icon ' + colorClass + '" style="background:' + c.split(';')[0] + ';' + c.split(';')[1] + '"><i class="fa-solid ' + icon + '"></i></div>'
    + '<div><div class="pm-stat-label">' + label + '</div>'
    + '<div class="pm-stat-value" ' + (valueColor ? 'style="color:' + valueColor + '"' : '') + '>' + value + '</div></div></div>';
}

function getStokStatusBadge(status) {
  var map = {
    available: 'badge-success',
    used:      'badge-error',
    reserved:  'badge-warning',
    expired:   'badge-gray',
    invalid:   'badge-error'
  };
  var labels = { available:'Tersedia', used:'Terpakai', reserved:'Ditahan', expired:'Kedaluwarsa', invalid:'Invalid' };
  return '<span class="badge ' + (map[status] || 'badge-gray') + '">' + (labels[status] || status) + '</span>';
}

function maskContent(content) {
  if (!content) return '—';
  // Sembunyikan seluruh data — tampilkan hanya titik-titik
  var len = Math.max(8, Math.min(content.length, 24));
  return '•'.repeat(len);
}

function renderStokRows(data) {
  if (!data.length) return '<tr><td colspan="9"><div class="empty-state"><i class="fa-solid fa-database"></i><h3>Tidak ada data stok</h3><p>Tambahkan data stok atau import dari file</p></div></td></tr>';
  return data.map(function(s) {
    var isHidden = !window._stockHidden[s.id];
    var displayContent = isHidden ? maskContent(s.content) : s.content;
    return '<tr>'
      + '<td><input type="checkbox" class="stok-check" data-id="' + s.id + '" onclick="updateStokBulk()" style="width:15px;height:15px;cursor:pointer"></td>'
      + '<td style="max-width:220px"><div style="display:flex;align-items:center;gap:8px">'
      + '<span id="stokContent_' + s.id + '" style="font-size:12px;color:var(--text-secondary);font-family:monospace;word-break:break-all">' + displayContent + '</span>'
      + '<div style="display:flex;gap:4px;flex-shrink:0">'
      + '<button class="btn btn-ghost btn-icon" onclick="toggleStokContent(\'' + s.id + '\')" title="Tampilkan/Sembunyikan" style="padding:3px 5px">'
      + '<i class="fa-solid ' + (isHidden ? 'fa-eye' : 'fa-eye-slash') + '" id="stokEyeIcon_' + s.id + '" style="font-size:11px;color:var(--text-muted)"></i></button>'
      + '<button class="btn btn-ghost btn-icon" onclick="copyStokContent(\'' + s.id + '\')" title="Salin" style="padding:3px 5px">'
      + '<i class="fa-solid fa-copy" style="font-size:11px;color:var(--text-muted)"></i></button>'
      + '</div></div></td>'
      + '<td style="font-size:12px;color:var(--text-secondary)">' + (s.variantName || '<span style="color:var(--text-muted)">—</span>') + '</td>'
      + '<td style="font-size:12px;font-weight:600;color:var(--text-primary)">' + s.productName + '</td>'
      + '<td>' + getStokStatusBadge(s.status) + '</td>'
      + '<td>' + (s.invoiceId ? '<span style="font-size:11px;color:var(--accent-light);cursor:pointer" onclick="showToast(\'info\',\'Invoice: ' + s.invoiceId + '\')">' + s.invoiceId + '</span>' : '<span style="color:var(--text-muted)">—</span>') + '</td>'
      + '<td style="font-size:11px;color:var(--text-muted)">' + s.createdAt + '</td>'
      + '<td style="font-size:11px;color:var(--text-muted)">' + (s.usedAt || '—') + '</td>'
      + '<td><div class="action-btns">'
      + (s.status === 'available' ? '<button class="btn btn-outline btn-xs" onclick="editStok(\'' + s.id + '\')"><i class="fa-solid fa-pen"></i></button>' : '')
      + '<button class="btn btn-ghost btn-icon" onclick="deleteStok(\'' + s.id + '\')"><i class="fa-solid fa-trash" style="color:var(--error);font-size:11px"></i></button>'
      + '</div></td></tr>';
  }).join('');
}

function renderStokPagination(total) {
  return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid var(--border);flex-wrap:wrap;gap:8px">'
    + '<span style="font-size:12px;color:var(--text-muted)">' + total + ' data stok</span>'
    + '<div style="display:flex;gap:6px"><button class="btn btn-outline btn-xs" disabled><i class="fa-solid fa-chevron-left"></i></button>'
    + '<button class="btn btn-primary btn-xs">1</button>'
    + '<button class="btn btn-outline btn-xs" disabled><i class="fa-solid fa-chevron-right"></i></button></div></div>';
}

function toggleStokContent(id) {
  window._stockHidden[id] = !window._stockHidden[id];
  var item = STOCK_ITEMS.find(function(s){ return s.id === id; });
  if (!item) return;
  var el   = document.getElementById('stokContent_' + id);
  var icon = document.getElementById('stokEyeIcon_' + id);
  var showing = window._stockHidden[id];
  if (el)   el.textContent   = showing ? item.content : maskContent(item.content);
  if (icon) icon.className   = 'fa-solid ' + (showing ? 'fa-eye-slash' : 'fa-eye') + ' fa-solid';
}

function copyStokContent(id) {
  var item = STOCK_ITEMS.find(function(s){ return s.id === id; });
  if (!item) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(item.content).then(function(){ showToast('success','Data disalin ke clipboard!'); });
  } else { showToast('success','Data disalin!'); }
}

function filterStok() {
  var q   = (document.getElementById('stokSearch').value || '').toLowerCase();
  var prd = document.getElementById('stokPrdFilter').value;
  var vr  = document.getElementById('stokVarFilter').value;
  var st  = document.getElementById('stokStatusFilter').value;
  var filtered = STOCK_ITEMS.filter(function(s) {
    return (!q || s.productName.toLowerCase().includes(q) || s.variantName.toLowerCase().includes(q))
      && (!prd || s.productId === prd)
      && (!vr  || s.variantId === vr)
      && (!st  || s.status === st);
  });
  var body = document.getElementById('stokTableBody');
  if (body) body.innerHTML = renderStokRows(filtered);
}

function resetStokFilter() {
  ['stokSearch','stokPrdFilter','stokVarFilter','stokStatusFilter'].forEach(function(id){ var el = document.getElementById(id); if (el) el.value = ''; });
  filterStok();
}

function selectAllStok(el) {
  document.querySelectorAll('.stok-check').forEach(function(cb){ cb.checked = el.checked; });
  updateStokBulk();
}

function updateStokBulk() {
  var checked = document.querySelectorAll('.stok-check:checked');
  var bar = document.getElementById('stokBulkBar'); var cnt = document.getElementById('stokBulkCount');
  if (bar) bar.style.display = checked.length ? 'flex' : 'none';
  if (cnt) cnt.textContent = checked.length + ' dipilih';
}

function openAddStok() {
  openModal('Tambah Data Stok',
    '<div style="display:grid;gap:14px">'
    + '<div style="display:flex;gap:8px;margin-bottom:4px">'
    + '<button class="btn btn-primary btn-sm" id="stokModeSingle" onclick="setStokMode(\'single\')">Tambah Satu</button>'
    + '<button class="btn btn-outline btn-sm" id="stokModeBulk" onclick="setStokMode(\'bulk\')">Tambah Banyak</button>'
    + '</div>'
    + '<div class="form-group"><label class="form-label">Produk</label>'
    + '<select class="form-control" id="stokPrd" onchange="updateStokVarOptions()">'
    + '<option value="">Memuat produk...</option>'
    + '</select></div>'
    + '<div class="form-group"><label class="form-label">Varian</label>'
    + '<select class="form-control" id="stokVar">'
    + '<option value="">-- Pilih Produk dahulu --</option>'
    + '</select></div>'
    + '<div id="stokDataSingle">'
    + '<div class="form-group"><label class="form-label">Email / Username <span style="color:var(--error)">*</span></label>'
    + '<input type="text" class="form-control" id="stokEmail" placeholder="Contoh: user@gmail.com"></div>'
    + '<div class="form-group"><label class="form-label">Password <span style="color:var(--error)">*</span></label>'
    + '<input type="text" class="form-control" id="stokPassword" placeholder="Contoh: pass123"></div>'
    + '</div>'
    + '<div id="stokDataBulk" style="display:none"><div class="form-group"><label class="form-label">Data Stok (1 baris = 1 data)</label>'
    + '<textarea class="form-control" id="stokBulkContent" rows="6" placeholder="email:user1@gmail.com|pass:abc123&#10;email:user2@gmail.com|pass:def456&#10;..." oninput="countBulkStok(this)"></textarea>'
    + '<div id="stokBulkCount" style="font-size:12px;color:var(--text-muted);margin-top:4px">0 data terdeteksi</div></div></div>'
    + '<div class="form-group"><label class="form-label">Catatan</label><input type="text" class="form-control" id="stokNote" placeholder="Opsional..."></div>'
    + '<div class="form-group"><label class="form-label">Tanggal Kedaluwarsa</label><input type="date" class="form-control" id="stokExpiry"></div>'
    + '</div>',
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-primary" onclick="saveStok()"><i class="fa-solid fa-floppy-disk"></i> Simpan</button>'
  );
  // Fetch produk dari API setelah modal terbuka
  _loadStokProducts();
}

async function _loadStokProducts() {
  var sel = document.getElementById('stokPrd');
  if (!sel) return;
  sel.innerHTML = '<option value="">Memuat produk...</option>';
  try {
    var r = await fetch('/api/products?limit=100');
    var j = await r.json();
    if (j.success && Array.isArray(j.data) && j.data.length > 0) {
      // Urutkan A-Z
      var sorted = j.data.slice().sort(function(a,b){ return (a.name||'').localeCompare(b.name||'','id'); });
      window._stokApiProducts = sorted; // simpan untuk updateStokVarOptions
      sel.innerHTML = '<option value="">-- Pilih Produk --</option>'
        + sorted.map(function(p){
            return '<option value="' + p._id + '">' + p.name + '</option>';
          }).join('');
    } else {
      sel.innerHTML = '<option value="">Tidak ada produk tersedia</option>';
    }
  } catch(e) {
    var sel2 = document.getElementById('stokPrd');
    if (sel2) sel2.innerHTML = '<option value="">Gagal memuat produk</option>';
  }
}


async function updateStokVarOptions() {
  var prdId  = document.getElementById('stokPrd').value;
  var varSel = document.getElementById('stokVar');
  if (!varSel) return;
  if (!prdId) {
    varSel.innerHTML = '<option value="">-- Pilih Produk dahulu --</option>';
    return;
  }
  varSel.innerHTML = '<option value="">Memuat varian...</option>';
  try {
    // Cari dari cache API produk dulu
    var prods   = window._stokApiProducts || [];
    var prd     = prods.find(function(p){ return p._id === prdId; });
    var variants= prd && Array.isArray(prd.variants) ? prd.variants : [];
    // Fallback: fetch produk spesifik jika variants kosong
    if (!variants.length) {
      var r2 = await fetch('/api/products/' + prdId);
      var j2 = await r2.json();
      variants = (j2.success && j2.data && Array.isArray(j2.data.variants)) ? j2.data.variants : [];
    }
    if (!variants.length) {
      varSel.innerHTML = '<option value="">Tidak ada varian untuk produk ini</option>';
      return;
    }
    varSel.innerHTML = '<option value="">-- Pilih Varian --</option>'
      + variants.map(function(v){
          return '<option value="' + v._id + '">' + v.name + ' — Rp ' + Number(v.price||0).toLocaleString('id-ID') + '</option>';
        }).join('');
  } catch(e) {
    varSel.innerHTML = '<option value="">Gagal memuat varian</option>';
  }
}


function setStokMode(mode) {
  var single = document.getElementById('stokDataSingle');
  var bulk   = document.getElementById('stokDataBulk');
  var btnS   = document.getElementById('stokModeSingle');
  var btnB   = document.getElementById('stokModeBulk');
  if (mode === 'single') {
    if (single) single.style.display = 'block';
    if (bulk)   bulk.style.display   = 'none';
    if (btnS)   btnS.className = 'btn btn-primary btn-sm';
    if (btnB)   btnB.className = 'btn btn-outline btn-sm';
  } else {
    if (single) single.style.display = 'none';
    if (bulk)   bulk.style.display   = 'block';
    if (btnS)   btnS.className = 'btn btn-outline btn-sm';
    if (btnB)   btnB.className = 'btn btn-primary btn-sm';
  }
}

function countBulkStok(ta) {
  var lines = ta.value.split('\n').filter(function(l){ return l.trim(); });
  var cnt = document.getElementById('stokBulkCount');
  if (cnt) cnt.textContent = lines.length + ' data terdeteksi';
}

async function saveStok() {
  var prdId = document.getElementById('stokPrd').value;
  if (!prdId) { showToast('error','Pilih produk terlebih dahulu!'); return; }
  var varId = document.getElementById('stokVar').value;
  var bulkEl   = document.getElementById('stokDataBulk');
  var isBulk   = bulkEl && bulkEl.style.display !== 'none';
  var content  = '';
  if (isBulk) {
    var bulkContentEl = document.getElementById('stokBulkContent');
    content = bulkContentEl ? bulkContentEl.value.trim() : '';
  } else {
    var email = (document.getElementById('stokEmail') ? document.getElementById('stokEmail').value : '').trim();
    var pass  = (document.getElementById('stokPassword') ? document.getElementById('stokPassword').value : '').trim();
    if (email && pass) content = 'Email: ' + email + '\nPassword: ' + pass;
    else if (email)   content = 'Email: ' + email;
    else if (pass)    content = 'Password: ' + pass;
    else              content = (document.getElementById('stokContent') ? document.getElementById('stokContent').value : '').trim();
  }
  if (!content) { showToast('error','Data stok wajib diisi!'); return; }
  var expiryEl = document.getElementById('stokExpiry');
  var payload  = {
    productId:  prdId,
    variantId:  varId || undefined,
    content:    isBulk ? content.split('\n').map(function(l){return l.trim();}).filter(Boolean) : content,
    notes:      (document.getElementById('stokNote') || {}).value || '',
    expiredAt:  expiryEl ? expiryEl.value || undefined : undefined,
  };
  try {
    const r = await api.stockItems.create(payload);
    if (!r.success) { showToast('error', r.message || 'Gagal menyimpan'); return; }
    // Reload dari server
    await store._stockItems();
    closeModal();
    showToast('success', r.message || 'Data stok berhasil ditambahkan!');
    renderStockData();
  } catch(e) {
    showToast('error', e.message || 'Gagal menghubungi server');
  }
}

function editStok(id) {
  var s = STOCK_ITEMS.find(function(x){ return x.id === id; }); if (!s) return;
  _stokActiveId = id;
  // Parse existing content back into email/password fields
  var emailVal = '', passVal = '', remainVal = '';
  if (s.content) {
    var cLines = s.content.split('\n');
    cLines.forEach(function(line) {
      var lower = line.toLowerCase();
      if (lower.startsWith('email:') || lower.startsWith('email :')) {
        emailVal = line.split(':').slice(1).join(':').trim();
      } else if (lower.startsWith('password:') || lower.startsWith('password :')) {
        passVal = line.split(':').slice(1).join(':').trim();
      } else {
        remainVal += (remainVal ? '\n' : '') + line;
      }
    });
    // Fallback: if no structured format, put raw in remainVal
    if (!emailVal && !passVal) remainVal = s.content;
  }
  openModal('Edit Data Stok',
    '<div style="display:grid;gap:12px">'
    + '<div class="form-group"><label class="form-label">Produk &amp; Varian</label>'
    + '<input type="text" class="form-control" value="' + s.productName + ' — ' + s.variantName + '" disabled></div>'
    + '<div class="form-group"><label class="form-label">Email / Username <span style="color:var(--error)">*</span></label>'
    + '<input type="text" class="form-control" id="editStokEmail" value="' + emailVal + '" placeholder="Contoh: user@gmail.com"></div>'
    + '<div class="form-group"><label class="form-label">Password <span style="color:var(--error)">*</span></label>'
    + '<input type="text" class="form-control" id="editStokPassword" value="' + passVal + '" placeholder="Contoh: pass123"></div>'
    + (remainVal ? '<div class="form-group"><label class="form-label">Data Lain</label><input type="text" class="form-control" id="editStokExtra" value="' + remainVal + '"></div>' : '')
    + '<div class="form-group"><label class="form-label">Catatan</label>'
    + '<input type="text" class="form-control" id="editStokNote" value="' + (s.notes || '') + '" placeholder="Opsional..."></div>'
    + '</div>',
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-primary" onclick="saveEditStok()"><i class="fa-solid fa-floppy-disk"></i> Simpan</button>'
  );
}

async function saveEditStok() {
  if (!_stokActiveId) return;
  var emailEl   = document.getElementById('editStokEmail');
  var passEl    = document.getElementById('editStokPassword');
  var extraEl   = document.getElementById('editStokExtra');
  var noteEl    = document.getElementById('editStokNote');
  var email = emailEl ? emailEl.value.trim() : '';
  var pass  = passEl  ? passEl.value.trim()  : '';
  var extra = extraEl ? extraEl.value.trim()  : '';
  var content = '';
  if (email && pass) content = 'Email: ' + email + '\nPassword: ' + pass;
  else if (email)   content = 'Email: ' + email;
  else if (pass)    content = 'Password: ' + pass;
  if (extra)        content += (content ? '\n' : '') + extra;
  // Fallback: old single field
  if (!content) {
    var oldEl = document.getElementById('editStokContent');
    content = oldEl ? oldEl.value.trim() : '';
  }
  if (!content) { showToast('error', 'Data stok wajib diisi!'); return; }
  try {
    const r = await api.stockItems.update(_stokActiveId, {
      content: content,
      notes:   noteEl ? noteEl.value : '',
    });
    if (!r.success) { showToast('error', r.message || 'Gagal memperbarui'); return; }
    await store._stockItems();
    _stokActiveId = null;
    closeModal();
    showToast('success', 'Data stok berhasil diperbarui!');
    renderStockData();
  } catch(e) {
    showToast('error', e.message || 'Gagal menghubungi server');
  }
}

function deleteStok(id) {
  var s = STOCK_ITEMS.find(function(x){ return x.id === id; });
  if (!s) return;
  _stokActiveId = id;
  openModal('Hapus Data Stok',
    '<p style="font-size:14px;color:var(--text-secondary)">Hapus data stok <strong style="color:var(--text-primary)">' + s.productName + ' — ' + s.variantName + '</strong>? Tindakan tidak dapat dibatalkan.</p>',
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-danger" onclick="confirmDeleteStok()">Hapus</button>'
  );
}

async function confirmDeleteStok() {
  if (!_stokActiveId) return;
  try {
    const r = await api.stockItems.delete(_stokActiveId);
    if (!r.success) { showToast('error', r.message || 'Gagal menghapus'); return; }
    await store._stockItems();
    _stokActiveId = null;
    closeModal();
    renderStockData();
    showToast('success', 'Data stok berhasil dihapus!');
  } catch(e) {
    showToast('error', e.message || 'Gagal menghubungi server');
  }
}

function importStok() {
  openModal('Import Data Stok',
    '<div style="display:grid;gap:14px">'
    + '<div style="display:flex;gap:8px">'
    + '<button class="btn btn-outline btn-sm" onclick="showToast(\'info\',\'Membuka file TXT...\')"><i class="fa-solid fa-file-lines"></i> Import TXT</button>'
    + '<button class="btn btn-outline btn-sm" onclick="showToast(\'info\',\'Membuka file CSV...\')"><i class="fa-solid fa-file-csv"></i> Import CSV</button>'
    + '</div>'
    + '<div style="background:var(--bg-elevated);border:1px dashed var(--border);border-radius:10px;padding:24px;text-align:center">'
    + '<i class="fa-solid fa-cloud-arrow-up" style="font-size:28px;color:var(--text-muted);margin-bottom:8px"></i>'
    + '<p style="font-size:13px;color:var(--text-muted);margin:0">Drag & drop file TXT/CSV di sini</p>'
    + '<p style="font-size:11px;color:var(--text-muted);margin:4px 0 0">Format: 1 baris = 1 data stok</p></div>'
    + '<div class="form-group"><label class="form-label">Pilih Varian Tujuan</label>'
    + '<select class="form-control"><option value="">-- Pilih Varian --</option>'
    + PRODUCT_VARIANTS.map(function(v){ return '<option>' + v.productName + ' \u2014 ' + v.name + '</option>'; }).join('')
    + '</select></div>'
    + '<div style="font-size:12px;color:var(--text-muted);background:var(--accent-subtle);padding:10px;border-radius:8px">'
    + '<i class="fa-solid fa-circle-info" style="color:var(--accent-light)"></i> Data duplikat akan terdeteksi dan diabaikan secara otomatis.</div>'
    + '</div>',
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-primary" onclick="closeModal();showToast(\'success\',\'Import berhasil! 0 data duplikat ditemukan.\')"><i class="fa-solid fa-file-import"></i> Import</button>'
  );
}
