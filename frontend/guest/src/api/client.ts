import axios from 'axios';

// Ensure API URL always ends with /api if not already present
// Default to production API URL if not set
const envUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' 
  ? `${window.location.protocol}//${window.location.host}` 
  : 'http://orderly.kareemsoft.org');
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
      // Clear auth data (if any) - customers don't need auth, but clear just in case
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      // Redirect to home (QR scanner) - customers don't need login
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

