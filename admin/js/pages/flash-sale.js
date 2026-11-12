var _fsActiveId = null;
var _fsItemActiveId = null;
var _currentFlashSaleId = null;

function renderFlashSale() {
    var html = '<div class="page-header">';
    html += '<div>';
    html += '<h2 class="page-title">Flash Sale</h2>';
    html += '<p class="page-subtitle">Kelola program flash sale dan diskon waktu terbatas</p>';
    html += '</div>';
    html += '<button class="btn btn-primary" onclick="renderFlashSaleForm(null)"><i class="fa-solid fa-plus"></i> Buat Flash Sale</button>';
    html += '</div>';

    // filter card
    html += '<div class="card mb-4">';
    html += '<div class="card-body">';
    html += '<div class="row align-items-end g-3">';
    html += '<div class="col-md-4">';
    html += '<label class="form-label">Cari</label>';
    html += '<input type="text" id="fsSearch" class="form-control" placeholder="Cari judul flash sale...">';
    html += '</div>';
    html += '<div class="col-md-3">';
    html += '<label class="form-label">Status</label>';
    html += '<select id="fsStatus" class="form-control">';
    html += '<option value="">Semua</option>';
    html += '<option value="active">Aktif</option>';
    html += '<option value="inactive">Nonaktif</option>';
    html += '</select>';
    html += '</div>';
    html += '<div class="col-md-3">';
    html += '<label class="form-label">State</label>';
    html += '<select id="fsState" class="form-control">';
    html += '<option value="">Semua</option>';
    html += '<option value="upcoming">Akan Datang</option>';
    html += '<option value="active">Berlangsung</option>';
    html += '<option value="ended">Berakhir</option>';
    html += '</select>';
    html += '</div>';
    html += '<div class="col-md-2">';
    html += '<button class="btn btn-outline w-100" onclick="applyFlashSaleFilter()">Filter</button>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // table
    html += '<div class="card">';
    html += '<div class="table-wrap">';
    html += '<table class="data-table">';
    html += '<thead><tr>';
    html += '<th>Flash Sale</th>';
    html += '<th>Waktu</th>';
    html += '<th>Items</th>';
    html += '<th>Status</th>';
    html += '<th>State</th>';
    html += '<th class="text-right">Aksi</th>';
    html += '</tr></thead>';
    html += '<tbody id="fsTableBody">';
    html += '</tbody>';
    html += '</table>';
    html += '</div>';
    html += '</div>';

    document.getElementById('pageContent').innerHTML = html;
    applyFlashSaleFilter();
}

function getFlashSaleState(startAt, endAt) {
    var now = new Date().getTime();
    var start = new Date(startAt).getTime();
    var end = new Date(endAt).getTime();
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'active';
    return 'ended';
}

function getFlashSaleStateBadge(state) {
    if (state === 'upcoming') return '<span class="badge badge-primary" style="background:var(--accent);color:#fff">Akan Datang</span>';
    if (state === 'active') return '<span class="badge badge-success">Berlangsung</span>';
    if (state === 'ended') return '<span class="badge badge-error" style="background:gray">Berakhir</span>';
    return '';
}

function applyFlashSaleFilter() {
    var search = document.getElementById('fsSearch') ? document.getElementById('fsSearch').value.toLowerCase() : '';
    var status = document.getElementById('fsStatus') ? document.getElementById('fsStatus').value : '';
    var stateFilter = document.getElementById('fsState') ? document.getElementById('fsState').value : '';

    var filtered = FLASH_SALES.filter(function(fs) {
        var matchSearch = fs.title.toLowerCase().indexOf(search) > -1 || (fs.subtitle && fs.subtitle.toLowerCase().indexOf(search) > -1);
        var matchStatus = status === '' || (status === 'active' ? fs.isActive : !fs.isActive);
        var state = getFlashSaleState(fs.startAt, fs.endAt);
        var matchState = stateFilter === '' || state === stateFilter;
        return matchSearch && matchStatus && matchState;
    });

    var tbody = document.getElementById('fsTableBody');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="fa-solid fa-bolt mb-3 text-4xl text-muted"></i><p>Tidak ada flash sale ditemukan.</p></div></td></tr>';
        return;
    }

    var html = '';
    filtered.forEach(function(fs) {
        var itemCount = FLASH_SALE_ITEMS.filter(function(item) { return item.flashSaleId === fs.id; }).length;
        var state = getFlashSaleState(fs.startAt, fs.endAt);
        var stateBadge = getFlashSaleStateBadge(state);
        var statusHtml = fs.isActive ? 
            '<label class="switch"><input type="checkbox" checked onchange="toggleFlashSaleStatus(\'' + fs.id + '\')"><span class="slider round"></span></label>' : 
            '<label class="switch"><input type="checkbox" onchange="toggleFlashSaleStatus(\'' + fs.id + '\')"><span class="slider round"></span></label>';
        
        var formatTime = function(d) {
            var date = new Date(d);
            return date.toLocaleDateString('id-ID') + ' ' + date.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
        };

        html += '<tr>';
        html += '<td><div class="font-bold">' + fs.title + '</div><div class="text-sm text-muted">' + (fs.subtitle || '') + '</div></td>';
        html += '<td><div class="text-sm">' + formatTime(fs.startAt) + '<br>s/d<br>' + formatTime(fs.endAt) + '</div></td>';
        html += '<td><span class="badge badge-primary" style="background:var(--accent-subtle);color:var(--accent)">' + itemCount + ' item</span></td>';
        html += '<td>' + statusHtml + '</td>';
        html += '<td>' + stateBadge + '</td>';
        html += '<td class="text-right">';
        html += '<button class="btn btn-sm btn-outline mr-2" onclick="renderFlashSaleItems(\'' + fs.id + '\')"><i class="fa-solid fa-box"></i> Kelola Item</button>';
        html += '<button class="btn btn-sm btn-outline mr-2" onclick="renderFlashSaleForm(\'' + fs.id + '\')"><i class="fa-solid fa-pen"></i></button>';
        html += '<button class="btn btn-sm btn-danger" onclick="confirmDeleteFlashSale(\'' + fs.id + '\')"><i class="fa-solid fa-trash"></i></button>';
        html += '</td>';
        html += '</tr>';
    });

    tbody.innerHTML = html;
}

function renderFlashSaleForm(id) {
    _fsActiveId = id;
    var fs = null;
    if (id) {
        fs = FLASH_SALES.find(function(f) { return f.id === id; });
    }

    var title = fs ? 'Edit Flash Sale' : 'Buat Flash Sale';
    var startAtStr = fs && fs.startAt ? fs.startAt.slice(0, 16) : '';
    var endAtStr = fs && fs.endAt ? fs.endAt.slice(0, 16) : '';

    var html = '<div class="page-header">';
    html += '<div class="d-flex align-items-center gap-3">';
    html += '<button class="btn btn-ghost" onclick="renderFlashSale()"><i class="fa-solid fa-arrow-left"></i></button>';
    html += '<div>';
    html += '<h2 class="page-title">' + title + '</h2>';
    html += '<p class="page-subtitle">Atur detail program promosi</p>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="row g-4">';
    html += '<div class="col-md-8">';
    html += '<div class="card">';
    html += '<div class="card-body">';
    
    html += '<div class="form-group">';
    html += '<label class="form-label">Judul Flash Sale <span class="text-error">*</span></label>';
    html += '<input type="text" id="fsFormTitle" class="form-control" value="' + (fs ? fs.title : '') + '" placeholder="Misal: Promo Merdeka">';
    html += '</div>';
    
    html += '<div class="form-group">';
    html += '<label class="form-label">Subtitle</label>';
    html += '<input type="text" id="fsFormSubtitle" class="form-control" value="' + (fs ? (fs.subtitle||'') : '') + '" placeholder="Misal: Diskon hingga 50%">';
    html += '</div>';

    html += '<div class="row g-3 mb-3">';
    html += '<div class="col-md-6 form-group mb-0">';
    html += '<label class="form-label">Waktu Mulai <span class="text-error">*</span></label>';
    html += '<input type="datetime-local" id="fsFormStart" class="form-control" value="' + startAtStr + '">';
    html += '</div>';
    html += '<div class="col-md-6 form-group mb-0">';
    html += '<label class="form-label">Waktu Selesai <span class="text-error">*</span></label>';
    html += '<input type="datetime-local" id="fsFormEnd" class="form-control" value="' + endAtStr + '">';
    html += '</div>';
    html += '</div>';

    html += '<div class="form-group" style="margin-top:16px">';
    html += '<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-weight:600">';
    html += '<input type="checkbox" id="fsFormActive" ' + (fs && fs.isActive === false ? '' : 'checked') + ' style="width:16px;height:16px;cursor:pointer;accent-color:var(--accent)">';
    html += '<span>Aktifkan Flash Sale</span>';
    html += '</label>';
    html += '</div>';


    html += '</div>';
    html += '</div>';
    html += '</div>';
    
    html += '<div class="col-md-4">';
    html += '<div class="card" style="background:var(--accent-subtle); border-color:var(--accent)">';
    html += '<div class="card-body">';
    html += '<h4 class="mb-3"><i class="fa-solid fa-lightbulb text-accent mr-2"></i>Tips Flash Sale</h4>';
    html += '<ul class="pl-4 text-sm" style="list-style:disc">';
    html += '<li class="mb-2">Buat durasi yang singkat (misal: 2-3 jam) untuk menciptakan FOMO.</li>';
    html += '<li class="mb-2">Berikan diskon yang signifikan (minimal 20%) agar menarik.</li>';
    html += '<li>Pastikan stok produk mencukupi sebelum memulai.</li>';
    html += '</ul>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    html += '<div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px">';
    html += '<button class="btn btn-outline" onclick="renderFlashSale()">Batal</button>';
    html += '<button class="btn btn-primary" onclick="saveFlashSale()"><i class="fa-solid fa-floppy-disk"></i> Simpan &amp; Kelola Item</button>';
    html += '</div>';


    document.getElementById('pageContent').innerHTML = html;
}

function saveFlashSale() {
    var title = document.getElementById('fsFormTitle').value.trim();
    var subtitle = document.getElementById('fsFormSubtitle').value.trim();
    var startAt = document.getElementById('fsFormStart').value;
    var endAt = document.getElementById('fsFormEnd').value;
    var isActive = document.getElementById('fsFormActive').checked;

    if (!title) {
        showToast('error', 'Judul flash sale wajib diisi');
        return;
    }
    if (!startAt || !endAt) {
        showToast('error', 'Waktu mulai dan selesai wajib diisi');
        return;
    }
    if (new Date(startAt).getTime() >= new Date(endAt).getTime()) {
        showToast('error', 'Waktu selesai harus lebih besar dari waktu mulai');
        return;
    }

    var isoStart = new Date(startAt).toISOString();
    var isoEnd = new Date(endAt).toISOString();

    var isNew = !_fsActiveId;
    var id = _fsActiveId || 'FS' + new Date().getTime();

    if (isNew) {
        FLASH_SALES.push({
            id: id,
            title: title,
            subtitle: subtitle,
            startAt: isoStart,
            endAt: isoEnd,
            isActive: isActive,
            createdAt: new Date().toISOString()
        });
    } else {
        var fs = FLASH_SALES.find(function(f) { return f.id === id; });
        if (fs) {
            fs.title = title;
            fs.subtitle = subtitle;
            fs.startAt = isoStart;
            fs.endAt = isoEnd;
            fs.isActive = isActive;
        }
    }

    showToast('success', 'Flash sale berhasil disimpan');
    renderFlashSaleItems(id);
}

function confirmDeleteFlashSale(id) {
    _fsActiveId = id;
    var html = '<p>Apakah Anda yakin ingin menghapus flash sale ini? Semua item di dalamnya akan ikut terhapus.</p>';
    var footer = '<button class="btn btn-outline" onclick="closeModal()">Batal</button>';
    footer += '<button class="btn btn-danger" onclick="deleteFlashSale()">Hapus</button>';
    openModal('Hapus Flash Sale', html, footer);
}

function deleteFlashSale() {
    var index = FLASH_SALES.findIndex(function(f) { return f.id === _fsActiveId; });
    if (index > -1) {
        FLASH_SALES.splice(index, 1);
        
        var itemsToKeep = FLASH_SALE_ITEMS.filter(function(i) { return i.flashSaleId !== _fsActiveId; });
        FLASH_SALE_ITEMS.length = 0;
        itemsToKeep.forEach(function(i) { FLASH_SALE_ITEMS.push(i); });
        
        showToast('success', 'Flash sale berhasil dihapus');
        applyFlashSaleFilter();
    }
    closeModal();
}

function toggleFlashSaleStatus(id) {
    var fs = FLASH_SALES.find(function(f) { return f.id === id; });
    if (fs) {
        fs.isActive = !fs.isActive;
        showToast('success', 'Status flash sale diubah');
        applyFlashSaleFilter();
    }
}


function renderFlashSaleItems(flashSaleId) {
    _currentFlashSaleId = flashSaleId;
    var fs = FLASH_SALES.find(function(f) { return f.id === flashSaleId; });
    if (!fs) return renderFlashSale();

    var state = getFlashSaleState(fs.startAt, fs.endAt);
    var stateBadge = getFlashSaleStateBadge(state);

    var formatTime = function(d) {
        var date = new Date(d);
        return date.toLocaleDateString('id-ID') + ' ' + date.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
    };

    var html = '<div class="page-header">';
    html += '<div class="d-flex align-items-center gap-3">';
    html += '<button class="btn btn-ghost" onclick="renderFlashSale()"><i class="fa-solid fa-arrow-left"></i></button>';
    html += '<div>';
    html += '<div class="d-flex align-items-center gap-2 mb-1">';
    html += '<h2 class="page-title mb-0">' + fs.title + '</h2>';
    html += stateBadge;
    html += '</div>';
    html += '<p class="page-subtitle mb-0">' + formatTime(fs.startAt) + ' s/d ' + formatTime(fs.endAt) + '</p>';
    html += '</div>';
    html += '</div>';
    html += '<button class="btn btn-primary" onclick="openFlashSaleItemModal(null)"><i class="fa-solid fa-plus"></i> Tambah Item</button>';
    html += '</div>';

    html += '<div class="card mb-4" style="background:var(--accent-subtle); border: 1px solid var(--accent);">';
    html += '<div class="card-body d-flex align-items-center gap-3 py-3">';
    html += '<i class="fa-solid fa-info-circle text-accent text-xl"></i>';
    html += '<div><strong>Info:</strong> Harga Coret adalah harga palsu yang dicoret (misal Rp 100.000). Harga Asli (Harga Flash Sale) adalah harga yang harus dibayar customer.</div>';
    html += '</div>';
    html += '</div>';

    var items = FLASH_SALE_ITEMS.filter(function(i) { return i.flashSaleId === flashSaleId; });
    
    html += '<div class="row g-3" id="fsItemsContainer">';
    if (items.length === 0) {
        html += '<div class="col-12"><div class="empty-state card p-5"><i class="fa-solid fa-box-open mb-3 text-muted text-4xl"></i><p>Belum ada item di flash sale ini.</p><button class="btn btn-outline mt-3" onclick="openFlashSaleItemModal(null)">Tambah Item</button></div></div>';
    } else {
        items.forEach(function(item) {
            var prod = PRODUCTS.find(function(p) { return p.id === item.productId; });
            var vari = PRODUCT_VARIANTS.find(function(v) { return v.id === item.variantId; });
            var prodName = prod ? prod.name : 'Unknown Product';
            var variName = vari ? vari.name : 'Unknown Variant';
            var pct = item.strikePrice > item.originalPrice ? Math.round(((item.strikePrice - item.originalPrice) / item.strikePrice) * 100) : 0;
            
            html += '<div class="col-md-6 col-lg-4">';
            html += '<div class="card h-100 ' + (item.isActive ? '' : 'opacity-50') + '">';
            html += '<div class="card-body">';
            html += '<div class="d-flex justify-content-between mb-2">';
            html += (pct > 0 ? '<span class="badge badge-warning">Diskon ' + pct + '%</span>' : '<span></span>');
            html += item.isActive ? '<span class="badge badge-success">Aktif</span>' : '<span class="badge badge-error">Nonaktif</span>';
            html += '</div>';
            html += '<h4 class="mb-1 font-bold">' + prodName + '</h4>';
            html += '<p class="text-sm text-muted mb-3">' + variName + '</p>';
            html += '<div class="mb-3 p-3 bg-elevated" style="border-radius:var(--radius)">';
            if (item.strikePrice > item.originalPrice) {
                html += '<div class="text-sm text-muted" style="text-decoration: line-through">Rp ' + formatRp(item.strikePrice) + '</div>';
            }
            html += '<div class="font-bold text-accent text-xl">Rp ' + formatRp(item.originalPrice) + '</div>';
            html += '</div>';
            html += '<div class="d-flex justify-content-between text-sm mb-3">';
            html += '<div><i class="fa-solid fa-box mr-1"></i> Stok: ' + (item.stockLimit === 0 ? 'Tak Terbatas' : item.stockLimit) + '</div>';
            html += '<div><i class="fa-solid fa-cart-shopping mr-1"></i> Terjual: ' + item.soldCount + '</div>';
            html += '</div>';
            html += '<hr class="mb-3" style="border-color:var(--border)">';
            html += '<div class="d-flex justify-content-end gap-2">';
            html += '<button class="btn btn-sm btn-outline" onclick="openFlashSaleItemModal(\'' + item.id + '\')"><i class="fa-solid fa-pen"></i> Edit</button>';
            html += '<button class="btn btn-sm btn-danger" onclick="confirmDeleteFlashSaleItem(\'' + item.id + '\')"><i class="fa-solid fa-trash"></i> Hapus</button>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        });
    }
    html += '</div>';

    document.getElementById('pageContent').innerHTML = html;
}

function openFlashSaleItemModal(itemId) {
    _fsItemActiveId = itemId;
    var item = null;
    if (itemId) {
        item = FLASH_SALE_ITEMS.find(function(i) { return i.id === itemId; });
    }

    var html = '<div class="form-group">';
    html += '<label class="form-label">Produk</label>';
    html += '<select id="fsiProduct" class="form-control" onchange="onProductSelectChange(this.value)" ' + (itemId ? 'disabled' : '') + '>';
    html += '<option value="">Pilih Produk...</option>';
    PRODUCTS.forEach(function(p) {
        if (p.isActive) {
            var sel = (item && item.productId === p.id) ? 'selected' : '';
            html += '<option value="' + p.id + '" ' + sel + '>' + p.name + '</option>';
        }
    });
    html += '</select>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label class="form-label">Varian</label>';
    html += '<select id="fsiVariant" class="form-control" onchange="onVariantSelectChange(this.value)" ' + (itemId ? 'disabled' : '') + '>';
    html += '<option value="">Pilih Produk Terlebih Dahulu...</option>';
    html += '</select>';
    html += '</div>';

    html += '<div class="row g-3 mb-3">';
    html += '<div class="col-md-6 form-group mb-0">';
    html += '<label class="form-label">Harga Asli (Bayar)</label>';
    html += '<div class="input-group">';
    html += '<span class="input-group-text bg-elevated border">Rp</span>';
    html += '<input type="number" id="fsiOriginalPrice" class="form-control" readonly value="' + (item ? item.originalPrice : '') + '">';
    html += '</div>';
    html += '</div>';
    html += '<div class="col-md-6 form-group mb-0">';
    html += '<label class="form-label">Harga Coret (Palsu)</label>';
    html += '<div class="input-group">';
    html += '<span class="input-group-text bg-elevated border">Rp</span>';
    html += '<input type="number" id="fsiStrikePrice" class="form-control" value="' + (item ? item.strikePrice : '') + '" oninput="calculateDiscount()">';
    html += '</div>';
    html += '<small id="fsiDiscountInfo" class="text-success mt-1 d-block font-bold"></small>';
    html += '</div>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label class="form-label">Batas Stok (0 = Tak terbatas)</label>';
    html += '<input type="number" id="fsiStockLimit" class="form-control" value="' + (item ? item.stockLimit : '0') + '" min="0">';
    html += '</div>';

    html += '<div class="form-group mb-0">';
    html += '<label class="d-flex align-items-center cursor-pointer">';
    html += '<input type="checkbox" id="fsiActive" ' + (item && item.isActive === false ? '' : 'checked') + ' class="mr-2">';
    html += '<span class="font-bold">Aktifkan Item</span>';
    html += '</label>';
    html += '</div>';

    var footer = '<button class="btn btn-outline" onclick="closeModal()">Batal</button>';
    footer += '<button class="btn btn-primary" onclick="saveFlashSaleItem()">' + (itemId ? 'Simpan Perubahan' : 'Tambah Item') + '</button>';

    openModal(itemId ? 'Edit Item Flash Sale' : 'Tambah Item Flash Sale', html, footer);

    if (item) {
        onProductSelectChange(item.productId, item.variantId);
        calculateDiscount();
    }
}

function onProductSelectChange(productId, selectedVariantId) {
    var vSelect = document.getElementById('fsiVariant');
    if (!vSelect) return;
    
    if (!productId) {
        vSelect.innerHTML = '<option value="">Pilih Produk Terlebih Dahulu...</option>';
        document.getElementById('fsiOriginalPrice').value = '';
        document.getElementById('fsiStrikePrice').value = '';
        calculateDiscount();
        return;
    }

    var vars = PRODUCT_VARIANTS.filter(function(v) { return v.productId === productId; });
    var html = '<option value="">Pilih Varian...</option>';
    vars.forEach(function(v) {
        var sel = selectedVariantId === v.id ? 'selected' : '';
        html += '<option value="' + v.id + '" ' + sel + '>' + v.name + ' - Rp ' + formatRp(v.price) + '</option>';
    });
    vSelect.innerHTML = html;
}

function onVariantSelectChange(variantId) {
    var origInput = document.getElementById('fsiOriginalPrice');
    if (!origInput || !variantId) return;

    var vari = PRODUCT_VARIANTS.find(function(v) { return v.id === variantId; });
    if (vari) {
        origInput.value = vari.price;
        calculateDiscount();
    }
}

function calculateDiscount() {
    var origInput = document.getElementById('fsiOriginalPrice');
    var strikeInput = document.getElementById('fsiStrikePrice');
    var info = document.getElementById('fsiDiscountInfo');
    
    if (!origInput || !strikeInput || !info) return;

    var orig = parseInt(origInput.value) || 0;
    var strike = parseInt(strikeInput.value) || 0;

    if (strike > orig && orig > 0) {
        var pct = Math.round(((strike - orig) / strike) * 100);
        info.innerHTML = 'Diskon ' + pct + '%';
    } else {
        info.innerHTML = '';
    }
}

function saveFlashSaleItem() {
    var productId = document.getElementById('fsiProduct').value;
    var variantId = document.getElementById('fsiVariant').value;
    var origPrice = parseInt(document.getElementById('fsiOriginalPrice').value) || 0;
    var strikePrice = parseInt(document.getElementById('fsiStrikePrice').value) || 0;
    var stockLimit = parseInt(document.getElementById('fsiStockLimit').value) || 0;
    var isActive = document.getElementById('fsiActive').checked;

    if (!productId || !variantId) {
        showToast('error', 'Produk dan Varian wajib dipilih');
        return;
    }
    if (strikePrice > 0 && strikePrice <= origPrice) {
        showToast('error', 'Harga Coret harus lebih besar dari Harga Asli');
        return;
    }

    var isNew = !_fsItemActiveId;
    var id = _fsItemActiveId || 'FSI' + new Date().getTime();

    if (isNew) {
        FLASH_SALE_ITEMS.push({
            id: id,
            flashSaleId: _currentFlashSaleId,
            productId: productId,
            variantId: variantId,
            originalPrice: origPrice,
            strikePrice: strikePrice,
            stockLimit: stockLimit,
            soldCount: 0,
            order: FLASH_SALE_ITEMS.length,
            isActive: isActive
        });
    } else {
        var item = FLASH_SALE_ITEMS.find(function(i) { return i.id === id; });
        if (item) {
            item.strikePrice = strikePrice;
            item.stockLimit = stockLimit;
            item.isActive = isActive;
        }
    }

    showToast('success', 'Item berhasil disimpan');
    closeModal();
    renderFlashSaleItems(_currentFlashSaleId);
}

function confirmDeleteFlashSaleItem(id) {
    _fsItemActiveId = id;
    var html = '<p>Apakah Anda yakin ingin menghapus item ini dari flash sale?</p>';
    var footer = '<button class="btn btn-outline" onclick="closeModal()">Batal</button>';
    footer += '<button class="btn btn-danger" onclick="deleteFlashSaleItem()">Hapus</button>';
    openModal('Hapus Item', html, footer);
}

function deleteFlashSaleItem() {
    var index = FLASH_SALE_ITEMS.findIndex(function(i) { return i.id === _fsItemActiveId; });
    if (index > -1) {
        FLASH_SALE_ITEMS.splice(index, 1);
        showToast('success', 'Item berhasil dihapus');
        renderFlashSaleItems(_currentFlashSaleId);
    }
    closeModal();
}
