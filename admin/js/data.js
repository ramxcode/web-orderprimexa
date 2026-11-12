// ===== HELPER =====
const fmt = (n) => 'Rp ' + n.toLocaleString('id-ID');
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ===== USER PROFILE =====
const CURRENT_USER = {
  name: 'Admin Reseller',
  email: 'admin@namaweb.id',
  initials: 'AD',
  role: 'Reseller',
  joinDate: '2024-01-15',
};

// ===== DASHBOARD STATS =====
const DASHBOARD_STATS = {
  totalRevenue:  { value: 0, prev: 987_200,  label: 'Total Revenue',  icon: 'fa-money-bill-trend-up', color: 'blue' },
  totalProfit:   { value: 0,  prev: 412_000,   label: 'Total Profit',   icon: 'fa-chart-line',          color: 'green' },
  totalOrders:   { value: 0,      prev: 110,        label: 'Total Orders',   icon: 'fa-cart-shopping',       color: 'purple' },
  gatewayBalance:{ value: 0,        prev: 0,          label: 'Saldo Payment Gateway', icon: 'fa-building-columns', color: 'yellow', warning: 'Saldo rendah' },
};

// ===== PERIOD ANALYTICS =====
const PERIOD_ANALYTICS = {
  hariIni: { orders: 0,  profit: 0 },
  kemarin: { orders: 0, profit: 0 },
  tujuhHari: { orders: 0, profit: 0 },
};

// ===== USER & TRANSACTION STATS =====
const USER_STATS = {
  registered:  { value: 0,    label: 'Pengguna Terdaftar',  icon: 'fa-users',      color: 'blue' },
  userBalance: { value: 0, label: 'Saldo Pengguna',  icon: 'fa-coins',      color: 'cyan' },
  pending:     { value: 0,      label: 'Belum Bayar',         icon: 'fa-clock',      color: 'yellow' },
  processing:  { value: 0,      label: 'Diproses',            icon: 'fa-rotate',     color: 'blue' },
  success:     { value: 0,    label: 'Sukses',              icon: 'fa-circle-check', color: 'green' },
  failed:      { value: 0,      label: 'Gagal',               icon: 'fa-circle-xmark', color: 'red' },
};

// ===== CHART DATA — 30 Hari Terakhir =====
const CHART_DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
});
const CHART_ORDERS  = Array(30).fill(0);
const CHART_REVENUE = Array(30).fill(0);

// ===== TOP PRODUCTS =====
const TOP_PRODUCTS = [];

// ===== RECENT TRANSACTIONS =====
const STATUS_MAP = {
  success: { label:'Sukses',      cls:'badge-success', icon:'fa-circle-check' },
  pending: { label:'Belum Bayar', cls:'badge-warning', icon:'fa-clock' },
  process: { label:'Diproses',    cls:'badge-info',    icon:'fa-rotate' },
  failed:  { label:'Gagal',       cls:'badge-error',   icon:'fa-circle-xmark' },
  refunded:{ label:'Refunded',    cls:'badge-purple',  icon:'fa-rotate-left' },
  canceled:{ label:'Dibatalkan',  cls:'badge-gray',    icon:'fa-ban' },
};
const RECENT_TRANSACTIONS = [];

// ===== ORDERS PAGE DATA =====
const ALL_TRANSACTIONS = [];

// ===== PAYMENT METHODS =====
const PAYMENT_METHODS = [
  {
    id:'qris', code:'GOPAYM_QRIS', name:'QRIS GatePay',
    icon:'fa-qrcode', group:'QRIS', provider:'GatePay',
    active:true, fee:'Gratis ≤ Rp 500.000, 0,7% di atasnya',
    min:100, max:10_000_000, desc:'Scan & Pay via PayGomerch',
    needsSetup: true,
  },
  {
    id:'balance', code:'BALANCE', name:'Saldo Akun',
    icon:'fa-coins', group:'Saldo', provider:'Sistem',
    active:true, fee:'Gratis',
    min:0, max:0, desc:'Potong saldo pengguna',
    needsSetup: false,
  },
];

// ===== PAYMENT GATEWAYS =====
const PAYMENT_GATEWAYS = [
  { id:'midtrans', name:'Midtrans',   logo:'fa-m', status:'connected', merchantId:'G123456789', mode:'production', balance:2_550_000, lastSync:'2026-06-25 14:00' },
  { id:'xendit',   name:'Xendit',     logo:'fa-x', status:'connected', merchantId:'X987654321', mode:'sandbox',    balance:0,         lastSync:'2026-06-24 08:30' },
  { id:'tripay',   name:'Tripay',     logo:'fa-t', status:'error',     merchantId:'T456789012', mode:'production', balance:180_000,   lastSync:'2026-06-23 12:15' },
];

// ===== SUPPLIERS =====
const SUPPLIERS = [];

// ===== BOT SETTINGS =====
const BOT_CONFIG = {
  token: '7234567890:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  username: '@NamaWebsiteBot',
  status: 'running',
  webhookUrl: 'https://namaweb.id/api/bot/webhook',
};

// ===== BOT MESSAGES =====
const BOT_MESSAGES = {
  welcome: 'Halo {nama_customer}! 👋\nSelamat datang di {nama_toko}!\n\nAda yang bisa kami bantu?',
  success: '✅ Pembayaran berhasil!\n\nInvoice: {invoice}\nProduk: {produk}\nTotal: {total}\nStatus: {status}\n\nTerima kasih telah berbelanja!',
  failed:  '❌ Pembayaran gagal.\n\nInvoice: {invoice}\nProduk: {produk}\nTotal: {total}\n\nSilakan coba lagi atau hubungi support.',
  pending: '⏳ Menunggu pembayaran.\n\nInvoice: {invoice}\nProduk: {produk}\nTotal: {total}\n\nSelesaikan pembayaran sebelum batas waktu.',
};

// ===== BOT INTEGRATIONS =====
const BOT_INTEGRATIONS = [];

// ===== BOT LOGS =====
const BOT_LOGS = [];

// ===== ANALYTICS DATA =====
const ANALYTICS_PERIODS = {
  today: {
    label: 'Hari Ini',
    profit: 0,
    revenue: 0,
    orders: 0,
    donutProfit:  [60, 25, 15],
    donutRevenue: [55, 30, 15],
    hourly: Array(24).fill(0),
  },
  week: {
    label: '7 Hari',
    profit: 0,
    revenue: 0,
    orders: 0,
    donutProfit:  [50, 30, 20],
    donutRevenue: [45, 35, 20],
    hourly: Array(24).fill(0),
  },
  month: {
    label: 'Bulan Ini',
    profit: 0,
    revenue: 0,
    orders: 0,
    donutProfit:  [48, 32, 20],
    donutRevenue: [42, 38, 20],
    hourly: Array(24).fill(0),
  },
  year: {
    label: 'Tahun Ini',
    profit: 0,
    revenue: 0,
    orders: 0,
    donutProfit:  [46, 34, 20],
    donutRevenue: [40, 38, 22],
    hourly: Array(24).fill(0),
  },
};
const DONUT_LABELS = ['Produk Digital', 'Top Up', 'Voucher Game'];
const INSIGHT_TERLARIS = {
  product:  { name:'-',      sub:'-',    value: 0 },
  category: { name:'-',sub:'-',    value: 0 },
  payment:  { name:'-',            sub:'-',  value: 0 },
  customer: { name:'-', sub:'-',   value: 0 },
};

// ===== TOPUP HISTORY =====
const TOPUP_HISTORY = [];

// ===== API LOGS =====
const API_LOGS = [];

// ===== KELOLA PRODUK GLOBALS (diisi oleh store.js dari MongoDB) =====
// Inisialisasi sebagai array kosong agar render functions tidak throw TypeError
// sebelum store.prefetch() selesai memuat data dari database.
if (typeof PRODUCTS          === 'undefined') var PRODUCTS          = [];
if (typeof CATEGORIES        === 'undefined') var CATEGORIES        = [];
if (typeof PRODUCT_TYPES     === 'undefined') var PRODUCT_TYPES     = [];
if (typeof PRODUCT_VARIANTS  === 'undefined') var PRODUCT_VARIANTS  = [];
if (typeof FEATURED_PRODUCTS === 'undefined') var FEATURED_PRODUCTS = [];
if (typeof FLASH_SALES       === 'undefined') var FLASH_SALES       = [];
if (typeof STOCK_ITEMS       === 'undefined') var STOCK_ITEMS       = [];
if (typeof WIDGETS           === 'undefined') {
    try { var WIDGETS = JSON.parse(localStorage.getItem('ramx_widgets') || '[]'); }
    catch(e) { var WIDGETS = []; }
}
