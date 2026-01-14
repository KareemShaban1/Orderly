# Fix Vite Base Path Issue for Organizations Route

## Problem
Accessing `http://localhost:5176/organizations/cairo-restaurant-WlpgWN` shows:
> "The server is configured with a public base URL of /landing/ - did you mean to visit /landing/organizations/cairo-restaurant-WlpgWN instead?"

## Root Cause
Vite config has `base: '/landing/'` which forces all assets to use `/landing/` prefix. When accessing `/organizations/...` directly, Vite expects the `/landing/` prefix.

## Solution Applied

### 1. Changed Vite Base to Relative
Changed from `base: '/landing/'` to `base: './'` to support both paths:
- `/landing/organizations/...` (with prefix)
- `/organizations/...` (direct access)

### 2. Updated Asset References
Changed HTML asset references from absolute (`/landing/...`) to relative (`./...`)

### 3. Updated Service Worker Registration
Made service worker path dynamic based on current route

## Changes Made

### vite.config.ts
```typescript
// Changed from:
base: '/landing/',

// To:
base: './',
```

### index.html
Changed all asset references from `/landing/...` to `./...`

### main.tsx
Made service worker registration path dynamic

## Apply the Fix

### Step 1: Rebuild Landing App

```bash
cd frontend/landing
npm run build
```

### Step 2: Test Both Routes

1. **With prefix:**
   - `http://localhost:5176/landing/organizations/cairo-restaurant-WlpgWN`
   - Should work ✅

2. **Direct access:**
   - `http://localhost:5176/organizations/cairo-restaurant-WlpgWN`
   - Should now work ✅ (no more base URL error)

### Step 3: Update Nginx Config (Production)

The Nginx config should already handle both paths, but verify:

```nginx
# Organizations route
location /organizations/ {
    alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/;
    ...
}

# Landing route
location /landing/ {
    alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/;
    ...
}
```

## How It Works Now

### With Relative Base (`base: './'`)
- Assets are referenced relative to the current path
- Works for both `/landing/` and `/organizations/` routes
- No hardcoded path prefix

### React Router Basename
- Still uses dynamic basename:
  - `/organizations/...` → basename = `''` (empty)
  - `/landing/...` → basename = `'/landing'`

## Result

After rebuilding:
- ✅ `/organizations/cairo-restaurant-WlpgWN` works (no base URL error)
- ✅ `/landing/organizations/cairo-restaurant-WlpgWN` still works
- ✅ Assets load correctly from both paths
- ✅ Service worker registers correctly

## Alternative: Keep Absolute Base

If you prefer to keep `base: '/landing/'`, you would need to:
1. Always access via `/landing/organizations/...`
2. Or create a separate build for organizations route
3. Or use a different Vite config for production

But the relative base approach is simpler and works for both cases.

## After Rebuilding

1. **Clear browser cache** (Ctrl+Shift+R)
2. **Test both routes:**
   - `http://localhost:5176/organizations/cairo-restaurant-WlpgWN` ✅
   - `http://localhost:5176/landing/organizations/cairo-restaurant-WlpgWN` ✅

Both should work without the base URL error!

