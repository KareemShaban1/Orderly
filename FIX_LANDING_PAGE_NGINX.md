# Fix Landing Page Empty Page Issue

## Problem
`https://orderly.kareemsoft.org/landing` returns an empty page because the Nginx configuration for the landing page is commented out.

## Solution

Uncomment and fix the landing page configuration in your Nginx config file. The landing page location blocks need to be added BEFORE the root location (`/`) block.

## Updated Nginx Configuration

Add this configuration BEFORE the `location /` block (around line 120):

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

## Steps to Fix

### Step 1: Update Nginx Config

Edit your Nginx config file (usually at `/www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf` or similar):

1. Find the commented landing page section (around line 132-149)
2. Replace it with the uncommented version above
3. Make sure it's placed BEFORE the `location /` block

### Step 2: Verify Landing App is Built

```bash
# Check if landing app dist folder exists
ls -la /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/

# If not, build it
cd /www/wwwroot/orderly.kareemsoft.org/frontend/landing
npm install
npm run build
```

### Step 3: Test Nginx Config

```bash
# Test Nginx configuration
nginx -t

# If OK, reload Nginx
systemctl reload nginx
# Or if using BT Panel:
bt reload
```

### Step 4: Verify

1. Check browser console (F12) for any 404 errors
2. Visit `https://orderly.kareemsoft.org/landing`
3. Should see the landing page content

## Important: Location Block Order

The location blocks MUST be in this order (most specific first):

1. `/api` - Backend API
2. `/admin/assets/` - Admin assets
3. `/admin` - Admin app
4. `/kitchen/assets/` - Kitchen assets
5. `/kitchen` - Kitchen app
6. `/landing/assets/` - Landing assets (NEW)
7. `/landing` - Landing app (NEW)
8. `/assets/` - Guest assets
9. `/` - Guest app (MUST be last)

## Quick Fix Script

```bash
#!/bin/bash

NGINX_CONFIG="/www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf"

# Backup config
cp $NGINX_CONFIG ${NGINX_CONFIG}.backup

# Add landing page config before location / block
sed -i '/location \/ {/i\
    # ============================================\
    # Landing Page - Static Assets (MUST come before /landing)\
    # ============================================\
    location ~ ^/landing/assets/(.*)$ {\
        alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/assets/$1;\
        expires 1y;\
        add_header Cache-Control "public, immutable";\
        access_log off;\
    }\
\
    # ============================================\
    # Landing Page\
    # ============================================\
    location /landing {\
        alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist;\
        index index.html;\
        try_files $uri $uri/ @landing_fallback;\
    }\
    \
    location @landing_fallback {\
        rewrite ^/landing/(.*)$ /landing/index.html last;\
    }\
' $NGINX_CONFIG

# Test config
nginx -t && systemctl reload nginx && echo "✅ Nginx reloaded successfully"
```

## Verify Landing App Build

```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend/landing

# Check if dist exists
if [ ! -d "dist" ]; then
    echo "Building landing app..."
    npm install
    npm run build
fi

# Check dist contents
ls -la dist/
```

## After Fixing

1. **Test Nginx config**: `nginx -t`
2. **Reload Nginx**: `systemctl reload nginx` or use BT Panel
3. **Visit**: `https://orderly.kareemsoft.org/landing`
4. **Check browser console** for any asset loading errors

The landing page should now work correctly!

