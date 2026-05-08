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
import { getRoleFromToken } from './utils/token.js';

// ── Auth guard ─────────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// ── Redirect authenticated users away from login ───────────────────────────────
function GuestOnly({ children }) {
  const token = localStorage.getItem('token');
  if (token) return <Navigate to="/" replace />;
  return children;
}

// ── ADMIN-only guard for Register page ─────────────────────────────────────────
// Non-ADMIN users yang mencoba akses /register akan di-redirect ke /
// ADMIN dapat mengakses halaman register untuk mendaftarkan Staff
// SECURITY: role_code dibaca dari JWT token, BUKAN dari localStorage.
function AdminOnly({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  // Decode role_code langsung dari token (tidak dari localStorage user object)
  const roleCode = getRoleFromToken();
  if (roleCode !== 'ADMIN') return <Navigate to="/" replace />;

  return children;
}

// ── App ───────────────────────────────────────────────────────────────────────
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
            <AdminOnly>
              <Register />
            </AdminOnly>
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
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
