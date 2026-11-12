# 🚀 Deployment Guide — RamxPremium via Git Bash

> Panduan lengkap step-by-step untuk deploy RamxPremium ke VPS menggunakan **Git Bash** di Windows.

---

## 📋 Prasyarat

Sebelum mulai, pastikan sudah punya:

| Kebutuhan | Keterangan |
|-----------|------------|
| **Git Bash** | Download di [git-scm.com](https://git-scm.com/downloads) |
| **VPS** | Ubuntu 22.04 LTS, min 1 GB RAM |
| **Domain** | Sudah pointing ke IP VPS (A record) |
| **IP VPS** | Misal: `103.xxx.xxx.xxx` |
| **SSH Key / Password** | Akses root atau sudo ke VPS |

---

## 🗂️ Struktur Project yang Akan Di-deploy

```
ramxpremium/
├── 📁 account/          # Halaman customer portal
├── 📁 admin/            # Panel admin
├── 📁 b/                # Halaman beli produk
├── 📁 backend/          # Backend API (Node.js + Express)
│   ├── server.js
│   ├── package.json
│   └── .env             # ← WAJIB diisi, TIDAK ikut di-upload
├── 📁 contact/          # Halaman kontak
├── 📁 dashboard/        # Dashboard customer
├── 📁 invoice/          # Halaman invoice
├── 📁 (... halaman lainnya)
├── server-frontend.js   # Server frontend (port 5500)
├── ecosystem.config.js  # Konfigurasi PM2
├── deploy.sh            # Script deploy pertama kali
└── update.sh            # Script update
```

---

## 🔑 BAGIAN 1 — Setup SSH Key (Sekali Saja)

> SSH key lebih aman daripada password. Lakukan ini sekali, tidak perlu diulang.

### Langkah 1.1 — Buka Git Bash

Buka **Git Bash** dari Start Menu atau klik kanan di folder project → **Git Bash Here**

### Langkah 1.2 — Buat SSH Key

```bash
# Buat SSH key baru (tekan Enter 3x untuk default)
ssh-keygen -t ed25519 -C "ramxpremium-vps"
```

Output:
```
Generating public/private ed25519 key pair.
Enter file in which to save the key (/c/Users/YourName/.ssh/id_ed25519): [Enter]
Enter passphrase (empty for no passphrase): [Enter]
Enter same passphrase again: [Enter]
```

### Langkah 1.3 — Copy SSH Key ke VPS

```bash
# Ganti YOUR_VPS_IP dengan IP VPS kamu
ssh-copy-id root@YOUR_VPS_IP

# Contoh:
ssh-copy-id root@103.123.456.789
```

Masukkan password VPS saat diminta. Setelah ini, kamu tidak perlu password lagi.

### Langkah 1.4 — Test Koneksi SSH

```bash
ssh root@YOUR_VPS_IP

# Kalau berhasil, akan muncul prompt:
# root@hostname:~#
```

Ketik `exit` untuk keluar dari VPS.

---

## 🏗️ BAGIAN 2 — Persiapan di Komputer Lokal

### Langkah 2.1 — Buka Git Bash di Folder Project

```bash
# Navigasi ke folder project
cd "/d/Request Project/Website Order - Request"

# Verifikasi lokasi
pwd
# Output: /d/Request Project/Website Order - Request
```

### Langkah 2.2 — Pastikan File deploy.sh & update.sh Ada

```bash
ls -la deploy.sh update.sh ecosystem.config.js
```

Output yang diharapkan:
```
-rw-r--r-- deploy.sh
-rw-r--r-- update.sh
-rw-r--r-- ecosystem.config.js
```

### Langkah 2.3 — Siapkan File .env untuk Backend

> ⚠️ File `.env` TIDAK akan di-upload otomatis (sudah masuk `.gitignore`).
> Kamu harus buat dan upload manual ke VPS.

Buat dulu file `.env` di komputer lokal:

```bash
# Buka file env backend dengan editor teks
notepad backend/.env
```

Isi dengan nilai yang sebenarnya:

```env
# Server
PORT=5000
NODE_ENV=production

# MongoDB Atlas
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/ramxpremium

# JWT (ganti dengan string random minimal 32 karakter)
JWT_SECRET=isi_dengan_string_random_panjang_minimal_32_karakter_disini
JWT_EXPIRES_IN=7d

# Telegram Bot
TELEGRAM_BOT_TOKEN=1234567890:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_BOT_USERNAME=nama_bot_kamu
TELEGRAM_MODE=polling

# Frontend URL (domain kamu)
FRONTEND_URL=https://yourdomain.com

# Admin Default
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=AdminPassword123!
ADMIN_NAME=Administrator

# Gmail SMTP
GMAIL_USER=emailkamu@gmail.com
GMAIL_APP_PASSWORD=xxxx_xxxx_xxxx_xxxx

# Store Info
STORE_NAME=RamxPremium
STORE_URL=https://yourdomain.com
```

---

## 🚀 BAGIAN 3 — Deploy Pertama Kali ke VPS

### Langkah 3.1 — Upload Semua File ke VPS (via rsync)

```bash
# Jalankan dari Git Bash di folder project
# Ganti YOUR_VPS_IP dengan IP VPS kamu

rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='backend/node_modules' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='backend/.env' \
  --exclude='*.bat' \
  --exclude='*.ps1' \
  --exclude='.DS_Store' \
  --exclude='Thumbs.db' \
  --exclude='*.log' \
  ./ root@YOUR_VPS_IP:/var/www/ramxpremium/
```

> **Penjelasan flag:**
> - `-a` → archive mode (preserve file attributes)
> - `-v` → verbose (tampilkan progress)
> - `-z` → compress data saat transfer
> - `--exclude` → skip folder/file tertentu

Proses upload: tunggu hingga selesai (~1-2 menit tergantung koneksi).

### Langkah 3.2 — Upload File .env ke VPS (Terpisah)

```bash
# Upload .env backend ke VPS
scp backend/.env root@YOUR_VPS_IP:/var/www/ramxpremium/backend/.env

# Verifikasi
ssh root@YOUR_VPS_IP "cat /var/www/ramxpremium/backend/.env | head -5"
```

### Langkah 3.3 — SSH ke VPS & Jalankan deploy.sh

```bash
# Masuk ke VPS
ssh root@YOUR_VPS_IP

# Masuk ke direktori app
cd /var/www/ramxpremium

# Beri izin eksekusi ke script
chmod +x deploy.sh update.sh

# Jalankan deploy
./deploy.sh
```

Script akan otomatis:
- ✅ Install Node.js 20 LTS
- ✅ Install PM2
- ✅ Install Nginx
- ✅ Install dependencies backend (`npm install --production`)
- ✅ Buat `ecosystem.config.js`
- ✅ Konfigurasi Nginx (akan tanya domain)
- ✅ Aktifkan firewall (port 22, 80, 443)
- ✅ Jalankan kedua server via PM2
- ✅ Setup PM2 auto-start saat reboot

Saat script tanya domain:
```
Masukkan domain Anda (contoh: ramxpremium.com): yourdomain.com
```

### Langkah 3.4 — Verifikasi Aplikasi Berjalan

```bash
# Cek status PM2
pm2 list

# Cek log backend
pm2 logs ramx-backend --lines 20

# Cek log frontend
pm2 logs ramx-frontend --lines 20

# Test akses langsung (tanpa domain)
curl http://localhost:5500
curl http://localhost:5000/api/health
```

### Langkah 3.5 — Pasang SSL (HTTPS) Gratis

```bash
# Install certbot
apt install -y certbot python3-certbot-nginx

# Generate SSL (ganti dengan domain kamu)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Ikuti instruksi, masukkan email, setuju Terms of Service
# Certbot otomatis update konfigurasi Nginx untuk HTTPS
```

Setelah SSL terpasang, test:
```bash
nginx -t && systemctl reload nginx
```

---

## 🔄 BAGIAN 4 — Update File Setelah Ada Perubahan

> Setiap kali kamu edit file di komputer lokal, ikuti langkah ini untuk update ke VPS.

### Cara Update — Semua File

```bash
# 1. Di Git Bash lokal — Upload file yang berubah
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='backend/node_modules' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='backend/.env' \
  --exclude='*.bat' \
  --exclude='*.ps1' \
  --exclude='.DS_Store' \
  --exclude='*.log' \
  ./ root@YOUR_VPS_IP:/var/www/ramxpremium/

# 2. SSH ke VPS lalu jalankan update
ssh root@YOUR_VPS_IP "/var/www/ramxpremium/update.sh"
```

### Cara Update — Hanya Backend

```bash
# Upload hanya folder backend
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.env' \
  ./backend/ root@YOUR_VPS_IP:/var/www/ramxpremium/backend/

# Restart hanya backend
ssh root@YOUR_VPS_IP "/var/www/ramxpremium/update.sh --backend"
```

### Cara Update — Hanya Frontend (HTML/CSS/JS)

```bash
# Upload folder frontend yang berubah (contoh: invoice)
rsync -avz ./invoice/ root@YOUR_VPS_IP:/var/www/ramxpremium/invoice/

# Restart hanya frontend
ssh root@YOUR_VPS_IP "/var/www/ramxpremium/update.sh --frontend"
```

### Cara Update — File CSS/HTML Saja (Tanpa Restart)

```bash
# Upload satu file spesifik (contoh: index.css)
scp index.css root@YOUR_VPS_IP:/var/www/ramxpremium/index.css

# Frontend server-frontend.js baca file langsung dari disk
# tidak perlu restart untuk perubahan HTML/CSS/JS static
```

---

## ⚡ BAGIAN 5 — Shortcut & Alias (Opsional)

Tambahkan alias di Git Bash agar tidak perlu ketik panjang setiap kali:

```bash
# Buka file konfigurasi bash
notepad ~/.bashrc
```

Tambahkan baris ini di akhir file:

```bash
# === RamxPremium Shortcuts ===
VPS_IP="103.xxx.xxx.xxx"   # Ganti dengan IP VPS kamu
VPS_DIR="/var/www/ramxpremium"
LOCAL_DIR="/d/Request Project/Website Order - Request"

# Upload + update semua file
alias ramx-deploy='rsync -avz --progress --exclude="node_modules" --exclude="backend/node_modules" --exclude=".git" --exclude=".env" --exclude="backend/.env" --exclude="*.bat" --exclude="*.log" "${LOCAL_DIR}/" "root@${VPS_IP}:${VPS_DIR}/" && ssh root@${VPS_IP} "${VPS_DIR}/update.sh"'

# Update backend saja
alias ramx-backend='rsync -avz --exclude="node_modules" --exclude=".env" "${LOCAL_DIR}/backend/" "root@${VPS_IP}:${VPS_DIR}/backend/" && ssh root@${VPS_IP} "${VPS_DIR}/update.sh --backend"'

# Update frontend saja  
alias ramx-frontend='rsync -avz "${LOCAL_DIR}/invoice/" "root@${VPS_IP}:${VPS_DIR}/invoice/" && ssh root@${VPS_IP} "${VPS_DIR}/update.sh --frontend"'

# SSH ke VPS
alias ramx-ssh='ssh root@${VPS_IP}'

# Lihat log
alias ramx-log='ssh root@${VPS_IP} "pm2 logs --lines 50"'

# Status PM2
alias ramx-status='ssh root@${VPS_IP} "pm2 list"'
```

Simpan lalu reload:
```bash
source ~/.bashrc
```

Sekarang cukup ketik:
```bash
ramx-deploy    # Upload + update semua
ramx-backend   # Update backend saja
ramx-ssh       # SSH ke VPS
ramx-log       # Lihat log
ramx-status    # Status PM2
```

---

## 🛠️ BAGIAN 6 — Perintah PM2 yang Sering Dipakai

```bash
# Jalankan dari VPS (ssh dulu)

pm2 list                          # Lihat semua proses
pm2 logs                          # Log semua proses (realtime)
pm2 logs ramx-backend --lines 50  # Log backend 50 baris terakhir
pm2 logs ramx-frontend --lines 50 # Log frontend 50 baris terakhir
pm2 monit                         # Monitor CPU & RAM realtime

pm2 restart ramx-backend          # Restart backend
pm2 restart ramx-frontend         # Restart frontend
pm2 restart all                   # Restart semua
pm2 reload all                    # Reload (zero downtime)

pm2 stop ramx-backend             # Stop backend
pm2 stop all                      # Stop semua

pm2 delete all                    # Hapus semua proses dari PM2
pm2 start ecosystem.config.js     # Jalankan ulang dari config
```

---

## 🔍 BAGIAN 7 — Troubleshooting

### ❌ Error: "Connection refused" saat curl

```bash
# Cek apakah PM2 berjalan
pm2 list

# Kalau tidak ada, jalankan ulang
cd /var/www/ramxpremium
pm2 start ecosystem.config.js
```

### ❌ Error: "Cannot connect to MongoDB"

```bash
# Cek file .env
cat /var/www/ramxpremium/backend/.env | grep MONGODB

# Pastikan IP VPS sudah diwhitelist di MongoDB Atlas:
# Atlas Dashboard → Network Access → Add IP Address → tambah IP VPS
```

### ❌ Error: "Port 5000/5500 already in use"

```bash
# Lihat proses yang pakai port
lsof -i :5000
lsof -i :5500

# Kill proses lama
kill -9 $(lsof -t -i:5000)
kill -9 $(lsof -t -i:5500)

# Jalankan ulang
pm2 start ecosystem.config.js
```

### ❌ Error: "Permission denied" saat ./deploy.sh

```bash
chmod +x /var/www/ramxpremium/deploy.sh
chmod +x /var/www/ramxpremium/update.sh
```

### ❌ Website tidak bisa diakses via domain

```bash
# Cek Nginx
nginx -t
systemctl status nginx

# Cek DNS sudah pointing ke VPS
# Di Git Bash lokal:
nslookup yourdomain.com

# Cek firewall
ufw status
```

### ❌ rsync: "No such file or directory"

```bash
# Buat dulu direktorinya di VPS
ssh root@YOUR_VPS_IP "mkdir -p /var/www/ramxpremium"
```

---

## 📊 Checklist Deploy Pertama Kali

```
[ ] Git Bash sudah terinstall
[ ] SSH key sudah dibuat dan dikopy ke VPS
[ ] File backend/.env sudah diisi lengkap
[ ] rsync berhasil upload semua file
[ ] backend/.env sudah di-scp ke VPS
[ ] deploy.sh berhasil dijalankan tanpa error
[ ] pm2 list menunjukkan ramx-backend ONLINE
[ ] pm2 list menunjukkan ramx-frontend ONLINE
[ ] curl localhost:5500 berhasil response
[ ] curl localhost:5000/api/health berhasil response
[ ] SSL certbot sudah terpasang
[ ] Website bisa diakses via https://yourdomain.com
[ ] MongoDB Atlas whitelist IP VPS
[ ] Admin panel bisa diakses: https://yourdomain.com/admin
```

---

## 📝 Catatan Penting

> [!WARNING]
> **Jangan pernah upload file `.env` via rsync biasa** — selalu gunakan `scp` terpisah agar tidak terlupakan di git history.

> [!TIP]
> **Backup `.env` VPS** sebelum update besar:
> ```bash
> scp root@YOUR_VPS_IP:/var/www/ramxpremium/backend/.env ./backend/.env.backup
> ```

> [!NOTE]
> **MongoDB Atlas Free Tier** memiliki limit 512 MB storage dan 100 koneksi simultan — cukup untuk awal. Upgrade ke M10 (~\$57/bln) jika traffic tumbuh.
