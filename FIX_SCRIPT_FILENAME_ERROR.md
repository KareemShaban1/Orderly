# Fix "Access to the script has been denied" Error

## Problem Found!

The Nginx error log shows:
```
Access to the script '/www/wwwroot/orderly.kareemsoft.org/backend/public' has been denied
```

**Issue**: PHP-FPM is trying to execute the **directory** `/backend/public` instead of the **file** `/backend/public/index.php`.

## Root Cause

The Nginx config's `location ~ ^/api/index\.php$` block was using `alias` which was causing the wrong path to be passed to PHP-FPM.

## Solution

The config has been updated to:
1. Remove `alias` from the `index.php` location block
2. Use absolute path directly in `SCRIPT_FILENAME`
3. Keep the rewrite in `@api` to route to `index.php`

## Updated Config

```nginx
location ~ ^/api {
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
    rewrite ^/api/(.*)$ /api/index.php?$query_string last;
}

location ~ ^/api/index\.php(/.*)?$ {
    fastcgi_pass unix:/tmp/php-cgi-82.sock;
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME /www/wwwroot/orderly.kareemsoft.org/backend/public/index.php;
    fastcgi_param REQUEST_URI $request_uri;
    fastcgi_param QUERY_STRING $query_string;
    include fastcgi_params;
    fastcgi_hide_header X-Powered-By;
}
```

## Apply the Fix

```bash
# 1. Update your Nginx config file with the new configuration
# 2. Test config
nginx -t

# 3. Reload Nginx
systemctl reload nginx

# 4. Test API
curl -X POST http://orderly.kareemsoft.org/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -v
```

## What Changed

**Before:**
```nginx
location ~ ^/api/index\.php(/.*)?$ {
    alias /www/wwwroot/orderly.kareemsoft.org/backend/public/index.php;  # ❌ Wrong
    ...
}
```

**After:**
```nginx
location ~ ^/api/index\.php(/.*)?$ {
    # No alias - use direct path
    fastcgi_param SCRIPT_FILENAME /www/wwwroot/orderly.kareemsoft.org/backend/public/index.php;  # ✅ Correct
    ...
}
```

## Expected Result

After applying the fix:
- ✅ PHP-FPM will receive the correct file path: `/backend/public/index.php`
- ✅ Laravel will execute correctly
- ✅ You should get **422** (validation error) or **401** (auth error), **NOT 403**

## Also Fix .env

While you're at it, update your `.env` file:

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend

# Update APP_URL
sed -i 's|APP_URL=http://localhost|APP_URL=http://orderly.kareemsoft.org|' .env

# Set APP_ENV to production
sed -i 's/APP_ENV=local/APP_ENV=production/' .env

# Clear config cache
php artisan config:clear
```

## Test After Fix

```bash
curl -X POST http://orderly.kareemsoft.org/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -v

# Should return:
# HTTP/1.1 422 Unprocessable Entity (validation error)
# OR
# HTTP/1.1 401 Unauthorized (wrong credentials)
# NOT 403 Forbidden
```

The fix is removing the `alias` directive from the `index.php` location block and using the absolute path directly in `SCRIPT_FILENAME`.

