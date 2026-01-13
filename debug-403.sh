#!/bin/bash

# Comprehensive 403 debugging script

echo "=========================================="
echo "API 403 Debugging Script"
echo "=========================================="
echo ""

BACKEND_PATH="/www/wwwroot/orderly.kareemsoft.org/backend"
cd $BACKEND_PATH

# 1. Check Laravel log
echo "=== Step 1: Laravel Error Log ==="
if [ -f "storage/logs/laravel.log" ]; then
    echo "Recent errors (last 30 lines):"
    tail -30 storage/logs/laravel.log
    echo ""
    echo "Searching for 403/Forbidden/denied:"
    tail -50 storage/logs/laravel.log | grep -i "403\|forbidden\|denied\|access" | tail -10 || echo "   No 403 errors found in log"
else
    echo "❌ Laravel log file not found!"
    echo "   This might be the issue - Laravel can't write logs"
fi

echo ""
echo "=== Step 2: Check Log File Permissions ==="
ls -la storage/logs/ | head -5
if [ -w "storage/logs" ]; then
    echo "✅ storage/logs is writable"
else
    echo "❌ storage/logs is NOT writable"
fi

echo ""
echo "=== Step 3: Test Laravel Directly ==="
echo "Creating test log entry..."
php artisan tinker --execute="Log::info('Test log entry');" 2>/dev/null || echo "   Tinker not available"

echo ""
echo "=== Step 4: Check CORS Config ==="
if [ -f "config/cors.php" ]; then
    echo "CORS config:"
    grep -A 2 "allowed_origins" config/cors.php | head -3
else
    echo "❌ CORS config not found"
fi

echo ""
echo "=== Step 5: Check Middleware ==="
echo "Checking if CORS middleware is registered..."
grep -r "HandleCors\|cors" app/Http/ bootstrap/ 2>/dev/null | head -3 || echo "   No explicit CORS middleware found (using default)"

echo ""
echo "=== Step 6: Check .env ==="
if [ -f ".env" ]; then
    echo "APP_ENV: $(grep APP_ENV .env | cut -d '=' -f2)"
    echo "APP_DEBUG: $(grep APP_DEBUG .env | cut -d '=' -f2)"
    echo "APP_URL: $(grep APP_URL .env | cut -d '=' -f2)"
else
    echo "❌ .env file not found!"
fi

echo ""
echo "=== Step 7: Test with Verbose Error ==="
echo "Making test request..."
curl -X POST http://orderly.kareemsoft.org/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -v 2>&1 | grep -E "(HTTP|403|Forbidden|denied)" | head -5

echo ""
echo "=== Step 8: Check Nginx Error Log ==="
echo "Recent Nginx errors:"
tail -20 /www/wwwlogs/orderly.kareemsoft.org.error.log 2>/dev/null | grep -i "api\|403\|forbidden" | tail -5 || echo "   No API errors in Nginx log"

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Check the Laravel log output above"
echo "2. If log is empty, fix permissions:"
echo "   chown -R www:www storage bootstrap/cache"
echo "   chmod -R 775 storage bootstrap/cache"
echo "3. Try enabling APP_DEBUG=true temporarily"
echo "4. Check if there's a security module blocking requests"

