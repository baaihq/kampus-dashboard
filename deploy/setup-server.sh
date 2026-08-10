#!/usr/bin/env bash
# Setup sekali jalan di server Ubuntu:
#   - install Nginx
#   - buat folder aplikasi
#   - tulis & aktifkan konfigurasi situs
#
# Cara pakai:
#   bash setup-server.sh                 # untuk akses via IP (server_name _)
#   bash setup-server.sh kampus.example.com   # untuk domain
set -euo pipefail

APP_DIR="/var/www/kampus-dashboard"
DOMAIN="${1:-_}"

echo "==> Update sistem & install Nginx"
sudo apt-get update
sudo apt-get install -y nginx

echo "==> Siapkan direktori aplikasi: $APP_DIR"
sudo mkdir -p "$APP_DIR"
# Pastikan folder dapat ditulis oleh user SSH yang dipakai deploy (mis. ubuntu)
sudo chown -R "$USER":www-data "$APP_DIR" 2>/dev/null || sudo chown -R www-data:www-data "$APP_DIR"

echo "==> Tulis konfigurasi Nginx"
sudo tee /etc/nginx/sites-available/kampus-dashboard > /dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    root $APP_DIR;
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

echo "==> Aktifkan situs"
sudo ln -sf /etc/nginx/sites-available/kampus-dashboard /etc/nginx/sites-enabled/

echo "==> Uji konfigurasi & reload Nginx"
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx

echo
echo "=============================================="
echo "Setup selesai."
echo "Folder website : $APP_DIR"
echo "Letakkan hasil build (dashboard/dist) di folder tersebut,"
echo "atau gunakan GitHub Actions / deploy.sh."
echo
echo "Firewall (opsional):"
echo "  sudo ufw allow 'Nginx Full'"
echo "  sudo ufw enable"
echo "=============================================="
