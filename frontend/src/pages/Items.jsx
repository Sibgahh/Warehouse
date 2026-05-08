import { useState, useEffect, useCallback } from 'react';
import { getItems, createItem, updateItem, deleteItem, getSuppliers } from '../services/api';
import ModalDialog from '../components/ModalDialog';

const STATUS_OPTIONS = [
  { value: 'A', label: 'Active' },
  { value: 'I', label: 'Inactive' },
  { value: 'C', label: 'Closed' },
];
const STATUS_COLORS = { A: '#16a34a', I: '#d97706', C: '#6b7280' };
const NUMERIC_FIELDS = new Set([
  'std_qty',
  'min_stock',
  'max_stock',
  'unit_cost',
  'unit_retail',
]);
const NUMERIC_PATTERN = /^\d*\.?\d*$/;

function fmt(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || '#6b7280';
  return (
    <span style={{ color: c, fontWeight: 700, fontSize: '12px' }}>
      {status === 'A' ? 'Active' : status === 'I' ? 'Inactive' : 'Closed'}
    </span>
  );
}

function ItemForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial || {
    item_name: '', description: '', status: 'A',
    std_qty: '', min_stock: '', max_stock: '', unit_cost: '', unit_retail: '', supplier_id: '',
  });
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    getSuppliers({ limit: 100 })
      .then(({ data }) => {
        if (!ignore) {
          const list = data.data || [];
          setSuppliers(list);
          if (!form.supplier_id && list.length > 0) {
            setForm((f) => ({ ...f, supplier_id: String(list[0].supplier_id) }));
          }
        }
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, [form.supplier_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (NUMERIC_FIELDS.has(name)) {
      if (value.includes(',')) {
        setError('Gunakan titik (.) untuk desimal, bukan koma (,).');
        return;
      }
      if (!NUMERIC_PATTERN.test(value)) {
        setError('Field numerik hanya boleh berisi angka.');
        return;
      }
    }
    setForm((f) => ({ ...f, [name]: value }));
    setError('');
  };

  const handleNumericKeyDown = (e) => {
    if ([',', 'e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.item_name.trim()) { setError('Nama item wajib diisi.'); return; }
    if (form.item_name.length > 12) { setError('Nama item maksimal 12 karakter.'); return; }
    if (!form.description.trim()) { setError('Deskripsi wajib diisi.'); return; }
    if (
      !String(form.std_qty).trim() ||
      !String(form.max_stock).trim() ||
      !String(form.unit_cost).trim() ||
      !String(form.unit_retail).trim()
    ) {
      setError('Semua field numerik wajib diisi.'); return;
    }
    const std_qty = Number(form.std_qty);
    const max_stock = Number(form.max_stock);
    const unit_cost = Number(form.unit_cost);
    const unit_retail = Number(form.unit_retail);
    const min_stock = form.min_stock === '' ? 0 : Number(form.min_stock);
    if (isNaN(std_qty) || isNaN(max_stock) || isNaN(unit_cost) || isNaN(unit_retail) || isNaN(min_stock)) {
      setError('Semua field numerik wajib diisi.'); return;
    }
    if (!String(form.supplier_id).trim()) { setError('Supplier wajib dipilih.'); return; }
    onSubmit({
      ...form,
      item_name: form.item_name.trim(),
      description: form.description.trim(),
      // Backend Zod schema expects strings, then transforms there.
      std_qty: String(form.std_qty).trim(),
      min_stock: String(form.min_stock === '' ? 0 : form.min_stock).trim(),
      max_stock: String(form.max_stock).trim(),
      unit_cost: String(form.unit_cost).trim(),
      unit_retail: String(form.unit_retail).trim(),
      supplier_id: String(form.supplier_id).trim(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>{initial?.item_id ? 'Edit Item' : 'Tambah Item'}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label>Kode Item * (max 12)</label>
              <input name="item_name" value={form.item_name} onChange={handleChange}
                placeholder="cth: BRG000001" maxLength={12} disabled={!!initial?.item_id || loading} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange} disabled={loading}>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group span-full">
              <label>Deskripsi *</label>
              <input name="description" value={form.description} onChange={handleChange}
                placeholder="cth: Sabun cair mandi 500ml" disabled={loading} />
            </div>
            <div className="form-group">
              <label>Std Qty</label>
              <input
                name="std_qty"
                type="text"
                inputMode="decimal"
                value={form.std_qty}
                onChange={handleChange}
                onKeyDown={handleNumericKeyDown}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Min Stock</label>
              <input
                name="min_stock"
                type="text"
                inputMode="decimal"
                value={form.min_stock}
                onChange={handleChange}
                onKeyDown={handleNumericKeyDown}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Max Stock *</label>
              <input
                name="max_stock"
                type="text"
                inputMode="decimal"
                value={form.max_stock}
                onChange={handleChange}
                onKeyDown={handleNumericKeyDown}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Harga Beli (Cost) *</label>
              <input
                name="unit_cost"
                type="text"
                inputMode="numeric"
                value={form.unit_cost}
                onChange={handleChange}
                onKeyDown={handleNumericKeyDown}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Harga Jual (Retail) *</label>
              <input
                name="unit_retail"
                type="text"
                inputMode="numeric"
                value={form.unit_retail}
                onChange={handleChange}
                onKeyDown={handleNumericKeyDown}
                disabled={loading}
              />
            </div>
            <div className="form-group span-full">
              <label>Supplier *</label>
              <select name="supplier_id" value={form.supplier_id} onChange={handleChange} disabled={loading}>
                {suppliers.map((s) => <option key={s.supplier_id} value={String(s.supplier_id)}>{s.supplier_name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>Batal</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Menyimpan...</> : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);

  const fetchItems = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await getItems({
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      setItems(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat items.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  // fetchItems used as event-handler too (onKeyDown, button), so keep stable via useCallback
  useEffect(() => { fetchItems(); }, [fetchItems]); // eslint-disable-line react-hooks/set-state-in-effect

  const flash = (msg, type = 'error') => {
    if (type === 'success') { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3000); }
    else { setError(msg); setSuccess(''); }
  };

  const handleFormSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (editTarget?.item_id) {
        await updateItem(editTarget.item_id, formData);
        flash('Item berhasil diperbarui.', 'success');
      } else {
        await createItem(formData);
        flash('Item berhasil ditambahkan.', 'success');
      }
      setShowForm(false); setEditTarget(null);
      fetchItems();
    } catch (err) {
      flash(err.response?.data?.message || 'Operasi gagal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditTarget({
      ...item,
      std_qty: String(item.std_qty),
      min_stock: String(item.min_stock),
      max_stock: String(item.max_stock),
      unit_cost: String(item.unit_cost),
      unit_retail: String(item.unit_retail),
      supplier_id: String(item.supplier_id),
    });
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    setDeleteTarget(item);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem(deleteTarget.item_id);
      flash('Item berhasil dihapus.', 'success');
      fetchItems();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menghapus item.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role?.role_code || '';
  const isAdmin = role === 'ADMIN';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Items</h1>
          <p className="page-subtitle">{total} item</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Tambah Item</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="filters-row">
        <div className="search-group">
          <span className="search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input type="text" placeholder="Cari nama atau deskripsi item..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchItems()} className="filter-input" />
        </div>
        
        <div className="filter-group">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
            <option value="">Semua Status</option>
            <option value="A">Active</option>
            <option value="I">Inactive</option>
            <option value="C">Closed</option>
          </select>
        </div>

        <button className="btn-search" onClick={fetchItems}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          Cari
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="table-loading"><span className="spinner large" /><p>Memuat...</p></div>
        ) : items.length === 0 ? (
          <div className="table-empty"><p>Belum ada item.</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Kode</th>
                  <th>Deskripsi</th>
                  <th>Status</th>
                  <th>Supplier</th>
                  <th>Stock</th>
                  <th>Cost</th>
                  <th>Retail</th>
                  <th>Min</th>
                  <th>Max</th>
                  {isAdmin && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={it.item_id}>
                    <td>{i + 1}</td>
                    <td className="text-bold">{it.item_name}</td>
                    <td className="cell-address">{it.description}</td>
                    <td><StatusBadge status={it.status} /></td>
                    <td>{it.supplier?.supplier_name || '—'}</td>
                    <td className="text-bold" style={{ color: Number(it.inventory?.on_hand_qty) <= Number(it.min_stock) ? 'var(--error)' : 'inherit' }}>
                      {Number(it.inventory?.on_hand_qty || 0).toFixed(0)}
                    </td>
                    <td>{fmt(Number(it.unit_cost))}</td>
                    <td>{fmt(Number(it.unit_retail))}</td>
                    <td>{Number(it.min_stock).toFixed(0)}</td>
                    <td>{Number(it.max_stock).toFixed(0)}</td>
                    {isAdmin && (
                      <td className="cell-actions">
                        <button className="btn-icon btn-edit" onClick={() => handleEdit(it)} title="Edit">✎</button>
                        <button className="btn-icon btn-delete" onClick={() => handleDelete(it)} title="Hapus">✕</button>
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
        <ItemForm
          initial={editTarget}
          onSubmit={handleFormSubmit}
          onCancel={() => { setShowForm(false); setEditTarget(null); }}
          loading={submitting}
        />
      )}
      <ModalDialog
        open={Boolean(deleteTarget)}
        title="Hapus Item"
        message={`Yakin ingin menghapus item "${deleteTarget?.item_name}"?`}
        showCancel={true}
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
