import axios from 'axios';

// Ensure API URL always ends with /api
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  // Remove trailing slash if present
  const baseUrl = envUrl.replace(/\/$/, '');
  // Ensure /api is appended
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};

const apiClient = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Set up token from localStorage if it exists
const token = localStorage.getItem('token');
if (token) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default apiClient;

