import axios from 'axios';

// Components API base URL
// Accepts either:
// - http://host:port              (we'll append /api/v1)
// - http://host:port/api/v1       (used as-is)
const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3011';
const normalizedBaseURL = RAW_BASE_URL.replace(/\/$/, '');
const COMPONENTS_BASE = normalizedBaseURL.endsWith('/api/v1')
  ? normalizedBaseURL
  : `${normalizedBaseURL}/api/v1`;

const componentsClient = axios.create({
  baseURL: COMPONENTS_BASE,
  headers: { 'Content-Type': 'application/json' },
});

componentsClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

componentsClient.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export const COMPONENT_TYPES = [
  'CAMERA',
  'LED_DISPLAY',
  'PHONE_CHARGER',
  'LAMP',
  'BULB',
  'ARM_BRACKET',
  'FOUNDATION',
  'CABLE',
  'SENSOR',
  'CONTROLLER',
  'BATTERY',
  'SOLAR_PANEL',
  'WIRING',
  'MOUNTING_HARDWARE',
  'OTHER',
] as const;

export const COMPONENT_STATUSES = [
  'INSTALLED',
  'REMOVED',
  'UNDER_MAINTENANCE',
  'DAMAGED',
  'REPLACED',
] as const;

export interface ComponentListParams {
  page?: number;
  limit?: number;
  type?: string;
  manufacturer?: string;
  manufacturerCountry?: string;
  isActive?: boolean;
  tag?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export const componentsApi = {
  list: (params?: ComponentListParams) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.type) searchParams.append('type', params.type);
    if (params?.manufacturer) searchParams.append('manufacturer', params.manufacturer);
    if (params?.manufacturerCountry) searchParams.append('manufacturerCountry', params.manufacturerCountry);
    if (params?.isActive !== undefined) searchParams.append('isActive', String(params.isActive));
    if (params?.tag) searchParams.append('tag', params.tag);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortDirection) searchParams.append('sortDirection', params.sortDirection);
    const qs = searchParams.toString();
    return componentsClient.get(`/components${qs ? `?${qs}` : ''}`).then((r) => r.data);
  },

  get: (id: string) => componentsClient.get(`/components/${id}`).then((r) => r.data),

  create: (data: Record<string, unknown>) =>
    componentsClient.post('/components', data).then((r) => r.data),

  update: (id: string, data: Record<string, unknown>) =>
    componentsClient.patch(`/components/${id}`, data).then((r) => r.data),

  delete: (id: string) => componentsClient.delete(`/components/${id}`).then((r) => r.data),

  getInstallationHistory: (id: string) =>
    componentsClient.get(`/components/${id}/installation-history`).then((r) => r.data),

  getPoles: (id: string, params?: { status?: string; includeRemoved?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.includeRemoved !== undefined) searchParams.append('includeRemoved', String(params.includeRemoved));
    const qs = searchParams.toString();
    return componentsClient.get(`/components/${id}/poles${qs ? `?${qs}` : ''}`).then((r) => r.data);
  },
};

export const poleComponentsApi = {
  list: (poleCode: string, params?: { status?: string; includeRemoved?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.includeRemoved !== undefined) searchParams.append('includeRemoved', String(params.includeRemoved));
    const qs = searchParams.toString();
    return componentsClient.get(`/poles/${poleCode}/components${qs ? `?${qs}` : ''}`).then((r) => r.data);
  },

  add: (poleCode: string, data: { componentId: string; quantity: number; installationDate?: string; notes?: string }) =>
    componentsClient.post(`/poles/${poleCode}/components`, data).then((r) => r.data),

  bulkAdd: (poleCode: string, items: Array<{ componentId: string; quantity: number; installationDate?: string; notes?: string }>) =>
    componentsClient.post(`/poles/${poleCode}/components/bulk`, { items }).then((r) => r.data),

  get: (poleCode: string, componentId: string) =>
    componentsClient.get(`/poles/${poleCode}/components/${componentId}`).then((r) => r.data),

  update: (poleCode: string, componentId: string, data: { quantity?: number; status?: string; notes?: string }) =>
    componentsClient.patch(`/poles/${poleCode}/components/${componentId}`, data).then((r) => r.data),

  remove: (poleCode: string, componentId: string, quantity?: number) => {
    const qs = quantity !== undefined ? `?quantity=${quantity}` : '';
    return componentsClient.delete(`/poles/${poleCode}/components/${componentId}${qs}`).then((r) => r.data);
  },
};
