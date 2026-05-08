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
    const requestUrl = String(error.config?.url || '');
    const isLoginRequest = requestUrl.includes('/api/auth/login');

    // Jangan redirect saat login gagal, biar pesan error tetap terlihat di form
    if (error.response?.status === 401 && !isLoginRequest) {
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

export const registerPublic = (data) =>
  api.post('/api/auth/register-public', data);
export const getMyMenus = () => api.get('/api/auth/my-menus');

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
export const deleteOrder = (id) => api.delete(`/api/orders/${id}`);
export const getOrderDetails = (params) => api.get('/api/order-details', { params });
export const createOrderDetail = (data) => api.post('/api/order-details', data);
export const updateOrderDetail = (id, data) => api.put(`/api/order-details/${id}`, data);
export const deleteOrderDetail = (id) => api.delete(`/api/order-details/${id}`);

// ── Reports ──────────────────────────────────────────────────────────────────
export const getReportSummary = () => api.get('/api/reports/summary');
export const getReportOrdersPerSupplier = (params) => api.get('/api/reports/orders-per-supplier', { params });
export const getReportQtyPerItem = (params) => api.get('/api/reports/qty-per-item', { params });

// ── Warehouses ───────────────────────────────────────────────────────────────
export const getWarehouses = () => api.get('/api/warehouses');
export const createWarehouse = (data) => api.post('/api/warehouses', data);
export const updateWarehouse = (id, data) => api.put(`/api/warehouses/${id}`, data);
export const deleteWarehouse = (id) => api.delete(`/api/warehouses/${id}`);

// ── Stores ──────────────────────────────────────────────────────────────────
export const getStores = (params) => api.get('/api/stores', { params });
export const getStore = (id) => api.get(`/api/stores/${id}`);
export const createStore = (data) => api.post('/api/stores', data);
export const updateStore = (id, data) => api.put(`/api/stores/${id}`, data);
export const deleteStore = (id) => api.delete(`/api/stores/${id}`);

// ── Users ───────────────────────────────────────────────────────────────────
export const getUsers = (params) => api.get('/api/users', { params });
export const getUser = (id) => api.get(`/api/users/${id}`);
export const updateUser = (id, data) => api.put(`/api/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/api/users/${id}`);

// ── Roles ───────────────────────────────────────────────────────────────────
export const getRoles = () => api.get('/api/roles');
export const createRole = (data) => api.post('/api/roles', data);
export const updateRole = (id, data) => api.put(`/api/roles/${id}`, data);
export const deleteRole = (id) => api.delete(`/api/roles/${id}`);

// ── Menus ───────────────────────────────────────────────────────────────────
export const getMenus = (params) => api.get('/api/menus', { params });
export const getMenu = (id) => api.get(`/api/menus/${id}`);
export const createMenu = (data) => api.post('/api/menus', data);
export const updateMenu = (id, data) => api.put(`/api/menus/${id}`, data);
export const deleteMenu = (id) => api.delete(`/api/menus/${id}`);

// ── Submenus ────────────────────────────────────────────────────────────────
export const getSubmenus = (params) => api.get('/api/submenus', { params });
export const getSubmenu = (id) => api.get(`/api/submenus/${id}`);
export const createSubmenu = (data) => api.post('/api/submenus', data);
export const updateSubmenu = (id, data) => api.put(`/api/submenus/${id}`, data);
export const deleteSubmenu = (id) => api.delete(`/api/submenus/${id}`);

// ── Role Menus ──────────────────────────────────────────────────────────────
export const getRoleMenus = () => api.get('/api/role-menus');
export const getRoleMenusByRole = (roleId) => api.get(`/api/role-menus/by-role/${roleId}`);
export const createRoleMenu = (data) => api.post('/api/role-menus', data);
export const deleteRoleMenu = (id) => api.delete(`/api/role-menus/${id}`);

// ── Role Submenus ───────────────────────────────────────────────────────────
export const getRoleSubmenus = () => api.get('/api/role-submenus');
export const createRoleSubmenu = (data) => api.post('/api/role-submenus', data);
export const deleteRoleSubmenu = (id) => api.delete(`/api/role-submenus/${id}`);

// ── Order Statuses ──────────────────────────────────────────────────────────
export const getOrderStatuses = () => api.get('/api/order-statuses');
export const createOrderStatus = (data) => api.post('/api/order-statuses', data);
export const updateOrderStatus = (id, data) => api.put(`/api/order-statuses/${id}`, data);
export const deleteOrderStatus = (id) => api.delete(`/api/order-statuses/${id}`);

// ── Inventory ───────────────────────────────────────────────────────────────
export const getInventory = (params) => api.get('/api/inventory', { params });
export const createInventory = (data) => api.post('/api/inventory', data);
export const updateInventory = (id, data) => api.put(`/api/inventory/${id}`, data);
export const deleteInventory = (id) => api.delete(`/api/inventory/${id}`);

export default api;
