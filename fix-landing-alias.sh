#!/bin/bash

# Fix landing page alias issue
# Run this on your server

echo "=========================================="
echo "Fixing Landing Page Alias Issue"
echo "=========================================="
echo ""

NGINX_CONFIG="/www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf"

# Backup config
cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Config backed up"

# Fix the landing location block
echo "Fixing landing location block..."

# Replace the problematic try_files with named location
sed -i '/location @landing_fallback {/,/}/d' "$NGINX_CONFIG"

# Replace try_files to use direct path instead of named location
sed -i 's|try_files $uri $uri/ @landing_fallback;|try_files $uri $uri/ /landing/index.html;|' "$NGINX_CONFIG"

echo "✅ Landing location block updated"

# Test config
echo ""
echo "Testing Nginx config..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Config is valid"
    echo ""
    echo "Reloading Nginx..."
    systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx reloaded"
        echo ""
        echo "Testing landing page..."
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/landing/ 2>/dev/null)
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo "✅ Landing page is now accessible (HTTP $HTTP_CODE)"
        else
            echo "⚠️  Still returning HTTP $HTTP_CODE"
            echo "   Check error log: tail -20 /www/wwwlogs/orderly.kareemsoft.org.error.log"
        fi
    else
        echo "❌ Failed to reload Nginx"
    fi
else
    echo "❌ Config has errors - check above"
    echo "   Restore backup if needed"
fi

echo ""
echo "=========================================="
echo "Fix Complete"
echo "=========================================="

