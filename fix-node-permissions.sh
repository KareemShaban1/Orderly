#!/bin/bash

# Fix permissions for Node.js binaries
# Run this on your server

echo "Fixing Node.js binary permissions..."
echo ""

BASE_PATH="/www/wwwroot/orderly.kareemsoft.org/frontend"

APPS=("admin" "kitchen" "guest" "landing")

for app in "${APPS[@]}"; do
    BIN_PATH="$BASE_PATH/$app/node_modules/.bin"
    
    if [ -d "$BIN_PATH" ]; then
        echo "Fixing permissions for $app..."
        
        # Make all files in .bin executable
        find "$BIN_PATH" -type f -exec chmod +x {} \;
        
        # Set directory permissions
        chmod 755 "$BIN_PATH"
        
        echo "✅ $app: Permissions fixed"
    else
        echo "⚠️  $app: node_modules/.bin not found (run npm install first)"
    fi
done

echo ""
echo "=========================================="
echo "Permission fix complete!"
echo "=========================================="
echo ""
echo "Now you can run: npm run build"



