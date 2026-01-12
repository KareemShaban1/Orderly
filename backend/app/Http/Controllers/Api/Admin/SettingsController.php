<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\RestaurantSetting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        
        if (!$user->tenant_id) {
            return response()->json(['message' => 'User must be associated with a tenant'], 400);
        }

        $settings = RestaurantSetting::firstOrCreate(
            ['tenant_id' => $user->tenant_id],
            [
                'tax_rate' => 14,
                'service_charge_rate' => 0,
                'currency' => 'EGP',
                'currency_symbol' => 'EGP',
                'default_language' => 'en',
                'supported_languages' => ['en', 'ar'],
            ]
        );

        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        
        if (!$user->tenant_id) {
            return response()->json(['message' => 'User must be associated with a tenant'], 400);
        }

        $validated = $request->validate([
            'tax_rate' => 'sometimes|numeric|min:0|max:100',
            'service_charge_rate' => 'sometimes|numeric|min:0|max:100',
            'currency' => 'sometimes|string|max:3',
            'currency_symbol' => 'sometimes|string|max:10',
            'default_language' => 'sometimes|string|in:en,ar',
            'supported_languages' => 'sometimes|array',
            'enable_online_payment' => 'sometimes|boolean',
            'payment_gateways' => 'nullable|array',
            'primary_color' => 'sometimes|string|max:7',
            'secondary_color' => 'sometimes|string|max:7',
            'logo' => 'nullable|string',
            'welcome_message' => 'nullable|string',
            'welcome_message_ar' => 'nullable|string',
        ]);

        $settings = RestaurantSetting::updateOrCreate(
            ['tenant_id' => $user->tenant_id],
            $validated
        );

        return response()->json($settings);
    }
}
