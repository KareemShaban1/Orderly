import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import GamePlayer from '../../components/games/GamePlayer';

interface Game {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  config: Record<string, unknown> | null;
  sort_order: number;
}

interface Tenant {
  id: number;
  name: string;
  slug: string;
  game_ids: number[];
}

interface AssignmentsData {
  games: Game[];
  tenants: Tenant[];
}

function Games() {
  const queryClient = useQueryClient();
  const [tryGame, setTryGame] = useState<Game | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-games-assignments'],
    queryFn: async () => {
      const res = await apiClient.get('/super-admin/games/assignments');
      return res.data.data as AssignmentsData;
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ tenantId, gameIds }: { tenantId: number; gameIds: number[] }) => {
      const res = await apiClient.post('/super-admin/games/assign', {
        tenant_id: tenantId,
        game_ids: gameIds,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-games-assignments'] });
      setSuccess('Assignments saved.');
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save';
      setError(msg);
      setTimeout(() => setError(null), 5000);
    },
  });

  const toggleGameForTenant = (tenant: Tenant, gameId: number) => {
    const current = tenant.game_ids || [];
    const next = current.includes(gameId)
      ? current.filter((id) => id !== gameId)
      : [...current, gameId];
    assignMutation.mutate({ tenantId: tenant.id, gameIds: next });
  };

  const games = data?.games ?? [];
  const tenants = data?.tenants ?? [];

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Games</h1>
        <p className="text-slate-600 mb-6">
          First 5 games from the gamification plan. Assign them to organizations and try them here.
        </p>

        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-center justify-between">
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess(null)} title="Dismiss" className="text-emerald-700 hover:text-emerald-900">
              <span aria-hidden>×</span>
            </button>
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} title="Dismiss" className="text-red-700 hover:text-red-900">
              <span aria-hidden>×</span>
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-slate-900" />
          </div>
        ) : (
          <div className="space-y-6">
            {games.map((game) => (
              <div key={game.id} className="card p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-slate-900">{game.name}</h2>
                    <p className="text-sm text-slate-600 mt-1">{game.description || game.type}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTryGame(game)}
                    className="btn btn-primary whitespace-nowrap"
                  >
                    Try game
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">Assign to organizations</p>
                  <div className="flex flex-wrap gap-4">
                    {tenants.length === 0 ? (
                      <p className="text-slate-500 text-sm">No organizations yet. Create one in Organizations.</p>
                    ) : (
                      tenants.map((tenant) => (
                        <label key={tenant.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(tenant.game_ids || []).includes(game.id)}
                            onChange={() => toggleGameForTenant(tenant, game.id)}
                            disabled={assignMutation.isPending}
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                          />
                          <span className="text-sm text-slate-700">{tenant.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {tryGame && (
        <GamePlayer
          game={tryGame}
          onClose={() => setTryGame(null)}
        />
      )}
    </div>
  );
}

export default Games;
