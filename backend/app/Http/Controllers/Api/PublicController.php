<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Branch;
use App\Models\MenuCategory;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    /**
     * Get all active organizations with their branches
     */
    public function getOrganizations(Request $request)
    {
        // Build branch filter for eager loading
        $branchFilter = function ($query) use ($request) {
            $query->where('is_active', true);
            
            // Apply location filters to branches
            if ($request->has('governorate')) {
                $query->where('governorate', $request->governorate);
            }
            if ($request->has('city')) {
                $query->where('city', $request->city);
            }
            if ($request->has('area')) {
                $query->where('area', $request->area);
            }
        };

        $query = Tenant::where('is_active', true)
            ->with(['branches' => $branchFilter]);

        // Filter tenants that have branches matching the criteria
        if ($request->has('governorate') || $request->has('city') || $request->has('area')) {
            $query->whereHas('branches', function ($q) use ($request) {
                $q->where('is_active', true);
                if ($request->has('governorate')) {
                    $q->where('governorate', $request->governorate);
                }
                if ($request->has('city')) {
                    $q->where('city', $request->city);
                }
                if ($request->has('area')) {
                    $q->where('area', $request->area);
                }
            });
        }

        $tenants = $query->get()->map(function ($tenant) {
            // Ensure we only return branches that belong to this tenant
            $branches = $tenant->branches->filter(function ($branch) use ($tenant) {
                return $branch->tenant_id === $tenant->id;
            });

            return [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'link' => url("/organizations/{$tenant->slug}"),
                'logo' => $tenant->logo ? url('storage/' . $tenant->logo) : null,
                'email' => $tenant->email,
                'phone' => $tenant->phone,
                'branches' => $branches->map(function ($branch) {
                    return [
                        'id' => $branch->id,
                        'name' => $branch->name,
                        'address' => $branch->address,
                        'governorate' => $branch->governorate,
                        'city' => $branch->city,
                        'area' => $branch->area,
                        'latitude' => $branch->latitude,
                        'longitude' => $branch->longitude,
                        'phone' => $branch->phone,
                        'opening_time' => $branch->opening_time,
                        'closing_time' => $branch->closing_time,
                    ];
                })->values(), // Reset array keys
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $tenants,
        ]);
    }

    /**
     * Get a single organization by slug
     */
    public function getOrganizationBySlug($slug)
    {
        $tenant = Tenant::where('slug', $slug)
            ->where('is_active', true)
            ->with(['branches' => function ($query) {
                $query->where('is_active', true)
                    ->with(['tables' => function ($query) {
                        $query->where('is_active', true);
                    }]);
            }, 'games' => function ($query) {
                $query->where('games.is_active', true)
                    ->wherePivot('is_active', true)
                    ->orderBy('games.sort_order');
            }])
            ->first();

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Organization not found',
            ], 404);
        }

        // Ensure we only return branches that belong to this tenant
        $branches = $tenant->branches->filter(function ($branch) use ($tenant) {
            return $branch->tenant_id === $tenant->id;
        });

        $frontendUrl = config('app.frontend_url', env('APP_URL', 'http://localhost'));

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'description' => $tenant->description,
                'link' => "{$frontendUrl}/organizations/{$tenant->slug}",
                'logo' => $tenant->logo ? url('storage/' . $tenant->logo) : null,
                'email' => $tenant->email,
                'phone' => $tenant->phone,
                'branches' => $branches->map(function ($branch) use ($frontendUrl) {
                    return [
                        'id' => $branch->id,
                        'name' => $branch->name,
                        'address' => $branch->address,
                        'governorate' => $branch->governorate,
                        'city' => $branch->city,
                        'area' => $branch->area,
                        'latitude' => $branch->latitude,
                        'longitude' => $branch->longitude,
                        'phone' => $branch->phone,
                        'opening_time' => $branch->opening_time,
                        'closing_time' => $branch->closing_time,
                        'tables' => $branch->tables->map(function ($table) use ($frontendUrl) {
                            return [
                                'id' => $table->id,
                                'table_number' => $table->table_number,
                                'capacity' => $table->capacity,
                                'qr_code' => $table->qr_code,
                                'qr_code_image' => $table->qr_code_image ? url('storage/' . $table->qr_code_image) : null,
                                'qr_url' => "{$frontendUrl}/order/{$table->qr_code}",
                            ];
                        })->values(),
                    ];
                })->values(), // Reset array keys
                'games' => $tenant->games->map(function ($game) {
                    return [
                        'id' => $game->id,
                        'name' => $game->name,
                        'slug' => $game->slug,
                        'description' => $game->description,
                        'type' => $game->type,
                        'config' => $game->config,
                    ];
                })->values(),
            ],
        ]);
    }

    /**
     * Get menu for an organization by slug (public, for viewing menu before ordering)
     */
    public function getOrganizationMenu($slug)
    {
        $tenant = Tenant::where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Organization not found',
            ], 404);
        }

        $categories = MenuCategory::with(['menuItems' => function ($query) {
            $query->where('is_available', true)
                ->with('addons')
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
            'success' => true,
            'data' => [
                'menu' => $menu,
                'tenant' => [
                    'name' => $tenant->name,
                    'logo' => $tenant->logo ? url('storage/' . $tenant->logo) : null,
                ],
            ],
        ]);
    }

    /**
     * Get all unique governorates
     */
    public function getGovernorates()
    {
        $governorates = Branch::whereNotNull('governorate')
            ->where('is_active', true)
            ->distinct()
            ->pluck('governorate')
            ->sort()
            ->values();

        return response()->json([
            'success' => true,
            'data' => $governorates,
        ]);
    }

    /**
     * Get cities by governorate
     */
    public function getCities(Request $request)
    {
        $query = Branch::whereNotNull('city')
            ->where('is_active', true);

        if ($request->has('governorate')) {
            $query->where('governorate', $request->governorate);
        }

        $cities = $query->distinct()
            ->pluck('city')
            ->sort()
            ->values();

        return response()->json([
            'success' => true,
            'data' => $cities,
        ]);
    }

    /**
     * Get areas by city
     */
    public function getAreas(Request $request)
    {
        $query = Branch::whereNotNull('area')
            ->where('is_active', true);

        if ($request->has('city')) {
            $query->where('city', $request->city);
        }

        if ($request->has('governorate')) {
            $query->where('governorate', $request->governorate);
        }

        $areas = $query->distinct()
            ->pluck('area')
            ->sort()
            ->values();

        return response()->json([
            'success' => true,
            'data' => $areas,
        ]);
    }
}

