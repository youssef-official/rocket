import { handleLocalRequest, LocalApiError } from './localBackend';

// The project is local-first: there is no remote server, database, or cloud
// backend. Every request is served in the browser from localStorage.
export const normalizeApiBase = (value: string) => {
  const base = value.trim().replace(/\/+$/, '');
  return base.endsWith('/server') ? `${base}/api` : base;
};

export const getToken = () => localStorage.getItem('webo_token');
export const setToken = (token: string | null) => token ? localStorage.setItem('webo_token', token) : localStorage.removeItem('webo_token');

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await handleLocalRequest(path, init, getToken()) as T;
  } catch (error) {
    if (error instanceof LocalApiError) throw new Error(error.message);
    throw error;
  }
}

// Kept for callers that still build a URL string; local mode has no origin.
export function apiUrl(path: string) { return `local:${path}`; }
