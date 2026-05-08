import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ─────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const login = (user_name, password) =>
  api.post('/api/auth/login', { user_name, password });

// Register — теперь требует ADMIN токен
export const register = (data) =>
  api.post('/api/auth/register', data);

export const logout = () =>
  api.post('/api/auth/logout').finally(() => {
    localStorage.removeItem('token');
  });

// ── Suppliers ─────────────────────────────────────────────────────────────────
export const getSuppliers = (params) => api.get('/api/suppliers', { params });
export const getSupplier = (id) => api.get(`/api/suppliers/${id}`);
export const createSupplier = (data) => api.post('/api/suppliers', data);
export const updateSupplier = (id, data) => api.put(`/api/suppliers/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/api/suppliers/${id}`);

// ── Items ─────────────────────────────────────────────────────────────────────
export const getItems = (params) => api.get('/api/items', { params });
export const getItem = (id) => api.get(`/api/items/${id}`);
export const createItem = (data) => api.post('/api/items', data);
export const updateItem = (id, data) => api.put(`/api/items/${id}`, data);
export const deleteItem = (id) => api.delete(`/api/items/${id}`);

// ── Orders ─────────────────────────────────────────────────────────────────────
export const getOrders = (params) => api.get('/api/orders', { params });
export const getOrder = (id) => api.get(`/api/orders/${id}`);
export const createOrder = (data) => api.post('/api/orders', data);

// ── Reports ──────────────────────────────────────────────────────────────────
export const getReportSummary = () => api.get('/api/reports/summary');
export const getReportOrdersPerSupplier = (params) => api.get('/api/reports/orders-per-supplier', { params });
export const getReportQtyPerItem = (params) => api.get('/api/reports/qty-per-item', { params });

// ── Warehouses ───────────────────────────────────────────────────────────────
export const getWarehouses = () => api.get('/api/warehouses');

// ── Users ───────────────────────────────────────────────────────────────────
export const getUsers = (params) => api.get('/api/users', { params });
export const getUser = (id) => api.get(`/api/users/${id}`);
export const updateUser = (id, data) => api.put(`/api/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/api/users/${id}`);

export default api;
