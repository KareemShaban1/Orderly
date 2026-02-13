#!/bin/bash

# Check organization tables and QR codes
# Run this on your server or locally

echo "=========================================="
echo "Organization Tables Diagnostic"
echo "=========================================="
echo ""

SLUG="cairo-restaurant-WlpgWN"

# Check API response
echo "=== Step 1: Check API Response ==="
echo "Testing: GET /api/organizations/$SLUG"
echo ""

API_RESPONSE=$(curl -s "http://localhost:8000/api/organizations/$SLUG" 2>/dev/null || curl -s "http://127.0.0.1:8001/api/organizations/$SLUG" 2>/dev/null)

if [ -z "$API_RESPONSE" ]; then
    echo "❌ API request failed"
    echo "   Make sure backend is running on port 8000 or 8001"
    exit 1
fi

echo "API Response (first 500 chars):"
echo "$API_RESPONSE" | head -c 500
echo ""
echo ""

# Check if tables exist in response
TABLES_COUNT=$(echo "$API_RESPONSE" | grep -o '"tables":\[' | wc -l || echo "0")

if [ "$TABLES_COUNT" -eq 0 ]; then
    echo "⚠️  No tables found in API response"
    echo ""
    echo "=== Step 2: Check Database ==="
    echo "Run this in Laravel tinker:"
    echo ""
    echo "php artisan tinker --execute=\"
    \$org = App\\\Models\\\Tenant::where('slug', '$SLUG')->first();
    if (\$org) {
        echo 'Organization: ' . \$org->name . PHP_EOL;
        \$branches = \$org->branches()->where('is_active', true)->get();
        foreach (\$branches as \$branch) {
            echo 'Branch: ' . \$branch->name . ' (ID: ' . \$branch->id . ')' . PHP_EOL;
            \$tables = \$branch->tables()->where('is_active', true)->get();
            echo '  Tables: ' . \$tables->count() . PHP_EOL;
            if (\$tables->count() === 0) {
                echo '  ⚠️  No tables found for this branch' . PHP_EOL;
            } else {
                foreach (\$tables as \$table) {
                    echo '    - Table ' . \$table->table_number . ': QR=' . (\$table->qr_code ?: 'NONE') . ', Image=' . (\$table->qr_code_image ?: 'NONE') . PHP_EOL;
                }
            }
        }
    } else {
        echo 'Organization not found' . PHP_EOL;
    }
    \""
else
    echo "✅ Tables found in API response"
    echo ""
    echo "Full tables data:"
    echo "$API_RESPONSE" | grep -A 20 '"tables"'
fi

echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "If tables don't exist, create them:"
echo "1. Go to admin dashboard"
echo "2. Navigate to Branches"
echo "3. Add tables to the branch"
echo "4. QR codes will be generated automatically"
echo ""
echo "Or use tinker to create a test table:"
echo "php artisan tinker --execute=\"
use App\\\Services\\\QrCodeService;
\$org = App\\\Models\\\Tenant::where('slug', '$SLUG')->first();
\$branch = \$org->branches()->first();
if (\$branch) {
    \$service = app(QrCodeService::class);
    \$table = App\\\Models\\\Table::create([
        'branch_id' => \$branch->id,
        'table_number' => '1',
        'capacity' => 4,
        'qr_code' => \$service->generateUniqueCode(),
        'is_active' => true,
    ]);
    \$service->generateForTable(\$table);
    echo 'Table created with QR code';
}
\""

