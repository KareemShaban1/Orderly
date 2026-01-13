# Fix API 404 After 403 Fix

## Progress
- ✅ Fixed 403 error (script path issue resolved)
- ❌ Now getting 404 (routing issue)

## Problem
The `root` approach with regex capture wasn't handling the path correctly. Laravel needs the full `/api/auth/login` in `REQUEST_URI`.

## Solution

Updated config to use `root` with proper `try_files`:

```nginx
location ~ ^/api {
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

## How This Works

1. **Request**: `POST /api/auth/login`
2. **Location matches**: `~ ^/api`
3. **try_files**:
   - Tries: `/api/auth/login` in `public/` directory (doesn't exist)
   - Tries: `/api/auth/login/` (doesn't exist)
   - Falls back to: `/index.php?$query_string`
4. **PHP location**: Matches `.php$` extension
5. **SCRIPT_FILENAME**: `$document_root/index.php` = `/backend/public/index.php` ✅
6. **REQUEST_URI**: Preserved as `/api/auth/login` for Laravel ✅

## Apply the Fix

```bash
# 1. Update your Nginx config file
# 2. Test config
nginx -t

# 3. Reload
systemctl reload nginx

# 4. Test
curl -X POST http://orderly.kareemsoft.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -v
```

## Key Changes

**Before (causing 404):**
```nginx
location ~ ^/api/(.*)$ {
    try_files /$1 /index.php?$query_string;  # ❌ Wrong path
}
```

**After (correct):**
```nginx
location ~ ^/api {
    try_files $uri $uri/ /index.php?$query_string;  # ✅ Correct
}
```

The difference:
- `try_files /$1` was trying `/auth/login` (wrong - missing `/api`)
- `try_files $uri` tries `/api/auth/login` first, then falls back to `/index.php` correctly

## Verify

After applying, test:

```bash
curl -X POST http://orderly.kareemsoft.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -v
```

**Expected:**
- ✅ **422 Unprocessable Entity** - Validation error (email/password format)
- ✅ **401 Unauthorized** - Wrong credentials
- ❌ **NOT 404** - Route not found
- ❌ **NOT 403** - Access denied

## If Still 404

Check Laravel routes:

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend
php artisan route:list | grep "auth/login"
```

Should show: `POST api/auth/login`

If route exists but still 404, check:
1. Laravel log: `tail -50 storage/logs/laravel.log`
2. Nginx error log: `tail -20 /www/wwwlogs/orderly.kareemsoft.org.error.log`
3. Clear route cache: `php artisan route:clear`

This should fix the 404 and get you to 422/401 (which means the API is working!).

