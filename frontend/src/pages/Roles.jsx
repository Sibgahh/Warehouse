import { useEffect, useState } from 'react';
import { createRole, deleteRole, getRoles, updateRole } from '../services/api';
import ModalDialog from '../components/ModalDialog';
import FeedbackModal from '../components/FeedbackModal';

const EMPTY = {
  role_code: '',
  role_name: '',
  is_active: true,
};

export default function Roles() {
  const [roles, setRoles] = useState([]);
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
    const { data } = await getRoles();
    setRoles(data.data || []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await refresh();
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat roles.');
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
    setFormError('');
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (role) => {
    setEditTarget(role);
    setFormError('');
    setForm({
      role_code: role.role_code || '',
      role_name: role.role_name || '',
      is_active: Boolean(role.is_active),
    });
    setShowForm(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!form.role_code.trim() || !form.role_name.trim()) {
      setFormError('Role code dan role name wajib diisi.');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        role_code: form.role_code.trim().toUpperCase(),
        role_name: form.role_name.trim(),
        is_active: form.is_active,
      };
      if (editTarget) {
        await updateRole(editTarget.role_id, payload);
        flash('Role berhasil diperbarui.', 'success');
      } else {
        await createRole(payload);
        flash('Role berhasil ditambahkan.', 'success');
      }
      setShowForm(false);
      await refresh();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menyimpan role.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRole(deleteTarget.role_id);
      flash('Role berhasil dihapus.', 'success');
      await refresh();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menghapus role.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Roles</h1>
          <p className="page-subtitle">Kelola master role pengguna</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Tambah Role</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="table-loading"><span className="spinner large" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Role Code</th>
                  <th>Role Name</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role, i) => (
                  <tr key={role.role_id}>
                    <td>{i + 1}</td>
                    <td>{role.role_code}</td>
                    <td className="text-bold">{role.role_name}</td>
                    <td>{role.is_active ? 'Aktif' : 'Nonaktif'}</td>
                    <td className="cell-actions">
                      <button className="btn-icon btn-edit" onClick={() => openEdit(role)} title="Edit">✎</button>
                      <button className="btn-icon btn-delete" onClick={() => setDeleteTarget(role)} title="Hapus">✕</button>
                    </td>
                  </tr>
                ))}
                {roles.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20 }}>Belum ada role.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editTarget ? 'Edit Role' : 'Tambah Role'}</h2>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={submitForm} className="form-grid">
              <div className="form-group">
                <label>Role Code *</label>
                <input value={form.role_code} onChange={(e) => setForm((p) => ({ ...p, role_code: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Role Name *</label>
                <input value={form.role_name} onChange={(e) => setForm((p) => ({ ...p, role_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="check-card">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
                  <span>Aktif</span>
                </label>
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
        title="Hapus Role"
        message={`Yakin ingin menghapus role "${deleteTarget?.role_name}"?`}
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
