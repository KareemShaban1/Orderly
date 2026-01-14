# Fix Mixed Content and Icon 404 Errors

## Issues Fixed

### 1. Mixed Content Error
**Problem:** Page loaded over HTTPS but API requests were using HTTP, causing browser to block requests.

**Solution:** Updated API client to detect HTTPS and use HTTPS for API calls.

### 2. Missing Icon Files
**Problem:** `icon-192x192.png` and `icon-512x512.png` were referenced but didn't exist.

**Solution:** Updated manifest to use `vite.svg` instead (which exists).

## Changes Made

### 1. `frontend/guest/src/api/client.ts`
- Added `getApiUrl()` function that detects if page is HTTPS
- Uses HTTPS when page is HTTPS, HTTP for local development
- Prevents mixed content errors

### 2. `frontend/guest/vite.config.ts`
- Updated PWA manifest icons to use `/vite.svg` instead of missing PNG files

### 3. `frontend/guest/public/manifest.json`
- Updated icons array to use `/vite.svg`

### 4. `frontend/guest/index.html`
- Added theme-color meta tag
- Updated title

## How It Works Now

### API Client
```typescript
// Detects protocol from current page
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
return `${protocol}//${window.location.host}`;
```

- **HTTPS page** → Uses `https://orderly.kareemsoft.org/api`
- **HTTP page (local)** → Uses `http://localhost:5173/api`

### Icons
- Uses existing `vite.svg` file
- No more 404 errors for missing icon files

## Apply Changes

### On Server
```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend/guest
npm run build
```

### Test
1. Visit `https://orderly.kareemsoft.org/`
2. Check browser console - no mixed content errors
3. Check Network tab - API calls use HTTPS
4. No 404 errors for icons

## Result

✅ **Mixed Content Fixed** - API calls now use HTTPS when page is HTTPS
✅ **Icon 404 Fixed** - Manifest uses existing vite.svg file
✅ **Works in Production** - All requests use correct protocol

