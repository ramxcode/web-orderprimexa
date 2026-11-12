#!/bin/bash
# =============================================================================
#  update.sh — Update RamxPremium di VPS
#  Jalankan setiap kali ada perubahan di frontend atau backend
#
#  Usage:
#    ./update.sh              # Update dari rsync (default)
#    ./update.sh --git        # Update via git pull
#    ./update.sh --backend    # Update backend saja
#    ./update.sh --frontend   # Update frontend saja
# =============================================================================

set -e

# ── Konfigurasi ──────────────────────────────────────────────────────────────
APP_DIR="/var/www/ramxpremium"
LOG_FILE="/var/log/ramxpremium-update.log"

# Warna output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

print_banner() {
  echo -e "${CYAN}"
  echo "  ╔══════════════════════════════════════════╗"
  echo "  ║   RamxPremium — Update Script           ║"
  echo "  ║   ${TIMESTAMP}          ║"
  echo "  ╚══════════════════════════════════════════╝"
  echo -e "${NC}"
}

log_step() { echo -e "\n${BLUE}${BOLD}[STEP]${NC} $1"; echo "[${TIMESTAMP}] STEP: $1" >> "${LOG_FILE}"; }
log_ok()   { echo -e "  ${GREEN}✔${NC}  $1"; echo "[${TIMESTAMP}] OK: $1" >> "${LOG_FILE}"; }
log_warn() { echo -e "  ${YELLOW}⚠${NC}  $1"; echo "[${TIMESTAMP}] WARN: $1" >> "${LOG_FILE}"; }
log_err()  { echo -e "  ${RED}✖${NC}  $1"; echo "[${TIMESTAMP}] ERR: $1" >> "${LOG_FILE}"; }
log_info() { echo -e "  ${CYAN}→${NC}  $1"; }

print_banner

# ── Parse argumen ─────────────────────────────────────────────────────────────
MODE="rsync"       # default: rsync dari folder lokal
TARGET="all"       # default: update semua

for arg in "$@"; do
  case $arg in
    --git)      MODE="git" ;;
    --backend)  TARGET="backend" ;;
    --frontend) TARGET="frontend" ;;
    --all)      TARGET="all" ;;
    *)
      log_err "Argumen tidak dikenal: $arg"
      echo "  Gunakan: ./update.sh [--git] [--backend|--frontend|--all]"
      exit 1
      ;;
  esac
done

log_info "Mode: ${MODE} | Target: ${TARGET}"

# ── Cek direktori app ─────────────────────────────────────────────────────────
if [[ ! -d "$APP_DIR" ]]; then
  log_err "Direktori ${APP_DIR} tidak ditemukan!"
  log_err "Jalankan deploy.sh terlebih dahulu."
  exit 1
fi

# ── Simpan waktu mulai ────────────────────────────────────────────────────────
START_TIME=$(date +%s)

# =============================================================================
#  MODE 1: Update via Git Pull
# =============================================================================
if [[ "$MODE" == "git" ]]; then
  log_step "Update via Git Pull..."

  cd "${APP_DIR}"

  if [[ ! -d ".git" ]]; then
    log_err "Direktori ${APP_DIR} bukan git repository!"
    log_err "Init git dulu: git init && git remote add origin <repo-url>"
    exit 1
  fi

  # Stash perubahan lokal (terutama .env) agar tidak tertimpa
  git stash --include-untracked > /dev/null 2>&1 || true

  # Pull dari remote
  BRANCH=$(git branch --show-current)
  log_info "Pulling dari branch: ${BRANCH}..."
  git pull origin "${BRANCH}"

  # Kembalikan .env yang di-stash
  git stash pop > /dev/null 2>&1 || true

  log_ok "Git pull berhasil"
fi

# =============================================================================
#  MODE 2: Update via Rsync (dari komputer lokal)
# =============================================================================
if [[ "$MODE" == "rsync" ]]; then
  log_step "Update via Rsync..."
  log_info "File akan disync dari direktori script ini ke ${APP_DIR}"

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  # Jika script dijalankan dari app dir sendiri (di VPS), skip rsync
  if [[ "$SCRIPT_DIR" == "$APP_DIR" ]]; then
    log_warn "Script dijalankan dari ${APP_DIR} — skip rsync (sudah di tempat yang benar)"
    log_info "Untuk update dari komputer lokal, jalankan dari PC/laptop:"
    log_info "  rsync -avz --exclude='node_modules' --exclude='.env' --exclude='.git' \\"
    log_info "    ./ user@IP_VPS:${APP_DIR}/"
    log_info "  ssh user@IP_VPS '${APP_DIR}/update.sh --git'"
  else
    # Rsync dari lokasi script ke app dir
    rsync -az --progress \
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
      --delete \
      "${SCRIPT_DIR}/" "${APP_DIR}/"
    log_ok "Rsync selesai"
  fi
fi

# =============================================================================
#  Install / Update Dependencies Backend (jika ada perubahan package.json)
# =============================================================================
check_backend_deps() {
  local PKG="${APP_DIR}/backend/package.json"
  local LOCK="${APP_DIR}/backend/package-lock.json"
  local MOD="${APP_DIR}/backend/node_modules"

  if [[ ! -d "$MOD" ]]; then
    return 0  # node_modules belum ada, perlu install
  fi

  # Cek apakah package.json lebih baru dari node_modules
  if [[ "$PKG" -nt "$MOD" ]] || [[ "$LOCK" -nt "$MOD" ]]; then
    return 0  # package.json berubah, perlu install
  fi

  return 1  # Tidak perlu install
}

log_step "Memeriksa dependencies backend..."
if check_backend_deps; then
  log_info "package.json berubah — menginstall ulang dependencies..."
  cd "${APP_DIR}/backend"
  npm install --production --silent
  log_ok "Dependencies backend diperbarui ($(du -sh node_modules | cut -f1))"
else
  log_ok "Dependencies backend up-to-date, skip install"
fi

# =============================================================================
#  Reload PM2 — Zero Downtime
# =============================================================================
log_step "Merestart aplikasi dengan PM2..."

cd "${APP_DIR}"

# Pastikan ecosystem.config.js ada
if [[ ! -f "${APP_DIR}/ecosystem.config.js" ]]; then
  log_warn "ecosystem.config.js tidak ditemukan, membuat ulang..."
  # Buat minimal ecosystem config
  cat > "${APP_DIR}/ecosystem.config.js" << 'ECOEOF'
module.exports = {
  apps: [
    {
      name: 'ramx-backend',
      script: 'backend/server.js',
      cwd: '/var/www/ramxpremium',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: { NODE_ENV: 'production', PORT: 5000 }
    },
    {
      name: 'ramx-frontend',
      script: 'server-frontend.js',
      cwd: '/var/www/ramxpremium',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: { NODE_ENV: 'production', FRONTEND_PORT: 5500 }
    }
  ]
};
ECOEOF
  log_ok "ecosystem.config.js dibuat ulang"
fi

# Reload berdasarkan target
if [[ "$TARGET" == "backend" ]]; then
  if pm2 list | grep -q "ramx-backend"; then
    pm2 reload ramx-backend --update-env
    log_ok "Backend (ramx-backend) direload"
  else
    pm2 start ecosystem.config.js --only ramx-backend
    log_ok "Backend (ramx-backend) dijalankan"
  fi

elif [[ "$TARGET" == "frontend" ]]; then
  if pm2 list | grep -q "ramx-frontend"; then
    pm2 reload ramx-frontend --update-env
    log_ok "Frontend (ramx-frontend) direload"
  else
    pm2 start ecosystem.config.js --only ramx-frontend
    log_ok "Frontend (ramx-frontend) dijalankan"
  fi

else
  # Update semua
  if pm2 list | grep -q "ramx-"; then
    pm2 reload ecosystem.config.js --update-env
    log_ok "Semua proses direload (zero downtime)"
  else
    pm2 start ecosystem.config.js
    log_ok "Semua proses dijalankan"
  fi
fi

pm2 save > /dev/null 2>&1

# =============================================================================
#  Reload Nginx (jika ada perubahan konfigurasi)
# =============================================================================
log_step "Memeriksa Nginx..."
if nginx -t > /dev/null 2>&1; then
  systemctl reload nginx
  log_ok "Nginx direload"
else
  log_warn "Konfigurasi Nginx ada masalah, skip reload"
  nginx -t
fi

# =============================================================================
#  Ringkasan
# =============================================================================
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo ""
echo -e "${GREEN}${BOLD}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║       UPDATE SELESAI!  ✓            ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  ${BOLD}Waktu:${NC}  ${ELAPSED} detik"
echo -e "  ${BOLD}Mode:${NC}   ${MODE} | Target: ${TARGET}"
echo -e "  ${BOLD}Log:${NC}    ${LOG_FILE}"
echo ""
echo -e "  ${BOLD}Status PM2:${NC}"
pm2 list
echo ""
echo -e "  ${BOLD}Perintah berguna:${NC}"
echo -e "  ${CYAN}pm2 logs ramx-backend --lines 50${NC}   # Log backend"
echo -e "  ${CYAN}pm2 logs ramx-frontend --lines 50${NC}  # Log frontend"
echo -e "  ${CYAN}pm2 monit${NC}                           # Monitor realtime"
echo ""
echo "[${TIMESTAMP}] Update selesai dalam ${ELAPSED}s (mode=${MODE}, target=${TARGET})" >> "${LOG_FILE}"
