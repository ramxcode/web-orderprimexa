#!/bin/bash
# =============================================================================
#  update-vps.sh — Update Primexa ke VPS (setelah ada perubahan kode)
#  Jalankan dari Git Bash di folder project:
#    bash update-vps.sh           → update semua file + restart
#    bash update-vps.sh --backend → update backend saja
#    bash update-vps.sh --env     → update file .env saja
# =============================================================================

set -e

# ── Konfigurasi ───────────────────────────────────────────────────────────────
VPS_IP="31.56.56.238"
VPS_USER="root"
APP_DIR="/var/www/primexa"
SSH_KEY="$HOME/.ssh/primexa_vps"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=15"
MODE="${1:-all}"

# ── Warna ─────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log_step() { echo -e "\n${BLUE}${BOLD}━━━ $1 ━━━${NC}"; }
log_ok()   { echo -e "  ${GREEN}✔${NC}  $1"; }
log_info() { echo -e "  ${CYAN}→${NC}  $1"; }

LOCAL_DIR="$(pwd)"
START_TIME=$(date +%s)

echo -e "\n${CYAN}${BOLD}  ╔════════════════════════════════════════╗"
echo "  ║   PRIMEXA — Update VPS ($MODE)       ║"
echo -e "  ╚════════════════════════════════════════╝${NC}\n"

# ── Test SSH ──────────────────────────────────────────────────────────────────
log_info "Koneksi ke VPS $VPS_IP..."
ssh $SSH_OPTS "$VPS_USER@$VPS_IP" "echo OK" > /dev/null \
  || { echo "  ✖ Gagal koneksi SSH. Jalankan deploy-vps.sh dulu!"; exit 1; }
log_ok "Koneksi SSH OK"

# ── Upload & Restart ──────────────────────────────────────────────────────────
case "$MODE" in

  --backend)
    log_step "Update Backend Saja"
    log_info "Upload folder backend..."
    rsync -avz --progress \
      -e "ssh $SSH_OPTS" \
      --exclude='node_modules/' \
      --exclude='.env' \
      "$LOCAL_DIR/backend/" "$VPS_USER@$VPS_IP:$APP_DIR/backend/"

    log_info "Install dependencies & restart backend..."
    ssh $SSH_OPTS "$VPS_USER@$VPS_IP" bash << REMOTE
cd $APP_DIR/backend
npm install --production --silent 2>&1 | tail -2
pm2 restart primexa-backend
pm2 list
REMOTE
    log_ok "Backend berhasil diupdate!"
    ;;

  --env)
    log_step "Update File .env Saja"
    [ -f "$LOCAL_DIR/.env" ] && {
      scp $SSH_OPTS "$LOCAL_DIR/.env" "$VPS_USER@$VPS_IP:$APP_DIR/.env"
      log_ok "Root .env diupload"
    }
    [ -f "$LOCAL_DIR/backend/.env" ] && {
      scp $SSH_OPTS "$LOCAL_DIR/backend/.env" "$VPS_USER@$VPS_IP:$APP_DIR/backend/.env"
      log_ok "Backend .env diupload"
    }
    ssh $SSH_OPTS "$VPS_USER@$VPS_IP" "pm2 restart primexa-backend && pm2 list"
    log_ok "File .env berhasil diupdate & backend direstart!"
    ;;

  *)
    # Default: update semua
    log_step "Upload Semua File"
    log_info "Mengupload perubahan file..."
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

    log_info "Upload .env files..."
    [ -f "$LOCAL_DIR/.env" ] && \
      scp $SSH_OPTS "$LOCAL_DIR/.env" "$VPS_USER@$VPS_IP:$APP_DIR/.env" && \
      log_ok "Root .env diupload"
    [ -f "$LOCAL_DIR/backend/.env" ] && \
      scp $SSH_OPTS "$LOCAL_DIR/backend/.env" "$VPS_USER@$VPS_IP:$APP_DIR/backend/.env" && \
      log_ok "Backend .env diupload"

    log_step "Install Dependencies & Restart"
    ssh $SSH_OPTS "$VPS_USER@$VPS_IP" bash << REMOTE
cd $APP_DIR/backend
npm install --production --silent 2>&1 | tail -2
echo "✔ Dependencies updated"
cd $APP_DIR
pm2 restart ecosystem.config.js
echo ""
pm2 list
REMOTE
    log_ok "Semua file berhasil diupdate!"
    ;;
esac

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${GREEN}${BOLD}  ✔ Update selesai dalam ${DURATION} detik!${NC}"
echo -e "  ${CYAN}Log: ssh -i $SSH_KEY root@$VPS_IP 'pm2 logs primexa-backend --lines 20'${NC}"
echo ""
