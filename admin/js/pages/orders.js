let ordersPage    = 1;
let ordersPerPage = 10;
let ordersTab     = 'all';
let ordersQuery   = '';

function renderOrders() {
  const html = `
    <div class="page-header">
      <div>
        <div class="page-title">Transaction Management</div>
        <div class="page-subtitle">Kelola order dan top up customer dalam satu halaman.</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-outline btn-sm" onclick="exportCSV()"><i class="fa-solid fa-download"></i> Export CSV</button>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid-4 mb-24" style="grid-template-columns:repeat(5,1fr)">
      <div class="stat-card">
        <div class="stat-label">Hari Ini</div>
        <div class="stat-value sm">${ALL_TRANSACTIONS.filter(function(t){var d=new Date(t.date);var n=new Date();return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate();}).length}</div>
        <div class="stat-footer"><span class="stat-note">Transaksi hari ini</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label" style="color:var(--warning)"><i class="fa-solid fa-clock"></i> Belum Bayar</div>
        <div class="stat-value sm" style="color:var(--warning)">${ALL_TRANSACTIONS.filter(function(t){return t.status==='pending';}).length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label" style="color:var(--info)"><i class="fa-solid fa-rotate"></i> Diproses</div>
        <div class="stat-value sm" style="color:var(--info)">${ALL_TRANSACTIONS.filter(function(t){return t.status==='processing'||t.status==='process';}).length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label" style="color:var(--success)"><i class="fa-solid fa-circle-check"></i> Sukses</div>
        <div class="stat-value sm" style="color:var(--success)">${ALL_TRANSACTIONS.filter(function(t){return t.status==='paid'||t.status==='completed'||t.status==='success';}).length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label" style="color:var(--error)"><i class="fa-solid fa-circle-xmark"></i> Gagal</div>
        <div class="stat-value sm" style="color:var(--error)">${ALL_TRANSACTIONS.filter(function(t){return t.status==='failed'||t.status==='cancelled'||t.status==='canceled';}).length}</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab-btn active" data-tab="all"      onclick="switchOrderTab('all')">All<span class="tab-count">${ALL_TRANSACTIONS.length}</span></button>
      <button class="tab-btn"        data-tab="pending"  onclick="switchOrderTab('pending')">Pending<span class="tab-count">${ALL_TRANSACTIONS.filter(function(t){return t.status==='pending';}).length}</span></button>
      <button class="tab-btn"        data-tab="process"  onclick="switchOrderTab('process')">Diproses<span class="tab-count">${ALL_TRANSACTIONS.filter(function(t){return t.status==='processing'||t.status==='process';}).length}</span></button>
      <button class="tab-btn"        data-tab="success"  onclick="switchOrderTab('success')">Sukses<span class="tab-count">${ALL_TRANSACTIONS.filter(function(t){return t.status==='paid'||t.status==='completed'||t.status==='success';}).length}</span></button>
      <button class="tab-btn"        data-tab="failed"   onclick="switchOrderTab('failed')">Gagal<span class="tab-count">${ALL_TRANSACTIONS.filter(function(t){return t.status==='failed'||t.status==='cancelled'||t.status==='canceled';}).length}</span></button>
      <button class="tab-btn"        data-tab="refunded" onclick="switchOrderTab('refunded')">Refunded<span class="tab-count">${ALL_TRANSACTIONS.filter(function(t){return t.status==='refunded';}).length}</span></button>
      <button class="tab-btn"        data-tab="canceled" onclick="switchOrderTab('canceled')">Dibatalkan<span class="tab-count">${ALL_TRANSACTIONS.filter(function(t){return t.status==='cancelled'||t.status==='canceled';}).length}</span></button>
    </div>

    <!-- Filters -->
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
      <div style="flex:1;min-width:220px;position:relative">
        <i class="fa-solid fa-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px"></i>
        <input type="text" class="form-control" placeholder="Cari invoice, email, referensi..." style="padding-left:36px" id="orderSearch" oninput="onOrderSearch(this.value)">
      </div>
      <input type="date" class="form-control" style="width:150px" id="orderDateFrom">
      <span style="color:var(--text-muted)">–</span>
      <input type="date" class="form-control" style="width:150px" id="orderDateTo">
      <select class="form-control" style="width:120px" onchange="ordersPerPage=+this.value;ordersPage=1;renderOrdersTable()">
        <option value="10">10 / hal</option>
        <option value="25">25 / hal</option>
        <option value="50">50 / hal</option>
        <option value="100">100 / hal</option>
      </select>
      <button class="btn btn-outline btn-sm" onclick="applyOrderFilter()"><i class="fa-solid fa-filter"></i> Filter</button>
    </div>

    <!-- Table -->
    <div class="card">
      <div id="ordersTableWrap"></div>
    </div>
  `;

  document.getElementById('pageContent').innerHTML = html;
  renderOrdersTable();
}

function switchOrderTab(tab) {
  ordersTab = tab;
  ordersPage = 1;
  document.querySelectorAll('.tab-btn[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  renderOrdersTable();
}

function onOrderSearch(q) {
  ordersQuery = q;
  ordersPage  = 1;
  renderOrdersTable();
}

function applyOrderFilter() {
  showToast('success', 'Filter diterapkan!');
  renderOrdersTable();
}

function exportCSV() {
  showToast('success', 'Mengekspor data ke CSV...');
}

function renderOrdersTable() {
  let data = ALL_TRANSACTIONS;
  if (ordersTab !== 'all') data = data.filter(t => t.status === ordersTab);
  if (ordersQuery) data = filterTable(ordersQuery, data, ['id','product','customer','payment']);

  const start = (ordersPage - 1) * ordersPerPage;
  const paged = data.slice(start, start + ordersPerPage);

  const rows = paged.length ? paged.map(t => `
    <tr>
      <td><span class="invoice-link" onclick="openInvoiceDetail('${t.id}')">${t.id}</span></td>
      <td><div class="td-product">
        <div class="product-thumb"><i class="fa-solid fa-box"></i></div>
        <div>
          <div class="td-strong" style="font-size:13px">${t.product.split('–')[0].trim()}</div>
          <div style="font-size:11px;color:var(--text-muted)">${t.variant||''}</div>
        </div>
      </div></td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.customer}</td>
      <td class="td-strong">${formatRp(t.total||t.amount||0)}</td>
      <td><span class="badge badge-gray">${t.paymentMethod||t.payment||'—'}</span></td>
      <td>${statusBadge(t.status)}</td>
      <td style="font-size:12px;color:var(--text-muted)">${t.date}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-ghost btn-icon" title="Lihat detail" onclick="openInvoiceDetail('${t.id}')"><i class="fa-solid fa-eye"></i></button>
          <button class="btn btn-ghost btn-icon" title="Cetak" onclick="printInvoice('${t.id}')"><i class="fa-solid fa-print"></i></button>
          <button class="btn btn-ghost btn-icon" title="Ubah status" onclick="changeStatus('${t.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-ghost btn-icon" title="Refund" onclick="refundOrder('${t.id}')"><i class="fa-solid fa-rotate-left"></i></button>
          <button class="btn btn-ghost btn-icon" title="Batalkan" onclick="cancelOrder('${t.id}')"><i class="fa-solid fa-ban"></i></button>
        </div>
      </td>
    </tr>`).join('') :
    `<tr><td colspan="8"><div class="empty-state"><i class="fa-solid fa-inbox"></i><h3>Tidak ada transaksi</h3><p>Coba ubah filter atau tab yang dipilih</p></div></td></tr>`;

  document.getElementById('ordersTableWrap').innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>
          <th>Invoice</th><th>Produk</th><th>Customer</th>
          <th>Total</th><th>Payment</th><th>Status</th><th>Tanggal</th><th>Aksi</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${renderPagination(ordersPage, 1, ordersPerPage, data.length, 'goOrderPage')}
  `;
}

function goOrderPage(p) { ordersPage = p; renderOrdersTable(); }

function saveOrderStatus(id) {
  var sel = document.getElementById('newStatusSel');
  if (!sel) return;
  var status = sel.value;
  closeModal();
  // Update lokal
  if (typeof ALL_TRANSACTIONS !== 'undefined') {
    var o = ALL_TRANSACTIONS.find(function(x){ return x.id === id || x._id === id || x.invoice === id; });
    if (o) o.status = status;
  }
  showToast('success', 'Status berhasil diubah!');
  if (typeof renderOrders === 'function') renderOrders();
  // Sync ke MongoDB
  if (typeof store !== 'undefined') store.saveOrderStatus(id, status);
}

function changeStatus(id) {
  openModal('Ubah Status Transaksi',
    `<div class="form-group">
      <label class="form-label">Invoice: <strong>${id}</strong></label>
    </div>
    <div class="form-group">
      <label class="form-label">Status Baru</label>
      <select class="form-control" id="newStatusSel">
        <option value="pending">Belum Bayar</option>
        <option value="process">Diproses</option>
        <option value="success">Sukses</option>
        <option value="failed">Gagal</option>
        <option value="refunded">Refunded</option>
        <option value="canceled">Dibatalkan</option>
      </select>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Batal</button>
     <button class="btn btn-primary" onclick="saveOrderStatus('${id}')">Simpan</button>`
  );
}

function refundOrder(id) {
  confirmAction('Konfirmasi Refund', `Apakah Anda yakin ingin melakukan refund untuk invoice <strong>${id}</strong>? Tindakan ini tidak dapat dibatalkan.`,
    `if(typeof store!=='undefined') store.saveOrderStatus('${id}', 'refunded'); showToast('success','Refund berhasil diproses!'); if(typeof renderOrders==='function') renderOrders();`, true);
}

function cancelOrder(id) {
  confirmAction('Batalkan Transaksi', `Apakah Anda yakin ingin membatalkan invoice <strong>${id}</strong>?`,
    `if(typeof store!=='undefined') store.saveOrderStatus('${id}', 'canceled'); showToast('success','Transaksi berhasil dibatalkan!'); if(typeof renderOrders==='function') renderOrders();`, true);
}
