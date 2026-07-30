const browserApi = typeof window !== 'undefined'
  ? import.meta.env.DEV
    ? `${window.location.protocol}//${window.location.hostname}:3001/api`
    : 'https://egyhost1.com/server/api'
  : 'http://localhost:3001/api';
const API_URL = (import.meta.env.VITE_API_URL || browserApi).replace(/\/$/, '');

export const getToken = () => localStorage.getItem('webo_token');
export const setToken = (token: string | null) => token ? localStorage.setItem('webo_token', token) : localStorage.removeItem('webo_token');

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  // Do not attach a JSON content type to GET/DELETE requests with no body.
  // It forces an unnecessary CORS preflight in local development.
  if (init.body) headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(async () => ({ error: await response.text().catch(() => '') }));
    throw new Error(body.error || `Server request failed (${response.status}).`);
  }
  return response.status === 204 ? undefined as T : response.json();
}

export function apiUrl(path: string) { return `${API_URL}${path}`; }
