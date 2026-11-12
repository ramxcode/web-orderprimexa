#!/bin/bash
# =============================================================================
#  deploy-vps.sh — Full Auto Deploy Primexa ke VPS (31.56.56.238)
#  Jalankan dari Git Bash di folder project:
#    bash deploy-vps.sh
#
#  Apa yang dilakukan script ini secara OTOMATIS:
#  1. Setup SSH key (jika belum ada)
#  2. Upload semua file project ke VPS via rsync
#  3. Upload file .env ke VPS via scp
#  4. Install Node.js 20, PM2, Nginx, Certbot di VPS
#  5. Install npm dependencies backend
#  6. Konfigurasi Nginx (reverse proxy)
#  7. Setup Firewall UFW
#  8. Jalankan aplikasi dengan PM2
#  9. Pasang SSL HTTPS (jika DNS sudah propagate)
# =============================================================================

set -e

# ── Konfigurasi ───────────────────────────────────────────────────────────────
VPS_IP="31.56.56.238"
VPS_USER="root"
APP_DIR="/var/www/primexa"
DOMAIN="primexa.web.id"
FRONTEND_PORT=5500
BACKEND_PORT=5000
SSH_KEY="$HOME/.ssh/primexa_vps"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=15"

# ── Warna Output ──────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log_banner() {
  echo -e "\n${CYAN}${BOLD}"
  echo "  ╔══════════════════════════════════════════════════╗"
  echo "  ║      PRIMEXA — Full Auto Deploy ke VPS           ║"
  echo "  ║      VPS: $VPS_IP | Domain: $DOMAIN   ║"
  echo "  ╚══════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

log_step() { echo -e "\n${BLUE}${BOLD}━━━ $1 ━━━${NC}"; }
log_ok()   { echo -e "  ${GREEN}✔${NC}  $1"; }
log_warn() { echo -e "  ${YELLOW}⚠${NC}  $1"; }
log_err()  { echo -e "  ${RED}✖${NC}  $1\n"; exit 1; }
log_info() { echo -e "  ${CYAN}→${NC}  $1"; }

log_banner

# ── Cek running dari folder project ──────────────────────────────────────────
if [ ! -f "ecosystem.config.js" ] || [ ! -f "server-frontend.js" ]; then
  log_err "Jalankan script ini dari root folder project Primexa!"
fi
LOCAL_DIR="$(pwd)"
log_ok "Folder project: $LOCAL_DIR"

# =============================================================================
# STEP 1 — Setup SSH Key
# =============================================================================
log_step "STEP 1/8 — Setup SSH Key"

if [ ! -f "$SSH_KEY" ]; then
  log_info "SSH key belum ada. Membuat SSH key baru..."
  ssh-keygen -t ed25519 -C "deploy-primexa" -f "$SSH_KEY" -N ""
  log_ok "SSH key dibuat: $SSH_KEY"
fi

# Test apakah koneksi SSH bisa tanpa password
log_info "Testing koneksi SSH ke $VPS_IP..."
if ssh $SSH_OPTS "$VPS_USER@$VPS_IP" "echo connected" &>/dev/null; then
  log_ok "Koneksi SSH berhasil (tanpa password)!"
else
  log_warn "Koneksi tanpa password belum bisa. Mendaftarkan SSH key..."
  log_warn "Masukkan PASSWORD ROOT VPS saat diminta:"
  ssh-copy-id -i "${SSH_KEY}.pub" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" \
    || log_err "Gagal mendaftarkan SSH key. Pastikan password VPS benar!"
  log_ok "SSH key berhasil didaftarkan!"
fi

# =============================================================================
# STEP 2 — Upload File Project ke VPS via rsync
# =============================================================================
log_step "STEP 2/8 — Upload file project ke VPS via rsync"

# Buat direktori di VPS terlebih dahulu
ssh $SSH_OPTS "$VPS_USER@$VPS_IP" "mkdir -p $APP_DIR"

log_info "Mengupload file project (kecuali node_modules & .env)..."
rsync -avz --progress \
  -e "ssh $SSH_OPTS" \
  --exclude='node_modules/' \
  --exclude='backend/node_modules/' \
  --exclude='.git/' \
  --exclude='.env' \
  --exclude='backend/.env' \
  --exclude='*.bat' \
  --exclude='*.ps1' \
  --exclude='.DS_Store' \
  --exclude='Thumbs.db' \
  --exclude='*.log' \
  --exclude='deploy-vps.sh' \
  --exclude='update-vps.sh' \
  --exclude='deployment_guide.md' \
  "$LOCAL_DIR/" "$VPS_USER@$VPS_IP:$APP_DIR/"

log_ok "Semua file berhasil diupload!"

# =============================================================================
# STEP 3 — Upload File .env ke VPS
# =============================================================================
log_step "STEP 3/8 — Upload file .env ke VPS"

if [ -f "$LOCAL_DIR/.env" ]; then
  scp $SSH_OPTS "$LOCAL_DIR/.env" "$VPS_USER@$VPS_IP:$APP_DIR/.env"
  log_ok "Root .env berhasil diupload"
else
  log_warn "File .env root tidak ditemukan di $LOCAL_DIR/.env — skip."
fi

if [ -f "$LOCAL_DIR/backend/.env" ]; then
  scp $SSH_OPTS "$LOCAL_DIR/backend/.env" "$VPS_USER@$VPS_IP:$APP_DIR/backend/.env"
  log_ok "Backend .env berhasil diupload"
else
  log_warn "File backend/.env tidak ditemukan — skip."
fi

# =============================================================================
# STEP 4 — Generate Nginx Config & Upload
# =============================================================================
log_step "STEP 4/8 — Generate & Upload konfigurasi Nginx"

# Generate nginx config ke file temp lokal (literal $ untuk nginx vars)
cat > "/tmp/primexa-nginx.conf" << 'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name primexa.web.id www.primexa.web.id;

    # ── Ukuran upload max ──────────────────────────────────────
    client_max_body_size 10M;

    # ── API Backend (/api/*) → port 5000 ──────────────────────
    location /api/ {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # ── Telegram Webhook ──────────────────────────────────────
    location /webhook/ {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # ── Frontend → port 5500 ───────────────────────────────────
    location / {
        proxy_pass         http://127.0.0.1:5500;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # ── Gzip & Security ───────────────────────────────────────
    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1000;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
NGINXEOF

# Upload nginx config ke VPS
scp $SSH_OPTS "/tmp/primexa-nginx.conf" "$VPS_USER@$VPS_IP:/tmp/primexa-nginx.conf"
log_ok "Nginx config berhasil diupload ke VPS"

# =============================================================================
# STEP 5 — Install Software di VPS (Node.js, PM2, Nginx, Certbot)
# =============================================================================
log_step "STEP 5/8 — Install software di VPS"

ssh $SSH_OPTS "$VPS_USER@$VPS_IP" bash << INSTALL_SCRIPT
set -e

echo "→ Update package list..."
apt-get update -qq

# ── Node.js 20 LTS ────────────────────────────────────────────
if command -v node &>/dev/null; then
  NODE_VER=\$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "\$NODE_VER" -ge 18 ]; then
    echo "✔ Node.js \$(node -v) sudah terinstall"
  else
    echo "→ Upgrade Node.js ke versi 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y nodejs -qq
    echo "✔ Node.js \$(node -v) berhasil diinstall"
  fi
else
  echo "→ Install Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
  apt-get install -y nodejs -qq
  echo "✔ Node.js \$(node -v) berhasil diinstall"
fi

# ── PM2 ───────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  echo "→ Install PM2..."
  npm install -g pm2 --silent
fi
echo "✔ PM2 \$(pm2 -v) siap"

# ── Nginx ─────────────────────────────────────────────────────
if ! command -v nginx &>/dev/null; then
  echo "→ Install Nginx..."
  apt-get install -y nginx -qq
fi
systemctl enable nginx > /dev/null 2>&1
systemctl start nginx > /dev/null 2>&1
echo "✔ Nginx siap"

# ── Certbot ───────────────────────────────────────────────────
if ! command -v certbot &>/dev/null; then
  echo "→ Install Certbot..."
  apt-get install -y certbot python3-certbot-nginx -qq
fi
echo "✔ Certbot siap"

echo ""
echo "✔ Semua software berhasil diinstall!"
INSTALL_SCRIPT

log_ok "Software VPS berhasil diinstall!"

# =============================================================================
# STEP 6 — Install Dependencies & Konfigurasi
# =============================================================================
log_step "STEP 6/8 — Install npm dependencies & konfigurasi Nginx"

ssh $SSH_OPTS "$VPS_USER@$VPS_IP" bash << CONFIG_SCRIPT
set -e
APP_DIR="$APP_DIR"

# Install npm dependencies backend
echo "→ Install npm dependencies backend..."
cd \$APP_DIR/backend
npm install --production --silent 2>&1 | tail -3
echo "✔ Dependencies backend terinstall"

# Buat log directory PM2
mkdir -p /var/log/pm2

# Aktifkan Nginx config
cp /tmp/primexa-nginx.conf /etc/nginx/sites-available/primexa
ln -sf /etc/nginx/sites-available/primexa /etc/nginx/sites-enabled/primexa
rm -f /etc/nginx/sites-enabled/default

# Test & reload Nginx
nginx -t && systemctl reload nginx
echo "✔ Nginx berhasil dikonfigurasi untuk domain $DOMAIN"

# Setup Firewall
echo "→ Setup firewall..."
ufw allow 22/tcp  > /dev/null 2>&1
ufw allow 80/tcp  > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1
echo "✔ Firewall aktif: port 22, 80, 443 dibuka"
CONFIG_SCRIPT

log_ok "Konfigurasi selesai!"

# =============================================================================
# STEP 7 — Jalankan Aplikasi dengan PM2
# =============================================================================
log_step "STEP 7/8 — Jalankan aplikasi dengan PM2"

ssh $SSH_OPTS "$VPS_USER@$VPS_IP" bash << PM2_SCRIPT
set -e
APP_DIR="$APP_DIR"

cd \$APP_DIR

# Bersihkan proses PM2 lama
echo "→ Membersihkan proses PM2 lama..."
pm2 delete all > /dev/null 2>&1 || true

# Start semua proses via ecosystem
echo "→ Menjalankan primexa-backend & primexa-frontend..."
pm2 start ecosystem.config.js

# Setup auto-start saat VPS reboot
echo "→ Setup PM2 auto-start..."
pm2 startup systemd -u root --hp /root > /tmp/pm2_startup_cmd.txt 2>&1 || true
# Jalankan perintah systemctl yang dihasilkan pm2 startup
STARTUP_CMD=\$(grep "sudo env" /tmp/pm2_startup_cmd.txt | head -1 || true)
if [ -n "\$STARTUP_CMD" ]; then
  eval \$STARTUP_CMD > /dev/null 2>&1 || true
fi
systemctl enable pm2-root > /dev/null 2>&1 || true

# Simpan konfigurasi PM2
pm2 save
echo ""
echo "✔ PM2 Status:"
pm2 list
PM2_SCRIPT

log_ok "Aplikasi berhasil dijalankan dengan PM2!"

# =============================================================================
# STEP 8 — Pasang SSL HTTPS
# =============================================================================
log_step "STEP 8/8 — Pasang SSL HTTPS (Let's Encrypt)"

log_info "Memeriksa DNS propagation untuk $DOMAIN..."

# Cek DNS dari lokal
DNS_RESOLVED=$(nslookup "$DOMAIN" 2>/dev/null | awk '/^Address: /{print $2}' | grep -v "127\." | head -1 || echo "")

if [ "$DNS_RESOLVED" = "$VPS_IP" ]; then
  log_ok "DNS sudah pointing ke VPS! ($DNS_RESOLVED)"
  log_info "Memasang SSL certificate..."

  ssh $SSH_OPTS "$VPS_USER@$VPS_IP" \
    "certbot --nginx -d $DOMAIN -d www.$DOMAIN \
     --non-interactive --agree-tos \
     --email admin@$DOMAIN \
     --redirect" \
  && {
    log_ok "SSL HTTPS berhasil dipasang!"
    ssh $SSH_OPTS "$VPS_USER@$VPS_IP" "nginx -t && systemctl reload nginx"
  } || {
    log_warn "SSL gagal dipasang otomatis."
    log_info "Pasang manual dengan: ssh -i $SSH_KEY root@$VPS_IP 'certbot --nginx -d $DOMAIN -d www.$DOMAIN'"
  }
else
  log_warn "DNS belum propagate (resolved: ${DNS_RESOLVED:-tidak ditemukan}, expected: $VPS_IP)"
  log_warn "SSL akan dipasang manual setelah DNS OK."
  log_info "Perintah pasang SSL (jalankan nanti):"
  echo ""
  echo "    ssh -i $SSH_KEY root@$VPS_IP \\"
  echo "      'certbot --nginx -d $DOMAIN -d www.$DOMAIN'"
  echo ""
fi

# =============================================================================
# RINGKASAN DEPLOYMENT
# =============================================================================
echo ""
echo -e "${GREEN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════╗"
echo "  ║         DEPLOYMENT PRIMEXA SELESAI! ✔            ║"
echo "  ╚══════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  ${BOLD}VPS IP:${NC}        $VPS_IP"
echo -e "  ${BOLD}Domain:${NC}        http://$DOMAIN"
echo -e "  ${BOLD}App Dir VPS:${NC}   $APP_DIR"
echo -e "  ${BOLD}SSH Key:${NC}       $SSH_KEY"
echo ""
echo -e "  ${YELLOW}${BOLD}Perintah berguna:${NC}"
echo -e "  ${CYAN}# Lihat status PM2${NC}"
echo -e "  ssh -i $SSH_KEY root@$VPS_IP 'pm2 list'"
echo ""
echo -e "  ${CYAN}# Lihat log backend${NC}"
echo -e "  ssh -i $SSH_KEY root@$VPS_IP 'pm2 logs primexa-backend --lines 30'"
echo ""
echo -e "  ${CYAN}# Update file setelah ada perubahan${NC}"
echo -e "  bash update-vps.sh"
echo ""
echo -e "  ${CYAN}# Pasang SSL (jika DNS sudah OK)${NC}"
echo -e "  ssh -i $SSH_KEY root@$VPS_IP 'certbot --nginx -d $DOMAIN -d www.$DOMAIN'"
echo ""
