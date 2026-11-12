// admin/js/pages/voucher.js — v20260728c

/* ── Data ─────────────────────────────────────────────────────── */
var _voucherList = [];

var _voucherUsageData = {};

var _voucherEditId = null;

/* ── Helpers ──────────────────────────────────────────────────── */
function _vFmtRp(n){ return 'Rp'+(n||0).toLocaleString('id-ID'); }
function _vFmtDate(s){
  if(!s) return '-';
  try{
    var d=new Date(s);
    return isNaN(d)?s:d.toLocaleDateString('id-ID',{day:'2-digit',month:'2-digit',year:'numeric'});
  }catch(e){return s;}
}
function _vEsc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

/* ══════════════════════════════════════════════════════════════
   LIST PAGE
   ══════════════════════════════════════════════════════════════ */
function renderVouchers(){
  var pc=document.getElementById('pageContent');
  if(!pc) return;

  var html =
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;flex-wrap:wrap;gap:12px;">' +
      '<div>' +
        '<div style="font-size:24px;font-weight:900;color:var(--text);">Voucher &amp; Promo</div>' +
        '<div style="font-size:13px;color:var(--text-muted);margin-top:2px;">Kelola kode diskon untuk pelanggan</div>' +
      '</div>' +
      '<button onclick="voucherOpenForm(null)" style="display:inline-flex;align-items:center;gap:8px;padding:10px 18px;background:var(--accent);color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">' +
        '<i class="fa-solid fa-plus"></i> + Tambah Voucher' +
      '</button>' +
    '</div>' +

    // Stat cards
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;">' +
      _vStatCard('vStatTotal','fa-ticket','rgba(168,85,247,.1)','#a855f7','Total Voucher','0') +
      _vStatCard('vStatActive','fa-circle-check','rgba(34,197,94,.1)','#22c55e','Aktif','0') +
      _vStatCard('vStatInactive','fa-circle-xmark','rgba(239,68,68,.1)','#ef4444','Nonaktif','0') +
      _vStatCard('vStatUsage','fa-chart-bar','rgba(59,130,246,.1)','#3b82f6','Total Pemakaian','0') +
    '</div>' +

    // Filter row
    '<div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">' +
      '<input type="text" id="voucherSearch" placeholder="Cari kode atau nama..." oninput="voucherFilter()" style="flex:1;min-width:180px;padding:9px 12px;background:var(--card-bg);border:1px solid var(--border);color:var(--text);border-radius:8px;font-size:13px;font-family:inherit;">' +
      '<select id="voucherTypeFilter" onchange="voucherFilter()" style="padding:9px 12px;background:var(--card-bg);border:1px solid var(--border);color:var(--text);border-radius:8px;font-size:13px;font-family:inherit;">' +
        '<option value="">Semua Tipe</option><option value="percent">Persentase</option><option value="nominal">Nominal</option>' +
      '</select>' +
      '<select id="voucherStatusFilter" onchange="voucherFilter()" style="padding:9px 12px;background:var(--card-bg);border:1px solid var(--border);color:var(--text);border-radius:8px;font-size:13px;font-family:inherit;">' +
        '<option value="">Semua Status</option><option value="active">Aktif</option><option value="inactive">Nonaktif</option>' +
      '</select>' +
      '<button onclick="voucherReset()" style="padding:9px 16px;background:transparent;border:1px solid var(--border);color:var(--text-muted);border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit;">Reset</button>' +
    '</div>' +

    // Table
    '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:14px;overflow:hidden;">' +
      '<div style="overflow-x:auto;">' +
        '<table style="width:100%;border-collapse:collapse;min-width:900px;">' +
          '<thead>' +
            '<tr style="border-bottom:1px solid var(--border);">' +
              '<th style="padding:12px 16px;width:40px;"><input type="checkbox"></th>' +
              '<th style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);text-align:left;">KODE</th>' +
              '<th style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);text-align:left;">NAMA</th>' +
              '<th style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);text-align:left;">TIPE/NILAI</th>' +
              '<th style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);text-align:left;">PERIODE</th>' +
              '<th style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);text-align:left;">KUOTA</th>' +
              '<th style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);text-align:center;">FEATURED</th>' +
              '<th style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);text-align:center;">STATUS</th>' +
              '<th style="padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);text-align:right;">AKSI</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody id="voucherTableBody"></tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +

    // Usage modal
    '<div id="usageModalOverlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;align-items:center;justify-content:center;padding:20px;">' +
      '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:16px;width:100%;max-width:600px;max-height:80vh;display:flex;flex-direction:column;padding:24px;position:relative;">' +
        '<div style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:16px;" id="usageModalTitle">Riwayat Pemakaian</div>' +
        '<button onclick="document.getElementById(\'usageModalOverlay\').style.display=\'none\'" style="position:absolute;top:20px;right:20px;background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px;"><i class="fa-solid fa-xmark"></i></button>' +
        '<div style="flex:1;overflow-y:auto;border:1px solid var(--border);border-radius:8px;">' +
          '<table style="width:100%;border-collapse:collapse;">' +
            '<thead style="position:sticky;top:0;background:var(--card-bg);">' +
              '<tr style="border-bottom:1px solid var(--border);">' +
                '<th style="padding:10px 12px;font-size:11px;color:var(--text-muted);text-align:left;">NO</th>' +
                '<th style="padding:10px 12px;font-size:11px;color:var(--text-muted);text-align:left;">USER</th>' +
                '<th style="padding:10px 12px;font-size:11px;color:var(--text-muted);text-align:left;">ORDER</th>' +
                '<th style="padding:10px 12px;font-size:11px;color:var(--text-muted);text-align:left;">DISKON</th>' +
                '<th style="padding:10px 12px;font-size:11px;color:var(--text-muted);text-align:left;">TANGGAL</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody id="usageTableBody"></tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>';

  pc.innerHTML = html;

  // Load from MongoDB, then re-render table
  if (typeof api !== 'undefined' && api.vouchers) {
    api.vouchers.getAll().then(function(r) {
      if (r && r.success && Array.isArray(r.data)) {
        _voucherList = r.data.map(function(v) {
          return {
            id: v._id, _id: v._id,
            code: v.code, name: v.name,
            description: v.description || '',
            type: v.type || 'percent', value: v.value || 0,
            minPurchase: v.minPurchase || 0, maxPurchase: v.maxPurchase || null,
            maxDiscount: v.maxDiscount || null, startDate: v.startDate || '',
            endDate: v.endDate || '', quota: v.quota != null ? v.quota : -1,
            quotaUsed: v.usageCount || 0, quotaPerUser: v.quotaPerUser || 1,
            scope: v.scope || 'all', requireLogin: v.requireLogin || false,
            showPromo: v.showPromo !== false, isFeatured: v.isFeatured || false,
            isActive: v.isActive !== false, usageCount: v.usageCount || 0,
          };
        });
      }
      _vLoadStats();
      voucherFilter();
    }).catch(function() { _vLoadStats(); voucherFilter(); });
  } else {
    _vLoadStats();
    voucherFilter();
  }
}

function _vStatCard(id,icon,bg,color,label,val){
  return '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:14px;padding:18px;display:flex;align-items:center;gap:14px;">' +
    '<div style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:'+bg+';color:'+color+';font-size:18px;flex-shrink:0;"><i class="fa-solid '+icon+'"></i></div>' +
    '<div><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);">'+label+'</div><div id="'+id+'" style="font-size:22px;font-weight:900;color:var(--text);">'+val+'</div></div>' +
  '</div>';
}

function _vLoadStats(){
  var total=_voucherList.length;
  var active=_voucherList.filter(function(v){return v.isActive;}).length;
  var usage=_voucherList.reduce(function(s,v){return s+(v.usageCount||0);},0);
  var e;
  e=document.getElementById('vStatTotal');   if(e) e.textContent=total;
  e=document.getElementById('vStatActive');  if(e) e.textContent=active;
  e=document.getElementById('vStatInactive');if(e) e.textContent=total-active;
  e=document.getElementById('vStatUsage');   if(e) e.textContent=usage;
}

function _vRenderTable(list){
  var tb=document.getElementById('voucherTableBody');
  if(!tb) return;
  if(!list.length){
    tb.innerHTML='<tr><td colspan="9" style="padding:40px;text-align:center;color:var(--text-muted);"><i class="fa-solid fa-ticket" style="font-size:28px;display:block;margin-bottom:12px;opacity:.4;"></i>Belum ada voucher</td></tr>';
    return;
  }
  var html='';
  list.forEach(function(v){
    var typeBadge = v.type==='percent'
      ? '<span style="color:#22c55e;font-size:11px;font-weight:700;">% Diskon</span><br><span style="color:var(--text);font-weight:800;">'+v.value+'%</span>'
      : '<span style="color:#3b82f6;font-size:11px;font-weight:700;">Nominal</span><br><span style="color:var(--text);font-weight:800;">'+_vFmtRp(v.value)+'</span>';
    var used=v.quotaUsed||0;
    var qText=v.quota===-1 ? used+' / ∞' : used+' / '+v.quota;
    var qPct=v.quota===-1 ? 0 : Math.min(100,Math.round(used/v.quota*100));
    var starC=v.isFeatured?'#facc15':'var(--text-muted)';
    var togBg=v.isActive?'var(--accent)':'rgba(255,255,255,.15)';
    var togX=v.isActive?'16px':'2px';
    html+=
      '<tr style="border-bottom:1px solid rgba(255,255,255,.04);">' +
        '<td style="padding:12px 16px;"><input type="checkbox"></td>' +
        '<td style="padding:12px 16px;"><span style="background:rgba(59,130,246,.1);color:#60a5fa;padding:3px 8px;border-radius:6px;font-family:monospace;font-weight:800;font-size:12px;">'+_vEsc(v.code)+'</span></td>' +
        '<td style="padding:12px 16px;"><div style="font-weight:600;color:var(--text);">'+_vEsc(v.name)+'</div>'+(v.description?'<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">'+_vEsc(v.description)+'</div>':'')+'</td>' +
        '<td style="padding:12px 16px;">'+typeBadge+'</td>' +
        '<td style="padding:12px 16px;font-size:12px;color:var(--text-secondary);">'+_vFmtDate(v.startDate)+'<br>'+_vFmtDate(v.endDate)+'</td>' +
        '<td style="padding:12px 16px;min-width:110px;"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-secondary);margin-bottom:4px;"><span>Terpakai</span><span>'+qText+'</span></div>'+(v.quota!==-1?'<div style="height:4px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden;"><div style="width:'+qPct+'%;height:100%;background:var(--accent);border-radius:2px;"></div></div>':'')+'</td>' +
        '<td style="padding:12px 16px;text-align:center;"><button onclick="_vToggleFeatured(\''+v.id+'\')" style="background:none;border:none;color:'+starC+';cursor:pointer;font-size:18px;padding:4px;"><i class="fa-solid fa-star"></i></button></td>' +
        '<td style="padding:12px 16px;text-align:center;"><label style="position:relative;display:inline-block;width:34px;height:20px;cursor:pointer;"><input type="checkbox" '+(v.isActive?'checked':'')+' style="opacity:0;width:0;height:0;" onchange="_vToggleStatus(\''+v.id+'\')"><span style="position:absolute;inset:0;background:'+togBg+';border-radius:34px;transition:.3s;"><span style="position:absolute;width:16px;height:16px;background:#fff;border-radius:50%;bottom:2px;left:'+togX+';transition:.3s;"></span></span></label></td>' +
        '<td style="padding:12px 16px;text-align:right;"><div style="display:flex;gap:4px;justify-content:flex-end;">' +
          '<button onclick="voucherOpenForm(\''+v.id+'\')" title="Edit" style="width:30px;height:30px;background:rgba(255,255,255,.05);border:1px solid var(--border);color:var(--text);border-radius:6px;cursor:pointer;font-size:12px;"><i class="fa-solid fa-pen"></i></button>' +
          '<button onclick="voucherOpenUsage(\''+v.id+'\',\''+v.code+'\')" title="Riwayat" style="width:30px;height:30px;background:rgba(59,130,246,.07);border:1px solid rgba(59,130,246,.2);color:#60a5fa;border-radius:6px;cursor:pointer;font-size:12px;"><i class="fa-solid fa-clock-rotate-left"></i></button>' +
          '<button onclick="_vDelete(\''+v.id+'\')" title="Hapus" style="width:30px;height:30px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#ef4444;border-radius:6px;cursor:pointer;font-size:12px;"><i class="fa-solid fa-trash"></i></button>' +
        '</div></td>' +
      '</tr>';
  });
  tb.innerHTML=html;
}

function voucherFilter(){
  var s=(document.getElementById('voucherSearch')||{}).value||'';
  s=s.toLowerCase();
  var t=(document.getElementById('voucherTypeFilter')||{}).value||'';
  var st=(document.getElementById('voucherStatusFilter')||{}).value||'';
  var list=_voucherList.filter(function(v){
    var ms=!s||(v.code.toLowerCase().includes(s)||v.name.toLowerCase().includes(s));
    var mt=!t||v.type===t;
    var mst=!st||(st==='active'?v.isActive:!v.isActive);
    return ms&&mt&&mst;
  });
  _vRenderTable(list);
}

function voucherReset(){
  var f=['voucherSearch','voucherTypeFilter','voucherStatusFilter'];
  f.forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});
  voucherFilter();
}

/* ══════════════════════════════════════════════════════════════
   FORM PAGE (halaman penuh, bukan modal)
   ══════════════════════════════════════════════════════════════ */
function voucherOpenForm(id){
  _voucherEditId=id||null;
  navigate('voucher-form');
}

function renderVoucherForm(){
  var pc=document.getElementById('pageContent');
  if(!pc) return;

  var v=null;
  if(_voucherEditId) v=_voucherList.find(function(x){return x.id===_voucherEditId;})||null;

  var isEdit=!!v;
  var def=v||{code:'',name:'',description:'',type:'percent',value:'',minPurchase:'',maxPurchase:'',maxDiscount:'',startDate:'',endDate:'',quota:'',quotaPerUser:'',scope:'all',requireLogin:false,showPromo:true,isFeatured:false,isActive:true};

  function fld(id,val,ph,type,extra){
    type=type||'text'; val=val||'';
    return '<input id="'+id+'" type="'+type+'" value="'+_vEsc(val)+'" placeholder="'+_vEsc(ph||'')+'" '+(extra||'')+
      ' style="width:100%;padding:11px 14px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;">';
  }
  function lbl(text,req){
    return '<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:6px;">'+text+(req?'<span style="color:#ef4444;margin-left:3px;">*</span>':'')+'</div>';
  }
  function row2(a,b){ return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">'+a+b+'</div>'; }
  function row1(a){ return '<div style="margin-bottom:16px;">'+a+'</div>'; }

  // Radio card helper
  function radioCard(name,val,checked,title,sub){
    var id='rc_'+name+'_'+val;
    return '<label for="'+id+'" style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:12px;border:2px solid '+(checked?'var(--accent)':'var(--border)')+';cursor:pointer;background:'+(checked?'rgba(59,130,246,.06)':'rgba(255,255,255,.02)')+';transition:all .2s;">' +
      '<input type="radio" id="'+id+'" name="'+name+'" value="'+val+'" '+(checked?'checked':'')+' onchange="_vFormTypeChange()" style="margin-top:2px;accent-color:var(--accent);">' +
      '<div><div style="font-size:13px;font-weight:700;color:var(--text);">'+title+'</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px;">'+sub+'</div></div>' +
    '</label>';
  }

  // Scope card helper
  function scopeCard(val,checked,title,sub){
    var id='sc_'+val;
    return '<label for="'+id+'" style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:12px;border:2px solid '+(checked?'var(--accent)':'var(--border)')+';cursor:pointer;background:'+(checked?'rgba(59,130,246,.06)':'rgba(255,255,255,.02)')+';transition:all .2s;">' +
      '<input type="radio" id="'+id+'" name="vFormScope" value="'+val+'" '+(checked?'checked':'')+' style="margin-top:2px;accent-color:var(--accent);">' +
      '<div><div style="font-size:13px;font-weight:700;color:var(--text);">'+title+'</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px;">'+sub+'</div></div>' +
    '</label>';
  }

  // Toggle switch helper
  function toggleRow(id,checked,title,sub){
    return '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,.02);">' +
      '<div><div style="font-size:13px;font-weight:700;color:var(--text);">'+title+'</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px;line-height:1.5;">'+sub+'</div></div>' +
      '<label style="position:relative;display:inline-flex;flex-shrink:0;width:42px;height:24px;cursor:pointer;margin-top:2px;">' +
        '<input type="checkbox" id="'+id+'" '+(checked?'checked':'')+' style="opacity:0;width:0;height:0;" onchange="_vSyncToggleUI(\''+id+'\')">' +
        '<span id="'+id+'_track" style="position:absolute;inset:0;border-radius:24px;background:'+(checked?'var(--accent)':'rgba(255,255,255,.15)')+';transition:.3s;">' +
          '<span id="'+id+'_thumb" style="position:absolute;width:18px;height:18px;background:#fff;border-radius:50%;top:3px;left:'+(checked?'21px':'3px')+';transition:.3s;"></span>' +
        '</span>' +
      '</label>' +
    '</div>';
  }

  var formHtml =
    // Back header
    '<div style="display:flex;align-items:center;gap:16px;margin-bottom:8px;">' +
      '<button onclick="navigate(\'vouchers\')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:20px;padding:4px;"><i class="fa-solid fa-arrow-left"></i></button>' +
      '<div>' +
        '<div style="font-size:28px;font-weight:900;color:var(--text);">'+(isEdit?'Edit Voucher':'Buat Voucher')+'</div>' +
        '<div style="font-size:13px;color:var(--text-muted);margin-top:2px;">'+(isEdit?'Ubah pengaturan voucher yang sudah ada':'Atur kode, diskon, dan cakupan voucher baru')+'</div>' +
      '</div>' +
    '</div>' +

    '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:16px;padding:28px;margin-top:24px;">' +

      // Kode + Nama
      row2(
        '<div>'+lbl('Kode Voucher',1)+'<input id="vFormCode" type="text" value="'+_vEsc(def.code)+'" placeholder="CONTOH: HEMAT10" style="width:100%;padding:11px 14px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;text-transform:uppercase;letter-spacing:1px;font-weight:700;box-sizing:border-box;outline:none;"></div>',
        '<div>'+lbl('Nama Voucher',1)+fld('vFormName',def.name,'Contoh: Promo Gajian 10%')+'</div>'
      ) +

      // Deskripsi
      row1(
        '<div>'+lbl('Deskripsi / Syarat & Ketentuan','')+'<textarea id="vFormDesc" rows="3" placeholder="Syarat &amp; ketentuan voucher, ditampilkan di halaman promo" style="width:100%;padding:11px 14px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;resize:vertical;box-sizing:border-box;outline:none;">'+_vEsc(def.description)+'</textarea></div>'
      ) +

      // Tipe Diskon
      '<div style="margin-bottom:16px;">'+lbl('Tipe Diskon',1)+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;" id="vTypeCards">' +
          radioCard('vFormType','percent',def.type==='percent','Persen (%)','Potongan persentase dari harga') +
          radioCard('vFormType','nominal',def.type==='nominal','Nominal (Rp)','Potongan nominal tetap') +
        '</div>' +
      '</div>' +

      // Besar + Maks Potongan
      row2(
        '<div>'+lbl('Besar Diskon (%)',1)+'<input id="vFormValue" type="number" value="'+_vEsc(def.value)+'" placeholder="Contoh: 10" min="1" style="width:100%;padding:11px 14px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;box-sizing:border-box;outline:none;"></div>',
        '<div id="vFormMaxGroup">'+lbl('Maksimal Potongan (Rp)')+'<input id="vFormMax" type="number" value="'+_vEsc(def.maxDiscount||'')+'" placeholder="Contoh: 10000 (kosongkan = tanpa batas)" min="0" style="width:100%;padding:11px 14px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;box-sizing:border-box;outline:none;"></div>'
      ) +

      // Min + Maks Pembelian
      row2(
        '<div>'+lbl('Minimal Pembelian (Rp)','')+'<input id="vFormMin" type="number" value="'+_vEsc(def.minPurchase||'')+'" placeholder="Kosongkan = tanpa minimal" min="0" style="width:100%;padding:11px 14px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;box-sizing:border-box;outline:none;"></div>',
        '<div>'+lbl('Maksimal Pembelian (Rp)','')+'<input id="vFormMaxBuy" type="number" value="'+_vEsc(def.maxPurchase||'')+'" placeholder="Kosongkan = tanpa maksimal" min="0" style="width:100%;padding:11px 14px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;box-sizing:border-box;outline:none;"></div>'
      ) +

      // Mulai + Akhir Promo
      row2(
        '<div>'+lbl('Mulai Promo',1)+'<input id="vFormStart" type="datetime-local" value="'+_vEsc(def.startDate)+'" style="width:100%;padding:11px 14px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;box-sizing:border-box;outline:none;color-scheme:dark;"></div>',
        '<div>'+lbl('Akhir Promo',1)+'<input id="vFormEnd" type="datetime-local" value="'+_vEsc(def.endDate)+'" style="width:100%;padding:11px 14px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;box-sizing:border-box;outline:none;color-scheme:dark;"></div>'
      ) +

      // Kuota Total + Batas per Pengguna
      row2(
        '<div>'+lbl('Kuota Total Penggunaan','')+'<input id="vFormQuota" type="number" value="'+_vEsc(def.quota===-1?'':def.quota)+'" placeholder="Kosongkan = tanpa batas" min="1" style="width:100%;padding:11px 14px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;box-sizing:border-box;outline:none;"></div>',
        '<div>'+lbl('Batas per Pengguna','')+'<input id="vFormQuotaUser" type="number" value="'+_vEsc(def.quotaPerUser||'')+'" placeholder="Kosongkan = tanpa batas" min="1" style="width:100%;padding:11px 14px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:13px;font-family:inherit;box-sizing:border-box;outline:none;"><div style="font-size:11px;color:var(--text-muted);margin-top:5px;">Customer login dihitung per akun; guest dihitung per email</div></div>'
      ) +

      // Cakupan
      '<div style="margin-bottom:16px;">'+lbl('Cakupan Voucher',1)+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
          scopeCard('all',def.scope==='all','Semua Produk','Berlaku untuk seluruh produk') +
          scopeCard('specific',def.scope==='specific','Produk Tertentu','Pilih produk / varian spesifik') +
        '</div>' +
      '</div>' +

      // Toggles
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
        toggleRow('vFormReqLogin',def.requireLogin,'Wajib Login','Hanya customer yang login bisa memakai') +
        toggleRow('vFormShowPromo',def.showPromo,'Tampilkan di Halaman Promo','Muncul di halaman /promo webstore') +
        toggleRow('vFormFeatured',def.isFeatured,'Voucher Unggulan','Tampil sebagai "Promo Utama" paling atas di /promo, jika lebih dari satu, yang paling cepat berakhir yang dipakai') +
        toggleRow('vFormActive',def.isActive,'Aktifkan Voucher','Voucher hanya berlaku saat aktif &amp; dalam periode') +
      '</div>' +

      // Catatan info box
      '<div style="background:rgba(59,130,246,.07);border:1px solid rgba(59,130,246,.2);border-radius:12px;padding:16px;margin-bottom:24px;">' +
        '<div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#60a5fa;margin-bottom:10px;"><i class="fa-solid fa-circle-info"></i> Catatan:</div>' +
        '<ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--text-secondary);line-height:1.6;">' +
          '<li>Voucher tidak berlaku untuk produk tagihan (postpaid)</li>' +
          '<li>Untuk produk open denom, diskon dihitung dari total harga jual — gunakan "Maksimal Potongan" untuk tipe persen</li>' +
          '<li>Kuota dikembalikan otomatis bila pesanan kedaluwarsa (tidak dibayar)</li>' +
        '</ul>' +
      '</div>' +

      // Footer buttons
      '<div style="display:flex;justify-content:flex-end;gap:12px;padding-top:4px;">' +
        '<button onclick="navigate(\'vouchers\')" style="padding:11px 22px;background:transparent;border:1px solid var(--border);color:var(--text-muted);border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">Batal</button>' +
        '<button onclick="_vSave()" style="padding:11px 24px;background:var(--accent);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">'+(isEdit?'Simpan Perubahan':'Buat Voucher')+'</button>' +
      '</div>' +

    '</div>';

  pc.innerHTML = formHtml;

  // Update value label after type is selected
  _vFormTypeChange();
}

function _vFormTypeChange(){
  var type='percent';
  var radios=document.querySelectorAll('input[name="vFormType"]');
  radios.forEach(function(r){
    var card=r.closest('label');
    if(r.checked){
      type=r.value;
      if(card){ card.style.borderColor='var(--accent)'; card.style.background='rgba(59,130,246,.06)'; }
    } else {
      if(card){ card.style.borderColor='var(--border)'; card.style.background='rgba(255,255,255,.02)'; }
    }
  });
  var maxG=document.getElementById('vFormMaxGroup');
  var valL=document.querySelector('label[for="rc_vFormType_percent"]');
  var valLbl=document.getElementById('vFormValue');
  if(maxG) maxG.style.display=type==='percent'?'block':'none';
  // Update label
  var labels=document.querySelectorAll('[id^="vFormValue"]');
  // Update placeholder label above value field
  var valueField=document.getElementById('vFormValue');
  if(valueField){
    if(type==='percent'){valueField.placeholder='Contoh: 10';}
    else{valueField.placeholder='Contoh: 50000';}
  }
}

function _vSyncToggleUI(id){
  var chk=document.getElementById(id);
  var track=document.getElementById(id+'_track');
  var thumb=document.getElementById(id+'_thumb');
  if(!chk||!track||!thumb) return;
  var on=chk.checked;
  track.style.background=on?'var(--accent)':'rgba(255,255,255,.15)';
  thumb.style.left=on?'21px':'3px';
}

/* ── Save ─────────────────────────────────────────────────────── */
function _vSave(){
  var code=(document.getElementById('vFormCode')||{}).value||'';
  var name=(document.getElementById('vFormName')||{}).value||'';
  if(!code.trim()||!name.trim()){
    if(typeof showToast==='function') showToast('error','Kode dan Nama voucher wajib diisi.');
    return;
  }
  var typeEl=document.querySelector('input[name="vFormType"]:checked');
  var type=typeEl?typeEl.value:'percent';
  var value=parseFloat((document.getElementById('vFormValue')||{}).value)||0;
  var min=parseFloat((document.getElementById('vFormMin')||{}).value)||0;
  var maxBuy=parseFloat((document.getElementById('vFormMaxBuy')||{}).value)||null;
  var maxD=type==='percent'?(parseFloat((document.getElementById('vFormMax')||{}).value)||null):null;
  var start=(document.getElementById('vFormStart')||{}).value||'';
  var end=(document.getElementById('vFormEnd')||{}).value||'';
  if(!start||!end){ if(typeof showToast==='function') showToast('error','Tanggal mulai & akhir promo wajib diisi.'); return; }
  var quotaRaw=(document.getElementById('vFormQuota')||{}).value||'';
  var quota=quotaRaw===''?-1:parseInt(quotaRaw)||0;
  var quotaUser=parseInt((document.getElementById('vFormQuotaUser')||{}).value)||1;
  var scopeEl=document.querySelector('input[name="vFormScope"]:checked');
  var scope=scopeEl?scopeEl.value:'all';
  var reqLogin=!!(document.getElementById('vFormReqLogin')||{}).checked;
  var showPromo=!!(document.getElementById('vFormShowPromo')||{}).checked;
  var featured=!!(document.getElementById('vFormFeatured')||{}).checked;
  var active=!!(document.getElementById('vFormActive')||{}).checked;
  var desc=(document.getElementById('vFormDesc')||{}).value||'';

  if(_voucherEditId){
    var v=_voucherList.find(function(x){return x.id===_voucherEditId;});
    if(v){
      v.code=code.toUpperCase(); v.name=name; v.description=desc; v.type=type; v.value=value;
      v.minPurchase=min; v.maxPurchase=maxBuy; v.maxDiscount=maxD;
      v.startDate=start; v.endDate=end; v.quota=quota; v.quotaPerUser=quotaUser;
      v.scope=scope; v.requireLogin=reqLogin; v.showPromo=showPromo; v.isFeatured=featured; v.isActive=active;
      if(typeof store!=='undefined') store.saveVoucher(v, false);
    }
    if(typeof showToast==='function') showToast('success','Voucher berhasil diupdate');
  } else {
    var nv={
      id:'V'+Date.now(), code:code.toUpperCase(), name:name, description:desc,
      type:type, value:value, minPurchase:min, maxPurchase:maxBuy, maxDiscount:maxD,
      startDate:start, endDate:end, quota:quota, quotaUsed:0, quotaPerUser:quotaUser,
      scope:scope, requireLogin:reqLogin, showPromo:showPromo, isFeatured:featured, isActive:active, usageCount:0,
    };
    _voucherList.unshift(nv);
    if(typeof store!=='undefined') store.saveVoucher(nv, true);
    if(typeof showToast==='function') showToast('success','Voucher berhasil ditambahkan');
  }
  navigate('vouchers');
}

/* ── Actions ─────────────────────────────────────────────────── */
function _vDelete(id){
  if(!confirm('Yakin ingin menghapus voucher ini?')) return;
  var target=_voucherList.find(function(v){return v.id===id;});
  _voucherList=_voucherList.filter(function(v){return v.id!==id;});
  _vLoadStats(); voucherFilter();
  if(typeof showToast==='function') showToast('success','Voucher dihapus');
  if(typeof store!=='undefined'&&target) store.deleteVoucher(target._id||target.id);
}
function _vToggleStatus(id){
  var v=_voucherList.find(function(x){return x.id===id;});
  if(v){ v.isActive=!v.isActive; _vLoadStats(); voucherFilter();
    if(typeof store!=='undefined') store.toggleVoucher(v._id||v.id, v.isActive);
  }
  if(typeof showToast==='function') showToast('success','Status diubah');
}
function _vToggleFeatured(id){
  var v=_voucherList.find(function(x){return x.id===id;});
  if(v){ v.isFeatured=!v.isFeatured; voucherFilter();
    if(typeof store!=='undefined') store.saveVoucher(v, false);
  }
  if(typeof showToast==='function') showToast('success',v&&v.isFeatured?'Disematkan':'Dilepas');
}

/* ── Usage modal ──────────────────────────────────────────────── */
function voucherOpenUsage(id,code){
  var ol=document.getElementById('usageModalOverlay');
  var tl=document.getElementById('usageModalTitle');
  var tb=document.getElementById('usageTableBody');
  if(!ol) return;
  if(tl) tl.textContent='Riwayat Pemakaian — '+code;
  var data=_voucherUsageData[id]||[];
  if(tb){
    if(!data.length){
      tb.innerHTML='<tr><td colspan="5" style="padding:24px;text-align:center;color:var(--text-muted);">Belum ada riwayat pemakaian</td></tr>';
    } else {
      tb.innerHTML=data.map(function(r,i){
        return '<tr style="border-bottom:1px solid rgba(255,255,255,.04);"><td style="padding:10px 12px;color:var(--text);">'+(i+1)+'</td><td style="padding:10px 12px;color:var(--text);">'+_vEsc(r.user)+'</td><td style="padding:10px 12px;color:var(--text);">'+_vEsc(r.orderId)+'</td><td style="padding:10px 12px;color:var(--text);">'+_vFmtRp(r.discount)+'</td><td style="padding:10px 12px;color:var(--text-muted);font-size:12px;">'+_vEsc(r.date)+'</td></tr>';
      }).join('');
    }
  }
  ol.style.display='flex';
}
