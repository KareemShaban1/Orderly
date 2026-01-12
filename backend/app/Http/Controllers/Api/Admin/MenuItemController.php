<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\ItemAddon;
use Illuminate\Http\Request;

class MenuItemController extends Controller
{
    public function index(Request $request)
    {
        $query = MenuItem::with(['category', 'addons', 'media']);
        
        if ($request->tenant_id) {
            $query->where('tenant_id', $request->tenant_id);
        }
        
        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }
        
        $items = $query->orderBy('sort_order')->get();
        
        // Add media URLs to each item
        $items->transform(function ($item) {
            $item->main_image_url = $item->getFirstMediaUrl('main_image');
            $item->main_image_thumb_url = $item->getFirstMediaUrl('main_image', 'thumb');
            $item->gallery_images = $item->getMedia('gallery')->map(function ($media) {
                return [
                    'id' => $media->id,
                    'url' => $media->getUrl(),
                    'thumb_url' => $media->getUrl('thumb'),
                ];
            });
            return $item;
        });
        
        return response()->json($items);
    }

    public function store(Request $request)
    {
        // Convert string booleans to actual booleans for validation
        $request->merge([
            'has_sizes' => $request->has('has_sizes') ? filter_var($request->has_sizes, FILTER_VALIDATE_BOOLEAN) : null,
            'has_addons' => $request->has('has_addons') ? filter_var($request->has_addons, FILTER_VALIDATE_BOOLEAN) : null,
            'is_available' => $request->has('is_available') ? filter_var($request->is_available, FILTER_VALIDATE_BOOLEAN) : null,
        ]);

        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'category_id' => 'required|exists:menu_categories,id',
            'name' => 'required|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'image' => 'nullable|string',
            'main_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'gallery.*' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'price' => 'required|numeric|min:0',
            'has_sizes' => 'sometimes|boolean',
            'sizes' => 'nullable',
            'has_addons' => 'sometimes|boolean',
            'is_available' => 'sometimes|boolean',
            'sort_order' => 'nullable|integer',
            'preparation_type' => 'sometimes|in:kitchen,bar,both',
            'estimated_preparation_time' => 'nullable|integer|min:1',
            'addon_ids' => 'nullable|array',
            'addon_ids.*' => 'exists:item_addons,id',
        ]);

        $addonIds = $validated['addon_ids'] ?? [];
        unset($validated['addon_ids']);
        unset($validated['main_image']);
        unset($validated['gallery']);

        // Handle sizes if it's a JSON string from FormData
        if (isset($validated['sizes'])) {
            if (is_string($validated['sizes'])) {
                $decoded = json_decode($validated['sizes'], true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $validated['sizes'] = $decoded;
                } else {
                    $validated['sizes'] = null;
                }
            } elseif (!is_array($validated['sizes'])) {
                $validated['sizes'] = null;
            }
        }

        $validated['sort_order'] = $validated['sort_order'] ?? MenuItem::where('tenant_id', $validated['tenant_id'])->max('sort_order') + 1;

        $item = MenuItem::create($validated);
        
        // Handle main image upload
        if ($request->hasFile('main_image')) {
            $item->addMediaFromRequest('main_image')
                ->toMediaCollection('main_image');
        }
        
        // Handle gallery images upload
        if ($request->hasFile('gallery')) {
            foreach ($request->file('gallery') as $file) {
                $item->addMedia($file)
                    ->toMediaCollection('gallery');
            }
        }
        
        if (!empty($addonIds)) {
            $item->addons()->sync($addonIds);
        }

        $item->load(['addons', 'media']);
        $item->main_image_url = $item->getFirstMediaUrl('main_image');
        $item->main_image_thumb_url = $item->getFirstMediaUrl('main_image', 'thumb');
        $item->gallery_images = $item->getMedia('gallery')->map(function ($media) {
            return [
                'id' => $media->id,
                'url' => $media->getUrl(),
                'thumb_url' => $media->getUrl('thumb'),
            ];
        });

        return response()->json($item, 201);
    }

    public function show($id)
    {
        $item = MenuItem::with(['category', 'addons', 'media'])->findOrFail($id);
        $item->main_image_url = $item->getFirstMediaUrl('main_image');
        $item->main_image_thumb_url = $item->getFirstMediaUrl('main_image', 'thumb');
        $item->gallery_images = $item->getMedia('gallery')->map(function ($media) {
            return [
                'id' => $media->id,
                'url' => $media->getUrl(),
                'thumb_url' => $media->getUrl('thumb'),
            ];
        });
        return response()->json($item);
    }

    public function update(Request $request, $id)
    {
        $item = MenuItem::findOrFail($id);
        
        // Convert string booleans to actual booleans for validation
        if ($request->has('has_sizes')) {
            $request->merge(['has_sizes' => filter_var($request->has_sizes, FILTER_VALIDATE_BOOLEAN)]);
        }
        if ($request->has('has_addons')) {
            $request->merge(['has_addons' => filter_var($request->has_addons, FILTER_VALIDATE_BOOLEAN)]);
        }
        if ($request->has('is_available')) {
            $request->merge(['is_available' => filter_var($request->is_available, FILTER_VALIDATE_BOOLEAN)]);
        }
        
        $validated = $request->validate([
            'category_id' => 'sometimes|exists:menu_categories,id',
            'name' => 'sometimes|string|max:255',
            'name_ar' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'image' => 'nullable|string',
            'main_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'gallery.*' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'remove_gallery_ids' => 'nullable|array',
            'remove_gallery_ids.*' => 'exists:media,id',
            'price' => 'sometimes|numeric|min:0',
            'has_sizes' => 'sometimes|boolean',
            'sizes' => 'nullable',
            'has_addons' => 'sometimes|boolean',
            'is_available' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer',
            'preparation_type' => 'sometimes|in:kitchen,bar,both',
            'estimated_preparation_time' => 'nullable|integer|min:1',
            'addon_ids' => 'nullable|array',
            'addon_ids.*' => 'exists:item_addons,id',
        ]);

        $addonIds = $validated['addon_ids'] ?? null;
        if (isset($validated['addon_ids'])) {
            unset($validated['addon_ids']);
        }
        
        $removeGalleryIds = $validated['remove_gallery_ids'] ?? [];
        unset($validated['main_image']);
        unset($validated['gallery']);
        unset($validated['remove_gallery_ids']);

        // Handle sizes if it's a JSON string from FormData
        if (isset($validated['sizes'])) {
            if (is_string($validated['sizes'])) {
                $decoded = json_decode($validated['sizes'], true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $validated['sizes'] = $decoded;
                } else {
                    $validated['sizes'] = null;
                }
            } elseif (!is_array($validated['sizes'])) {
                $validated['sizes'] = null;
            }
        }

        $item->update($validated);
        
        // Handle main image upload (replace existing)
        if ($request->hasFile('main_image')) {
            $item->clearMediaCollection('main_image');
            $item->addMediaFromRequest('main_image')
                ->toMediaCollection('main_image');
        }
        
        // Handle gallery images upload
        if ($request->hasFile('gallery')) {
            foreach ($request->file('gallery') as $file) {
                $item->addMedia($file)
                    ->toMediaCollection('gallery');
            }
        }
        
        // Remove gallery images
        if (!empty($removeGalleryIds)) {
            foreach ($removeGalleryIds as $mediaId) {
                $item->deleteMedia($mediaId);
            }
        }
        
        if ($addonIds !== null) {
            $item->addons()->sync($addonIds);
        }

        $item->load(['addons', 'media']);
        $item->main_image_url = $item->getFirstMediaUrl('main_image');
        $item->main_image_thumb_url = $item->getFirstMediaUrl('main_image', 'thumb');
        $item->gallery_images = $item->getMedia('gallery')->map(function ($media) {
            return [
                'id' => $media->id,
                'url' => $media->getUrl(),
                'thumb_url' => $media->getUrl('thumb'),
            ];
        });

        return response()->json($item);
    }

    public function updateWithFiles(Request $request, $id)
    {
        // This is the same as update but uses POST instead of PUT for better file upload support
        return $this->update($request, $id);
    }

    public function destroy($id)
    {
        $item = MenuItem::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Menu item deleted successfully']);
    }
}
