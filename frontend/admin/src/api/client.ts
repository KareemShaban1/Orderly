import axios from 'axios';

// Ensure API URL always ends with /api if not already present
// Use HTTPS when page is loaded over HTTPS to avoid mixed content errors
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    // Use HTTPS if page is HTTPS, otherwise use HTTP (for local dev)
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${window.location.host}`;
  }
  
  // Default fallback - use HTTPS for production
  return 'https://orderly.kareemsoft.org';
};

let envUrl = getApiUrl();
// Force HTTPS if we're on HTTPS page (prevent mixed content)
if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
  envUrl = envUrl.replace(/^http:/, 'https:');
}
const API_BASE_URL = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        // Admin app is served under /admin, so make sure we redirect there
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

