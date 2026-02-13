import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/library';
import apiClient from '../api/client';
import GamePlayer from '../components/games/GamePlayer';
import './OrganizationPage.css';

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  opening_time: string | null;
  closing_time: string | null;
}

interface Game {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  config: Record<string, unknown> | null;
}

interface Organization {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  branches: Branch[];
  games?: Game[];
}

interface MenuItemView {
  id: number;
  name: string;
  name_ar: string | null;
  description: string | null;
  price: number;
  has_sizes: boolean;
  sizes: Array<{ name: string; price: number }> | null;
  has_addons: boolean;
  addons: Array<{ id: number; name: string; price: number }>;
}

interface MenuCategoryView {
  id: number;
  name: string;
  name_ar: string | null;
  description: string | null;
  items: MenuItemView[];
}

interface MenuModalData {
  menu: MenuCategoryView[];
  tenant: { name: string; logo: string | null };
}

function OrganizationPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [playingGame, setPlayingGame] = useState<Game | null>(null);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuModalData, setMenuModalData] = useState<MenuModalData | null>(null);
  const [menuModalLoading, setMenuModalLoading] = useState(false);
  const [menuModalError, setMenuModalError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (slug) {
      fetchOrganization();
    }
  }, [slug]);

  useEffect(() => {
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }
    };
  }, []);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/organizations/${slug}`);
      setOrganization(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Organization not found');
    } finally {
      setLoading(false);
    }
  };

  const extractTableCode = (text: string): string => {
    // Extract table code from URL or plain text
    // Handle formats like: http://example.com/order/TBL-123456 or TBL-123456
    const match = text.match(/TBL-[A-Z0-9]+/i);
    if (match) {
      return match[0].toUpperCase();
    }
    // If it's a URL, try to extract from path
    try {
      const url = new URL(text);
      const pathParts = url.pathname.split('/');
      const orderIndex = pathParts.indexOf('order');
      if (orderIndex !== -1 && pathParts[orderIndex + 1]) {
        return pathParts[orderIndex + 1].toUpperCase();
      }
    } catch {
      // Not a valid URL, return as is
    }
    return text.toUpperCase();
  };

  const startScanning = async () => {
    try {
      setScanning(true);
      setError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not available. Please use manual table code entry.');
        setScanning(false);
        return;
      }

      const isSecureContext =
        window.isSecureContext ||
        location.protocol === 'https:' ||
        location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1';
      if (!isSecureContext) {
        setError('Camera access requires HTTPS. Please use manual table code entry.');
        setScanning(false);
        return;
      }

      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      // Request camera permission first
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (permError: any) {
        setError('Camera permission denied. Please allow camera access and try again.');
        setScanning(false);
        return;
      }

      // Get available video devices after permission granted
      let selectedDeviceId: string | undefined;
      try {
        const videoInputDevices = await codeReader.listVideoInputDevices();
        selectedDeviceId = videoInputDevices[0]?.deviceId;

        // Prefer back camera on mobile
        const backCamera = videoInputDevices.find(
          (device) =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
        );
        if (backCamera) {
          selectedDeviceId = backCamera.deviceId;
        }
      } catch (deviceError) {
        // If listVideoInputDevices fails, try without specifying device (use default)
        console.log('Could not list devices, using default camera');
      }

      // If no device selected, try with constraints instead
      if (!selectedDeviceId && videoRef.current) {
        // Try to get default camera with constraints
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' } // Prefer back camera
            }
          });
          videoRef.current.srcObject = stream;
          selectedDeviceId = 'default'; // Use default
        } catch (streamError) {
          setError('Could not access camera. Please use manual table code entry.');
          setScanning(false);
          return;
        }
      }

      // Start decoding - use device ID or null for default
      const deviceToUse = selectedDeviceId === 'default' ? null : (selectedDeviceId || null);
      
      codeReader.decodeFromVideoDevice(
        deviceToUse,
        videoRef.current!,
        (result, error) => {
          if (result) {
            const text = result.getText();
            const tableCode = extractTableCode(text);
            codeReader.reset();
            setScanning(false);
            navigate(`/order/${tableCode}`);
          }
          if (error && error.name !== 'NotFoundException') {
            console.error('Scan error:', error);
          }
        }
      );
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setError(err.message || 'Failed to start camera. Please use manual table code entry.');
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setScanning(false);
  };

  const handleManualSubmit = () => {
    const code = manualInput.trim();
    if (code) {
      navigate(`/order/${code}`);
    }
  };

  const fetchMenuForModal = async () => {
    if (!slug) return;
    setMenuModalLoading(true);
    setMenuModalError(null);
    try {
      const response = await apiClient.get(`/organizations/${slug}/menu`);
      const data = response.data?.data ?? response.data;
      const menu = data.menu ?? [];
      const tenant = data.tenant ?? { name: organization?.name ?? '', logo: organization?.logo ?? null };
      setMenuModalData({ menu, tenant });
    } catch (err: any) {
      setMenuModalError(err.response?.data?.message || 'Could not load menu');
      setMenuModalData(null);
    } finally {
      setMenuModalLoading(false);
    }
  };

  const openMenuModal = () => {
    setShowMenuModal(true);
    setMenuModalData(null);
    setMenuModalError(null);
    fetchMenuForModal();
  };

  const closeMenuModal = () => {
    setShowMenuModal(false);
    setMenuModalData(null);
    setMenuModalError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-700 text-lg">Loading...</p>
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
          <p className="text-red-600 text-center">{error}</p>
          <button
            onClick={() => navigate('/organizations')}
            className="mt-4 w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            Back to Restaurants
          </button>
        </div>
      </div>
    );
  }

  if (!organization) return null;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 org-page-header-inner">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate('/organizations')}
              className="flex-shrink-0 p-2.5 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
              aria-label="Back to organizations"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {organization.logo ? (
              <img
                src={organization.logo}
                alt={organization.name}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg sm:text-xl font-bold">
                  {organization.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate">{organization.name}</h1>
              <p className="text-xs text-slate-600 truncate">Order with QR Code</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 pb-8 sm:pb-10 org-page-main">
        {/* Order Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2 text-center">
            Start Your Order
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 text-center mb-4 sm:mb-6">
            Scan the QR code on your table or enter your table code
          </p>

          <div className="flex justify-center mb-4">
            <button
              type="button"
              onClick={openMenuModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] border-2 border-slate-900 text-slate-900 rounded-lg hover:bg-slate-900 hover:text-white transition-colors font-medium text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              View menu
            </button>
          </div>

          <div className="space-y-4">
            {/* Manual Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Enter Table Code
              </label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                  placeholder="e.g., TBL-XXXXXXXX"
                  className="flex-1 min-w-0 px-3 sm:px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
                <button
                  onClick={handleManualSubmit}
                  className="w-full sm:w-auto px-6 py-3 min-h-[48px] sm:min-h-0 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium flex-shrink-0"
                >
                  Go to Menu
                </button>
              </div>
            </div>

            {/* QR Scanner */}
            <div className="pt-4 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Or Scan QR Code
              </label>
              {!scanning ? (
                <button
                  onClick={startScanning}
                  className="w-full px-4 sm:px-6 py-3 min-h-[48px] bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Open QR Scanner
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-slate-900 rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-48 sm:h-64 object-cover"
                      playsInline
                    />
                    <div className="absolute inset-0 border-4 border-white rounded-lg pointer-events-none" />
                  </div>
                  <button
                    onClick={stopScanning}
                    className="w-full px-4 sm:px-6 py-3 min-h-[48px] bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Stop Scanning
                  </button>
                </div>
              )}
              {error && (
                <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
              )}
            </div>
          </div>
        </div>

        {/* Organization Info */}
        {organization.description && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">About</h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{organization.description}</p>
          </div>
        )}

        {/* Games */}
        {organization.games && organization.games.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Games</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {organization.games.map((game) => (
                <div
                  key={game.id}
                  className="border border-slate-200 rounded-lg p-3 sm:p-4 hover:border-slate-400 hover:shadow-md transition-all flex flex-col"
                >
                  <h4 className="font-bold text-slate-900 mb-1 text-sm sm:text-base">{game.name}</h4>
                  {game.description && (
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 flex-1 min-h-0">{game.description}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setPlayingGame(game)}
                    className="mt-3 w-full px-4 py-2.5 min-h-[44px] sm:min-h-0 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm"
                  >
                    Play
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu modal */}
        {showMenuModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50" onClick={closeMenuModal} role="dialog" aria-modal="true" aria-labelledby="menu-modal-title">
            <div
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                <h2 id="menu-modal-title" className="text-lg font-bold text-slate-900">
                  {menuModalData?.tenant?.name ?? organization.name} — Menu
                </h2>
                <button
                  type="button"
                  onClick={closeMenuModal}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {menuModalLoading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                    <p className="mt-3 text-slate-600 text-sm">Loading menu...</p>
                  </div>
                )}
                {menuModalError && !menuModalLoading && (
                  <p className="text-red-600 text-center py-8">{menuModalError}</p>
                )}
                {menuModalData && menuModalData.menu.length === 0 && !menuModalLoading && (
                  <p className="text-slate-600 text-center py-8">No menu items yet.</p>
                )}
                {menuModalData && menuModalData.menu.length > 0 && !menuModalLoading && (
                  <div className="space-y-6">
                    {menuModalData.menu.map((category) => (
                      <div key={category.id}>
                        <h3 className="text-base font-bold text-slate-900 mb-2 pb-1 border-b border-slate-200">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-slate-600 mb-3">{category.description}</p>
                        )}
                        <ul className="space-y-3">
                          {category.items.map((item) => (
                            <li key={item.id} className="flex justify-between gap-3 text-sm">
                              <div className="min-w-0 flex-1">
                                <span className="font-medium text-slate-900">{item.name}</span>
                                {item.description && (
                                  <p className="text-slate-600 text-xs mt-0.5 line-clamp-2">{item.description}</p>
                                )}
                              </div>
                              <span className="flex-shrink-0 font-medium text-slate-900">
                                {typeof item.price === 'number' ? item.price.toFixed(2) : Number(item.price).toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-200 flex-shrink-0">
                <p className="text-xs text-slate-500 text-center">
                  Scan a table QR or enter a table code to order.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Game player overlay */}
        {playingGame && (
          <GamePlayer
            game={{
              id: playingGame.id,
              name: playingGame.name,
              type: playingGame.type,
              config: playingGame.config,
            }}
            onClose={() => setPlayingGame(null)}
          />
        )}

        {/* Branches */}
        {organization.branches && organization.branches.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4">Our Locations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
              {organization.branches.map((branch) => (
                <div key={branch.id} className="border border-slate-200 rounded-lg p-3 sm:p-4">
                  <h4 className="font-bold text-slate-900 mb-1.5 sm:mb-2 text-sm sm:text-base">{branch.name}</h4>
                  <div className="space-y-1 text-xs sm:text-sm text-slate-600 break-words">
                    {branch.address && <p>{branch.address}</p>}
                    {branch.phone && <p>📞 {branch.phone}</p>}
                    {branch.opening_time && branch.closing_time && (
                      <p>🕐 {branch.opening_time} - {branch.closing_time}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default OrganizationPage;

