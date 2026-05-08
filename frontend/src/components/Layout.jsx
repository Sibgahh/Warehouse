import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { getMyMenus, logout } from '../services/api';
import { getRoleFromToken } from '../utils/token.js';

// ── Icon primitives (stable at module scope — never re-created) ──────────────
const IconDashboard = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>;
const IconSupplier   = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconItem       = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
const IconOrder      = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const IconReport     = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>;
const IconWarehouse  = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3"/><path d="M4 21V10"/><path d="M20 21V10"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/></svg>;
const IconSettings   = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-1.94 1.52l-.16.69a2 2 0 0 1-1.32 1.42l-.65.23a2 2 0 0 1-1.86-.24l-.58-.35a2 2 0 0 0-2.43.31l-.31.31a2 2 0 0 0-.31 2.43l.35.58a2 2 0 0 1 .24 1.86l-.23.65a2 2 0 0 1-1.42 1.32l-.69.16A2 2 0 0 0 2 11.78v.44a2 2 0 0 0 1.52 1.94l.69.16a2 2 0 0 1 1.42 1.32l.23.65a2 2 0 0 1-.24 1.86l-.35.58a2 2 0 0 0 .31 2.43l.31.31a2 2 0 0 0 2.43.31l.58-.35a2 2 0 0 1 1.86-.24l.65.23a2 2 0 0 1 1.32 1.42l.16.69A2 2 0 0 0 11.78 22h.44a2 2 0 0 0 1.94-1.52l.16-.69a2 2 0 0 1 1.32-1.42l.65-.23a2 2 0 0 1 1.86.24l.58.35a2 2 0 0 0 2.43-.31l.31-.31a2 2 0 0 0 .31-2.43l-.35-.58a2 2 0 0 1-.24-1.86l.23-.65a2 2 0 0 1 1.42-1.32l.69-.16A2 2 0 0 0 22 12.22v-.44a2 2 0 0 0-1.52-1.94l-.69-.16a2 2 0 0 1-1.42-1.32l-.23-.65a2 2 0 0 1 .24-1.86l.35-.58a2 2 0 0 0-.31-2.43l-.31-.31a2 2 0 0 0-2.43-.31l-.58.35a2 2 0 0 1-1.86.24l-.65-.23a2 2 0 0 1-1.32-1.42l-.16-.69A2 2 0 0 0 12.22 2z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconLogout     = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
const IconDefault    = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/></svg>;

const ICON_BY_KEY = {
  dashboard: IconDashboard,
  supplier: IconSupplier,
  suppliers: IconSupplier,
  item: IconItem,
  items: IconItem,
  order: IconOrder,
  orders: IconOrder,
  report: IconReport,
  reports: IconReport,
  setting: IconSettings,
  settings: IconSettings,
  config: IconSettings,
  warehouse: IconWarehouse,
  warehouses: IconWarehouse,
  user: IconSupplier,
  users: IconSupplier,
};

function resolveIcon(menuIcon, path = '') {
  const key = String(menuIcon || path || '').toLowerCase();
  for (const mapKey of Object.keys(ICON_BY_KEY)) {
    if (key.includes(mapKey)) return ICON_BY_KEY[mapKey];
  }
  return IconDefault;
}

// ── NavItem — hoisted to module scope so it is NOT re-created every render ─────
// `location` is passed as a prop so this component stays at module scope.
function NavItem({ to, icon: Icon, label, activeOnlyIndex = false, locationPathname = '' }) {
  const isActive = activeOnlyIndex
    ? locationPathname === to
    : locationPathname.startsWith(to);

  return (
    <Link to={to} className={`nav-item ${isActive ? 'active' : ''}`}>
      <span className="nav-icon"><Icon /></span>
      <span className="nav-text">{label}</span>
    </Link>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  // SECURITY: role dibaca dari JWT token, bukan dari localStorage object
  const role = getRoleFromToken() || '';
  const [menus, setMenus] = useState([]);
  const visibleMenus = menus.filter((menu) => menu.menu_link !== '/');

  useEffect(() => {
    let cancelled = false;
    const loadMenus = async () => {
      try {
        const { data } = await getMyMenus();
        if (!cancelled) setMenus(data?.data || []);
      } catch {
        if (!cancelled) setMenus([]);
      }
    };
    loadMenus();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    try {
      await logout(); // Panggil backend untuk reset is_login = false
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <div className="app-shell sidebar-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="nav-brand">
            <Link to="/">Warehouse Hypermart</Link>
          </div>
          {user && (
            <div className="user-profile">
              <div className="user-avatar">{user.full_name?.charAt(0)}</div>
              <div className="user-info">
                <span className="user-name">{user.full_name}</span>
                <span className="user-role-badge">{role}</span>
              </div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {visibleMenus.map((menu) => (
            <div className="nav-group" key={menu.menu_id}>
              {menu.submenus?.length > 0 ? (
                <>
                  <label>{menu.menu_name}</label>
                  {menu.submenus.map((submenu) => (
                    <NavItem
                      key={submenu.submenu_id}
                      to={submenu.submenu_link || '#'}
                      icon={resolveIcon(submenu.submenu_icon, submenu.submenu_link)}
                      label={submenu.submenu_name}
                      locationPathname={location.pathname}
                    />
                  ))}
                </>
              ) : (
                <NavItem
                  to={menu.menu_link || '#'}
                  icon={resolveIcon(menu.menu_icon, menu.menu_link)}
                  label={menu.menu_name}
                  activeOnlyIndex={menu.menu_link === '/'}
                  locationPathname={location.pathname}
                />
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout-sidebar" onClick={handleLogout}>
            <IconLogout />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}