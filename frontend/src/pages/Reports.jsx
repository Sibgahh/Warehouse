import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { getReportOrdersPerSupplier, getReportQtyPerItem } from '../services/api';
import ModalDialog from '../components/ModalDialog';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState({ start_date: '', end_date: '' });
  const [showInfoModal, setShowInfoModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = activeTab === 'suppliers'
        ? await getReportOrdersPerSupplier(dates)
        : await getReportQtyPerItem(dates);
      setData(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, dates]);

  const handleExport = () => {
    if (data.length === 0) {
      setShowInfoModal(true);
      return;
    }
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab === 'suppliers' ? 'Supplier Orders' : 'Item Quantities');
    
    const fileName = `Laporan_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/set-state-in-effect,react-hooks/exhaustive-deps

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Laporan</h1>
          <p className="page-subtitle">Analisa performa supplier dan stok barang.</p>
        </div>
        <button className="btn-secondary" onClick={handleExport} style={{ height: '42px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export Excel
        </button>
      </div>

      <div className="filters-row">
        <div className="filter-group">
          <label>Dari Tanggal</label>
          <input type="date" value={dates.start_date} onChange={(e) => setDates({ ...dates, start_date: e.target.value })} className="filter-input" />
        </div>
        <div className="filter-group">
          <label>Sampai Tanggal</label>
          <input type="date" value={dates.end_date} onChange={(e) => setDates({ ...dates, end_date: e.target.value })} className="filter-input" />
        </div>
        <button className="btn-search" onClick={fetchData}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          Filter Laporan
        </button>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border)' }}>
        <button 
          className={`tab-item ${activeTab === 'suppliers' ? 'active' : ''}`} 
          onClick={() => setActiveTab('suppliers')}
          style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'suppliers' ? '2px solid var(--accent)' : 'none', color: activeTab === 'suppliers' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600 }}
        >
          Order Per Supplier
        </button>
        <button 
          className={`tab-item ${activeTab === 'items' ? 'active' : ''}`} 
          onClick={() => setActiveTab('items')}
          style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === 'items' ? '2px solid var(--accent)' : 'none', color: activeTab === 'items' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600 }}
        >
          Qty Per Item
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="table-loading"><span className="spinner large" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              {activeTab === 'suppliers' ? (
                <>
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Total Order</th>
                      <th>Open</th>
                      <th>Received</th>
                      <th>Cancelled</th>
                      <th>Total Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((r) => (
                      <tr key={r.supplier_id}>
                        <td className="text-bold">{r.supplier_name}</td>
                        <td>{r.total_orders}</td>
                        <td>{r.orders_open}</td>
                        <td>{r.orders_received}</td>
                        <td>{r.orders_cancelled}</td>
                        <td className="text-bold">{r.total_qty_ordered}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Supplier</th>
                      <th>Total Orders</th>
                      <th>Qty Ordered</th>
                      <th>Qty Received</th>
                      <th>Value (Cost)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((r) => (
                      <tr key={r.item_id}>
                        <td className="text-bold">{r.item_name}</td>
                        <td>{r.supplier_name}</td>
                        <td>{r.total_orders}</td>
                        <td>{r.total_qty_ordered}</td>
                        <td>{r.total_qty_received}</td>
                        <td className="text-bold">Rp {new Intl.NumberFormat('id-ID').format(r.total_cost_value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          </div>
        )}
      </div>
      <ModalDialog
        open={showInfoModal}
        title="Export Laporan"
        message="Tidak ada data untuk di-export."
        confirmText="OK"
        onConfirm={() => setShowInfoModal(false)}
        onCancel={() => setShowInfoModal(false)}
      />
    </div>
  );
}
