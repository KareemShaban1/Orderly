<?php

/**
 * Script to check and fix branch-tenant relationship integrity
 * Run this with: php artisan tinker < check_branch_tenant_integrity.php
 * Or run: php -r "require 'vendor/autoload.php'; \$app = require_once 'bootstrap/app.php'; \$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); require 'check_branch_tenant_integrity.php';"
 */

use App\Models\Branch;
use App\Models\Tenant;

echo "Checking branch-tenant relationship integrity...\n\n";

// Find branches with invalid tenant_id
$invalidBranches = Branch::whereDoesntHave('tenant')->get();

if ($invalidBranches->count() > 0) {
    echo "Found {$invalidBranches->count()} branches with invalid tenant_id:\n";
    foreach ($invalidBranches as $branch) {
        echo "  - Branch ID: {$branch->id}, Name: {$branch->name}, Tenant ID: {$branch->tenant_id}\n";
    }
} else {
    echo "✓ All branches have valid tenant_id references\n";
}

// Find branches that might belong to wrong tenant (check by comparing with actual tenant)
$allBranches = Branch::with('tenant')->get();
$issues = [];

foreach ($allBranches as $branch) {
    if ($branch->tenant) {
        // Check if the relationship is correct
        $actualTenant = Tenant::find($branch->tenant_id);
        if (!$actualTenant || $actualTenant->id !== $branch->tenant->id) {
            $issues[] = [
                'branch_id' => $branch->id,
                'branch_name' => $branch->name,
                'tenant_id' => $branch->tenant_id,
                'expected_tenant' => $branch->tenant->name ?? 'N/A',
            ];
        }
    }
}

if (count($issues) > 0) {
    echo "\nFound " . count($issues) . " potential relationship issues:\n";
    foreach ($issues as $issue) {
        echo "  - Branch ID: {$issue['branch_id']}, Name: {$issue['branch_name']}, Tenant ID: {$issue['tenant_id']}, Tenant: {$issue['expected_tenant']}\n";
    }
} else {
    echo "✓ All branch-tenant relationships are correct\n";
}

// Show summary
$totalBranches = Branch::count();
$activeBranches = Branch::where('is_active', true)->count();
$totalTenants = Tenant::count();
$activeTenants = Tenant::where('is_active', true)->count();

echo "\nSummary:\n";
echo "  Total Branches: {$totalBranches}\n";
echo "  Active Branches: {$activeBranches}\n";
echo "  Total Tenants: {$totalTenants}\n";
echo "  Active Tenants: {$activeTenants}\n";








