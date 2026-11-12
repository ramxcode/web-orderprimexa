function renderDashboard() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const s = DASHBOARD_STATS;
  const u = USER_STATS;
  const p = PERIOD_ANALYTICS;

  const html = `
    <!-- Welcome Banner -->
    <div class="welcome-banner">
      <div>
        <div class="welcome-date">${dateStr}</div>
        <div class="welcome-title">Selamat Datang Kembali! 👋</div>
        <div class="welcome-sub">Pantau performa toko digital Anda hari ini.</div>
      </div>
    </div>

    <!-- Stats Row 1 -->
    <div class="grid-4 mb-24">
      ${statCard({ label:'Total Revenue',           value:s.totalRevenue.value,  prev:s.totalRevenue.prev,  icon:'fa-money-bill-trend-up', color:'blue',   note:'vs bulan lalu' })}
      ${statCard({ label:'Total Profit',            value:s.totalProfit.value,   prev:s.totalProfit.prev,   icon:'fa-chart-line',          color:'green',  note:'Dari markup produk' })}
      ${statCard({ label:'Total Orders',            value:s.totalOrders.value,   prev:s.totalOrders.prev,   icon:'fa-cart-shopping',        color:'purple', format:'number', note:'Order sukses' })}
      ${statCard({ label:'Saldo Payment Gateway',   value:s.gatewayBalance.value,                           icon:'fa-building-columns',     color:'yellow', warning:'Saldo rendah' })}
    </div>

    <!-- Analitik Periode -->
    <div class="card mb-24">
      <div class="card-header">
        <div>
          <div class="card-title">Analitik Periode</div>
          <div class="card-subtitle">Order &amp; profit per periode</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="showToast('success','Data diperbarui!')">
          <i class="fa-solid fa-rotate"></i>
        </button>
      </div>
      <div class="grid-3">
        ${periodCol('HARI INI',       p.hariIni.orders,   p.hariIni.profit)}
        ${periodCol('KEMARIN',        p.kemarin.orders,   p.kemarin.profit)}
        ${periodCol('7 HARI TERAKHIR',p.tujuhHari.orders, p.tujuhHari.profit)}
      </div>
    </div>

    <!-- User + Transaction Stats -->
    <div class="grid-2 mb-24">
      ${statCard({ label:'Pengguna Terdaftar', value:u.registered.value,  icon:'fa-users',         color:'blue',   format:'number', note:'Total pengguna aktif' })}
      ${statCard({ label:'Saldo Pengguna',     value:u.userBalance.value, icon:'fa-coins',          color:'cyan',   note:'Total saldo tersedia' })}
    </div>
    <div class="grid-4 mb-24">
      ${statCard({ label:'Belum Bayar', value:u.pending.value,    icon:'fa-clock',          color:'yellow', format:'number' })}
      ${statCard({ label:'Diproses',    value:u.processing.value, icon:'fa-rotate',         color:'blue',   format:'number' })}
      ${statCard({ label:'Sukses',      value:u.success.value,    icon:'fa-circle-check',   color:'green',  format:'number' })}
      ${statCard({ label:'Gagal',       value:u.failed.value,     icon:'fa-circle-xmark',   color:'red',    format:'number' })}
    </div>

    <!-- Chart + Top Products -->
    <div class="grid-7-3 mb-24">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Analytics Orders</div>
            <div class="card-subtitle">30 hari terakhir</div>
          </div>
          <div style="display:flex;gap:16px;font-size:12px;color:var(--text-secondary);align-items:center">
            <span style="display:flex;align-items:center;gap:5px">
              <span style="width:10px;height:10px;border-radius:50%;background:#3B82F6;display:inline-block"></span>Orders
            </span>
            <span style="display:flex;align-items:center;gap:5px">
              <span style="width:10px;height:10px;border-radius:50%;background:#10B981;display:inline-block"></span>Revenue
            </span>
          </div>
        </div>
        <div class="chart-container" style="height:240px">
          <canvas id="dashOrderChart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title">Produk Terlaris</div>
          <div class="card-subtitle">Berdasarkan total orders</div>
        </div>
        ${TOP_PRODUCTS.map(pr => `
          <div class="rank-card">
            <div class="rank-num ${rankClass(pr.rank)}">${pr.rank}</div>
            <div class="rank-icon"><i class="${pr.icon}"></i></div>
            <div class="rank-info">
              <div class="rank-name">${pr.name}</div>
              <div class="rank-meta">${pr.orders} orders</div>
            </div>
            <div class="rank-value">${formatRp(pr.revenue)}</div>
          </div>`).join('')}
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Transaksi Terbaru</div>
          <div class="card-subtitle">10 transaksi terakhir</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="navigate('orders')">
          Lihat Semua <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>Invoice</th><th>Produk</th><th>Customer</th><th>Total</th><th>Status</th><th>Waktu</th>
          </tr></thead>
          <tbody>
            ${RECENT_TRANSACTIONS.slice(0,10).map(t => `
              <tr>
                <td><span class="invoice-link" onclick="openInvoiceDetail('${t.id}')">${t.id}</span></td>
                <td><div class="td-product">
                  <div class="product-thumb"><i class="fa-solid fa-box"></i></div>
                  <div>
                    <div class="td-strong">${t.product.split('–')[0].trim()}</div>
                    <div style="font-size:11px;color:var(--text-muted)">${t.product.includes('–')?t.product.split('–')[1].trim():''}</div>
                  </div>
                </div></td>
                <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.customer}</td>
                <td class="td-strong">${formatRp(t.total)}</td>
                <td>${statusBadge(t.status)}</td>
                <td style="font-size:12px;color:var(--text-muted)">${timeAgo(t.date)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('pageContent').innerHTML = html;
  initDashboardCharts();
}

function periodCol(label, orders, profit) {
  return `
    <div style="padding:16px;border:1px solid var(--border);border-radius:12px">
      <div class="section-label">${label}</div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="stat-icon blue" style="width:32px;height:32px;font-size:13px"><i class="fa-solid fa-cart-shopping"></i></div>
          <div>
            <div style="font-size:11px;color:var(--text-muted)">Total Order</div>
            <div style="font-size:22px;font-weight:800;color:var(--text-primary)">${orders}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="stat-icon green" style="width:32px;height:32px;font-size:13px"><i class="fa-solid fa-chart-line"></i></div>
          <div>
            <div style="font-size:11px;color:var(--text-muted)">Total Profit</div>
            <div style="font-size:18px;font-weight:800;color:var(--text-primary)">${formatRp(profit)}</div>
          </div>
        </div>
      </div>
    </div>`;
}

function openInvoiceDetail(id) {
  const t = [...ALL_TRANSACTIONS, ...RECENT_TRANSACTIONS].find(x => x.id === id);
  if (!t) return;
  openModal('Detail Transaksi',
    `<div style="display:grid;gap:12px;font-size:13px">
      <div class="d-flex justify-between align-center"><span class="text-muted">Invoice</span><strong class="text-primary">${t.id}</strong></div>
      <div class="d-flex justify-between align-center"><span class="text-muted">Produk</span><span class="text-primary">${t.product}</span></div>
      <div class="d-flex justify-between align-center"><span class="text-muted">Customer</span><span class="text-primary">${t.customer}</span></div>
      <div class="d-flex justify-between align-center"><span class="text-muted">Total</span><strong style="color:var(--success)">${formatRp(t.total)}</strong></div>
      <div class="d-flex justify-between align-center"><span class="text-muted">Payment</span><span class="badge badge-gray">${t.paymentMethod||t.payment||'—'}</span></div>
      <div class="d-flex justify-between align-center"><span class="text-muted">Status</span>${statusBadge(t.status)}</div>
      <div class="d-flex justify-between align-center"><span class="text-muted">Tanggal</span><span class="text-primary">${t.date}</span></div>
    </div>`,
    `<button class="btn btn-outline" onclick="closeModal()">Tutup</button>
     <button class="btn btn-primary" onclick="closeModal();showToast('info','Mencetak...')"><i class="fa-solid fa-print"></i> Cetak</button>`
  );
}

function initDashboardCharts() {
  const canvas = document.getElementById('dashOrderChart');
  if (!canvas) return;
  if (window._dashChart) window._dashChart.destroy();
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gc = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const tc = isDark ? '#64748B' : '#94A3B8';
  window._dashChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: CHART_DAYS,
      datasets: [
        { label:'Orders', data:CHART_ORDERS, borderColor:'#3B82F6', backgroundColor:'rgba(59,130,246,0.08)', borderWidth:2, pointRadius:0, tension:0.4, fill:true, yAxisID:'y' },
        { label:'Revenue', data:CHART_REVENUE.map(v=>v/1000), borderColor:'#10B981', backgroundColor:'rgba(16,185,129,0.08)', borderWidth:2, pointRadius:0, tension:0.4, fill:true, borderDash:[5,5], yAxisID:'y1' },
      ],
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      plugins:{
        legend:{ display:false },
        tooltip:{ backgroundColor:'rgba(26,37,64,0.95)', borderColor:'rgba(255,255,255,0.1)', borderWidth:1, titleColor:'#F1F5F9', bodyColor:'#94A3B8', padding:10,
          callbacks:{ label:(ctx)=>ctx.datasetIndex===1?`Revenue: Rp ${(ctx.raw*1000).toLocaleString('id-ID')}`:`Orders: ${ctx.raw}` }
        }
      },
      scales:{
        x:{ grid:{color:gc}, ticks:{color:tc, maxTicksLimit:8, font:{size:11}} },
        y:{ position:'left',  grid:{color:gc}, ticks:{color:tc, font:{size:11}}, title:{display:true,text:'Orders',color:tc,font:{size:11}} },
        y1:{ position:'right', grid:{drawOnChartArea:false}, ticks:{color:'#10B981',font:{size:11},callback:v=>'Rp '+Math.round(v)+'K'}, title:{display:true,text:'Revenue',color:'#10B981',font:{size:11}} },
      },
    },
  });
}
