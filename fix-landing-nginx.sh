#!/bin/bash

# Fix Landing Page Nginx Configuration
# Run this on your server

echo "=========================================="
echo "Fixing Landing Page Nginx Configuration"
echo "=========================================="
echo ""

NGINX_CONFIG="/www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf"

if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Nginx config file not found at: $NGINX_CONFIG"
    echo "   Please check the path and update this script"
    exit 1
fi

# Backup config
echo "1. Backing up Nginx config..."
cp $NGINX_CONFIG ${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)
echo "   ✅ Backup created"

# Check if landing config already exists
if grep -q "location /landing {" "$NGINX_CONFIG" && ! grep -q "^[[:space:]]*#.*location /landing" "$NGINX_CONFIG"; then
    echo ""
    echo "⚠️  Landing page configuration already exists and is not commented"
    echo "   Skipping configuration update"
else
    echo ""
    echo "2. Adding landing page configuration..."
    
    # Find the line with "location / {" (guest app root)
    # Insert landing config before it
    sed -i '/^[[:space:]]*location \/ {$/i\
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
' "$NGINX_CONFIG"
    
    echo "   ✅ Landing page configuration added"
fi

# Remove commented landing config if exists
echo ""
echo "3. Removing old commented landing config..."
sed -i '/^[[:space:]]*#[[:space:]]*location \/landing/,/^[[:space:]]*#[[:space:]]*}/d' "$NGINX_CONFIG"
echo "   ✅ Old commented config removed"

# Check if landing app is built
echo ""
echo "4. Checking landing app build..."
LANDING_DIST="/www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist"
if [ ! -d "$LANDING_DIST" ]; then
    echo "   ⚠️  Landing app dist folder not found"
    echo "   Building landing app..."
    cd /www/wwwroot/orderly.kareemsoft.org/frontend/landing
    npm install && npm run build
    if [ $? -eq 0 ]; then
        echo "   ✅ Landing app built successfully"
    else
        echo "   ❌ Landing app build failed"
    fi
else
    echo "   ✅ Landing app dist folder exists"
fi

# Test Nginx config
echo ""
echo "5. Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Nginx configuration is valid"
    echo ""
    echo "6. Reloading Nginx..."
    systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || /etc/init.d/nginx reload 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Nginx reloaded successfully"
        echo ""
        echo "=========================================="
        echo "✅ Landing page configuration complete!"
        echo "=========================================="
        echo ""
        echo "Test the landing page:"
        echo "   https://orderly.kareemsoft.org/landing"
    else
        echo "   ⚠️  Could not reload Nginx automatically"
        echo "   Please reload manually: systemctl reload nginx"
    fi
else
    echo ""
    echo "❌ Nginx configuration has errors"
    echo "   Please check the config file and fix errors"
    echo "   Backup saved at: ${NGINX_CONFIG}.backup.*"
fi

