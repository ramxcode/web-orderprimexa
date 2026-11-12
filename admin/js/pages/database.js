// ─────────────────────────────────────────────────────────────
// DATABASE OVERVIEW — Sample data dari MongoDB Atlas
// ─────────────────────────────────────────────────────────────

// Sample data MongoDB collections (data nyata dari Atlas)
var DB_SAMPLE = {
  status:     'connected',
  storageSize: 1196032,       // ~1.14 MB
  totalDocuments: 620,
  version:    'Atlas Cloud',
  collections: [
    { name: 'users',           count: 366, size: 100279,  avgObjSize: 274  },
    { name: 'stocks',          count: 128, size: 26624,   avgObjSize: 208  },
    { name: 'accessrequests',  count: 41,  size: 13404,   avgObjSize: 327  },
    { name: 'variants',        count: 20,  size: 13721,   avgObjSize: 686  },
    { name: 'transaksis',      count: 19,  size: 8664,    avgObjSize: 456  },
    { name: 'products',        count: 13,  size: 302510,  avgObjSize: 23270 },
    { name: 'orderbulks',      count: 12,  size: 1485,    avgObjSize: 124  },
    { name: 'apikeys',         count: 10,  size: 1434,    avgObjSize: 140  },
    { name: 'counters',        count: 4,   size: 140,     avgObjSize: 35   },
    { name: 'broadcasts',      count: 2,   size: 1536,    avgObjSize: 769  },
    { name: 'botassets',       count: 2,   size: 1227018, avgObjSize: 615725 },
    { name: 'ordersessions',   count: 1,   size: 636,     avgObjSize: 636  },
    { name: 'vouchers',        count: 1,   size: 175,     avgObjSize: 175  },
    { name: 'whitelists',      count: 1,   size: 140,     avgObjSize: 140  },
    { name: 'depositsessions', count: 0,   size: 0,       avgObjSize: 0    },
    { name: 'infos',           count: 0,   size: 0,       avgObjSize: 0    },
    { name: 'deposits',        count: 0,   size: 0,       avgObjSize: 0    },
  ],
};

async function renderDatabase() {
  var el = document.getElementById('pageContent');
  el.innerHTML =
    '<h1 class="page-title">Database</h1>' +
    '<p class="page-subtitle" style="margin-bottom:24px;">Monitoring status, storage usage, dan statistik koleksi MongoDB Atlas</p>' +
    '<div id="dbContent">' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">' +
        Array(4).fill('<div class="skeleton" style="height:90px;border-radius:12px;"></div>').join('') +
      '</div>' +
      '<div class="skeleton" style="height:400px;border-radius:16px;"></div>' +
    '</div>';

  // Coba ambil dari API, fallback ke sample data
  var data = null;
  var apiError = null;
  try {
    var res = await api.database.getStats();
    if (res && res.status === 'connected') {
      data = res;
    } else {
      data = res || DB_SAMPLE;
    }
  } catch(e) {
    apiError = e.message;
    data = DB_SAMPLE;
  }

  console.log('[Database] API_BASE:', typeof API_BASE !== 'undefined' ? API_BASE : 'unknown');
  console.log('[Database] Error:', apiError || 'none - realtime data');
  console.log('[Database] TotalDocs:', data.totalDocuments);

  // Render konten dulu — renderDatabaseContent ganti outerHTML dbContent
  renderDatabaseContent(data);

  // BARU tampilkan banner setelah render selesai (agar dbContent sudah fresh)
  if (apiError) {
    var isAuth = apiError.toLowerCase().includes('401') || apiError.toLowerCase().includes('403') ||
                 apiError.toLowerCase().includes('token') || apiError.toLowerCase().includes('aktif') ||
                 apiError.toLowerCase().includes('tidak ditemukan');
    var banner = '<div style="margin-bottom:16px;padding:12px 16px;border-radius:10px;' +
      'background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);' +
      'display:flex;align-items:center;gap:10px;">' +
      '<i class="fa-solid fa-circle-exclamation" style="color:#f87171;flex-shrink:0;"></i>' +
      '<div style="flex:1;">' +
        '<div style="font-size:13px;font-weight:700;color:#f87171;margin-bottom:4px;">' +
          (isAuth ? '⚠️ Sesi Login Tidak Valid — Token Tidak Ditemukan' : '⚠️ Backend Tidak Terjangkau — Data Sample Ditampilkan') +
        '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);margin-bottom:' + (isAuth ? '8' : '0') + 'px;">' + apiError + '</div>' +
        (isAuth ? '<div style="font-size:11px;color:var(--text-muted);">Silakan login ulang agar data MongoDB realtime bisa dimuat.</div>' : '') +
      '</div>' +
      (isAuth
        ? '<a href="/admin/login" onclick="localStorage.clear();sessionStorage.clear();" ' +
          'style="padding:8px 16px;background:#f87171;color:#fff;border-radius:8px;' +
          'font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;flex-shrink:0;">Login Ulang</a>'
        : '') +
    '</div>';
    var dbEl = document.getElementById('dbContent');
    if (dbEl) dbEl.insertAdjacentHTML('afterbegin', banner);
  }
}

function renderDatabaseContent(data) {
  function fmtSize(bytes) {
    if (!bytes || bytes === 0) return '-';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    if (bytes >= 1024)    return (bytes / 1024).toFixed(2) + ' KB';
    return bytes + ' Bytes';
  }

  var connected   = data.status === 'connected' || data.connected === true || data.ok === 1;
  var storageSize = data.storageSize || data.storage_size || data.dataSize || 0;
  var totalDocs   = data.totalDocuments || data.total_documents || data.objects || 0;
  var mongoVer    = data.version || data.mongoVersion || 'Atlas Cloud';
  var collections = data.collections || data.collectionDetails || [];

  var statCards = [
    {
      label: 'Status',
      value: connected
        ? '<span style="color:#4ade80;font-size:20px;font-weight:700;">Connected</span>'
        : '<span style="color:#f87171;font-size:20px;font-weight:700;">Disconnected</span>',
      icon: 'fa-circle-dot',
      color: connected ? '#4ade80' : '#f87171',
      bg:    connected ? 'rgba(74,222,128,.12)' : 'rgba(248,113,113,.12)',
    },
    {
      label: 'Storage Size',
      value: '<span style="font-size:20px;font-weight:700;">' + fmtSize(storageSize) + '</span>',
      icon: 'fa-database',
      color: '#818cf8',
      bg:    'rgba(129,140,248,.12)',
    },
    {
      label: 'Total Documents',
      value: '<span style="font-size:20px;font-weight:700;">' + totalDocs.toLocaleString('id-ID') + '</span>',
      icon: 'fa-file-lines',
      color: '#34d399',
      bg:    'rgba(52,211,153,.12)',
    },
    {
      label: 'MongoDB Ver',
      value: '<span style="font-size:20px;font-weight:700;">' + mongoVer + '</span>',
      icon: 'fa-leaf',
      color: '#fb923c',
      bg:    'rgba(251,146,60,.12)',
    },
  ];

  var statsHTML =
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">' +
      statCards.map(function(c) {
        return '<div class="card" style="padding:20px 22px;display:flex;align-items:center;gap:16px;">' +
          '<div style="width:46px;height:46px;border-radius:12px;background:' + c.bg + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
            '<i class="fa-solid ' + c.icon + '" style="color:' + c.color + ';font-size:18px;"></i>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:5px;">' + c.label + '</div>' +
            c.value +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';

  var collHTML =
    '<div class="card" style="padding:24px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<i class="fa-solid fa-folder-open" style="color:#fb923c;font-size:18px;"></i>' +
          '<div>' +
            '<div style="font-size:17px;font-weight:700;color:var(--text);">Collections Detail</div>' +
            '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">' + collections.length + ' koleksi ditemukan</div>' +
          '</div>' +
        '</div>' +
        '<button onclick="renderDatabase()" style="display:inline-flex;align-items:center;gap:7px;padding:8px 14px;background:transparent;border:1px solid var(--border);border-radius:9px;color:var(--text-muted);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;" ' +
          'onmouseover="this.style.background=\'rgba(255,255,255,.05)\'" onmouseout="this.style.background=\'transparent\'">' +
          '<i class="fa-solid fa-rotate-right" style="font-size:11px;"></i> Refresh' +
        '</button>' +
      '</div>' +
      '<div style="overflow-x:auto;">' +
        '<table style="width:100%;border-collapse:collapse;min-width:560px;">' +
          '<thead>' +
            '<tr style="border-bottom:1px solid var(--border);">' +
              ['Collection Name','Documents','Data Size','Avg Obj Size'].map(function(h) {
                return '<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);">' + h + '</th>';
              }).join('') +
            '</tr>' +
          '</thead>' +
          '<tbody>' +
            collections.map(function(c) {
              var docCount = c.count !== undefined ? c.count : (c.documents || 0);
              var sz       = c.size || c.dataSize || 0;
              var avgSz    = c.avgObjSize || 0;
              return '<tr style="border-bottom:1px solid var(--border);transition:background .15s;" ' +
                'onmouseover="this.style.background=\'rgba(255,255,255,.03)\'" onmouseout="this.style.background=\'\'">' +
                '<td style="padding:12px 14px;">' +
                  '<div style="display:flex;align-items:center;gap:8px;">' +
                    '<i class="fa-solid fa-table" style="color:var(--text-muted);font-size:11px;flex-shrink:0;"></i>' +
                    '<span style="font-size:13px;font-weight:600;color:var(--text);">' + (c.name || '-') + '</span>' +
                  '</div>' +
                '</td>' +
                '<td style="padding:12px 14px;">' +
                  (docCount > 0
                    ? '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:36px;padding:2px 10px;background:var(--accent);color:#fff;font-size:12px;font-weight:700;border-radius:99px;">' + docCount + '</span>'
                    : '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:36px;padding:2px 10px;background:rgba(255,255,255,.06);color:var(--text-muted);font-size:12px;font-weight:700;border-radius:99px;">0</span>'
                  ) +
                '</td>' +
                '<td style="padding:12px 14px;font-size:13px;color:var(--text-muted);">' + (sz > 0 ? fmtSize(sz) : '-') + '</td>' +
                '<td style="padding:12px 14px;font-size:13px;color:var(--text-muted);">' + (avgSz > 0 ? fmtSize(avgSz) : '-') + '</td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';

  document.getElementById('dbContent').outerHTML =
    '<div id="dbContent">' + statsHTML + collHTML + '</div>';
}
