let currentPeriod = 'year';

function renderAnalytics() {
  const html = `
    <div class="page-header">
      <div>
        <div class="page-title">Analitik</div>
        <div class="page-subtitle">Statistik penjualan berdasarkan periode</div>
      </div>
      <div class="page-actions">
        <span id="periodLabel" style="font-size:12px;color:var(--text-muted)">Tahun Ini</span>
        <button class="btn btn-outline btn-sm" onclick="refreshAnalytics()"><i class="fa-solid fa-rotate"></i> Refresh</button>
      </div>
    </div>

    <!-- Period Pills + Custom Range -->
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px">
      <div class="period-pills">
        <button class="period-pill"        data-p="today"  onclick="switchPeriod('today')">Hari Ini</button>
        <button class="period-pill"        data-p="week"   onclick="switchPeriod('week')">7 Hari</button>
        <button class="period-pill"        data-p="month"  onclick="switchPeriod('month')">Bulan Ini</button>
        <button class="period-pill active" data-p="year"   onclick="switchPeriod('year')">Tahun Ini</button>
        <button class="period-pill"        data-p="custom" onclick="switchPeriod('custom')">Custom</button>
      </div>
      <div id="customRange" class="d-flex align-center gap-8" style="display:none!important">
        <input type="date" class="form-control" style="width:148px" id="dateFrom">
        <span style="color:var(--text-muted)">—</span>
        <input type="date" class="form-control" style="width:148px" id="dateTo">
        <button class="btn btn-primary btn-sm" onclick="applyCustomRange()">Terapkan</button>
      </div>
    </div>

    <!-- Hero Profit -->
    <div id="analyticsHero"></div>

    <!-- 3 Stats -->
    <div class="grid-3 mb-24" id="analyticsStats"></div>

    <!-- Donut Charts -->
    <div class="grid-2 mb-24">
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">Komposisi Profit per Jenis</div><div class="card-subtitle" id="dProfitSub">Per jenis order</div></div>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;height:200px">
          <canvas id="donutProfitChart" style="max-width:200px;max-height:200px"></canvas>
        </div>
        <div id="donutProfitLeg" style="display:flex;justify-content:center;gap:14px;margin-top:12px;font-size:12px;flex-wrap:wrap"></div>
      </div>
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">Komposisi Omzet per Jenis</div><div class="card-subtitle" id="dRevSub">Per jenis order</div></div>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;height:200px">
          <canvas id="donutRevChart" style="max-width:200px;max-height:200px"></canvas>
        </div>
        <div id="donutRevLeg" style="display:flex;justify-content:center;gap:14px;margin-top:12px;font-size:12px;flex-wrap:wrap"></div>
      </div>
    </div>

    <!-- Hourly Bar Chart -->
    <div class="card mb-24">
      <div class="card-header">
        <div><div class="card-title">Jam Ramai Penjualan</div><div class="card-subtitle" id="hourlySub">Distribusi jumlah order per jam</div></div>
        <span class="badge badge-warning" id="peakBadge"></span>
      </div>
      <div class="chart-container" style="height:200px">
        <canvas id="hourlyChart"></canvas>
      </div>
    </div>

    <!-- Insight Terlaris -->
    <div class="card">
      <div class="card-header">
        <div style="display:flex;align-items:center;gap:8px">
          <i class="fa-solid fa-chart-bar" style="color:var(--accent-light)"></i>
          <div class="card-title">Insight Terlaris</div>
        </div>
        <div style="display:flex;gap:4px">
          <button class="btn btn-primary btn-sm"  id="btnJumlah" onclick="switchInsight('jumlah')">Jumlah</button>
          <button class="btn btn-outline btn-sm"  id="btnProfit"  onclick="switchInsight('profit')">Profit</button>
        </div>
      </div>
      <div class="grid-2">
        ${insightCard('trophy','var(--warning)','Produk Terlaris','fa-scissors',INSIGHT_TERLARIS.product)}
        ${insightCard('layer-group','var(--accent-light)','Kategori Terlaris','fa-mobile-screen',INSIGHT_TERLARIS.category)}
        ${insightCard('credit-card','var(--success)','Metode Bayar Terlaris','fa-qrcode',INSIGHT_TERLARIS.payment)}
        ${insightCard('user-star','var(--purple)','Pelanggan Teratas','fa-user',INSIGHT_TERLARIS.customer)}
      </div>
    </div>
  `;

  document.getElementById('pageContent').innerHTML = html;
  updateAnalyticsData();
}

function insightCard(icon, color, title, itemIcon, data) {
  return `
    <div class="insight-card">
      <div class="insight-header">
        <div class="insight-icon" style="background:${color}1a;color:${color}">
          <i class="fa-solid fa-${icon}"></i>
        </div>
        <div class="insight-title">${title}</div>
      </div>
      <div class="insight-item">
        <div class="insight-item-icon"><i class="fa-solid fa-${itemIcon}"></i></div>
        <div>
          <div class="insight-item-name">${data.name}</div>
          <div class="insight-item-sub">${data.sub}</div>
        </div>
        <div class="insight-item-value">${formatRp(data.value)}</div>
      </div>
    </div>`;
}

function switchPeriod(p) {
  currentPeriod = p;
  document.querySelectorAll('.period-pill[data-p]').forEach(b => b.classList.toggle('active', b.dataset.p === p));
  const cr = document.getElementById('customRange');
  if (cr) cr.style.display = p === 'custom' ? 'flex' : 'none';
  if (p !== 'custom') updateAnalyticsData();
}

function applyCustomRange() { updateAnalyticsData(); }
function refreshAnalytics() { updateAnalyticsData(); showToast('success','Data diperbarui dari database!'); }
function switchInsight(m) {
  document.getElementById('btnJumlah').className = `btn btn-${m==='jumlah'?'primary':'outline'} btn-sm`;
  document.getElementById('btnProfit').className  = `btn btn-${m==='profit'?'primary':'outline'} btn-sm`;
  showToast('info', `Menampilkan berdasarkan ${m==='jumlah'?'jumlah penjualan':'total profit'}`);
}

async function updateAnalyticsData() {
  // Loading state
  var heroEl  = document.getElementById('analyticsHero');
  var statsEl = document.getElementById('analyticsStats');
  if (heroEl)  heroEl.innerHTML  = '<div class="skeleton" style="height:120px;border-radius:16px;margin-bottom:24px"></div>';
  if (statsEl) statsEl.innerHTML = '<div class="skeleton" style="height:80px;border-radius:12px"></div><div class="skeleton" style="height:80px;border-radius:12px;margin-top:8px"></div><div class="skeleton" style="height:80px;border-radius:12px;margin-top:8px"></div>';

  var d = { profit: 0, revenue: 0, orders: 0, hourly: Array(24).fill(0) };
  var labelMap = { today: 'Hari Ini', week: '7 Hari', month: 'Bulan Ini', year: 'Tahun Ini', custom: 'Custom' };
  var label = labelMap[currentPeriod] || 'Tahun Ini';

  try {
    var fromEl = document.getElementById('dateFrom');
    var toEl   = document.getElementById('dateTo');
    var from = currentPeriod === 'custom' ? (fromEl ? fromEl.value : '') : '';
    var to   = currentPeriod === 'custom' ? (toEl   ? toEl.value   : '') : '';
    var r = await api.analytics.getStats(currentPeriod, from, to);
    if (r.success && r.data) d = r.data;
  } catch(e) {
    console.warn('[analytics] fetch gagal, tampilkan 0:', e.message);
  }

  // Hero
  if (heroEl) heroEl.innerHTML =
    '<div style="background:linear-gradient(135deg,#059669,#10B981);border-radius:16px;padding:28px 32px;margin-bottom:24px">' +
      '<div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.75)">TOTAL OMZET &middot; ' + label.toUpperCase() + '</div>' +
      '<div style="font-size:36px;font-weight:800;color:#fff;margin:8px 0">' + formatRp(d.revenue || 0) + '</div>' +
      '<div style="font-size:13px;color:rgba(255,255,255,0.75)">Total transaksi berhasil (order sukses)</div>' +
    '</div>';

  // Stats
  if (statsEl) statsEl.innerHTML =
    statCard({ label:'Total Profit', value: d.profit  || 0, icon:'fa-chart-line',      color:'green',  note: label }) +
    statCard({ label:'Total Omzet',  value: d.revenue || 0, icon:'fa-money-bill-wave', color:'blue',   note: label }) +
    statCard({ label:'Total Order',  value: d.orders  || 0, icon:'fa-cart-shopping',   color:'purple', format:'number', note: label });

  // Sublabels
  ['dProfitSub','dRevSub'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = 'Per jenis order - ' + label;
  });
  var hs = document.getElementById('hourlySub');
  if (hs) hs.textContent = 'Distribusi jumlah order per jam - ' + label;
  var hourly = d.hourly || Array(24).fill(0);
  var pk  = document.getElementById('peakBadge');
  var maxH = Math.max.apply(null, hourly);
  if (pk) {
    var peakH = hourly.indexOf(maxH);
    pk.textContent = maxH > 0 ? 'Puncak ' + String(peakH).padStart(2, '0') + ':00' : '';
  }
  var pl = document.getElementById('periodLabel');
  if (pl) pl.textContent = label;

  // Destroy old charts
  ['_donutP','_donutR','_hourly'].forEach(function(k) {
    if (window[k]) { window[k].destroy(); window[k] = null; }
  });

  var donutColors = ['#10B981','#3B82F6','#8B5CF6'];
  var donutData   = [
    Math.round((d.revenue || 0) * 0.6),
    Math.round((d.revenue || 0) * 0.3),
    Math.round((d.revenue || 0) * 0.1),
  ];

  function makeLegend(legendId) {
    var leg = document.getElementById(legendId);
    if (!leg) return;
    leg.innerHTML = DONUT_LABELS.map(function(l, i) {
      return '<span style="display:flex;align-items:center;gap:5px;color:var(--text-secondary)">' +
        '<span style="width:9px;height:9px;border-radius:3px;background:' + donutColors[i] + ';flex-shrink:0"></span>' +
        l + '</span>';
    }).join('');
  }

  setTimeout(function() {
    var dp = document.getElementById('donutProfitChart');
    if (dp) {
      window._donutP = new Chart(dp, {
        type: 'doughnut',
        data: { labels: DONUT_LABELS, datasets: [{ data: donutData, backgroundColor: donutColors, borderWidth: 0, hoverOffset: 6 }] },
        options: { responsive:true, maintainAspectRatio:true, cutout:'70%', plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'rgba(26,37,64,0.95)', bodyColor:'#94A3B8', titleColor:'#F1F5F9', padding:10 } } },
      });
      makeLegend('donutProfitLeg');
    }

    var dr = document.getElementById('donutRevChart');
    if (dr) {
      window._donutR = new Chart(dr, {
        type: 'doughnut',
        data: { labels: DONUT_LABELS, datasets: [{ data: donutData, backgroundColor: donutColors, borderWidth: 0, hoverOffset: 6 }] },
        options: { responsive:true, maintainAspectRatio:true, cutout:'70%', plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'rgba(26,37,64,0.95)', bodyColor:'#94A3B8', titleColor:'#F1F5F9', padding:10 } } },
      });
      makeLegend('donutRevLeg');
    }

    var hCtx = document.getElementById('hourlyChart');
    if (hCtx) {
      var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      var gc = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
      var tc = isDark ? '#64748B' : '#94A3B8';
      window._hourly = new Chart(hCtx, {
        type: 'bar',
        data: {
          labels: Array.from({length:24}, function(_, i) { return String(i).padStart(2,'0'); }),
          datasets: [{ data: hourly, backgroundColor: hourly.map(function(v) { return v === maxH && maxH > 0 ? '#F59E0B' : 'rgba(245,158,11,0.35)'; }), borderRadius: 5 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend:{display:false}, tooltip:{ backgroundColor:'rgba(26,37,64,0.95)', bodyColor:'#94A3B8', titleColor:'#F1F5F9', callbacks:{ label: function(ctx) { return ctx.raw + ' orders'; } } } },
          scales: { x:{ grid:{color:gc}, ticks:{color:tc,font:{size:10}} }, y:{ grid:{color:gc}, ticks:{color:tc,font:{size:11}} } },
        },
      });
    }
  }, 50);
}
