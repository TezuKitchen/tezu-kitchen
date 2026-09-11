import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Fallback IP of host machine for physical devices when auto-detection is not available
const DEFAULT_LOCAL_IP = '10.184.225.61';

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
      const host = hostUri.split(':')[0];
      // Do not use tunnel hostnames (e.g. *.exp.direct or *.ngrok*) because Expo tunnel only proxies port 8081 (Metro), not port 8080 (Backend)
      const ip = hostUri.split(':')[0];
      return `http://${ip}:8080/api/v1`;
    }
    
    // Fallbacks if hostUri is not available (e.g. running outside of Expo Go)
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8080/api/v1'; // Android emulator localhost
    }
    return 'http://localhost:8080/api/v1'; // iOS simulator localhost
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
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add the auth token header to requests
api.interceptors.request.use(
  async (config) => {
    try {
      // Public endpoints do not need Authorization header (avoids browser CORS preflight issues)
      const isPublicGet = config.method?.toLowerCase() === 'get' &&
        (config.url?.includes('/restaurants') || config.url?.includes('/menu'));

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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 Unauthorized (token expired, etc.)
    if (error.response && error.response.status === 401) {
      console.log('Token expired or unauthorized, forcing logout');
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('userToken');
          localStorage.removeItem('userData');
        }
      } else {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData');
      }
      // Notify AuthContext to reset state and redirect to login
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
