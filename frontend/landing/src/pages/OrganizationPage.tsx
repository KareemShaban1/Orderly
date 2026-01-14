import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

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

interface Table {
  id: number;
  table_number: string;
  capacity: number;
  qr_code: string;
  qr_code_image: string | null;
  qr_url: string;
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
  tables: Table[];
}

export default function OrganizationPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: organization, isLoading, error } = useQuery({
    queryKey: ['organization', slug],
    queryFn: async () => {
      const response = await apiClient.get(`/organizations/${slug}`);
      const data = response.data.data as Organization;
      // Debug: Log to help diagnose
      if (import.meta.env.DEV) {
        console.log('Organization data:', data);
        console.log('Branches:', data.branches);
        data.branches.forEach((branch, idx) => {
          console.log(`Branch ${idx} (${branch.name}) has ${branch.tables?.length || 0} tables:`, branch.tables);
        });
      }
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-300 border-t-slate-900"></div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Organization not found</h2>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Organization Hero */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {organization.logo && (
              <img
                src={organization.logo}
                alt={organization.name}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 sm:mb-4 break-words">{organization.name}</h1>
              <div className="space-y-2 text-sm sm:text-base text-slate-600">
                {organization.email && (
                  <p className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {organization.email}
                  </p>
                )}
                {organization.phone && (
                  <p className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {organization.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Branches Section */}
        {organization.branches.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">Our Branches</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {organization.branches.map((branch) => (
                <div key={branch.id} className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">{branch.name}</h3>
                  <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-slate-600">
                    {branch.address && (
                      <p className="flex items-start">
                        <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{branch.address}</span>
                      </p>
                    )}
                    {(branch.area || branch.city || branch.governorate) && (
                      <p className="flex items-center">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>
                          {[branch.area, branch.city, branch.governorate].filter(Boolean).join(', ')}
                        </span>
                      </p>
                    )}
                    {branch.phone && (
                      <p className="flex items-center">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {branch.phone}
                      </p>
                    )}
                    {branch.opening_time && branch.closing_time && (
                      <p className="flex items-center">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {branch.opening_time} - {branch.closing_time}
                      </p>
                    )}
                  </div>
                  
                  {/* Tables with QR Codes */}
                  {branch.tables && branch.tables.length > 0 ? (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h4 className="text-sm sm:text-base font-semibold text-slate-900 mb-3">Tables & QR Codes</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                        {branch.tables.map((table) => (
                          <div key={table.id} className="text-center">
                            {table.qr_code_image ? (
                              <a
                                href={table.qr_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={table.qr_code_image}
                                  alt={`Table ${table.table_number} QR Code`}
                                  className="w-full aspect-square object-contain rounded-lg border-2 border-slate-200 hover:border-slate-900 transition-colors mb-1"
                                />
                              </a>
                            ) : table.qr_code ? (
                              <a
                                href={table.qr_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full aspect-square bg-slate-100 rounded-lg border-2 border-slate-200 hover:border-slate-900 flex flex-col items-center justify-center mb-1 transition-colors"
                              >
                                <svg className="w-8 h-8 text-slate-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                                <span className="text-xs text-slate-600 font-medium">Click to Order</span>
                              </a>
                            ) : (
                              <div className="w-full aspect-square bg-slate-100 rounded-lg border-2 border-slate-200 flex items-center justify-center mb-1">
                                <span className="text-xs text-slate-500">No QR</span>
                              </div>
                            )}
                            <p className="text-xs text-slate-600 font-medium">Table {table.table_number}</p>
                            <p className="text-xs text-slate-500">👥 {table.capacity}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-slate-500 text-center">
                          Click any table to view menu and order
                        </p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {branch.tables.slice(0, 5).map((table) => (
                            <a
                              key={table.id}
                              href={table.qr_url}
                              className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 transition-colors"
                            >
                              Table {table.table_number}
                            </a>
                          ))}
                          {branch.tables.length > 5 && (
                            <span className="text-xs px-2 py-1 text-slate-500">
                              +{branch.tables.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-500 text-center">
                        No tables available for this branch
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Section - Scan QR Code or Enter Table Code */}
        <div className="mt-8 sm:mt-12 bg-slate-900 rounded-xl shadow-lg p-6 sm:p-8 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Ready to Order?</h2>
          <p className="text-sm sm:text-base text-slate-300 mb-6 sm:mb-8 px-4">
            Scan the QR code at your table or enter your table code to view our menu and place your order
          </p>
          
          <div className="max-w-md mx-auto space-y-4">
            {/* Table Code Input */}
            <div className="bg-white/10 rounded-lg p-4">
              <label className="block text-sm font-medium text-white mb-2">
                Enter Your Table Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="tableCodeInput"
                  placeholder="e.g., TBL-XXXXXXXX"
                  className="flex-1 px-4 py-2.5 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-white"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const code = (e.target as HTMLInputElement).value.trim();
                      if (code) {
                        window.location.href = `/order/${encodeURIComponent(code)}`;
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const code = (document.getElementById('tableCodeInput') as HTMLInputElement)?.value.trim();
                    if (code) {
                      window.location.href = `/order/${encodeURIComponent(code)}`;
                    } else {
                      alert('Please enter a table code');
                    }
                  }}
                  className="px-5 py-2.5 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors font-medium whitespace-nowrap"
                >
                  Go to Menu
                </button>
              </div>
            </div>

            {/* Scan QR Code Button */}
            <div>
              <a
                href="/"
                className="inline-block w-full px-5 py-3 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors font-medium text-base flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                📱 Scan QR Code with Camera
              </a>
            </div>

            {organization.branches.some(b => b.tables && b.tables.length > 0) && (
              <p className="text-xs sm:text-sm text-slate-400 mt-4">
                💡 Tip: Scroll up to view and scan table QR codes directly from this page
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-12 sm:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">QR Order</h3>
            <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6 px-4">Digital ordering system for restaurants and cafés in Egypt</p>
            <button
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white transition-colors text-xs sm:text-sm"
            >
              Back to Home
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}






