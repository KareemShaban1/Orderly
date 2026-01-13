# Quick Fix: Table Not Found

## Run Diagnostic First

```bash
cd /www/wwwroot/orderly.kareemsoft.org/backend

# Check if table exists
php artisan tinker --execute="
\$table = App\Models\Table::where('qr_code', 'TBL-1C5A3626')->first();
if (\$table) {
    echo '✅ Table found:' . PHP_EOL;
    echo '   ID: ' . \$table->id . PHP_EOL;
    echo '   QR Code: ' . \$table->qr_code . PHP_EOL;
    echo '   Table Number: ' . \$table->table_number . PHP_EOL;
    echo '   Is Active: ' . (\$table->is_active ? 'Yes ✅' : 'No ❌') . PHP_EOL;
    echo '   Branch Active: ' . (\$table->branch && \$table->branch->is_active ? 'Yes ✅' : 'No ❌') . PHP_EOL;
} else {
    echo '❌ Table NOT FOUND with QR code: TBL-1C5A3626' . PHP_EOL;
    echo PHP_EOL . 'Checking all tables:' . PHP_EOL;
    \$tables = App\Models\Table::all();
    foreach (\$tables as \$t) {
        echo '   - QR: ' . \$t->qr_code . ', Table: ' . \$t->table_number . PHP_EOL;
    }
}
"
```

## Common Fixes

### Fix 1: Activate Table

```bash
php artisan tinker --execute="
\$table = App\Models\Table::where('qr_code', 'TBL-1C5A3626')->first();
if (\$table) {
    \$table->is_active = true;
    \$table->save();
    echo '✅ Table activated';
} else {
    echo '❌ Table not found';
}
"
```

### Fix 2: Activate Branch

```bash
php artisan tinker --execute="
\$table = App\Models\Table::where('qr_code', 'TBL-1C5A3626')->with('branch')->first();
if (\$table && \$table->branch) {
    \$table->branch->is_active = true;
    \$table->branch->save();
    echo '✅ Branch activated';
}
"
```

### Fix 3: Update QR Code

If the QR code in database is different:

```bash
php artisan tinker --execute="
\$table = App\Models\Table::find(1); // Replace with actual table ID
if (\$table) {
    \$table->qr_code = 'TBL-1C5A3626';
    \$table->save();
    echo '✅ QR code updated to: ' . \$table->qr_code;
}
"
```

### Fix 4: Test API

```bash
curl -v http://orderly.kareemsoft.org/api/table/TBL-1C5A3626
```

## After Fixing

The updated controller now:
- ✅ Provides detailed error messages
- ✅ Checks table, branch, and tenant status
- ✅ Supports case-insensitive QR code matching
- ✅ Returns helpful hints in error responses

Test the URL again: `https://orderly.kareemsoft.org/order/TBL-1C5A3626`

