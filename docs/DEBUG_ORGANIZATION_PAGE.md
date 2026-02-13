# Debug Organization Page - QR Codes Not Showing

## Problem
Organization page shows branches and organization info, but:
- QR codes are not appearing
- Tables section might be empty
- Order section might not be visible

## Diagnostic Steps

### Step 1: Check API Response

Test the API endpoint directly:

```bash
# In local development
curl http://localhost:8000/api/organizations/cairo-restaurant-WlpgWN

# Check if tables are in the response
curl http://localhost:8000/api/organizations/cairo-restaurant-WlpgWN | jq '.data.branches[].tables'
```

### Step 2: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Network tab
3. Reload the page
4. Check the API request to `/api/organizations/{slug}`
5. Look at the response - does it include `tables` array?

### Step 3: Check Database

Verify tables exist and have QR codes:

```bash
cd backend
php artisan tinker --execute="
\$org = App\Models\Tenant::where('slug', 'cairo-restaurant-WlpgWN')->first();
if (\$org) {
    echo 'Organization: ' . \$org->name . PHP_EOL;
    \$branches = \$org->branches()->where('is_active', true)->get();
    foreach (\$branches as \$branch) {
        echo 'Branch: ' . \$branch->name . PHP_EOL;
        \$tables = \$branch->tables()->where('is_active', true)->get();
        echo '  Tables: ' . \$tables->count() . PHP_EOL;
        foreach (\$tables as \$table) {
            echo '    - Table ' . \$table->table_number . ': QR=' . (\$table->qr_code ?: 'NONE') . ', Image=' . (\$table->qr_code_image ?: 'NONE') . PHP_EOL;
        }
    }
} else {
    echo 'Organization not found' . PHP_EOL;
}
"
```

## Common Issues

### Issue 1: Tables Don't Exist
**Symptom**: API returns empty `tables` array

**Fix**: Create tables for the branch:
```bash
php artisan tinker --execute="
\$branch = App\Models\Branch::where('name', 'Main Branch')->first();
if (\$branch) {
    \$table = App\Models\Table::create([
        'branch_id' => \$branch->id,
        'table_number' => '1',
        'capacity' => 4,
        'qr_code' => 'TBL-' . strtoupper(substr(md5(uniqid()), 0, 8)),
        'is_active' => true,
    ]);
    echo 'Table created: ' . \$table->table_number . ' with QR: ' . \$table->qr_code;
}
"
```

### Issue 2: QR Codes Not Generated
**Symptom**: Tables exist but `qr_code` or `qr_code_image` is null

**Fix**: Generate QR codes:
```bash
php artisan tinker --execute="
use App\Services\QrCodeService;
\$service = app(QrCodeService::class);
\$tables = App\Models\Table::whereNull('qr_code')->orWhereNull('qr_code_image')->get();
foreach (\$tables as \$table) {
    if (!\$table->qr_code) {
        \$table->qr_code = 'TBL-' . strtoupper(substr(md5(uniqid()), 0, 8));
        \$table->save();
    }
    \$service->generateForTable(\$table);
    echo 'QR generated for Table ' . \$table->table_number . PHP_EOL;
}
"
```

### Issue 3: Component Not Rendering Tables
**Symptom**: API returns tables but page doesn't show them

**Fix**: Check React component - already updated to show tables even without QR images

## Enhanced Component

The component now:
- Shows tables even if QR code image doesn't exist
- Shows clickable placeholder if QR code exists but image doesn't
- Shows "No QR" if neither exists
- Always shows order section with table code input

## Test the Fix

1. **Check API response:**
   ```bash
   curl http://localhost:8000/api/organizations/cairo-restaurant-WlpgWN | jq '.data.branches[0].tables'
   ```

2. **Check browser console:**
   - Open DevTools → Console
   - Look for errors
   - Check Network tab for API response

3. **Verify tables exist:**
   - Use tinker command above
   - Check if tables have QR codes

4. **Rebuild frontend:**
   ```bash
   cd frontend/landing
   npm run build
   ```

## Expected Result

After fixing, the page should show:
1. ✅ Organization info
2. ✅ Branches with details
3. ✅ **Tables section** (even if no QR images)
4. ✅ **Order section** with table code input
5. ✅ QR codes (if they exist) or clickable placeholders

The component has been updated to always show tables and order section, even if QR code images don't exist.

