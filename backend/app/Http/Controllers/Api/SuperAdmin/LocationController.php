<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LocationController extends Controller
{
    /**
     * Get all governorates (from locations table and branches)
     */
    public function getGovernorates()
    {
        // Get from locations table with IDs
        $locationGovernorates = Location::where('type', 'governorate')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(function ($loc) {
                return [
                    'id' => $loc->id,
                    'name' => $loc->name,
                    'is_managed' => true,
                ];
            })
            ->toArray();

        // Get from branches (legacy data) - only names
        $branchGovernorates = Branch::whereNotNull('governorate')
            ->distinct()
            ->orderBy('governorate')
            ->pluck('governorate')
            ->toArray();

        // Get managed names to filter out duplicates
        $managedNames = array_column($locationGovernorates, 'name');
        $branchOnly = array_diff($branchGovernorates, $managedNames);

        // Add branch-only governorates
        foreach ($branchOnly as $name) {
            $locationGovernorates[] = [
                'id' => null,
                'name' => $name,
                'is_managed' => false,
            ];
        }

        // Sort by name
        usort($locationGovernorates, function ($a, $b) {
            return strcmp($a['name'], $b['name']);
        });

        return response()->json([
            'success' => true,
            'data' => array_values($locationGovernorates),
        ]);
    }

    /**
     * Add a governorate
     */
    public function addGovernorate(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $name = trim($validated['name']);

        // Check if governorate already exists in locations table
        $exists = Location::where('type', 'governorate')
            ->where('name', $name)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Governorate already exists',
            ], 422);
        }

        // Create new governorate
        $location = Location::create([
            'type' => 'governorate',
            'name' => $name,
            'governorate_name' => $name,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Governorate added successfully',
            'data' => $location->name,
        ], 201);
    }

    /**
     * Get cities by governorate (from locations table and branches)
     */
    public function getCities(Request $request)
    {
        $governorateName = $request->governorate;

        $cities = [];

        if ($governorateName) {
            // Get from locations table
            $governorate = Location::where('type', 'governorate')
                ->where('name', $governorateName)
                ->first();

            if ($governorate) {
                $locationCities = Location::where('type', 'city')
                    ->where('parent_id', $governorate->id)
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get()
                    ->map(function ($loc) {
                        return [
                            'id' => $loc->id,
                            'name' => $loc->name,
                            'is_managed' => true,
                        ];
                    })
                    ->toArray();
                $cities = array_merge($cities, $locationCities);
            }

            // Get from branches (legacy data)
            $branchCities = Branch::whereNotNull('city')
                ->where('governorate', $governorateName)
                ->distinct()
                ->orderBy('city')
                ->pluck('city')
                ->toArray();

            // Filter out duplicates
            $managedNames = array_column($cities, 'name');
            $branchOnly = array_diff($branchCities, $managedNames);

            foreach ($branchOnly as $name) {
                $cities[] = [
                    'id' => null,
                    'name' => $name,
                    'is_managed' => false,
                ];
            }
        } else {
            // Get all cities
            $locationCities = Location::where('type', 'city')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->map(function ($loc) {
                    return [
                        'id' => $loc->id,
                        'name' => $loc->name,
                        'is_managed' => true,
                    ];
                })
                ->toArray();
            $branchCities = Branch::whereNotNull('city')
                ->distinct()
                ->orderBy('city')
                ->pluck('city')
                ->toArray();

            $managedNames = array_column($locationCities, 'name');
            $branchOnly = array_diff($branchCities, $managedNames);

            $cities = $locationCities;
            foreach ($branchOnly as $name) {
                $cities[] = [
                    'id' => null,
                    'name' => $name,
                    'is_managed' => false,
                ];
            }
        }

        // Sort by name
        usort($cities, function ($a, $b) {
            return strcmp($a['name'], $b['name']);
        });

        return response()->json([
            'success' => true,
            'data' => array_values($cities),
        ]);
    }

    /**
     * Add a city
     */
    public function addCity(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'governorate' => 'required|string|max:255',
        ]);

        $name = trim($validated['name']);
        $governorateName = trim($validated['governorate']);

        // Find or create governorate
        $governorate = Location::where('type', 'governorate')
            ->where('name', $governorateName)
            ->first();

        if (!$governorate) {
            // Create governorate if it doesn't exist
            $governorate = Location::create([
                'type' => 'governorate',
                'name' => $governorateName,
                'governorate_name' => $governorateName,
                'is_active' => true,
            ]);
        }

        // Check if city already exists
        $exists = Location::where('type', 'city')
            ->where('name', $name)
            ->where('parent_id', $governorate->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'City already exists in this governorate',
            ], 422);
        }

        // Create new city
        $location = Location::create([
            'type' => 'city',
            'name' => $name,
            'parent_id' => $governorate->id,
            'governorate_name' => $governorateName,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'City added successfully',
            'data' => $location->name,
        ], 201);
    }

    /**
     * Get areas by city (from locations table and branches)
     */
    public function getAreas(Request $request)
    {
        $cityName = $request->city;
        $governorateName = $request->governorate;

        $areas = [];

        if ($cityName && $governorateName) {
            // Get from locations table
            $governorate = Location::where('type', 'governorate')
                ->where('name', $governorateName)
                ->first();

            if ($governorate) {
                $city = Location::where('type', 'city')
                    ->where('name', $cityName)
                    ->where('parent_id', $governorate->id)
                    ->first();

                if ($city) {
                    $locationAreas = Location::where('type', 'area')
                        ->where('parent_id', $city->id)
                        ->where('is_active', true)
                        ->orderBy('sort_order')
                        ->orderBy('name')
                        ->get()
                        ->map(function ($loc) {
                            return [
                                'id' => $loc->id,
                                'name' => $loc->name,
                                'is_managed' => true,
                            ];
                        })
                        ->toArray();
                    $areas = array_merge($areas, $locationAreas);
                }
            }

            // Get from branches (legacy data)
            $branchAreas = Branch::whereNotNull('area')
                ->where('city', $cityName)
                ->where('governorate', $governorateName)
                ->distinct()
                ->orderBy('area')
                ->pluck('area')
                ->toArray();

            // Filter out duplicates
            $managedNames = array_column($areas, 'name');
            $branchOnly = array_diff($branchAreas, $managedNames);

            foreach ($branchOnly as $name) {
                $areas[] = [
                    'id' => null,
                    'name' => $name,
                    'is_managed' => false,
                ];
            }
        } else {
            // Get all areas
            $locationAreas = Location::where('type', 'area')
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->map(function ($loc) {
                    return [
                        'id' => $loc->id,
                        'name' => $loc->name,
                        'is_managed' => true,
                    ];
                })
                ->toArray();
            $branchAreas = Branch::whereNotNull('area')
                ->distinct()
                ->orderBy('area')
                ->pluck('area')
                ->toArray();

            $managedNames = array_column($locationAreas, 'name');
            $branchOnly = array_diff($branchAreas, $managedNames);

            $areas = $locationAreas;
            foreach ($branchOnly as $name) {
                $areas[] = [
                    'id' => null,
                    'name' => $name,
                    'is_managed' => false,
                ];
            }
        }

        // Sort by name
        usort($areas, function ($a, $b) {
            return strcmp($a['name'], $b['name']);
        });

        return response()->json([
            'success' => true,
            'data' => array_values($areas),
        ]);
    }

    /**
     * Add an area
     */
    public function addArea(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'governorate' => 'required|string|max:255',
        ]);

        $name = trim($validated['name']);
        $cityName = trim($validated['city']);
        $governorateName = trim($validated['governorate']);

        // Find or create governorate
        $governorate = Location::where('type', 'governorate')
            ->where('name', $governorateName)
            ->first();

        if (!$governorate) {
            $governorate = Location::create([
                'type' => 'governorate',
                'name' => $governorateName,
                'governorate_name' => $governorateName,
                'is_active' => true,
            ]);
        }

        // Find or create city
        $city = Location::where('type', 'city')
            ->where('name', $cityName)
            ->where('parent_id', $governorate->id)
            ->first();

        if (!$city) {
            $city = Location::create([
                'type' => 'city',
                'name' => $cityName,
                'parent_id' => $governorate->id,
                'governorate_name' => $governorateName,
                'is_active' => true,
            ]);
        }

        // Check if area already exists
        $exists = Location::where('type', 'area')
            ->where('name', $name)
            ->where('parent_id', $city->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Area already exists in this city',
            ], 422);
        }

        // Create new area
        $location = Location::create([
            'type' => 'area',
            'name' => $name,
            'parent_id' => $city->id,
            'governorate_name' => $governorateName,
            'city_name' => $cityName,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Area added successfully',
            'data' => $location->name,
        ], 201);
    }

    /**
     * Delete a governorate
     */
    public function deleteGovernorate($id)
    {
        $location = Location::where('type', 'governorate')->findOrFail($id);

        // Check if it has cities
        $hasCities = Location::where('type', 'city')
            ->where('parent_id', $location->id)
            ->exists();

        if ($hasCities) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete governorate with existing cities. Please delete cities first.',
            ], 422);
        }

        $location->delete();

        return response()->json([
            'success' => true,
            'message' => 'Governorate deleted successfully',
        ]);
    }

    /**
     * Delete a city
     */
    public function deleteCity($id)
    {
        $location = Location::where('type', 'city')->findOrFail($id);

        // Check if it has areas
        $hasAreas = Location::where('type', 'area')
            ->where('parent_id', $location->id)
            ->exists();

        if ($hasAreas) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete city with existing areas. Please delete areas first.',
            ], 422);
        }

        $location->delete();

        return response()->json([
            'success' => true,
            'message' => 'City deleted successfully',
        ]);
    }

    /**
     * Delete an area
     */
    public function deleteArea($id)
    {
        $location = Location::where('type', 'area')->findOrFail($id);
        $location->delete();

        return response()->json([
            'success' => true,
            'message' => 'Area deleted successfully',
        ]);
    }

    /**
     * Get location statistics
     */
    public function statistics()
    {
        // Count from locations table
        $locationsCount = [
            'governorates' => Location::where('type', 'governorate')->where('is_active', true)->count(),
            'cities' => Location::where('type', 'city')->where('is_active', true)->count(),
            'areas' => Location::where('type', 'area')->where('is_active', true)->count(),
        ];

        // Count from branches (legacy data)
        $branchesCount = [
            'governorates' => Branch::whereNotNull('governorate')->distinct()->count('governorate'),
            'cities' => Branch::whereNotNull('city')->distinct()->count('city'),
            'areas' => Branch::whereNotNull('area')->distinct()->count('area'),
        ];

        $stats = [
            'governorates_count' => max($locationsCount['governorates'], $branchesCount['governorates']),
            'cities_count' => max($locationsCount['cities'], $branchesCount['cities']),
            'areas_count' => max($locationsCount['areas'], $branchesCount['areas']),
            'branches_with_locations' => Branch::whereNotNull('governorate')
                ->whereNotNull('city')
                ->count(),
            'managed_locations' => [
                'governorates' => $locationsCount['governorates'],
                'cities' => $locationsCount['cities'],
                'areas' => $locationsCount['areas'],
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}

