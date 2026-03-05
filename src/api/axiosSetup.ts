import axios from 'axios';
import { API_BASE_URL, API_V1_BASE_URL } from '../config/api';

// Global axios setup:
// Rewrite any hardcoded localhost URLs to the configured backend base.
//
// This keeps legacy calls like:
//   axios.get('http://localhost:3011/api/v1/...')
// working when the backend is hosted remotely.

const LOCALHOST_BASE = 'http://localhost:3011';
const LOCALHOST_API_V1_BASE = 'http://localhost:3011/api/v1';
const LOOPBACK_BASE = 'http://127.0.0.1:3011';
const LOOPBACK_API_V1_BASE = 'http://127.0.0.1:3011/api/v1';

axios.interceptors.request.use((config) => {
  if (typeof config.url === 'string') {
    const rewrites: Array<[string, string]> = [
      [LOCALHOST_API_V1_BASE, API_V1_BASE_URL],
      [LOCALHOST_BASE, API_BASE_URL],
      [LOOPBACK_API_V1_BASE, API_V1_BASE_URL],
      [LOOPBACK_BASE, API_BASE_URL],
    ];

    for (const [from, to] of rewrites) {
      if (config.url.startsWith(from)) {
        config.url = config.url.replace(from, to);
        break;
      }
    }
  }
  return config;
});
