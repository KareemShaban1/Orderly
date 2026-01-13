# Fix API 404 Error for Laravel Backend

## Problem
Getting 404 error when trying to access API endpoints:
- `POST http://orderly.kareemsoft.org/api/auth/login` → 404 Not Found

## Root Cause
The Nginx configuration for `/api` location block is not correctly routing requests to Laravel's `index.php`. When using `alias`, the rewrite rule needs special handling.

## Solution

### Updated Nginx Config

The config has been updated to properly handle Laravel API routes:

```nginx
location /api {
    alias /www/wwwroot/orderly.kareemsoft.org/backend/public;
    try_files $uri $uri/ @api;
    
    location ~ \.php$ {
        fastcgi_pass unix:/tmp/php-cgi-82.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $request_filename;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }
}

location @api {
    rewrite ^/api/(.*)$ /api/index.php/$1?$query_string last;
}

# Handle Laravel index.php for API routes
location ~ ^/api/index\.php(/.*)?$ {
    alias /www/wwwroot/orderly.kareemsoft.org/backend/public/index.php;
    fastcgi_pass unix:/tmp/php-cgi-82.sock;
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME /www/wwwroot/orderly.kareemsoft.org/backend/public/index.php;
    fastcgi_param REQUEST_URI $request_uri;
    include fastcgi_params;
    fastcgi_hide_header X-Powered-By;
}
```

## Steps to Fix

### Step 1: Update Nginx Config

Copy the updated `nginx-orderly-config.conf` to your server and replace the current config.

**On your server:**
```bash
# Backup current config
cp /www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf /www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf.backup

# Update with new config (copy nginx-orderly-config.conf content)

# Test config
nginx -t

# If OK, reload
systemctl reload nginx
```

### Step 2: Verify Laravel Backend Setup

```bash
# Check if backend/public exists
ls -la /www/wwwroot/orderly.kareemsoft.org/backend/public/

# Check if index.php exists
ls -la /www/wwwroot/orderly.kareemsoft.org/backend/public/index.php

# Check Laravel .env file
cat /www/wwwroot/orderly.kareemsoft.org/backend/.env | grep APP_URL
```

### Step 3: Verify Laravel Routes

```bash
# Check if routes are cached (clear if needed)
cd /www/wwwroot/orderly.kareemsoft.org/backend
php artisan route:list | grep auth/login

# If routes are cached, clear cache:
php artisan route:clear
php artisan config:clear
php artisan cache:clear
```

### Step 4: Test API Endpoint

```bash
# Test with curl
curl -X POST http://orderly.kareemsoft.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Should return JSON response (not 404)
```

### Step 5: Check Laravel Logs

```bash
# Check Laravel error logs
tail -50 /www/wwwroot/orderly.kareemsoft.org/backend/storage/logs/laravel.log

# Check Nginx error logs
tail -50 /www/wwwlogs/orderly.kareemsoft.org.error.log | grep api
```

## Alternative: Use Root Instead of Alias

If the `alias` approach doesn't work, you can use `root` instead:

```nginx
location /api {
    root /www/wwwroot/orderly.kareemsoft.org/backend/public;
    try_files $uri $uri/ /index.php?$query_string;
    
    location ~ \.php$ {
        fastcgi_pass unix:/tmp/php-cgi-82.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }
}
```

**Note:** With `root`, the path resolution is:
- Request: `/api/auth/login`
- Nginx looks for: `/www/wwwroot/orderly.kareemsoft.org/backend/public/api/auth/login`
- Since it doesn't exist, `try_files` falls back to `/index.php?$query_string`
- This resolves to: `/www/wwwroot/orderly.kareemsoft.org/backend/public/index.php`

But Laravel expects the URI to be `/api/auth/login`, not `/auth/login`. So we need to adjust:

```nginx
location /api {
    root /www/wwwroot/orderly.kareemsoft.org/backend;
    try_files $uri $uri/ /public/index.php?$query_string;
    
    location ~ \.php$ {
        fastcgi_pass unix:/tmp/php-cgi-82.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root/public$fastcgi_script_name;
        fastcgi_param REQUEST_URI $request_uri;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }
}
```

## Common Issues

### Issue 1: PHP-FPM Not Running

```bash
# Check if PHP-FPM is running
systemctl status php-fpm-82
# or
ps aux | grep php-fpm

# Start if not running
systemctl start php-fpm-82
```

### Issue 2: Wrong PHP Socket Path

The config uses `/tmp/php-cgi-82.sock`. Verify the correct socket:

```bash
# Find PHP-FPM socket
find /tmp -name "php*.sock" 2>/dev/null
# or
grep "listen" /etc/php/8.2/fpm/pool.d/www.conf
```

Update the `fastcgi_pass` directive if different.

### Issue 3: Laravel .env Not Configured

```bash
# Check .env file
cd /www/wwwroot/orderly.kareemsoft.org/backend
cat .env | grep -E "(APP_URL|APP_ENV|DB_)"

# Should have:
# APP_URL=http://orderly.kareemsoft.org
# APP_ENV=production
```

### Issue 4: File Permissions

```bash
# Fix Laravel permissions
cd /www/wwwroot/orderly.kareemsoft.org/backend
chown -R www:www storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

## Verification Checklist

- [ ] Nginx config updated with correct API location block
- [ ] Nginx config tested: `nginx -t`
- [ ] Nginx reloaded: `systemctl reload nginx`
- [ ] Laravel `public/index.php` exists
- [ ] PHP-FPM is running
- [ ] Laravel routes are not cached (or cleared)
- [ ] `.env` file is configured correctly
- [ ] File permissions are correct
- [ ] Test with curl returns JSON (not 404)

## Test After Fix

```bash
# Test login endpoint
curl -X POST http://orderly.kareemsoft.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  -v

# Should return:
# - HTTP/1.1 200 OK (or 401/422 for invalid credentials)
# - JSON response with token or error message
# - NOT 404 Not Found
```

## Still Getting 404?

1. **Check Nginx error logs:**
   ```bash
   tail -f /www/wwwlogs/orderly.kareemsoft.org.error.log
   ```

2. **Check Laravel logs:**
   ```bash
   tail -f /www/wwwroot/orderly.kareemsoft.org/backend/storage/logs/laravel.log
   ```

3. **Test PHP directly:**
   ```bash
   php -r "echo 'PHP works';"
   ```

4. **Verify fastcgi_pass:**
   ```bash
   # Test if socket exists
   ls -la /tmp/php-cgi-82.sock
   ```

