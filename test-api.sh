#!/bin/bash

# Test script for API endpoints
# Run this on your server

echo "=========================================="
echo "API Endpoint Diagnostic"
echo "=========================================="
echo ""

BASE_URL="http://orderly.kareemsoft.org"

echo "=== Step 1: Check if backend/public exists ==="
if [ -d "/www/wwwroot/orderly.kareemsoft.org/backend/public" ]; then
    echo "✅ backend/public directory exists"
    ls -la /www/wwwroot/orderly.kareemsoft.org/backend/public/ | head -5
else
    echo "❌ backend/public directory NOT FOUND"
    exit 1
fi

echo ""
echo "=== Step 2: Check if index.php exists ==="
if [ -f "/www/wwwroot/orderly.kareemsoft.org/backend/public/index.php" ]; then
    echo "✅ index.php exists"
    FILE_SIZE=$(stat -c%s "/www/wwwroot/orderly.kareemsoft.org/backend/public/index.php" 2>/dev/null || stat -f%z "/www/wwwroot/orderly.kareemsoft.org/backend/public/index.php")
    echo "   Size: $FILE_SIZE bytes"
else
    echo "❌ index.php NOT FOUND"
    exit 1
fi

echo ""
echo "=== Step 3: Check PHP-FPM socket ==="
if [ -S "/tmp/php-cgi-82.sock" ]; then
    echo "✅ PHP-FPM socket exists: /tmp/php-cgi-82.sock"
else
    echo "⚠️  PHP-FPM socket not found at /tmp/php-cgi-82.sock"
    echo "   Looking for other sockets..."
    find /tmp -name "php*.sock" 2>/dev/null | head -3
fi

echo ""
echo "=== Step 4: Test API endpoint with curl ==="
echo "Testing: POST $BASE_URL/api/auth/login"
HTTP_CODE=$(curl -s -o /tmp/api_test_response.txt -w "%{http_code}" \
  -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  2>/dev/null)

echo "HTTP Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "404" ]; then
    echo "❌ 404 Not Found - API routing issue"
    echo ""
    echo "Response body:"
    cat /tmp/api_test_response.txt
elif [ "$HTTP_CODE" = "422" ] || [ "$HTTP_CODE" = "401" ]; then
    echo "✅ API is working! (Got validation/auth error, which is expected)"
    echo ""
    echo "Response body:"
    cat /tmp/api_test_response.txt | head -10
elif [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API is working! (Got 200 OK)"
    echo ""
    echo "Response body:"
    cat /tmp/api_test_response.txt | head -10
else
    echo "⚠️  Unexpected status code: $HTTP_CODE"
    echo ""
    echo "Response body:"
    cat /tmp/api_test_response.txt | head -20
fi

echo ""
echo "=== Step 5: Check Nginx error logs ==="
echo "Recent API-related errors:"
tail -20 /www/wwwlogs/orderly.kareemsoft.org.error.log 2>/dev/null | grep -i api | tail -5 || echo "   No API errors found"

echo ""
echo "=== Step 6: Check Laravel routes ==="
cd /www/wwwroot/orderly.kareemsoft.org/backend 2>/dev/null
if [ -f "artisan" ]; then
    echo "Checking Laravel routes..."
    php artisan route:list 2>/dev/null | grep "auth/login" || echo "   Route not found in list (may need to clear cache)"
else
    echo "⚠️  Laravel artisan not found"
fi

echo ""
echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="
echo ""
echo "If getting 404:"
echo "  1. Update Nginx config with the new nginx-orderly-config.conf"
echo "  2. Test: nginx -t"
echo "  3. Reload: systemctl reload nginx"
echo "  4. Clear Laravel cache: cd backend && php artisan route:clear"

