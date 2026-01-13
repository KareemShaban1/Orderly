#!/bin/bash

# Quick deployment check script for Orderly System
# Run this on your server to diagnose issues

echo "=========================================="
echo "Orderly System Deployment Check"
echo "=========================================="
echo ""

# Check if dist folders exist
echo "1. Checking if dist folders exist..."
echo "----------------------------------------"

APPS=("admin" "kitchen" "guest" "landing")
BASE_PATH="/www/wwwroot/orderly.kareemsoft.org/frontend"

for app in "${APPS[@]}"; do
    DIST_PATH="$BASE_PATH/$app/dist"
    if [ -d "$DIST_PATH" ]; then
        INDEX_FILE="$DIST_PATH/index.html"
        if [ -f "$INDEX_FILE" ]; then
            SIZE=$(du -sh "$DIST_PATH" | cut -f1)
            echo "✅ $app: EXISTS (Size: $SIZE)"
            echo "   Index.html: $(ls -lh $INDEX_FILE | awk '{print $5}')"
        else
            echo "❌ $app: DIST EXISTS but index.html MISSING"
        fi
    else
        echo "❌ $app: DIST FOLDER MISSING"
    fi
done

echo ""
echo "2. Checking file permissions..."
echo "----------------------------------------"
ls -ld $BASE_PATH/*/dist 2>/dev/null | awk '{print $1, $3, $4, $9}'

echo ""
echo "3. Testing Nginx can read files..."
echo "----------------------------------------"
for app in "${APPS[@]}"; do
    INDEX_FILE="$BASE_PATH/$app/dist/index.html"
    if [ -f "$INDEX_FILE" ]; then
        if sudo -u www test -r "$INDEX_FILE"; then
            echo "✅ $app: Nginx can read index.html"
        else
            echo "❌ $app: Nginx CANNOT read index.html (permission issue)"
        fi
    fi
done

echo ""
echo "4. Checking Vite base paths in config..."
echo "----------------------------------------"
for app in "${APPS[@]}"; do
    CONFIG_FILE="$BASE_PATH/$app/vite.config.ts"
    if [ -f "$CONFIG_FILE" ]; then
        if grep -q "base:" "$CONFIG_FILE"; then
            BASE=$(grep "base:" "$CONFIG_FILE" | head -1 | sed "s/.*base: ['\"]\(.*\)['\"].*/\1/")
            echo "✅ $app: base = $BASE"
        else
            echo "❌ $app: NO BASE PATH SET in vite.config.ts"
        fi
    fi
done

echo ""
echo "5. Checking Nginx configuration..."
echo "----------------------------------------"
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors:"
    nginx -t
fi

echo ""
echo "6. Quick file access test..."
echo "----------------------------------------"
echo "Testing if files are accessible via Nginx paths:"

for app in "${APPS[@]}"; do
    INDEX_FILE="$BASE_PATH/$app/dist/index.html"
    if [ -f "$INDEX_FILE" ]; then
        echo "  $app/index.html: $(head -1 $INDEX_FILE | cut -c1-50)..."
    fi
done

echo ""
echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="
echo ""
echo "Next steps if issues found:"
echo "1. If dist folders missing: Run 'npm run build' in each app"
echo "2. If permissions wrong: Run 'chown -R www:www $BASE_PATH'"
echo "3. If base path missing: Update vite.config.ts and rebuild"
echo "4. If Nginx errors: Check /www/wwwlogs/orderly.kareemsoft.org.error.log"



