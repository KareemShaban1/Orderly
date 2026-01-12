<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Branch;
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
                $query->where('is_active', true);
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

        return response()->json([
            'success' => true,
            'data' => [
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

