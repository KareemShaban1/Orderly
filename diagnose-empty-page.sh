#!/bin/bash

# Comprehensive diagnostic script for empty page issue
# Run this on your server

echo "=========================================="
echo "Empty Page Diagnostic Script"
echo "=========================================="
echo ""

BASE_PATH="/www/wwwroot/orderly.kareemsoft.org"
ADMIN_DIST="$BASE_PATH/frontend/admin/dist"

echo "=== Step 1: Check if index.html exists ==="
if [ -f "$ADMIN_DIST/index.html" ]; then
    FILE_SIZE=$(stat -f%z "$ADMIN_DIST/index.html" 2>/dev/null || stat -c%s "$ADMIN_DIST/index.html" 2>/dev/null)
    echo "✅ index.html exists"
    echo "   Size: $FILE_SIZE bytes"
    
    if [ "$FILE_SIZE" -eq 0 ]; then
        echo "   ⚠️  WARNING: File is empty (0 bytes)!"
        echo "   Solution: Rebuild the app"
    else
        echo "   ✅ File has content"
        echo ""
        echo "   First 30 lines of index.html:"
        head -30 "$ADMIN_DIST/index.html"
        echo ""
    fi
else
    echo "❌ index.html NOT FOUND at: $ADMIN_DIST/index.html"
    echo "   Solution: Run 'cd $BASE_PATH/frontend/admin && npm run build'"
    exit 1
fi

echo ""
echo "=== Step 2: Check file permissions ==="
ls -la "$ADMIN_DIST/index.html"
echo ""

# Check if www user can read
if sudo -u www test -r "$ADMIN_DIST/index.html" 2>/dev/null; then
    echo "✅ Nginx (www user) can read index.html"
else
    echo "❌ Nginx cannot read index.html"
    echo "   Fixing permissions..."
    chown -R www:www "$ADMIN_DIST"
    chmod 644 "$ADMIN_DIST/index.html"
    echo "   ✅ Permissions fixed"
fi

echo ""
echo "=== Step 3: Check Nginx config ==="
NGINX_CONFIG="/www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf"
if [ -f "$NGINX_CONFIG" ]; then
    echo "✅ Nginx config file found: $NGINX_CONFIG"
    echo ""
    echo "   Checking for admin location block:"
    if grep -q "location /admin" "$NGINX_CONFIG"; then
        echo "   ✅ Found 'location /admin' block"
        echo ""
        echo "   Admin location block content:"
        grep -A 5 "location /admin" "$NGINX_CONFIG" | head -10
    else
        echo "   ❌ 'location /admin' block NOT FOUND in config!"
        echo "   Solution: Update Nginx config with the new configuration"
    fi
    
    echo ""
    echo "   Checking for admin_fallback:"
    if grep -q "@admin_fallback" "$NGINX_CONFIG"; then
        echo "   ✅ Found '@admin_fallback' named location"
    else
        echo "   ⚠️  '@admin_fallback' not found - might be using old config"
    fi
else
    echo "❌ Nginx config file not found at: $NGINX_CONFIG"
    echo "   Looking for config files..."
    find /www/server -name "*orderly*" -type f 2>/dev/null | head -5
fi

echo ""
echo "=== Step 4: Test Nginx config ==="
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx config syntax is valid"
else
    echo "❌ Nginx config has errors:"
    nginx -t
fi

echo ""
echo "=== Step 5: Test HTTP access with curl ==="
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://orderly.kareemsoft.org/admin/" 2>/dev/null)
if [ "$HTTP_RESPONSE" = "200" ]; then
    echo "✅ HTTP returns 200 OK"
    echo ""
    echo "   Checking if HTML content is returned:"
    HTML_CONTENT=$(curl -s "http://orderly.kareemsoft.org/admin/" | head -5)
    if echo "$HTML_CONTENT" | grep -q "<!DOCTYPE html\|<html"; then
        echo "   ✅ HTML content is being served"
        echo "   First 5 lines:"
        echo "$HTML_CONTENT" | head -5
    else
        echo "   ⚠️  Response doesn't look like HTML:"
        echo "$HTML_CONTENT" | head -5
    fi
else
    echo "❌ HTTP returns: $HTTP_RESPONSE (expected 200)"
    echo "   Full response:"
    curl -v "http://orderly.kareemsoft.org/admin/" 2>&1 | head -20
fi

echo ""
echo "=== Step 6: Check for assets in index.html ==="
if [ -f "$ADMIN_DIST/index.html" ]; then
    echo "   Looking for asset references:"
    grep -o 'src="[^"]*\.js"' "$ADMIN_DIST/index.html" | head -3
    grep -o 'href="[^"]*\.css"' "$ADMIN_DIST/index.html" | head -3
    
    echo ""
    echo "   Checking if assets exist:"
    ASSET_JS=$(grep -o 'src="[^"]*\.js"' "$ADMIN_DIST/index.html" | head -1 | sed 's/src="//;s/"//')
    if [ -n "$ASSET_JS" ]; then
        # Remove /admin prefix to get actual file path
        ASSET_FILE=$(echo "$ASSET_JS" | sed 's|^/admin/||')
        if [ -f "$ADMIN_DIST/$ASSET_FILE" ]; then
            echo "   ✅ Asset file exists: $ASSET_FILE"
        else
            echo "   ❌ Asset file NOT found: $ASSET_FILE"
            echo "   Expected at: $ADMIN_DIST/$ASSET_FILE"
        fi
    fi
fi

echo ""
echo "=== Step 7: Check Nginx error logs ==="
echo "   Recent errors for admin:"
tail -20 /www/wwwlogs/orderly.kareemsoft.org.error.log 2>/dev/null | grep -i admin | tail -5 || echo "   No admin-related errors found"

echo ""
echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. If index.html is empty or missing: cd $BASE_PATH/frontend/admin && npm run build"
echo "2. If permissions are wrong: chown -R www:www $ADMIN_DIST && chmod -R 755 $ADMIN_DIST"
echo "3. If Nginx config is wrong: Update config file and reload nginx"
echo "4. Check browser console (F12) for JavaScript errors"
echo "5. Verify React Router basename matches '/admin'"

