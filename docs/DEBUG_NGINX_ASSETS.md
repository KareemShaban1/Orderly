# Debugging Nginx 404 for Assets

## Problem
Getting 404 errors for assets:
```
GET http://orderly.kareemsoft.org/admin/assets/index-DQN0ks4m.js net::ERR_ABORTED 404 (Not Found)
GET http://orderly.kareemsoft.org/admin/assets/index-NBvGlH-E.css net::ERR_ABORTED 404 (Not Found)
```

## Diagnosis Steps

### 1. Verify Files Exist on Server

```bash
# Check if the built files exist
ls -la /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/assets/

# Should see files like:
# index-DQN0ks4m.js
# index-NBvGlH-E.css
```

### 2. Check File Permissions

```bash
# Files should be readable by www user
ls -la /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/assets/

# Fix if needed:
chown -R www:www /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist
chmod -R 755 /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist
```

### 3. Test Nginx Can Access Files

```bash
# Test as www user
sudo -u www test -r /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/assets/index-DQN0ks4m.js && echo "✅ Can read" || echo "❌ Cannot read"
```

### 4. Check Nginx Error Logs

```bash
# Check for specific errors
tail -f /www/wwwlogs/orderly.kareemsoft.org.error.log

# Or check recent errors
grep "admin/assets" /www/wwwlogs/orderly.kareemsoft.org.error.log
```

### 5. Test Nginx Config

```bash
# Test configuration syntax
nginx -t

# If OK, reload
systemctl reload nginx
```

### 6. Verify Location Block Matching

The updated config uses regex patterns:
```nginx
location ~ ^/admin/assets/(.*)$ {
    alias /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/assets/$1;
    ...
}
```

This should match:
- Request: `/admin/assets/index-DQN0ks4m.js`
- Matches regex: `^/admin/assets/(.*)$`
- Captures: `index-DQN0ks4m.js`
- Resolves to: `/www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/assets/index-DQN0ks4m.js`

### 7. Test with curl

```bash
# Test if file is accessible via HTTP
curl -I http://orderly.kareemsoft.org/admin/assets/index-DQN0ks4m.js

# Should return 200 OK, not 404
```

## Common Issues

### Issue 1: Files Don't Exist
**Solution**: Rebuild the frontend
```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend/admin
npm run build
```

### Issue 2: Wrong Path in alias
**Solution**: Verify the path matches your actual dist folder structure
```bash
# Check actual path
ls -la /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/
```

### Issue 3: Location Block Order
**Solution**: Asset locations MUST come before the main app location blocks
```nginx
# ✅ Correct order
location ~ ^/admin/assets/(.*)$ { ... }  # Assets first
location /admin { ... }                  # App second

# ❌ Wrong order
location /admin { ... }                  # App first (catches everything)
location ~ ^/admin/assets/(.*)$ { ... }  # Assets second (never reached)
```

### Issue 4: Conflicting Location Blocks
**Solution**: Check if other location blocks are interfering
```bash
# Check for conflicting patterns
grep -n "location" /etc/nginx/vhost/orderly.kareemsoft.org.conf
```

## Quick Fix Script

```bash
#!/bin/bash
# Quick diagnostic script

echo "=== Checking Admin Assets ==="
echo ""

# Check if files exist
if [ -f "/www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/assets/index-DQN0ks4m.js" ]; then
    echo "✅ Asset files exist"
else
    echo "❌ Asset files NOT found - need to rebuild"
    echo "   Run: cd /www/wwwroot/orderly.kareemsoft.org/frontend/admin && npm run build"
fi

# Check permissions
if sudo -u www test -r "/www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/assets/index-DQN0ks4m.js"; then
    echo "✅ Nginx can read files"
else
    echo "❌ Permission issue - fixing..."
    chown -R www:www /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist
    chmod -R 755 /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist
fi

# Test Nginx config
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx config is valid"
else
    echo "❌ Nginx config has errors"
    nginx -t
fi

echo ""
echo "=== Test HTTP Access ==="
curl -I http://orderly.kareemsoft.org/admin/assets/index-DQN0ks4m.js 2>&1 | head -1
```

