import axios from 'axios';

// Global axios setup:
// Rewrite any hardcoded localhost URLs to the configured backend base.
//
// This keeps legacy calls like:
//   axios.get('http://localhost:3011/api/v1/...')
// working when the backend is hosted remotely.

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3011';
const normalizedBaseURL = RAW_BASE_URL.replace(/\/$/, '');
const apiV1BaseURL = normalizedBaseURL.endsWith('/api/v1')
  ? normalizedBaseURL
  : `${normalizedBaseURL}/api/v1`;

const LOCALHOST_BASE = 'http://localhost:3011';
const LOCALHOST_API_V1_BASE = 'http://localhost:3011/api/v1';

axios.interceptors.request.use((config) => {
  if (typeof config.url === 'string') {
    if (config.url.startsWith(LOCALHOST_API_V1_BASE)) {
      config.url = config.url.replace(LOCALHOST_API_V1_BASE, apiV1BaseURL);
    } else if (config.url.startsWith(LOCALHOST_BASE)) {
      config.url = config.url.replace(LOCALHOST_BASE, normalizedBaseURL);
    }
  }
  return config;
});

