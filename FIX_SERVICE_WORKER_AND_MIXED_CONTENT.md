# Fix Service Worker and Mixed Content Errors

## Issues

1. **Mixed Content Error**: API requests still using HTTP on HTTPS page
2. **Service Worker Error**: Missing workbox file causing 404

## Fixes Applied

### 1. API Client - Force HTTPS
Updated `frontend/guest/src/api/client.ts` to:
- Detect HTTPS page and force HTTPS for API calls
- Replace any HTTP with HTTPS when on HTTPS page

### 2. Service Worker Configuration
Updated `frontend/guest/vite.config.ts`:
- Added `inlineWorkboxRuntime: true` to inline workbox code
- This prevents the separate workbox file that was causing 404
- Updated `includeAssets` to only include existing files

## Changes

### `frontend/guest/src/api/client.ts`
```typescript
// Force HTTPS if we're on HTTPS page (prevent mixed content)
if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
  API_BASE_URL = API_BASE_URL.replace(/^http:/, 'https:');
}
```

### `frontend/guest/vite.config.ts`
```typescript
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,svg}'],
  // Use inline workbox to avoid separate workbox file
  inlineWorkboxRuntime: true,
  ...
}
```

## Apply Fix

### On Server
```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend/guest
npm run build
```

### Clear Browser Cache
After rebuilding, users should:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Or hard refresh (Ctrl+Shift+R)
3. Unregister old service worker if needed:
   - Open DevTools → Application → Service Workers
   - Click "Unregister" on old service worker

## Result

✅ **Mixed Content Fixed** - API calls forced to HTTPS
✅ **Service Worker Fixed** - Workbox inlined, no separate file needed
✅ **No More 404s** - All assets exist

## Testing

1. Visit `https://orderly.kareemsoft.org/`
2. Check console - no mixed content errors
3. Check Network tab - all API calls use HTTPS
4. Check Application → Service Workers - service worker loads correctly

