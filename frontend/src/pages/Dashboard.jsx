import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getReportSummary, getOrders } from '../services/api';

const IconOrder = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m20.9 11-7.2-7.2a2 2 0 0 0-2.8 0L3.7 11.1a2 2 0 0 0 0 2.8l7.2 7.2a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8Z"/><path d="m7.3 14.5 4.7 4.7 4.7-4.7"/><path d="M12 19V5"/></svg>
);
const IconSupplier = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);
const IconItem = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
);
const IconWarehouse = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3"/><path d="M4 21V10"/><path d="M20 21V10"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/></svg>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const roleCode = user?.role?.role_code || '';
  const isAdminOrManager = roleCode === 'ADMIN' || roleCode === 'MANAGER';

  useEffect(() => {
    Promise.all([
      getReportSummary(),
      getOrders({ limit: 3 })
    ])
      .then(([summaryRes, ordersRes]) => {
        setData(summaryRes.data.data);
        setRecentOrders(ordersRes.data.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page dashboard">
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1>Halo, {user?.full_name?.split(' ')[0] || 'User'} 👋</h1>
          <p>Berikut adalah ringkasan performa gudang Anda hari ini.</p>
        </div>
        <div className="hero-date">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {loading ? (
        <div className="table-loading"><span className="spinner large" /></div>
      ) : (
        <>
          <div className={`stats-grid ${!isAdminOrManager ? 'compact' : ''}`}>
            <div className="stat-card" onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
              <div className="stat-header">
                <span className="stat-label">Total Orders</span>
                <div className="stat-icon" style={{ color: 'var(--accent)' }}><IconOrder /></div>
              </div>
              <span className="stat-value">{data?.total_orders || 0}</span>
              <span className="stat-link">View Orders →</span>
              <div className="stat-icon-bg"><IconOrder /></div>
            </div>

            {isAdminOrManager && (
              <div className="stat-card" onClick={() => navigate('/suppliers')} style={{ cursor: 'pointer' }}>
                <div className="stat-header">
                  <span className="stat-label">Active Suppliers</span>
                  <div className="stat-icon" style={{ color: 'var(--success)' }}><IconSupplier /></div>
                </div>
                <span className="stat-value">{data?.total_active_suppliers || 0}</span>
                <span className="stat-link">View Suppliers →</span>
                <div className="stat-icon-bg"><IconSupplier /></div>
              </div>
            )}

            <div className="stat-card" onClick={() => navigate('/items')} style={{ cursor: 'pointer' }}>
              <div className="stat-header">
                <span className="stat-label">Active Items</span>
                <div className="stat-icon" style={{ color: '#8b5cf6' }}><IconItem /></div>
              </div>
              <span className="stat-value">{data?.total_active_items || 0}</span>
              <span className="stat-link">View Inventory →</span>
              <div className="stat-icon-bg"><IconItem /></div>
            </div>

            {isAdminOrManager && (
              <div className="stat-card" onClick={() => navigate('/warehouses')} style={{ cursor: 'pointer' }}>
                <div className="stat-header">
                  <span className="stat-label">Warehouses</span>
                  <div className="stat-icon" style={{ color: '#f43f5e' }}><IconWarehouse /></div>
                </div>
                <span className="stat-value">{data?.total_active_warehouses || 0}</span>
                <span className="stat-link">Manage Warehouses →</span>
                <div className="stat-icon-bg"><IconWarehouse /></div>
              </div>
            )}
          </div>

          <div className="dashboard-row">
            <div className="dashboard-section recent-orders">
              <div className="section-header">
                <div className="header-text">
                  <h3>Transaksi Terbaru</h3>
                  <p>3 order pembelian terakhir</p>
                </div>
                <Link to="/orders" className="btn-text">Lihat Semua →</Link>
              </div>
              <div className="card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nomor PO</th>
                      <th>Supplier</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(o => (
                      <tr key={o.order_id}>
                        <td className="text-bold">{o.order_number}</td>
                        <td>{o.supplier?.supplier_name}</td>
                        <td>{new Date(o.created_at).toLocaleDateString('id-ID')}</td>
                        <td>
                          <span className={`badge ${
                            o.order_status?.status_name.toLowerCase().includes('open') ? 'accent' :
                            o.order_status?.status_name.toLowerCase().includes('received') ? 'success' :
                            o.order_status?.status_name.toLowerCase().includes('cancel') ? 'error' : 'warning'
                          }`}>
                            {o.order_status?.status_name}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {recentOrders.length === 0 && (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>Belum ada transaksi.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dashboard-section status-breakdown">
              <div className="section-header">
                <h3>Order Status</h3>
                <p>Status PO saat ini</p>
              </div>
              <div className="status-list">
                {data?.orders_by_status?.map((s) => (
                  <div key={s.status_name} className="status-item-compact">
                    <div className="status-indicator" style={{ 
                      background: s.status_name.toLowerCase().includes('open') ? 'var(--accent)' :
                                  s.status_name.toLowerCase().includes('received') ? 'var(--success)' :
                                  s.status_name.toLowerCase().includes('cancel') ? 'var(--error)' : 'var(--warning)'
                    }}></div>
                    <span className="status-label">{s.status_name}</span>
                    <span className="status-count">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
