import axios from 'axios';

// Backend API base URL
// Accepts either:
// - http://host:port              (we'll append /api/v1)
// - http://host:port/api/v1       (used as-is)
const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3011';
const normalizedBaseURL = RAW_BASE_URL.replace(/\/$/, '');
const apiV1BaseURL = normalizedBaseURL.endsWith('/api/v1')
  ? normalizedBaseURL
  : `${normalizedBaseURL}/api/v1`;

export const apiClient = axios.create({
  baseURL: apiV1BaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug: Log the baseURL to verify it's set correctly
console.log('API Base URL:', apiV1BaseURL);

// Request interceptor to add auth token and log URLs
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure relative URLs always start with "/" so axios joins correctly with baseURL.
    if (config.url && !config.url.startsWith('http') && !config.url.startsWith('/')) {
      config.url = `/${config.url}`;
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
      const url = (error.config?.url as string | undefined) || '';
      const isAuthCall =
        url.includes('/auth/login') ||
        url.includes('/auth/signup');

      // Don't hard-redirect for expected 401s (like wrong credentials),
      // and don't reload if we're already on the login page.
      if (!isAuthCall && window.location.pathname !== '/login') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;


