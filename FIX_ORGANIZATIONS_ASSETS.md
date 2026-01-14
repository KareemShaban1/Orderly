# Fix Organizations Route Asset Loading

## Problem
Both `/landing/organizations/:slug` and `/organizations/:slug` return the same page, but when accessing `/organizations/...` directly, assets might not load correctly because Vite builds with `base: '/landing/'`.

## Solution

Added Nginx location blocks to handle assets for `/organizations/` route, so assets can load from both paths.

## Changes Applied

### 1. Added Asset Location Blocks for `/organizations/`

Added these location blocks BEFORE the `/organizations/` main location:

```nginx
# Organizations Route - Assets
location ~ ^/organizations/assets/(.*)$ {
    alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/assets/$1;
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

location ~ ^/organizations/(vite\.svg|icon-.*\.png|manifest\.json|sw\.js|workbox-.*\.js|index\.css|index\.js|.*\.(ico|svg|webmanifest|css|js))$ {
    alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/$1;
    expires 1d;
    access_log off;
}
```

### 2. React Router Dynamic Basename

The React Router already has dynamic basename logic:
- `/organizations/...` → basename = `''` (empty)
- `/landing/organizations/...` → basename = `'/landing'`

## Apply the Fix

### Step 1: Update Nginx Config

Add the asset location blocks for `/organizations/` BEFORE the main `/organizations/` location block.

### Step 2: Test and Reload

```bash
nginx -t
systemctl reload nginx
```

### Step 3: Test Both Routes

1. `/organizations/cairo-restaurant-dy7GSb` - should load with assets
2. `/landing/organizations/cairo-restaurant-dy7GSb` - should also work

## How It Works

1. **Asset Requests**: When accessing `/organizations/...`, if assets are requested from `/organizations/assets/...`, Nginx serves them from the landing dist folder.

2. **Fallback**: If assets are requested with `/landing/` prefix (from HTML), they're handled by the `/landing/` location blocks.

3. **React Router**: The dynamic basename ensures routes work correctly regardless of the path prefix.

## Alternative: Always Use /landing/ Prefix

If you prefer to always use `/landing/` prefix, you can redirect:

```nginx
location /organizations/ {
    return 301 /landing$request_uri;
}
```

But the current solution allows both paths to work, which matches your local development setup.

## Verify

After applying the fix:

1. Check browser console (F12) - should see no 404 errors for assets
2. Both routes should load correctly with all assets
3. Page should render the same organization content

The fix ensures assets can load from both `/organizations/` and `/landing/` paths.

