# Quick Fix for 403 Forbidden Error

## Problem
Getting `403 Forbidden` when accessing assets:
- `GET http://orderly.kareemsoft.org/admin/assets/index-DQN0ks4m.js net::ERR_ABORTED 403 (Forbidden)`

## Solution

### Step 1: Fix File Permissions (CRITICAL)

Run this on your server:

```bash
# Fix ownership
chown -R www:www /www/wwwroot/orderly.kareemsoft.org/frontend

# Fix permissions
find /www/wwwroot/orderly.kareemsoft.org/frontend -type d -exec chmod 755 {} \;
find /www/wwwroot/orderly.kareemsoft.org/frontend -type f -exec chmod 644 {} \;

# Verify Nginx can read
sudo -u www ls /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/assets/ | head -3
```

If the last command fails, permissions are the issue.

### Step 2: Update Nginx Config

The updated `nginx-orderly-config.conf` now uses:
- `alias` instead of `root` for asset locations
- Proper trailing slashes in alias paths

Update your Nginx config and reload:

```bash
nginx -t
systemctl reload nginx
```

### Step 3: Check Nginx User

Verify Nginx is running as `www` user:

```bash
ps aux | grep nginx | head -2
```

Should show `www` or `nginx` user. If different, update permissions accordingly.

### Step 4: Check SELinux (if enabled)

If SELinux is enabled, it might be blocking:

```bash
# Check if SELinux is enabled
getenforce

# If enabled and still having issues, temporarily disable to test:
# setenforce 0
```

### Step 5: Test Direct File Access

Test if the file is accessible:

```bash
# As root
cat /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/assets/index-DQN0ks4m.js | head -5

# As Nginx user
sudo -u www cat /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/assets/index-DQN0ks4m.js | head -5
```

If the second command fails, it's a permission issue.

### Step 6: Check Nginx Error Logs

```bash
tail -20 /www/wwwlogs/orderly.kareemsoft.org.error.log
```

Look for:
- `Permission denied`
- `open() failed`
- `access forbidden`

## Quick Fix Script

Run the `fix-permissions.sh` script:

```bash
chmod +x fix-permissions.sh
./fix-permissions.sh
```

This will:
1. Set correct ownership (www:www)
2. Set correct permissions (755 for dirs, 644 for files)
3. Verify Nginx can read files

## Common Causes

1. **Wrong ownership** - Files owned by root instead of www
2. **Wrong permissions** - Files not readable by www user
3. **SELinux blocking** - Security context preventing access
4. **Nginx config issue** - Wrong path in location block

## After Fixing

Test the asset URL:
```bash
curl -I http://orderly.kareemsoft.org/admin/assets/index-DQN0ks4m.js
```

Should return `200 OK`, not `403 Forbidden` or `404 Not Found`.



