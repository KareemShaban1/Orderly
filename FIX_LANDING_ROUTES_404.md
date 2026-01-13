# Fix Landing Page Routes 404

## Problem
Both `/landing/` and `/organizations/cairo-restaurant-dy7GSb` return 404.

## Root Causes

1. **`/landing/` 404**: The `try_files` with `alias` might not be resolving correctly
2. **`/organizations/...` 404**: This route should be `/landing/organizations/...` but is being accessed without the `/landing/` prefix

## Solutions

### Issue 1: Fix `/landing/` 404

The `try_files` directive with `alias` needs special handling. When using `alias`, the fallback path should be relative to the alias path, not the request URI.

### Issue 2: Handle `/organizations/` Route

The route `/organizations/:slug` is part of the landing app, so it should be accessed as `/landing/organizations/:slug`. However, we can add a redirect or handle it in Nginx.

## Fix Options

### Option 1: Fix try_files with alias (Recommended)

Change the landing location block to handle the alias correctly:

```nginx
location /landing {
    alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist;
    index index.html;
    try_files $uri $uri/ @landing_fallback;
}

location @landing_fallback {
    rewrite ^/landing/(.*)$ /landing/index.html last;
}
```

But this might still have issues. Better approach:

```nginx
location /landing/ {
    alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/;
    index index.html;
    try_files $uri $uri/ /landing/index.html;
}

# Redirect /landing to /landing/
location = /landing {
    return 301 /landing/;
}
```

### Option 2: Use root instead of alias

```nginx
location /landing/ {
    root /www/wwwroot/orderly.kareemsoft.org/frontend;
    index index.html;
    try_files $uri $uri/ /landing/index.html;
}

location = /landing {
    return 301 /landing/;
}
```

### Option 3: Handle /organizations/ route

If you want `/organizations/:slug` to work without `/landing/` prefix, add:

```nginx
location /organizations/ {
    alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/;
    index index.html;
    try_files $uri $uri/ /landing/index.html;
}
```

But this won't work correctly because React Router expects `/landing/organizations/:slug`.

## Recommended Fix

Use `root` instead of `alias` for better compatibility:

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
location ~ ^/landing/(vite\.svg|icon-.*\.png|manifest\.json|sw\.js|workbox-.*\.js|.*\.(ico|svg|webmanifest))$ {
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
# Landing Page - Main Location (using root)
# ============================================
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

1. **Update Nginx config** with the recommended fix above
2. **Test config**: `nginx -t`
3. **Reload Nginx**: `systemctl reload nginx`
4. **Test routes**:
   - `https://orderly.kareemsoft.org/landing/` should work
   - `https://orderly.kareemsoft.org/landing/organizations/cairo-restaurant-dy7GSb` should work
   - `/organizations/...` without `/landing/` won't work (by design - it's part of landing app)

## Important Note

The route `/organizations/cairo-restaurant-dy7GSb` should be accessed as `/landing/organizations/cairo-restaurant-dy7GSb` because:
- The landing app has `basename="/landing"` in React Router
- All routes are relative to `/landing/`
- The route is defined as `/organizations/:slug` which becomes `/landing/organizations/:slug` with the basename

If you want `/organizations/...` to work directly, you'd need to either:
1. Remove the basename from React Router (not recommended - breaks other routes)
2. Add a redirect from `/organizations/` to `/landing/organizations/`
3. Serve the landing app at root instead of `/landing/` (not recommended - conflicts with guest app)

