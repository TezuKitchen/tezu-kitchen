import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android emulator, localhost for iOS simulator, or specific IP for physical device
// For physical device testing on local network, use the computer's local IP address
const LOCAL_IP = '10.113.102.112';

const getBaseUrl = () => {
  if (__DEV__) {
    return `http://${LOCAL_IP}:8080/api/v1`;
  }
  // Production URL
  return 'https://api.tezukitchen.com/api/v1';
};

export const API_URL = getBaseUrl();

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
      console.log('Unauthorized error, clearing token');
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userRole');
      // Could trigger an event here to force logout in the UI
    }
    return Promise.reject(error);
  }
);

export default api;
