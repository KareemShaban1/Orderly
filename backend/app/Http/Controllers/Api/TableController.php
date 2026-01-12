<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Table;
use Illuminate\Http\Request;

class TableController extends Controller
{
    public function getByQrCode($qrCode)
    {
        $table = Table::with(['branch.tenant'])
            ->where('qr_code', $qrCode)
            ->where('is_active', true)
            ->first();

        if (!$table) {
            return response()->json(['message' => 'Table not found'], 404);
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
