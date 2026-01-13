# Fix Landing Page 404 - Alias Issue

## Problem
Landing page returns 404 even though:
- ✅ Dist folder exists
- ✅ Nginx config has landing location block
- ✅ Config is valid and reloaded
- ✅ Permissions are correct

## Root Cause
The issue is with how `alias` works with `try_files` in Nginx. When using `alias`, the path resolution can be tricky, especially with the fallback.

## Solution

The `try_files` directive with `alias` needs special handling. Update the landing location block:

### Current (Problematic):
```nginx
location /landing {
    alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist;
    index index.html;
    try_files $uri $uri/ @landing_fallback;
}
```

### Fixed Version:
```nginx
location /landing {
    alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist;
    index index.html;
    try_files $uri $uri/ /landing/index.html;
}
```

OR use `root` instead of `alias`:

```nginx
location /landing/ {
    root /www/wwwroot/orderly.kareemsoft.org/frontend;
    index index.html;
    try_files $uri $uri/ /landing/index.html;
}
```

## Complete Fixed Config

Replace the landing location blocks with:

```nginx
    # ============================================
    # Landing Page - Static Assets
    # ============================================
    location ~ ^/landing/assets/(.*)$ {
        alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/assets/$1;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # ============================================
    # Landing Page - Public Assets
    # ============================================
    location ~ ^/landing/(vite\.svg|icon-.*\.png|manifest\.json|.*\.(ico|svg|webmanifest))$ {
        alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/$1;
        expires 1d;
        access_log off;
    }

    # ============================================
    # Landing Page - CSS/JS files
    # ============================================
    location ~ ^/landing/(index\.css|index\.js|.*\.css|.*\.js)$ {
        alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/$1;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # ============================================
    # Landing Page - Main Location
    # ============================================
    location /landing {
        alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist;
        index index.html;
        try_files $uri $uri/ /landing/index.html;
    }
```

## Alternative: Use Root Instead

If `alias` continues to cause issues, use `root`:

```nginx
    location /landing/ {
        root /www/wwwroot/orderly.kareemsoft.org/frontend;
        index index.html;
        try_files $uri $uri/ /landing/index.html;
    }
    
    # Redirect /landing to /landing/
    location = /landing {
        return 301 /landing/;
    }
```

## Steps to Fix

1. **Edit Nginx config:**
   ```bash
   nano /www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf
   ```

2. **Find the landing location block** and replace with the fixed version above

3. **Test config:**
   ```bash
   nginx -t
   ```

4. **Reload Nginx:**
   ```bash
   systemctl reload nginx
   ```

5. **Test:**
   ```bash
   curl -I http://localhost/landing/
   # Should return 200
   ```

## Why This Happens

When using `alias` with `try_files` and a named location (`@fallback`), Nginx can have issues resolving the path correctly. Using a direct path in `try_files` instead of a named location usually works better with `alias`.

