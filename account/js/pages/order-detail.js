// order-detail.js
async function renderOrderDetail() {
    let content = `
    <div class="mb-3">
        <button class="btn btn-link text-decoration-none p-0 text-primary" onclick="navigate('orders')">
            ← Kembali ke Pesanan
        </button>
    </div>
    `;

    if (typeof _currentOrder === 'undefined' || !_currentOrder) {
        content += `
        <div class="text-center py-5">
            <h4 class="text-white">Pesanan tidak ditemukan</h4>
            <button class="btn btn-primary mt-3" onclick="navigate('orders')">Kembali</button>
        </div>
        `;
    } else {
        const o = _currentOrder;
        
        let statusBadge = '';
        if(o.status === 'pending_payment') statusBadge = '<span class="badge bg-warning text-dark">Menunggu Pembayaran</span>';
        else if(o.status === 'processing') statusBadge = '<span class="badge bg-info text-dark">Pesanan Diproses</span>';
        else if(o.status === 'completed') statusBadge = '<span class="badge bg-success">Pesanan Selesai</span>';
        else if(o.status === 'cancelled' || o.status === 'failed') statusBadge = '<span class="badge bg-danger">Dibatalkan/Gagal</span>';

        content += `
        <div class="page-header mb-4">
            <h2 class="text-white">Detail Pesanan ${o.invoiceNumber || ''}</h2>
            ${statusBadge}
        </div>

        <div class="card mb-4 bg-dark text-white border-secondary">
            <div class="card-header border-secondary">
                <h5 class="mb-0">Informasi Pesanan</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6 mb-2"><strong>Invoice:</strong> ${o.invoiceNumber || '-'}</div>
                    <div class="col-md-6 mb-2"><strong>Tanggal:</strong> ${o.date || '-'}</div>
                    <div class="col-md-6 mb-2"><strong>Status:</strong> ${statusBadge}</div>
                    <div class="col-md-6 mb-2"><strong>Reference ID:</strong> ${o.referenceId || '-'}</div>
                    <div class="col-md-6 mb-2"><strong>Metode Pembayaran:</strong> ${o.paymentMethod || '-'}</div>
                </div>
            </div>
        </div>

        <div class="card mb-4 bg-dark text-white border-secondary">
            <div class="card-header border-secondary">
                <h5 class="mb-0">Detail Produk</h5>
            </div>
            <div class="card-body p-0 table-responsive">
                <table class="table table-dark table-hover mb-0 text-white">
                    <thead>
                        <tr>
                            <th>Produk</th>
                            <th>Varian</th>
                            <th>Data Tujuan</th>
                            <th>Qty</th>
                            <th>Harga</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        if (o.items && o.items.length > 0) {
            o.items.forEach(item => {
                content += `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <div style="width: 40px; height: 40px; background-color: #2c3e50; display: flex; align-items: center; justify-content: center; border-radius: 4px;">
                                ${item.image ? `<img src="${item.image}" alt="" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">` : `<i class="fa-solid fa-image text-secondary"></i>`}
                            </div>
                            <span>${item.name || '-'}</span>
                        </div>
                    </td>
                    <td>${item.variant || '-'}</td>
                    <td>${item.targetData || '-'}</td>
                    <td>${item.qty || 0}</td>
                    <td>Rp ${(item.price || 0).toLocaleString('id-ID')}</td>
                    <td>Rp ${((item.qty || 0) * (item.price || 0)).toLocaleString('id-ID')}</td>
                </tr>
                `;
            });
        }
        
        content += `
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card mb-4 bg-dark text-white border-secondary">
            <div class="card-header border-secondary">
                <h5 class="mb-0">Ringkasan Pembayaran</h5>
            </div>
            <div class="card-body">
                <div class="d-flex justify-content-between mb-2">
                    <span>Harga Produk</span>
                    <span>Rp ${(o.productTotal || 0).toLocaleString('id-ID')}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                    <span>Biaya Admin</span>
                    <span>Rp ${(o.adminFee || 0).toLocaleString('id-ID')}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                    <span>Diskon</span>
                    <span class="text-success">- Rp ${(o.discount || 0).toLocaleString('id-ID')}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                    <span>Penggunaan Saldo</span>
                    <span class="text-danger">- Rp ${(o.balanceUsed || 0).toLocaleString('id-ID')}</span>
                </div>
                <hr style="border-color: #4a5568;">
                <div class="d-flex justify-content-between align-items-center">
                    <span style="font-size: 1.1rem; font-weight: bold;">Total</span>
                    <span style="font-size: 1.5rem; font-weight: bold; color: #3498db;">Rp ${(o.total || 0).toLocaleString('id-ID')}</span>
                </div>
            </div>
        </div>

        <div class="card mb-4 bg-dark text-white border-secondary">
            <div class="card-header border-secondary">
                <h5 class="mb-0">Timeline Status</h5>
            </div>
            <div class="card-body">
                <ul class="timeline-stepper list-unstyled mb-0" style="position: relative;">
        `;
        
        const steps = [
            { id: 'created', label: 'Pesanan Dibuat' },
            { id: 'pending_payment', label: 'Menunggu Pembayaran' },
            { id: 'paid', label: 'Pembayaran Diterima' },
            { id: 'processing', label: 'Pesanan Diproses' },
            { id: 'completed', label: 'Pesanan Selesai' }
        ];

        let currentStepIndex = steps.findIndex(s => s.id === o.status);
        if (o.status === 'completed') currentStepIndex = 4;
        if (o.status === 'cancelled' || o.status === 'failed') currentStepIndex = 0;
        
        steps.forEach((step, idx) => {
            let stepStyle = 'color: gray;';
            let iconClass = 'fa-circle text-secondary';
            let extraClass = '';
            
            if (idx < currentStepIndex) {
                stepStyle = 'color: #2ecc71;';
                iconClass = 'fa-circle-check text-success';
            } else if (idx === currentStepIndex) {
                stepStyle = 'color: #3498db; font-weight: bold;';
                iconClass = 'fa-circle-dot text-primary';
                extraClass = 'pulse-animation';
            }
            
            content += `
                <li class="mb-3 d-flex align-items-center gap-3 ${extraClass}" style="${stepStyle}">
                    <i class="fa-solid ${iconClass}"></i>
                    <span>${step.label}</span>
                </li>
            `;
        });
        
        content += `
                </ul>
                <style>
                    .timeline-stepper li { position: relative; }
                    .timeline-stepper li:not(:last-child)::after { content: ''; position: absolute; left: 7px; top: 22px; bottom: -16px; width: 2px; background: #4a5568; z-index: 0; }
                    .timeline-stepper li i { position: relative; z-index: 1; background: #212529; }
                    .pulse-animation i { animation: pulse 2s infinite; }
                    @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
                </style>
            </div>
        </div>
        `;
        
        if (o.status === 'completed' && o.digitalData) {
            content += `
            <div class="card mb-4 bg-dark text-white border-secondary">
                <div class="card-header border-secondary">
                    <h5 class="mb-0">Data Digital</h5>
                </div>
                <div class="card-body">
            `;
            const fields = ['email', 'password', 'lisensi', 'link', 'catatan'];
            fields.forEach(f => {
                if(o.digitalData[f]) {
                    content += `
                    <div class="mb-3">
                        <label class="form-label text-capitalize">${f}</label>
                        <div class="input-group">
                            <input type="text" class="form-control bg-dark text-white border-secondary digital-field-input" id="digital-${f}" value="${o.digitalData[f]}" style="filter: blur(5px); transition: filter 0.3s;" readonly>
                            <button class="btn btn-outline-secondary" type="button" onclick="toggleDigitalField('digital-${f}')">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-primary" type="button" onclick="copyField('${o.digitalData[f]}')">
                                <i class="fa-solid fa-copy"></i>
                            </button>
                        </div>
                    </div>
                    `;
                }
            });
            content += `
                </div>
            </div>
            `;
        }

        content += `<div class="d-flex gap-2">`;
        if (o.status === 'pending_payment') {
            content += `
                <button class="btn btn-primary" onclick="alert('Proceeding to payment')">Bayar Sekarang</button>
                <button class="btn btn-outline-danger" onclick="alert('Order cancelled')">Batalkan</button>
            `;
        } else if (o.status === 'processing') {
            content += `
                <button class="btn btn-outline-primary" onclick="alert('Contacting admin')">Hubungi Admin</button>
            `;
        } else if (o.status === 'completed') {
            content += `
                <button class="btn btn-outline-primary" onclick="alert('Invoice downloaded')">Unduh Invoice</button>
                <button class="btn btn-primary" onclick="alert('Ordering again')">Pesan Lagi</button>
            `;
        } else if (o.status === 'cancelled' || o.status === 'failed') {
            content += `
                <button class="btn btn-primary" onclick="alert('Ordering again')">Pesan Lagi</button>
            `;
        }
        content += `</div>`;
    }

    const container = document.getElementById('main-content');
    if (container) {
        container.innerHTML = content;
    }
}

window.toggleDigitalField = function(fieldId) {
    const el = document.getElementById(fieldId);
    if(el) {
        if(el.style.filter === 'blur(5px)') {
            el.style.filter = 'none';
        } else {
            el.style.filter = 'blur(5px)';
        }
    }
}

window.copyField = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Tersalin ke clipboard!');
    }).catch(err => {
        console.error('Gagal menyalin:', err);
    });
}
