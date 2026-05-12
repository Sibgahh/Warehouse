import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Suppliers from './pages/Suppliers';
import Items from './pages/Items';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import Warehouses from './pages/Warehouses';
import Users from './pages/Users';
import Menus from './pages/Menus';
import Submenus from './pages/Submenus';
import RoleMenus from './pages/RoleMenus';
import RoleSubmenus from './pages/RoleSubmenus';
import Stores from './pages/Stores';
import OrderStatuses from './pages/OrderStatuses';
import Inventory from './pages/Inventory';
import Roles from './pages/Roles';
import AccessConfig from './pages/AccessConfig';
import { isTokenExpired } from './utils/token';

// ── Auth guard — redirect ke login kalau token absent ATAU expired ─────────────
function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
  return children;
}

// ── Redirect authenticated (dan non-expired) users away from login ─────────────
function GuestOnly({ children }) {
  const token = localStorage.getItem('token');
  if (token && !isTokenExpired(token)) return <Navigate to="/" replace />;
  return children;
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestOnly>
              <Login />
            </GuestOnly>
          }
        />
        <Route
          path="/register"
          element={
            <GuestOnly>
              <Register />
            </GuestOnly>
          }
        />

        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="items" element={<Items />} />
          <Route path="orders" element={<Orders />} />
          <Route path="reports" element={<Reports />} />
          <Route path="warehouses" element={<Warehouses />} />
          <Route path="users" element={<Users />} />
          <Route path="menus" element={<Menus />} />
          <Route path="submenus" element={<Submenus />} />
          <Route path="role-menus" element={<RoleMenus />} />
          <Route path="role-submenus" element={<RoleSubmenus />} />
          <Route path="stores" element={<Stores />} />
          <Route path="order-statuses" element={<OrderStatuses />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="roles" element={<Roles />} />
          <Route path="access-config" element={<AccessConfig />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
