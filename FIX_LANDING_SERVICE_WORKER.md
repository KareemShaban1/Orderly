# Fix Landing Page Service Worker and Asset Paths

## Problem
When accessing `/landing/organizations/:slug`, the service worker and assets are trying to load from root paths instead of `/landing/`:
- `workbox-4618a956.js` loading from `/` instead of `/landing/`
- `icon-192x192.png` loading from `/` instead of `/landing/`
- Service worker registered at `/sw.js` instead of `/landing/sw.js`

## Root Cause
The landing app has `base: '/landing/'` in vite.config.ts, but:
1. Service worker registration path is hardcoded to `/sw.js`
2. Service worker file has hardcoded paths without `/landing/` prefix
3. Nginx config doesn't handle workbox files

## Fixes Applied

### 1. Updated Service Worker Registration
Changed from `/sw.js` to `/landing/sw.js` in `main.tsx`

### 2. Updated Service Worker Paths
Updated `sw.js` to use `/landing/` prefix for all paths

### 3. Updated Nginx Config
Added `sw.js` and `workbox-.*\.js` to the public assets location block

## Steps to Apply

### Step 1: Rebuild Landing App

```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend/landing
npm run build
```

### Step 2: Update Nginx Config

Add `sw.js` and `workbox-.*\.js` to the landing public assets location block:

```nginx
location ~ ^/landing/(vite\.svg|icon-.*\.png|manifest\.json|sw\.js|workbox-.*\.js|.*\.(ico|svg|webmanifest))$ {
    alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/$1;
    expires 1d;
    access_log off;
}
```

### Step 3: Test and Reload

```bash
nginx -t
systemctl reload nginx
```

### Step 4: Clear Browser Cache

1. Open browser DevTools (F12)
2. Go to Application tab
3. Click "Clear storage"
4. Check "Service Workers" and "Cache storage"
5. Click "Clear site data"
6. Refresh the page

## Verify

After rebuilding and reloading:

1. **Check service worker registration:**
   - Open DevTools → Application → Service Workers
   - Should see service worker registered at `/landing/sw.js`

2. **Check network requests:**
   - Open DevTools → Network tab
   - Refresh page
   - Should see:
     - `/landing/workbox-*.js` (not `/workbox-*.js`)
     - `/landing/icon-192x192.png` (not `/icon-192x192.png`)

3. **Check console:**
   - Should see no 404 errors for workbox or icons

## If Using Vite PWA Plugin

If you're using `vite-plugin-pwa`, it might generate the service worker automatically. In that case:

1. Check `vite.config.ts` for PWA plugin configuration
2. Ensure `base` is set to `/landing/`
3. The plugin should automatically use the correct paths

## Alternative: Disable Service Worker

If you don't need PWA functionality for the landing page, you can disable it:

1. Remove service worker registration from `main.tsx`
2. Remove `sw.js` from public folder
3. Rebuild the app

The landing page will work without PWA features.

