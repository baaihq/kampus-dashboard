#!/usr/bin/env bash
# Deploy di server: clone repo terbaru, build, lalu beri izin Nginx membaca hasil build.
# Nginx menyajikan langsung dari $REPO_DIR/dashboard/dist (diatur setup-server.sh).
#
# Cara pakai (di server):
#   bash deploy/server-deploy.sh
#   REPO_DIR=/home/baaihq/kampus-dashboard bash deploy/server-deploy.sh
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/baaihq/kampus-dashboard.git}"
REPO_DIR="${REPO_DIR:-/home/baaihq/kampus-dashboard}"
NGINX_ROOT="$REPO_DIR/dashboard/dist"

echo "==> Cek Node.js"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js belum terpasang. Jalankan dulu: bash install.sh"
  exit 1
fi
node --version

echo "==> Ambil versi terbaru repo"
rm -rf "$REPO_DIR"
git clone "$REPO_URL" "$REPO_DIR"
cd "$REPO_DIR/dashboard"

echo "==> Install dependensi"
npm ci

echo "==> Build produksi"
npm run build

echo "==> Beri izin Nginx membaca hasil build"
sudo chmod o+x "$(dirname "$REPO_DIR")" 2>/dev/null || true
sudo chmod o+x "$REPO_DIR" 2>/dev/null || true
sudo chmod o+x "$REPO_DIR/dashboard" 2>/dev/null || true
sudo chmod -R o+rX "$NGINX_ROOT"

echo
echo "=============================================="
echo "Deploy selesai. Root Nginx: $NGINX_ROOT"
echo "Buka: http://<alamat-IP-atau-domain>"
echo "=============================================="
