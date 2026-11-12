const statusColors = {
    pending_payment: '#f59e0b',
    pending_confirm: '#fb923c',
    processing: '#3b82f6',
    completed: '#22c55e',
    failed: '#ef4444',
    cancelled: '#6b7280',
    refund: '#8b5cf6'
};

const statusLabels = {
    pending_payment: 'Menunggu Pembayaran',
    pending_confirm: 'Menunggu Konfirmasi',
    processing: 'Diproses',
    completed: 'Selesai',
    failed: 'Gagal',
    cancelled: 'Dibatalkan',
    refund: 'Refund'
};

window.ordersFilter = function() {
    console.log('Filtering orders...');
    // implement filtering logic
};

window.ordersReset = function() {
    console.log('Resetting filters...');
    document.getElementById('order-search').value = '';
    document.getElementById('order-status').value = 'semua';
    window.ordersFilter();
};

window.ordersToggleAdvanced = function() {
    const advanced = document.getElementById('advanced-filters');
    if (advanced.style.display === 'none') {
        advanced.style.display = 'grid';
    } else {
        advanced.style.display = 'none';
    }
};

window.ordersViewDetail = function(invoice) {
    if (window.navigate) {
        window.navigate('/order-detail?invoice=' + invoice);
    }
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

async function renderOrders() {
    const orders = window._acctOrders || [];
    
    let ordersHtml = '';
    if (orders.length === 0) {
        ordersHtml = `
            <div style="padding: 48px 16px; text-align: center;">
                <div style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 16px;">
                    <i class="fa-solid fa-bag-shopping"></i>
                </div>
                <p style="color: var(--text-muted); margin: 0 0 16px 0; font-size: 1.1rem;">Belum ada pesanan</p>
                <button class="btn btn-primary" onclick="navigate('/')" style="background: var(--accent); color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-size: 1rem;">Mulai Belanja</button>
            </div>
        `;
    } else {
        // Desktop table view
        ordersHtml = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; color: var(--text);">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted);">
                            <th style="padding: 12px 16px;">Invoice</th>
                            <th style="padding: 12px 16px;">Produk</th>
                            <th style="padding: 12px 16px;">Total</th>
                            <th style="padding: 12px 16px;">Pembayaran</th>
                            <th style="padding: 12px 16px;">Status</th>
                            <th style="padding: 12px 16px;">Tanggal</th>
                            <th style="padding: 12px 16px;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => `
                            <tr style="border-bottom: 1px solid var(--border);">
                                <td style="padding: 12px 16px; font-weight: 500;">${order.invoice}</td>
                                <td style="padding: 12px 16px;">${order.product_name || 'Produk'}</td>
                                <td style="padding: 12px 16px;">${formatCurrency(order.total)}</td>
                                <td style="padding: 12px 16px;">${order.payment_method || '-'}</td>
                                <td style="padding: 12px 16px;">
                                    <span style="background: ${statusColors[order.status]}20; color: ${statusColors[order.status]}; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 500;">
                                        ${statusLabels[order.status] || order.status}
                                    </span>
                                </td>
                                <td style="padding: 12px 16px; color: var(--text-muted); font-size: 0.9rem;">${order.date}</td>
                                <td style="padding: 12px 16px;">
                                    <button onclick="ordersViewDetail('${order.invoice}')" style="background: transparent; border: 1px solid var(--border); color: var(--text); padding: 4px 12px; border-radius: 4px; cursor: pointer;">Detail</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    const html = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <h2 style="margin: 0; color: var(--text); font-size: 1.5rem;">Pesanan Saya</h2>
            
            <div class="card" style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px;">
                <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
                    <div style="flex: 1; min-width: 200px; position: relative;">
                        <i class="fa-solid fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
                        <input type="text" id="order-search" placeholder="Cari invoice..." style="width: 100%; padding: 10px 12px 10px 36px; background: var(--bg); border: 1px solid var(--border); color: var(--text); border-radius: 8px; outline: none; box-sizing: border-box;">
                    </div>
                    
                    <select id="order-status" style="padding: 10px 12px; background: var(--bg); border: 1px solid var(--border); color: var(--text); border-radius: 8px; outline: none;">
                        <option value="semua">Semua Status</option>
                        <option value="pending_payment">Menunggu Pembayaran</option>
                        <option value="pending_confirm">Menunggu Konfirmasi</option>
                        <option value="processing">Diproses</option>
                        <option value="completed">Selesai</option>
                        <option value="failed">Gagal</option>
                        <option value="cancelled">Dibatalkan</option>
                        <option value="refund">Refund</option>
                    </select>

                    <button class="btn btn-primary" onclick="ordersFilter()" style="background: var(--accent); color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-filter"></i> Filter
                    </button>
                    
                    <button onclick="ordersReset()" style="background: transparent; color: var(--text-muted); border: 1px solid var(--border); padding: 10px 16px; border-radius: 8px; cursor: pointer;">
                        Reset
                    </button>
                    
                    <button onclick="ordersToggleAdvanced()" style="background: transparent; color: var(--accent); border: none; padding: 10px; cursor: pointer; font-size: 0.9rem;">
                        Filter Lanjut <i class="fa-solid fa-chevron-down"></i>
                    </button>
                </div>
                
                <div id="advanced-filters" style="display: none; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);">
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <label style="font-size: 0.85rem; color: var(--text-muted);">Tanggal Mulai</label>
                        <input type="date" style="padding: 8px; background: var(--bg); border: 1px solid var(--border); color: var(--text); border-radius: 6px;">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <label style="font-size: 0.85rem; color: var(--text-muted);">Tanggal Selesai</label>
                        <input type="date" style="padding: 8px; background: var(--bg); border: 1px solid var(--border); color: var(--text); border-radius: 6px;">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <label style="font-size: 0.85rem; color: var(--text-muted);">Metode Pembayaran</label>
                        <select style="padding: 8px; background: var(--bg); border: 1px solid var(--border); color: var(--text); border-radius: 6px;">
                            <option value="">Semua Metode</option>
                            <option value="qris">QRIS</option>
                            <option value="balance">Saldo Akun</option>
                        </select>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <label style="font-size: 0.85rem; color: var(--text-muted);">Urutkan</label>
                        <select style="padding: 8px; background: var(--bg); border: 1px solid var(--border); color: var(--text); border-radius: 6px;">
                            <option value="terbaru">Terbaru</option>
                            <option value="terlama">Terlama</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="card" style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
                ${ordersHtml}
            </div>
        </div>
    `;

    document.getElementById('app-content').innerHTML = html;
}

window.renderOrders = renderOrders;
