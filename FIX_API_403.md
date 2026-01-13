# Fix API 403 Forbidden Error

## Problem
Getting `403 Forbidden` when accessing `/api/auth/login`. This means:
- ✅ Nginx is routing correctly
- ✅ Laravel is receiving the request
- ❌ Laravel middleware is blocking it

## Common Causes

1. **CORS middleware** blocking cross-origin requests
2. **Rate limiting** middleware
3. **File permissions** on storage/logs
4. **Laravel security settings**

## Solutions

### Solution 1: Check Laravel Logs

```bash
# Check Laravel error log for details
tail -50 /www/wwwroot/orderly.kareemsoft.org/backend/storage/logs/laravel.log

# Look for the actual error message
```

### Solution 2: Check CORS Configuration

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend

# Check if CORS is configured
grep -r "cors" config/
cat config/cors.php 2>/dev/null || echo "CORS config not found"
```

If CORS is the issue, update `config/cors.php`:

```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'], // Or specific: ['http://orderly.kareemsoft.org']
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

Then clear config cache:
```bash
php artisan config:clear
```

### Solution 3: Check Rate Limiting

```bash
# Check if rate limiting is too strict
grep -r "throttle" app/Http/Kernel.php routes/api.php
```

If rate limiting is blocking, temporarily disable it or increase limits.

### Solution 4: Fix File Permissions

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend

# Fix storage permissions
chown -R www:www storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Verify
ls -la storage/logs/
```

### Solution 5: Check Middleware in Kernel.php

```bash
# Check what middleware is applied to API routes
cat app/Http/Kernel.php | grep -A 20 "api"
```

API routes should NOT have CSRF protection. Check if `VerifyCsrfToken` is being applied.

### Solution 6: Test with Direct PHP

Bypass Nginx to test if it's a Laravel issue:

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend/public

# Test PHP directly
php -r "
\$_SERVER['REQUEST_METHOD'] = 'POST';
\$_SERVER['REQUEST_URI'] = '/api/auth/login';
\$_SERVER['HTTP_HOST'] = 'orderly.kareemsoft.org';
require 'index.php';
"
```

### Solution 7: Check .env Configuration

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend
cat .env | grep -E "(APP_ENV|APP_DEBUG|APP_URL)"
```

Should have:
```
APP_ENV=production
APP_DEBUG=false
APP_URL=http://orderly.kareemsoft.org
```

### Solution 8: Clear All Caches

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear
```

## Quick Diagnostic Script

```bash
#!/bin/bash

echo "=== API 403 Diagnostic ==="
echo ""

BACKEND_PATH="/www/wwwroot/orderly.kareemsoft.org/backend"
cd $BACKEND_PATH

# 1. Check Laravel logs
echo "1. Checking Laravel logs..."
if [ -f "storage/logs/laravel.log" ]; then
    echo "   Recent errors:"
    tail -20 storage/logs/laravel.log | grep -i "403\|forbidden\|denied" | tail -5 || echo "   No 403 errors in log"
else
    echo "   ⚠️  Laravel log not found"
fi

# 2. Check permissions
echo ""
echo "2. Checking permissions..."
if [ -w "storage/logs" ]; then
    echo "   ✅ storage/logs is writable"
else
    echo "   ❌ storage/logs is NOT writable"
    echo "   Fixing..."
    chown -R www:www storage bootstrap/cache
    chmod -R 775 storage bootstrap/cache
fi

# 3. Check CORS
echo ""
echo "3. Checking CORS config..."
if [ -f "config/cors.php" ]; then
    echo "   ✅ CORS config exists"
    grep "allowed_origins" config/cors.php | head -1
else
    echo "   ⚠️  CORS config not found (may need to install)"
fi

# 4. Check .env
echo ""
echo "4. Checking .env..."
if [ -f ".env" ]; then
    echo "   ✅ .env exists"
    grep "APP_ENV\|APP_DEBUG\|APP_URL" .env | head -3
else
    echo "   ❌ .env NOT FOUND"
fi

# 5. Test endpoint with more details
echo ""
echo "5. Testing endpoint..."
HTTP_CODE=$(curl -s -o /tmp/api_403_test.txt -w "%{http_code}" \
  -X POST "http://orderly.kareemsoft.org/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"test@example.com","password":"test"}' 2>/dev/null)

echo "   HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "403" ]; then
    echo "   ❌ Still 403"
    echo ""
    echo "   Response:"
    cat /tmp/api_403_test.txt
    echo ""
    echo "   Check Laravel log for details:"
    echo "   tail -50 storage/logs/laravel.log"
elif [ "$HTTP_CODE" = "422" ] || [ "$HTTP_CODE" = "401" ]; then
    echo "   ✅ API is working! (Status: $HTTP_CODE)"
    echo "   Response:"
    cat /tmp/api_403_test.txt | head -5
else
    echo "   ⚠️  Unexpected status: $HTTP_CODE"
    cat /tmp/api_403_test.txt | head -10
fi

echo ""
echo "=== Diagnostic Complete ==="
```

## Most Likely Fix

The most common cause is **CORS** or **file permissions**. Try these in order:

1. **Fix permissions:**
   ```bash
   cd /www/wwwroot/orderly.kareemsoft.org/backend
   chown -R www:www storage bootstrap/cache
   chmod -R 775 storage bootstrap/cache
   ```

2. **Check Laravel log:**
   ```bash
   tail -50 storage/logs/laravel.log
   ```
   This will show the actual error message.

3. **Clear caches:**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

4. **Test again:**
   ```bash
   curl -X POST http://orderly.kareemsoft.org/api/auth/login \
     -H "Content-Type: application/json" \
     -H "Accept: application/json" \
     -d '{"email":"test@example.com","password":"test"}' \
     -v
   ```

## Expected Result

After fixing, you should get:
- **422 Unprocessable Entity** - Validation error (email/password format)
- **401 Unauthorized** - Wrong credentials
- **NOT 403 Forbidden**

The Laravel log will tell you exactly why it's returning 403.

