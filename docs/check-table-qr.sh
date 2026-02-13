#!/bin/bash

# Diagnostic script to check table QR code lookup
# Run this on your server

echo "=========================================="
echo "Table QR Code Diagnostic"
echo "=========================================="
echo ""

QR_CODE="TBL-1C5A3626"
BACKEND_PATH="/www/wwwroot/orderly.kareemsoft.org/backend"
cd $BACKEND_PATH

echo "=== Step 1: Check if table exists in database ==="
php artisan tinker --execute="
\$table = App\Models\Table::where('qr_code', 'TBL-1C5A3626')->first();
if (\$table) {
    echo 'Table found:' . PHP_EOL;
    echo '  ID: ' . \$table->id . PHP_EOL;
    echo '  QR Code: ' . \$table->qr_code . PHP_EOL;
    echo '  Table Number: ' . \$table->table_number . PHP_EOL;
    echo '  Is Active: ' . (\$table->is_active ? 'Yes' : 'No') . PHP_EOL;
    echo '  Branch ID: ' . \$table->branch_id . PHP_EOL;
    if (\$table->branch) {
        echo '  Branch Name: ' . \$table->branch->name . PHP_EOL;
        echo '  Branch Active: ' . (\$table->branch->is_active ? 'Yes' : 'No') . PHP_EOL;
        if (\$table->branch->tenant) {
            echo '  Tenant: ' . \$table->branch->tenant->name . PHP_EOL;
        } else {
            echo '  Tenant: NOT FOUND' . PHP_EOL;
        }
    } else {
        echo '  Branch: NOT FOUND' . PHP_EOL;
    }
} else {
    echo 'Table NOT FOUND with QR code: TBL-1C5A3626' . PHP_EOL;
    echo PHP_EOL;
    echo 'Checking all tables with similar QR codes:' . PHP_EOL;
    \$tables = App\Models\Table::where('qr_code', 'like', 'TBL-%')->get();
    foreach (\$tables as \$t) {
        echo '  - QR: ' . \$t->qr_code . ', Table: ' . \$t->table_number . ', Active: ' . (\$t->is_active ? 'Yes' : 'No') . PHP_EOL;
    }
}
" 2>&1 | grep -v "Psy Shell"

echo ""
echo "=== Step 2: Test API endpoint ==="
HTTP_CODE=$(curl -s -o /tmp/table_api_response.txt -w "%{http_code}" \
  "http://orderly.kareemsoft.org/api/table/TBL-1C5A3626" 2>/dev/null)

echo "HTTP Status: $HTTP_CODE"
echo ""
echo "Response:"
cat /tmp/table_api_response.txt | head -20

echo ""
echo "=== Step 3: Check Laravel logs ==="
if [ -f "storage/logs/laravel.log" ]; then
    echo "Recent table-related errors:"
    tail -30 storage/logs/laravel.log | grep -i "table\|qr" | tail -5 || echo "   No table-related errors"
else
    echo "   Laravel log not found"
fi

echo ""
echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="

