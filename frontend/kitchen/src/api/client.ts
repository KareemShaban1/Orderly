import axios from 'axios';

// Ensure API URL always ends with /api if not already present
const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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
      // Clear auth data and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      // Redirect to home/login
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

