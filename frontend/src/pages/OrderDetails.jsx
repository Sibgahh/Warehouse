import { useEffect, useState } from 'react';
import { createOrderDetail, deleteOrderDetail, getItems, getOrderDetails, getOrders, updateOrderDetail } from '../services/api';
import ModalDialog from '../components/ModalDialog';

const EMPTY = {
  order_id: '',
  item_id: '',
  qty_ordered: '1',
  qty_received: '0',
  qty_cancelled: '0',
  reason_cancelled: '',
};

export default function OrderDetails() {
  const [rows, setRows] = useState([]);
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const refresh = async () => {
    const { data } = await getOrderDetails();
    setRows(data.data || []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [detailsRes, ordersRes, itemsRes] = await Promise.all([
          getOrderDetails(),
          getOrders({ limit: 100 }),
          getItems({ limit: 100 }),
        ]);
        setRows(detailsRes.data.data || []);
        setOrders(ordersRes.data.data || []);
        setItems(itemsRes.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat order details.');
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
      ...EMPTY,
      order_id: orders[0]?.order_id ? String(orders[0].order_id) : '',
      item_id: items[0]?.item_id ? String(items[0].item_id) : '',
    });
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditTarget(row);
    setForm({
      order_id: String(row.order_id),
      item_id: String(row.item_id),
      qty_ordered: String(Number(row.qty_ordered)),
      qty_received: String(Number(row.qty_received || 0)),
      qty_cancelled: String(Number(row.qty_cancelled || 0)),
      reason_cancelled: row.reason_cancelled || '',
    });
    setShowForm(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!form.item_id || !form.qty_ordered) {
      flash('Item dan qty ordered wajib diisi.');
      return;
    }
    if (!editTarget && !form.order_id) {
      flash('Order wajib dipilih.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...(editTarget ? {} : { order_id: Number(form.order_id) }),
        item_id: Number(form.item_id),
        qty_ordered: Number(form.qty_ordered),
        qty_received: Number(form.qty_received || 0),
        qty_cancelled: Number(form.qty_cancelled || 0),
        reason_cancelled: form.reason_cancelled,
      };
      if (editTarget) {
        await updateOrderDetail(editTarget.order_detail_id, payload);
        flash('Order detail berhasil diperbarui.', 'success');
      } else {
        await createOrderDetail(payload);
        flash('Order detail berhasil ditambahkan.', 'success');
      }
      setShowForm(false);
      await refresh();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menyimpan order detail.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteOrderDetail(deleteTarget.order_detail_id);
      flash('Order detail berhasil dihapus.', 'success');
      await refresh();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menghapus order detail.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Order Details</h1>
          <p className="page-subtitle">Kelola line item order secara terpisah</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Tambah Detail</button>
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
                  <th>Order</th>
                  <th>Item</th>
                  <th>Qty Ordered</th>
                  <th>Qty Received</th>
                  <th>Qty Cancelled</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.order_detail_id}>
                    <td>{i + 1}</td>
                    <td>{row.order?.order_number || row.order_id}</td>
                    <td>{row.item?.item_name || row.item_id}</td>
                    <td>{Number(row.qty_ordered)}</td>
                    <td>{Number(row.qty_received || 0)}</td>
                    <td>{Number(row.qty_cancelled || 0)}</td>
                    <td className="cell-actions">
                      <button className="btn-icon btn-edit" onClick={() => openEdit(row)} title="Edit">✎</button>
                      <button className="btn-icon btn-delete" onClick={() => setDeleteTarget(row)} title="Hapus">✕</button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Belum ada order detail.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editTarget ? 'Edit Order Detail' : 'Tambah Order Detail'}</h2>
            <form onSubmit={submitForm} className="form-grid">
              {!editTarget && (
                <div className="form-group span-full">
                  <label>Order *</label>
                  <select value={form.order_id} onChange={(e) => setForm((p) => ({ ...p, order_id: e.target.value }))}>
                    <option value="">Pilih Order</option>
                    {orders.map((o) => <option key={o.order_id} value={o.order_id}>{o.order_number}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group span-full">
                <label>Item *</label>
                <select value={form.item_id} onChange={(e) => setForm((p) => ({ ...p, item_id: e.target.value }))}>
                  <option value="">Pilih Item</option>
                  {items.map((it) => <option key={it.item_id} value={it.item_id}>{it.item_name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Qty Ordered *</label><input type="number" value={form.qty_ordered} onChange={(e) => setForm((p) => ({ ...p, qty_ordered: e.target.value }))} /></div>
              <div className="form-group"><label>Qty Received</label><input type="number" value={form.qty_received} onChange={(e) => setForm((p) => ({ ...p, qty_received: e.target.value }))} /></div>
              <div className="form-group"><label>Qty Cancelled</label><input type="number" value={form.qty_cancelled} onChange={(e) => setForm((p) => ({ ...p, qty_cancelled: e.target.value }))} /></div>
              <div className="form-group span-full"><label>Reason Cancelled</label><input value={form.reason_cancelled} onChange={(e) => setForm((p) => ({ ...p, reason_cancelled: e.target.value }))} /></div>
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
        title="Hapus Order Detail"
        message={`Yakin ingin menghapus detail "${deleteTarget?.item?.item_name || deleteTarget?.item_id}"?`}
        showCancel={true}
        confirmText="Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
