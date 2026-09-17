import axios from 'axios';
import { tokenStore } from '../utils/tokenStore';

// Get the API base URL based on the current hostname
// If on localhost, use localhost:8000
// If on an IP address, use the same IP with :8000
const getAPIBaseURL = () => {
  // If a production API URL is provided via environment variables, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  // For IP addresses or other hosts, use the same IP
  return `http://${hostname}:8000/api`;
};

const API_BASE_URL = getAPIBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = tokenStore.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    const originalRequest = error.config;

    // If 401 error and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return undefined;
        };
        const csrfToken = getCookie('csrftoken');

        const response = await axios.post(`${API_BASE_URL}/accounts/users/token/refresh/`, {}, {
            withCredentials: true,
            headers: csrfToken ? { 'X-CSRFToken': csrfToken } : {}
        });

        const { access } = response.data;
        tokenStore.setToken(access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear token and return error. React Router (PrivateRoute) will handle redirects.
        tokenStore.clearToken();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
