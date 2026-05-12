import { useEffect, useState } from 'react';
import { createOrderStatus, deleteOrderStatus, getOrderStatuses, updateOrderStatus } from '../services/api';
import ModalDialog from '../components/ModalDialog';
import FeedbackModal from '../components/FeedbackModal';

const EMPTY = { status_code: '', status_name: '' };

export default function OrderStatuses() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const refresh = async () => {
    const { data } = await getOrderStatuses();
    setRows(data.data || []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { await refresh(); } catch (err) { setError(err.response?.data?.message || 'Gagal memuat order statuses.'); }
      finally { setLoading(false); }
    })();
  }, []);

  const flash = (msg, type = 'error') => {
    if (type === 'success') {
      setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 2500);
    } else {
      setError(msg); setSuccess('');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.status_code.trim() || !form.status_name.trim()) {
      setFormError('Code dan nama status wajib diisi.');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const payload = { status_code: form.status_code.trim(), status_name: form.status_name.trim() };
      if (editTarget) {
        await updateOrderStatus(editTarget.order_status_id, payload);
        flash('Status berhasil diperbarui.', 'success');
      } else {
        await createOrderStatus(payload);
        flash('Status berhasil ditambahkan.', 'success');
      }
      setShowForm(false);
      await refresh();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menyimpan status.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteOrderStatus(deleteTarget.order_status_id);
      flash('Status berhasil dihapus.', 'success');
      await refresh();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menghapus status.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Order Statuses</h1>
          <p className="page-subtitle">Kelola master status order</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditTarget(null); setFormError(''); setForm(EMPTY); setShowForm(true); }}>+ Tambah Status</button>
      </div>
      <div className="card">
        {loading ? <div className="table-loading"><span className="spinner large" /></div> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>#</th><th>Code</th><th>Nama</th><th>Dipakai Order</th><th>Aksi</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.order_status_id}>
                    <td>{i + 1}</td>
                    <td>{r.status_code}</td>
                    <td className="text-bold">{r.status_name}</td>
                    <td>{r._count?.orders || 0}</td>
                    <td className="cell-actions">
                      <button className="btn-icon btn-edit" onClick={() => { setEditTarget(r); setFormError(''); setForm({ status_code: r.status_code, status_name: r.status_name }); setShowForm(true); }}>✎</button>
                      <button className="btn-icon btn-delete" onClick={() => setDeleteTarget(r)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editTarget ? 'Edit Order Status' : 'Tambah Order Status'}</h2>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={submit} className="form-grid">
              <div className="form-group"><label>Status Code *</label><input value={form.status_code} onChange={(e) => setForm((p) => ({ ...p, status_code: e.target.value }))} /></div>
              <div className="form-group"><label>Status Name *</label><input value={form.status_name} onChange={(e) => setForm((p) => ({ ...p, status_name: e.target.value }))} /></div>
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
        title="Hapus Order Status"
        message={`Yakin ingin menghapus status "${deleteTarget?.status_name}"?`}
        showCancel={true}
        confirmText="Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <FeedbackModal open={!!error} type="error" message={error} onClose={() => setError('')} />
      <FeedbackModal open={!!success} type="success" message={success} onClose={() => setSuccess('')} />
    </div>
  );
}
