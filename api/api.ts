import axios from 'axios';

const apiUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true
});

console.log('We are using', apiUrl, 'API Base URL'); // Debugging: Log the base URL

// 🔍 Log every request
api.interceptors.request.use(
  (config) => {
    console.log('%c📤 [Request]', 'color: cyan', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('❌ [Request Error]', error);
    return Promise.reject(error);
  }
);

// 🔍 Log every response
api.interceptors.response.use(
  (response) => {
    console.log('%c📥 [Response]', 'color: green', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('❌ [Response Error]', {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data
      });
    } else {
      console.error('❌ [Network Error]', error.message);
    }
    return Promise.reject(error);
  }
);
