import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface Organization {
  id: number;
  name: string;
  slug: string;
  link: string;
  logo: string | null;
  email: string;
  phone: string;
  branches: Branch[];
}

interface Branch {
  id: number;
  name: string;
  address: string;
  governorate: string;
  city: string;
  area: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  opening_time: string;
  closing_time: string;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations', selectedGovernorate, selectedCity, selectedArea],
    queryFn: async () => {
      const params: any = {};
      if (selectedGovernorate) params.governorate = selectedGovernorate;
      if (selectedCity) params.city = selectedCity;
      if (selectedArea) params.area = selectedArea;
      const response = await apiClient.get('/organizations', { params });
      return response.data.data as Organization[];
    },
  });

  const { data: governorates } = useQuery({
    queryKey: ['governorates'],
    queryFn: async () => {
      const response = await apiClient.get('/governorates');
      return response.data.data as string[];
    },
  });

  const { data: cities } = useQuery({
    queryKey: ['cities', selectedGovernorate],
    queryFn: async () => {
      const params: any = {};
      if (selectedGovernorate) params.governorate = selectedGovernorate;
      const response = await apiClient.get('/cities', { params });
      return response.data.data as string[];
    },
    enabled: !!selectedGovernorate,
  });

  const { data: areas } = useQuery({
    queryKey: ['areas', selectedCity],
    queryFn: async () => {
      const params: any = {};
      if (selectedGovernorate) params.governorate = selectedGovernorate;
      if (selectedCity) params.city = selectedCity;
      const response = await apiClient.get('/areas', { params });
      return response.data.data as string[];
    },
    enabled: !!selectedCity,
  });

  const filteredOrganizations = organizations?.filter(org => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      org.name.toLowerCase().includes(term) ||
      org.branches.some(branch => 
        branch.name.toLowerCase().includes(term) ||
        branch.city?.toLowerCase().includes(term) ||
        branch.area?.toLowerCase().includes(term)
      )
    );
  });

  const handleOrganizationClick = (slug: string) => {
    navigate(`/organizations/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">QR Order</h1>
                <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">For Restaurant Owners</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              {isAuthenticated ? (
                <>
                  <span className="text-xs sm:text-sm text-slate-600 hidden sm:inline">Welcome, {user?.name}</span>
                  <a
                    href={import.meta.env.DEV ? 'http://localhost:5174/admin' : '/admin'}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-xs sm:text-sm font-medium"
                  >
                    <span className="hidden sm:inline">Admin Dashboard</span>
                    <span className="sm:hidden">Admin</span>
                  </a>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-xs sm:text-sm font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login-organization')}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-xs sm:text-sm font-medium"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => navigate('/register-organization')}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Register Organization</span>
                    <span className="sm:hidden">Register</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-block mb-4 px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium">
            For Restaurant & Café Owners
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 px-2">
            Discover & Manage Your Restaurant
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto px-4">
            Browse registered restaurants, register your own establishment, or manage your existing account. 
            <br className="hidden sm:block" />
            <span className="text-slate-500 text-sm sm:text-base">Customers: <a href="http://localhost:5173" className="text-slate-900 font-medium hover:underline">Scan QR codes here</a></span>
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search restaurants..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Governorate</label>
              <select
                value={selectedGovernorate}
                onChange={(e) => {
                  setSelectedGovernorate(e.target.value);
                  setSelectedCity('');
                  setSelectedArea('');
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              >
                <option value="">All Governorates</option>
                {governorates?.map((gov) => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedArea('');
                }}
                disabled={!selectedGovernorate}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">All Cities</option>
                {cities?.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Area</label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                disabled={!selectedCity}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">All Areas</option>
                {areas?.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Organizations List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-300 border-t-slate-900"></div>
          </div>
        ) : filteredOrganizations?.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-lg font-medium text-slate-900 mb-2">No restaurants found</p>
            <p className="text-slate-600">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredOrganizations?.map((org) => (
              <div key={org.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer" onClick={() => handleOrganizationClick(org.slug)}>
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2 truncate">{org.name}</h3>
                      {org.branches.length > 0 && (
                        <p className="text-xs sm:text-sm text-slate-600">
                          {org.branches.length} {org.branches.length === 1 ? 'branch' : 'branches'}
                        </p>
                      )}
                    </div>
                    {org.logo && (
                      <img src={org.logo} alt={org.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0" />
                    )}
                  </div>

                  {org.branches.length > 0 && (
                    <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                      {org.branches.slice(0, 2).map((branch) => (
                        <div key={branch.id} className="p-2 sm:p-3 bg-slate-50 rounded-lg">
                          <p className="font-medium text-slate-900 mb-1 text-sm sm:text-base">{branch.name}</p>
                          <div className="text-xs text-slate-600 space-y-1">
                            {branch.area && branch.city && branch.governorate && (
                              <p className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {branch.area}, {branch.city}, {branch.governorate}
                              </p>
                            )}
                            {branch.phone && (
                              <p className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {branch.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      {org.branches.length > 2 && (
                        <p className="text-xs text-slate-500 text-center">+{org.branches.length - 2} more branches</p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOrganizationClick(org.slug);
                    }}
                    className="block w-full text-center px-3 py-2 sm:px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm sm:text-base"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-12 sm:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">QR Order</h3>
            <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6 px-4">Digital ordering system for restaurants and cafés in Egypt</p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}






