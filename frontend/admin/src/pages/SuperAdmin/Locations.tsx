import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';

function Locations() {
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [newGovernorate, setNewGovernorate] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newArea, setNewArea] = useState('');
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['super-admin-locations-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/super-admin/locations/statistics');
      return response.data.data;
    },
  });

  const { data: governorates } = useQuery({
    queryKey: ['super-admin-governorates'],
    queryFn: async () => {
      const response = await apiClient.get('/super-admin/locations/governorates');
      return response.data.data;
    },
  });

  const { data: cities } = useQuery({
    queryKey: ['super-admin-cities', selectedGovernorate],
    queryFn: async () => {
      const params: any = {};
      if (selectedGovernorate) params.governorate = selectedGovernorate;
      const response = await apiClient.get('/super-admin/locations/cities', { params });
      return response.data.data;
    },
    enabled: !!selectedGovernorate,
  });

  const { data: areas } = useQuery({
    queryKey: ['super-admin-areas', selectedCity, selectedGovernorate],
    queryFn: async () => {
      const params: any = {};
      if (selectedCity) params.city = selectedCity;
      if (selectedGovernorate) params.governorate = selectedGovernorate;
      const response = await apiClient.get('/super-admin/locations/areas', { params });
      return response.data.data;
    },
    enabled: !!selectedCity && !!selectedGovernorate,
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const addGovernorateMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiClient.post('/super-admin/locations/governorates', { name });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-governorates'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-locations-stats'] });
      setNewGovernorate('');
      setSuccess(data.message || 'Governorate added successfully');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to add governorate');
      setSuccess(null);
      setTimeout(() => setError(null), 5000);
    },
  });

  const addCityMutation = useMutation({
    mutationFn: async ({ name, governorate }: { name: string; governorate: string }) => {
      const response = await apiClient.post('/super-admin/locations/cities', { name, governorate });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-cities'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-locations-stats'] });
      setNewCity('');
      setSuccess(data.message || 'City added successfully');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to add city');
      setSuccess(null);
      setTimeout(() => setError(null), 5000);
    },
  });

  const addAreaMutation = useMutation({
    mutationFn: async ({ name, city, governorate }: { name: string; city: string; governorate: string }) => {
      const response = await apiClient.post('/super-admin/locations/areas', { name, city, governorate });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-areas'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-locations-stats'] });
      setNewArea('');
      setSuccess(data.message || 'Area added successfully');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to add area');
      setSuccess(null);
      setTimeout(() => setError(null), 5000);
    },
  });

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Locations Management</h1>
          <p className="text-slate-600">Manage governorates, cities, and areas</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-4">
              <div className="text-sm text-slate-600 mb-1">Governorates</div>
              <div className="text-2xl font-bold text-slate-900">{stats.governorates_count || 0}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-slate-600 mb-1">Cities</div>
              <div className="text-2xl font-bold text-slate-900">{stats.cities_count || 0}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-slate-600 mb-1">Areas</div>
              <div className="text-2xl font-bold text-slate-900">{stats.areas_count || 0}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-slate-600 mb-1">Branches with Locations</div>
              <div className="text-2xl font-bold text-slate-900">{stats.branches_with_locations || 0}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Governorates */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Governorates</h2>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newGovernorate}
                  onChange={(e) => setNewGovernorate(e.target.value)}
                  placeholder="Add governorate..."
                  className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newGovernorate.trim()) {
                      addGovernorateMutation.mutate(newGovernorate.trim());
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newGovernorate.trim()) {
                      addGovernorateMutation.mutate(newGovernorate.trim());
                    }
                  }}
                  className="btn btn-primary text-sm px-3 py-1.5"
                  disabled={addGovernorateMutation.isPending}
                >
                  Add
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {governorates?.map((gov: any) => {
                const govName = typeof gov === 'string' ? gov : gov.name;
                const isManaged = typeof gov === 'string' ? false : gov.is_managed;
                return (
                  <div
                    key={govName}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${
                      selectedGovernorate === govName
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                    onClick={() => {
                      setSelectedGovernorate(selectedGovernorate === govName ? '' : govName);
                      setSelectedCity('');
                    }}
                  >
                    <span>{govName}</span>
                    {isManaged && (
                      <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                        Managed
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cities */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Cities</h2>
              {selectedGovernorate && (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Add city..."
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newCity.trim() && selectedGovernorate) {
                        addCityMutation.mutate({ name: newCity.trim(), governorate: selectedGovernorate });
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newCity.trim() && selectedGovernorate) {
                        addCityMutation.mutate({ name: newCity.trim(), governorate: selectedGovernorate });
                      }
                    }}
                    className="btn btn-primary text-sm px-3 py-1.5"
                    disabled={addCityMutation.isPending || !selectedGovernorate}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
            {!selectedGovernorate ? (
              <div className="text-center py-8 text-slate-500">
                <p>Select a governorate to view cities</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {cities?.map((city: any) => {
                  const cityName = typeof city === 'string' ? city : city.name;
                  const isManaged = typeof city === 'string' ? false : city.is_managed;
                  return (
                    <div
                      key={cityName}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${
                        selectedCity === cityName
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                      onClick={() => setSelectedCity(selectedCity === cityName ? '' : cityName)}
                    >
                      <span>{cityName}</span>
                      {isManaged && (
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                          Managed
                        </span>
                      )}
                    </div>
                  );
                })}
                {cities?.length === 0 && (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    No cities found for this governorate
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Areas */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Areas</h2>
              {selectedCity && selectedGovernorate && (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    placeholder="Add area..."
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newArea.trim() && selectedCity && selectedGovernorate) {
                        addAreaMutation.mutate({
                          name: newArea.trim(),
                          city: selectedCity,
                          governorate: selectedGovernorate,
                        });
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newArea.trim() && selectedCity && selectedGovernorate) {
                        addAreaMutation.mutate({
                          name: newArea.trim(),
                          city: selectedCity,
                          governorate: selectedGovernorate,
                        });
                      }
                    }}
                    className="btn btn-primary text-sm px-3 py-1.5"
                    disabled={addAreaMutation.isPending || !selectedCity || !selectedGovernorate}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
            {!selectedCity || !selectedGovernorate ? (
              <div className="text-center py-8 text-slate-500">
                <p>Select a city to view areas</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {areas?.map((area: any) => {
                  const areaName = typeof area === 'string' ? area : area.name;
                  const isManaged = typeof area === 'string' ? false : area.is_managed;
                  return (
                    <div
                      key={areaName}
                      className="p-3 rounded-lg border bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-between"
                    >
                      <span>{areaName}</span>
                      {isManaged && (
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                          Managed
                        </span>
                      )}
                    </div>
                  );
                })}
                {areas?.length === 0 && (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    No areas found for this city
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Locations;

