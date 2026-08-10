#!/usr/bin/env bash
# Setup Nginx di Ubuntu agar menyajikan hasil build dashboard.
# Nginx membaca langsung dari folder repo (dist), tidak menyalin ke /var/www.
#
# Cara pakai:
#   bash setup-server.sh                       # domain/IP otomatis (_)
#   bash setup-server.sh domain.com            # dengan domain
#   bash setup-server.sh domain.com /home/baaihq/kampus-dashboard
set -euo pipefail

DOMAIN="${1:-_}"
REPO_DIR="${2:-${REPO_DIR:-/home/baaihq/kampus-dashboard}}"
NGINX_ROOT="$REPO_DIR/dashboard/dist"

echo "==> Install Nginx"
sudo apt-get update
sudo apt-get install -y nginx

echo "==> Izinkan Nginx mengakses folder repo ($REPO_DIR)"
sudo chmod o+x "$(dirname "$REPO_DIR")" 2>/dev/null || true
sudo chmod o+x "$REPO_DIR" 2>/dev/null || true
sudo chmod o+x "$REPO_DIR/dashboard" 2>/dev/null || true
sudo chmod -R o+rX "$NGINX_ROOT" 2>/dev/null || true

echo "==> Tulis konfigurasi Nginx (root: $NGINX_ROOT)"
sudo tee /etc/nginx/sites-available/kampus-dashboard > /dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    root $NGINX_ROOT;
    index index.html;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|woff2|woff|png|jpg|jpeg|gif|svg|ico|json)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }
}
NGINX

echo "==> Aktifkan situs & reload Nginx"
sudo ln -sf /etc/nginx/sites-available/kampus-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx

echo
echo "=============================================="
echo "Nginx siap. Root: $NGINX_ROOT"
echo "Firewall (opsional): sudo ufw allow 'Nginx Full' && sudo ufw enable"
echo "=============================================="
