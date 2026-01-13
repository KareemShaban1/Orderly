# Final API Fix - Working Configuration

## Problem
Still getting 404. The `root` approach was looking for `/api/auth/login` in the `public` directory.

## Solution: Use Alias with Named Location

The working config uses `alias` with a named location that always routes to `index.php`:

```nginx
location ~ ^/api {
    alias /www/wwwroot/orderly.kareemsoft.org/backend/public;
    try_files $uri $uri/ @api_fallback;
    
    location ~ \.php$ {
        fastcgi_pass unix:/tmp/php-cgi-82.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $request_filename;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }
}

location @api_fallback {
    fastcgi_pass unix:/tmp/php-cgi-82.sock;
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME /www/wwwroot/orderly.kareemsoft.org/backend/public/index.php;
    fastcgi_param REQUEST_URI $request_uri;
    fastcgi_param QUERY_STRING $query_string;
    include fastcgi_params;
    fastcgi_hide_header X-Powered-By;
}
```

## How This Works

1. **Request**: `POST /api/auth/login`
2. **Location matches**: `~ ^/api`
3. **try_files**:
   - Tries: `/api/auth/login` (doesn't exist)
   - Tries: `/api/auth/login/` (doesn't exist)
   - Falls back to: `@api_fallback`
4. **@api_fallback**:
   - Directly passes to PHP-FPM with `SCRIPT_FILENAME` pointing to `index.php` ✅
   - Preserves `REQUEST_URI=/api/auth/login` for Laravel ✅
5. **Laravel**: Routes correctly

## Apply the Fix

```bash
# 1. Update your Nginx config file with the new nginx-orderly-config.conf
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

## Key Points

- **Uses `alias`** to map `/api` to `public/` directory
- **Named location `@api_fallback`** directly executes `index.php` without rewrite
- **Absolute path** in `SCRIPT_FILENAME` ensures correct file path
- **Preserves `REQUEST_URI`** so Laravel gets `/api/auth/login`

## Expected Result

After applying:
- ✅ **422 Unprocessable Entity** - Validation error (expected for test data)
- ✅ **401 Unauthorized** - Wrong credentials (expected)
- ❌ **NOT 404** - Route not found
- ❌ **NOT 403** - Access denied

## If Still 404

1. **Check if config was applied:**
   ```bash
   grep -A 10 "location.*api" /www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf
   ```

2. **Check Laravel routes:**
   ```bash
   cd /www/wwwroot/orderly.kareemsoft.org/backend
   php artisan route:list | grep "auth/login"
   ```

3. **Clear route cache:**
   ```bash
   php artisan route:clear
   php artisan config:clear
   ```

4. **Check Nginx error log:**
   ```bash
   tail -20 /www/wwwlogs/orderly.kareemsoft.org.error.log
   ```

This configuration should work! The named location approach bypasses the rewrite issues and directly executes Laravel's `index.php`.

