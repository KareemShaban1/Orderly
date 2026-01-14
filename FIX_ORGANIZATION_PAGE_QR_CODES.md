# Fix Organization Page - QR Codes Not Showing

## Problem
Organization page (`http://localhost:5176/organizations/cairo-restaurant-WlpgWN`) shows:
- ✅ Organization info
- ✅ Branches
- ❌ **No QR codes**
- ❌ **No tables section**
- ❌ **No order section visible**

## Root Causes

1. **Tables don't exist** in the database for the branches
2. **Tables exist but have no QR codes** generated
3. **API not returning tables** in the response
4. **Component not rendering** tables section

## Diagnostic Steps

### Step 1: Check API Response

Open browser console (F12) and check:
1. Go to Network tab
2. Reload the page
3. Find the request to `/api/organizations/cairo-restaurant-WlpgWN`
4. Check the response - does it include `tables` array?

Or test directly:
```bash
curl http://localhost:8000/api/organizations/cairo-restaurant-WlpgWN | jq '.data.branches[].tables'
```

### Step 2: Check Database

```bash
cd backend
php artisan tinker --execute="
\$org = App\Models\Tenant::where('slug', 'cairo-restaurant-WlpgWN')->first();
if (\$org) {
    echo 'Organization: ' . \$org->name . PHP_EOL;
    \$branches = \$org->branches()->where('is_active', true)->get();
    foreach (\$branches as \$branch) {
        echo 'Branch: ' . \$branch->name . ' (ID: ' . \$branch->id . ')' . PHP_EOL;
        \$tables = \$branch->tables()->where('is_active', true)->get();
        echo '  Tables: ' . \$tables->count() . PHP_EOL;
        if (\$tables->count() === 0) {
            echo '  ⚠️  No tables found - need to create them' . PHP_EOL;
        } else {
            foreach (\$tables as \$table) {
                echo '    - Table ' . \$table->table_number . ': QR=' . (\$table->qr_code ?: 'NONE') . ', Image=' . (\$table->qr_code_image ?: 'NONE') . PHP_EOL;
            }
        }
    }
} else {
    echo 'Organization not found' . PHP_EOL;
}
"
```

## Solutions

### Solution 1: Create Tables (If They Don't Exist)

**Option A: Via Admin Dashboard**
1. Login to admin dashboard
2. Go to Branches
3. Select the branch
4. Add tables
5. QR codes will be generated automatically

**Option B: Via Tinker (Quick Test)**
```bash
cd backend
php artisan tinker --execute="
use App\Services\QrCodeService;
\$org = App\Models\Tenant::where('slug', 'cairo-restaurant-WlpgWN')->first();
\$branch = \$org->branches()->where('is_active', true)->first();
if (\$branch) {
    \$service = app(QrCodeService::class);
    // Create 3 test tables
    for (\$i = 1; \$i <= 3; \$i++) {
        \$table = App\Models\Table::create([
            'branch_id' => \$branch->id,
            'table_number' => (string)\$i,
            'capacity' => 4,
            'qr_code' => \$service->generateUniqueCode(),
            'is_active' => true,
        ]);
        \$service->generateForTable(\$table);
        echo 'Created Table ' . \$table->table_number . ' with QR: ' . \$table->qr_code . PHP_EOL;
    }
} else {
    echo 'No active branch found' . PHP_EOL;
}
"
```

### Solution 2: Generate QR Codes for Existing Tables

If tables exist but don't have QR codes:

```bash
cd backend
php artisan tinker --execute="
use App\Services\QrCodeService;
\$service = app(QrCodeService::class);
\$tables = App\Models\Table::whereNull('qr_code')->orWhereNull('qr_code_image')->get();
foreach (\$tables as \$table) {
    if (!\$table->qr_code) {
        \$table->qr_code = \$service->generateUniqueCode();
        \$table->save();
    }
    if (!\$table->qr_code_image) {
        \$service->generateForTable(\$table);
    }
    echo 'Updated Table ' . \$table->table_number . ': QR=' . \$table->qr_code . PHP_EOL;
}
"
```

### Solution 3: Verify API Returns Tables

Check if the API is correctly including tables:

```bash
curl http://localhost:8000/api/organizations/cairo-restaurant-WlpgWN | jq '.data.branches[0].tables'
```

Should return an array of tables. If empty `[]`, tables don't exist.

## Component Updates

The component has been updated to:
- ✅ Show tables even if QR code images don't exist
- ✅ Show clickable placeholders if QR code exists but image doesn't
- ✅ Always show order section with table code input
- ✅ Add debug logging in development mode

## After Fixing

1. **Rebuild landing app:**
   ```bash
   cd frontend/landing
   npm run build
   ```

2. **Clear browser cache** (Ctrl+Shift+R)

3. **Test the page:**
   - Visit: `http://localhost:5176/organizations/cairo-restaurant-WlpgWN`
   - Should see:
     - Organization info ✅
     - Branches ✅
     - **Tables section with QR codes** ✅
     - **Order section with input** ✅

## Expected Result

After creating tables and generating QR codes, the page should show:

1. **Organization Header** - Name, logo, contact
2. **Branches Section** - All branches with details
3. **Tables & QR Codes Section** - For each branch:
   - Grid of table QR codes (or placeholders)
   - Table number and capacity
   - Clickable QR codes/placeholders
   - Quick links to tables
4. **Order Section** - Table code input and scan button

## Quick Fix Script

Run this to create test tables:

```bash
cd backend
php artisan tinker --execute="
use App\Services\QrCodeService;
\$org = App\Models\Tenant::where('slug', 'cairo-restaurant-WlpgWN')->first();
if (!\$org) {
    echo 'Organization not found' . PHP_EOL;
    exit;
}
\$branch = \$org->branches()->where('is_active', true)->first();
if (!\$branch) {
    echo 'No active branch found' . PHP_EOL;
    exit;
}
\$service = app(QrCodeService::class);
for (\$i = 1; \$i <= 5; \$i++) {
    \$table = App\Models\Table::firstOrCreate(
        ['branch_id' => \$branch->id, 'table_number' => (string)\$i],
        ['capacity' => 4, 'is_active' => true]
    );
    if (!\$table->qr_code) {
        \$table->qr_code = \$service->generateUniqueCode();
        \$table->save();
    }
    if (!\$table->qr_code_image) {
        \$service->generateForTable(\$table);
    }
    echo 'Table ' . \$table->table_number . ': ' . \$table->qr_code . PHP_EOL;
}
echo 'Done! Refresh the organization page to see QR codes.' . PHP_EOL;
"
```

After running this, refresh the page and you should see tables with QR codes!

