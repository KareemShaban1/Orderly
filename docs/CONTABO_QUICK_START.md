# Contabo Quick Start Guide

## 🎯 Quick Deployment Steps

### 1. Connect to Your Contabo Server
```bash
ssh root@your-contabo-ip
```

### 2. Run Initial Setup Script
```bash
# Download and run setup
curl -fsSL https://raw.githubusercontent.com/your-repo/setup.sh | bash
# OR manually follow the steps below
```

### 3. Manual Quick Setup

#### Install Everything
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PHP 8.2
sudo add-apt-repository ppa:ondrej/php -y
sudo apt install -y php8.2 php8.2-fpm php8.2-cli php8.2-mysql php8.2-zip \
    php8.2-gd php8.2-mbstring php8.2-curl php8.2-xml php8.2-bcmath php8.2-redis

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL, Nginx, Redis
sudo apt install -y mysql-server nginx redis-server
```

#### Setup Project
```bash
# Create directory
sudo mkdir -p /var/www/qr-order
cd /var/www/qr-order

# Upload your project files (via SFTP/SCP or Git)
# Then:
sudo chown -R www-data:www-data /var/www/qr-order
sudo chmod -R 775 /var/www/qr-order/backend/storage
```

#### Database Setup
```bash
sudo mysql -u root -p
# Then in MySQL:
CREATE DATABASE qr_order;
CREATE USER 'qr_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL ON qr_order.* TO 'qr_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Backend Setup
```bash
cd /var/www/qr-order/backend
composer install --no-dev
cp .env.example .env
nano .env  # Configure database and other settings
php artisan key:generate
php artisan migrate --force
php artisan config:cache
```

#### Frontend Build
```bash
cd /var/www/qr-order/frontend
cd guest && npm install && npm run build
cd ../admin && npm install && npm run build
cd ../kitchen && npm install && npm run build
cd ../landing && npm install && npm run build
```

#### Nginx Setup
```bash
# Copy nginx configs from nginx-config-example.conf
sudo nano /etc/nginx/sites-available/qr-order-api
# Paste API config, update domain names

sudo ln -s /etc/nginx/sites-available/qr-order-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### SSL Setup
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 📝 Important Notes

1. **Domain Setup**: Update all `yourdomain.com` references in configs
2. **Environment Variables**: Configure `.env` file properly
3. **API URLs**: Update frontend apps to point to your API domain
4. **Firewall**: `sudo ufw allow 'Nginx Full'`
5. **Queue Workers**: Set up systemd services for queue workers

## 🔗 Useful Commands

```bash
# View logs
tail -f /var/www/qr-order/backend/storage/logs/laravel.log
sudo tail -f /var/log/nginx/error.log

# Restart services
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx
sudo systemctl restart mysql

# Clear cache
cd /var/www/qr-order/backend
php artisan cache:clear
php artisan config:clear
```

## 📚 Full Documentation

See `DEPLOYMENT_GUIDE.md` for complete step-by-step instructions.

