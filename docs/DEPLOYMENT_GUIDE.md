# Deployment Guide - QR Order System on Contabo Server

This guide will help you deploy the QR Order System on a Contabo VPS server.

## 📋 Prerequisites

- Contabo VPS with Ubuntu 22.04 LTS (or 20.04)
- Root or sudo access
- Domain name (optional but recommended)
- Basic knowledge of Linux commands

## 🚀 Step 1: Initial Server Setup

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Essential Tools
```bash
sudo apt install -y curl wget git unzip software-properties-common
```

## 🔧 Step 2: Install Required Software

### 2.1 Install PHP 8.2+ and Extensions
```bash
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.2 php8.2-fpm php8.2-cli php8.2-common php8.2-mysql \
    php8.2-zip php8.2-gd php8.2-mbstring php8.2-curl php8.2-xml php8.2-bcmath \
    php8.2-intl php8.2-redis
```

### 2.2 Install Composer
```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer
```

### 2.3 Install Node.js 18+ and npm
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2.4 Install MySQL
```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

### 2.5 Install Nginx
```bash
sudo apt install -y nginx
```

### 2.6 Install Redis (for caching/queues)
```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 2.7 Install PM2 (for managing frontend processes)
```bash
sudo npm install -g pm2
```

## 📁 Step 3: Project Setup

### 3.1 Create Project Directory
```bash
sudo mkdir -p /var/www/qr-order
sudo chown -R $USER:$USER /var/www/qr-order
cd /var/www/qr-order
```

### 3.2 Clone or Upload Project
```bash
# Option 1: If using Git
git clone <your-repo-url> .

# Option 2: Upload via SFTP/SCP
# Upload your project files to /var/www/qr-order
```

### 3.3 Set Proper Permissions
```bash
cd /var/www/qr-order
sudo chown -R www-data:www-data backend/storage backend/bootstrap/cache
sudo chmod -R 775 backend/storage backend/bootstrap/cache
```

## 🗄️ Step 4: Database Setup

### 4.1 Create Database and User
```bash
sudo mysql -u root -p
```

In MySQL:
```sql
CREATE DATABASE qr_order CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'qr_order_user'@'localhost' IDENTIFIED BY 'your_strong_password_here';
GRANT ALL PRIVILEGES ON qr_order.* TO 'qr_order_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## ⚙️ Step 5: Backend Configuration

### 5.1 Install Backend Dependencies
```bash
cd /var/www/qr-order/backend
composer install --optimize-autoloader --no-dev
```

### 5.2 Configure Environment
```bash
cp .env.example .env
nano .env
```

Update these key values in `.env`:
```env
APP_NAME="QR Order System"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=qr_order
DB_USERNAME=qr_order_user
DB_PASSWORD=your_strong_password_here

BROADCAST_DRIVER=pusher
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# Pusher Configuration (get from pusher.com)
PUSHER_APP_ID=your_pusher_app_id
PUSHER_APP_KEY=your_pusher_key
PUSHER_APP_SECRET=your_pusher_secret
PUSHER_APP_CLUSTER=your_cluster

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mail_username
MAIL_PASSWORD=your_mail_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="${APP_NAME}"
```

### 5.3 Generate Application Key
```bash
php artisan key:generate
```

### 5.4 Run Migrations
```bash
php artisan migrate --force
php artisan db:seed --force
```

### 5.5 Optimize Laravel
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 5.6 Create Storage Link
```bash
php artisan storage:link
```

## 🎨 Step 6: Frontend Build

### 6.1 Install Frontend Dependencies
```bash
cd /var/www/qr-order/frontend

# Install dependencies for each app
cd guest && npm install && npm run build
cd ../admin && npm install && npm run build
cd ../kitchen && npm install && npm run build
cd ../landing && npm install && npm run build
```

### 6.2 Update API URLs
Before building, update the API URLs in each frontend app's `.env` or `vite.config.ts`:

**For each frontend app (guest, admin, kitchen, landing):**
```typescript
// In vite.config.ts or .env
VITE_API_URL=https://api.yourdomain.com
```

## 🌐 Step 7: Nginx Configuration

### 7.1 Backend API Configuration
Create `/etc/nginx/sites-available/qr-order-api`:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # or yourdomain.com/api

    root /var/www/qr-order/backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Increase upload size for images
    client_max_body_size 20M;
}
```

### 7.2 Guest App Configuration
Create `/etc/nginx/sites-available/qr-order-guest`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;  # or guest.yourdomain.com

    root /var/www/qr-order/frontend/guest/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7.3 Admin App Configuration
Create `/etc/nginx/sites-available/qr-order-admin`:
```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;

    root /var/www/qr-order/frontend/admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7.4 Kitchen App Configuration
Create `/etc/nginx/sites-available/qr-order-kitchen`:
```nginx
server {
    listen 80;
    server_name kitchen.yourdomain.com;

    root /var/www/qr-order/frontend/kitchen/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7.5 Landing App Configuration
Create `/etc/nginx/sites-available/qr-order-landing`:
```nginx
server {
    listen 80;
    server_name www.yourdomain.com;

    root /var/www/qr-order/frontend/landing/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7.6 Enable Sites
```bash
sudo ln -s /etc/nginx/sites-available/qr-order-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/qr-order-guest /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/qr-order-admin /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/qr-order-kitchen /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/qr-order-landing /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Step 8: SSL Certificate (Let's Encrypt)

### 8.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2 Obtain SSL Certificates
```bash
# For each domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com
sudo certbot --nginx -d admin.yourdomain.com
sudo certbot --nginx -d kitchen.yourdomain.com
```

Certbot will automatically update your Nginx configs with SSL.

### 8.3 Auto-renewal
```bash
sudo certbot renew --dry-run
```

## 🔄 Step 9: Queue Workers & Scheduler

### 9.1 Create Queue Worker Service
Create `/etc/systemd/system/qr-order-queue.service`:
```ini
[Unit]
Description=QR Order Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/qr-order/backend/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=qr-order-queue

[Install]
WantedBy=multi-user.target
```

### 9.2 Create Scheduler Service
Create `/etc/systemd/system/qr-order-scheduler.service`:
```ini
[Unit]
Description=QR Order Scheduler
After=network.target

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/qr-order/backend/artisan schedule:work
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=qr-order-scheduler

[Install]
WantedBy=multi-user.target
```

### 9.3 Enable and Start Services
```bash
sudo systemctl daemon-reload
sudo systemctl enable qr-order-queue
sudo systemctl enable qr-order-scheduler
sudo systemctl start qr-order-queue
sudo systemctl start qr-order-scheduler
```

## 🔍 Step 10: Firewall Configuration

### 10.1 Configure UFW
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 📝 Step 11: Update Frontend API URLs

After deployment, update the API client URLs in each frontend app:

**frontend/guest/src/api/client.ts:**
```typescript
const envUrl = import.meta.env.VITE_API_URL || 'https://api.yourdomain.com';
```

**frontend/admin/src/api/client.ts:**
```typescript
const envUrl = import.meta.env.VITE_API_URL || 'https://api.yourdomain.com';
```

**frontend/kitchen/src/api/client.ts:**
```typescript
const envUrl = import.meta.env.VITE_API_URL || 'https://api.yourdomain.com';
```

**frontend/landing/src/api/client.ts:**
```typescript
const envUrl = import.meta.env.VITE_API_URL || 'https://api.yourdomain.com';
```

Then rebuild all frontend apps (from repo root):
```bash
cd /var/www/qr-order
npm run build:frontend
```
Or use the server script (installs deps, builds all; optional `RUN_AS_USER=www-data` for chown):
```bash
./scripts/build-all-frontend.sh
```

## 🛠️ Step 12: Maintenance Commands

### Clear Cache
```bash
cd /var/www/qr-order/backend
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Update Application
```bash
cd /var/www/qr-order
git pull  # or upload new files

# Backend
cd backend
composer install --optimize-autoloader --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend (build all apps from repo root)
cd /var/www/qr-order
npm run build:frontend

# Restart services
sudo systemctl restart qr-order-queue
sudo systemctl restart qr-order-scheduler
sudo systemctl reload nginx
```

## 🔐 Step 13: Security Checklist

1. ✅ Set `APP_DEBUG=false` in `.env`
2. ✅ Use strong database passwords
3. ✅ Configure firewall (UFW)
4. ✅ Enable SSL certificates
5. ✅ Set proper file permissions
6. ✅ Keep system updated: `sudo apt update && sudo apt upgrade`
7. ✅ Configure fail2ban (optional but recommended)
8. ✅ Set up regular backups

## 📊 Step 14: Monitoring (Optional)

### Install PM2 for Process Monitoring
```bash
pm2 startup
pm2 save
```

### View Logs
```bash
# Laravel logs
tail -f /var/www/qr-order/backend/storage/logs/laravel.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Queue worker logs
sudo journalctl -u qr-order-queue -f

# Scheduler logs
sudo journalctl -u qr-order-scheduler -f
```

## 🌍 Domain Configuration

### DNS Records
Set up these DNS records for your domain:
```
A     @              -> Your Contabo Server IP
A     www            -> Your Contabo Server IP
A     api            -> Your Contabo Server IP
A     admin          -> Your Contabo Server IP
A     kitchen        -> Your Contabo Server IP
```

## 📦 Alternative: Single Domain Setup

If you prefer using a single domain with paths:

### Nginx Configuration (Single Domain)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # API
    location /api {
        alias /var/www/qr-order/backend/public;
        try_files $uri $uri/ /api/index.php?$query_string;
        
        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
            include fastcgi_params;
        }
    }

    # Admin Dashboard
    location /admin {
        alias /var/www/qr-order/frontend/admin/dist;
        try_files $uri $uri/ /admin/index.html;
    }

    # Kitchen Panel
    location /kitchen {
        alias /var/www/qr-order/frontend/kitchen/dist;
        try_files $uri $uri/ /kitchen/index.html;
    }

    # Landing Page
    location / {
        root /var/www/qr-order/frontend/landing/dist;
        try_files $uri $uri/ /index.html;
    }

    # Guest App (if needed separately)
    location /guest {
        alias /var/www/qr-order/frontend/guest/dist;
        try_files $uri $uri/ /guest/index.html;
    }
}
```

## 🚨 Troubleshooting

### Permission Issues
```bash
sudo chown -R www-data:www-data /var/www/qr-order
sudo chmod -R 755 /var/www/qr-order
sudo chmod -R 775 /var/www/qr-order/backend/storage
```

### PHP-FPM Issues
```bash
sudo systemctl restart php8.2-fpm
```

### Nginx Issues
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Database Connection Issues
```bash
# Test MySQL connection
mysql -u qr_order_user -p qr_order
```

## 📞 Support

For issues specific to:
- **Laravel**: Check `backend/storage/logs/laravel.log`
- **Nginx**: Check `/var/log/nginx/error.log`
- **PHP-FPM**: Check `/var/log/php8.2-fpm.log`

## ✅ Deployment Checklist

- [ ] Server updated and secured
- [ ] All software installed (PHP, Node.js, MySQL, Nginx, Redis)
- [ ] Database created and configured
- [ ] Backend dependencies installed
- [ ] Backend `.env` configured
- [ ] Migrations run
- [ ] Frontend apps built
- [ ] Nginx configured for all apps
- [ ] SSL certificates installed
- [ ] Queue workers running
- [ ] Scheduler running
- [ ] Firewall configured
- [ ] DNS records set
- [ ] All services tested

---

**Note**: Replace `yourdomain.com` with your actual domain name throughout this guide.

