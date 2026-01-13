<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\RestaurantSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrganizationController extends Controller
{
    /**
     * Get all organizations (super admin only)
     */
    public function index(Request $request)
    {
        $query = Tenant::with(['branches', 'users']);

        // Filtering
        if ($request->has('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            } elseif ($request->status === 'trial') {
                $query->where('is_trial', true);
            }
        }

        if ($request->has('plan')) {
            $query->where('subscription_plan', $request->plan);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $tenants = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 15);

        return response()->json($tenants);
    }

    /**
     * Get single organization
     */
    public function show($id)
    {
        $tenant = Tenant::with(['branches', 'users', 'settings', 'orders'])
            ->withCount(['branches', 'users', 'orders'])
            ->findOrFail($id);

        return response()->json($tenant);
    }

    /**
     * Create organization
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:tenants,email',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'logo' => 'nullable|string',
            'subscription_plan' => 'required|in:starter,professional,enterprise',
            'subscription_start_date' => 'nullable|date',
            'subscription_end_date' => 'nullable|date|after:subscription_start_date',
            'is_trial' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(6);
        
        if (!isset($validated['subscription_start_date'])) {
            $validated['subscription_start_date'] = now();
        }

        if (!isset($validated['subscription_end_date'])) {
            if ($validated['is_trial'] ?? false) {
                $validated['subscription_end_date'] = now()->addDays(14);
            } else {
                $validated['subscription_end_date'] = now()->addYear();
            }
        }

        $tenant = Tenant::create($validated);

        // Create default settings
        RestaurantSetting::create([
            'tenant_id' => $tenant->id,
            'tax_rate' => 14,
            'service_charge_rate' => 0,
            'currency' => 'EGP',
            'currency_symbol' => 'EGP',
            'default_language' => 'en',
            'supported_languages' => ['en', 'ar'],
        ]);

        return response()->json($tenant, 201);
    }

    /**
     * Update organization
     */
    public function update(Request $request, $id)
    {
        $tenant = Tenant::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:tenants,email,' . $id,
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'logo' => 'nullable|string',
            'subscription_plan' => 'sometimes|in:starter,professional,enterprise',
            'subscription_start_date' => 'nullable|date',
            'subscription_end_date' => 'nullable|date|after:subscription_start_date',
            'is_trial' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
        ]);

        $tenant->update($validated);
        
        return response()->json($tenant);
    }

    /**
     * Delete organization
     */
    public function destroy($id)
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->delete();
        
        return response()->json(['message' => 'Organization deleted successfully']);
    }

    /**
     * Get organization statistics
     */
    public function statistics($id)
    {
        $tenant = Tenant::withCount([
            'branches',
            'users',
            'orders',
            'menuItems',
            'menuCategories'
        ])->findOrFail($id);

        $stats = [
            'branches_count' => $tenant->branches_count,
            'users_count' => $tenant->users_count,
            'orders_count' => $tenant->orders_count,
            'menu_items_count' => $tenant->menu_items_count,
            'menu_categories_count' => $tenant->menu_categories_count,
            'subscription_status' => $this->getSubscriptionStatus($tenant),
        ];

        return response()->json($stats);
    }

    private function getSubscriptionStatus($tenant)
    {
        if (!$tenant->subscription_end_date) {
            return 'no_subscription';
        }

        if ($tenant->subscription_end_date->isPast()) {
            return 'expired';
        }

        if ($tenant->subscription_end_date->diffInDays(now()) <= 7) {
            return 'expiring_soon';
        }

        return 'active';
    }
}










