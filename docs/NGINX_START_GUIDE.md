# Starting Nginx on Contabo/BT Panel Server

## Problem
Getting error: `nginx.service is not active, cannot reload`

## Solution

### Option 1: Start Nginx First (Recommended)

```bash
# Start nginx
systemctl start nginx

# Then reload
systemctl reload nginx

# Or restart
systemctl restart nginx
```

### Option 2: Use BT Panel Command

If you're using BT Panel (Baota Panel), try:

```bash
# Start nginx
/etc/init.d/nginx start

# Or reload
/etc/init.d/nginx reload

# Or restart
/etc/init.d/nginx restart
```

### Option 3: Direct Nginx Binary

```bash
# Start nginx directly
/www/server/nginx/sbin/nginx

# Test config first
/www/server/nginx/sbin/nginx -t

# Reload (if already running)
/www/server/nginx/sbin/nginx -s reload
```

### Option 4: Service Command

```bash
# Start
service nginx start

# Reload
service nginx reload

# Restart
service nginx restart
```

## Check Nginx Status

```bash
# Check if nginx is running
systemctl status nginx

# Or
ps aux | grep nginx

# Or check if port 80 is listening
netstat -tlnp | grep :80
# or
ss -tlnp | grep :80
```

## Verify Nginx is Working

After starting, test:

```bash
# Test config
nginx -t

# Test HTTP access
curl -I http://localhost

# Or test your domain
curl -I http://orderly.kareemsoft.org/admin/
```

## Common Issues

### Issue 1: Port 80 Already in Use
If port 80 is already in use by another service (like Apache):

```bash
# Check what's using port 80
lsof -i :80
# or
netstat -tlnp | grep :80

# Stop Apache if needed (BT Panel)
/etc/init.d/httpd stop
# or
systemctl stop httpd
```

### Issue 2: Permission Denied
If you get permission errors:

```bash
# Nginx needs to run as root or www user
# Check nginx user in config
grep "user" /www/server/nginx/conf/nginx.conf

# Should see: user www www; or user nginx;
```

### Issue 3: Config File Not Found
If nginx can't find the config:

```bash
# Find nginx config location
nginx -t

# Or check BT Panel config location
ls -la /www/server/panel/vhost/nginx/

# Your site config should be at:
# /www/server/panel/vhost/nginx/orderly.kareemsoft.org.conf
```

## Quick Start Script

```bash
#!/bin/bash
# Quick start script

# Test config first
if nginx -t; then
    echo "✅ Config is valid"
    
    # Try to start
    if systemctl start nginx 2>/dev/null; then
        echo "✅ Nginx started"
    elif /etc/init.d/nginx start 2>/dev/null; then
        echo "✅ Nginx started (init.d)"
    elif /www/server/nginx/sbin/nginx 2>/dev/null; then
        echo "✅ Nginx started (direct)"
    else
        echo "❌ Could not start Nginx"
        exit 1
    fi
    
    # Check status
    sleep 1
    if systemctl is-active --quiet nginx || pgrep nginx > /dev/null; then
        echo "✅ Nginx is running"
        systemctl status nginx --no-pager | head -3
    else
        echo "❌ Nginx failed to start"
        exit 1
    fi
else
    echo "❌ Config has errors - fix them first"
    exit 1
fi
```

## After Starting Nginx

1. **Test your site:**
   ```bash
   curl http://orderly.kareemsoft.org/admin/
   ```

2. **Check error logs:**
   ```bash
   tail -f /www/wwwlogs/orderly.kareemsoft.org.error.log
   ```

3. **Verify in browser:**
   - Open `http://orderly.kareemsoft.org/admin/`
   - Should see your React app (not empty page)

