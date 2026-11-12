/* ============================================================
   ACCOUNT DATA.JS — Dummy data untuk Customer Portal
   ============================================================ */

// ── User aktif (diisi oleh app.js setelah auth) ──────────────
var _acctUser = {
  id:       'USR-001',
  name:     'Customer Demo',
  email:    'customer@example.com',
  phone:    '081234567890',
  balance:  0,
  avatar:   null,
  telegram: null,
  emailVerified: true,
  phoneVerified: false,
};

// ── Stats dashboard ───────────────────────────────────────────
var _acctStats = {
  balance:        0,
  totalOrders:    0,
  pendingPayment: 0,
  wishlistCount:  0,
};

// ── Pesanan dummy ─────────────────────────────────────────────
var _acctOrders = [
  /*
  {
    invoice:       'INV-20260724-A1B2C',
    product:       'Netflix Premium 1 Bulan',
    variant:       'UHD 4K',
    total:         55000,
    paymentMethod: 'QRIS',
    status:        'completed',
    date:          '2026-07-24 01:30',
    referenceId:   'REF-XYZ123',
  },
  */
];

// ── Order saat ini (untuk halaman detail) ─────────────────────
var _currentOrder = null;

// ── Riwayat saldo ─────────────────────────────────────────────
var _acctBalanceHistory = [];

// ── Riwayat top up ────────────────────────────────────────────
var _acctTopupHistory = [];

// ── Wishlist ──────────────────────────────────────────────────
var _acctWishlist = [];

// ── Sesi login dummy ─────────────────────────────────────────
var _acctSessions = [
  {
    id:        'SES-001',
    device:    'Desktop',
    browser:   'Chrome 126',
    os:        'Windows 11',
    ip:        '180.xxx.xxx.xxx',
    lastActive:'Baru saja',
    isCurrent: true,
  },
];

// ── Log aktivitas keamanan ────────────────────────────────────
var _acctSecurityLogs = [
  { type:'login', label:'Login berhasil', time:'2026-07-24 01:30', device:'Chrome / Windows', ip:'180.xxx.xxx.xxx' },
];

// ── Helper ────────────────────────────────────────────────────
function acctFmtRp(amount) {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
}

function acctFmtDate(dateStr) {
  if (!dateStr) return '-';
  var d = new Date(dateStr);
  var DAYS  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  var MONTHS= ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
}

function acctFmtDateTime(dateStr) {
  if (!dateStr) return '-';
  var d   = new Date(dateStr);
  var date= d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear();
  var h   = String(d.getHours()).padStart(2,'0');
  var m   = String(d.getMinutes()).padStart(2,'0');
  return date + ' ' + h + ':' + m;
}

function acctFmtThousands(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

var _ORDER_STATUS = {
  pending_payment:  { label:'Menunggu Pembayaran', color:'#f59e0b', bg:'rgba(245,158,11,.12)' },
  pending_confirm:  { label:'Menunggu Konfirmasi', color:'#fb923c', bg:'rgba(251,146,60,.12)' },
  processing:       { label:'Diproses',            color:'#3b82f6', bg:'rgba(59,130,246,.12)' },
  completed:        { label:'Selesai',             color:'#22c55e', bg:'rgba(34,197,94,.12)'  },
  failed:           { label:'Gagal',               color:'#ef4444', bg:'rgba(239,68,68,.12)'  },
  cancelled:        { label:'Dibatalkan',          color:'#6b7280', bg:'rgba(107,114,128,.12)'},
  refund:           { label:'Refund',              color:'#8b5cf6', bg:'rgba(139,92,246,.12)' },
};

function acctStatusBadge(status) {
  var s = _ORDER_STATUS[status] || { label: status, color:'#6b7280', bg:'rgba(107,114,128,.12)' };
  return '<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;background:' + s.bg + ';color:' + s.color + ';border:1px solid ' + s.color + '44;">' +
    '<span style="width:5px;height:5px;border-radius:50%;background:currentColor;display:inline-block;"></span>' + s.label +
  '</span>';
}

var _TOPUP_STATUS = {
  pending: { label:'Pending',    color:'#f59e0b', bg:'rgba(245,158,11,.12)' },
  paid:    { label:'Dibayar',    color:'#3b82f6', bg:'rgba(59,130,246,.12)' },
  success: { label:'Berhasil',   color:'#22c55e', bg:'rgba(34,197,94,.12)'  },
  failed:  { label:'Gagal',      color:'#ef4444', bg:'rgba(239,68,68,.12)'  },
  expired: { label:'Kedaluarsa', color:'#6b7280', bg:'rgba(107,114,128,.12)'},
  cancelled:{ label:'Dibatalkan',color:'#8b5cf6', bg:'rgba(139,92,246,.12)' },
};

function acctTopupStatusBadge(status) {
  var s = _TOPUP_STATUS[status] || { label: status, color:'#6b7280', bg:'rgba(107,114,128,.12)' };
  return '<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;background:' + s.bg + ';color:' + s.color + ';border:1px solid ' + s.color + '44;">' +
    '<span style="width:5px;height:5px;border-radius:50%;background:currentColor;display:inline-block;"></span>' + s.label +
  '</span>';
}
