#!/bin/bash

# Diagnostic script for landing page 404
# Run this on your server

echo "=========================================="
echo "Landing Page 404 Diagnostic"
echo "=========================================="
echo ""

LANDING_DIST="/www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist"
NGINX_CONFIG="/www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf"

echo "=== Step 1: Check if landing dist exists ==="
if [ -d "$LANDING_DIST" ]; then
    echo "✅ Landing dist folder exists: $LANDING_DIST"
    echo ""
    echo "Contents:"
    ls -la "$LANDING_DIST" | head -20
    echo ""
    
    if [ -f "$LANDING_DIST/index.html" ]; then
        echo "✅ index.html exists"
    else
        echo "❌ index.html NOT FOUND"
        echo "   Need to build landing app"
    fi
else
    echo "❌ Landing dist folder NOT FOUND: $LANDING_DIST"
    echo "   Need to build landing app"
fi

echo ""
echo "=== Step 2: Check Nginx config for landing ==="
if [ -f "$NGINX_CONFIG" ]; then
    echo "✅ Nginx config file exists: $NGINX_CONFIG"
    echo ""
    
    # Check if landing location block exists
    if grep -q "location /landing" "$NGINX_CONFIG" && ! grep -q "^[[:space:]]*#.*location /landing" "$NGINX_CONFIG"; then
        echo "✅ Landing location block found (not commented)"
        echo ""
        echo "Landing-related config:"
        grep -A 5 "location /landing" "$NGINX_CONFIG" | head -10
    else
        echo "❌ Landing location block NOT FOUND or is COMMENTED"
        echo ""
        echo "Searching for landing in config:"
        grep -i "landing" "$NGINX_CONFIG" | head -5
    fi
else
    echo "❌ Nginx config file NOT FOUND: $NGINX_CONFIG"
    echo "   Please check the path"
fi

echo ""
echo "=== Step 3: Test Nginx config ==="
nginx -t 2>&1 | head -5

echo ""
echo "=== Step 4: Check if landing assets are accessible ==="
if [ -d "$LANDING_DIST" ]; then
    echo "Testing file access:"
    
    if [ -f "$LANDING_DIST/index.html" ]; then
        echo "✅ Can read index.html"
        FILE_SIZE=$(stat -c%s "$LANDING_DIST/index.html" 2>/dev/null || stat -f%z "$LANDING_DIST/index.html" 2>/dev/null)
        echo "   Size: $FILE_SIZE bytes"
    fi
    
    if [ -d "$LANDING_DIST/assets" ]; then
        ASSET_COUNT=$(find "$LANDING_DIST/assets" -type f | wc -l)
        echo "✅ Assets folder exists with $ASSET_COUNT files"
    else
        echo "⚠️  Assets folder not found"
    fi
fi

echo ""
echo "=== Step 5: Check file permissions ==="
if [ -d "$LANDING_DIST" ]; then
    echo "Permissions:"
    ls -ld "$LANDING_DIST"
    ls -ld "$LANDING_DIST/index.html" 2>/dev/null || echo "   index.html not found"
fi

echo ""
echo "=== Step 6: Test direct file access ==="
if [ -f "$LANDING_DIST/index.html" ]; then
    echo "First 5 lines of index.html:"
    head -5 "$LANDING_DIST/index.html"
    echo ""
    
    # Check if HTML references assets correctly
    if grep -q "/landing/" "$LANDING_DIST/index.html" || grep -q "assets/" "$LANDING_DIST/index.html"; then
        echo "✅ HTML contains asset references"
    else
        echo "⚠️  HTML might not have correct asset paths"
    fi
fi

echo ""
echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. If dist folder missing: cd /www/wwwroot/orderly.kareemsoft.org/frontend/landing && npm run build"
echo "2. If Nginx config missing: Add landing location blocks"
echo "3. If permissions wrong: chown -R www:www $LANDING_DIST"
echo "4. After fixes: nginx -t && systemctl reload nginx"

