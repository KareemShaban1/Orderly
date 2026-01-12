<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Branch;
use App\Models\RestaurantSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'tenant_id' => 'nullable|exists:tenants,id',
            'role' => 'required|in:super_admin,tenant_admin,manager,kitchen_staff,waiter',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'tenant_id' => $request->tenant_id,
            'role' => $request->role,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        return response()->json($request->user()->load(['tenant', 'branch']));
    }

    public function registerOrganization(Request $request)
    {
        $request->validate([
            // Organization details
            'org_name' => 'required|string|max:255',
            'org_email' => 'required|email|unique:tenants,email',
            'org_phone' => 'nullable|string',
            'org_address' => 'nullable|string',
            'governorate' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'area' => 'required|string|max:255',
            'subscription_plan' => 'required|in:starter,professional,enterprise',
            
            // User details
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Create tenant (organization)
        $tenant = Tenant::create([
            'name' => $request->org_name,
            'slug' => Str::slug($request->org_name) . '-' . Str::random(6),
            'email' => $request->org_email,
            'phone' => $request->org_phone,
            'address' => $request->org_address,
            'subscription_plan' => $request->subscription_plan,
            'subscription_start_date' => now(),
            'subscription_end_date' => now()->addDays(14), // 14-day trial
            'is_trial' => true,
            'is_active' => true,
        ]);

        // Create default branch with location
        Branch::create([
            'tenant_id' => $tenant->id,
            'name' => 'Main Branch',
            'address' => $request->org_address,
            'governorate' => $request->governorate,
            'city' => $request->city,
            'area' => $request->area,
            'phone' => $request->org_phone,
            'is_active' => true,
        ]);

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

        // Create admin user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'tenant_id' => $tenant->id,
            'role' => 'tenant_admin',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'tenant' => $tenant,
            'user' => $user,
            'token' => $token,
        ], 201);
    }
}
