# Fix Blade Organization Page for Customer Ordering

## Changes Applied

### 1. Updated Guest App Button
Changed "View Menu & Order" button to redirect to backend Blade view instead of frontend React app.

### 2. Enhanced Blade View
- Added tables with QR codes display
- Updated guest app URL detection (works in local and production)
- Improved QR code display with clickable links

### 3. Updated Backend Controller
- Now loads tables with QR codes for each branch
- Passes tables data to Blade view

## How It Works

### Customer Flow
1. Customer scans QR code or enters table code
2. Sees table confirmation screen
3. Clicks "View Menu & Order" button
4. **Redirected to Blade view**: `http://localhost:8001/restaurant/{slug}` (local) or `https://orderly.kareemsoft.org/restaurant/{slug}` (production)
5. Blade page shows:
   - Organization info
   - Branches with tables
   - QR codes for each table
   - Table code input
   - QR scanner button
6. Customer can:
   - Click a QR code → Goes to menu/order page
   - Enter table code → Goes to menu/order page
   - Click "Scan QR Code" → Opens scanner

## Configuration

### Local Development

**Backend .env:**
```env
FRONTEND_GUEST_URL=http://localhost:5173
APP_URL=http://localhost:8001
```

**Guest App .env:**
```env
VITE_API_URL=http://localhost:8001
```

### Production

**Backend .env:**
```env
FRONTEND_GUEST_URL=https://orderly.kareemsoft.org
APP_URL=https://orderly.kareemsoft.org
```

**Guest App .env:**
```env
VITE_API_URL=https://orderly.kareemsoft.org
```

## Apply Changes

### Step 1: Rebuild Guest App
```bash
cd frontend/guest
npm run build
```

### Step 2: Test in Local

1. **Start backend:**
   ```bash
   cd backend
   php artisan serve --port=8001
   ```

2. **Start guest app:**
   ```bash
   cd frontend/guest
   npm run dev
   # Should run on port 5173
   ```

3. **Test flow:**
   - Visit: `http://localhost:5173/order/TBL-XXXXXXXX` (or scan QR code)
   - Click "View Menu & Order"
   - Should redirect to: `http://localhost:8001/restaurant/{slug}`
   - Should see Blade page with QR codes

### Step 3: Test on Server

1. **Update backend .env:**
   ```bash
   cd /www/wwwroot/orderly.kareemsoft.org/backend
   # Ensure FRONTEND_GUEST_URL is set
   grep FRONTEND_GUEST_URL .env
   ```

2. **Clear config cache:**
   ```bash
   php artisan config:clear
   ```

3. **Test:**
   - Visit: `https://orderly.kareemsoft.org/order/TBL-XXXXXXXX`
   - Click "View Menu & Order"
   - Should redirect to: `https://orderly.kareemsoft.org/restaurant/{slug}`
   - Should see Blade page

## Blade Page Features

The Blade page (`organization.blade.php`) now shows:

1. **Organization Header** - Name, logo, contact
2. **Order Section** - Table code input and QR scanner button
3. **Branches Section** - All branches with:
   - Branch details (address, phone, hours)
   - **Tables with QR Codes** - Clickable QR codes for each table
4. **How It Works** - Instructions for customers
5. **Contact Information** - Phone and email

## URL Structure

### Local
- Guest app: `http://localhost:5173/order/{qr_code}`
- Blade page: `http://localhost:8001/restaurant/{slug}`
- Menu/Order: `http://localhost:5173/order/{qr_code}` (after clicking QR)

### Production
- Guest app: `https://orderly.kareemsoft.org/order/{qr_code}`
- Blade page: `https://orderly.kareemsoft.org/restaurant/{slug}`
- Menu/Order: `https://orderly.kareemsoft.org/order/{qr_code}` (after clicking QR)

## Result

Now when customers:
1. ✅ Scan QR code or enter table code
2. ✅ Click "View Menu & Order"
3. ✅ See Blade organization page with:
   - All branches
   - All tables with QR codes
   - Table code input
   - QR scanner button
4. ✅ Can click QR codes or enter code to order

The Blade page is now the main landing page for customers to scan QR codes and order!

