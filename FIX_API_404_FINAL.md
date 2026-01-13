# Final Fix for API 404 Error

## Problem
Still getting 404 for `/api/auth/login` even after updating Nginx config.

## Solution: Use Root Instead of Alias

The issue with `alias` is that it doesn't work well with Laravel's routing. The updated config now uses `root` which is more reliable:

```nginx
location /api {
    root /www/wwwroot/orderly.kareemsoft.org/backend;
    try_files $uri $uri/ /public/index.php?$query_string;
    
    location ~ \.php$ {
        fastcgi_pass unix:/tmp/php-cgi-82.sock;
        fastcgi_index index.php;
        fastcgi_split_path_info ^(/api)(/.*)$;
        fastcgi_param SCRIPT_FILENAME $document_root/public/index.php;
        fastcgi_param REQUEST_URI $request_uri;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }
}
```

## How This Works

1. **Request**: `POST /api/auth/login`
2. **Nginx**: Tries to find `/www/wwwroot/orderly.kareemsoft.org/backend/api/auth/login` (doesn't exist)
3. **try_files**: Falls back to `/public/index.php?$query_string`
4. **Resolves to**: `/www/wwwroot/orderly.kareemsoft.org/backend/public/index.php`
5. **Laravel**: Receives request with `REQUEST_URI=/api/auth/login` and routes it correctly

## Steps to Fix

### Step 1: Update Nginx Config

Copy the updated `nginx-orderly-config.conf` to your server:

```bash
# Backup current config
cp /www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf /www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf.backup

# Update with new config (copy from nginx-orderly-config.conf)

# Test config
nginx -t

# If OK, reload
systemctl reload nginx
```

### Step 2: Verify Laravel Setup

```bash
# Check if backend/public/index.php exists
ls -la /www/wwwroot/orderly.kareemsoft.org/backend/public/index.php

# Check Laravel .env
cd /www/wwwroot/orderly.kareemsoft.org/backend
cat .env | grep APP_URL
```

### Step 3: Clear Laravel Cache

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend
php artisan route:clear
php artisan config:clear
php artisan cache:clear
php artisan optimize:clear
```

### Step 4: Test API

```bash
# Test with curl
curl -X POST http://orderly.kareemsoft.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -v

# Expected responses:
# - 422: Validation error (email/password invalid format) ✅ API is working!
# - 401: Authentication failed (wrong credentials) ✅ API is working!
# - 404: Still broken ❌ Check logs
```

### Step 5: Check Logs if Still 404

```bash
# Nginx error log
tail -50 /www/wwwlogs/orderly.kareemsoft.org.error.log | grep api

# Laravel log
tail -50 /www/wwwroot/orderly.kareemsoft.org/backend/storage/logs/laravel.log
```

## Alternative: Direct Public Root

If the above still doesn't work, try this even simpler approach:

```nginx
location /api {
    root /www/wwwroot/orderly.kareemsoft.org/backend/public;
    try_files $uri $uri/ /index.php?$query_string;
    
    location ~ \.php$ {
        fastcgi_pass unix:/tmp/php-cgi-82.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param REQUEST_URI $request_uri;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }
}
```

**Note**: This requires Laravel to handle the `/api` prefix in routes, or you need to adjust the `REQUEST_URI`.

## Verify PHP-FPM

```bash
# Check if PHP-FPM is running
systemctl status php-fpm-82

# Check socket exists
ls -la /tmp/php-cgi-82.sock

# If socket is different, find it:
find /tmp -name "php*.sock" 2>/dev/null
# or
grep "listen" /etc/php/8.2/fpm/pool.d/www.conf
```

## Test Script

Run this on your server:

```bash
#!/bin/bash

echo "Testing API endpoint..."

# Test 1: Check if index.php exists
if [ -f "/www/wwwroot/orderly.kareemsoft.org/backend/public/index.php" ]; then
    echo "✅ index.php exists"
else
    echo "❌ index.php NOT FOUND"
    exit 1
fi

# Test 2: Check PHP-FPM socket
if [ -S "/tmp/php-cgi-82.sock" ]; then
    echo "✅ PHP-FPM socket exists"
else
    echo "❌ PHP-FPM socket NOT FOUND"
    echo "   Find it with: find /tmp -name 'php*.sock'"
fi

# Test 3: Test API endpoint
echo ""
echo "Testing: POST /api/auth/login"
HTTP_CODE=$(curl -s -o /tmp/api_response.txt -w "%{http_code}" \
  -X POST "http://orderly.kareemsoft.org/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}' 2>/dev/null)

echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Still getting 404"
    echo ""
    echo "Response:"
    cat /tmp/api_response.txt
    echo ""
    echo "Check:"
    echo "  1. Nginx config updated and reloaded?"
    echo "  2. Laravel routes cleared?"
    echo "  3. PHP-FPM running?"
else
    echo "✅ API is responding! (Status: $HTTP_CODE)"
    echo ""
    echo "Response:"
    cat /tmp/api_response.txt | head -5
fi
```

## Common Issues

### Issue 1: PHP-FPM Not Running
```bash
systemctl start php-fpm-82
systemctl enable php-fpm-82
```

### Issue 2: Wrong Socket Path
Update `fastcgi_pass` in Nginx config to match your PHP-FPM socket.

### Issue 3: Laravel Routes Cached
```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend
php artisan route:clear
php artisan config:clear
php artisan cache:clear
```

### Issue 4: File Permissions
```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend
chown -R www:www storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

## After Fixing

1. **Update Nginx config** with the new `root`-based approach
2. **Reload Nginx**: `systemctl reload nginx`
3. **Clear Laravel cache**: `php artisan route:clear`
4. **Test**: `curl -X POST http://orderly.kareemsoft.org/api/auth/login ...`

The API should now work correctly!

