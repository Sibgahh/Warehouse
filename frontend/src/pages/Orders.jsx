import { useState, useEffect, useCallback } from 'react';
import {
  getOrders, createOrder, deleteOrder, getSuppliers, getItems, updateOrder, getOrderStatuses,
  getOrderDetails, createOrderDetail, updateOrderDetail, deleteOrderDetail,
} from '../services/api';
import ModalDialog from '../components/ModalDialog';
import FeedbackModal from '../components/FeedbackModal';

// ── Icons (module scope — stable refs) ──────────────────────────────────────
const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);
const IconPencil = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
);
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6 17.5 20a2 2 0 0 1-2 1.8h-7a2 2 0 0 1-2-1.8L5 6"/><path d="M10 11v6M14 11v6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
);
const IconClose = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

const STATUS_LABELS = {
  '10': { label: 'Open', color: '#6b7280', bg: '#f3f4f6' },
  '20': { label: 'InTransit', color: '#d97706', bg: '#fef3c7' },
  '30': { label: 'Receiving', color: '#2563eb', bg: '#dbeafe' },
  '40': { label: 'Verified', color: '#16a34a', bg: '#dcfce7' },
  '50': { label: 'Cancelled', color: '#dc2626', bg: '#fee2e2' },
};

const STATUS_FILTER_OPTIONS = [
  { code: '', label: 'Semua' },
  { code: '10', label: 'Open' },
  { code: '20', label: 'InTransit' },
  { code: '30', label: 'Receiving' },
  { code: '40', label: 'Verified' },
  { code: '50', label: 'Cancelled' },
];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatIDR(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n) || 0);
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

  const getUnitCost = (itemId) => Number(items.find((it) => String(it.item_id) === String(itemId))?.unit_cost || 0);
  const rowSubtotal = (row) => getUnitCost(row.item_id) * (Number(row.qty_ordered) || 0);
  const totalQty = orderItems.reduce((sum, r) => sum + (Number(r.qty_ordered) || 0), 0);
  const grandTotal = orderItems.reduce((sum, r) => sum + rowSubtotal(r), 0);

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
                <span>Qty</span>
                <span>Harga</span>
                <span>Subtotal</span>
                <span></span>
              </div>
              {orderItems.map((row, idx) => {
                const unitCost = getUnitCost(row.item_id);
                const subtotal = rowSubtotal(row);
                return (
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
                    <span className="order-item-cell">{row.item_id ? formatIDR(unitCost) : '—'}</span>
                    <span className="order-item-cell text-bold">{row.item_id && row.qty_ordered ? formatIDR(subtotal) : '—'}</span>
                    <button type="button" className="btn-icon btn-delete" onClick={() => removeItemRow(idx)}>✕</button>
                  </div>
                );
              })}
              <button type="button" className="btn-secondary" onClick={addItemRow}>+ Tambah Item</button>

              <div className="order-items-summary">
                <div className="summary-row">
                  <span className="summary-label">Total Qty</span>
                  <span className="summary-value">{totalQty}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Grand Total</span>
                  <span className="summary-value summary-grand">{formatIDR(grandTotal)}</span>
                </div>
              </div>
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

// ── Order Details Modal ──────────────────────────────────────────────────────
const EMPTY_DETAIL = { item_id: '', qty_ordered: '', qty_received: '0', qty_cancelled: '0', reason_cancelled: '' };

function OrderDetailsModal({ order, canEdit, canEditHeader, onClose, onChange, onHeaderSaved }) {
  const [details, setDetails] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [headerSubmitting, setHeaderSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_DETAIL);
  const [headerForm, setHeaderForm] = useState({
    warehouse_id: String(order?.warehouse_id || 1),
    supplier_id: String(order?.supplier_id || ''),
    delivery_start_date: order?.delivery_start_date ? new Date(order.delivery_start_date).toISOString().slice(0, 10) : '',
    delivery_end_date: order?.delivery_end_date ? new Date(order.delivery_end_date).toISOString().slice(0, 10) : '',
    approval_id: String(order?.approval_id || ''),
    order_status_id: String(order?.order_status_id || ''),
  });
  const [headerError, setHeaderError] = useState('');
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [detailsRes, itemsRes, suppliersRes, statusesRes] = await Promise.all([
        getOrderDetails({ order_id: order.order_id }),
        getItems({ limit: 100 }),
        getSuppliers({ limit: 100 }),
        getOrderStatuses(),
      ]);
      setDetails(detailsRes.data.data || []);
      setItems(itemsRes.data.data || []);
      setSuppliers(suppliersRes.data.data || []);
      setStatuses(statusesRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat detail.');
    } finally {
      setLoading(false);
    }
  }, [order.order_id]);

  useEffect(() => { load(); }, [load]);

  const handleHeaderChange = (e) => {
    setHeaderForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setHeaderError('');
  };

  const handleHeaderSubmit = async (e) => {
    e.preventDefault();
    if (!headerForm.supplier_id || !headerForm.delivery_start_date || !headerForm.delivery_end_date || !headerForm.approval_id || !headerForm.order_status_id) {
      setHeaderError('Semua field informasi order wajib diisi.');
      return;
    }
    if (new Date(headerForm.delivery_end_date) < new Date(headerForm.delivery_start_date)) {
      setHeaderError('Delivery end date tidak boleh sebelum start date.');
      return;
    }
    setHeaderSubmitting(true);
    setHeaderError('');
    try {
      await updateOrder(order.order_id, {
        warehouse_id: String(headerForm.warehouse_id),
        supplier_id: String(headerForm.supplier_id),
        delivery_start_date: headerForm.delivery_start_date,
        delivery_end_date: headerForm.delivery_end_date,
        approval_id: String(headerForm.approval_id),
        order_status_id: String(headerForm.order_status_id),
      });
      onHeaderSaved?.();
    } catch (err) {
      setHeaderError(err.response?.data?.message || 'Gagal menyimpan informasi order.');
    } finally {
      setHeaderSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_DETAIL);
    setError('');
  };

  const startEdit = (row) => {
    setEditingId(row.order_detail_id);
    setForm({
      item_id: String(row.item_id),
      qty_ordered: String(Number(row.qty_ordered)),
      qty_received: String(Number(row.qty_received || 0)),
      qty_cancelled: String(Number(row.qty_cancelled || 0)),
      reason_cancelled: row.reason_cancelled || '',
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_id || !form.qty_ordered) {
      setError('Item dan qty ordered wajib diisi.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        item_id: Number(form.item_id),
        qty_ordered: Number(form.qty_ordered),
        qty_received: Number(form.qty_received || 0),
        qty_cancelled: Number(form.qty_cancelled || 0),
        reason_cancelled: form.reason_cancelled,
      };
      if (editingId) {
        await updateOrderDetail(editingId, payload);
      } else {
        await createOrderDetail({ order_id: Number(order.order_id), ...payload });
      }
      resetForm();
      await load();
      onChange?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan detail.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.order_detail_id;
    try {
      await deleteOrderDetail(id);
      if (editingId === id) resetForm();
      await load();
      onChange?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus detail.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const activeItems = items.filter((it) => it.status === 'A');

  const detailUnitCost = (d) => Number(d.item?.unit_cost ?? items.find((it) => String(it.item_id) === String(d.item_id))?.unit_cost ?? 0);
  const detailSubtotal = (d) => detailUnitCost(d) * Number(d.qty_ordered || 0);
  const totalQty = details.reduce((sum, d) => sum + Number(d.qty_ordered || 0), 0);
  const grandTotal = details.reduce((sum, d) => sum + detailSubtotal(d), 0);
  const colSpan = canEdit ? 8 : 7;
  const editingDetail = editingId ? details.find((d) => d.order_detail_id === editingId) : null;
  const editingItemLabel = editingDetail?.item?.description || editingDetail?.item?.item_name || '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>Detail Order {order.order_number}</h2>
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="table-loading"><span className="spinner large" /></div>
        ) : (
          <>
            <section className="order-header-section">
              <h3 className="section-title">Informasi Order</h3>
              {headerError && <div className="alert alert-error">{headerError}</div>}
              <form onSubmit={handleHeaderSubmit} className="form-grid">
                <div className="form-group">
                  <label>Warehouse</label>
                  <select className="po-select" name="warehouse_id" value={headerForm.warehouse_id}
                    onChange={handleHeaderChange} disabled={!canEditHeader}>
                    <option value="1">WH01 - Gudang Utama Jakarta</option>
                    <option value="2">WH02 - Gudang Surabaya</option>
                    <option value="3">WH03 - Gudang Bandung</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <select className="po-select" name="supplier_id" value={headerForm.supplier_id}
                    onChange={handleHeaderChange} disabled={!canEditHeader}>
                    {suppliers.map((s) => (
                      <option key={s.supplier_id} value={String(s.supplier_id)}>
                        {s.supplier_code} - {s.supplier_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Delivery Start</label>
                  <input type="date" name="delivery_start_date" value={headerForm.delivery_start_date}
                    onChange={handleHeaderChange} disabled={!canEditHeader} />
                </div>
                <div className="form-group">
                  <label>Delivery End</label>
                  <input type="date" name="delivery_end_date" value={headerForm.delivery_end_date}
                    onChange={handleHeaderChange} disabled={!canEditHeader} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="po-select" name="order_status_id" value={headerForm.order_status_id}
                    onChange={handleHeaderChange} disabled={!canEditHeader}>
                    {statuses.map((s) => (
                      <option key={s.order_status_id} value={String(s.order_status_id)}>
                        {s.status_code} - {s.status_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Approval ID</label>
                  <input name="approval_id" value={headerForm.approval_id}
                    onChange={handleHeaderChange} disabled={!canEditHeader} />
                </div>
                {canEditHeader && (
                  <div className="form-actions span-full" style={{ borderTop: 'none', paddingTop: 0 }}>
                    <button type="submit" className="btn-primary" disabled={headerSubmitting}>
                      {headerSubmitting ? 'Menyimpan...' : 'Simpan Informasi Order'}
                    </button>
                  </div>
                )}
              </form>
            </section>

            <h3 className="section-title" style={{ marginTop: 8 }}>Items</h3>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty Ordered</th>
                    <th>Qty Received</th>
                    <th>Qty Cancelled</th>
                    <th>Harga</th>
                    <th>Subtotal</th>
                    <th>Reason</th>
                    {canEdit && <th>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {details.map((d) => (
                    <tr key={d.order_detail_id} className={editingId === d.order_detail_id ? 'row-editing' : ''}>
                      <td>
                        <div className="text-bold">{d.item?.description || d.item?.item_name || d.item_id}</div>
                        {d.item?.item_name && d.item?.description && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.item.item_name}</div>
                        )}
                      </td>
                      <td>{Number(d.qty_ordered)}</td>
                      <td>{Number(d.qty_received || 0)}</td>
                      <td>{Number(d.qty_cancelled || 0)}</td>
                      <td>{formatIDR(detailUnitCost(d))}</td>
                      <td className="text-bold">{formatIDR(detailSubtotal(d))}</td>
                      <td>{d.reason_cancelled || '—'}</td>
                      {canEdit && (
                        <td className="cell-actions">
                          {editingId === d.order_detail_id ? (
                            <button className="btn-delete" onClick={resetForm}>
                              <IconClose /> Batal
                            </button>
                          ) : (
                            <button className="btn-edit" onClick={() => startEdit(d)}>
                              <IconPencil /> Edit
                            </button>
                          )}
                          <button className="btn-delete" onClick={() => setDeleteTarget(d)} disabled={editingId === d.order_detail_id}>
                            <IconTrash /> Hapus
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {details.length === 0 && (
                    <tr><td colSpan={colSpan} style={{ textAlign: 'center', padding: 16 }}>Belum ada detail.</td></tr>
                  )}
                </tbody>
                {details.length > 0 && (
                  <tfoot>
                    <tr className="summary-row-table">
                      <td className="text-bold" style={{ textAlign: 'right' }}>Total</td>
                      <td className="text-bold">{totalQty}</td>
                      <td colSpan={3}></td>
                      <td className="text-bold" style={{ color: 'var(--accent)' }}>{formatIDR(grandTotal)}</td>
                      <td colSpan={canEdit ? 2 : 1}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {canEdit && (
              <div className={`detail-form-card${editingId ? ' editing' : ''}`}>
                {editingId ? (
                  <div className="detail-form-banner">
                    <IconPencil />
                    <span>Mode Edit{editingItemLabel ? ` — ${editingItemLabel}` : ''}</span>
                  </div>
                ) : (
                  <h3 className="detail-form-title">+ Tambah Detail</h3>
                )}

                <form onSubmit={handleSubmit} className="form-grid">
                  <div className="form-group span-full">
                    <label>Item *</label>
                    <select className="po-select" value={form.item_id} disabled={!!editingId}
                      onChange={(e) => setForm((f) => ({ ...f, item_id: e.target.value }))}>
                      <option value="">-- Pilih Item --</option>
                      {activeItems.map((it) => (
                        <option key={it.item_id} value={String(it.item_id)}>
                          {it.item_name} - {it.description?.slice(0, 40)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Qty Ordered *</label>
                    <input className="po-input" type="number" min="1" value={form.qty_ordered}
                      onChange={(e) => setForm((f) => ({ ...f, qty_ordered: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Qty Received</label>
                    <input className="po-input" type="number" min="0" value={form.qty_received}
                      onChange={(e) => setForm((f) => ({ ...f, qty_received: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Qty Cancelled</label>
                    <input className="po-input" type="number" min="0" value={form.qty_cancelled}
                      onChange={(e) => setForm((f) => ({ ...f, qty_cancelled: e.target.value }))} />
                  </div>
                  <div className="form-group span-full">
                    <label>Reason Cancelled</label>
                    <input value={form.reason_cancelled}
                      onChange={(e) => setForm((f) => ({ ...f, reason_cancelled: e.target.value }))} />
                  </div>
                  <div className="form-actions span-full">
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Tutup</button>
                    <button type="submit" className={editingId ? 'btn-warning' : 'btn-primary'} disabled={submitting}>
                      {submitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : '+ Tambah')}
                    </button>
                  </div>
                </form>
              </div>
            )}
            {!canEdit && (
              <div className="form-actions" style={{ marginTop: 16 }}>
                <button type="button" className="btn-secondary" onClick={onClose}>Tutup</button>
              </div>
            )}
          </>
        )}
      </div>

      <ModalDialog
        open={Boolean(deleteTarget)}
        title="Hapus Order Detail"
        message={`Yakin ingin menghapus detail "${deleteTarget?.item?.description || deleteTarget?.item?.item_name || ''}"?`}
        showCancel={true}
        confirmText="Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
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
  const [detailTarget, setDetailTarget] = useState(null);

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

  // Auto-fetch on mount and saat statusFilter berubah (chip langsung memfilter)
  useEffect(() => { fetchOrders(); }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const data = err.response?.data;
      const fieldErrors = Array.isArray(data?.errors) && data.errors.length > 0
        ? data.errors.map((e) => `${e.field}: ${e.message}`).join('; ')
        : null;
      flash(fieldErrors || data?.message || 'Gagal membuat order.');
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

      <div className="filters-row">
        <div className="search-group">
          <span className="search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input type="text" placeholder="Cari nomor order / supplier..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()} className="filter-input" />
        </div>

        <div className="filter-group" style={{ flex: 1 }}>
          <label>Status</label>
          <div className="status-chips">
            {STATUS_FILTER_OPTIONS.map((opt) => {
              const isActive = statusFilter === opt.code;
              const style = opt.code ? STATUS_LABELS[opt.code] : null;
              return (
                <button
                  key={opt.code || 'all'}
                  type="button"
                  onClick={() => setStatusFilter(opt.code)}
                  className={`status-chip${isActive ? ' active' : ''}`}
                  style={isActive && style ? { color: style.color, background: style.bg, borderColor: style.color } : undefined}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
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
                  <th>Aksi</th>
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
                    <td className="cell-actions">
                      <button className="btn-edit" title="Lihat & edit order" onClick={() => setDetailTarget(o)}>
                        <IconEye /> Detail
                      </button>
                      {(role === 'ADMIN' || role === 'MANAGER') && (
                        <button className="btn-delete" title="Hapus order" onClick={() => setDeleteTarget(o)}>
                          <IconTrash /> Hapus
                        </button>
                      )}
                    </td>
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

      {detailTarget && (
        <OrderDetailsModal
          order={detailTarget}
          canEdit={role === 'ADMIN' || role === 'MANAGER' || role === 'STAFF'}
          canEditHeader={role === 'ADMIN' || role === 'MANAGER'}
          onClose={() => setDetailTarget(null)}
          onChange={fetchOrders}
          onHeaderSaved={() => { flash('Informasi order tersimpan.', 'success'); fetchOrders(); }}
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

      <FeedbackModal open={!!error} type="error" message={error} onClose={() => setError('')} />
      <FeedbackModal open={!!success} type="success" message={success} onClose={() => setSuccess('')} />
    </div>
  );
}
