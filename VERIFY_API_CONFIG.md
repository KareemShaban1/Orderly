# Verify API Config is Applied

## Problem
Getting guest app HTML instead of Laravel API response. This means the `/api` location block isn't matching.

## Diagnosis

The response shows HTML from the guest app, which means Nginx is falling through to the root `/` location block instead of matching `/api`.

## Check if Config is Applied

Run this on your server:

```bash
# Check if /api location block exists in the actual config file
grep -A 10 "location.*api" /www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf

# Should show the /api location block
# If it doesn't, the config wasn't updated!
```

## Fix Steps

### Step 1: Verify Config File Location

```bash
# Find the actual config file
nginx -T 2>&1 | grep "orderly.kareemsoft.org" | head -5

# Or check common locations
ls -la /www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf
ls -la /etc/nginx/sites-enabled/orderly.kareemsoft.org.conf
ls -la /etc/nginx/conf.d/orderly.kareemsoft.org.conf
```

### Step 2: Check Current Config

```bash
# View the actual config file
cat /www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf | head -100

# Look for the /api location block
# It should be near the top, before other location blocks
```

### Step 3: Update Config File

If the `/api` block is missing or wrong:

```bash
# Backup current config
cp /www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf \
   /www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf.backup

# Edit the config file
nano /www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf

# OR use vi
vi /www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf
```

Add this at the TOP of the location blocks (right after the `.well-known` block):

```nginx
    # ============================================
    # Backend API - Laravel (MUST come first)
    # ============================================
    location ~ ^/api {
        alias /www/wwwroot/orderly.kareemsoft.org/backend/public;
        try_files $uri $uri/ @api;
        
        location ~ \.php$ {
            fastcgi_pass unix:/tmp/php-cgi-82.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
            fastcgi_hide_header X-Powered-By;
        }
    }
    
    location @api {
        rewrite ^/api/(.*)$ /api/index.php last;
    }
    
    location ~ ^/api/index\.php(/.*)?$ {
        alias /www/wwwroot/orderly.kareemsoft.org/backend/public/index.php;
        fastcgi_pass unix:/tmp/php-cgi-82.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME /www/wwwroot/orderly.kareemsoft.org/backend/public/index.php;
        fastcgi_param REQUEST_URI $request_uri;
        fastcgi_param QUERY_STRING $query_string;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }
```

**Important**: 
- Use `location ~ ^/api` (regex) instead of `location /api` (prefix) for higher priority
- Place it BEFORE the root `/` location block
- Place it AFTER the `.well-known` block

### Step 4: Test and Reload

```bash
# Test config
nginx -t

# If OK, reload
systemctl reload nginx

# Test again
curl -X POST http://orderly.kareemsoft.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -v
```

## Check for Conflicting Rewrites

The config includes:
```nginx
include /www/server/panel/vhost/rewrite/orderly.kareemsoft.org.conf;
```

This might have rewrites that interfere. Check it:

```bash
cat /www/server/panel/vhost/rewrite/orderly.kareemsoft.org.conf
```

If it has rewrites for `/api`, comment them out or adjust them.

## Quick Test Script

```bash
#!/bin/bash

echo "=== Checking API Config ==="
echo ""

CONFIG_FILE="/www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf"

# Check if file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found: $CONFIG_FILE"
    echo "   Finding config file..."
    nginx -T 2>&1 | grep "orderly.kareemsoft.org" | head -3
    exit 1
fi

echo "✅ Config file found: $CONFIG_FILE"
echo ""

# Check if /api location exists
if grep -q "location.*api" "$CONFIG_FILE"; then
    echo "✅ /api location block found"
    echo ""
    echo "Location block content:"
    grep -A 15 "location.*api" "$CONFIG_FILE" | head -20
else
    echo "❌ /api location block NOT FOUND in config!"
    echo "   The config needs to be updated."
    exit 1
fi

echo ""
echo "=== Testing API ==="
HTTP_CODE=$(curl -s -o /tmp/api_test.txt -w "%{http_code}" \
  -X POST "http://orderly.kareemsoft.org/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}' 2>/dev/null)

echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Still 404"
    echo ""
    echo "Response (first 200 chars):"
    head -c 200 /tmp/api_test.txt
    echo ""
    echo ""
    echo "If response is HTML, the /api block isn't matching"
    echo "Check:"
    echo "  1. Config file updated?"
    echo "  2. Nginx reloaded?"
    echo "  3. Location block order (should be before / location)"
else
    echo "✅ API responding! (Status: $HTTP_CODE)"
    echo ""
    echo "Response:"
    cat /tmp/api_test.txt | head -5
fi
```

Run it:
```bash
chmod +x verify-api-config.sh
./verify-api-config.sh
```

## Most Likely Issue

The `/api` location block is **not in the actual config file on the server**, or it's placed **after** the root `/` location block, causing it to never match.

**Solution**: 
1. Find the actual config file
2. Add the `/api` block at the top (before `/` location)
3. Use regex `location ~ ^/api` for higher priority
4. Test and reload

