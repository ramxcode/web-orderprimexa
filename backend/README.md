# 🚀 RamxPremium Backend — Setup Guide

## Prasyarat
- Node.js 18+
- Akun [MongoDB Atlas](https://cloud.mongodb.com) (gratis)
- Bot Telegram dari [@BotFather](https://t.me/BotFather)

---

## 1. Setup MongoDB Atlas

1. Buat akun di https://cloud.mongodb.com
2. Buat cluster baru (M0 — Free Tier)
3. Buat database user (ingat username & password)
4. Whitelist IP: `0.0.0.0/0` (untuk development)
5. Klik **Connect** → **Drivers** → salin connection string

---

## 2. Setup Telegram Bot

1. Chat [@BotFather](https://t.me/BotFather) di Telegram
2. Kirim `/newbot`
3. Ikuti instruksi, salin **Bot Token**
4. Salin **username bot**

---

## 3. Konfigurasi .env

Edit file `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ramxpremium
JWT_SECRET=string_random_panjang_min_32_karakter
TELEGRAM_BOT_TOKEN=token_dari_botfather
TELEGRAM_BOT_USERNAME=username_bot_tanpa_@
TELEGRAM_MODE=polling
FRONTEND_URL=http://localhost:5500
ADMIN_EMAIL=admin@ramxpremium.com
ADMIN_PASSWORD=GantiPassword123!
```

---

## 4. Jalankan Backend

```bash
cd backend

# Inisialisasi data awal (admin + config default)
node seeder.js

# Development (dengan auto-reload)
npm run dev

# Production
npm start
```

Server berjalan di: http://localhost:5000

---

## 5. Setup Frontend

Edit `config.js` di root project:

```js
window.RAMX_CONFIG = {
  apiUrl: 'http://localhost:5000/api',  // Development
  // apiUrl: 'https://api.domain.com/api',  // Production
  telegramBotUsername: 'username_bot_tanpa_@',
  ...
};
```

---

## 6. Deploy ke VPS (Production)

```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
NODE_ENV=production TELEGRAM_MODE=webhook pm2 start server.js --name ramx-backend

# Set webhook Telegram
# Ganti TELEGRAM_WEBHOOK_URL di .env dengan: https://api.domain.com
# Lalu restart: pm2 restart ramx-backend
```

---

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/health` | Cek status server |
| POST | `/api/auth/register` | Daftar akun |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/telegram/send-otp` | Kirim OTP ke Telegram |
| POST | `/api/auth/telegram/verify-otp` | Verifikasi OTP |
| GET | `/api/auth/me` | Data user saya |
| GET | `/api/products` | Daftar produk |
| GET | `/api/orders` | Daftar order |
| GET | `/api/config` | Konfigurasi toko |
| GET | `/api/pages/:slug` | Halaman statis |
| GET | `/api/admin/stats` | Statistik dashboard |

---

## Struktur Backend

```
backend/
├── server.js          ← Entry point
├── seeder.js          ← Inisialisasi data
├── .env               ← Konfigurasi (JANGAN commit)
├── config/
│   └── db.js          ← Koneksi MongoDB
├── models/
│   ├── User.js
│   ├── OtpCode.js
│   ├── Product.js
│   ├── Order.js
│   ├── Config.js
│   ├── StaticPage.js
│   └── Category.js
├── routes/
│   ├── auth.js
│   ├── products.js
│   ├── orders.js
│   ├── config.js
│   ├── pages.js
│   └── admin.js
├── middleware/
│   ├── auth.js        ← JWT verify
│   └── adminOnly.js   ← Admin role check
└── services/
    └── telegramBot.js ← Bot instance + OTP sender
```
