# Troubleshooting Empty Pages

## Problem
Admin, Kitchen, and Landing pages return empty pages when accessed.

## Common Causes & Solutions

### 1. Check if Apps are Built

First, verify that the `dist` folders exist and contain files:

```bash
# Check if dist folders exist
ls -la /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/
ls -la /www/wwwroot/orderly.kareemsoft.org/frontend/kitchen/dist/
ls -la /www/wwwroot/orderly.kareemsoft.org/frontend/guest/dist/

# Check if index.html exists
ls -la /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/index.html
```

**If dist folders don't exist or are empty**, rebuild the apps:

```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend

# Rebuild Admin
cd admin
npm install
npm run build
cd ..

# Rebuild Kitchen
cd kitchen
npm install
npm run build
cd ..

# Rebuild Guest
cd guest
npm install
npm run build
cd ..

# Rebuild Landing (if using)
cd landing
npm install
npm run build
cd ..
```

### 2. Check Nginx Configuration

Verify the Nginx config is correct and reloaded:

```bash
# Test Nginx configuration
nginx -t

# If test passes, reload Nginx
systemctl reload nginx
# or
/etc/init.d/nginx reload
```

### 3. Check File Permissions

Ensure Nginx can read the files:

```bash
# Set correct ownership
chown -R www:www /www/wwwroot/orderly.kareemsoft.org/frontend

# Set correct permissions
chmod -R 755 /www/wwwroot/orderly.kareemsoft.org/frontend
```

### 4. Check Nginx Error Logs

View error logs to see what's happening:

```bash
# View recent errors
tail -n 50 /www/wwwlogs/orderly.kareemsoft.org.error.log

# Follow errors in real-time
tail -f /www/wwwlogs/orderly.kareemsoft.org.error.log
```

Common errors you might see:
- `404 Not Found` - Files don't exist
- `403 Forbidden` - Permission issues
- `500 Internal Server Error` - Configuration issues

### 5. Verify Base Path in Vite Config

Make sure the Vite configs have the correct `base` path:

**frontend/admin/vite.config.ts:**
```typescript
export default defineConfig({
  base: '/admin/',
  // ...
})
```

**frontend/kitchen/vite.config.ts:**
```typescript
export default defineConfig({
  base: '/kitchen/',
  // ...
})
```

**frontend/guest/vite.config.ts:**
```typescript
export default defineConfig({
  base: '/',
  // ...
})
```

After updating base paths, **rebuild the apps**.

### 6. Test Direct File Access

Test if you can access the index.html directly:

```bash
# Test admin
curl http://orderly.kareemsoft.org/admin/index.html

# Test kitchen
curl http://orderly.kareemsoft.org/kitchen/index.html

# Test guest
curl http://orderly.kareemsoft.org/index.html
```

If these return HTML content, the files exist and Nginx can serve them.

### 7. Check Browser Console

Open browser developer tools (F12) and check:
- **Console tab** - Look for JavaScript errors
- **Network tab** - Check which files are failing to load (404, 403, etc.)

### 8. Verify Nginx Location Blocks Order

The order of location blocks matters in Nginx. Make sure:
1. More specific paths come first (e.g., `/admin/assets/` before `/admin`)
2. API location comes before root location
3. Static asset locations are defined

### 9. Common Nginx Issues with Alias

When using `alias` with React apps, make sure:

1. **Trailing slashes match:**
   ```nginx
   location /admin {  # No trailing slash
       alias /path/to/admin/dist;  # No trailing slash
   }
   ```

2. **Use named location for fallback:**
   ```nginx
   location /admin {
       alias /path/to/admin/dist;
       try_files $uri $uri/ @admin_fallback;
   }
   
   location @admin_fallback {
       rewrite ^/admin/(.*)$ /admin/index.html last;
   }
   ```

### 10. Quick Diagnostic Commands

Run these to diagnose:

```bash
# Check if Nginx is running
systemctl status nginx

# Check if files exist
find /www/wwwroot/orderly.kareemsoft.org/frontend -name "index.html"

# Check file sizes (should not be 0)
ls -lh /www/wwwroot/orderly.kareemsoft.org/frontend/*/dist/index.html

# Check Nginx can read files
sudo -u www cat /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/index.html | head -20
```

## Step-by-Step Fix

1. **Rebuild all apps with correct base paths:**
   ```bash
   cd /www/wwwroot/orderly.kareemsoft.org/frontend
   
   for app in admin kitchen guest landing; do
     if [ -d "$app" ]; then
       echo "Building $app..."
       cd $app
       npm run build
       cd ..
     fi
   done
   ```

2. **Update Nginx config** with the corrected configuration from `nginx-orderly-config.conf`

3. **Test and reload Nginx:**
   ```bash
   nginx -t && systemctl reload nginx
   ```

4. **Check browser console** for any remaining errors

5. **Verify assets are loading:**
   - Open browser DevTools → Network tab
   - Refresh the page
   - Check if assets (JS, CSS) are loading with 200 status

## Still Not Working?

If pages are still empty after all checks:

1. **Check if React Router is configured correctly** - Make sure routes match the base path
2. **Check API connectivity** - Empty pages might be due to API errors
3. **Check browser cache** - Clear cache and hard refresh (Ctrl+Shift+R)
4. **Try incognito mode** - Rule out browser extensions interfering



