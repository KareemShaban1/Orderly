# Fix "Table Not Found" Error

## Problem
Accessing `https://orderly.kareemsoft.org/order/TBL-1C5A3626` returns "Table not found" even though the table exists.

## Possible Causes

1. **QR code mismatch** - The `qr_code` field in database doesn't match `TBL-1C5A3626`
2. **Table is inactive** - `is_active = false` in database
3. **Branch is inactive** - Table's branch has `is_active = false`
4. **Missing relationships** - Branch or tenant relationship is missing
5. **Case sensitivity** - QR code might have different case

## Diagnostic Steps

### Step 1: Check Database Directly

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend

# Check if table exists
php artisan tinker --execute="
\$table = App\Models\Table::where('qr_code', 'TBL-1C5A3626')->first();
if (\$table) {
    echo 'Found: ID=' . \$table->id . ', Number=' . \$table->table_number . ', Active=' . (\$table->is_active ? 'Yes' : 'No');
} else {
    echo 'NOT FOUND';
}
"
```

### Step 2: Check All Tables with Similar QR Codes

```bash
php artisan tinker --execute="
\$tables = App\Models\Table::where('qr_code', 'like', 'TBL-%')->get(['id', 'table_number', 'qr_code', 'is_active']);
foreach (\$tables as \$t) {
    echo \$t->qr_code . ' - Table ' . \$t->table_number . ' (Active: ' . (\$t->is_active ? 'Yes' : 'No') . ')' . PHP_EOL;
}
"
```

### Step 3: Test API Endpoint

```bash
# Test the API directly
curl http://orderly.kareemsoft.org/api/table/TBL-1C5A3626

# Should return JSON with table data, or 404 with error message
```

### Step 4: Check Case Sensitivity

```bash
# Try case-insensitive search
php artisan tinker --execute="
\$table = App\Models\Table::whereRaw('LOWER(qr_code) = ?', [strtolower('TBL-1C5A3626')])->first();
if (\$table) {
    echo 'Found (case-insensitive): ' . \$table->qr_code;
}
"
```

## Common Fixes

### Fix 1: Table is Inactive

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend

# Activate the table
php artisan tinker --execute="
\$table = App\Models\Table::where('qr_code', 'TBL-1C5A3626')->first();
if (\$table) {
    \$table->is_active = true;
    \$table->save();
    echo 'Table activated';
}
"
```

### Fix 2: Branch is Inactive

```bash
# Activate the branch
php artisan tinker --execute="
\$table = App\Models\Table::where('qr_code', 'TBL-1C5A3626')->with('branch')->first();
if (\$table && \$table->branch) {
    \$table->branch->is_active = true;
    \$table->branch->save();
    echo 'Branch activated';
}
"
```

### Fix 3: QR Code Mismatch

If the QR code in database is different:

```bash
# Update QR code to match
php artisan tinker --execute="
\$table = App\Models\Table::where('table_number', '1')->first(); // Adjust table number
if (\$table) {
    \$table->qr_code = 'TBL-1C5A3626';
    \$table->save();
    echo 'QR code updated';
}
"
```

### Fix 4: Regenerate QR Code

```bash
# Regenerate QR code for the table
php artisan tinker --execute="
\$table = App\Models\Table::find(1); // Use actual table ID
if (\$table) {
    \$service = app(App\Services\QrCodeService::class);
    \$service->generateForTable(\$table);
    echo 'QR code regenerated: ' . \$table->qr_code;
}
"
```

## Updated Controller

I've updated the `TableController` to provide better error messages that indicate:
- If table doesn't exist
- If table is inactive
- If branch is missing or inactive
- If tenant is missing

This will help diagnose the exact issue.

## Quick Diagnostic Script

Run `check-table-qr.sh` on your server:

```bash
chmod +x check-table-qr.sh
./check-table-qr.sh
```

This will check:
- If table exists in database
- If table is active
- If branch exists and is active
- If tenant exists
- Test API endpoint
- Check Laravel logs

## Most Likely Issues

1. **Table is inactive** - Set `is_active = true`
2. **QR code case mismatch** - Check exact case in database
3. **Branch/tenant inactive** - Activate them
4. **QR code not set** - Regenerate QR code

After running the diagnostic, you'll know exactly what's wrong and can fix it accordingly.

