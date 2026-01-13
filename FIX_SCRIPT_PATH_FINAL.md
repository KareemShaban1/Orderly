# Final Fix for Script Path Error

## Problem
Still getting:
```
Access to the script '/www/wwwroot/orderly.kareemsoft.org/backend/public' has been denied
```

PHP-FPM is trying to execute the directory instead of `index.php`.

## Root Cause
Using `alias` with rewrites is causing path resolution issues. The `$request_filename` variable isn't resolving correctly when using `alias`.

## Solution: Use Root Instead of Alias

The updated config uses `root` with a simpler approach:

```nginx
location ~ ^/api/(.*)$ {
    root /www/wwwroot/orderly.kareemsoft.org/backend/public;
    try_files /$1 /index.php?$query_string;
    
    location ~ \.php$ {
        fastcgi_pass unix:/tmp/php-cgi-82.sock;
        fastcgi_index index.php;
        fastcgi_split_path_info ^(/api)(/.*)$;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param REQUEST_URI $request_uri;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }
}
```

## How This Works

1. **Request**: `POST /api/auth/login`
2. **Regex match**: `^/api/(.*)$` captures `auth/login`
3. **try_files**: 
   - First tries: `/auth/login` (doesn't exist)
   - Falls back to: `/index.php?$query_string`
4. **PHP location**: Matches `.php$` extension
5. **SCRIPT_FILENAME**: `$document_root/index.php` = `/www/wwwroot/orderly.kareemsoft.org/backend/public/index.php` ✅
6. **REQUEST_URI**: Preserved as `/api/auth/login` for Laravel routing

## Apply the Fix

```bash
# 1. Update your Nginx config file with the new configuration
# 2. Test config
nginx -t

# 3. If OK, reload
systemctl reload nginx

# 4. Test API
curl -X POST http://orderly.kareemsoft.org/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -v
```

## Key Differences

**Old (with alias):**
- Used `alias` which caused path resolution issues
- Required separate `@api` fallback and `index.php` location block
- `$request_filename` didn't resolve correctly

**New (with root):**
- Uses `root` which is simpler and more reliable
- Single location block handles everything
- `$document_root$fastcgi_script_name` correctly resolves to `index.php`

## Verify It's Working

After applying, check Nginx error log:

```bash
tail -f /www/wwwlogs/orderly.kareemsoft.org.error.log
```

You should **NOT** see:
```
Access to the script '/www/wwwroot/orderly.kareemsoft.org/backend/public' has been denied
```

Instead, you should see successful requests or Laravel errors (422, 401), not 403.

## Expected Result

After fixing:
- ✅ `SCRIPT_FILENAME` points to `/backend/public/index.php` (file, not directory)
- ✅ Laravel receives the request correctly
- ✅ Response: **422** (validation) or **401** (auth), **NOT 403**

This simpler `root`-based approach should fix the script path issue once and for all!

