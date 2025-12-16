import axios from 'axios';

// Backend API base URL - Direct connection to backend
// Use environment variable if set, otherwise use direct localhost URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3011/api/v1';
// Ensure baseURL does NOT have trailing slash for proper path joining
const normalizedBaseURL = API_BASE_URL.replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: normalizedBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug: Log the baseURL to verify it's set correctly
console.log('API Base URL:', normalizedBaseURL);

// Request interceptor to add auth token and log URLs
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log the full URL being called for debugging
    // Axios combines baseURL + url correctly
    const fullUrl = config.url 
      ? (config.url.startsWith('http') 
          ? config.url 
          : `${config.baseURL || ''}${config.url}`)
      : config.url;
    console.log(`API Call: ${config.method?.toUpperCase()} ${fullUrl}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;


