#!/bin/bash

# Complete fix for landing page 404
# Run this on your server

echo "=========================================="
echo "Fixing Landing Page 404 - Complete Fix"
echo "=========================================="
echo ""

LANDING_PATH="/www/wwwroot/orderly.kareemsoft.org/frontend/landing"
LANDING_DIST="$LANDING_PATH/dist"
NGINX_CONFIG="/www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf"

# Step 1: Check and build landing app
echo "=== Step 1: Checking Landing App Build ==="
if [ ! -d "$LANDING_DIST" ]; then
    echo "❌ Landing dist folder not found"
    echo "   Building landing app..."
    cd "$LANDING_PATH"
    npm install
    npm run build
    
    if [ ! -d "$LANDING_DIST" ]; then
        echo "❌ Build failed - dist folder still missing"
        exit 1
    fi
    echo "✅ Landing app built"
else
    echo "✅ Landing dist folder exists"
    
    # Check if index.html exists
    if [ ! -f "$LANDING_DIST/index.html" ]; then
        echo "⚠️  index.html missing, rebuilding..."
        cd "$LANDING_PATH"
        npm run build
    fi
fi

# Step 2: Fix permissions
echo ""
echo "=== Step 2: Fixing Permissions ==="
chown -R www:www "$LANDING_DIST" 2>/dev/null
find "$LANDING_DIST" -type d -exec chmod 755 {} \; 2>/dev/null
find "$LANDING_DIST" -type f -exec chmod 644 {} \; 2>/dev/null
echo "✅ Permissions fixed"

# Step 3: Check Nginx config
echo ""
echo "=== Step 3: Checking Nginx Config ==="
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Nginx config not found at: $NGINX_CONFIG"
    echo "   Please update the path in this script"
    exit 1
fi

# Check if landing config exists
if grep -q "location /landing {" "$NGINX_CONFIG" && ! grep -q "^[[:space:]]*#.*location /landing" "$NGINX_CONFIG"; then
    echo "✅ Landing location block found"
    
    # Check if it's before root location
    LANDING_LINE=$(grep -n "location /landing {" "$NGINX_CONFIG" | cut -d: -f1)
    ROOT_LINE=$(grep -n "^[[:space:]]*location / {" "$NGINX_CONFIG" | cut -d: -f1)
    
    if [ -n "$LANDING_LINE" ] && [ -n "$ROOT_LINE" ] && [ "$LANDING_LINE" -lt "$ROOT_LINE" ]; then
        echo "✅ Landing config is before root location (correct order)"
    else
        echo "⚠️  Landing config might be after root location"
        echo "   This could cause issues - check config order"
    fi
else
    echo "❌ Landing location block NOT FOUND or is COMMENTED"
    echo ""
    echo "Adding landing configuration..."
    
    # Find root location line
    ROOT_LINE=$(grep -n "^[[:space:]]*location / {" "$NGINX_CONFIG" | cut -d: -f1)
    
    if [ -z "$ROOT_LINE" ]; then
        echo "❌ Could not find root location block"
        exit 1
    fi
    
    # Insert landing config before root location
    sed -i "${ROOT_LINE}i\\
    # ============================================\\
    # Landing Page - Static Assets (MUST come before /landing)\\
    # ============================================\\
    location ~ ^/landing/assets/(.*)$ {\\
        alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/assets/\$1;\\
        expires 1y;\\
        add_header Cache-Control \"public, immutable\";\\
        access_log off;\\
    }\\
\\
    # ============================================\\
    # Landing Page - Public Assets (vite.svg, icons, etc.)\\
    # ============================================\\
    location ~ ^/landing/(vite\\.svg|icon-.*\\.png|manifest\\.json|.*\\.(ico|svg|webmanifest))$ {\\
        alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/\$1;\\
        expires 1d;\\
        access_log off;\\
    }\\
\\
    # ============================================\\
    # Landing Page - CSS/JS files in root of landing\\
    # ============================================\\
    location ~ ^/landing/(index\\.css|index\\.js|.*\\.css|.*\\.js)$ {\\
        alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/\$1;\\
        expires 1y;\\
        add_header Cache-Control \"public, immutable\";\\
        access_log off;\\
    }\\
\\
    # ============================================\\
    # Landing Page\\
    # ============================================\\
    location /landing {\\
        alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist;\\
        index index.html;\\
        try_files \$uri \$uri/ @landing_fallback;\\
    }\\
    \\
    location @landing_fallback {\\
        rewrite ^/landing/(.*)$ /landing/index.html last;\\
    }\\
" "$NGINX_CONFIG"
    
    echo "✅ Landing configuration added"
fi

# Step 4: Test Nginx config
echo ""
echo "=== Step 4: Testing Nginx Config ==="
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx config has errors"
    echo "   Please fix the errors above"
    exit 1
fi

echo "✅ Nginx config is valid"

# Step 5: Reload Nginx
echo ""
echo "=== Step 5: Reloading Nginx ==="
systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || /etc/init.d/nginx reload 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Nginx reloaded successfully"
else
    echo "⚠️  Could not reload Nginx automatically"
    echo "   Please reload manually: systemctl reload nginx"
fi

# Step 6: Verify
echo ""
echo "=== Step 6: Verification ==="
echo "Checking if landing page is accessible..."

# Test locally
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/landing/ 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Landing page accessible (HTTP $HTTP_CODE)"
else
    echo "⚠️  Landing page returned HTTP $HTTP_CODE"
    echo "   Check error log: tail -20 /www/wwwlogs/orderly.kareemsoft.org.error.log"
fi

echo ""
echo "=========================================="
echo "Fix Complete!"
echo "=========================================="
echo ""
echo "Test the landing page:"
echo "   https://orderly.kareemsoft.org/landing"
echo ""
echo "If still getting 404:"
echo "1. Check error log: tail -20 /www/wwwlogs/orderly.kareemsoft.org.error.log"
echo "2. Verify dist exists: ls -la $LANDING_DIST"
echo "3. Check Nginx config: grep -A 5 'location /landing' $NGINX_CONFIG"

