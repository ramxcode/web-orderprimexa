require('dotenv').config();
const mongoose   = require('mongoose');
const bcrypt     = require('bcryptjs');
const connectDB  = require('./config/db');

const User       = require('./models/User');
const Config     = require('./models/Config');
const StaticPage = require('./models/StaticPage');
const Category   = require('./models/Category');

async function seed() {
  await connectDB();

  const reset = process.argv.includes('--reset');
  if (reset) {
    console.log('🗑  Menghapus semua data...');
    await Promise.all([
      User.deleteMany({}),
      Config.deleteMany({}),
      StaticPage.deleteMany({}),
      Category.deleteMany({}),
    ]);
    console.log('✅ Semua data dihapus');
  }

  // ── Admin user ────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@primexa.com';
  const adminExists = await User.findOne({ email: adminEmail });
  if (!adminExists) {
    await User.create({
      name:         process.env.ADMIN_NAME || 'Administrator',
      email:        adminEmail,
      passwordHash: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role:         'admin',
      isVerified:   true,
    });
    console.log(`✅ Admin dibuat: ${adminEmail}`);
  } else {
    console.log(`ℹ️  Admin sudah ada: ${adminEmail}`);
  }

  // ── Default config ────────────────────────────────────────
  const configs = [
    {
      key: 'store_settings',
      value: {
        storeName:          'Primexa',
        websiteUrl:         'https://primexa.com',
        storeDescription:   'Toko produk digital terpercaya #1',
        contactEmail:       '',
        phoneNumber:        '',
        whatsappNumber:     '',
        address:            '',
        instagramUrl:       '',
        tiktokUrl:          '',
        facebookUrl:        '',
        telegramUrl:        '',
        discordUrl:         '',
        telegramBotToken:   process.env.TELEGRAM_BOT_TOKEN || '',
        telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME || '',
      }
    },
    {
      key: 'hero_settings',
      value: {
        badgeText:   '🚀 Reseller Resmi',
        title:       'Topup Game & Produk Digital Termurah',
        subtitle:    'Proses cepat dan otomatis 24 jam.',
        btn1Text:    'Beli Sekarang',
        btn2Text:    'Daftar Reseller',
      }
    },
    {
      key: 'live_chat',
      value: {
        isActive:       true,
        tooltipMessage: 'Butuh Bantuan?',
        defaultMessage: 'Halo admin, saya ingin bertanya...',
        buttonColor:    '#25D366',
        showOnMobile:   true,
        showOnDesktop:  true,
        delaySeconds:   3,
      }
    }
  ];

  for (const cfg of configs) {
    await Config.findOneAndUpdate({ key: cfg.key }, { value: cfg.value }, { upsert: true });
  }
  console.log('✅ Default config disimpan');

  // ── Default static pages ──────────────────────────────────
  const pages = [
    { slug: 'faq',     title: 'FAQ', content: '<h2>Belum ada konten FAQ</h2><p>Edit melalui admin dashboard.</p>' },
    { slug: 'terms',   title: 'Syarat & Ketentuan', content: '<h2>Syarat & Ketentuan</h2><p>Edit melalui admin dashboard.</p>' },
    { slug: 'privacy', title: 'Kebijakan Privasi',  content: '<h2>Kebijakan Privasi</h2><p>Edit melalui admin dashboard.</p>' },
  ];
  for (const p of pages) {
    await StaticPage.findOneAndUpdate({ slug: p.slug }, p, { upsert: true });
  }
  console.log('✅ Halaman statis dibuat');

  // ── Default categories ────────────────────────────────────
  const cats = [
    { name: 'Game', slug: 'game', icon: 'fa-gamepad', color: '#6366f1', sortOrder: 1 },
    { name: 'Streaming', slug: 'streaming', icon: 'fa-tv', color: '#ec4899', sortOrder: 2 },
    { name: 'Aplikasi', slug: 'aplikasi', icon: 'fa-mobile-screen', color: '#10b981', sortOrder: 3 },
    { name: 'Voucher', slug: 'voucher', icon: 'fa-ticket', color: '#f59e0b', sortOrder: 4 },
  ];
  for (const cat of cats) {
    await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true });
  }
  console.log('✅ Kategori default dibuat');

  console.log('\n🎉 Seeding selesai!\n');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
