# Fixing Asset 404 Errors

## Problem
Getting `404 (Not Found)` errors for assets like:
- `GET http://orderly.kareemsoft.org/admin/assets/index-DQN0ks4m.js net::ERR_ABORTED 404`

## Root Causes

1. **Apps not rebuilt with correct base paths** - Most common issue
2. **Nginx location block not matching correctly**
3. **Assets don't exist in dist folder**
4. **File permissions issue**

## Solution Steps

### Step 1: Verify Vite Base Paths are Set

Check that all Vite configs have the correct `base` path:

**frontend/admin/vite.config.ts:**
```typescript
export default defineConfig({
  base: '/admin/',  // ← Must have this
  // ...
})
```

**frontend/kitchen/vite.config.ts:**
```typescript
export default defineConfig({
  base: '/kitchen/',  // ← Must have this
  // ...
})
```

### Step 2: Rebuild All Apps (CRITICAL)

**You MUST rebuild after setting base paths:**

```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend

# Admin
cd admin
npm run build
cd ..

# Kitchen
cd kitchen
npm run build
cd ..

# Guest
cd guest
npm run build
cd ..
```

### Step 3: Verify Assets Exist

After rebuilding, check that assets are in the right place:

```bash
# Check admin assets
ls -la /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/assets/

# Check kitchen assets
ls -la /www/wwwroot/orderly.kareemsoft.org/frontend/kitchen/dist/assets/

# Check guest assets
ls -la /www/wwwroot/orderly.kareemsoft.org/frontend/guest/dist/assets/
```

You should see files like:
- `index-*.js`
- `index-*.css`
- Other asset files

### Step 4: Update Nginx Configuration

Use the updated config from `nginx-orderly-config-fixed.conf` which uses simpler location blocks.

**Key points:**
- Asset locations use regex: `location ~ ^/admin/assets/`
- Main locations use simple paths: `location /admin`
- Order matters: assets before main location

### Step 5: Test Asset Access

Test if assets are accessible:

```bash
# Test admin asset (replace with actual filename from your dist)
curl -I http://orderly.kareemsoft.org/admin/assets/index-DQN0ks4m.js

# Should return 200 OK, not 404
```

### Step 6: Check Nginx Error Logs

If still not working, check logs:

```bash
tail -f /www/wwwlogs/orderly.kareemsoft.org.error.log
```

Look for:
- File not found errors
- Permission denied errors
- Path resolution issues

## Common Issues

### Issue 1: Assets Built Without Base Path

**Symptom:** Assets requested from `/assets/` instead of `/admin/assets/`

**Fix:** 
1. Set `base: '/admin/'` in vite.config.ts
2. Rebuild: `npm run build`
3. Verify: Check `dist/index.html` - assets should reference `/admin/assets/...`

### Issue 2: Nginx Not Matching Asset Paths

**Symptom:** 404 even though files exist

**Fix:** Use regex location blocks:
```nginx
location ~ ^/admin/assets/ {
    alias /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/assets/;
}
```

### Issue 3: Trailing Slash Mismatch

**Symptom:** Inconsistent behavior

**Fix:** Ensure consistency:
- Location: `/admin` (no trailing slash)
- Alias: `/path/to/dist` (no trailing slash)
- OR both with trailing slashes

### Issue 4: File Permissions

**Symptom:** 403 Forbidden or 404

**Fix:**
```bash
chown -R www:www /www/wwwroot/orderly.kareemsoft.org/frontend
chmod -R 755 /www/wwwroot/orderly.kareemsoft.org/frontend
```

## Quick Diagnostic

Run this to check everything:

```bash
# 1. Check if base path is set
grep "base:" /www/wwwroot/orderly.kareemsoft.org/frontend/admin/vite.config.ts

# 2. Check if assets exist
ls /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/assets/ | head -5

# 3. Check file permissions
ls -la /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/assets/ | head -5

# 4. Test Nginx can read
sudo -u www cat /www/wwwroot/orderly.kareemsoft.org/frontend/admin/dist/index.html | grep assets
```

## Expected Behavior

After fixing:

1. **HTML loads** - `http://orderly.kareemsoft.org/admin/` shows page
2. **Assets load** - Browser DevTools → Network shows 200 for all JS/CSS files
3. **No 404 errors** - Console is clean

## Alternative: Simpler Nginx Config

If the regex approach doesn't work, try this simpler version (in `nginx-orderly-config-fixed.conf`):

- Uses `try_files` with direct paths
- Simpler location blocks
- Less complex matching



