// Central Axios instance with JWT auto-attach
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eduPathToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — BUT skip auth endpoints (login/register/google)
// so wrong-password errors can be shown in the form instead of redirecting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthCall = url.includes('/auth/');
    if (error.response?.status === 401 && !isAuthCall) {
      // Token expired mid-session — clear and redirect
      localStorage.removeItem('eduPathToken');
      localStorage.removeItem('eduPathUser');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
