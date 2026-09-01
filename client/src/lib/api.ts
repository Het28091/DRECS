import axios from 'axios';
import { API_BASE_URL } from './constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token from localStorage as Bearer token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('drecs_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: Handle unauthorized responses by clearing invalid token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[API] Authentication failure (401):', error.config?.url);
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('drecs_token');
        localStorage.removeItem('drecs_user');
      }
    }
    return Promise.reject(error);
  },
);

export default api;
