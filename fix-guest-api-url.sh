#!/bin/bash

# Fix API URL for guest app
# Run this on your server

echo "=========================================="
echo "Fixing Guest App API URL"
echo "=========================================="
echo ""

GUEST_PATH="/www/wwwroot/orderly.kareemsoft.org/frontend/guest"
cd $GUEST_PATH

# Option 1: Set environment variable (recommended)
echo "1. Setting VITE_API_URL in .env file..."
if [ -f ".env" ]; then
    if grep -q "VITE_API_URL" .env; then
        sed -i 's|VITE_API_URL=.*|VITE_API_URL=http://orderly.kareemsoft.org|' .env
        echo "   ✅ Updated existing VITE_API_URL"
    else
        echo "VITE_API_URL=http://orderly.kareemsoft.org" >> .env
        echo "   ✅ Added VITE_API_URL"
    fi
else
    echo "VITE_API_URL=http://orderly.kareemsoft.org" > .env
    echo "   ✅ Created .env file with VITE_API_URL"
fi

echo ""
echo "2. Current .env content:"
cat .env

echo ""
echo "3. Rebuilding guest app..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Guest app rebuilt successfully!"
    echo ""
    echo "The API URL is now set to: http://orderly.kareemsoft.org"
    echo ""
    echo "Note: If you're using HTTPS, update .env to:"
    echo "   VITE_API_URL=https://orderly.kareemsoft.org"
    echo "   Then run: npm run build"
else
    echo ""
    echo "❌ Build failed. Check the error messages above."
fi

