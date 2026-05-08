import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';

const IconDashboard = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>;
const IconSupplier = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconItem = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
const IconOrder = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const IconReport = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>;
const IconWarehouse = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3"/><path d="M4 21V10"/><path d="M20 21V10"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/></svg>;
const IconLogout = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role?.role_code || '';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, label, activeOnlyIndex = false }) => {
    const isActive = activeOnlyIndex 
      ? location.pathname === to 
      : location.pathname.startsWith(to);
    
    return (
      <Link to={to} className={`nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon"><Icon /></span>
        <span className="nav-text">{label}</span>
      </Link>
    );
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
          <div className="nav-group">
            <label>Utama</label>
            <NavItem to="/" icon={IconDashboard} label="Dashboard" activeOnlyIndex={true} />
            <NavItem to="/orders" icon={IconOrder} label="Orders" />
          </div>

          {(role === 'ADMIN' || role === 'MANAGER') && (
            <div className="nav-group">
              <label>Master Data</label>
              <NavItem to="/suppliers" icon={IconSupplier} label="Suppliers" />
              <NavItem to="/items" icon={IconItem} label="Items" />
              <NavItem to="/warehouses" icon={IconWarehouse} label="Warehouses" />
            </div>
          )}

          {(role === 'ADMIN' || role === 'MANAGER') && (
            <div className="nav-group">
              <label>Analisa</label>
              <NavItem to="/reports" icon={IconReport} label="Reports" />
            </div>
          )}
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