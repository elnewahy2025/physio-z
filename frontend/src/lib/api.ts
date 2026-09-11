// frontend/src/lib/api.ts
import axios from 'axios';
import { offlineManager } from './offline-manager';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor: attach token + offline queueing ───
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor: cache GETs, queue mutations when offline, refresh tokens ───
api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses for offline access
    if (response.config.method === 'get' && response.status === 200) {
      const url = response.config.url || '';

      // Don't cache auth endpoints
      if (!url.includes('/auth/')) {
        offlineManager.cacheResponse(url, response.data);
      }
    }

    return response;
  },
  async (error) => {
    const original = error.config;

    // ─── Offline handling ───
    if (!navigator.onLine && original) {
      const method = (original.method || 'get').toUpperCase();

      // For GET requests: try to return cached data
      if (method === 'GET') {
        const url = original.url || '';
        const cached = await offlineManager.getCachedResponse(url);

        if (cached !== null) {
          return Promise.resolve({
            data: cached,
            status: 200,
            statusText: 'OK (cached)',
            headers: {},
            config: original,
            __fromCache: true,
          });
        }
      }

      // For mutations: queue for later sync
      if (
        ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)
      ) {
        const url = original.url || '';
        const body = original.data;

        // Don't queue auth requests
        if (!url.includes('/auth/')) {
          await offlineManager.queueMutation(
            method as 'POST' | 'PATCH' | 'PUT' | 'DELETE',
            url,
            typeof body === 'string' ? JSON.parse(body) : body,
            `${method} ${url}`,
          );

          // Return a fake 202 Accepted response
          return Promise.resolve({
            data: {
              message:
                'Saved offline — will sync when connection returns',
              offline: true,
              queuedAt: new Date().toISOString(),
            },
            status: 202,
            statusText: 'Accepted (offline queue)',
            headers: {},
            config: original,
          });
        }
      }
    }

    // ─── Rate limit handling (429) ───
    if (error.response?.status === 429) {
      const retryAfter =
        error.response.headers?.['retry-after'];

      const message =
        error.response?.data?.message ||
        'Too many requests';

      // Create a user-friendly error
      const friendlyError = new Error(
        `${message}${
          retryAfter
            ? ` (retry in ${Math.ceil(
                Number(retryAfter) / 60,
              )} minutes)`
            : ''
        }`,
      );

      (friendlyError as any).code = 'RATE_LIMITED';
      (friendlyError as any).retryAfter = retryAfter;

      return Promise.reject(friendlyError);
    }

    // ─── Token refresh on 401 ───
    if (
      error.response?.status === 401 &&
      !original?._retry
    ) {
      original._retry = true;

      try {
        const refreshToken =
          localStorage.getItem('refreshToken');

        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const res = await axios.post(
          '/api/auth/refresh',
          { refreshToken },
        );

        const {
          accessToken,
          refreshToken: newRefresh,
        } = res.data;

        localStorage.setItem(
          'accessToken',
          accessToken,
        );

        localStorage.setItem(
          'refreshToken',
          newRefresh,
        );

        original.headers.Authorization =
          `Bearer ${accessToken}`;

        return api(original);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;