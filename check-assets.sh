#!/bin/bash

# Diagnostic script for Nginx asset 404 errors
# Run this on your server

echo "=========================================="
echo "Nginx Asset Diagnostic Script"
echo "=========================================="
echo ""

BASE_PATH="/www/wwwroot/orderly.kareemsoft.org/frontend"
APPS=("admin" "kitchen" "guest")

for app in "${APPS[@]}"; do
    echo "=== Checking $app ==="
    
    DIST_PATH="$BASE_PATH/$app/dist"
    ASSETS_PATH="$DIST_PATH/assets"
    
    # Check if dist folder exists
    if [ ! -d "$DIST_PATH" ]; then
        echo "❌ dist folder not found: $DIST_PATH"
        echo "   Run: cd $BASE_PATH/$app && npm run build"
        echo ""
        continue
    fi
    
    # Check if assets folder exists
    if [ ! -d "$ASSETS_PATH" ]; then
        echo "❌ assets folder not found: $ASSETS_PATH"
        echo "   Run: cd $BASE_PATH/$app && npm run build"
        echo ""
        continue
    fi
    
    # Count asset files
    ASSET_COUNT=$(find "$ASSETS_PATH" -type f | wc -l)
    echo "✅ Found $ASSET_COUNT asset files"
    
    # Check permissions
    if sudo -u www test -r "$ASSETS_PATH" 2>/dev/null; then
        echo "✅ Nginx (www user) can read assets folder"
    else
        echo "❌ Permission issue - Nginx cannot read assets"
        echo "   Fixing permissions..."
        chown -R www:www "$DIST_PATH"
        chmod -R 755 "$DIST_PATH"
        find "$DIST_PATH" -type f -exec chmod 644 {} \;
    fi
    
    # List first few asset files
    echo "   Sample files:"
    ls -lh "$ASSETS_PATH" | head -3 | awk '{print "     " $9 " (" $5 ")"}'
    
    echo ""
done

echo "=========================================="
echo "Testing Nginx Configuration"
echo "=========================================="

# Test Nginx config
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx configuration is valid"
    echo ""
    echo "To apply changes, run:"
    echo "  systemctl reload nginx"
else
    echo "❌ Nginx configuration has errors:"
    nginx -t
fi

echo ""
echo "=========================================="
echo "Quick HTTP Tests"
echo "=========================================="
echo ""

# Test admin assets
echo "Testing admin assets..."
ADMIN_ASSET=$(find "$BASE_PATH/admin/dist/assets" -name "*.js" -type f 2>/dev/null | head -1)
if [ -n "$ADMIN_ASSET" ]; then
    ASSET_NAME=$(basename "$ADMIN_ASSET")
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://orderly.kareemsoft.org/admin/assets/$ASSET_NAME" 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Admin assets accessible (HTTP $HTTP_CODE)"
    else
        echo "❌ Admin assets NOT accessible (HTTP $HTTP_CODE)"
        echo "   File: $ASSET_NAME"
    fi
else
    echo "⚠️  No admin assets found to test"
fi

echo ""
echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="

