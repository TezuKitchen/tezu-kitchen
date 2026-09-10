import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// For physical device testing on local network, use the computer's local IP address
const LOCAL_IP = '10.184.225.61';

const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'web') {
      return 'http://localhost:8080/api/v1';
    }
    return `http://${LOCAL_IP}:8080/api/v1`;
  }
  // Production URL
  return 'https://api.tezukitchen.com/api/v1';
};

export const API_URL = getBaseUrl();

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
