<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Table;
use App\Services\QrCodeService;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    protected $qrCodeService;

    public function __construct(QrCodeService $qrCodeService)
    {
        $this->qrCodeService = $qrCodeService;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Branch::with(['tenant', 'tables']);

        // Filter by tenant_id unless user is super_admin
        if (!$user->isSuperAdmin() && $user->tenant_id) {
            $query->where('tenant_id', $user->tenant_id);
        }

        $branches = $query->get()->map(function ($branch) {
            $branch->tables_count = $branch->tables->count();
            return $branch;
        });

        return response()->json($branches);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'governorate' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'area' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'opening_time' => 'nullable|date_format:H:i',
            'closing_time' => 'nullable|date_format:H:i',
            'operating_days' => 'nullable|array',
        ]);

        // Ensure non-super_admin users can only create branches for their own tenant
        if (!$user->isSuperAdmin() && $user->tenant_id) {
            $validated['tenant_id'] = $user->tenant_id;
        }

        $branch = Branch::create($validated);
        return response()->json($branch, 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $branch = Branch::with(['tenant', 'tables'])->findOrFail($id);

        // Ensure user can only access branches from their tenant (unless super_admin)
        if (!$user->isSuperAdmin() && $user->tenant_id && $branch->tenant_id !== $user->tenant_id) {
            return response()->json(['message' => 'Unauthorized access to this branch'], 403);
        }

        $branch->tables_count = $branch->tables->count();
        return response()->json($branch);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $branch = Branch::findOrFail($id);

        // Ensure user can only update branches from their tenant (unless super_admin)
        if (!$user->isSuperAdmin() && $user->tenant_id && $branch->tenant_id !== $user->tenant_id) {
            return response()->json(['message' => 'Unauthorized access to this branch'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'address' => 'nullable|string',
            'governorate' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'area' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'opening_time' => 'nullable|date_format:H:i',
            'closing_time' => 'nullable|date_format:H:i',
            'operating_days' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
        ]);

        // Prevent non-super_admin from changing tenant_id
        if (!$user->isSuperAdmin() && isset($validated['tenant_id'])) {
            unset($validated['tenant_id']);
        }

        $branch->update($validated);
        return response()->json($branch);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $branch = Branch::findOrFail($id);

        // Ensure user can only delete branches from their tenant (unless super_admin)
        if (!$user->isSuperAdmin() && $user->tenant_id && $branch->tenant_id !== $user->tenant_id) {
            return response()->json(['message' => 'Unauthorized access to this branch'], 403);
        }

        $branch->delete();
        return response()->json(['message' => 'Branch deleted successfully']);
    }

    public function generateTables(Request $request, $id)
    {
        $user = $request->user();
        $branch = Branch::findOrFail($id);

        // Ensure user can only generate tables for branches from their tenant (unless super_admin)
        if (!$user->isSuperAdmin() && $user->tenant_id && $branch->tenant_id !== $user->tenant_id) {
            return response()->json(['message' => 'Unauthorized access to this branch'], 403);
        }

        $request->validate([
            'count' => 'required|integer|min:1|max:100',
            'start_number' => 'nullable|integer|min:1',
            'capacity' => 'nullable|integer|min:1|max:20',
        ]);

        $count = $request->count;
        $startNumber = $request->start_number ?? 1;
        $capacity = $request->capacity ?? 4;

        $tables = [];
        $skipped = [];

        for ($i = 0; $i < $count; $i++) {
            $tableNumber = $startNumber + $i;

            // Check if table already exists
            $existingTable = Table::where('branch_id', $branch->id)
                ->where('table_number', (string)$tableNumber)
                ->first();

            if ($existingTable) {
                $skipped[] = $tableNumber;
                continue;
            }

            $qrCode = $this->qrCodeService->generateUniqueCode();

            $table = Table::create([
                'branch_id' => $branch->id,
                'table_number' => (string)$tableNumber,
                'capacity' => $capacity,
                'qr_code' => $qrCode,
                'status' => 'available',
            ]);

            // Generate QR code image
            $this->qrCodeService->generateForTable($table);

            $tables[] = $table;
        }

        $message = count($tables) . " tables generated successfully";
        if (count($skipped) > 0) {
            $message .= ". " . count($skipped) . " tables already exist (skipped): " . implode(', ', $skipped);
        }

        return response()->json([
            'message' => $message,
            'tables' => $tables,
            'skipped' => $skipped,
        ], 201);
    }
}
