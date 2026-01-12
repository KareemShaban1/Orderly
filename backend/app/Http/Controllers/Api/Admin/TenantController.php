<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\RestaurantSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TenantController extends Controller
{
    public function index()
    {
        $tenants = Tenant::with(['branches', 'users'])->get();
        return response()->json($tenants);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:tenants,email',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'subscription_plan' => 'required|in:starter,professional,enterprise',
            'is_trial' => 'sometimes|boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(6);
        
        if ($request->is_trial) {
            $validated['subscription_start_date'] = now();
            $validated['subscription_end_date'] = now()->addDays(14);
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

    public function show($id)
    {
        $tenant = Tenant::with(['branches', 'users', 'settings'])->findOrFail($id);
        return response()->json($tenant);
    }

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
            'is_active' => 'sometimes|boolean',
        ]);

        $tenant->update($validated);
        return response()->json($tenant);
    }

    public function destroy($id)
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->delete();
        return response()->json(['message' => 'Tenant deleted successfully']);
    }
}
