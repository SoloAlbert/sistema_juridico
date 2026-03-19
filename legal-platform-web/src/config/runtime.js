const fallbackApiUrl = 'http://localhost:3003/api';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || fallbackApiUrl).replace(/\/+$/, '');
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');
export const APP_BASE_PATH = import.meta.env.BASE_URL || '/';

export function toAbsoluteUrl(relativePath) {
  if (!relativePath) return '';
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  return `${API_ORIGIN}${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`;
}
