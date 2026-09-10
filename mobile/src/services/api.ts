import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Current active local network IP of host machine
const LOCAL_IP = '10.59.60.162';

const getBaseUrl = () => {
  if (__DEV__) {
    // Automatically detect the host running the Expo Metro bundler
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      return `http://${host}:8080/api/v1`;
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
      const token = await SecureStore.getItemAsync('userToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from SecureStore:', error);
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
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');
      // Notify AuthContext to reset state and redirect to login
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
