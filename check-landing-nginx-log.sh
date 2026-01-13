#!/bin/bash

# Check Nginx error log for landing page issues

echo "=== Recent Nginx Errors for Landing Page ==="
tail -30 /www/wwwlogs/orderly.kareemsoft.org.error.log | grep -i "landing" || echo "No landing-specific errors found"

echo ""
echo "=== All Recent Errors ==="
tail -20 /www/wwwlogs/orderly.kareemsoft.org.error.log

echo ""
echo "=== Testing Landing Path ==="
echo "Testing: /landing/"
curl -I http://localhost/landing/ 2>&1 | head -5

echo ""
echo "Testing: /landing/index.html"
curl -I http://localhost/landing/index.html 2>&1 | head -5

