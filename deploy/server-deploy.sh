#!/usr/bin/env bash
# Deploy di server: clone repo terbaru, build, lalu salin ke web root Nginx.
#
# Mirip pola: cd $HOME && rm -rf <repo> && git clone ... && cd <repo>
#
# Prasyarat di server:
#   - Node.js >= 20 (untuk build) -> install: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs
#   - Nginx sudah ter-setup (jalankan deploy/setup-server.sh sekali)
#
# Cara pakai (di server):
#   bash deploy/server-deploy.sh
#   REPO_URL=... WEB_DIR=/var/www/kampus-dashboard ./deploy/server-deploy.sh
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/baaihq/kampus-dashboard.git}"
REPO_DIR="${REPO_DIR:-$HOME/kampus-dashboard}"
WEB_DIR="${WEB_DIR:-/var/www/kampus-dashboard}"

# Keamanan: web root harus di bawah /var/www agar tidak menghapus folder penting
if [[ "$WEB_DIR" != /var/www/* ]]; then
  echo "Error: WEB_DIR harus di bawah /var/www (sekarang: $WEB_DIR)"
  exit 1
fi

echo "==> Cek Node.js"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js belum terpasang. Install dulu:"
  echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
  echo "  sudo apt-get install -y nodejs"
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

echo "==> Salin hasil build ke $WEB_DIR"
sudo mkdir -p "$WEB_DIR"
sudo rm -rf "$WEB_DIR/"*
sudo cp -r dist/* "$WEB_DIR/"
sudo chown -R www-data:www-data "$WEB_DIR"

echo
echo "=============================================="
echo "Deploy selesai. Buka: http://<alamat-ip-atau-domain>"
echo "=============================================="
