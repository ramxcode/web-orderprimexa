#!/bin/bash
# =============================================================================
#  deploy.sh — Initial Deployment RamxPremium ke VPS
#  Jalankan sekali di VPS untuk setup pertama kali
#
#  Usage:
#    chmod +x deploy.sh
#    ./deploy.sh
# =============================================================================

set -e  # Exit jika ada error

# ── Konfigurasi ──────────────────────────────────────────────────────────────
APP_NAME="ramxpremium"
APP_DIR="/var/www/${APP_NAME}"
FRONTEND_PORT=5500
BACKEND_PORT=5000
NODE_MIN_VERSION=18

# Warna output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

print_banner() {
  echo -e "${CYAN}"
  echo "  ╔══════════════════════════════════════════╗"
  echo "  ║   RamxPremium — VPS Deployment Script   ║"
  echo "  ║   Initial Setup & Auto Configuration    ║"
  echo "  ╚══════════════════════════════════════════╝"
  echo -e "${NC}"
}

log_step() { echo -e "\n${BLUE}${BOLD}[STEP]${NC} $1"; }
log_ok()   { echo -e "  ${GREEN}✔${NC}  $1"; }
log_warn() { echo -e "  ${YELLOW}⚠${NC}  $1"; }
log_err()  { echo -e "  ${RED}✖${NC}  $1"; }
log_info() { echo -e "  ${CYAN}→${NC}  $1"; }

print_banner

# ── 1. Cek hak akses root ─────────────────────────────────────────────────────
log_step "Memeriksa hak akses..."
if [[ $EUID -ne 0 ]]; then
  log_err "Script ini harus dijalankan sebagai root atau dengan sudo"
  echo "  Gunakan: sudo ./deploy.sh"
  exit 1
fi
log_ok "Berjalan sebagai root"

# ── 2. Update sistem ──────────────────────────────────────────────────────────
log_step "Update package list..."
apt-get update -qq
log_ok "Package list diperbarui"

# ── 3. Install Node.js ────────────────────────────────────────────────────────
log_step "Memeriksa Node.js..."
if command -v node &>/dev/null; then
  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  if [[ $NODE_VER -ge $NODE_MIN_VERSION ]]; then
    log_ok "Node.js $(node -v) sudah terinstall"
  else
    log_warn "Node.js $(node -v) terlalu lama, mengupgrade ke LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs -qq
    log_ok "Node.js $(node -v) berhasil diinstall"
  fi
else
  log_info "Menginstall Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs -qq
  log_ok "Node.js $(node -v) berhasil diinstall"
fi

# ── 4. Install PM2 ────────────────────────────────────────────────────────────
log_step "Memeriksa PM2..."
if ! command -v pm2 &>/dev/null; then
  log_info "Menginstall PM2..."
  npm install -g pm2 --silent
  log_ok "PM2 berhasil diinstall"
else
  log_ok "PM2 $(pm2 -v) sudah terinstall"
fi

# ── 5. Install Nginx ──────────────────────────────────────────────────────────
log_step "Memeriksa Nginx..."
if ! command -v nginx &>/dev/null; then
  log_info "Menginstall Nginx..."
  apt-get install -y nginx -qq
  log_ok "Nginx berhasil diinstall"
else
  log_ok "Nginx sudah terinstall"
fi

# ── 6. Buat direktori aplikasi ────────────────────────────────────────────────
log_step "Menyiapkan direktori aplikasi..."
mkdir -p "${APP_DIR}"
log_ok "Direktori: ${APP_DIR}"

# ── 7. Salin file project ke direktori app ────────────────────────────────────
log_step "Menyalin file project..."

# Script ini harus dijalankan dari direktori project
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

rsync -av --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='backend/.env' \
  --exclude='*.bat' \
  --exclude='*.ps1' \
  --exclude='.DS_Store' \
  --exclude='Thumbs.db' \
  --exclude='*.log' \
  "${SCRIPT_DIR}/" "${APP_DIR}/"

log_ok "File project berhasil disalin ke ${APP_DIR}"

# ── 8. Install dependencies Backend ──────────────────────────────────────────
log_step "Menginstall dependencies backend..."
cd "${APP_DIR}/backend"
npm install --production --silent
log_ok "Dependencies backend terinstall ($(du -sh node_modules | cut -f1))"

# ── 9. Buat file .env jika belum ada ─────────────────────────────────────────
log_step "Memeriksa file konfigurasi .env..."
if [[ ! -f "${APP_DIR}/backend/.env" ]]; then
  log_warn "File backend/.env belum ada!"
  cat > "${APP_DIR}/backend/.env" << 'ENVEOF'
# =============================================================
#  RamxPremium Backend — Environment Variables
#  WAJIB diisi sebelum menjalankan server!
# =============================================================

# Server
PORT=5000
NODE_ENV=production

# MongoDB Atlas
# Format: mongodb+srv://username:password@cluster.mongodb.net/dbname
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/ramxpremium

# JWT Secret (ganti dengan string random min 32 karakter)
JWT_SECRET=GANTI_DENGAN_STRING_RANDOM_PANJANG_MINIMAL_32_KARAKTER
JWT_EXPIRES_IN=7d

# Telegram Bot
TELEGRAM_BOT_TOKEN=TOKEN_BOT_TELEGRAM
TELEGRAM_BOT_USERNAME=username_bot
TELEGRAM_MODE=polling

# Frontend URL (ganti dengan domain Anda)
FRONTEND_URL=https://yourdomain.com

# Admin Default
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=AdminPassword123!
ADMIN_NAME=Administrator

# Gmail SMTP
GMAIL_USER=email@gmail.com
GMAIL_APP_PASSWORD=app_password_gmail

# Store Info
STORE_NAME=RamxPremium
STORE_URL=https://yourdomain.com
ENVEOF
  echo ""
  log_warn "============================================================"
  log_warn "File .env sudah dibuat di: ${APP_DIR}/backend/.env"
  log_warn "WAJIB edit file tersebut dan isi nilai yang sesuai!"
  log_warn "Gunakan: nano ${APP_DIR}/backend/.env"
  log_warn "============================================================"
else
  log_ok "File backend/.env sudah ada"
fi

# ── 10. Buat ecosystem.config.js untuk PM2 ───────────────────────────────────
log_step "Membuat konfigurasi PM2..."
cat > "${APP_DIR}/ecosystem.config.js" << ECOEOF
module.exports = {
  apps: [
    {
      name: 'ramx-backend',
      script: 'backend/server.js',
      cwd: '${APP_DIR}',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: ${BACKEND_PORT}
      },
      error_file: '/var/log/pm2/ramx-backend-error.log',
      out_file:   '/var/log/pm2/ramx-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'ramx-frontend',
      script: 'server-frontend.js',
      cwd: '${APP_DIR}',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        FRONTEND_PORT: ${FRONTEND_PORT}
      },
      error_file: '/var/log/pm2/ramx-frontend-error.log',
      out_file:   '/var/log/pm2/ramx-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
ECOEOF

mkdir -p /var/log/pm2
log_ok "ecosystem.config.js berhasil dibuat"

# ── 11. Konfigurasi Nginx ─────────────────────────────────────────────────────
log_step "Membuat konfigurasi Nginx..."

# Minta domain dari user
echo ""
read -rp "  Masukkan domain Anda (contoh: ramxpremium.com): " DOMAIN
if [[ -z "$DOMAIN" ]]; then
  DOMAIN="yourdomain.com"
  log_warn "Domain tidak diisi, menggunakan placeholder: ${DOMAIN}"
fi

cat > "/etc/nginx/sites-available/${APP_NAME}" << NGINXEOF
# RamxPremium — Nginx Configuration
# Generated by deploy.sh on $(date)

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Redirect semua HTTP ke HTTPS (aktifkan setelah SSL terpasang)
    # return 301 https://\$host\$request_uri;

    # Sementara: proxy langsung ke frontend (sebelum SSL)
    location / {
        proxy_pass http://127.0.0.1:${FRONTEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1000;
}

# HTTPS (uncomment setelah certbot dipasang)
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name ${DOMAIN} www.${DOMAIN};
#
#     ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
#     ssl_prefer_server_ciphers off;
#
#     location / {
#         proxy_pass http://127.0.0.1:${FRONTEND_PORT};
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade \$http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host \$host;
#         proxy_set_header X-Real-IP \$remote_addr;
#         proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto \$scheme;
#         proxy_cache_bypass \$http_upgrade;
#     }
#
#     gzip on;
#     gzip_types text/plain text/css application/javascript application/json image/svg+xml;
# }
NGINXEOF

# Aktifkan site
ln -sf "/etc/nginx/sites-available/${APP_NAME}" "/etc/nginx/sites-enabled/${APP_NAME}"
rm -f /etc/nginx/sites-enabled/default  # Hapus default site

# Test & reload Nginx
nginx -t && systemctl reload nginx
log_ok "Nginx dikonfigurasi untuk domain: ${DOMAIN}"

# ── 12. Konfigurasi Firewall ──────────────────────────────────────────────────
log_step "Mengkonfigurasi firewall (UFW)..."
if command -v ufw &>/dev/null; then
  ufw allow 22/tcp    > /dev/null 2>&1
  ufw allow 80/tcp    > /dev/null 2>&1
  ufw allow 443/tcp   > /dev/null 2>&1
  ufw --force enable  > /dev/null 2>&1
  log_ok "Firewall aktif: port 22, 80, 443 dibuka"
else
  log_warn "UFW tidak tersedia, skip konfigurasi firewall"
fi

# ── 13. Jalankan aplikasi dengan PM2 ─────────────────────────────────────────
log_step "Menjalankan aplikasi dengan PM2..."
cd "${APP_DIR}"

# Stop jika sudah ada proses lama
pm2 delete all > /dev/null 2>&1 || true

pm2 start ecosystem.config.js
pm2 startup systemd -u root --hp /root > /dev/null 2>&1
pm2 save

log_ok "Aplikasi berjalan dengan PM2"

# ── 14. Ringkasan ─────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}"
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║         DEPLOYMENT BERHASIL!  ✓             ║"
echo "  ╚══════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "  ${BOLD}Direktori App:${NC} ${APP_DIR}"
echo -e "  ${BOLD}Domain:${NC}        http://${DOMAIN}"
echo ""
echo -e "  ${BOLD}Status PM2:${NC}"
pm2 list
echo ""
echo -e "  ${YELLOW}${BOLD}Langkah selanjutnya:${NC}"
echo -e "  1. Edit file .env:   ${CYAN}nano ${APP_DIR}/backend/.env${NC}"
echo -e "  2. Restart backend:  ${CYAN}pm2 restart ramx-backend${NC}"
echo -e "  3. Pasang SSL:       ${CYAN}apt install -y certbot python3-certbot-nginx${NC}"
echo -e "                       ${CYAN}certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}${NC}"
echo -e "  4. Update file:      ${CYAN}./update.sh${NC}"
echo ""
echo -e "  ${BOLD}Log aplikasi:${NC}"
echo -e "  ${CYAN}pm2 logs ramx-backend${NC}"
echo -e "  ${CYAN}pm2 logs ramx-frontend${NC}"
echo ""
