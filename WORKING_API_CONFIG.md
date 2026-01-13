# Working Laravel API Nginx Configuration

## The Problem
Laravel routes exist (`php artisan route:list` shows them), but Nginx returns 404.

## The Solution
Use a simpler, more reliable configuration that properly handles Laravel's routing.

## Updated Config

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
    rewrite ^/api/(.*)$ /api/index.php last;
}

location ~ ^/api/index\.php(/.*)?$ {
    alias /www/wwwroot/orderly.kareemsoft.org/backend/public/index.php;
    fastcgi_pass unix:/tmp/php-cgi-82.sock;
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME /www/wwwroot/orderly.kareemsoft.org/backend/public/index.php;
    fastcgi_param REQUEST_URI $request_uri;
    fastcgi_param QUERY_STRING $query_string;
    include fastcgi_params;
    fastcgi_hide_header X-Powered-By;
}
```

## Key Changes

1. **Removed `?$query_string` from rewrite** - The query string is preserved in `REQUEST_URI` automatically
2. **Added `QUERY_STRING` parameter** - Explicitly pass query string to PHP
3. **Simplified regex** - `^/api/index\.php(/.*)?$` matches with or without trailing path

## Apply the Fix

```bash
# 1. Update your Nginx config file with the new configuration
# 2. Test the config
nginx -t

# 3. If OK, reload
systemctl reload nginx

# 4. Test again
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -v
```

## Alternative: Even Simpler Config

If the above still doesn't work, try this even simpler approach:

```nginx
location /api {
    alias /www/wwwroot/orderly.kareemsoft.org/backend/public;
    try_files $uri $uri/ /index.php?$query_string;
    
    location ~ \.php$ {
        fastcgi_pass unix:/tmp/php-cgi-82.sock;
        fastcgi_index index.php;
        fastcgi_split_path_info ^(/api)(/.*)$;
        fastcgi_param SCRIPT_FILENAME /www/wwwroot/orderly.kareemsoft.org/backend/public/index.php;
        fastcgi_param REQUEST_URI $request_uri;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }
}
```

**Note**: This uses `try_files` with direct fallback to `index.php`, which is simpler but requires `fastcgi_split_path_info` to handle the path correctly.

## Debugging Steps

If still getting 404:

### 1. Check if the rewrite is working

Add temporary logging:
```nginx
location @api {
    access_log /var/log/nginx/api_debug.log;
    rewrite ^/api/(.*)$ /api/index.php last;
}
```

Then check the log:
```bash
tail -f /var/log/nginx/api_debug.log
```

### 2. Test if index.php is accessible directly

```bash
# Create a test file
echo "<?php echo 'PHP works'; ?>" > /www/wwwroot/orderly.kareemsoft.org/backend/public/test.php

# Access via browser: http://orderly.kareemsoft.org/api/test.php
# Should show "PHP works"

# Delete after testing
rm /www/wwwroot/orderly.kareemsoft.org/backend/public/test.php
```

### 3. Check Nginx error log in real-time

```bash
tail -f /www/wwwlogs/orderly.kareemsoft.org.error.log
```

Then make a request and watch for errors.

### 4. Verify the exact request URI Laravel receives

Add to Laravel's `public/index.php` temporarily:
```php
file_put_contents('/tmp/laravel_debug.txt', $_SERVER['REQUEST_URI'] . "\n", FILE_APPEND);
```

Then check:
```bash
cat /tmp/laravel_debug.txt
```

## Expected Behavior

After applying the fix:

1. **Request**: `POST /api/auth/login`
2. **Nginx**: Tries to find `/api/auth/login` in public directory (doesn't exist)
3. **try_files**: Falls back to `@api`
4. **@api**: Rewrites to `/api/index.php`
5. **Location block**: Matches `^/api/index\.php(/.*)?$`
6. **PHP-FPM**: Executes `/www/wwwroot/orderly.kareemsoft.org/backend/public/index.php`
7. **Laravel**: Receives `REQUEST_URI=/api/auth/login` and routes correctly
8. **Response**: JSON response (not 404)

## Test Command

```bash
curl -X POST http://orderly.kareemsoft.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -v

# Expected: HTTP/1.1 422 Unprocessable Entity (validation error)
# OR: HTTP/1.1 401 Unauthorized (wrong credentials)
# NOT: HTTP/1.1 404 Not Found
```

