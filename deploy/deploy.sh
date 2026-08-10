#!/usr/bin/env bash
# Deploy manual: build dashboard di komputer, lalu kirim hasilnya ke server via rsync.
#
# Cara pakai (dari root proyek):
#   SERVER_HOST=203.0.113.10 ./deploy/deploy.sh
#   SERVER_HOST=203.0.113.10 SERVER_USER=ubuntu SERVER_PATH=/var/www/kampus-dashboard ./deploy/deploy.sh
set -euo pipefail

SERVER_USER="${SERVER_USER:-ubuntu}"
SERVER_HOST="${SERVER_HOST:-}"
SERVER_PATH="${SERVER_PATH:-/var/www/kampus-dashboard}"
DASHBOARD_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../dashboard" && pwd)"

if [[ -z "$SERVER_HOST" ]]; then
  echo "Anda harus mengatur SERVER_HOST terlebih dahulu, contoh:"
  echo "  SERVER_HOST=203.0.113.10 ./deploy/deploy.sh"
  echo "Opsional: SERVER_USER (default: ubuntu), SERVER_PATH (default: /var/www/kampus-dashboard)"
  exit 1
fi

echo "==> Build dashboard"
cd "$DASHBOARD_DIR"
npm run build

echo "==> Rsync ke ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"
rsync -avz --delete "$DASHBOARD_DIR/dist/" "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"

echo
echo "Selesai. Buka: http://${SERVER_HOST}"
