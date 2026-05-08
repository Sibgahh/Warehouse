import { useState, useEffect, useCallback } from 'react';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../services/api';
import ModalDialog from '../components/ModalDialog';

// ── Generate supplier code ─────────────────────────────────────────────────────
function generateSupplierCode() {
  const num = Math.floor(100 + Math.random() * 900); // 100–999
  return `SUP${num}`;
}

// ── Inline Form Component ──────────────────────────────────────────────────────
function SupplierForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(
    initial || {
      supplier_code: generateSupplierCode(),
      supplier_name: '',
      email: '',
      phone_number: '',
      city: '',
      regency: '',
      address: '',
    }
  );
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.supplier_code.trim() || !form.supplier_name.trim()) {
      setError('Kode dan Nama Supplier wajib diisi.');
      return;
    }
    if (form.supplier_code.length > 10) {
      setError('Kode supplier maksimal 10 karakter.');
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>{initial?.supplier_id ? 'Edit Supplier' : 'Tambah Supplier'}</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form-grid" noValidate>
          <div className="form-group">
            <label htmlFor="supplier_code">Kode Supplier *</label>
            <input
              id="supplier_code"
              name="supplier_code"
              value={form.supplier_code}
              onChange={handleChange}
              placeholder="cth: SUP001"
              maxLength={10}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="supplier_name">Nama Supplier *</label>
            <input
              id="supplier_name"
              name="supplier_name"
              value={form.supplier_name}
              onChange={handleChange}
              placeholder="cth: PT Maju Mundur"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@contoh.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone_number">No. Telepon</label>
            <input
              id="phone_number"
              name="phone_number"
              type="tel"
              value={form.phone_number}
              onChange={handleChange}
              placeholder="cth: 021-123456"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="city">Kota</label>
            <input
              id="city"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="cth: Jakarta"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="regency">Kabupaten</label>
            <input
              id="regency"
              name="regency"
              value={form.regency}
              onChange={handleChange}
              placeholder="cth: Bandung"
              disabled={loading}
            />
          </div>

          <div className="form-group span-full">
            <label htmlFor="address">Alamat</label>
            <textarea
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Alamat lengkap supplier"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="form-actions span-full">
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <><span className="spinner" aria-hidden="true" /> Menyimpan...</>
              ) : (
                'Simpan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────────
export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getSuppliers({ search });
      setSuppliers(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data supplier.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchSuppliers(); }, []); // eslint-disable-line react-hooks/set-state-in-effect,react-hooks/exhaustive-deps

  // ── Flash message helper ───────────────────────────────────────────────────
  const flash = (msg, type = 'error') => {
    if (type === 'success') {
      setSuccess(msg);
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(msg);
      setSuccess('');
    }
  };

  // ── Create / Update ────────────────────────────────────────────────────────
  const handleFormSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editTarget?.supplier_id) {
        await updateSupplier(editTarget.supplier_id, formData);
        flash('Supplier berhasil diperbarui.', 'success');
      } else {
        await createSupplier(formData);
        flash('Supplier berhasil ditambahkan.', 'success');
      }
      setShowForm(false);
      setEditTarget(null);
      fetchSuppliers();
    } catch (err) {
      flash(err.response?.data?.message || 'Operasi gagal. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEdit = (supplier) => {
    setEditTarget(supplier);
    setShowForm(true);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (supplier) => {
    setDeleteTarget(supplier);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSupplier(deleteTarget.supplier_id);
      flash('Supplier berhasil dihapus.', 'success');
      fetchSuppliers();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menghapus supplier.');
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Cancel form ────────────────────────────────────────────────────────────
  const handleCancelForm = () => {
    setShowForm(false);
    setEditTarget(null);
  };

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role?.role_code || '';
  const isAdmin = role === 'ADMIN';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Suppliers</h1>
          <p className="page-subtitle">Kelola data supplier</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Tambah Supplier
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}

      <div className="filters-row">
        <div className="search-group">
          <span className="search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input type="text" placeholder="Cari nama, kode, atau kota supplier..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchSuppliers()} className="filter-input" />
        </div>
        <button className="btn-search" onClick={fetchSuppliers}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          Cari
        </button>
      </div>
      <div className="card">
        {loading ? (
          <div className="table-loading">
            <span className="spinner large" aria-hidden="true" />
            <p>Memuat data...</p>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="table-empty">
            <p>Belum ada data supplier.</p>
            {isAdmin && (
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                Tambah Supplier
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Kode</th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Telepon</th>
                  <th>Kota</th>
                  <th>Alamat</th>
                  {isAdmin && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, i) => (
                  <tr key={s.supplier_id}>
                    <td>{i + 1}</td>
                    <td className="text-bold">{s.supplier_code}</td>
                    <td>{s.supplier_name}</td>
                    <td>{s.email || '—'}</td>
                    <td>{s.phone_number || '—'}</td>
                    <td>{s.city || '—'}</td>
                    <td className="cell-address">{s.address || '—'}</td>
                    {isAdmin && (
                      <td className="cell-actions">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(s)}
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(s)}
                          title="Hapus"
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <SupplierForm
          initial={editTarget}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          loading={submitting}
        />
      )}
      <ModalDialog
        open={Boolean(deleteTarget)}
        title="Hapus Supplier"
        message={`Yakin ingin menghapus supplier "${deleteTarget?.supplier_name}"?`}
        showCancel={true}
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
