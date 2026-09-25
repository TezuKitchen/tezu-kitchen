import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Current Wi-Fi LAN IP of host machine for physical devices when wireless
const DEFAULT_LOCAL_IP = '10.83.161.162';
const ADB_REVERSE_IP = '127.0.0.1';

const getBaseUrl = () => {
  // 1. Explicit override via EXPO_PUBLIC_API_URL in .env if provided
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (__DEV__) {
    // 2. Web browser: connect directly to localhost
    if (Platform.OS === 'web') {
      return 'http://localhost:8080/api/v1';
    }

    // 3. Automatically detect host IP from Expo Metro bundler across various Expo SDK versions
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
      (Constants as any).manifest?.debuggerHost;

    if (hostUri) {
      const rawHost = hostUri.split(':')[0];
      const isTunnel = rawHost.includes('exp.direct') || rawHost.includes('ngrok') || rawHost.includes('localtunnel');
      const isLocalhost = rawHost === 'localhost' || rawHost === '127.0.0.1';

      if (Platform.OS === 'android') {
        // If Metro was launched with --localhost, use 127.0.0.1 (ADB reverse)
        if (isLocalhost) {
          return `http://${ADB_REVERSE_IP}:8080/api/v1`;
        }
        // Tunnel hostnames don't forward port 8080; fall back to local LAN IP
        if (isTunnel) {
          return `http://${DEFAULT_LOCAL_IP}:8080/api/v1`;
        }
        return `http://${rawHost}:8080/api/v1`;
      }

      return `http://${rawHost}:8080/api/v1`;
    }
    
    // Fallbacks if hostUri is not available
    if (Platform.OS === 'android') {
      return `http://${ADB_REVERSE_IP}:8080/api/v1`;
    }
    return 'http://localhost:8080/api/v1';
  }
  
  // Production URL
  return 'https://api.tezukitchen.com/api/v1';
};

export const API_URL = getBaseUrl();
if (__DEV__) {
  console.log('[TezuKitchen API] Configured baseURL:', API_URL);
}

// Simple event emitter for auth state changes
type AuthEventCallback = () => void;
let onUnauthorizedCallback: AuthEventCallback | null = null;

export const setOnUnauthorized = (callback: AuthEventCallback) => {
  onUnauthorizedCallback = callback;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout to accommodate serverless DB cold starts
});

// Request interceptor to add the auth token header to requests
api.interceptors.request.use(
  async (config) => {
    try {
      // Public endpoints do not need Authorization header (avoids browser CORS preflight issues)
      const isPublicGet = config.method?.toLowerCase() === 'get' &&
        (config.url?.includes('/restaurants') || config.url?.includes('/menu') || config.url?.includes('/reviews'));

      if (!isPublicGet) {
        let token: string | null = null;
        if (Platform.OS === 'web') {
          token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
        } else {
          token = await SecureStore.getItemAsync('userToken');
        }

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper to clear all auth storage
const clearAuthStorage = async () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
    }
  } else {
    await SecureStore.deleteItemAsync('userToken').catch(() => {});
    await SecureStore.deleteItemAsync('refreshToken').catch(() => {});
    await SecureStore.deleteItemAsync('userData').catch(() => {});
  }
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor with silent token auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt token refresh for auth endpoints (login, register, refresh) to avoid loops
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
                           originalRequest?.url?.includes('/auth/register') ||
                           originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // If a refresh is already underway, queue this request until the new token is available
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        let refreshToken: string | null = null;
        if (Platform.OS === 'web') {
          refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        } else {
          refreshToken = await SecureStore.getItemAsync('refreshToken');
        }

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint using an independent axios call to avoid interceptor recursion
        const refreshRes = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        });

        const newAuthData = refreshRes.data?.data;
        const newAccessToken = newAuthData?.accessToken;
        const newRefreshToken = newAuthData?.refreshToken;

        if (!newAccessToken) {
          throw new Error('No new access token received');
        }

        // Store new tokens
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            localStorage.setItem('userToken', newAccessToken);
            if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
          }
        } else {
          await SecureStore.setItemAsync('userToken', newAccessToken);
          if (newRefreshToken) {
            await SecureStore.setItemAsync('refreshToken', newRefreshToken);
          }
        }

        // Drain the failed queue with the new access token
        processQueue(null, newAccessToken);

        // Retry the original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        console.log('Session refresh failed, forcing logout:', refreshErr);
        await clearAuthStorage();
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Automatic host fallback on Network Error (e.g. switching between USB adb reverse and Wi-Fi)
    if (!error.response && !originalRequest?._networkRetry && Platform.OS !== 'web') {
      originalRequest._networkRetry = true;
      const currentBaseUrl = originalRequest.baseURL || api.defaults.baseURL || '';
      const currentUrl = originalRequest.url || '';
      
      let alternateBaseUrl: string | null = null;
      if (currentBaseUrl.includes(ADB_REVERSE_IP) || currentUrl.includes(ADB_REVERSE_IP) || currentBaseUrl.includes('localhost')) {
        alternateBaseUrl = `http://${DEFAULT_LOCAL_IP}:8080/api/v1`;
      } else if (currentBaseUrl.includes(DEFAULT_LOCAL_IP) || currentUrl.includes(DEFAULT_LOCAL_IP)) {
        alternateBaseUrl = `http://${ADB_REVERSE_IP}:8080/api/v1`;
      }

      if (alternateBaseUrl) {
        console.log(`[TezuKitchen API] Network Error on ${currentBaseUrl}. Retrying via fallback: ${alternateBaseUrl}`);
        originalRequest.baseURL = alternateBaseUrl;
        api.defaults.baseURL = alternateBaseUrl;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
