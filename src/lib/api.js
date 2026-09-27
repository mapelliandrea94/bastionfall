import { supabase } from './supabase.js';

async function getAccessToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

export async function apiRequest(path, options = {}) {
  const token = await getAccessToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body != null) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', 'Bearer ' + token);

  const response = await fetch(path, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(payload?.error || `request_failed_${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const api = Object.freeze({
  health: () => apiRequest('/api/health'),
  config: () => apiRequest('/api/config'),
  profile: () => apiRequest('/api/profile'),
  completeRun: (body) => apiRequest('/api/run/complete', {
    method: 'POST',
    body: JSON.stringify(body)
  })
});
