<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ItemAddon;
use Illuminate\Http\Request;

class ItemAddonController extends Controller
{
    public function index(Request $request)
    {
        $query = ItemAddon::query();
        
        if ($request->tenant_id) {
            $query->where('tenant_id', $request->tenant_id);
        }
        
        $addons = $query->where('is_active', true)->orderBy('name')->get();
        return response()->json($addons);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'name' => 'required|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'price' => 'required|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $addon = ItemAddon::create($validated);
        return response()->json($addon, 201);
    }

    public function show($id)
    {
        $addon = ItemAddon::findOrFail($id);
        return response()->json($addon);
    }

    public function update(Request $request, $id)
    {
        $addon = ItemAddon::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'price' => 'sometimes|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $addon->update($validated);
        return response()->json($addon);
    }

    public function destroy($id)
    {
        $addon = ItemAddon::findOrFail($id);
        $addon->delete();
        return response()->json(['message' => 'Addon deleted successfully']);
    }
}











