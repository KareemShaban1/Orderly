import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';

type ModalMode =
  | { type: 'add-governorate' }
  | { type: 'edit-governorate'; id: number; name: string }
  | { type: 'add-city'; governorate: string }
  | { type: 'edit-city'; id: number; name: string; governorate: string }
  | { type: 'add-area'; governorate: string; city: string }
  | { type: 'edit-area'; id: number; name: string; governorate: string; city: string }
  | { type: 'delete-governorate'; id: number; name: string }
  | { type: 'delete-city'; id: number; name: string }
  | { type: 'delete-area'; id: number; name: string }
  | null;

function Locations() {
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [modal, setModal] = useState<ModalMode>(null);
  const [formName, setFormName] = useState('');
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
      const params: Record<string, string> = {};
      if (selectedGovernorate) params.governorate = selectedGovernorate;
      const response = await apiClient.get('/super-admin/locations/cities', { params });
      return response.data.data;
    },
    enabled: !!selectedGovernorate,
  });

  const { data: areas } = useQuery({
    queryKey: ['super-admin-areas', selectedCity, selectedGovernorate],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (selectedCity) params.city = selectedCity;
      if (selectedGovernorate) params.governorate = selectedGovernorate;
      const response = await apiClient.get('/super-admin/locations/areas', { params });
      return response.data.data;
    },
    enabled: !!selectedCity && !!selectedGovernorate,
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showMessage = (msg: string, isError: boolean) => {
    if (isError) {
      setError(msg);
      setSuccess(null);
      setTimeout(() => setError(null), 5000);
    } else {
      setSuccess(msg);
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const invalidateLocations = () => {
    queryClient.invalidateQueries({ queryKey: ['super-admin-governorates'] });
    queryClient.invalidateQueries({ queryKey: ['super-admin-cities'] });
    queryClient.invalidateQueries({ queryKey: ['super-admin-areas'] });
    queryClient.invalidateQueries({ queryKey: ['super-admin-locations-stats'] });
  };

  const addGovernorateMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiClient.post('/super-admin/locations/governorates', { name });
      return response.data;
    },
    onSuccess: (data) => {
      invalidateLocations();
      setModal(null);
      setFormName('');
      showMessage(data.message || 'Governorate added successfully', false);
    },
    onError: (err: any) => {
      showMessage(err.response?.data?.message || 'Failed to add governorate', true);
    },
  });

  const updateGovernorateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const response = await apiClient.put(`/super-admin/locations/governorates/${id}`, { name });
      return response.data;
    },
    onSuccess: (data) => {
      invalidateLocations();
      setModal(null);
      setFormName('');
      showMessage(data.message || 'Governorate updated successfully', false);
    },
    onError: (err: any) => {
      showMessage(err.response?.data?.message || 'Failed to update governorate', true);
    },
  });

  const deleteGovernorateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/super-admin/locations/governorates/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      invalidateLocations();
      setModal(null);
      setSelectedGovernorate('');
      showMessage(data.message || 'Governorate deleted successfully', false);
    },
    onError: (err: any) => {
      showMessage(err.response?.data?.message || 'Failed to delete governorate', true);
    },
  });

  const addCityMutation = useMutation({
    mutationFn: async ({ name, governorate }: { name: string; governorate: string }) => {
      const response = await apiClient.post('/super-admin/locations/cities', { name, governorate });
      return response.data;
    },
    onSuccess: (data) => {
      invalidateLocations();
      setModal(null);
      setFormName('');
      showMessage(data.message || 'City added successfully', false);
    },
    onError: (err: any) => {
      showMessage(err.response?.data?.message || 'Failed to add city', true);
    },
  });

  const updateCityMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const response = await apiClient.put(`/super-admin/locations/cities/${id}`, { name });
      return response.data;
    },
    onSuccess: (data) => {
      invalidateLocations();
      setModal(null);
      setFormName('');
      showMessage(data.message || 'City updated successfully', false);
    },
    onError: (err: any) => {
      showMessage(err.response?.data?.message || 'Failed to update city', true);
    },
  });

  const deleteCityMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/super-admin/locations/cities/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      invalidateLocations();
      setModal(null);
      setSelectedCity('');
      showMessage(data.message || 'City deleted successfully', false);
    },
    onError: (err: any) => {
      showMessage(err.response?.data?.message || 'Failed to delete city', true);
    },
  });

  const addAreaMutation = useMutation({
    mutationFn: async ({ name, city, governorate }: { name: string; city: string; governorate: string }) => {
      const response = await apiClient.post('/super-admin/locations/areas', { name, city, governorate });
      return response.data;
    },
    onSuccess: (data) => {
      invalidateLocations();
      setModal(null);
      setFormName('');
      showMessage(data.message || 'Area added successfully', false);
    },
    onError: (err: any) => {
      showMessage(err.response?.data?.message || 'Failed to add area', true);
    },
  });

  const updateAreaMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const response = await apiClient.put(`/super-admin/locations/areas/${id}`, { name });
      return response.data;
    },
    onSuccess: (data) => {
      invalidateLocations();
      setModal(null);
      setFormName('');
      showMessage(data.message || 'Area updated successfully', false);
    },
    onError: (err: any) => {
      showMessage(err.response?.data?.message || 'Failed to update area', true);
    },
  });

  const deleteAreaMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/super-admin/locations/areas/${id}`);
      return response.data;
    },
    onSuccess: (data) => {
      invalidateLocations();
      setModal(null);
      showMessage(data.message || 'Area deleted successfully', false);
    },
    onError: (err: any) => {
      showMessage(err.response?.data?.message || 'Failed to delete area', true);
    },
  });

  const openAddGovernorate = () => {
    setFormName('');
    setModal({ type: 'add-governorate' });
  };

  const openEditGovernorate = (id: number, name: string) => {
    setFormName(name);
    setModal({ type: 'edit-governorate', id, name });
  };

  const openDeleteGovernorate = (id: number, name: string) => {
    setModal({ type: 'delete-governorate', id, name });
  };

  const openAddCity = () => {
    if (!selectedGovernorate) return;
    setFormName('');
    setModal({ type: 'add-city', governorate: selectedGovernorate });
  };

  const openEditCity = (id: number, name: string) => {
    setFormName(name);
    setModal({ type: 'edit-city', id, name, governorate: selectedGovernorate });
  };

  const openDeleteCity = (id: number, name: string) => {
    setModal({ type: 'delete-city', id, name });
  };

  const openAddArea = () => {
    if (!selectedCity || !selectedGovernorate) return;
    setFormName('');
    setModal({ type: 'add-area', governorate: selectedGovernorate, city: selectedCity });
  };

  const openEditArea = (id: number, name: string) => {
    setFormName(name);
    setModal({ type: 'edit-area', id, name, governorate: selectedGovernorate, city: selectedCity });
  };

  const openDeleteArea = (id: number, name: string) => {
    setModal({ type: 'delete-area', id, name });
  };

  const handleSaveGovernorate = () => {
    const name = formName.trim();
    if (!name) return;
    if (modal?.type === 'add-governorate') {
      addGovernorateMutation.mutate(name);
    } else if (modal?.type === 'edit-governorate') {
      updateGovernorateMutation.mutate({ id: modal.id, name });
    }
  };

  const handleSaveCity = () => {
    const name = formName.trim();
    if (!name) return;
    if (modal?.type === 'add-city') {
      addCityMutation.mutate({ name, governorate: modal.governorate });
    } else if (modal?.type === 'edit-city') {
      updateCityMutation.mutate({ id: modal.id, name });
    }
  };

  const handleSaveArea = () => {
    const name = formName.trim();
    if (!name) return;
    if (modal?.type === 'add-area') {
      addAreaMutation.mutate({ name, city: modal.city, governorate: modal.governorate });
    } else if (modal?.type === 'edit-area') {
      updateAreaMutation.mutate({ id: modal.id, name });
    }
  };

  const handleConfirmDelete = () => {
    if (modal?.type === 'delete-governorate') {
      deleteGovernorateMutation.mutate(modal.id);
    } else if (modal?.type === 'delete-city') {
      deleteCityMutation.mutate(modal.id);
    } else if (modal?.type === 'delete-area') {
      deleteAreaMutation.mutate(modal.id);
    }
  };

  const isGovernorateModal = modal?.type === 'add-governorate' || modal?.type === 'edit-governorate';
  const isCityModal = modal?.type === 'add-city' || modal?.type === 'edit-city';
  const isAreaModal = modal?.type === 'add-area' || modal?.type === 'edit-area';
  const isDeleteModal =
    modal?.type === 'delete-governorate' || modal?.type === 'delete-city' || modal?.type === 'delete-area';

  const deleteTargetName =
    modal?.type === 'delete-governorate'
      ? modal.name
      : modal?.type === 'delete-city'
        ? modal.name
        : modal?.type === 'delete-area'
          ? modal.name
          : '';

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Locations Management</h1>
          <p className="text-slate-600">Manage governorates, cities, and areas. Add, edit, or delete only managed locations.</p>
        </div>

        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 flex items-center justify-between">
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess(null)} className="text-emerald-700 hover:text-emerald-900" title="Dismiss">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="text-red-700 hover:text-red-900" title="Dismiss">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

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
              <button
                type="button"
                onClick={openAddGovernorate}
                className="btn btn-primary text-sm px-3 py-1.5"
              >
                + Add Governorate
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {governorates?.map((gov: any) => {
                const govName = typeof gov === 'string' ? gov : gov.name;
                const govId = typeof gov === 'string' ? null : gov.id;
                const isManaged = typeof gov === 'string' ? false : gov.is_managed;
                return (
                  <div
                    key={govName}
                    className={`p-3 rounded-lg border transition-colors flex items-center justify-between gap-2 ${
                      selectedGovernorate === govName
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <button
                      type="button"
                      className="flex-1 text-left min-w-0"
                      onClick={() => {
                        setSelectedGovernorate(selectedGovernorate === govName ? '' : govName);
                        setSelectedCity('');
                      }}
                    >
                      <span className="truncate block">{govName}</span>
                    </button>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isManaged && govId != null && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditGovernorate(govId, govName);
                            }}
                            className={`p-1.5 rounded ${selectedGovernorate === govName ? 'hover:bg-slate-700 text-white' : 'hover:bg-slate-200 text-slate-600'}`}
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteGovernorate(govId, govName);
                            }}
                            className={`p-1.5 rounded ${selectedGovernorate === govName ? 'hover:bg-red-600 text-white' : 'hover:bg-red-100 text-red-600'}`}
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                      {isManaged && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${selectedGovernorate === govName ? 'bg-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          Managed
                        </span>
                      )}
                    </div>
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
                <button
                  type="button"
                  onClick={openAddCity}
                  className="btn btn-primary text-sm px-3 py-1.5"
                >
                  + Add City
                </button>
              )}
            </div>
            {!selectedGovernorate ? (
              <div className="text-center py-8 text-slate-500">
                <p>Select a governorate to view and manage cities</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {cities?.map((city: any) => {
                  const cityName = typeof city === 'string' ? city : city.name;
                  const cityId = typeof city === 'string' ? null : city.id;
                  const isManaged = typeof city === 'string' ? false : city.is_managed;
                  return (
                    <div
                      key={cityName}
                      className={`p-3 rounded-lg border transition-colors flex items-center justify-between gap-2 ${
                        selectedCity === cityName
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <button
                        type="button"
                        className="flex-1 text-left min-w-0"
                        onClick={() => setSelectedCity(selectedCity === cityName ? '' : cityName)}
                      >
                        <span className="truncate block">{cityName}</span>
                      </button>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isManaged && cityId != null && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditCity(cityId, cityName);
                              }}
                              className={`p-1.5 rounded ${selectedCity === cityName ? 'hover:bg-slate-700 text-white' : 'hover:bg-slate-200 text-slate-600'}`}
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteCity(cityId, cityName);
                              }}
                              className={`p-1.5 rounded ${selectedCity === cityName ? 'hover:bg-red-600 text-white' : 'hover:bg-red-100 text-red-600'}`}
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                        {isManaged && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCity === cityName ? 'bg-slate-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            Managed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {cities?.length === 0 && (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    No cities for this governorate. Click &quot;+ Add City&quot; to add one.
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
                <button
                  type="button"
                  onClick={openAddArea}
                  className="btn btn-primary text-sm px-3 py-1.5"
                >
                  + Add Area
                </button>
              )}
            </div>
            {!selectedCity || !selectedGovernorate ? (
              <div className="text-center py-8 text-slate-500">
                <p>Select a city to view and manage areas</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {areas?.map((area: any) => {
                  const areaName = typeof area === 'string' ? area : area.name;
                  const areaId = typeof area === 'string' ? null : area.id;
                  const isManaged = typeof area === 'string' ? false : area.is_managed;
                  return (
                    <div
                      key={areaName}
                      className="p-3 rounded-lg border bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-between gap-2"
                    >
                      <span className="flex-1 truncate">{areaName}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isManaged && areaId != null && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditArea(areaId, areaName)}
                              className="p-1.5 rounded hover:bg-slate-200 text-slate-600"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteArea(areaId, areaName)}
                              className="p-1.5 rounded hover:bg-red-100 text-red-600"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                        {isManaged && (
                          <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                            Managed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {areas?.length === 0 && (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    No areas for this city. Click &quot;+ Add Area&quot; to add one.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit modal */}
      {(isGovernorateModal || isCityModal || isAreaModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {modal?.type === 'add-governorate' && 'Add Governorate'}
              {modal?.type === 'edit-governorate' && 'Edit Governorate'}
              {modal?.type === 'add-city' && 'Add City'}
              {modal?.type === 'edit-city' && 'Edit City'}
              {modal?.type === 'add-area' && 'Add Area'}
              {modal?.type === 'edit-area' && 'Edit Area'}
            </h3>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {isGovernorateModal && 'Governorate name'}
              {isCityModal && 'City name'}
              {isAreaModal && 'Area name'}
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={isGovernorateModal ? 'e.g. Cairo' : isCityModal ? 'e.g. Nasr City' : 'e.g. District 1'}
              className="input w-full mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (isGovernorateModal) handleSaveGovernorate();
                  else if (isCityModal) handleSaveCity();
                  else handleSaveArea();
                }
                if (e.key === 'Escape') setModal(null);
              }}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setModal(null); setFormName(''); }} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isGovernorateModal) handleSaveGovernorate();
                  else if (isCityModal) handleSaveCity();
                  else handleSaveArea();
                }}
                disabled={
                  !formName.trim() ||
                  (modal?.type === 'add-governorate' && addGovernorateMutation.isPending) ||
                  (modal?.type === 'edit-governorate' && updateGovernorateMutation.isPending) ||
                  (modal?.type === 'add-city' && addCityMutation.isPending) ||
                  (modal?.type === 'edit-city' && updateCityMutation.isPending) ||
                  (modal?.type === 'add-area' && addAreaMutation.isPending) ||
                  (modal?.type === 'edit-area' && updateAreaMutation.isPending)
                }
                className="btn btn-primary"
              >
                {(
                  (modal?.type === 'add-governorate' && addGovernorateMutation.isPending) ||
                  (modal?.type === 'edit-governorate' && updateGovernorateMutation.isPending) ||
                  (modal?.type === 'add-city' && addCityMutation.isPending) ||
                  (modal?.type === 'edit-city' && updateCityMutation.isPending) ||
                  (modal?.type === 'add-area' && addAreaMutation.isPending) ||
                  (modal?.type === 'edit-area' && updateAreaMutation.isPending)
                )
                  ? 'Saving...'
                  : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {isDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete location?</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete <strong>{deleteTargetName}</strong>? This action cannot be undone.
              {modal?.type === 'delete-governorate' && ' You must delete all its cities first.'}
              {modal?.type === 'delete-city' && ' You must delete all its areas first.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={
                  deleteGovernorateMutation.isPending ||
                  deleteCityMutation.isPending ||
                  deleteAreaMutation.isPending
                }
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteGovernorateMutation.isPending || deleteCityMutation.isPending || deleteAreaMutation.isPending
                  ? 'Deleting...'
                  : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Locations;
