<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Table;
use Illuminate\Http\Request;

class TableController extends Controller
{
    public function getByQrCode($qrCode)
    {
        // Try to find table by QR code (exact match first)
        $table = Table::with(['branch.tenant'])
            ->where('qr_code', $qrCode)
            ->first();

        // If not found, try case-insensitive match
        if (!$table) {
            $table = Table::with(['branch.tenant'])
                ->whereRaw('LOWER(qr_code) = ?', [strtolower($qrCode)])
                ->first();
        }

        if (!$table) {
            return response()->json([
                'message' => 'Table not found',
                'qr_code' => $qrCode,
                'hint' => 'Please check if the QR code is correct or if the table exists in the database'
            ], 404);
        }

        // Check if table is active
        if (!$table->is_active) {
            return response()->json([
                'message' => 'Table is not active',
                'qr_code' => $qrCode,
                'table_number' => $table->table_number
            ], 404);
        }

        // Check if branch exists and is active
        if (!$table->branch) {
            return response()->json([
                'message' => 'Table branch not found',
                'qr_code' => $qrCode
            ], 404);
        }

        if (!$table->branch->is_active) {
            return response()->json([
                'message' => 'Table branch is not active',
                'qr_code' => $qrCode,
                'branch_name' => $table->branch->name
            ], 404);
        }

        // Check if tenant exists
        if (!$table->branch->tenant) {
            return response()->json([
                'message' => 'Table tenant not found',
                'qr_code' => $qrCode
            ], 404);
        }

        return response()->json([
            'table' => [
                'id' => $table->id,
                'table_number' => $table->table_number,
                'capacity' => $table->capacity,
                'status' => $table->status,
                'branch' => [
                    'id' => $table->branch->id,
                    'name' => $table->branch->name,
                    'address' => $table->branch->address,
                ],
                'tenant' => [
                    'id' => $table->branch->tenant->id,
                    'name' => $table->branch->tenant->name,
                    'logo' => $table->branch->tenant->logo,
                ],
            ],
        ]);
    }
}
