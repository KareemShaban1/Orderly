#!/bin/bash

# Fix permissions for Orderly System
# Run this script on your server

echo "Fixing permissions for Orderly System..."
echo ""

BASE_PATH="/www/wwwroot/orderly.kareemsoft.org"

# Set ownership to www user (Nginx user)
echo "1. Setting ownership to www:www..."
chown -R www:www $BASE_PATH

# Set directory permissions
echo "2. Setting directory permissions (755)..."
find $BASE_PATH -type d -exec chmod 755 {} \;

# Set file permissions
echo "3. Setting file permissions (644)..."
find $BASE_PATH -type f -exec chmod 644 {} \;

# Special permissions for Laravel storage
echo "4. Setting Laravel storage permissions..."
if [ -d "$BASE_PATH/backend/storage" ]; then
    chmod -R 775 $BASE_PATH/backend/storage
    chmod -R 775 $BASE_PATH/backend/bootstrap/cache
    echo "   ✅ Laravel storage permissions set"
fi

# Verify Nginx can read files
echo ""
echo "5. Verifying Nginx can read files..."
echo "----------------------------------------"

# Test admin assets
if [ -d "$BASE_PATH/frontend/admin/dist/assets" ]; then
    TEST_FILE=$(ls $BASE_PATH/frontend/admin/dist/assets/*.js 2>/dev/null | head -1)
    if [ -n "$TEST_FILE" ]; then
        if sudo -u www test -r "$TEST_FILE"; then
            echo "✅ Admin assets: Nginx can read"
        else
            echo "❌ Admin assets: Nginx CANNOT read (check permissions)"
        fi
    fi
fi

# Test kitchen assets
if [ -d "$BASE_PATH/frontend/kitchen/dist/assets" ]; then
    TEST_FILE=$(ls $BASE_PATH/frontend/kitchen/dist/assets/*.js 2>/dev/null | head -1)
    if [ -n "$TEST_FILE" ]; then
        if sudo -u www test -r "$TEST_FILE"; then
            echo "✅ Kitchen assets: Nginx can read"
        else
            echo "❌ Kitchen assets: Nginx CANNOT read (check permissions)"
        fi
    fi
fi

# Test guest assets
if [ -d "$BASE_PATH/frontend/guest/dist/assets" ]; then
    TEST_FILE=$(ls $BASE_PATH/frontend/guest/dist/assets/*.js 2>/dev/null | head -1)
    if [ -n "$TEST_FILE" ]; then
        if sudo -u www test -r "$TEST_FILE"; then
            echo "✅ Guest assets: Nginx can read"
        else
            echo "❌ Guest assets: Nginx CANNOT read (check permissions)"
        fi
    fi
fi

echo ""
echo "=========================================="
echo "Permission fix complete!"
echo "=========================================="
echo ""
echo "If Nginx still can't read files, check:"
echo "1. Nginx user is 'www' (check: ps aux | grep nginx)"
echo "2. Files exist: ls -la $BASE_PATH/frontend/*/dist/assets/"
echo "3. SELinux is not blocking (if enabled)"



