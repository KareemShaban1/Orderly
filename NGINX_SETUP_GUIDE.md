# Nginx Configuration Guide for Orderly System

## 📋 Overview

This guide explains how to configure Nginx for your Orderly QR Order System on your server.

## 🗂️ Project Structure

Your project should be organized like this:

```
/www/wwwroot/orderly.kareemsoft.org/
├── backend/              # Laravel API
│   └── public/           # Laravel public directory
├── frontend/
│   ├── guest/
│   │   └── dist/         # Built Guest App (PWA)
│   ├── admin/
│   │   └── dist/         # Built Admin Dashboard
│   ├── kitchen/
│   │   └── dist/         # Built Kitchen Panel
│   └── landing/
│       └── dist/         # Built Landing Page (optional)
```

## 🔧 Configuration Steps

### Step 1: Upload Project Files

Upload your project to `/www/wwwroot/orderly.kareemsoft.org/`:

```bash
# Structure should be:
/www/wwwroot/orderly.kareemsoft.org/
├── backend/
├── frontend/
│   ├── guest/dist/
│   ├── admin/dist/
│   ├── kitchen/dist/
│   └── landing/dist/
```

### Step 2: Set Permissions

```bash
cd /www/wwwroot/orderly.kareemsoft.org
chown -R www:www backend/storage backend/bootstrap/cache
chmod -R 775 backend/storage backend/bootstrap/cache
```

### Step 3: Configure Nginx

#### Option A: Using Control Panel (Recommended)

1. **Login to your control panel** (BT Panel/BaoTa Panel)
2. **Go to Website Management** → Select `orderly.kareemsoft.org`
3. **Click "Configuration"** or "Settings"
4. **Replace the Nginx configuration** with the content from `nginx-orderly-config.conf`
5. **Save and reload Nginx**

#### Option B: Manual Configuration

1. **Edit the Nginx config file:**
   ```bash
   nano /www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf
   ```

2. **Replace the content** with the configuration from `nginx-orderly-config.conf`

3. **Test the configuration:**
   ```bash
   nginx -t
   ```

4. **Reload Nginx:**
   ```bash
   systemctl reload nginx
   # or
   /etc/init.d/nginx reload
   ```

### Step 4: Update PHP-FPM Socket Path

In the Nginx config, check your PHP-FPM socket path. Common paths:
- `/tmp/php-cgi-82.sock` (PHP 8.2)
- `/tmp/php-cgi-81.sock` (PHP 8.1)
- `/var/run/php/php8.2-fpm.sock` (standard)

To find your PHP-FPM socket:
```bash
# Check PHP-FPM config
cat /www/server/php/82/etc/php-fpm.conf | grep listen
# or
ls -la /tmp/php-cgi-*.sock
```

Update the `fastcgi_pass` line in the Nginx config accordingly.

## 🌐 URL Structure

After configuration, your URLs will be:

- **API Backend**: `http://orderly.kareemsoft.org/api`
- **Guest App (PWA)**: `http://orderly.kareemsoft.org/` (root)
- **Admin Dashboard**: `http://orderly.kareemsoft.org/admin`
- **Kitchen Panel**: `http://orderly.kareemsoft.org/kitchen`
- **Landing Page** (optional): `http://orderly.kareemsoft.org/landing`

## 🔒 SSL Configuration

After setting up SSL (Let's Encrypt):

1. **The control panel will automatically update** the config with SSL
2. **Or manually add SSL** by changing `listen 80;` to `listen 443 ssl;`
3. **Add SSL certificates:**
   ```nginx
   ssl_certificate /www/server/panel/vhost/cert/orderly.kareemsoft.org/fullchain.pem;
   ssl_certificate_key /www/server/panel/vhost/cert/orderly.kareemsoft.org/privkey.pem;
   ```

## ⚙️ Backend Configuration

### Update Laravel .env

Make sure your `backend/.env` has:

```env
APP_URL=https://orderly.kareemsoft.org
```

### Update Frontend API URLs

Update each frontend app's environment or build config:

**frontend/guest/.env** (or vite.config.ts):
```env
VITE_API_URL=https://orderly.kareemsoft.org/api
```

**frontend/admin/.env**:
```env
VITE_API_URL=https://orderly.kareemsoft.org/api
```

**frontend/kitchen/.env**:
```env
VITE_API_URL=https://orderly.kareemsoft.org/api
```

**frontend/landing/.env**:
```env
VITE_API_URL=https://orderly.kareemsoft.org/api
```

Then rebuild all frontend apps:
```bash
cd frontend/guest && npm run build
cd ../admin && npm run build
cd ../kitchen && npm run build
cd ../landing && npm run build
```

## 🧪 Testing

1. **Test API:**
   ```bash
   curl http://orderly.kareemsoft.org/api/health
   # or
   curl http://orderly.kareemsoft.org/api/status
   ```

2. **Test Frontend Apps:**
   - Visit `http://orderly.kareemsoft.org/` (Guest App)
   - Visit `http://orderly.kareemsoft.org/admin` (Admin Dashboard)
   - Visit `http://orderly.kareemsoft.org/kitchen` (Kitchen Panel)

## 🐛 Troubleshooting

### 404 Errors on Frontend Apps

- Check that `dist` folders exist and are built
- Verify the `alias` paths in Nginx config match your actual paths
- Check Nginx error logs: `/www/wwwlogs/orderly.kareemsoft.org.error.log`

### API Not Working

- Check PHP-FPM is running: `systemctl status php-fpm-82`
- Verify PHP-FPM socket path in Nginx config
- Check Laravel storage permissions
- Check Laravel logs: `backend/storage/logs/laravel.log`

### Permission Errors

```bash
chown -R www:www /www/wwwroot/orderly.kareemsoft.org
chmod -R 755 /www/wwwroot/orderly.kareemsoft.org
chmod -R 775 /www/wwwroot/orderly.kareemsoft.org/backend/storage
```

### Check Nginx Configuration

```bash
# Test config
nginx -t

# Check if Nginx is running
systemctl status nginx

# View error logs
tail -f /www/wwwlogs/orderly.kareemsoft.org.error.log
```

## 📝 Notes

- The control panel may add additional rules - that's fine, they won't conflict
- Keep the control panel's PHP include line: `include enable-php-82.conf;`
- Keep the rewrite include if you use the panel's rewrite rules
- The config uses `alias` for subdirectories, which is correct for this setup

## 🔄 Alternative: Subdomain Setup

If you prefer subdomains instead of paths:

- `api.orderly.kareemsoft.org` → Backend API
- `orderly.kareemsoft.org` → Guest App
- `admin.orderly.kareemsoft.org` → Admin Dashboard
- `kitchen.orderly.kareemsoft.org` → Kitchen Panel

You'll need separate server blocks for each subdomain. Let me know if you want this configuration instead.

