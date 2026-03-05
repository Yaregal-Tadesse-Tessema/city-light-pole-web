const LOCAL_DEV_API_BASE = 'http://localhost:3011';
const LOCALHOST_PATTERN = /(?:^|:\/\/)(localhost|127(?:\.\d{1,3}){3})(?::\d+)?(?:\/|$)/i;
const DUPLICATE_API_PATTERN = /\/api\/api(?:\/|$)/i;

const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const rawBaseUrl = configuredBaseUrl || LOCAL_DEV_API_BASE;

const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '');

const toApiV1Base = (baseUrl: string) => {
  if (baseUrl.endsWith('/api/v1')) return baseUrl;
  if (baseUrl.endsWith('/api')) return `${baseUrl}/v1`;
  return `${baseUrl}/api/v1`;
};

const normalizedApiV1Base = toApiV1Base(normalizedBaseUrl);

const browserOrigin =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'http://localhost';

const toAbsolute = (value: string) =>
  value.startsWith('http://') || value.startsWith('https://')
    ? value
    : `${browserOrigin}${value.startsWith('/') ? '' : '/'}${value}`;

export const API_BASE_URL = normalizedBaseUrl;
export const API_V1_BASE_URL = normalizedApiV1Base;
export const API_ORIGIN_URL = new URL(toAbsolute(normalizedBaseUrl)).origin;

export const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`);

export const toApiV1Url = (path: string) =>
  `${API_V1_BASE_URL}${ensureLeadingSlash(path)}`;

export const toApiOriginUrl = (path: string) =>
  `${API_ORIGIN_URL}${ensureLeadingSlash(path)}`;

if (import.meta.env.PROD && LOCALHOST_PATTERN.test(normalizedBaseUrl)) {
  throw new Error(
    `Invalid production API base URL: "${normalizedBaseUrl}". Set VITE_API_BASE_URL to your real API host.`,
  );
}

if (import.meta.env.PROD && !configuredBaseUrl) {
  throw new Error('Missing VITE_API_BASE_URL in production build. Set it to your API base URL.');
}

if (DUPLICATE_API_PATTERN.test(normalizedApiV1Base)) {
  throw new Error(`Malformed API base URL after normalization: "${normalizedApiV1Base}".`);
}
