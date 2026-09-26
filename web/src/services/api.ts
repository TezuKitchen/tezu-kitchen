import axios from 'axios';

// --- URL Resolution ---
function getBaseUrl(): string {
  // 1. Explicit env var
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // 2. Development default
  if (import.meta.env.DEV) {
    return 'http://localhost:8080/api/v1';
  }
  // 3. Production
  return 'https://api.tezukitchen.com/api/v1';
}

export const API_URL = getBaseUrl();
console.log('[TezuKitchen Web] API baseURL:', API_URL);

// --- Unauthorized callback ---
let onUnauthorizedCallback: (() => void) | null = null;
export function setOnUnauthorized(callback: () => void) {
  onUnauthorizedCallback = callback;
}

// --- Axios Instance ---
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// --- Token helpers ---
function getToken(): string | null {
  return localStorage.getItem('userToken');
}
function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}
function setTokens(access: string, refresh: string) {
  localStorage.setItem('userToken', access);
  localStorage.setItem('refreshToken', refresh);
}
function clearAuthStorage() {
  localStorage.removeItem('userToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userData');
}

// --- Request Interceptor (attach JWT) ---
api.interceptors.request.use(
  (config) => {
    // Skip auth header for public GET endpoints
    const url = config.url || '';
    const isPublicGet =
      config.method === 'get' &&
      (url.includes('/restaurants') || url.includes('/menu'));
    if (!isPublicGet) {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor (silent token refresh) ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        clearAuthStorage();
        onUnauthorizedCallback?.();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });
        const { accessToken, refreshToken: newRefresh } = response.data.data;
        setTokens(accessToken, newRefresh);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthStorage();
        onUnauthorizedCallback?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
