<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Table;
use App\Models\MenuCategory;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function getMenu($tableId)
    {
        $table = Table::with(['branch.tenant'])->findOrFail($tableId);
        $tenant = $table->branch->tenant;

        $categories = MenuCategory::with(['menuItems' => function ($query) {
            $query->where('is_available', true)
                  ->orderBy('sort_order');
        }])
        ->where('tenant_id', $tenant->id)
        ->where('is_active', true)
        ->orderBy('sort_order')
        ->get();

        $menu = $categories->map(function ($category) {
            return [
                'id' => $category->id,
                'name' => $category->name,
                'name_ar' => $category->name_ar,
                'description' => $category->description,
                'description_ar' => $category->description_ar,
                'image' => $category->image,
                'items' => $category->menuItems->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'name' => $item->name,
                        'name_ar' => $item->name_ar,
                        'description' => $item->description,
                        'description_ar' => $item->description_ar,
                        'image' => $item->image,
                        'price' => $item->price,
                        'has_sizes' => $item->has_sizes,
                        'sizes' => $item->sizes,
                        'has_addons' => $item->has_addons,
                        'addons' => $item->addons->map(function ($addon) {
                            return [
                                'id' => $addon->id,
                                'name' => $addon->name,
                                'name_ar' => $addon->name_ar,
                                'price' => $addon->price,
                            ];
                        }),
                        'preparation_type' => $item->preparation_type,
                        'estimated_preparation_time' => $item->estimated_preparation_time,
                    ];
                }),
            ];
        });

        return response()->json([
            'menu' => $menu,
            'tenant' => [
                'name' => $tenant->name,
                'logo' => $tenant->logo,
            ],
        ]);
    }
}
