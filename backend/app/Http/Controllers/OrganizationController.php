<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    /**
     * Show organization landing page
     */
    public function show($slug)
    {
        $tenant = Tenant::where('slug', $slug)
            ->where('is_active', true)
            ->with(['branches' => function ($query) {
                $query->where('is_active', true);
            }])
            ->first();

        if (!$tenant) {
            abort(404, 'Organization not found');
        }

        return view('organization', [
            'organization' => $tenant,
            'branches' => $tenant->branches,
        ]);
    }
}













