# Fix Organizations Route Conflict

## Problem
In local development:
- `http://localhost:5176/organizations/kareem-kN7p8S` (landing app)
- `http://localhost:8001/organizations/kareem-kN7p8S` (backend)

On server, both routes conflict because they're on the same domain.

## Solution

Route `/organizations/:slug` to the landing app (frontend React route) instead of the backend Blade view.

## Changes Applied

### 1. Updated Nginx Config
Added a location block for `/organizations/` that routes to the landing app:

```nginx
# Organizations Route - Route to Landing App (MUST come before landing/)
location /organizations/ {
    alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/;
    index index.html;
    try_files $uri $uri/ /landing/index.html;
}
```

**Important**: This location block must come BEFORE the `/landing/` block to have higher priority.

### 2. Updated React Router Basename
Updated the landing app to dynamically set basename:
- If accessing `/organizations/` directly → basename = `''` (empty)
- Otherwise → basename = `'/landing'`

This allows the route to work both ways:
- `/landing/organizations/:slug` (with basename)
- `/organizations/:slug` (without basename, direct access)

## Apply the Fix

### Step 1: Update Nginx Config

Add the `/organizations/` location block BEFORE the `/landing/` block:

```nginx
# ============================================
# Organizations Route - Route to Landing App
# ============================================
location /organizations/ {
    alias /www/wwwroot/orderly.kareemsoft.org/frontend/landing/dist/;
    index index.html;
    try_files $uri $uri/ /landing/index.html;
}

# Then the /landing/ block follows...
```

### Step 2: Rebuild Landing App

```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend/landing
npm run build
```

### Step 3: Test and Reload Nginx

```bash
nginx -t
systemctl reload nginx
```

### Step 4: Test Routes

1. `/organizations/kareem-kN7p8S` should work (direct access)
2. `/landing/organizations/kareem-kN7p8S` should also work
3. `/landing/` should work

## Backend Route

The backend route `/organizations/:slug` in `web.php` returns a Blade view. Since we're routing this to the frontend now, you have two options:

### Option 1: Remove Backend Route (Recommended)
If you don't need the Blade view, remove or comment out:
```php
// In backend/routes/web.php
// Route::get('/organizations/{slug}', [OrganizationController::class, 'show']);
```

### Option 2: Move Backend Route
If you need the backend route, move it to a different path:
```php
Route::get('/admin/organizations/{slug}', [OrganizationController::class, 'show']);
```

## How It Works

1. **Direct access**: `/organizations/kareem-kN7p8S`
   - Nginx routes to landing app
   - React Router uses empty basename
   - Route matches `/organizations/:slug`

2. **With prefix**: `/landing/organizations/kareem-kN7p8S`
   - Nginx routes to landing app
   - React Router uses `/landing` basename
   - Route matches `/organizations/:slug` (relative to basename)

Both work correctly!

