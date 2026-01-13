# Fix Landing Page 404 - Complete Guide

## Problem
`https://orderly.kareemsoft.org/landing` returns 404 Not Found

## Possible Causes

1. **Landing app not built** - `dist` folder doesn't exist
2. **Nginx config not applied** - Config on server is different from the file
3. **Location block order** - Landing config is after root location block
4. **File permissions** - Nginx can't read the files
5. **Path mismatch** - Alias path doesn't match actual location

## Step-by-Step Fix

### Step 1: Run Diagnostic

```bash
chmod +x diagnose-landing-404.sh
./diagnose-landing-404.sh
```

This will check:
- If dist folder exists
- If Nginx config has landing blocks
- File permissions
- Asset structure

### Step 2: Build Landing App (if needed)

```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend/landing

# Check if dist exists
if [ ! -d "dist" ]; then
    echo "Building landing app..."
    npm install
    npm run build
fi

# Verify build
ls -la dist/
# Should see: index.html, assets/, etc.
```

### Step 3: Check Nginx Config on Server

The actual Nginx config file is usually at:
- `/www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf` (BT Panel)
- Or wherever your panel stores vhost configs

**IMPORTANT**: The landing location blocks MUST be BEFORE the root location (`location /`) block.

Check the order:

```bash
# Find where landing config is
grep -n "location /landing" /www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf

# Find where root location is
grep -n "location / {" /www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf

# Landing should come BEFORE root
```

### Step 4: Add Landing Config (if missing)

If landing config is missing or commented, add this BEFORE `location / {`:

```nginx
    # ============================================
    # Landing Page - Static Assets (MUST come before /landing)
    # ============================================
    location ~ ^/landing/assets/(.*)$ {
        alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/assets/$1;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # ============================================
    # Landing Page - Public Assets (vite.svg, icons, etc.)
    # ============================================
    location ~ ^/landing/(vite\.svg|icon-.*\.png|manifest\.json|.*\.(ico|svg|webmanifest))$ {
        alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/$1;
        expires 1d;
        access_log off;
    }

    # ============================================
    # Landing Page - CSS/JS files in root of landing
    # ============================================
    location ~ ^/landing/(index\.css|index\.js|.*\.css|.*\.js)$ {
        alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/$1;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # ============================================
    # Landing Page
    # ============================================
    location /landing {
        alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist;
        index index.html;
        try_files $uri $uri/ @landing_fallback;
    }
    
    location @landing_fallback {
        rewrite ^/landing/(.*)$ /landing/index.html last;
    }
```

### Step 5: Fix Permissions

```bash
# Set correct ownership
chown -R www:www /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist

# Set correct permissions
find /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist -type d -exec chmod 755 {} \;
find /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist -type f -exec chmod 644 {} \;
```

### Step 6: Test and Reload Nginx

```bash
# Test config
nginx -t

# If OK, reload
systemctl reload nginx
# Or if using BT Panel:
bt reload
```

### Step 7: Verify

1. **Check file exists:**
   ```bash
   curl -I http://localhost/landing/
   # Should return 200, not 404
   ```

2. **Check browser:**
   - Visit `https://orderly.kareemsoft.org/landing`
   - Open browser console (F12)
   - Should see no 404 errors

## Quick Fix Script

```bash
#!/bin/bash

echo "=== Fixing Landing Page 404 ==="

# 1. Build landing app
cd /www/wwwroot/orderly.kareemsoft.org/frontend/landing
if [ ! -d "dist" ]; then
    echo "Building landing app..."
    npm install && npm run build
fi

# 2. Fix permissions
chown -R www:www dist/
find dist -type d -exec chmod 755 {} \;
find dist -type f -exec chmod 644 {} \;

# 3. Test Nginx
nginx -t && systemctl reload nginx

echo "✅ Done! Test: https://orderly.kareemsoft.org/landing"
```

## Common Issues

### Issue 1: Config in Wrong Order

**Symptom**: Landing returns 404, but dist exists

**Fix**: Move landing location blocks BEFORE `location / {`

### Issue 2: Alias Path Wrong

**Symptom**: 404 with "File not found" in error log

**Fix**: Check the alias path matches actual location:
```bash
ls -la /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/index.html
```

### Issue 3: Root Location Catches First

**Symptom**: Landing URL shows guest app content

**Fix**: Ensure landing regex locations come before root location

### Issue 4: Dist Folder Empty

**Symptom**: 404, dist folder exists but is empty

**Fix**: Rebuild the app:
```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend/landing
rm -rf dist node_modules
npm install
npm run build
```

## Verify Everything

After applying fixes, verify:

```bash
# 1. Dist exists and has files
ls -la /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/

# 2. Nginx config has landing blocks
grep -A 3 "location /landing" /www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf

# 3. Nginx config is valid
nginx -t

# 4. Test locally
curl -I http://localhost/landing/

# 5. Check error log
tail -20 /www/wwwlogs/orderly.kareemsoft.org.error.log
```

If still getting 404, check the error log for specific error messages.

