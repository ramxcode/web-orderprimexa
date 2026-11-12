var _varActiveId = null; // tracking ID untuk edit/delete varian

function renderProductVariants() {
  // Baca context filter dari halaman Produk (jika ada)
  var ctx = window._variantProductFilter || null;

  // Deklarasikan initialData DULU sebelum dipakai di HTML
  var initialData = ctx
    ? PRODUCT_VARIANTS.filter(function(v){ return v.productId === ctx.id; })
    : PRODUCT_VARIANTS;

  var total  = PRODUCT_VARIANTS.length;
  var aktif  = PRODUCT_VARIANTS.filter(function(v){ return v.isActive; }).length;
  var habis  = PRODUCT_VARIANTS.filter(function(v){ return v.stock === 0; }).length;

  // Banner konteks produk (jika masuk dari tombol Kelola Varian)
  var contextBanner = '';
  if (ctx) {
    contextBanner = '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--accent-subtle);border:1px solid var(--accent);border-radius:var(--radius);padding:12px 16px;margin-bottom:16px;flex-wrap:wrap;gap:8px">'
      + '<div style="display:flex;align-items:center;gap:10px">'
      + '<i class="fa-solid fa-filter" style="color:var(--accent-light);font-size:14px"></i>'
      + '<div>'
      + '<div style="font-size:13px;font-weight:700;color:var(--text-primary)">Menampilkan varian dari: <span style="color:var(--accent-light)">' + ctx.name + '</span></div>'
      + '<div style="font-size:11px;color:var(--text-muted)">Hanya varian produk ini yang ditampilkan</div>'
      + '</div></div>'
      + '<button class="btn btn-outline btn-sm" onclick="clearVariantFilter()"><i class="fa-solid fa-xmark"></i> Lihat Semua Varian</button>'
      + '</div>';
  }

  var html = contextBanner + '<div class="page-header">'
    + '<div><div class="page-title">Product Variant</div>'
    + '<div class="page-subtitle">' + (ctx ? 'Varian produk <strong>' + ctx.name + '</strong>' : 'Lihat dan kelola semua varian dari seluruh produk.') + '</div></div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    + '<button class="btn btn-outline btn-sm" onclick="openMarkupAll()"><i class="fa-solid fa-percent"></i> Atur Markup Semua</button>'
    + '<button class="btn btn-primary btn-sm" onclick="openAddVariant()"><i class="fa-solid fa-plus"></i> Tambah Varian</button></div></div>'

    // Stats
    + '<div class="pm-stats-row" style="grid-template-columns:repeat(3,1fr)">'
    + '<div class="pm-stat-card"><div class="pm-stat-icon blue"><i class="fa-solid fa-sliders"></i></div><div><div class="pm-stat-label">Total Varian</div><div class="pm-stat-value">' + total + '</div></div></div>'
    + '<div class="pm-stat-card"><div class="pm-stat-icon green"><i class="fa-solid fa-circle-check"></i></div><div><div class="pm-stat-label">Varian Aktif</div><div class="pm-stat-value" style="color:var(--success)">' + aktif + '</div></div></div>'
    + '<div class="pm-stat-card"><div class="pm-stat-icon red"><i class="fa-solid fa-box-open"></i></div><div><div class="pm-stat-label">Stok Habis</div><div class="pm-stat-value" style="color:var(--error)">' + habis + '</div></div></div>'
    + '</div>'

    // Markup all form (hidden by default)
    + '<div id="markupAllPanel" style="display:none"></div>'

    // Filters
    + '<div class="card mb-16"><div class="pm-filter-row" style="margin-bottom:0;flex-wrap:wrap">'
    + '<div style="flex:1;min-width:200px;position:relative">'
    + '<i class="fa-solid fa-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px"></i>'
    + '<input type="text" class="form-control" placeholder="Cari nama varian atau produk..." style="padding-left:36px" id="varSearch" oninput="filterVariants()">'
    + '</div>'
    + '<select class="form-control" style="width:170px" id="varPrdFilter" onchange="filterVariants()">'
    + '<option value="">Semua Produk</option>'
    + PRODUCTS.map(function(p){ return '<option value="' + p.id + '"' + (ctx && ctx.id === p.id ? ' selected' : '') + '>' + p.name + '</option>'; }).join('')
    + '</select>'
    + '<select class="form-control" style="width:140px" id="varStatusFilter" onchange="filterVariants()">'
    + '<option value="">Semua Status</option><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select>'
    + '<select class="form-control" style="width:140px" id="varStockFilter" onchange="filterVariants()">'
    + '<option value="">Semua Stok</option><option value="available">Tersedia</option><option value="low">Stok Rendah</option><option value="empty">Habis</option></select>'
    + '<select class="form-control" style="width:140px" id="varSrcFilter" onchange="filterVariants()">'
    + '<option value="">Semua Sumber</option><option value="lokal">Lokal</option><option value="supplier">Supplier</option></select>'
    + '<button class="btn btn-outline btn-sm" onclick="resetVarFilter()"><i class="fa-solid fa-rotate-left"></i></button>'
    + '</div></div>'

    // Bulk bar
    + '<div id="varBulkBar" style="display:none;background:var(--accent-subtle);border:1px solid var(--accent);border-radius:var(--radius);padding:10px 16px;margin-bottom:12px;align-items:center;gap:12px">'
    + '<span id="varBulkCount" style="font-size:13px;color:var(--accent-light);font-weight:600">0 dipilih</span>'
    + '<button class="btn btn-outline btn-xs" onclick="bulkVarAction(\'active\')"><i class="fa-solid fa-circle-check"></i> Aktifkan</button>'
    + '<button class="btn btn-outline btn-xs" onclick="bulkVarAction(\'inactive\')"><i class="fa-solid fa-circle-xmark"></i> Nonaktifkan</button>'
    + '<button class="btn btn-ghost btn-xs" onclick="bulkVarAction(\'delete\')" style="color:var(--error)"><i class="fa-solid fa-trash"></i> Hapus</button>'
    + '</div>'

    // Table
    + '<div class="card" style="padding:0;overflow:hidden">'
    + '<div class="table-wrap"><table class="data-table"><thead><tr>'
    + '<th style="width:40px"><input type="checkbox" id="varSelectAll" onclick="selectAllVars(this)" style="width:15px;height:15px;cursor:pointer"></th>'
    + '<th>VARIAN</th><th>PRODUK</th><th>HARGA MODAL</th><th>MARKUP</th><th>HARGA JUAL</th><th>STOK</th><th>STATUS</th><th>AKSI</th>'
    + '</tr></thead><tbody id="varTableBody">'
    + renderVariantRows(initialData)
    + '</tbody></table></div>'
    + renderVarPagination(initialData.length)
    + '</div>';

  document.getElementById('pageContent').innerHTML = html;
}

function renderVariantRows(data) {
  if (!data.length) return '<tr><td colspan="9"><div class="empty-state"><i class="fa-solid fa-sliders"></i><h3>Tidak ada varian</h3><p>Tambahkan varian produk</p></div></td></tr>';
  return data.map(function(v) {
    var profit = v.sellingPrice - v.costPrice;
    var srcColor = v.source === 'lokal' ? 'var(--success)' : 'var(--accent-light)';
    var srcBg    = v.source === 'lokal' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)';
    var stokBadge = v.stock === 0
      ? '<span class="badge badge-error"><i class="fa-solid fa-box-open"></i> Habis</span>'
      : v.stock < 5
        ? '<span style="color:var(--warning);font-weight:700">' + v.stock + ' <i class="fa-solid fa-triangle-exclamation" style="font-size:11px"></i></span>'
        : '<span style="font-weight:700;color:var(--text-primary)">' + v.stock + '</span>';
    return '<tr>'
      + '<td><input type="checkbox" class="var-check" data-id="' + v.id + '" onclick="updateVarBulk()" style="width:15px;height:15px;cursor:pointer"></td>'
      + '<td><div><div style="font-weight:700;color:var(--text-primary)">' + v.name + '</div>'
      + '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">'
      + '<i class="fa-solid ' + (v.processType === 'auto' ? 'fa-robot' : 'fa-user') + '"></i> ' + (v.processType === 'auto' ? 'Auto' : 'Manual')
      + ' &bull; ' + (v.typeName || '') + '</div></div></td>'
      + '<td><div style="font-size:13px;font-weight:600;color:var(--text-primary)">' + v.productName + '</div>'
      + '<span style="background:' + srcBg + ';color:' + srcColor + ';font-size:10px;font-weight:600;padding:2px 7px;border-radius:99px">' + v.source + '</span></td>'
      + '<td style="color:var(--text-secondary)">' + formatRp(v.costPrice) + '</td>'
      + '<td style="color:var(--success);font-weight:700">+' + formatRp(profit) + '</td>'
      + '<td style="font-weight:700;color:var(--text-primary)">' + formatRp(v.sellingPrice) + '</td>'
      + '<td>' + stokBadge + '</td>'
      + '<td><label class="switch"><input type="checkbox" ' + (v.isActive ? 'checked' : '') + ' onchange="toggleVariant(\'' + v.id + '\',this)"><span class="switch-track"></span></label></td>'
      + '<td><div class="action-btns">'
      + '<button class="btn btn-outline btn-xs" onclick="openEditVariant(\'' + v.id + '\')"><i class="fa-solid fa-pen"></i></button>'
      + '<button class="btn btn-ghost btn-icon" onclick="deleteVariant(\'' + v.id + '\')"><i class="fa-solid fa-trash" style="color:var(--error);font-size:12px"></i></button>'
      + '</div></td></tr>';
  }).join('');
}

function renderVarPagination(total) {
  return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid var(--border);flex-wrap:wrap;gap:8px">'
    + '<span style="font-size:12px;color:var(--text-muted)">' + total + ' varian</span>'
    + '<div style="display:flex;gap:6px"><button class="btn btn-outline btn-xs" disabled><i class="fa-solid fa-chevron-left"></i></button>'
    + '<button class="btn btn-primary btn-xs">1</button>'
    + '<button class="btn btn-outline btn-xs" disabled><i class="fa-solid fa-chevron-right"></i></button></div></div>';
}

function filterVariants() {
  var q   = (document.getElementById('varSearch').value || '').toLowerCase();
  var prd = document.getElementById('varPrdFilter').value;
  var st  = document.getElementById('varStatusFilter').value;
  var stk = document.getElementById('varStockFilter').value;
  var src = document.getElementById('varSrcFilter').value;
  var filtered = PRODUCT_VARIANTS.filter(function(v) {
    var matchStk = !stk || (stk === 'available' && v.stock > 5) || (stk === 'low' && v.stock > 0 && v.stock <= 5) || (stk === 'empty' && v.stock === 0);
    return (!q || v.name.toLowerCase().includes(q) || v.productName.toLowerCase().includes(q))
      && (!prd || v.productId === prd)
      && (!st  || (st === 'active' ? v.isActive : !v.isActive))
      && matchStk
      && (!src || v.source === src);
  });
  var body = document.getElementById('varTableBody');
  if (body) body.innerHTML = renderVariantRows(filtered);
}

function resetVarFilter() {
  ['varSearch','varPrdFilter','varStatusFilter','varStockFilter','varSrcFilter'].forEach(function(id){ var el = document.getElementById(id); if (el) el.value = ''; });
  filterVariants();
}

function selectAllVars(el) { document.querySelectorAll('.var-check').forEach(function(cb){ cb.checked = el.checked; }); updateVarBulk(); }

function clearVariantFilter() {
  // Hapus context filter dan reload halaman untuk tampilkan semua varian
  window._variantProductFilter = null;
  renderProductVariants();
}

function updateVarBulk() {
  var checked = document.querySelectorAll('.var-check:checked');
  var bar = document.getElementById('varBulkBar'); var cnt = document.getElementById('varBulkCount');
  if (bar) bar.style.display = checked.length ? 'flex' : 'none';
  if (cnt) cnt.textContent = checked.length + ' dipilih';
}

function bulkVarAction(action) {
  var checked = document.querySelectorAll('.var-check:checked');
  if (!checked.length) return;
  var msgs = { active:'diaktifkan', inactive:'dinonaktifkan', delete:'dihapus' };
  showToast('success', checked.length + ' varian berhasil ' + msgs[action] + '!');
  document.querySelectorAll('.var-check').forEach(function(cb){ cb.checked = false; });
  var all = document.getElementById('varSelectAll'); if (all) all.checked = false;
  updateVarBulk();
}

function toggleVariant(id, el) {
  var v = PRODUCT_VARIANTS.find(function(x){ return x.id === id; });
  if (v) { v.isActive = el.checked; showToast(el.checked ? 'success' : 'warning', v.name + (el.checked ? ' diaktifkan!' : ' dinonaktifkan!')); }
}

function deleteVariant(id) {
  var v = PRODUCT_VARIANTS.find(function(x){ return x.id === id; }); if (!v) return;
  _varActiveId = id;
  openModal('Hapus Varian',
    '<p style="font-size:14px;color:var(--text-secondary)">Hapus varian <strong style="color:var(--error)">' + v.name + '</strong> dari produk <strong>' + v.productName + '</strong>?</p>',
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-danger" onclick="confirmDeleteVariant()">Hapus</button>'
  );
}

function confirmDeleteVariant() {
  if (!_varActiveId) return;
  var idx = PRODUCT_VARIANTS.findIndex(function(x){ return x.id === _varActiveId; });
  if (idx > -1) PRODUCT_VARIANTS.splice(idx, 1);
  _varActiveId = null;
  closeModal();
  renderProductVariants();
  showToast('success', 'Varian berhasil dihapus!');
}

// ---- Markup All ----
function openMarkupAll() {
  openModal('Atur Markup Semua Varian',
    '<div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:12px;margin-bottom:16px;font-size:13px;color:var(--warning)">'
    + '<i class="fa-solid fa-triangle-exclamation"></i> Ini akan mengubah markup semua varian produk. Pastikan nilai yang dimasukkan sudah benar.</div>'
    + '<div style="display:grid;gap:14px">'
    + '<div class="form-group"><label class="form-label">Tipe Markup</label>'
    + '<select class="form-control" id="markupType">'
    + '<option value="fixed">Nominal Tetap (Rp)</option>'
    + '<option value="percent">Persentase (%)</option>'
    + '<option value="add">Tambah dari Harga Modal</option>'
    + '<option value="round">Bulatkan Harga Jual</option>'
    + '</select></div>'
    + '<div class="form-group"><label class="form-label">Nilai Markup</label>'
    + '<input type="number" class="form-control" id="markupVal" placeholder="Contoh: 5000" min="0"></div>'
    + '<div class="form-group"><label class="form-label">Terapkan ke</label>'
    + '<select class="form-control" id="markupTarget">'
    + '<option value="all">Semua Produk</option>'
    + '<option value="lokal">Sumber Lokal</option>'
    + '<option value="supplier">Sumber Supplier</option>'
    + '</select></div>'
    + '</div>',
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-primary" onclick="applyMarkupAll()"><i class="fa-solid fa-check"></i> Terapkan ke Semua</button>'
  );
}

function applyMarkupAll() {
  var type  = document.getElementById('markupType').value;
  var val   = parseFloat(document.getElementById('markupVal').value) || 0;
  var target= document.getElementById('markupTarget').value;
  var affected = PRODUCT_VARIANTS.filter(function(v){ return target === 'all' || v.source === target; });
  affected.forEach(function(v) {
    v.markupType = type;
    v.markupValue = val;
    if (type === 'fixed' || type === 'add') v.sellingPrice = v.costPrice + val;
    else if (type === 'percent') v.sellingPrice = Math.round(v.costPrice * (1 + val/100));
  });
  closeModal();
  showToast('success', affected.length + ' varian berhasil diperbarui markupnya!');
  renderProductVariants();
}

// ---- Add/Edit Variant Modal ----
function openAddVariant() {
  _varActiveId = null;
  openModal('Tambah Varian Baru', buildVariantForm(null),
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-primary" onclick="saveVariant()"><i class="fa-solid fa-floppy-disk"></i> Simpan Varian</button>'
  );
}

function openEditVariant(id) {
  var v = PRODUCT_VARIANTS.find(function(x){ return x.id === id; }); if (!v) return;
  _varActiveId = id;
  openModal('Edit Varian — ' + v.name, buildVariantForm(v),
    '<button class="btn btn-outline" onclick="closeModal()">Batal</button>'
    + '<button class="btn btn-primary" onclick="saveVariant()"><i class="fa-solid fa-floppy-disk"></i> Simpan</button>'
  );
}

function buildVariantForm(v) {
  var isEdit = !!v;
  var obj = v || { productId:'', productTypeId:'', name:'', costPrice:0, sellingPrice:0, processType:'auto', isActive:true };
  return '<div style="display:grid;gap:14px;max-height:60vh;overflow-y:auto;padding-right:4px">'

    // A: Informasi Dasar
    + '<div style="font-size:12px;font-weight:700;color:var(--accent-light);text-transform:uppercase;letter-spacing:1px"><i class="fa-solid fa-circle-info"></i> Informasi Dasar</div>'
    + '<div class="form-group"><label class="form-label">Produk <span style="color:var(--error)">*</span></label>'
    + '<select class="form-control" id="vfPrd" ' + (isEdit && v.source === 'supplier' ? 'disabled' : '') + '>'
    + '<option value="">-- Pilih Produk --</option>'
    + PRODUCTS.map(function(p){ return '<option value="' + p.id + '" ' + (obj.productId === p.id ? 'selected' : '') + '>' + p.name + '</option>'; }).join('')
    + '</select></div>'
    + '<div class="form-group"><label class="form-label">Product Type</label>'
    + '<select class="form-control" id="vfType">'
    + '<option value="">-- Pilih Type (Opsional) --</option>'
    + PRODUCT_TYPES.filter(function(t){ return t.isActive; }).map(function(t){ return '<option value="' + t.id + '" ' + (obj.productTypeId === t.id ? 'selected' : '') + '>' + t.name + '</option>'; }).join('')
    + '</select></div>'
    + '<div class="form-group"><label class="form-label">Nama Varian <span style="color:var(--error)">*</span></label>'
    + '<input type="text" class="form-control" id="vfName" value="' + obj.name + '" placeholder="Contoh: 1 Bulan [iOS]"></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
    + '<div class="form-group"><label class="form-label">Harga Modal (Rp) <span style="color:var(--error)">*</span></label>'
    + '<input type="number" class="form-control" id="vfCost" value="' + obj.costPrice + '" oninput="calcProfit()" ' + (isEdit && v.source === 'supplier' ? 'readonly' : '') + '></div>'
    + '<div class="form-group"><label class="form-label">Harga Jual (Rp) <span style="color:var(--error)">*</span></label>'
    + '<input type="number" class="form-control" id="vfSell" value="' + obj.sellingPrice + '" oninput="calcProfit()"></div>'
    + '</div>'
    + '<div id="vfProfitInfo" style="background:var(--success-bg);border:1px solid var(--success-border);border-radius:10px;padding:10px 14px;font-size:13px;color:var(--success)">'
    + '<i class="fa-solid fa-chart-line"></i> Estimasi Profit: <strong>' + formatRp(obj.sellingPrice - obj.costPrice) + '</strong>'
    + ' &bull; Margin: <strong>' + (obj.costPrice > 0 ? Math.round((obj.sellingPrice - obj.costPrice) / obj.costPrice * 100) : 0) + '%</strong></div>'

    // B: Cara Proses
    + '<div style="font-size:12px;font-weight:700;color:var(--accent-light);text-transform:uppercase;letter-spacing:1px"><i class="fa-solid fa-gear"></i> Cara Proses Order</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    + '<label style="border:2px solid ' + (obj.processType === 'auto' ? 'var(--accent)' : 'var(--border)') + ';border-radius:10px;padding:12px;cursor:pointer;display:flex;flex-direction:column;gap:6px" onclick="setProcess(\'auto\',this)">'
    + '<div style="display:flex;align-items:center;gap:8px;font-weight:700;color:var(--text-primary)"><input type="radio" name="vfProcess" value="auto" ' + (obj.processType === 'auto' ? 'checked' : '') + '><i class="fa-solid fa-robot" style="color:var(--accent-light)"></i> Auto</div>'
    + '<div style="font-size:11px;color:var(--text-muted)">Kirim otomatis dari Data Stok setelah pembayaran.</div></label>'
    + '<label style="border:2px solid ' + (obj.processType === 'manual' ? 'var(--accent)' : 'var(--border)') + ';border-radius:10px;padding:12px;cursor:pointer;display:flex;flex-direction:column;gap:6px" onclick="setProcess(\'manual\',this)">'
    + '<div style="display:flex;align-items:center;gap:8px;font-weight:700;color:var(--text-primary)"><input type="radio" name="vfProcess" value="manual" ' + (obj.processType === 'manual' ? 'checked' : '') + '><i class="fa-solid fa-user" style="color:var(--warning)"></i> Manual</div>'
    + '<div style="font-size:11px;color:var(--text-muted)">Admin mengirim produk secara manual.</div></label>'
    + '</div>'

    // C: Required Field
    + '<div style="font-size:12px;font-weight:700;color:var(--accent-light);text-transform:uppercase;letter-spacing:1px"><i class="fa-solid fa-input-text"></i> Required Field Customer</div>'
    + '<div class="form-group"><label class="form-label">Label Field</label><input type="text" class="form-control" id="vfLabel" placeholder="Contoh: Masukkan email Anda"></div>'
    + '<div class="form-group"><label class="form-label">Placeholder</label><input type="text" class="form-control" id="vfPlaceholder" placeholder="contoh@email.com"></div>'

    // D: Info Tambahan
    + '<div style="font-size:12px;font-weight:700;color:var(--accent-light);text-transform:uppercase;letter-spacing:1px"><i class="fa-solid fa-circle-info"></i> Informasi Tambahan</div>'
    + '<div class="form-group"><label class="form-label">Deskripsi Varian</label><textarea class="form-control" id="vfDesc" rows="2" placeholder="Deskripsi singkat varian...">' + (obj.description||'') + '</textarea></div>'
    + '<div class="form-group"><label class="form-label">Syarat dan Ketentuan</label><textarea class="form-control" id="vfTerms" rows="3" placeholder="S&K yang dikirim ke pelanggan setelah order...">' + (obj.termsAndConditions||'') + '</textarea></div>'
    + '<div style="display:flex;gap:16px;flex-wrap:wrap">'
    + '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px"><input type="checkbox" id="vfStatus" ' + (obj.isActive !== false ? 'checked' : '') + '> Status Aktif</label>'
    + '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px"><input type="checkbox" id="vfShowBot" checked> Tampil di Bot</label>'
    + '</div>'
    + '</div>';
}

function calcProfit() {
  var cost = parseFloat(document.getElementById('vfCost').value) || 0;
  var sell = parseFloat(document.getElementById('vfSell').value) || 0;
  var profit = sell - cost;
  var margin = cost > 0 ? Math.round(profit / cost * 100) : 0;
  var el = document.getElementById('vfProfitInfo');
  if (el) {
    var color = profit < 0 ? 'var(--error)' : profit === 0 ? 'var(--warning)' : 'var(--success)';
    var bg    = profit < 0 ? 'var(--error-bg)' : profit === 0 ? 'var(--warning-bg)' : 'var(--success-bg)';
    el.style.background = bg; el.style.color = color;
    if (profit < 0) el.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> <strong>Peringatan:</strong> Harga jual lebih kecil dari harga modal!';
    else el.innerHTML = '<i class="fa-solid fa-chart-line"></i> Estimasi Profit: <strong>' + formatRp(profit) + '</strong> &bull; Margin: <strong>' + margin + '%</strong>';
  }
}

function setProcess(type, label) {
  var labels = document.querySelectorAll('[onclick^="setProcess"]');
  labels.forEach(function(l){ l.style.borderColor = 'var(--border)'; });
  label.style.borderColor = 'var(--accent)';
  var radio = label.querySelector('input[type=radio]'); if (radio) radio.checked = true;
}

function saveVariant() {
  var name = (document.getElementById('vfName').value || '').trim();
  var prdEl = document.getElementById('vfPrd');
  var prd  = prdEl ? prdEl.value : (_varActiveId ? (PRODUCT_VARIANTS.find(function(x){ return x.id === _varActiveId; }) || {}).productId : '');
  if (!name) { showToast('error','Nama varian wajib diisi!'); return; }
  if (!prd && !_varActiveId)  { showToast('error','Pilih produk!'); return; }
  var cost  = parseFloat(document.getElementById('vfCost').value) || 0;
  var sell  = parseFloat(document.getElementById('vfSell').value) || 0;
  var statusEl = document.getElementById('vfStatus');
  var isActive = statusEl ? statusEl.checked : true;
  var processRadio = document.querySelector('input[name=vfProcess]:checked');
  var processType = processRadio ? processRadio.value : 'auto';
  var typeEl = document.getElementById('vfType');
  var typeId = typeEl ? typeEl.value : '';

  if (_varActiveId) {
    // Edit mode
    var v = PRODUCT_VARIANTS.find(function(x){ return x.id === _varActiveId; });
    if (v) {
      v.name = name;
      v.costPrice = cost;
      v.sellingPrice = sell;
      v.markupValue = sell - cost;
      v.isActive = isActive;
      v.processType = processType;
      if (typeId) { v.productTypeId = typeId; }
      var descEl  = document.getElementById('vfDesc');
      var termsEl = document.getElementById('vfTerms');
      v.description        = descEl  ? descEl.value.trim()  : (v.description        || '');
      v.termsAndConditions = termsEl ? termsEl.value.trim() : (v.termsAndConditions || '');
    }
    closeModal(); showToast('success', 'Varian berhasil diperbarui!');
  } else {
    // Add mode
    var prdObj = PRODUCTS.find(function(p){ return p.id === prd; });
    PRODUCT_VARIANTS.push({
      id: 'VAR' + Date.now(),
      productId: prd,
      productName: prdObj ? prdObj.name : '',
      productTypeId: typeId,
      typeName: '',
      name: name,
      costPrice: cost,
      markupType: 'fixed',
      markupValue: sell - cost,
      sellingPrice: sell,
      processType: processType,
      stock: 0,
      isActive: isActive,
      source: 'lokal'
    });
    closeModal(); showToast('success', 'Varian berhasil ditambahkan!');
    // Update variantCount di PRODUCTS in-memory
    if (prdObj) { prdObj.variantCount = (prdObj.variantCount || 0) + 1; if (isActive) prdObj.activeVariants = (prdObj.activeVariants || 0) + 1; }
  }

  // Sync variants ke MongoDB — rebuild full variants array untuk produk ini
  var syncPrdId = _varActiveId
    ? (PRODUCT_VARIANTS.find(function(x){ return x.id === _varActiveId; }) || {}).productId
    : prd;
  if (typeof api !== 'undefined' && syncPrdId) {
    var allVarsForPrd = PRODUCT_VARIANTS.filter(function(x){ return x.productId === syncPrdId; });
    var variantData   = allVarsForPrd.map(function(x){
      return {
        _id:                 x._id,
        name:                x.name,
        price:               x.sellingPrice || 0,
        costPrice:           x.costPrice    || 0,
        processType:         x.processType  || 'auto',
        productTypeId:       x.productTypeId || '',
        isActive:            x.isActive !== false,
        showInBot:           x.showInBot !== false,
        stock:               x.stock !== undefined ? x.stock : -1,
        source:              x.source || 'lokal',
        description:         x.description        || '',
        termsAndConditions:  x.termsAndConditions || '',
      };
    });
    var prdToSync = PRODUCTS.find(function(p){ return p.id === syncPrdId || p._id === syncPrdId; });
    if (prdToSync && (prdToSync._id || prdToSync.id)) {
      api.products.update(prdToSync._id || prdToSync.id, { variants: variantData })
        .catch(function(e){ console.warn('[variants] sync error:', e.message); });
    }
  }

  _varActiveId = null;
  renderProductVariants();
}
