import { useEffect, useState } from 'react';
import { createMenu, deleteMenu, getMenus, reorderMenus, updateMenu } from '../services/api';
import ModalDialog from '../components/ModalDialog';
import FeedbackModal from '../components/FeedbackModal';
import { Link } from 'react-router-dom';

const IconGrip = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="18" r="1" />
    <circle cx="15" cy="6" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="18" r="1" />
  </svg>
);

const IconDashboard = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>;
const IconOrders = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const IconSuppliers = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconItems = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
const IconWarehouses = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3"/><path d="M4 21V10"/><path d="M20 21V10"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/></svg>;
const IconReports = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" x2="20" y1="8" y2="14"/><line x1="23" x2="17" y1="11" y2="11"/></svg>;
const IconMaster = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M12 4h9"/><path d="M4 9h16"/><path d="M4 15h16"/></svg>;
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-1.94 1.52l-.16.69a2 2 0 0 1-1.32 1.42l-.65.23a2 2 0 0 1-1.86-.24l-.58-.35a2 2 0 0 0-2.43.31l-.31.31a2 2 0 0 0-.31 2.43l.35.58a2 2 0 0 1 .24 1.86l-.23.65a2 2 0 0 1-1.42 1.32l-.69.16A2 2 0 0 0 2 11.78v.44a2 2 0 0 0 1.52 1.94l.69.16a2 2 0 0 1 1.42 1.32l.23.65a2 2 0 0 1-.24 1.86l-.35.58a2 2 0 0 0 .31 2.43l.31.31a2 2 0 0 0 2.43.31l.58-.35a2 2 0 0 1 1.86-.24l.65.23a2 2 0 0 1 1.32 1.42l.16.69A2 2 0 0 0 11.78 22h.44a2 2 0 0 0 1.94-1.52l.16-.69a2 2 0 0 1 1.32-1.42l.65-.23a2 2 0 0 1 1.86.24l.58.35a2 2 0 0 0 2.43-.31l.31-.31a2 2 0 0 0 .31-2.43l-.35-.58a2 2 0 0 1-.24-1.86l.23-.65a2 2 0 0 1 1.42-1.32l.69-.16A2 2 0 0 0 22 12.22v-.44a2 2 0 0 0-1.52-1.94l-.69-.16a2 2 0 0 1-1.42-1.32l-.23-.65a2 2 0 0 1 .24-1.86l.35-.58a2 2 0 0 0-.31-2.43l-.31-.31a2 2 0 0 0-2.43-.31l-.58.35a2 2 0 0 1-1.86.24l-.65-.23a2 2 0 0 1-1.32-1.42l-.16-.69A2 2 0 0 0 12.22 2z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconDefault = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8"/></svg>;

const ICON_COMPONENTS = {
  dashboard: IconDashboard,
  orders: IconOrders,
  suppliers: IconSuppliers,
  items: IconItems,
  warehouses: IconWarehouses,
  reports: IconReports,
  users: IconUsers,
  master: IconMaster,
  settings: IconSettings,
};

const ICON_OPTIONS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'orders', label: 'Orders' },
  { value: 'suppliers', label: 'Suppliers' },
  { value: 'items', label: 'Items' },
  { value: 'warehouses', label: 'Warehouses' },
  { value: 'reports', label: 'Reports' },
  { value: 'users', label: 'Users' },
  { value: 'master', label: 'Master Data' },
  { value: 'settings', label: 'Settings' },
];

function IconPreview({ iconKey }) {
  const Icon = ICON_COMPONENTS[iconKey] || IconDefault;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, border: '1px solid var(--border)', borderRadius: 8 }}>
      <Icon />
    </span>
  );
}

const EMPTY_FORM = {
  menu_name: '',
  menu_icon: 'dashboard',
  menu_link: '',
  is_submenu: false,
  is_active: true,
};

export default function Menus() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [dragIndex, setDragIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await getMenus();
        setMenus(data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat menu.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refresh = async () => {
    const { data } = await getMenus();
    setMenus(data.data || []);
  };

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
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (menu) => {
    setEditTarget(menu);
    setFormError('');
    setForm({
      menu_name: menu.menu_name || '',
      menu_icon: menu.menu_icon || '',
      menu_link: menu.menu_link || '',
      is_submenu: Boolean(menu.is_submenu),
      is_active: Boolean(menu.is_active),
    });
    setShowForm(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!form.menu_name.trim()) {
      setFormError('Nama menu wajib diisi.');
      return;
    }

    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        menu_name: form.menu_name.trim(),
        menu_icon: form.menu_icon.trim(),
        menu_link: form.menu_link.trim() || '#',
        is_submenu: form.is_submenu,
        is_active: form.is_active,
      };
      if (editTarget) {
        await updateMenu(editTarget.menu_id, payload);
        flash('Menu berhasil diperbarui.', 'success');
      } else {
        await createMenu(payload);
        flash('Menu berhasil ditambahkan.', 'success');
      }
      setShowForm(false);
      await refresh();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menyimpan menu.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Drag & drop reorder ──────────────────────────────────────────────────
  // Pakai HTML5 native DnD. Saat drop:
  //   1. Pindahkan item di state lokal (optimistic update)
  //   2. Kirim array menu_id ke backend → backend re-write sequence
  //   3. Refresh untuk dapat sequence final
  const handleDragStart = (e, idx) => {
    setDragIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropIndex !== idx) setDropIndex(idx);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleDrop = async (e, targetIdx) => {
    e.preventDefault();
    const sourceIdx = dragIndex;
    setDragIndex(null);
    setDropIndex(null);
    if (sourceIdx === null || sourceIdx === targetIdx) return;
    if (search.trim()) {
      flash('Hapus filter pencarian dulu sebelum mengubah urutan.');
      return;
    }

    const reordered = [...menus];
    const [moved] = reordered.splice(sourceIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    setMenus(reordered); // optimistic

    try {
      await reorderMenus(reordered.map((m) => Number(m.menu_id)));
      flash('Urutan menu tersimpan.', 'success');
      await refresh();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menyimpan urutan.');
      await refresh(); // rollback ke state DB
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMenu(deleteTarget.menu_id);
      flash('Menu berhasil dihapus.', 'success');
      await refresh();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menghapus menu.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredMenus = menus.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(m.menu_name || '').toLowerCase().includes(q) ||
      String(m.menu_sequence || '').toLowerCase().includes(q) ||
      String(m.menu_link || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/access-config" className="btn-secondary" title="Kembali ke Alur" style={{ padding: '6px 10px' }}>
              ←
            </Link>
            <h1 style={{ margin: 0 }}>Menus</h1>
          </div>
          <p className="page-subtitle">Kelola menu sidebar dari database</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Tambah Menu</button>
      </div>

      <div className="filters-row">
        <div className="search-group">
          <input className="filter-input" placeholder="Cari menu..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="table-loading"><span className="spinner large" /></div>
        ) : (
          <div className="table-wrapper">
            <p className="page-subtitle" style={{ margin: '0 0 8px 4px', fontSize: 13 }}>
              Tip: tarik baris pada kolom <strong>⋮⋮</strong> untuk mengubah urutan menu.
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>#</th>
                  <th>Icon</th>
                  <th>Nama</th>
                  <th>Link</th>
                  <th>Submenu?</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredMenus.map((menu, i) => {
                  const isDraggable = !search.trim();
                  return (
                    <tr
                      key={menu.menu_id}
                      draggable={isDraggable}
                      onDragStart={(e) => handleDragStart(e, i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDrop={(e) => handleDrop(e, i)}
                      onDragEnd={handleDragEnd}
                      className={`${dragIndex === i ? 'row-dragging' : ''} ${dropIndex === i && dragIndex !== i ? 'row-drop-target' : ''}`}
                    >
                      <td className="drag-handle" title={isDraggable ? 'Tarik untuk reorder' : 'Hapus filter dulu'} style={{ cursor: isDraggable ? 'grab' : 'not-allowed', opacity: isDraggable ? 0.7 : 0.3 }}>
                        <IconGrip />
                      </td>
                      <td>{i + 1}</td>
                      <td><IconPreview iconKey={menu.menu_icon} /></td>
                      <td className="text-bold">{menu.menu_name}</td>
                      <td>{menu.menu_link || '—'}</td>
                      <td>{menu.is_submenu ? 'Ya' : 'Tidak'}</td>
                      <td>{menu.is_active ? 'Aktif' : 'Nonaktif'}</td>
                      <td className="cell-actions">
                        <button className="btn-icon btn-edit" onClick={() => openEdit(menu)} title="Edit">✎</button>
                        <button className="btn-icon btn-delete" onClick={() => setDeleteTarget(menu)} title="Hapus">✕</button>
                      </td>
                    </tr>
                  );
                })}
                {filteredMenus.length === 0 && (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: 20 }}>Belum ada menu.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editTarget ? 'Edit Menu' : 'Tambah Menu'}</h2>
            <p style={{ marginTop: 0, color: 'var(--text-muted)' }}>
              Isi data menu utama yang akan ditampilkan di sidebar.
            </p>
            {formError && <div className="alert alert-error">{formError}</div>}
            {!editTarget && (
              <p style={{ marginTop: 0, color: 'var(--text-muted)', fontSize: 13 }}>
                Menu baru akan ditempatkan di urutan paling akhir. Ubah urutan via drag-and-drop di tabel.
              </p>
            )}
            <form onSubmit={submitForm} className="form-grid">
              <div className="form-group span-full">
                <label>Nama Menu *</label>
                <small style={{ color: 'var(--text-muted)' }}>Nama grup menu di sidebar</small>
                <input value={form.menu_name} onChange={(e) => setForm((p) => ({ ...p, menu_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Icon</label>
                <small style={{ color: 'var(--text-muted)' }}>Pilih icon untuk menu ini</small>
                <div className="icon-picker-grid">
                  {ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, menu_icon: opt.value }))}
                      className={form.menu_icon === opt.value ? 'btn-primary' : 'btn-secondary'}
                      style={{ padding: 0, justifyContent: 'flex-start' }}
                    >
                      <span className="icon-picker-btn">
                        <IconPreview iconKey={opt.value} />
                        <span>{opt.label}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Link</label>
                <small style={{ color: 'var(--text-muted)' }}>
                  Contoh: /orders (isi # jika hanya sebagai parent submenu)
                </small>
                <input value={form.menu_link} onChange={(e) => setForm((p) => ({ ...p, menu_link: e.target.value }))} />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <label style={{ marginBottom: 6 }}>Jenis Menu</label>
                <label className="check-card">
                  <input type="checkbox" checked={form.is_submenu} onChange={(e) => setForm((p) => ({ ...p, is_submenu: e.target.checked }))} />
                  <span>Parent submenu (tidak langsung buka halaman)</span>
                </label>
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <label style={{ marginBottom: 6 }}>Status</label>
                <label className="check-card">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} /> Aktif
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
        title="Hapus Menu"
        message={`Yakin ingin menghapus menu "${deleteTarget?.menu_name}"?`}
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
