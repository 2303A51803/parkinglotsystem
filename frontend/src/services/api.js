import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// Attach the stored JWT to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On a 401, the token is invalid/expired — clear it so ProtectedRoute
// redirects to login instead of the app being stuck in a broken state.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sp_token');
      localStorage.removeItem('sp_user');
    }
    return Promise.reject(error);
  }
);

export const extractErrorMessage = (err) =>
  err.response?.data?.message || err.message || 'Something went wrong. Please try again.';

export default api;
