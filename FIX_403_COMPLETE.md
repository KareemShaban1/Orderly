# Complete Fix for API 403 Error

## Current Status
- ✅ Nginx routing works (getting 403, not 404)
- ✅ Laravel is receiving requests
- ❌ CORS or middleware is blocking

## Step-by-Step Fix

### Step 1: Update CORS Config

The CORS config has `allowed_origins_patterns` which might conflict. Update it:

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend

# Backup current config
cp config/cors.php config/cors.php.backup

# Update config/cors.php
```

Replace the content with:

```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'], // Allow all origins
    'allowed_origins_patterns' => [], // Empty to avoid conflicts
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

**Or use sed to update it:**

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend

# Remove the patterns that might conflict
sed -i "s/'allowed_origins_patterns' => \[.*\],/'allowed_origins_patterns' => [],/" config/cors.php
```

### Step 2: Clear Config Cache

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend
php artisan config:clear
php artisan cache:clear
```

### Step 3: Check Laravel Log

```bash
# Check for the actual error
tail -50 /www/wwwroot/orderly.kareemsoft.org/backend/storage/logs/laravel.log | grep -A 5 -B 5 "403\|Forbidden\|denied"
```

### Step 4: Fix Permissions

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend
chown -R www:www storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

### Step 5: Test Again

```bash
curl -X POST http://orderly.kareemsoft.org/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -v
```

## Alternative: Check if CORS Middleware is Applied

Check if CORS middleware is in the API middleware group:

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend

# Check bootstrap/app.php or app/Http/Kernel.php
grep -r "HandleCors\|cors" app/Http/ bootstrap/
```

If CORS middleware is missing, it might be causing issues. Laravel should handle CORS automatically if the config is correct.

## Check Middleware Stack

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend

# Check what middleware is applied
php artisan route:list --path=api/auth/login

# Or check Kernel.php
cat app/Http/Kernel.php | grep -A 10 "api"
```

## Quick Fix Script

```bash
#!/bin/bash

cd /www/wwwroot/orderly.kareemsoft.org/backend

echo "=== Fixing API 403 ==="
echo ""

# 1. Update CORS config
echo "1. Updating CORS config..."
sed -i "s/'allowed_origins_patterns' => \[.*\],/'allowed_origins_patterns' => [],/" config/cors.php
echo "   ✅ CORS config updated"

# 2. Fix permissions
echo ""
echo "2. Fixing permissions..."
chown -R www:www storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
echo "   ✅ Permissions fixed"

# 3. Clear caches
echo ""
echo "3. Clearing caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
echo "   ✅ Caches cleared"

# 4. Test
echo ""
echo "4. Testing API..."
HTTP_CODE=$(curl -s -o /tmp/api_test_403.txt -w "%{http_code}" \
  -X POST "http://orderly.kareemsoft.org/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"test@example.com","password":"test"}' 2>/dev/null)

echo "   HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "403" ]; then
    echo "   ❌ Still 403"
    echo ""
    echo "   Check Laravel log:"
    echo "   tail -50 storage/logs/laravel.log"
elif [ "$HTTP_CODE" = "422" ] || [ "$HTTP_CODE" = "401" ]; then
    echo "   ✅ API is working! (Status: $HTTP_CODE)"
    echo ""
    echo "   Response:"
    cat /tmp/api_test_403.txt | head -5
else
    echo "   ⚠️  Status: $HTTP_CODE"
    cat /tmp/api_test_403.txt | head -10
fi

echo ""
echo "=== Fix Complete ==="
```

Run it:
```bash
chmod +x fix-api-403.sh
./fix-api-403.sh
```

## Most Important: Check Laravel Log

The log will tell you exactly why it's 403:

```bash
tail -50 /www/wwwroot/orderly.kareemsoft.org/backend/storage/logs/laravel.log
```

Look for:
- CORS errors
- Middleware blocking messages
- Permission denied errors
- Rate limiting messages

## Expected Result

After fixing:
- **422 Unprocessable Entity** - Validation error (expected for test data)
- **401 Unauthorized** - Wrong credentials (expected)
- **NOT 403 Forbidden**

If still 403, the Laravel log will show the exact reason.

