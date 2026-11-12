# 🚀 Deployment Guide — Primexa via Git Bash (Full Auto)

> **VPS IP:** `31.56.56.238` | **Domain:** `primexa.web.id` | **Method:** rsync langsung (tanpa GitHub)

---

## 📋 Prasyarat

| Kebutuhan | Status |
|-----------|--------|
| **Git Bash** | Sudah terinstall |
| **VPS** | `31.56.56.238` (Ubuntu 20/22 LTS) |
| **Domain** | `primexa.web.id` ✅ DNS sudah pointing ke `31.56.56.238` |
| **File .env** | `d:\Request Project\Web Order Primexa\.env` |
| **File backend/.env** | `d:\Request Project\Web Order Primexa\backend\.env` |

---

## 🗺️ Arsitektur

```
Internet
   │
   ▼
Nginx :80/:443  ←── SSL Let's Encrypt
   │
   ├── /api/*    →  primexa-backend  :5000  (PM2)
   ├── /webhook/ →  primexa-backend  :5000  (PM2)
   └── /*        →  primexa-frontend :5500  (PM2)
```

---

## 🌐 Status DNS (Sudah OK ✅)

DNS sudah dikonfigurasi di DomainNesia:
- `@` → `31.56.56.238` ✅
- `www` → `31.56.56.238` ✅

Cek propagation:
```bash
nslookup primexa.web.id
# Harus menampilkan: Address: 31.56.56.238
```

---

## 🚀 DEPLOY — Cukup 2 Langkah!

### Langkah 1 — Buka Git Bash di folder project

```bash
cd "/d/Request Project/Web Order Primexa"
```

### Langkah 2 — Jalankan script deploy otomatis

```bash
bash deploy-vps.sh
```

> Script ini otomatis melakukan SEMUA setup dari awal sampai SSL terpasang!

---

## 🔄 UPDATE Setelah Ada Perubahan Kode

```bash
# Update semua file + restart
bash update-vps.sh

# Update backend saja (server.js, routes, dll)
bash update-vps.sh --backend

# Update file .env saja
bash update-vps.sh --env
```

---

## ✅ Verifikasi Deployment

```bash
# Cek status PM2
ssh -i ~/.ssh/primexa_vps root@31.56.56.238 'pm2 list'

# Cek log backend
ssh -i ~/.ssh/primexa_vps root@31.56.56.238 'pm2 logs primexa-backend --lines 30'

# Cek log frontend
ssh -i ~/.ssh/primexa_vps root@31.56.56.238 'pm2 logs primexa-frontend --lines 20'
```

**Test di browser:**
- 🌐 `https://primexa.web.id` → Halaman utama
- 🌐 `https://primexa.web.id/api/` → Response backend
- 🌐 `https://primexa.web.id/admin` → Panel admin

---

## 🔒 Pasang SSL Manual (jika gagal otomatis)

```bash
ssh -i ~/.ssh/primexa_vps root@31.56.56.238
certbot --nginx -d primexa.web.id -d www.primexa.web.id
# Ikuti prompt: email → A → 2
exit
```

---

## 🛠️ Perintah SSH Berguna

```bash
# Masuk VPS
ssh -i ~/.ssh/primexa_vps root@31.56.56.238

# Monitor realtime
ssh -i ~/.ssh/primexa_vps root@31.56.56.238 'pm2 monit'

# Restart semua
ssh -i ~/.ssh/primexa_vps root@31.56.56.238 'pm2 restart all'

# Reload Nginx
ssh -i ~/.ssh/primexa_vps root@31.56.56.238 'systemctl reload nginx'

# Cek SSL expiry
ssh -i ~/.ssh/primexa_vps root@31.56.56.238 'certbot certificates'
```

---

## ❗ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `502 Bad Gateway` | `ssh root@31.56.56.238 'pm2 restart all'` |
| MongoDB error | Whitelist IP `31.56.56.238` di MongoDB Atlas → Network Access |
| Bot Telegram tidak respon | Pastikan `TELEGRAM_MODE=webhook` di `backend/.env` |
| SSL gagal | Cek DNS propagasi dulu: `nslookup primexa.web.id` |
| `Permission denied` pada SSH | Jalankan `deploy-vps.sh` lagi — script akan re-setup SSH key |

---

## 📊 Checklist Deploy

```
[✅] DNS A record @ → 31.56.56.238
[✅] DNS A record www → 31.56.56.238
[ ] File .env root sudah diisi
[ ] File backend/.env sudah diisi
[ ] IP VPS (31.56.56.238) sudah diwhitelist di MongoDB Atlas
[ ] bash deploy-vps.sh berhasil dijalankan
[ ] pm2 list → primexa-backend ONLINE
[ ] pm2 list → primexa-frontend ONLINE
[ ] https://primexa.web.id bisa diakses
[ ] https://primexa.web.id/api/ response OK
[ ] https://primexa.web.id/admin bisa diakses
```
