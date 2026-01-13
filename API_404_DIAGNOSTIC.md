# API 404 Diagnostic Guide

## Current Issue
`POST /api/auth/login` returns 404 Not Found

## Step-by-Step Diagnosis

### Step 1: Check if Laravel index.php exists

```bash
ls -la /www/wwwroot/orderly.kareemsoft.org/backend/public/index.php
```

**Expected**: File exists and is readable

### Step 2: Check Laravel routes

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend
php artisan route:list | grep "auth/login"
```

**Expected**: Should see `POST api/auth/login`

If not found:
```bash
# Clear route cache
php artisan route:clear
php artisan config:clear
php artisan cache:clear

# List again
php artisan route:list | grep auth
```

### Step 3: Test PHP-FPM directly

```bash
# Check if socket exists
ls -la /tmp/php-cgi-82.sock

# If not found, find the correct socket:
find /tmp -name "php*.sock" 2>/dev/null
# or
grep "listen" /etc/php/8.2/fpm/pool.d/www.conf
```

### Step 4: Test with curl (from server)

```bash
# Test the endpoint
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -v

# Check what it returns
```

### Step 5: Check Nginx error logs

```bash
# Watch error log in real-time
tail -f /www/wwwlogs/orderly.kareemsoft.org.error.log

# Then try the request from browser/Postman
# Look for errors in the log
```

### Step 6: Check Laravel logs

```bash
tail -50 /www/wwwroot/orderly.kareemsoft.org/backend/storage/logs/laravel.log
```

### Step 7: Test if PHP works at all

```bash
# Create a test PHP file
echo "<?php phpinfo(); ?>" > /www/wwwroot/orderly.kareemsoft.org/backend/public/test.php

# Access it via browser: http://orderly.kareemsoft.org/api/test.php
# Should show PHP info page

# Delete after testing
rm /www/wwwroot/orderly.kareemsoft.org/backend/public/test.php
```

## Common Solutions

### Solution 1: Fix Nginx Config

The updated config uses `alias` with proper fallback:

```nginx
location /api {
    alias /www/wwwroot/orderly.kareemsoft.org/backend/public;
    try_files $uri $uri/ @api_fallback;
    ...
}

location @api_fallback {
    rewrite ^/api/(.*)$ /api/index.php?$query_string last;
}

location ~ ^/api/index\.php$ {
    alias /www/wwwroot/orderly.kareemsoft.org/backend/public/index.php;
    fastcgi_pass unix:/tmp/php-cgi-82.sock;
    ...
}
```

**Apply:**
```bash
# Update config file
# Test
nginx -t
# Reload
systemctl reload nginx
```

### Solution 2: Clear All Laravel Caches

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend
php artisan route:clear
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan optimize:clear
```

### Solution 3: Verify PHP-FPM

```bash
# Check status
systemctl status php-fpm-82

# Restart if needed
systemctl restart php-fpm-82

# Check socket
ls -la /tmp/php-cgi-82.sock
```

### Solution 4: Check File Permissions

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend
chown -R www:www storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
chmod 644 public/index.php
```

### Solution 5: Verify .env Configuration

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend
cat .env | grep -E "(APP_URL|APP_ENV|APP_DEBUG)"
```

Should have:
```
APP_URL=http://orderly.kareemsoft.org
APP_ENV=production
APP_DEBUG=false
```

## Alternative: Test with Direct PHP

If Nginx routing is the issue, test Laravel directly:

```bash
# From server, test PHP directly
cd /www/wwwroot/orderly.kareemsoft.org/backend/public
php -r "echo file_get_contents('http://localhost/api/auth/login');"
```

## Quick Test Script

Save this as `test-api-endpoint.sh`:

```bash
#!/bin/bash

echo "=== API Endpoint Diagnostic ==="
echo ""

# 1. Check index.php
echo "1. Checking index.php..."
if [ -f "/www/wwwroot/orderly.kareemsoft.org/backend/public/index.php" ]; then
    echo "   ✅ index.php exists"
else
    echo "   ❌ index.php NOT FOUND"
    exit 1
fi

# 2. Check routes
echo ""
echo "2. Checking Laravel routes..."
cd /www/wwwroot/orderly.kareemsoft.org/backend
ROUTE_EXISTS=$(php artisan route:list 2>/dev/null | grep "auth/login" | wc -l)
if [ "$ROUTE_EXISTS" -gt 0 ]; then
    echo "   ✅ auth/login route exists"
    php artisan route:list | grep "auth/login"
else
    echo "   ❌ auth/login route NOT FOUND"
    echo "   Clearing cache..."
    php artisan route:clear
    php artisan config:clear
    echo "   Routes after clear:"
    php artisan route:list | grep auth || echo "   Still no routes found"
fi

# 3. Check PHP-FPM
echo ""
echo "3. Checking PHP-FPM..."
if [ -S "/tmp/php-cgi-82.sock" ]; then
    echo "   ✅ PHP-FPM socket exists"
else
    echo "   ❌ PHP-FPM socket NOT FOUND"
    echo "   Looking for socket..."
    find /tmp -name "php*.sock" 2>/dev/null | head -3
fi

# 4. Test endpoint
echo ""
echo "4. Testing endpoint..."
HTTP_CODE=$(curl -s -o /tmp/api_test.txt -w "%{http_code}" \
  -X POST "http://orderly.kareemsoft.org/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}' 2>/dev/null)

echo "   HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ Still 404"
    echo ""
    echo "   Response body:"
    cat /tmp/api_test.txt
    echo ""
    echo "   Check Nginx error log:"
    tail -5 /www/wwwlogs/orderly.kareemsoft.org.error.log | grep -i api || echo "   No API errors in log"
else
    echo "   ✅ API responding! (Status: $HTTP_CODE)"
    echo ""
    echo "   Response:"
    cat /tmp/api_test.txt | head -10
fi

echo ""
echo "=== Diagnostic Complete ==="
```

Run it:
```bash
chmod +x test-api-endpoint.sh
./test-api-endpoint.sh
```

## Most Likely Issue

Based on the error, the most likely causes are:

1. **Nginx config not updated/reloaded** - Make sure you updated the config file and reloaded Nginx
2. **Laravel routes cached** - Clear all caches
3. **PHP-FPM not running or wrong socket** - Check status and socket path
4. **Wrong REQUEST_URI** - Laravel not receiving the correct URI

The updated Nginx config should fix this. Make sure to:
1. Copy the updated config to your server
2. Test: `nginx -t`
3. Reload: `systemctl reload nginx`
4. Clear Laravel cache
5. Test again

