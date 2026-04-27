import { useMemo } from 'react';

export function useApi(apiBase, apiKey = '') {
  return useMemo(() => {
    async function request(path, options = {}) {
      const authHeaders = apiKey ? { 'X-API-Key': apiKey } : {};
      const response = await fetch(`${apiBase}${path}`, {
        headers: { 'Content-Type': 'application/json', ...authHeaders, ...options.headers },
        ...options,
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      if (!response.ok) {
        const detail = data?.detail || response.statusText;
        throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
      }
      return data;
    }
    return { request };
  }, [apiBase, apiKey]);
}
