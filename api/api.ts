/* eslint-disable no-console */
import { Platform } from 'react-native';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const getBaseUrl = () => {
  if (__DEV__) {
    return Platform.select({
      ios: 'http://localhost:3000/api', // iOS simulator
      android: 'http://10.0.2.2:3000/api', // Android emulator
      default: 'http://localhost:3000/api' // Web
    });
  }
  return process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true
});

if (__DEV__) {
  console.log('API Base URL:', getBaseUrl());
}

// Log every request (dev only)
api.interceptors.request.use(
  (config) => {
    if (__DEV__) {
      console.log('[Request]', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    if (__DEV__) {
      console.error('[Request Error]', error);
    }
    return Promise.reject(error);
  }
);

// Handle responses + 401 session expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired — clear local auth state
      useAuthStore.getState().clearUser();
    }

    if (__DEV__) {
      if (error.response) {
        console.error('[Response Error]', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('[Network Error]', error.message);
      }
    }
    return Promise.reject(error);
  }
);
