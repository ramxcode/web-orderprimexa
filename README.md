# 🛒 RamxPremium

Toko produk digital modern dengan sistem order otomatis, pembayaran QRIS, dan admin dashboard lengkap.

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-Private-red)

---

## ✨ Fitur Utama

### 🏪 Storefront (Customer)
- Katalog produk digital dengan varian & kategori
- Checkout cepat (dengan atau tanpa login)
- Pembayaran **QRIS** (GatePay / PayGomerch) & **Saldo Akun**
- Invoice realtime dengan status polling otomatis
- Tracking pesanan via nomor invoice
- Sistem akun: register, login, verifikasi email, profil
- Top-up saldo akun
- Wishlist & riwayat pesanan
- Review produk
- Voucher / kode promo

### 🔐 Admin Dashboard
- Dashboard statistik (pendapatan, pesanan, pelanggan)
- Manajemen produk, kategori, stok
- Manajemen pesanan & fulfillment otomatis (instant delivery)
- Payment gateway: GatePay & PayGomerch QRIS
- Daftar transaksi & status pembayaran
- Manajemen user & voucher
- Kustomisasi toko (logo, nama, favicon, halaman statis)
- Database overview (MongoDB stats)
- Telegram Bot terintegrasi (notifikasi order ke admin)

### ⚡ Teknis
- Auto-fulfillment: stok dikirim otomatis setelah pembayaran
- PIN protection untuk kredensial produk (order dengan akun)
- Email notifikasi (pending, sukses, expired, gagal)
- Webhook support (GatePay & PayGomerch)
- Clean URL routing (tanpa hash `#`)
- Responsive design (mobile-first dark theme)

---

## 📁 Struktur Proyek

```
├── backend/               # Express.js API server
│   ├── config/            # Database config
│   ├── middleware/         # Auth, admin, honeypot
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API routes
│   ├── services/          # Mailer service
│   ├── server.js          # Entry point backend
│   └── .env               # Environment variables (⚠️ TIDAK di-commit)
│
├── admin/                 # Admin dashboard SPA
│   ├── login/             # Halaman login admin
│   ├── js/                # App logic, API client, pages
│   └── css/               # Stylesheet admin
│
├── b/                     # Halaman checkout produk
├── invoice/               # Halaman invoice & pembayaran QRIS
├── track/                 # Tracking pesanan
├── login/                 # Login customer
├── register/              # Register customer
├── account/               # Dashboard akun customer
├── dashboard/             # Dashboard saldo customer
├── produk/                # Halaman detail produk
├── contact/               # Halaman kontak
├── faq/                   # Halaman FAQ
├── promo/                 # Halaman promo
├── privacy/               # Kebijakan privasi
├── terms/                 # Syarat & ketentuan
├── telegram/              # Link Telegram
├── tgapp/                 # Telegram Web App
├── verify-email/          # Verifikasi email
│
├── index.html             # Homepage
├── index.css              # Homepage stylesheet
├── main.js                # Homepage logic
├── server-frontend.js     # Frontend dev server (clean URL)
├── config.js              # Shared frontend config
├── .gitignore
└── package.json
```

---

## 🚀 Instalasi & Setup

### Prasyarat
- **Node.js** v18 atau lebih baru
- **MongoDB Atlas** (atau MongoDB lokal)
- **Gmail** untuk pengiriman email (App Password)
- **Telegram Bot Token** (opsional, untuk notifikasi admin)

### 1. Clone Repository

```bash
git clone https://github.com/ramxcode/ramxpremium.git
cd ramxpremium
```

### 2. Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend
npm install
```

### 3. Konfigurasi Environment

Buat file `backend/.env` dan isi:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ramxpremium

# JWT
JWT_SECRET=your_random_secret_string_min_32_chars
JWT_EXPIRES_IN=7d

# Telegram Bot (opsional)
TELEGRAM_BOT_TOKEN=123456:ABCdefGHI...
TELEGRAM_BOT_USERNAME=YourBotUsername
TELEGRAM_MODE=polling

# CORS
FRONTEND_URL=http://localhost:5500

# Admin Default (untuk seed pertama kali)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
ADMIN_NAME=Admin

# Gmail SMTP
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# Store Info
STORE_NAME=RamxPremium
STORE_URL=http://localhost:5500
```

### 4. Jalankan

```bash
# Terminal 1 — Backend
cd backend
node server.js

# Terminal 2 — Frontend
node server-frontend.js
```

Buka browser:
- **Website:** http://localhost:5500
- **Admin:** http://localhost:5500/admin/login
- **API Health:** http://localhost:5000/api/health

---

## 💳 Payment Gateway

### GatePay (QRIS)
1. Daftar di [gatepay.biz.id](https://gatepay.biz.id)
2. Ambil API Key di menu Developer
3. Masukkan API Key di **Admin → Payment Gateway → GatePay**
4. Set sebagai provider aktif

### PayGomerch (QRIS)
1. Daftar di [pay-gomerch.web.id](https://pay-gomerch.web.id)
2. Ambil API Key
3. Masukkan API Key di **Admin → Payment Gateway → PayGomerch**

---

## 🔧 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS, Font Awesome, Plus Jakarta Sans |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT (httpOnly cookie + Bearer) + bcrypt |
| Payment | GatePay QRIS, PayGomerch QRIS |
| Email | Nodemailer + Gmail SMTP |
| Bot | Telegraf (Telegram Bot) |
| Server | Frontend: custom clean-URL server · Backend: Express |

---

## ⚠️ Catatan Penting

- **Jangan commit file `.env`** — berisi kredensial sensitif
- Pastikan `.gitignore` sudah benar sebelum push
- Untuk production, gunakan **HTTPS** dan set `NODE_ENV=production`
- API Key payment gateway harus disimpan di server, **bukan di frontend**

---

<p align="center">
  Built with ❤️ by <strong>RAMXCODE</strong>
</p>
