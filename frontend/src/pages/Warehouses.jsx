import { useEffect, useState } from 'react';
import { createWarehouse, deleteWarehouse, getWarehouses, updateWarehouse } from '../services/api';
import ModalDialog from '../components/ModalDialog';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    warehouse_code: '',
    warehouse_name: '',
    email: '',
    phone_number: '',
    city: '',
    regency: '',
    address: '',
    status: 'A',
  });

  const refresh = async () => {
    const res = await getWarehouses();
    setWarehouses(res.data.data || []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await refresh();
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat daftar warehouse.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const flash = (msg, type = 'error') => {
    if (type === 'success') {
      setSuccess(msg);
      setError('');
      setTimeout(() => setSuccess(''), 2500);
    } else {
      setError(msg);
      setSuccess('');
    }
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm({
      warehouse_code: '',
      warehouse_name: '',
      email: '',
      phone_number: '',
      city: '',
      regency: '',
      address: '',
      status: 'A',
    });
    setShowForm(true);
  };

  const openEdit = (warehouse) => {
    setEditTarget(warehouse);
    setForm({
      warehouse_code: warehouse.warehouse_code || '',
      warehouse_name: warehouse.warehouse_name || '',
      email: warehouse.email || '',
      phone_number: warehouse.phone_number || '',
      city: warehouse.city || '',
      regency: warehouse.regency || '',
      address: warehouse.address || '',
      status: warehouse.status || 'A',
    });
    setShowForm(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!form.warehouse_code.trim()) {
      flash('Kode warehouse wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        warehouse_code: form.warehouse_code.trim(),
        warehouse_name: form.warehouse_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim(),
        city: form.city.trim(),
        regency: form.regency.trim(),
        address: form.address.trim(),
        status: form.status,
      };

      if (editTarget) {
        await updateWarehouse(editTarget.warehouse_id, payload);
        flash('Warehouse berhasil diperbarui.', 'success');
      } else {
        await createWarehouse(payload);
        flash('Warehouse berhasil ditambahkan.', 'success');
      }

      setShowForm(false);
      await refresh();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menyimpan warehouse.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteWarehouse(deleteTarget.warehouse_id);
      flash('Warehouse berhasil dihapus.', 'success');
      await refresh();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menghapus warehouse.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Warehouses</h1>
          <p className="page-subtitle">Kelola lokasi gudang penyimpanan</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Tambah Warehouse</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        {loading ? (
          <div className="table-loading"><span className="spinner large" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Kode</th>
                  <th>Nama Gudang</th>
                  <th>Kota</th>
                  <th>Alamat</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((w, i) => (
                  <tr key={w.warehouse_id}>
                    <td>{i + 1}</td>
                    <td>{w.warehouse_code}</td>
                    <td className="text-bold">{w.warehouse_name}</td>
                    <td>{w.city || '—'}</td>
                    <td>{w.address || '—'}</td>
                    <td>
                      <span className={`badge ${w.status === 'A' ? 'success' : 'error'}`}>
                        {w.status === 'A' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="cell-actions">
                      <button className="btn-icon btn-edit" onClick={() => openEdit(w)} title="Edit">✎</button>
                      <button className="btn-icon btn-delete" onClick={() => setDeleteTarget(w)} title="Hapus">✕</button>
                    </td>
                  </tr>
                ))}
                {warehouses.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Belum ada data gudang.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editTarget ? 'Edit Warehouse' : 'Tambah Warehouse'}</h2>
            <form onSubmit={submitForm} className="form-grid">
              <div className="form-group">
                <label>Kode *</label>
                <input value={form.warehouse_code} onChange={(e) => setForm((p) => ({ ...p, warehouse_code: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Nama</label>
                <input value={form.warehouse_name} onChange={(e) => setForm((p) => ({ ...p, warehouse_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Telepon</label>
                <input value={form.phone_number} onChange={(e) => setForm((p) => ({ ...p, phone_number: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Kota</label>
                <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Kabupaten</label>
                <input value={form.regency} onChange={(e) => setForm((p) => ({ ...p, regency: e.target.value }))} />
              </div>
              <div className="form-group span-full">
                <label>Alamat</label>
                <textarea rows={3} value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="A">Active</option>
                  <option value="C">Inactive</option>
                </select>
              </div>
              <div className="form-actions span-full">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)} disabled={submitting}>Batal</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ModalDialog
        open={Boolean(deleteTarget)}
        title="Hapus Warehouse"
        message={`Yakin ingin menghapus warehouse "${deleteTarget?.warehouse_name || deleteTarget?.warehouse_code}"?`}
        showCancel={true}
        confirmText="Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
