import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response handler to catch auth issues and guide the user
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || 'Erro na requisição';

    if (status === 401) {
      // Clear local auth state and prompt re-login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const low = (message || '').toLowerCase();
      const isAuthProblem = low.includes('invalid') || low.includes('expired') || low.includes('no token');
      toast.error(isAuthProblem ? 'Sessão expirada. Faça login novamente.' : message);
      // short delay so the toast is visible
      setTimeout(() => {
        window.location.href = '/login';
      }, 700);
    }

    return Promise.reject(error);
  }
);

export default api;
