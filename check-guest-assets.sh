#!/bin/bash

# Diagnostic script for guest app asset 404 errors
# Run this on your server

GUEST_DIST="/www/wwwroot/orderly.kareemsoft.org/frontend/guest/dist"

echo "=========================================="
echo "Guest App Asset Diagnostic"
echo "=========================================="
echo ""

# Check if dist exists
if [ ! -d "$GUEST_DIST" ]; then
    echo "❌ dist folder not found: $GUEST_DIST"
    echo "   Solution: cd /www/wwwroot/orderly.kareemsoft.org/frontend/guest && npm run build"
    exit 1
fi

echo "=== Step 1: Check index.html ==="
if [ -f "$GUEST_DIST/index.html" ]; then
    FILE_SIZE=$(stat -c%s "$GUEST_DIST/index.html" 2>/dev/null || stat -f%z "$GUEST_DIST/index.html")
    echo "✅ index.html exists ($FILE_SIZE bytes)"
    
    echo ""
    echo "   Asset references in index.html:"
    grep -o 'src="[^"]*"' "$GUEST_DIST/index.html" | head -3
    grep -o 'href="[^"]*"' "$GUEST_DIST/index.html" | head -3
    grep -o 'registerSW[^"]*' "$GUEST_DIST/index.html" | head -1
else
    echo "❌ index.html NOT FOUND"
    echo "   Solution: Rebuild the app"
fi

echo ""
echo "=== Step 2: Check assets folder ==="
if [ -d "$GUEST_DIST/assets" ]; then
    ASSET_COUNT=$(find "$GUEST_DIST/assets" -type f | wc -l)
    echo "✅ assets folder exists"
    echo "   File count: $ASSET_COUNT"
    
    echo ""
    echo "   Actual asset files:"
    ls -lh "$GUEST_DIST/assets" | head -5 | awk '{print "     " $9 " (" $5 ")"}'
    
    # Check for specific files mentioned in error
    echo ""
    echo "   Checking for files from error messages:"
    if [ -f "$GUEST_DIST/assets/index-r-2bCAri.js" ]; then
        echo "   ✅ index-r-2bCAri.js exists"
    else
        echo "   ⚠️  index-r-2bCAri.js NOT FOUND (file name may have changed after rebuild)"
        echo "   Actual JS files:"
        ls "$GUEST_DIST/assets" | grep "\.js$" | head -3
    fi
    
    if [ -f "$GUEST_DIST/assets/index-D3mYwgJO.css" ]; then
        echo "   ✅ index-D3mYwgJO.css exists"
    else
        echo "   ⚠️  index-D3mYwgJO.css NOT FOUND (file name may have changed after rebuild)"
        echo "   Actual CSS files:"
        ls "$GUEST_DIST/assets" | grep "\.css$" | head -3
    fi
else
    echo "❌ assets folder NOT FOUND"
    echo "   Solution: Rebuild the app"
fi

echo ""
echo "=== Step 3: Check PWA files ==="
if [ -f "$GUEST_DIST/registerSW.js" ]; then
    echo "✅ registerSW.js exists"
else
    echo "⚠️  registerSW.js not found (may be generated during build)"
fi

if [ -f "$GUEST_DIST/sw.js" ]; then
    echo "✅ sw.js exists"
else
    echo "⚠️  sw.js not found (may be generated during build)"
fi

echo ""
echo "=== Step 4: Check permissions ==="
if sudo -u www test -r "$GUEST_DIST/index.html" 2>/dev/null; then
    echo "✅ Nginx (www user) can read index.html"
else
    echo "❌ Permission issue - Nginx cannot read files"
    echo "   Fixing permissions..."
    chown -R www:www "$GUEST_DIST"
    chmod -R 755 "$GUEST_DIST"
    find "$GUEST_DIST" -type f -exec chmod 644 {} \;
    echo "   ✅ Permissions fixed"
fi

echo ""
echo "=== Step 5: Test HTTP access ==="
# Get actual asset file names
ACTUAL_JS=$(ls "$GUEST_DIST/assets" | grep "\.js$" | head -1)
ACTUAL_CSS=$(ls "$GUEST_DIST/assets" | grep "\.css$" | head -1)

if [ -n "$ACTUAL_JS" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://orderly.kareemsoft.org/assets/$ACTUAL_JS" 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Assets accessible via HTTP (tested: $ACTUAL_JS)"
    else
        echo "❌ Assets NOT accessible (HTTP $HTTP_CODE)"
        echo "   Tested: /assets/$ACTUAL_JS"
    fi
fi

if [ -f "$GUEST_DIST/registerSW.js" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://orderly.kareemsoft.org/registerSW.js" 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ registerSW.js accessible via HTTP"
    else
        echo "❌ registerSW.js NOT accessible (HTTP $HTTP_CODE)"
    fi
fi

echo ""
echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="
echo ""
echo "If files don't exist or names don't match:"
echo "  1. Rebuild: cd /www/wwwroot/orderly.kareemsoft.org/frontend/guest && npm run build"
echo "  2. Update Nginx config with the new nginx-orderly-config.conf"
echo "  3. Reload Nginx: systemctl reload nginx"
echo ""
echo "If permissions are wrong:"
echo "  chown -R www:www $GUEST_DIST"
echo "  chmod -R 755 $GUEST_DIST"

