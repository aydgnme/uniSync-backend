import axios, { AxiosError, AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decodeToken, isTokenExpired } from '../utils/token';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3031/api';

// İstek kuyruğu yönetimi
const requestQueue: Array<() => Promise<any>> = [];
let isProcessingQueue = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 saniye

const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  
  const request = requestQueue.shift();
  if (request) {
    try {
      await request();
      lastRequestTime = Date.now();
    } catch (error) {
      console.error('Queue request error:', error);
    }
  }
  
  isProcessingQueue = false;
  if (requestQueue.length > 0) {
    setTimeout(processQueue, MIN_REQUEST_INTERVAL);
  }
};

// API instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    
    if (token) {
      if (isTokenExpired(token)) {
        // Token yenileme
        try {
          const response = await api.post('/auth/refresh', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const newToken = response.data.token;
          await AsyncStorage.setItem('token', newToken);
          config.headers.Authorization = `Bearer ${newToken}`;
        } catch (error) {
          // Token yenileme başarısız, logout
          await AsyncStorage.removeItem('token');
          // Auth context'e logout eventi gönder
          return Promise.reject(error);
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
      
      return new Promise((resolve) => {
        requestQueue.push(() => {
          return new Promise((resolveQueue) => {
            setTimeout(() => {
              resolveQueue(api(originalRequest));
            }, retryAfter * 1000);
          });
        });
        
        processQueue();
        resolve(Promise.reject(error));
      });
    }
    
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      // Auth context'e logout eventi gönder
    }
    
    return Promise.reject(error);
  }
);

export default api; 