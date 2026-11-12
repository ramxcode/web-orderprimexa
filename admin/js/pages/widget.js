var _widgetActiveId = null;

function renderWidget() {
    var html = '<div class="page-header">';
    html += '<div>';
    html += '<h2 class="page-title">Widget</h2>';
    html += '<p class="page-subtitle">Kelola popup, floating button, bar notifikasi, dll</p>';
    html += '</div>';
    html += '<button class="btn btn-primary" onclick="openWidgetModal(null)"><i class="fa-solid fa-plus"></i> Tambah Widget</button>';
    html += '</div>';

    var total = WIDGETS.length;
    var activeCount = WIDGETS.filter(function(w) { return w.isActive; }).length;
    var inactiveCount = total - activeCount;

    // Stats — 3 kolom sejajar
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">';
    html += '<div class="card" style="padding:16px;"><div style="color:var(--text-muted);font-size:13px;margin-bottom:6px;">Total Widget</div><div style="font-size:24px;font-weight:700;">' + total + '</div></div>';
    html += '<div class="card" style="padding:16px;"><div style="color:var(--text-muted);font-size:13px;margin-bottom:6px;">Aktif</div><div style="font-size:24px;font-weight:700;color:#22c55e;">' + activeCount + '</div></div>';
    html += '<div class="card" style="padding:16px;"><div style="color:var(--text-muted);font-size:13px;margin-bottom:6px;">Nonaktif</div><div style="font-size:24px;font-weight:700;color:#ef4444;">' + inactiveCount + '</div></div>';
    html += '</div>';

    // Filters
    html += '<div class="card" style="margin-bottom:24px;">';
    html += '<div style="padding:16px;">';
    html += '<div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:16px;align-items:end;">';
    html += '<div>';
    html += '<label class="form-label">Cari Widget</label>';
    html += '<input type="text" id="wSearch" class="form-control" placeholder="Cari nama atau judul..." onkeyup="applyWidgetFilter()">';
    html += '</div>';
    html += '<div>';
    html += '<label class="form-label">Tipe</label>';
    html += '<select id="wType" class="form-control" onchange="applyWidgetFilter()">';
    html += '<option value="">Semua Tipe</option>';
    html += '<option value="popup">Popup</option>';
    html += '<option value="floating-button">Floating Button</option>';
    html += '<option value="notification-bar">Notification Bar</option>';
    html += '<option value="floating-image">Floating Image</option>';
    html += '<option value="toast">Toast</option>';
    html += '</select>';
    html += '</div>';
    html += '<div>';
    html += '<label class="form-label">Status</label>';
    html += '<select id="wStatus" class="form-control" onchange="applyWidgetFilter()">';
    html += '<option value="">Semua Status</option>';
    html += '<option value="active">Aktif</option>';
    html += '<option value="inactive">Nonaktif</option>';
    html += '</select>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    html += '<div id="widgetGrid" class="row g-3"></div>';

    document.getElementById('pageContent').innerHTML = html;
    applyWidgetFilter();
}

function getWidgetTypeIcon(type) {
    switch(type) {
        case 'popup': return 'fa-window-maximize';
        case 'floating-button': return 'fa-message';
        case 'notification-bar': return 'fa-bell';
        case 'floating-image': return 'fa-image';
        case 'toast': return 'fa-comment';
        default: return 'fa-puzzle-piece';
    }
}

function getWidgetTypeLabel(type) {
    switch(type) {
        case 'popup': return 'Popup';
        case 'floating-button': return 'Floating Button';
        case 'notification-bar': return 'Notification Bar';
        case 'floating-image': return 'Floating Image';
        case 'toast': return 'Toast';
        default: return 'Widget';
    }
}

function applyWidgetFilter() {
    var search = document.getElementById('wSearch').value.toLowerCase();
    var typeFilter = document.getElementById('wType').value;
    var status = document.getElementById('wStatus').value;

    var filtered = WIDGETS.filter(function(w) {
        var matchSearch = w.name.toLowerCase().indexOf(search) > -1 || (w.title && w.title.toLowerCase().indexOf(search) > -1);
        var matchType = typeFilter === '' || w.type === typeFilter;
        var matchStatus = status === '' || (status === 'active' ? w.isActive : !w.isActive);
        return matchSearch && matchType && matchStatus;
    });

    var grid = document.getElementById('widgetGrid');
    if (!grid) return;

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="col-12"><div class="empty-state card p-5"><i class="fa-solid fa-puzzle-piece mb-3 text-muted text-4xl"></i><p>Tidak ada widget ditemukan.</p></div></div>';
        return;
    }

    var html = '';
    filtered.forEach(function(w) {
        var icon = getWidgetTypeIcon(w.type);
        var typeLabel = getWidgetTypeLabel(w.type);
        var statusHtml = w.isActive ? 
            '<label class="switch"><input type="checkbox" checked onchange="toggleWidgetStatus(\'' + w.id + '\')"><span class="slider round"></span></label>' : 
            '<label class="switch"><input type="checkbox" onchange="toggleWidgetStatus(\'' + w.id + '\')"><span class="slider round"></span></label>';

        var shortDesc = w.description && w.description.length > 60 ? w.description.substring(0, 60) + '...' : w.description || '-';

        html += '<div class="col-md-6 col-lg-4">';
        html += '<div class="card h-100">';
        html += '<div class="card-header border-b d-flex justify-content-between align-items-center" style="border-bottom: 1px solid var(--border)">';
        html += '<div class="d-flex align-items-center gap-2">';
        html += '<i class="fa-solid ' + icon + ' text-accent text-lg mr-2"></i>';
        html += '<div>';
        html += '<div class="font-bold">' + w.name + '</div>';
        html += '<span class="badge badge-primary" style="font-size:0.7rem; background:var(--accent-subtle); color:var(--accent)">' + typeLabel + '</span>';
        html += '</div>';
        html += '</div>';
        html += statusHtml;
        html += '</div>';
        
        html += '<div class="card-body">';
        html += '<div class="text-sm font-bold mb-1">' + (w.title || '-') + '</div>';
        html += '<p class="text-sm text-muted mb-3">' + shortDesc + '</p>';
        html += '<div class="text-xs text-muted mb-1"><i class="fa-solid fa-link mr-1"></i> ' + (w.linkUrl || 'Tidak ada link') + '</div>';
        html += '<div class="text-xs text-muted mb-1"><i class="fa-solid fa-clock mr-1"></i> Delay: ' + w.delaySeconds + ' detik</div>';
        if (w.startAt && w.endAt) {
            html += '<div class="text-xs text-muted"><i class="fa-solid fa-calendar mr-1"></i> Terjadwal</div>';
        }
        html += '</div>';

        html += '<div class="card-body bg-elevated d-flex justify-content-end gap-2" style="border-top: 1px solid var(--border)">';
        html += '<button class="btn btn-sm btn-outline" onclick="openWidgetModal(\'' + w.id + '\')"><i class="fa-solid fa-pen"></i> Edit</button>';
        html += '<button class="btn btn-sm btn-outline text-accent border-accent" onclick="previewWidget(\'' + w.id + '\')" style="border-color:var(--accent); color:var(--accent)"><i class="fa-solid fa-eye"></i> Preview</button>';
        html += '<button class="btn btn-sm btn-ghost text-error" onclick="confirmDeleteWidget(\'' + w.id + '\')"><i class="fa-solid fa-trash"></i></button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
    });

    grid.innerHTML = html;
}

function toggleWidgetStatus(id) {
    var w = WIDGETS.find(function(x) { return x.id === id; });
    if (w) {
        w.isActive = !w.isActive;
        localStorage.setItem('ramx_widgets', JSON.stringify(WIDGETS));
        showToast('success', 'Status widget diubah');
        applyWidgetFilter();
    }
}

function openWidgetModal(id) {
    _widgetActiveId = id;
    var w = null;
    if (id) {
        w = WIDGETS.find(function(x) { return x.id === id; });
    }

    var html = '<div class="row g-4" style="max-height: 70vh; overflow-y: auto; overflow-x: hidden;">';
    
    // Left column: Basic Info
    html += '<div class="col-md-7">';
    html += '<h5 class="mb-3 font-bold pb-2" style="border-bottom: 1px solid var(--border)">Informasi Dasar</h5>';
    
    html += '<div class="form-group">';
    html += '<label class="form-label">Nama Widget (Internal) <span class="text-error">*</span></label>';
    html += '<input type="text" id="wFormName" class="form-control" value="' + (w ? w.name : '') + '" placeholder="Misal: Promo Tahun Baru">';
    html += '</div>';
    
    html += '<div class="form-group">';
    html += '<label class="form-label">Tipe Widget</label>';
    html += '<select id="wFormType" class="form-control">';
    var types = ['popup', 'floating-button', 'notification-bar', 'floating-image', 'toast'];
    var typeLabels = ['Popup', 'Floating Button', 'Notification Bar', 'Floating Image', 'Toast'];
    for(var i=0; i<types.length; i++) {
        var sel = (w && w.type === types[i]) ? 'selected' : '';
        html += '<option value="' + types[i] + '" ' + sel + '>' + typeLabels[i] + '</option>';
    }
    html += '</select>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label class="form-label">Judul Tampilan</label>';
    html += '<input type="text" id="wFormTitle" class="form-control" value="' + (w ? (w.title||'') : '') + '">';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label class="form-label">Deskripsi</label>';
    html += '<textarea id="wFormDesc" class="form-control" rows="3">' + (w ? (w.description||'') : '') + '</textarea>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label class="form-label">URL Gambar Banner <small style="color:var(--text-muted);font-weight:400;">(Opsional — untuk popup dengan gambar)</small></label>';
    html += '<input type="text" id="wFormImage" class="form-control" value="' + (w ? (w.imageUrl||'') : '') + '" placeholder="https://... atau kosongkan">';
    html += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Gambar akan ditampilkan di bagian atas popup. Klik gambar → buka Link URL.</div>';
    html += '</div>';

    html += '<div class="row g-3">';
    html += '<div class="col-6 form-group mb-0">';
    html += '<label class="form-label">Teks Tombol</label>';
    html += '<input type="text" id="wFormBtnText" class="form-control" value="' + (w ? (w.buttonText||'') : '') + '">';
    html += '</div>';
    html += '<div class="col-6 form-group mb-0">';
    html += '<label class="form-label">Link URL</label>';
    html += '<input type="text" id="wFormLink" class="form-control" value="' + (w ? (w.linkUrl||'') : '') + '" placeholder="https://...">';
    html += '</div>';
    html += '</div>';
    
    html += '</div>';

    // Right column: Settings
    html += '<div class="col-md-5" style="border-left: 1px solid var(--border)">';
    html += '<h5 class="mb-3 font-bold pb-2" style="border-bottom: 1px solid var(--border)">Pengaturan Tampilan</h5>';

    html += '<div class="form-group">';
    html += '<label class="form-label">Delay Tampil (Detik)</label>';
    html += '<input type="number" id="wFormDelay" class="form-control" value="' + (w ? w.delaySeconds : '0') + '" min="0">';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label class="form-label">Posisi Tampilan</label>';
    html += '<select id="wFormPos" class="form-control">';
    var posOpts = ['center', 'bottom-left', 'bottom-right', 'top', 'bottom'];
    var posLabels = ['Tengah', 'Kiri Bawah', 'Kanan Bawah', 'Atas', 'Bawah'];
    for(var i=0; i<posOpts.length; i++) {
        var selPos = (w && w.position === posOpts[i]) ? 'selected' : '';
        html += '<option value="' + posOpts[i] + '" ' + selPos + '>' + posLabels[i] + '</option>';
    }
    html += '</select>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label class="d-flex align-items-center cursor-pointer mb-1">';
    html += '<input type="checkbox" id="wFormOnce" ' + (w && w.oncePerSession ? 'checked' : '') + ' class="mr-2">';
    html += '<span class="font-bold">Tampilkan sekali per sesi</span>';
    html += '</label>';
    html += '<small class="text-muted d-block mb-3">Jika dicentang, widget tidak akan muncul lagi setelah ditutup oleh user selama sesi browser berlangsung.</small>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label class="form-label">Jadwal Mulai (Opsional)</label>';
    html += '<input type="datetime-local" id="wFormStart" class="form-control" value="' + (w && w.startAt ? w.startAt.slice(0,16) : '') + '">';
    html += '</div>';
    
    html += '<div class="form-group">';
    html += '<label class="form-label">Jadwal Berakhir (Opsional)</label>';
    html += '<input type="datetime-local" id="wFormEnd" class="form-control" value="' + (w && w.endAt ? w.endAt.slice(0,16) : '') + '">';
    html += '</div>';

    html += '<div class="form-group mt-4">';
    html += '<label class="d-flex align-items-center cursor-pointer">';
    html += '<input type="checkbox" id="wFormActive" ' + (w && w.isActive === false ? '' : 'checked') + ' class="mr-2">';
    html += '<span class="font-bold text-success">Aktifkan Widget Ini</span>';
    html += '</label>';
    html += '</div>';

    html += '</div>';
    html += '</div>';

    var footer = '<button class="btn btn-outline" onclick="closeModal()">Batal</button>';
    footer += '<button class="btn btn-primary" onclick="saveWidget()">' + (id ? 'Simpan Perubahan' : 'Tambah Widget') + '</button>';

    openModal(id ? 'Edit Widget' : 'Tambah Widget Baru', html, footer);
}

function saveWidget() {
    var name = document.getElementById('wFormName').value.trim();
    if (!name) {
        showToast('error', 'Nama widget wajib diisi');
        return;
    }

    var startAt = document.getElementById('wFormStart').value;
    var endAt = document.getElementById('wFormEnd').value;
    
    var isNew = !_widgetActiveId;
    var id = _widgetActiveId || 'W' + new Date().getTime();
    
    var newWidget = {
        id: id,
        name: name,
        type: document.getElementById('wFormType').value,
        title: document.getElementById('wFormTitle').value.trim(),
        description: document.getElementById('wFormDesc').value.trim(),
        imageUrl: document.getElementById('wFormImage').value.trim(),
        buttonText: document.getElementById('wFormBtnText').value.trim(),
        linkUrl: document.getElementById('wFormLink').value.trim(),
        position: document.getElementById('wFormPos').value,
        delaySeconds: parseInt(document.getElementById('wFormDelay').value) || 0,
        oncePerSession: document.getElementById('wFormOnce').checked,
        startAt: startAt ? new Date(startAt).toISOString() : null,
        endAt: endAt ? new Date(endAt).toISOString() : null,
        isActive: document.getElementById('wFormActive').checked,
        createdAt: isNew ? new Date().toISOString() : undefined
    };

    if (isNew) {
        WIDGETS.push(newWidget);
    } else {
        var idx = WIDGETS.findIndex(function(x) { return x.id === id; });
        if (idx > -1) {
            newWidget.createdAt = WIDGETS[idx].createdAt; // preserve
            WIDGETS[idx] = newWidget;
        }
    }

    showToast('success', 'Widget berhasil disimpan');
    localStorage.setItem('ramx_widgets', JSON.stringify(WIDGETS));
    closeModal();
    applyWidgetFilter();
}

function confirmDeleteWidget(id) {
    _widgetActiveId = id;
    var html = '<p>Apakah Anda yakin ingin menghapus widget ini?</p>';
    var footer = '<button class="btn btn-outline" onclick="closeModal()">Batal</button>';
    footer += '<button class="btn btn-danger" onclick="deleteWidget()">Hapus</button>';
    openModal('Hapus Widget', html, footer);
}

function deleteWidget() {
    var index = WIDGETS.findIndex(function(w) { return w.id === _widgetActiveId; });
    if (index > -1) {
        WIDGETS.splice(index, 1);
        localStorage.setItem('ramx_widgets', JSON.stringify(WIDGETS));
        showToast('success', 'Widget berhasil dihapus');
        applyWidgetFilter();
    }
    closeModal();
}

function previewWidget(id) {
    var w = WIDGETS.find(function(x) { return x.id === id; });
    if (!w) return;

    var previewHtml = '<div class="text-center p-4">';
    previewHtml += '<i class="fa-solid ' + getWidgetTypeIcon(w.type) + ' text-4xl text-accent mb-3"></i>';
    previewHtml += '<h4>' + (w.title || 'Tidak ada judul') + '</h4>';
    previewHtml += '<p class="text-muted mt-2">' + (w.description || 'Tidak ada deskripsi') + '</p>';
    if (w.buttonText) {
        previewHtml += '<button class="btn btn-primary mt-3">' + w.buttonText + '</button>';
    }
    previewHtml += '<div class="text-xs text-muted mt-4 pt-3" style="border-top: 1px solid var(--border)">Posisi: ' + w.position + ' | Delay: ' + w.delaySeconds + 's</div>';
    previewHtml += '</div>';

    openModal('Preview: ' + w.name, previewHtml, '<button class="btn btn-primary" onclick="closeModal()">Tutup Preview</button>');
}
