#!/usr/bin/env bash
# Install sekali jalan di Ubuntu:
#   - install git, Node.js 20, Nginx
#   - clone repo ke /home/baaihq/kampus-dashboard
#   - build dashboard
#   - konfigurasi Nginx agar menyajikan hasil build langsung dari folder repo
#
# Cara pakai (di server):
#   bash install.sh                 # untuk akses via IP
#   bash install.sh domain.com      # untuk akses via domain
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/baaihq/kampus-dashboard.git}"
REPO_DIR="${REPO_DIR:-/home/baaihq/kampus-dashboard}"
DOMAIN="${1:-_}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> [1/5] Install git, curl, Node.js & Nginx"
sudo apt-get update
sudo apt-get install -y git curl
if ! command -v node >/dev/null 2>&1; then
  echo "    Menginstall Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
sudo apt-get install -y nginx

echo "==> [2/5] Siapkan repo di $REPO_DIR"
if [[ -f "$SCRIPT_DIR/deploy/setup-server.sh" ]]; then
  echo "    Berjalan dari dalam repo ($SCRIPT_DIR), tidak clone ulang."
  REPO_DIR="$SCRIPT_DIR"
else
  echo "    Clone dari $REPO_URL"
  rm -rf "$REPO_DIR"
  git clone "$REPO_URL" "$REPO_DIR"
fi
cd "$REPO_DIR"

echo "==> [3/5] Build dashboard"
cd "$REPO_DIR/dashboard"
npm ci
npm run build

echo "==> [4/5] Konfigurasi Nginx (root: $REPO_DIR/dashboard/dist)"
bash "$REPO_DIR/deploy/setup-server.sh" "$DOMAIN" "$REPO_DIR"

echo "==> [5/5] Selesai"
echo
echo "  Folder repo : $REPO_DIR"
echo "  Nginx root  : $REPO_DIR/dashboard/dist"
echo "  Buka        : http://<alamat-IP-atau-domain>"
echo
echo "Untuk update nanti cukup jalankan: bash $REPO_DIR/deploy/server-deploy.sh"
