# Fix Local Organizations Route 404

## Problem
`http://127.0.0.1:8001/organizations/kareem-kN7p8S` returns 404 in local development.

## Root Cause
The backend web route was changed to `/restaurant/{slug}`, but:
1. The frontend still expects `/organizations/{slug}` to work
2. In local dev, the backend is on port 8001 and frontend on 5176
3. The redirect needs to point to the correct local frontend URL

## Solution Applied

### 1. Restored `/organizations/{slug}` Route
Added back the `/organizations/{slug}` route for backward compatibility, but it now redirects to the frontend React app.

### 2. Environment-Aware Redirect
The redirect now detects local environment and uses the correct frontend URL:
- **Local**: `http://localhost:5176/organizations/{slug}` (landing app port)
- **Production**: `http://orderly.kareemsoft.org/organizations/{slug}`

## Changes Made

```php
// Keep /organizations/ for backward compatibility
Route::get('/organizations/{slug}', function ($slug) {
    $frontendUrl = config('app.frontend_url', env('APP_URL', 'http://localhost'));
    // In local dev, use the landing app port
    if (app()->environment('local')) {
        $frontendUrl = 'http://localhost:5176';
    }
    return redirect("{$frontendUrl}/organizations/{$slug}", 301);
});
```

## Apply the Fix

### Step 1: Clear Config Cache (if needed)
```bash
cd backend
php artisan config:clear
php artisan route:clear
```

### Step 2: Test in Local

1. **Start backend:**
   ```bash
   php artisan serve --port=8001
   ```

2. **Start landing app:**
   ```bash
   cd frontend/landing
   npm run dev
   # Should run on port 5176
   ```

3. **Test redirect:**
   - Visit: `http://127.0.0.1:8001/organizations/kareem-kN7p8S`
   - Should redirect to: `http://localhost:5176/organizations/kareem-kN7p8S`
   - Should show the organization page with QR codes

## How It Works

1. **Backend receives request**: `http://127.0.0.1:8001/organizations/kareem-kN7p8S`
2. **Detects local environment**: Uses `http://localhost:5176` for frontend
3. **Redirects**: `http://localhost:5176/organizations/kareem-kN7p8S`
4. **Frontend React app**: Shows organization page with branches and QR codes

## Alternative: Direct API Access

If you want to access the organization data directly via API (without redirect):

```bash
# API endpoint (works in both local and production)
curl http://127.0.0.1:8001/api/organizations/kareem-kN7p8S
```

This returns JSON data that the frontend React app uses.

## Result

Now in local development:
- `http://127.0.0.1:8001/organizations/{slug}` → Redirects to `http://localhost:5176/organizations/{slug}`
- The frontend React app displays the organization page
- Shows branches and tables with QR codes

The redirect ensures seamless transition from backend to frontend in both local and production environments.

