<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\Tenant;
use Illuminate\Http\Request;

class GameController extends Controller
{
    /**
     * List all games (for super admin).
     */
    public function index()
    {
        $games = Game::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $games,
        ]);
    }

    /**
     * List organizations (tenants) with their assigned game ids.
     */
    public function organizations()
    {
        $tenants = Tenant::with('games:id')
            ->orderBy('name')
            ->get()
            ->map(function (Tenant $tenant) {
                return [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'game_ids' => $tenant->games->pluck('id')->toArray(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $tenants,
        ]);
    }

    /**
     * Assign games to an organization (tenant).
     * Body: { "tenant_id": 1, "game_ids": [1, 2, 3] }
     */
    public function assign(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'game_ids' => 'required|array',
            'game_ids.*' => 'exists:games,id',
        ]);

        $tenant = Tenant::findOrFail($validated['tenant_id']);
        $tenant->games()->sync(
            collect($validated['game_ids'])->mapWithKeys(fn ($id) => [$id => ['is_active' => true]])->toArray()
        );

        return response()->json([
            'success' => true,
            'message' => 'Games assigned successfully',
            'data' => $tenant->games()->pluck('games.id'),
        ]);
    }

    /**
     * Get assignments: which games are assigned to which tenants (for UI).
     */
    public function assignments()
    {
        $games = Game::where('is_active', true)->orderBy('sort_order')->get();
        $tenants = Tenant::with('games')->orderBy('name')->get();

        $byGame = $games->mapWithKeys(function (Game $game) use ($tenants) {
            $assigned = $tenants->filter(fn (Tenant $t) => $t->games->contains('id', $game->id))
                ->map(fn (Tenant $t) => ['id' => $t->id, 'name' => $t->name, 'slug' => $t->slug])
                ->values()
                ->toArray();
            return [$game->id => $assigned];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'games' => $games,
                'tenants' => $tenants->map(fn (Tenant $t) => [
                    'id' => $t->id,
                    'name' => $t->name,
                    'slug' => $t->slug,
                    'game_ids' => $t->games->pluck('id')->toArray(),
                ]),
                'by_game' => $byGame,
            ],
        ]);
    }
}
