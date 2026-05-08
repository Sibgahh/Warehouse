import { useEffect, useState } from 'react';
import { createInventory, deleteInventory, getInventory, getItems, updateInventory } from '../services/api';
import ModalDialog from '../components/ModalDialog';

const EMPTY = { item_id: '', on_hand_qty: '0', on_ordered_qty: '0' };

export default function Inventory() {
  const [rows, setRows] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const refresh = async (query = '') => {
    const { data } = await getInventory(query ? { search: query } : undefined);
    setRows(data.data || []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [inventoryRes, itemRes] = await Promise.all([getInventory(), getItems()]);
        setRows(inventoryRes.data.data || []);
        setItems(itemRes.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat inventory.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const flash = (msg, type = 'error') => {
    if (type === 'success') { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 2500); }
    else { setError(msg); setSuccess(''); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.on_hand_qty.trim()) return flash('on_hand_qty wajib diisi.');
    setSubmitting(true);
    try {
      const payload = {
        ...(editTarget ? {} : { item_id: Number(form.item_id) }),
        on_hand_qty: Number(form.on_hand_qty),
        on_ordered_qty: Number(form.on_ordered_qty || 0),
      };
      if (editTarget) {
        await updateInventory(editTarget.inventory_id, payload);
        flash('Inventory berhasil diperbarui.', 'success');
      } else {
        await createInventory(payload);
        flash('Inventory berhasil ditambahkan.', 'success');
      }
      setShowForm(false);
      await refresh(search);
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menyimpan inventory.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInventory(deleteTarget.inventory_id);
      flash('Inventory berhasil dihapus.', 'success');
      await refresh(search);
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menghapus inventory.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Inventory</h1>
          <p className="page-subtitle">Kelola stok on-hand dan on-ordered per item</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditTarget(null); setForm({ ...EMPTY, item_id: items[0]?.item_id ? String(items[0].item_id) : '' }); setShowForm(true); }}>+ Tambah Inventory</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="filters-row">
        <div className="search-group">
          <input
            className="filter-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari item..."
            onKeyDown={async (e) => { if (e.key === 'Enter') await refresh(search); }}
          />
        </div>
        <button className="btn-search" onClick={() => refresh(search)}>Cari</button>
      </div>

      <div className="card">
        {loading ? <div className="table-loading"><span className="spinner large" /></div> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>#</th><th>Item</th><th>Supplier</th><th>On Hand</th><th>On Ordered</th><th>Min/Max</th><th>Aksi</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.inventory_id}>
                    <td>{i + 1}</td>
                    <td className="text-bold">{r.item?.item_name}</td>
                    <td>{r.item?.supplier?.supplier_name || '-'}</td>
                    <td>{Number(r.on_hand_qty)}</td>
                    <td>{Number(r.on_ordered_qty || 0)}</td>
                    <td>{Number(r.item?.min_stock || 0)} / {Number(r.item?.max_stock || 0)}</td>
                    <td className="cell-actions">
                      <button className="btn-icon btn-edit" onClick={() => { setEditTarget(r); setForm({ item_id: String(r.item_id), on_hand_qty: String(Number(r.on_hand_qty)), on_ordered_qty: String(Number(r.on_ordered_qty || 0)) }); setShowForm(true); }}>✎</button>
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
            <h2>{editTarget ? 'Adjust Inventory' : 'Tambah Inventory'}</h2>
            <form onSubmit={submit} className="form-grid">
              {!editTarget && (
                <div className="form-group span-full">
                  <label>Item *</label>
                  <select value={form.item_id} onChange={(e) => setForm((p) => ({ ...p, item_id: e.target.value }))}>
                    <option value="">Pilih Item</option>
                    {items.map((item) => <option key={item.item_id} value={item.item_id}>{item.item_name}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group"><label>On Hand Qty *</label><input type="number" value={form.on_hand_qty} onChange={(e) => setForm((p) => ({ ...p, on_hand_qty: e.target.value }))} /></div>
              <div className="form-group"><label>On Ordered Qty</label><input type="number" value={form.on_ordered_qty} onChange={(e) => setForm((p) => ({ ...p, on_ordered_qty: e.target.value }))} /></div>
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
        title="Hapus Inventory"
        message={`Yakin ingin menghapus inventory item "${deleteTarget?.item?.item_name}"?`}
        showCancel={true}
        confirmText="Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
