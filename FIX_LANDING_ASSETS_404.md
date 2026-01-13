# Fix Landing Page Asset 404 Errors

## Problem
Getting 404 errors for landing page assets:
- `/landing/index.css` - 404
- `/landing/vite.svg` - 404
- `/icon-192x192.png` - 404 (requested from root instead of `/landing/`)

## Root Causes

1. **CSS files** - Vite might output CSS in root of dist, not just in assets/
2. **Public assets** - Files like `vite.svg`, icons need special handling
3. **Manifest.json** - Icon paths need `/landing/` prefix since base is `/landing/`

## Solutions Applied

### 1. Updated Nginx Config

Added location blocks to handle:
- CSS/JS files in landing root
- Public assets (vite.svg, icons, manifest.json)
- All asset types properly

### 2. Updated manifest.json

Changed icon paths from `/icon-192x192.png` to `/landing/icon-192x192.png` to match the base path.

## Steps to Fix

### Step 1: Update Nginx Config

Add these location blocks BEFORE the `location /landing` block:

```nginx
    # Landing Page - Public Assets (vite.svg, icons, etc.)
    location ~ ^/landing/(vite\.svg|icon-.*\.png|manifest\.json|.*\.(ico|svg|webmanifest))$ {
        alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/$1;
        expires 1d;
        access_log off;
    }

    # Landing Page - CSS/JS files in root of landing
    location ~ ^/landing/(index\.css|index\.js|.*\.css|.*\.js)$ {
        alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/$1;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
```

### Step 2: Rebuild Landing App

After updating manifest.json, rebuild:

```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend/landing
npm run build
```

### Step 3: Test and Reload Nginx

```bash
# Test config
nginx -t

# Reload
systemctl reload nginx
```

## Verify Assets Exist

```bash
# Check landing dist structure
ls -la /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/

# Should see:
# - index.html
# - assets/ (folder with JS/CSS)
# - vite.svg (if in public folder)
# - icon-192x192.png (if in public folder)
# - icon-512x512.png (if in public folder)
# - manifest.json
```

## If Icons Are Missing

If icons don't exist, create them or copy from another app:

```bash
# Option 1: Copy from guest app (if they exist)
cp /www/wwwroot/orderly.kareemsoft.org/frontend/guest/public/icon-*.png \
   /www/wwwroot/orderly.kareemsoft.org/frontend/landing/public/

# Option 2: Create placeholder icons (192x192 and 512x512 PNG files)
# Place them in frontend/landing/public/

# Then rebuild
cd /www/wwwroot/orderly.kareemsoft.org/frontend/landing
npm run build
```

## Complete Nginx Location Block Order

For landing page, the order should be:

1. `/landing/assets/` - JS/CSS in assets folder
2. `/landing/vite.svg|icon-*.png|manifest.json` - Public assets
3. `/landing/*.css|*.js` - CSS/JS in root
4. `/landing` - Main landing app (with fallback)

## After Fixing

1. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check browser console** - should see no 404 errors
3. **Verify assets load** - CSS should apply, icons should show

The landing page should now load all assets correctly!

