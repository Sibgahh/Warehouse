import { useState, useEffect, useCallback } from 'react';
import { getOrders, createOrder, deleteOrder, getSuppliers, getItems, updateOrder, getOrderStatuses } from '../services/api';
import ModalDialog from '../components/ModalDialog';

const STATUS_LABELS = {
  '10': { label: 'Open', color: '#6b7280', bg: '#f3f4f6' },
  '20': { label: 'InTransit', color: '#d97706', bg: '#fef3c7' },
  '30': { label: 'Receiving', color: '#2563eb', bg: '#dbeafe' },
  '40': { label: 'Verified', color: '#16a34a', bg: '#dcfce7' },
  '50': { label: 'Cancelled', color: '#dc2626', bg: '#fee2e2' },
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ code }) {
  const s = STATUS_LABELS[code] || { label: code, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{ color: s.color, background: s.bg, padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

// ── Create Order Modal ────────────────────────────────────────────────────────
function CreateOrderModal({ onSubmit, onCancel, loading }) {
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    warehouse_id: '1',
    supplier_id: '',
    delivery_start_date: '',
    delivery_end_date: '',
    approval_id: '',
  });
  const [orderItems, setOrderItems] = useState([{ item_id: '', qty_ordered: '' }]);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const activeItems = items.filter((it) => it.status === 'A');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;

    Promise.all([getSuppliers({ limit: 100 }), getItems({ limit: 100 })])
      .then(([{ data: sData }, { data: iData }]) => {
        setSuppliers(sData.data || []);
        setItems(iData.data || []);
        setForm((f) => ({
          ...f,
          supplier_id: sData.data?.length > 0 ? String(sData.data[0].supplier_id) : '',
          approval_id: currentUser?.user_id ? String(currentUser.user_id) : '',
        }));
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleItemChange = (idx, field, val) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  const addItemRow = () => setOrderItems((p) => [...p, { item_id: '', qty_ordered: '' }]);
  const removeItemRow = (idx) => setOrderItems((p) => p.filter((_, i) => i !== idx));

  const handleSubmit = (e) => {
    e.preventDefault();
    const activeItemIds = new Set(activeItems.map((it) => String(it.item_id)));
    const validItems = orderItems.filter((r) => r.item_id && r.qty_ordered > 0 && activeItemIds.has(String(r.item_id)));
    if (!form.supplier_id || !form.delivery_start_date || !form.delivery_end_date || !form.approval_id) {
      setError('Semua field header wajib diisi.');
      return;
    }
    if (validItems.length === 0) {
      setError('Minimal pilih 1 item aktif.');
      return;
    }
    if (new Date(form.delivery_end_date) < new Date(form.delivery_start_date)) {
      setError('Delivery end date tidak boleh sebelum start date.');
      return;
    }
    onSubmit({
      ...form,
      supplier_id: form.supplier_id,
      approval_id: String(form.approval_id),
      items: validItems.map((r) => ({ item_id: String(r.item_id), qty_ordered: String(r.qty_ordered) })),
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>Buat Purchase Order</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {loadingData ? (
          <div className="table-loading"><span className="spinner large" /></div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="form-group">
                <label>Warehouse</label>
                <select className="po-select" name="warehouse_id" value={form.warehouse_id} onChange={handleChange}>
                  <option value="1">WH01 - Gudang Utama Jakarta</option>
                  <option value="2">WH02 - Gudang Surabaya</option>
                  <option value="3">WH03 - Gudang Bandung</option>
                </select>
              </div>
              <div className="form-group">
                <label>Supplier *</label>
                <select className="po-select" name="supplier_id" value={form.supplier_id} onChange={handleChange} required>
                  {suppliers.map((s) => (
                    <option key={s.supplier_id} value={String(s.supplier_id)}>
                      {s.supplier_code} - {s.supplier_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Delivery Start *</label>
                <input type="date" name="delivery_start_date" value={form.delivery_start_date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Delivery End *</label>
                <input type="date" name="delivery_end_date" value={form.delivery_end_date} onChange={handleChange} required />
              </div>
            </div>

            <div className="order-items-section">
              <div className="order-items-header">
                <span>Item</span>
                <span>Qty Ordered</span>
                <span></span>
              </div>
              {orderItems.map((row, idx) => (
                <div key={idx} className="order-item-row">
                  <select className="po-select" value={row.item_id} onChange={(e) => handleItemChange(idx, 'item_id', e.target.value)}>
                    <option value="">-- Pilih Item --</option>
                    {activeItems.map((it) => (
                      <option key={it.item_id} value={String(it.item_id)}>
                        {it.item_name} - {it.description?.slice(0, 30)}
                      </option>
                    ))}
                  </select>
                  <input className="po-input" type="number" min="1" placeholder="Qty" value={row.qty_ordered} onChange={(e) => handleItemChange(idx, 'qty_ordered', Number(e.target.value))} />
                  <button type="button" className="btn-icon btn-delete" onClick={() => removeItemRow(idx)}>✕</button>
                </div>
              ))}
              <button type="button" className="btn-secondary" onClick={addItemRow}>+ Tambah Item</button>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>Batal</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <><span className="spinner" /> Menyimpan...</> : 'Buat Order'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function EditOrderModal({ order, onSubmit, onCancel, loading }) {
  const [suppliers, setSuppliers] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [form, setForm] = useState({
    warehouse_id: String(order?.warehouse_id || 1),
    supplier_id: String(order?.supplier_id || ''),
    delivery_start_date: order?.delivery_start_date ? new Date(order.delivery_start_date).toISOString().slice(0, 10) : '',
    delivery_end_date: order?.delivery_end_date ? new Date(order.delivery_end_date).toISOString().slice(0, 10) : '',
    approval_id: String(order?.approval_id || ''),
    order_status_id: String(order?.order_status_id || ''),
  });
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getSuppliers({ limit: 100 }), getOrderStatuses()])
      .then(([{ data: sData }, { data: stData }]) => {
        setSuppliers(sData.data || []);
        setStatuses(stData.data || []);
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.supplier_id || !form.delivery_start_date || !form.delivery_end_date || !form.approval_id || !form.order_status_id) {
      setError('Semua field wajib diisi.');
      return;
    }
    if (new Date(form.delivery_end_date) < new Date(form.delivery_start_date)) {
      setError('Delivery end date tidak boleh sebelum start date.');
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Order {order?.order_number}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Warehouse</label>
            <select className="po-select" name="warehouse_id" value={form.warehouse_id} onChange={handleChange}>
              <option value="1">WH01 - Gudang Utama Jakarta</option>
              <option value="2">WH02 - Gudang Surabaya</option>
              <option value="3">WH03 - Gudang Bandung</option>
            </select>
          </div>
          <div className="form-group">
            <label>Supplier</label>
            <select className="po-select" name="supplier_id" value={form.supplier_id} onChange={handleChange}>
              {suppliers.map((s) => (
                <option key={s.supplier_id} value={String(s.supplier_id)}>
                  {s.supplier_code} - {s.supplier_name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Delivery Start</label>
            <input type="date" name="delivery_start_date" value={form.delivery_start_date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Delivery End</label>
            <input type="date" name="delivery_end_date" value={form.delivery_end_date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select className="po-select" name="order_status_id" value={form.order_status_id} onChange={handleChange}>
              {statuses.map((s) => (
                <option key={s.order_status_id} value={String(s.order_status_id)}>
                  {s.status_code} - {s.status_name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Approval ID</label>
            <input name="approval_id" value={form.approval_id} onChange={handleChange} />
          </div>
          <div className="form-actions span-full">
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>Batal</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  // Stable reference for event handlers (button, onChange)
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getOrders({
        ...(statusFilter && { status_code: statusFilter }),
        ...(search && { search }),
      });
      setOrders(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat orders.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  // Initial mount only — re-fetches are event-driven (button / onChange)
  useEffect(() => { fetchOrders(); }, []); // eslint-disable-line react-hooks/set-state-in-effect,react-hooks/exhaustive-deps

  const flash = (msg, type = 'error') => {
    if (type === 'success') { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3000); }
    else { setError(msg); setSuccess(''); }
  };

  const handleCreate = async (formData) => {
    setSubmitting(true);
    try {
      await createOrder(formData);
      setShowCreate(false);
      flash('Order berhasil dibuat!', 'success');
      fetchOrders();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal membuat order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteOrder(deleteTarget.order_id);
      flash(`Order ${deleteTarget.order_number} berhasil dihapus.`, 'success');
      setDeleteTarget(null);
      fetchOrders();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menghapus order.');
    }
  };

  const handleUpdate = async (formData) => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await updateOrder(editTarget.order_id, {
        warehouse_id: String(formData.warehouse_id),
        supplier_id: String(formData.supplier_id),
        delivery_start_date: formData.delivery_start_date,
        delivery_end_date: formData.delivery_end_date,
        approval_id: String(formData.approval_id),
        order_status_id: String(formData.order_status_id),
      });
      setEditTarget(null);
      flash('Order berhasil diperbarui!', 'success');
      fetchOrders();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal memperbarui order.');
    } finally {
      setSubmitting(false);
    }
  };

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role?.role_code || '';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Orders</h1>
          <p className="page-subtitle">{total} purchase order</p>
        </div>
        {(role === 'STAFF' || role === 'ADMIN' || role === 'MANAGER') && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Buat PO</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="filters-row">
        <div className="search-group">
          <span className="search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input type="text" placeholder="Cari nomor order..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()} className="filter-input" />
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
            <option value="">Semua Status</option>
            <option value="10">Open</option>
            <option value="20">InTransit</option>
            <option value="30">Receiving Started</option>
            <option value="40">Receiving Verified</option>
            <option value="50">Cancelled</option>
          </select>
        </div>

        <button className="btn-search" onClick={fetchOrders}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          Cari
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="table-loading"><span className="spinner large" /><p>Memuat...</p></div>
        ) : orders.length === 0 ? (
          <div className="table-empty"><p>Belum ada order.</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Supplier</th>
                  <th>Warehouse</th>
                  <th>Status</th>
                  <th>Delivery</th>
                  <th>Items</th>
                  <th>Tanggal</th>
                  {(role === 'ADMIN' || role === 'MANAGER') && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.order_id}>
                    <td className="text-bold">{o.order_number}</td>
                    <td>{o.supplier?.supplier_name || '—'}</td>
                    <td>{o.warehouse?.warehouse_name || '—'}</td>
                    <td><StatusBadge code={o.order_status?.status_code} /></td>
                    <td>{formatDate(o.delivery_start_date)} – {formatDate(o.delivery_end_date)}</td>
                    <td style={{ textAlign: 'center' }}>{o._count?.order_details ?? 0}</td>
                    <td>{formatDate(o.created_at)}</td>
                    {(role === 'ADMIN' || role === 'MANAGER') && (
                      <td className="cell-actions">
                        <button className="btn-edit" title="Edit order" onClick={() => setEditTarget(o)}>Edit</button>
                        <button className="btn-icon btn-delete" title="Hapus order" onClick={() => setDeleteTarget(o)}>✕</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateOrderModal
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={submitting}
        />
      )}

      {editTarget && (
        <EditOrderModal
          order={editTarget}
          onSubmit={handleUpdate}
          onCancel={() => setEditTarget(null)}
          loading={submitting}
        />
      )}

      <ModalDialog
        open={Boolean(deleteTarget)}
        title="Hapus Order"
        message={`Yakin ingin menghapus order ${deleteTarget?.order_number}?`}
        showCancel={true}
        confirmText="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
