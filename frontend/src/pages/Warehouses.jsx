import { useState, useEffect } from 'react';
import { getWarehouses } from '../services/api';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getWarehouses();
        setWarehouses(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Warehouses</h1>
          <p className="page-subtitle">Kelola lokasi gudang penyimpanan</p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="table-loading"><span className="spinner large" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Gudang</th>
                  <th>Alamat</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map(w => (
                  <tr key={w.warehouse_id}>
                    <td className="text-bold">{w.warehouse_name}</td>
                    <td>{w.address || '—'}</td>
                    <td>
                      <span className={`badge ${w.status === 'A' ? 'success' : 'error'}`}>
                        {w.status === 'A' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
                {warehouses.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>Belum ada data gudang.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
