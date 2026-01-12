<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuCategory;
use Illuminate\Http\Request;

class MenuCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = MenuCategory::with('menuItems');
        
        if ($request->tenant_id) {
            $query->where('tenant_id', $request->tenant_id);
        }
        
        $categories = $query->orderBy('sort_order')->get();
        
        // Add media URLs to menu items safely
        $categories->transform(function ($category) {
            if ($category->menuItems) {
                $category->menuItems->transform(function ($item) {
                    try {
                        $item->main_image_url = $item->getFirstMediaUrl('main_image') ?: null;
                        $item->main_image_thumb_url = $item->getFirstMediaUrl('main_image', 'thumb') ?: null;
                        $item->gallery_images = $item->getMedia('gallery')->map(function ($media) {
                            return [
                                'id' => $media->id,
                                'url' => $media->getUrl(),
                                'thumb_url' => $media->getUrl('thumb'),
                            ];
                        })->toArray();
                    } catch (\Exception $e) {
                        // If media loading fails, set defaults
                        $item->main_image_url = null;
                        $item->main_image_thumb_url = null;
                        $item->gallery_images = [];
                    }
                    return $item;
                });
            }
            return $category;
        });
        
        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'name' => 'required|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'image' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'sometimes|boolean',
        ]);

        $validated['sort_order'] = $validated['sort_order'] ?? MenuCategory::where('tenant_id', $validated['tenant_id'])->max('sort_order') + 1;

        $category = MenuCategory::create($validated);
        return response()->json($category, 201);
    }

    public function show($id)
    {
        $category = MenuCategory::with('menuItems')->findOrFail($id);
        return response()->json($category);
    }

    public function update(Request $request, $id)
    {
        $category = MenuCategory::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'image' => 'nullable|string',
            'sort_order' => 'sometimes|integer',
            'is_active' => 'sometimes|boolean',
        ]);

        $category->update($validated);
        return response()->json($category);
    }

    public function destroy($id)
    {
        $category = MenuCategory::findOrFail($id);
        $category->delete();
        return response()->json(['message' => 'Category deleted successfully']);
    }
}
