# Fix Restaurant Route Empty Page

## Problem
`https://orderly.kareemsoft.org/resturant/cairo-restaurant-dy7GSb` returns empty page.

## Root Causes

1. **Typo in URL**: `/resturant/` instead of `/restaurant/`
2. **Backend route returns Blade view**: The route `/restaurant/{slug}` returns a Blade view which might not be rendering correctly
3. **Should use frontend React app**: The organization page should be served by the frontend React app at `/organizations/{slug}`

## Solution Applied

### 1. Redirect Backend Route to Frontend
Changed the backend route to redirect to the frontend React app:
- `/restaurant/{slug}` → redirects to `/organizations/{slug}` (frontend)
- `/resturant/{slug}` → redirects to `/organizations/{slug}` (handles typo)

### 2. Why This is Better
- Frontend React app has better UI/UX
- Shows tables with QR codes
- More interactive and modern
- Consistent with the rest of the application

## Changes Made

### Backend Route Updated
```php
// Redirect to frontend React app
Route::get('/restaurant/{slug}', function ($slug) {
    $frontendUrl = config('app.frontend_url', env('APP_URL', 'http://localhost'));
    return redirect("{$frontendUrl}/organizations/{$slug}", 301);
});

// Handle typo
Route::get('/resturant/{slug}', function ($slug) {
    $frontendUrl = config('app.frontend_url', env('APP_URL', 'http://localhost'));
    return redirect("{$frontendUrl}/organizations/{$slug}", 301);
});
```

## Apply the Fix

### Step 1: Update Backend .env
Make sure `FRONTEND_GUEST_URL` is set correctly:

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend

# Check current value
grep FRONTEND_GUEST_URL .env

# Update if needed
sed -i 's|FRONTEND_GUEST_URL=.*|FRONTEND_GUEST_URL=http://orderly.kareemsoft.org|' .env
```

### Step 2: Clear Config Cache
```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend
php artisan config:clear
```

### Step 3: Test
```bash
# Test redirect
curl -I http://orderly.kareemsoft.org/restaurant/cairo-restaurant-dy7GSb
# Should return 301 redirect to /organizations/...

# Test typo handling
curl -I http://orderly.kareemsoft.org/resturant/cairo-restaurant-dy7GSb
# Should also redirect
```

## Result

Now when accessing:
- `/restaurant/cairo-restaurant-dy7GSb` → Redirects to `/organizations/cairo-restaurant-dy7GSb` (frontend React app)
- `/resturant/cairo-restaurant-dy7GSb` → Also redirects to `/organizations/cairo-restaurant-dy7GSb` (handles typo)

The frontend React app will show:
- Organization information
- All branches
- Tables with QR codes for each branch
- Better UI/UX

## Alternative: Remove Backend Route

If you don't need the backend Blade view at all, you can remove it entirely:

```php
// Just remove the route - no redirect needed
// Route::get('/restaurant/{slug}', ...); // Removed
```

But the redirect approach is better because:
- Handles typos gracefully
- Maintains backward compatibility
- Ensures users always get the correct frontend page

