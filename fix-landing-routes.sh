#!/bin/bash

# Fix landing page routes 404
# Run this on your server

echo "=========================================="
echo "Fixing Landing Page Routes"
echo "=========================================="
echo ""

NGINX_CONFIG="/www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf"

# Backup
cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"

echo "Updating landing location block..."

# Replace the landing location block
sed -i '/location \/landing {/,/^[[:space:]]*}/c\
    # ============================================\
    # Landing Page - Main Location\
    # ============================================\
    location /landing/ {\
        alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/;\
        index index.html;\
        try_files $uri $uri/ /landing/index.html;\
    }\
    \
    # Redirect /landing to /landing/\
    location = /landing {\
        return 301 /landing/;\
    }' "$NGINX_CONFIG"

echo "✅ Config updated"

# Test
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
        echo "Testing routes..."
        
        # Test /landing/
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/landing/ 2>/dev/null)
        if [ "$HTTP_CODE" = "200" ]; then
            echo "✅ /landing/ is accessible (HTTP $HTTP_CODE)"
        else
            echo "⚠️  /landing/ returned HTTP $HTTP_CODE"
        fi
        
        # Test /landing/organizations/
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/landing/organizations/test 2>/dev/null)
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
            echo "✅ /landing/organizations/ route is handled (HTTP $HTTP_CODE)"
        else
            echo "⚠️  /landing/organizations/ returned HTTP $HTTP_CODE"
        fi
    else
        echo "❌ Failed to reload Nginx"
    fi
else
    echo "❌ Config has errors"
fi

echo ""
echo "=========================================="
echo "Fix Complete"
echo "=========================================="
echo ""
echo "Important: The route /organizations/:slug should be accessed as:"
echo "   /landing/organizations/:slug"
echo ""
echo "Not as: /organizations/:slug (this won't work)"

