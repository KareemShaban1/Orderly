import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/library';
import apiClient from '../api/client';
import './OrganizationPage.css';

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  opening_time: string | null;
  closing_time: string | null;
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
}

function OrganizationPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
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

      // Start decoding - use device ID or undefined for default
      const deviceToUse = selectedDeviceId === 'default' ? undefined : selectedDeviceId;
      
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/organizations')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {organization.logo ? (
              <img
                src={organization.logo}
                alt={organization.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {organization.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 truncate">{organization.name}</h1>
              <p className="text-xs text-slate-600">Order with QR Code</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Order Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
            Start Your Order
          </h2>
          <p className="text-sm text-slate-600 text-center mb-6">
            Scan the QR code on your table or enter your table code
          </p>

          <div className="space-y-4">
            {/* Manual Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Enter Table Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                  placeholder="e.g., TBL-XXXXXXXX"
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
                <button
                  onClick={handleManualSubmit}
                  className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
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
                  className="w-full px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Open QR Scanner
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-slate-900 rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-64 object-cover"
                      playsInline
                    />
                    <div className="absolute inset-0 border-4 border-white rounded-lg pointer-events-none" />
                  </div>
                  <button
                    onClick={stopScanning}
                    className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
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
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">About</h3>
            <p className="text-slate-600">{organization.description}</p>
          </div>
        )}

        {/* Branches */}
        {organization.branches && organization.branches.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Our Locations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {organization.branches.map((branch) => (
                <div key={branch.id} className="border border-slate-200 rounded-lg p-4">
                  <h4 className="font-bold text-slate-900 mb-2">{branch.name}</h4>
                  <div className="space-y-1 text-sm text-slate-600">
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

