import { useEffect, useState } from 'react';
import { createStore, deleteStore, getStores, updateStore } from '../services/api';
import ModalDialog from '../components/ModalDialog';

const EMPTY = {
  store_code: '',
  store_name: '',
  email: '',
  phone_number: '',
  city: '',
  regency: '',
  address: '',
  status: 'A',
};

export default function Stores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const refresh = async () => {
    const { data } = await getStores();
    setStores(data.data || []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await refresh();
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat stores.');
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
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (store) => {
    setEditTarget(store);
    setForm({
      store_code: store.store_code || '',
      store_name: store.store_name || '',
      email: store.email || '',
      phone_number: store.phone_number || '',
      city: store.city || '',
      regency: store.regency || '',
      address: store.address || '',
      status: store.status || 'A',
    });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.store_code.trim() || !form.store_name.trim()) {
      flash('Kode dan nama store wajib diisi.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, store_code: form.store_code.trim(), store_name: form.store_name.trim() };
      if (editTarget) {
        await updateStore(editTarget.store_id, payload);
        flash('Store berhasil diperbarui.', 'success');
      } else {
        await createStore(payload);
        flash('Store berhasil ditambahkan.', 'success');
      }
      setShowForm(false);
      await refresh();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menyimpan store.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStore(deleteTarget.store_id);
      flash('Store berhasil dihapus.', 'success');
      await refresh();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menghapus store.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Stores</h1>
          <p className="page-subtitle">Kelola data toko</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Tambah Store</button>
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
                  <th>Nama</th>
                  <th>Kota</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((s, i) => (
                  <tr key={s.store_id}>
                    <td>{i + 1}</td>
                    <td>{s.store_code}</td>
                    <td className="text-bold">{s.store_name}</td>
                    <td>{s.city || '-'}</td>
                    <td>{s.status === 'A' ? 'Aktif' : 'Close'}</td>
                    <td className="cell-actions">
                      <button className="btn-icon btn-edit" onClick={() => openEdit(s)} title="Edit">✎</button>
                      <button className="btn-icon btn-delete" onClick={() => setDeleteTarget(s)} title="Hapus">✕</button>
                    </td>
                  </tr>
                ))}
                {stores.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>Belum ada store.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editTarget ? 'Edit Store' : 'Tambah Store'}</h2>
            <form onSubmit={submit} className="form-grid">
              <div className="form-group"><label>Kode *</label><input value={form.store_code} onChange={(e) => setForm((p) => ({ ...p, store_code: e.target.value }))} /></div>
              <div className="form-group"><label>Nama *</label><input value={form.store_name} onChange={(e) => setForm((p) => ({ ...p, store_name: e.target.value }))} /></div>
              <div className="form-group"><label>Email</label><input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
              <div className="form-group"><label>Telepon</label><input value={form.phone_number} onChange={(e) => setForm((p) => ({ ...p, phone_number: e.target.value }))} /></div>
              <div className="form-group"><label>Kota</label><input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></div>
              <div className="form-group"><label>Kabupaten</label><input value={form.regency} onChange={(e) => setForm((p) => ({ ...p, regency: e.target.value }))} /></div>
              <div className="form-group span-full"><label>Alamat</label><textarea value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} rows={3} /></div>
              <div className="form-group"><label>Status</label><select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><option value="A">Aktif</option><option value="C">Close</option></select></div>
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
        title="Hapus Store"
        message={`Yakin ingin menghapus store "${deleteTarget?.store_name}"?`}
        showCancel={true}
        confirmText="Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
