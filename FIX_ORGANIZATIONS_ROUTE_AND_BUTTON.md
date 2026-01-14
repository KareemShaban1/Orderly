# Fix Organizations Route Conflict and Update View Menu Button

## Changes Applied

### 1. Backend Route Changed
- **Old**: `/organizations/{slug}` (conflicted with frontend)
- **New**: `/restaurant/{slug}` (no conflict)

Updated in `backend/routes/web.php`:
```php
Route::get('/restaurant/{slug}', [OrganizationController::class, 'show']);
```

### 2. Backend API Enhanced
Updated `PublicController::getOrganizationBySlug()` to include:
- Tables with QR codes for each branch
- QR code images
- QR URLs for direct access

### 3. Frontend TableScan Button Updated
Changed "View Menu & Order" button to navigate to organization page instead of menu:
- **Old**: `navigate(/menu/${table.id})`
- **New**: `window.location.href = /organizations/${table.tenant.slug}`

### 4. OrganizationPage Enhanced
Added QR code display for tables:
- Shows all tables for each branch
- Displays QR code images (if available)
- Clickable QR codes that link to order page
- Table number and capacity displayed

## Apply Changes

### Step 1: Rebuild Backend (if needed)
```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend
# No rebuild needed, just ensure routes are updated
```

### Step 2: Rebuild Landing App
```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend/landing
npm run build
```

### Step 3: Rebuild Guest App
```bash
cd /www/wwwroot/orderly.kareemsoft.org/frontend/guest
npm run build
```

### Step 4: Test

1. **Test organization page:**
   - Visit `/organizations/cairo-restaurant-dy7GSb`
   - Should show branches with tables and QR codes

2. **Test View Menu button:**
   - Scan a QR code or enter table code
   - Click "View Menu & Order"
   - Should navigate to organization page showing QR codes

## What Changed

### Backend
- Route changed from `/organizations/{slug}` to `/restaurant/{slug}`
- API now returns tables with QR codes for each branch
- QR URLs use correct frontend URL from config

### Frontend Guest App
- "View Menu & Order" button now goes to organization page
- Table data includes tenant slug for navigation

### Frontend Landing App
- OrganizationPage now displays tables with QR codes
- QR codes are clickable and link to order page
- Better UX for customers to find and scan QR codes

## Result

Now when customers:
1. Scan a QR code or enter table code
2. Click "View Menu & Order"
3. They see the organization page with:
   - All branches
   - All tables with QR codes for each branch
   - Ability to scan any QR code to order

This provides a better customer experience where they can see all available tables and QR codes for the organization.

