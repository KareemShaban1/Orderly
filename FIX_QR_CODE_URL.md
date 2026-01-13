# Fix QR Code URL - Change from localhost:3000 to Production Domain

## Problem
QR codes are being generated with `localhost:3000/order/table_number` instead of the production domain `http://orderly.kareemsoft.org/order/table_number`.

## Root Cause
The QR code generation uses `config('app.frontend_url')` which wasn't defined in the config file, so it was defaulting to localhost.

## Solution

### Step 1: Update Backend Config (Code Change)

I've added `frontend_url` to `backend/config/app.php`:

```php
'frontend_url' => env('FRONTEND_GUEST_URL', env('APP_URL', 'http://localhost')),
```

This will:
1. First check `FRONTEND_GUEST_URL` environment variable
2. Fall back to `APP_URL` if not set
3. Fall back to `http://localhost` as last resort

### Step 2: Update .env File on Server

Add or update these variables in `/www/wwwroot/orderly.kareemsoft.org/backend/.env`:

```bash
# Backend URL
APP_URL=http://orderly.kareemsoft.org

# Frontend Guest App URL (for QR codes)
FRONTEND_GUEST_URL=http://orderly.kareemsoft.org
```

**On your server:**
```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend

# Add or update FRONTEND_GUEST_URL
if grep -q "FRONTEND_GUEST_URL" .env; then
    sed -i 's|FRONTEND_GUEST_URL=.*|FRONTEND_GUEST_URL=http://orderly.kareemsoft.org|' .env
else
    echo "FRONTEND_GUEST_URL=http://orderly.kareemsoft.org" >> .env
fi

# Also update APP_URL if needed
sed -i 's|APP_URL=.*|APP_URL=http://orderly.kareemsoft.org|' .env

# Clear config cache
php artisan config:clear
```

### Step 3: Regenerate QR Codes

After updating the config, you need to regenerate existing QR codes:

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend

# Option 1: Regenerate all QR codes via Artisan (if you have a command)
php artisan tables:regenerate-qr

# Option 2: Regenerate via API (from admin dashboard)
# Go to admin dashboard → Branches → Tables → Regenerate QR for each table

# Option 3: Regenerate programmatically
php artisan tinker
# Then run:
# $tables = App\Models\Table::all();
# foreach ($tables as $table) {
#     app(App\Services\QrCodeService::class)->generateForTable($table);
# }
```

### Step 4: Verify

1. **Check config value:**
   ```bash
   cd /www/wwwroot/orderly.kareemsoft.org/backend
   php artisan tinker --execute="echo config('app.frontend_url');"
   # Should output: http://orderly.kareemsoft.org
   ```

2. **Generate a test QR code:**
   - Go to admin dashboard
   - Navigate to a table
   - Click "Regenerate QR Code"
   - Download and scan it
   - Should open: `http://orderly.kareemsoft.org/order/TBL-XXXXXXXX`

## Quick Fix Script

```bash
#!/bin/bash

cd /www/wwwroot/orderly.kareemsoft.org/backend

echo "=== Fixing QR Code URL ==="
echo ""

# 1. Update .env
echo "1. Updating .env file..."
if grep -q "FRONTEND_GUEST_URL" .env; then
    sed -i 's|FRONTEND_GUEST_URL=.*|FRONTEND_GUEST_URL=http://orderly.kareemsoft.org|' .env
    echo "   ✅ Updated FRONTEND_GUEST_URL"
else
    echo "FRONTEND_GUEST_URL=http://orderly.kareemsoft.org" >> .env
    echo "   ✅ Added FRONTEND_GUEST_URL"
fi

# Update APP_URL
sed -i 's|APP_URL=.*|APP_URL=http://orderly.kareemsoft.org|' .env
echo "   ✅ Updated APP_URL"

# 2. Clear config cache
echo ""
echo "2. Clearing config cache..."
php artisan config:clear
echo "   ✅ Config cache cleared"

# 3. Verify config
echo ""
echo "3. Verifying config..."
FRONTEND_URL=$(php artisan tinker --execute="echo config('app.frontend_url');" 2>/dev/null | tail -1)
echo "   Frontend URL: $FRONTEND_URL"

if [[ "$FRONTEND_URL" == *"orderly.kareemsoft.org"* ]]; then
    echo "   ✅ Config is correct!"
else
    echo "   ❌ Config is still wrong"
    echo "   Check .env file manually"
fi

echo ""
echo "=== Fix Complete ==="
echo ""
echo "Next steps:"
echo "1. Regenerate QR codes from admin dashboard"
echo "2. Test by scanning a QR code"
echo "3. Should open: http://orderly.kareemsoft.org/order/TBL-XXXXXXXX"
```

## Important Notes

1. **Existing QR codes won't change** - You need to regenerate them after updating the config
2. **New QR codes** will automatically use the correct URL
3. **Guest app must be accessible** at `http://orderly.kareemsoft.org/` (which it is based on your setup)

## After Fixing

1. Update the code (config file change)
2. Update `.env` on server with `FRONTEND_GUEST_URL`
3. Clear config cache: `php artisan config:clear`
4. Regenerate QR codes from admin dashboard
5. Test by scanning a QR code

The QR codes will now point to `http://orderly.kareemsoft.org/order/table_code` instead of `localhost:3000`.

