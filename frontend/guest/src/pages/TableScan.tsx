import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/library';
import apiClient from '../api/client';
import './TableScan.css';

interface TableData {
  id: number;
  table_number: string;
  capacity: number;
  status: string;
  branch: {
    id: number;
    name: string;
    address: string;
  };
  tenant: {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
  };
}

function TableScan() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const navigate = useNavigate();
  const [table, setTable] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (qrCode) {
      fetchTableData(qrCode);
    } else {
      setLoading(false);
    }
  }, [qrCode]);

  useEffect(() => {
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }
    };
  }, []);

  const fetchTableData = async (code: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/table/${code}`);
      setTable(response.data.table);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Table not found');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMenu = () => {
    if (table && table.tenant.slug) {
      // Navigate to organization page where customers can scan QR codes
      window.location.href = `/organizations/${table.tenant.slug}`;
    } else if (table) {
      // Fallback: navigate to menu if slug not available
      navigate(`/menu/${table.id}`);
    }
  };

  const startScanning = async () => {
    try {
      setScanning(true);
      setError(null);
      
      // Check if camera access is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not available in this browser. Please use a modern browser with camera support.');
        setScanning(false);
        return;
      }

      // Check if HTTPS is required (camera access requires HTTPS except localhost)
      const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      if (!isSecureContext) {
        setError('Camera access requires HTTPS. Please access this site via HTTPS (https://orderly.kareemsoft.org) or use the manual table code entry below.');
        setScanning(false);
        return;
      }

      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      let selectedDeviceId: string | null = null;
      
      try {
        // Try to list devices - prefer back camera (environment)
        const videoInputDevices = await codeReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          setError('No camera found. Please use a device with a camera or enter the table code manually.');
          setScanning(false);
          return;
        }

        // Prefer back camera (environment facing)
        const backCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        
        // If no back camera found, prefer camera with 'facing' in label, or use first one
        selectedDeviceId = backCamera?.deviceId || 
          videoInputDevices.find(device => device.label.toLowerCase().includes('facing'))?.deviceId ||
          videoInputDevices[0].deviceId;
      } catch (listError: any) {
        // If listVideoInputDevices fails, try without specifying device (use default)
        console.warn('Could not enumerate devices, using default camera:', listError);
        selectedDeviceId = null; // null means use default camera
      }

      // Request camera permission first - prefer back camera
      try {
        await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment', // Prefer back camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
      } catch (permissionError: any) {
        if (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError') {
          setError('Camera permission denied. Please allow camera access in your browser settings and try again.');
        } else if (permissionError.name === 'NotFoundError' || permissionError.name === 'DevicesNotFoundError') {
          setError('No camera found. Please use a device with a camera or enter the table code manually.');
        } else {
          setError('Failed to access camera: ' + (permissionError.message || 'Unknown error'));
        }
        setScanning(false);
        return;
      }

      // Helper function to extract table code from QR text
      const extractTableCode = (text: string): string => {
        // If it's a full URL, extract the code from it
        // Format: http://orderly.kareemsoft.org/order/TBL-XXXXXXXX
        // or: https://orderly.kareemsoft.org/order/TBL-XXXXXXXX
        const urlMatch = text.match(/\/order\/([^\/\s]+)$/);
        if (urlMatch) {
          return urlMatch[1];
        }
        
        // If it's just the code (TBL-XXXXXXXX), return as is
        if (text.match(/^TBL-[A-Z0-9]+$/i)) {
          return text;
        }
        
        // If it contains the code somewhere, try to extract it
        const codeMatch = text.match(/(TBL-[A-Z0-9]+)/i);
        if (codeMatch) {
          return codeMatch[1];
        }
        
        // Return as is if no pattern matches
        return text;
      };

      // Start decoding
      codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            const text = result.getText();
            const tableCode = extractTableCode(text);
            codeReader.reset();
            setScanning(false);
            navigate(`/order/${tableCode}`);
          }
          if (error) {
            if (error.name !== 'NotFoundException') {
              console.error('Scan error:', error);
            }
          }
        }
      );
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setError(err.message || 'Failed to start camera. Please check permissions or use the manual table code entry below.');
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4 sm:p-5">
        <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
        <p className="mt-4 sm:mt-5 text-slate-700 text-base sm:text-lg">Loading...</p>
      </div>
    );
  }

  // If no QR code provided, show scan/input form
  if (!qrCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-5 md:p-6 relative overflow-hidden">
        {/* Animated background elements */}
        <div 
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-pulse-slow pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(15,23,42,0.05) 0%, transparent 70%)'
          }}
        ></div>
        
        <div className="max-w-2xl mx-auto bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl sm:shadow-2xl relative z-10">
          <div className="text-center mb-6 sm:mb-8">
            <div className="text-6xl sm:text-7xl md:text-8xl mb-4 sm:mb-5 animate-bounce-slow">🍽️</div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-2 sm:mb-3">
              Welcome to QR Order
            </h1>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-2 px-2">
              Scan the QR code on your table to view the menu and place your order instantly
            </p>
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 rounded-full text-xs sm:text-sm text-slate-700 font-medium mt-2 sm:mt-3">
              <span>✨</span>
              <span>No app download required</span>
            </div>
          </div>

          {/* How it works section */}
          <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 border border-slate-200">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 text-center">How It Works</h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { icon: '📱', text: 'Scan QR Code' },
                { icon: '📋', text: 'Browse Menu' },
                { icon: '✅', text: 'Order & Pay' }
              ].map((step, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">{step.icon}</div>
                  <div className="text-xs text-slate-600 font-medium">{step.text}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* QR Code Scanner */}
          <div className="mt-6 sm:mt-8">
            {!scanning ? (
              <button
                onClick={startScanning}
                className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl bg-slate-900 text-white shadow-lg hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                📷 Scan QR Code
              </button>
            ) : (
              <div className="text-center mb-4 sm:mb-5">
                <video
                  ref={videoRef}
                  className="w-full max-w-md mx-auto rounded-xl border-4 border-slate-900 shadow-lg"
                  playsInline
                />
                <div className="mt-3 sm:mt-4">
                  <button
                    onClick={stopScanning}
                    className="px-5 sm:px-6 py-2 sm:py-3 rounded-lg border-2 border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm sm:text-base"
                  >
                    Stop Scanning
                  </button>
                </div>
                <p className="mt-3 sm:mt-4 text-slate-600 text-xs sm:text-sm">
                  Point your camera at the QR code on your table
                </p>
              </div>
            )}
          </div>

          {/* Manual Input */}
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t-2 border-slate-100">
            <p className="mb-3 sm:mb-4 font-semibold text-slate-900 text-center text-sm sm:text-base">Or enter table code manually:</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="text"
                placeholder="Enter table code (e.g., TBL-XXXXXXXX)"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualSubmit();
                  }
                }}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3.5 text-sm sm:text-base rounded-xl border-2 border-slate-200 outline-none transition-colors focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
              <button
                onClick={handleManualSubmit}
                className="px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-sm sm:text-base whitespace-nowrap"
              >
                Go
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-5 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          {/* Features Section */}
          <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t-2 border-slate-100">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-3 sm:mb-4 text-center">Why Use QR Order?</h3>
            <div className="flex flex-col gap-2 sm:gap-3">
              {[
                { icon: '⚡', title: 'Instant Ordering', desc: 'Order directly from your table, no waiting' },
                { icon: '💳', title: 'Multiple Payment Options', desc: 'Pay via card, mobile wallet, or cash' },
                { icon: '📊', title: 'Real-time Tracking', desc: 'Track your order status in real-time' },
                { icon: '🌐', title: 'No App Required', desc: 'Works directly in your browser' }
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xl sm:text-2xl flex-shrink-0">{feature.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 text-xs sm:text-sm mb-0.5 sm:mb-1">
                      {feature.title}
                    </div>
                    <div className="text-slate-600 text-xs leading-relaxed">
                      {feature.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Footer */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t-2 border-slate-100 text-center">
            <p className="text-slate-600 text-xs mb-1 sm:mb-2">
              Restaurant owner?{' '}
              <a 
                href="http://localhost:5176" 
                className="text-slate-900 font-semibold no-underline border-b border-slate-900 hover:text-slate-700"
              >
                Register your restaurant
              </a>
            </p>
            <p className="text-slate-500 text-xs">
              Need help? Contact your server or restaurant staff
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !table) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 sm:p-5">
        <div className="max-w-md w-full bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl sm:shadow-2xl text-center">
          <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">❌</div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 sm:mb-3">Error</h1>
          <p className="text-slate-600 mb-5 sm:mb-6 text-sm sm:text-base">{error || 'Table not found'}</p>
          <button 
            className="w-full py-3 sm:py-3.5 px-6 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors text-sm sm:text-base" 
            onClick={() => navigate('/')}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-5 md:p-6 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl sm:shadow-2xl text-center">
        {table.tenant.logo && (
          <img 
            src={table.tenant.logo} 
            alt={table.tenant.name} 
            className="max-w-[100px] sm:max-w-[120px] max-h-[100px] sm:max-h-[120px] mx-auto mb-4 sm:mb-6 rounded-xl shadow-lg"
          />
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 sm:mb-3">
          {table.tenant.name}
        </h1>
        <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 bg-slate-100 rounded-full mb-4 sm:mb-5">
          <span className="text-lg sm:text-xl">🪑</span>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 m-0">
            Table {table.table_number}
          </h2>
        </div>
        <p className="text-slate-700 text-sm sm:text-base mb-1 sm:mb-2 font-medium">
          📍 {table.branch.name}
        </p>
        <p className="text-slate-600 text-xs sm:text-sm mb-6 sm:mb-8">
          👥 Capacity: {table.capacity} {table.capacity === 1 ? 'guest' : 'guests'}
        </p>
        
        <button 
          className="w-full py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl bg-slate-900 text-white shadow-lg hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          onClick={handleViewMenu}
        >
          📋 View Menu & Order
        </button>
        
        <p className="text-slate-600 text-xs mt-4 sm:mt-5 leading-relaxed">
          Browse our menu, customize your order, and pay directly from your table
        </p>
      </div>
    </div>
  );
}

export default TableScan;
