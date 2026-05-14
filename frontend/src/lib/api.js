import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage as fallback (for environments without cookie support)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401s globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
   if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('tf_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
