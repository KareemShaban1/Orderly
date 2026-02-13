#!/bin/bash

# Rebuild all frontend apps with React Router basename fixes
# Run this on your server

BASE_PATH="/www/wwwroot/orderly.kareemsoft.org/frontend"
cd $BASE_PATH

echo "=========================================="
echo "Rebuilding All Frontend Apps"
echo "=========================================="
echo ""

APPS=("admin" "kitchen" "landing" "guest")

for app in "${APPS[@]}"; do
    if [ -d "$app" ]; then
        echo "Building $app..."
        cd $app
        
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            echo "  Installing dependencies..."
            npm install
        fi
        
        # Build
        echo "  Running build..."
        npm run build
        
        if [ $? -eq 0 ]; then
            echo "  ✅ $app built successfully"
            
            # Fix permissions
            if [ -d "dist" ]; then
                echo "  Fixing permissions..."
                chown -R www:www dist
                chmod -R 755 dist
                find dist -type f -exec chmod 644 {} \;
                echo "  ✅ Permissions fixed"
            fi
        else
            echo "  ❌ $app build failed"
        fi
        
        cd ..
        echo ""
    else
        echo "⚠️  $app directory not found"
    fi
done

echo "=========================================="
echo "Rebuild Complete"
echo "=========================================="
echo ""
echo "Test URLs:"
echo "  Admin:   http://orderly.kareemsoft.org/admin/"
echo "  Kitchen: http://orderly.kareemsoft.org/kitchen/"
echo "  Landing: http://orderly.kareemsoft.org/landing/"
echo "  Guest:   http://orderly.kareemsoft.org/"
echo ""
echo "If you see empty pages, check:"
echo "  1. Nginx config is updated and reloaded"
echo "  2. Browser console for errors (F12)"
echo "  3. Network tab for asset loading"

