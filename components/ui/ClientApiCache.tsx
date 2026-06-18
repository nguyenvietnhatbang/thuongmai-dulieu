'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    __crmFetchCacheInstalled?: boolean;
    __crmOriginalFetch?: typeof fetch;
  }
}

const CACHE_TTL_MS = 60_000;
const SKIP_CACHE_PREFIXES = [
  '/api/auth',
  '/api/notifications',
  '/api/files',
];

interface CachedResponse {
  expiresAt: number;
  response: Response;
}

function getRequestInfo(input: RequestInfo | URL, init?: RequestInit) {
  const request = input instanceof Request ? input : null;
  const method = (init?.method || request?.method || 'GET').toUpperCase();
  const url = typeof input === 'string'
    ? new URL(input, window.location.origin)
    : input instanceof URL
      ? input
      : new URL(input.url, window.location.origin);

  return { method, url };
}

function shouldCacheRequest(method: string, url: URL) {
  if (method !== 'GET') return false;
  if (url.origin !== window.location.origin) return false;
  if (!url.pathname.startsWith('/api/')) return false;
  return !SKIP_CACHE_PREFIXES.some(prefix => url.pathname.startsWith(prefix));
}

export function ClientApiCache() {
  useEffect(() => {
    if (window.__crmFetchCacheInstalled) return;

    const originalFetch = window.fetch.bind(window);
    const cache = new Map<string, CachedResponse>();

    window.__crmOriginalFetch = window.fetch;
    window.__crmFetchCacheInstalled = true;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const { method, url } = getRequestInfo(input, init);

      if (method !== 'GET' && url.origin === window.location.origin && url.pathname.startsWith('/api/')) {
        cache.clear();
      }

      if (!shouldCacheRequest(method, url)) {
        return originalFetch(input, init);
      }

      const key = url.toString();
      const cached = cache.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.response.clone();
      }

      const response = await originalFetch(input, init);
      if (response.ok) {
        cache.set(key, {
          expiresAt: Date.now() + CACHE_TTL_MS,
          response: response.clone(),
        });
      }

      return response;
    };
  }, []);

  return null;
}
