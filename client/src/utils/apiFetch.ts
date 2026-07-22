/**
 * apiFetch — Drop-in replacement for fetch() that automatically attaches
 * the Authorization Bearer token from localStorage (vayusense_token) and
 * always includes credentials for HttpOnly cookie fallback.
 *
 * Usage:
 *   import { apiFetch } from '../utils/apiFetch';
 *   const res = await apiFetch('/api/aqi/live?city=Mumbai');
 */
export async function apiFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('vayusense_token');

  const headers = new Headers(init.headers);

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });
}
