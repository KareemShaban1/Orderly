# Quick Fix for Guest App Asset 404 Errors

## Problem
Getting 404 errors:
- `GET http://orderly.kareemsoft.org/assets/index-r-2bCAri.js net::ERR_ABORTED 404`
- `GET http://orderly.kareemsoft.org/assets/index-D3mYwgJO.css net::ERR_ABORTED 404`

## Root Cause
The global Nginx location block `location ~ .*\.(js|css)?$` might be catching assets before the `/assets/` block, OR the files don't exist.

## Quick Fix Steps

### Step 1: Update Nginx Config

The config has been updated to use a regex pattern for `/assets/` (consistent with admin/kitchen apps):

```nginx
location ~ ^/assets/(.*)$ {
    alias /www/wwwroot/orderly.kareemsoft.org/frontend/guest/dist/assets/$1;
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

**On your server:**
```bash
# Copy updated nginx-orderly-config.conf to server
# Then test and reload
nginx -t
systemctl reload nginx
```

### Step 2: Verify Files Exist

```bash
# Check if files exist
ls -la /www/wwwroot/orderly.kareemsoft.org/frontend/guest/dist/assets/

# If empty or missing, rebuild:
cd /www/wwwroot/orderly.kareemsoft.org/frontend/guest
npm run build
```

### Step 3: Fix Permissions

```bash
chown -R www:www /www/wwwroot/orderly.kareemsoft.org/frontend/guest/dist
chmod -R 755 /www/wwwroot/orderly.kareemsoft.org/frontend/guest/dist
find /www/wwwroot/orderly.kareemsoft.org/frontend/guest/dist -type f -exec chmod 644 {} \;
```

### Step 4: Test

```bash
# Test if asset is accessible
curl -I http://orderly.kareemsoft.org/assets/index-r-2bCAri.js

# Should return: HTTP/1.1 200 OK
# If 404, the file name might have changed - check actual files:
ls /www/wwwroot/orderly.kareemsoft.org/frontend/guest/dist/assets/
```

## Most Common Issue: File Names Changed

Asset file names are **hashed** and change with each build:
- Old: `index-r-2bCAri.js`
- New (after rebuild): `index-xyz123.js`

**Solution:** Rebuild the app so `index.html` matches the actual asset files:

```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend/guest
npm run build
```

## Complete Fix Script

```bash
#!/bin/bash

echo "Fixing Guest App Assets..."

# 1. Rebuild
cd /www/wwwroot/orderly.kareemsoft.org/frontend/guest
echo "Rebuilding..."
npm run build

# 2. Fix permissions
echo "Fixing permissions..."
chown -R www:www dist
chmod -R 755 dist
find dist -type f -exec chmod 644 {} \;

# 3. Verify
echo ""
echo "Verifying files..."
ls -lh dist/assets/ | head -5

# 4. Test
echo ""
echo "Testing HTTP access..."
ACTUAL_JS=$(ls dist/assets/ | grep "\.js$" | head -1)
if [ -n "$ACTUAL_JS" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://orderly.kareemsoft.org/assets/$ACTUAL_JS")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Assets accessible!"
    else
        echo "❌ Still getting HTTP $HTTP_CODE"
        echo "   Make sure Nginx config is updated and reloaded"
    fi
fi

echo ""
echo "Done! Update Nginx config and reload if needed."
```

## After Fixing

1. **Update Nginx config** with the new `nginx-orderly-config.conf`
2. **Reload Nginx**: `systemctl reload nginx`
3. **Clear browser cache** (Ctrl+Shift+R)
4. **Test**: Open `http://orderly.kareemsoft.org/` and check browser console

## Why This Happens

1. **File names are hashed** - Each build generates new file names
2. **Global location block** - The `location ~ .*\.(js|css)?$` might catch assets
3. **Files don't exist** - App wasn't built or build failed
4. **Permissions** - Nginx can't read the files

The updated config uses a regex pattern that has higher priority and is more explicit.

