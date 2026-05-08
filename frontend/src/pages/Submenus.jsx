import { useEffect, useState } from 'react';
import { createSubmenu, deleteSubmenu, getMenus, getSubmenus, updateSubmenu } from '../services/api';
import ModalDialog from '../components/ModalDialog';
import { Link } from 'react-router-dom';

const IconDashboard = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>;
const IconOrders = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const IconSuppliers = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconItems = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
const IconWarehouses = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3"/><path d="M4 21V10"/><path d="M20 21V10"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/></svg>;
const IconReports = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" x2="20" y1="8" y2="14"/><line x1="23" x2="17" y1="11" y2="11"/></svg>;
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

const EMPTY = {
  menu_id: '',
  submenu_sequence: '',
  submenu_name: '',
  submenu_icon: 'users',
  submenu_link: '',
  is_active: true,
};

export default function Submenus() {
  const [submenus, setSubmenus] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [submenuRes, menuRes] = await Promise.all([getSubmenus(), getMenus()]);
        setSubmenus(submenuRes.data.data || []);
        setMenus(menuRes.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat submenu.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refresh = async () => {
    const { data } = await getSubmenus();
    setSubmenus(data.data || []);
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
    setForm({ ...EMPTY, menu_id: menus[0]?.menu_id ? String(menus[0].menu_id) : '' });
    setShowForm(true);
  };

  const openEdit = (submenu) => {
    setEditTarget(submenu);
    setForm({
      menu_id: String(submenu.menu_id),
      submenu_sequence: submenu.submenu_sequence || '',
      submenu_name: submenu.submenu_name || '',
      submenu_icon: submenu.submenu_icon || '',
      submenu_link: submenu.submenu_link || '',
      is_active: Boolean(submenu.is_active),
    });
    setShowForm(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!form.menu_id || !form.submenu_sequence.trim() || !form.submenu_name.trim()) {
      flash('Menu, sequence, dan nama submenu wajib diisi.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        menu_id: Number(form.menu_id),
        submenu_sequence: form.submenu_sequence.trim(),
        submenu_name: form.submenu_name.trim(),
        submenu_icon: form.submenu_icon.trim(),
        submenu_link: form.submenu_link.trim() || '#',
        is_active: form.is_active,
      };
      if (editTarget) {
        await updateSubmenu(editTarget.submenu_id, payload);
        flash('Submenu berhasil diperbarui.', 'success');
      } else {
        await createSubmenu(payload);
        flash('Submenu berhasil ditambahkan.', 'success');
      }
      setShowForm(false);
      await refresh();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menyimpan submenu.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSubmenu(deleteTarget.submenu_id);
      flash('Submenu berhasil dihapus.', 'success');
      await refresh();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal menghapus submenu.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredSubmenus = submenus.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(s.submenu_name || '').toLowerCase().includes(q) ||
      String(s.submenu_sequence || '').toLowerCase().includes(q) ||
      String(s.submenu_link || '').toLowerCase().includes(q) ||
      String(s.menu?.menu_name || '').toLowerCase().includes(q)
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
            <h1 style={{ margin: 0 }}>Submenus</h1>
          </div>
          <p className="page-subtitle">Kelola submenu untuk setiap menu utama</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Tambah Submenu</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <div className="filters-row">
        <div className="search-group">
          <input className="filter-input" placeholder="Cari submenu..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
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
                  <th>Menu</th>
                  <th>Icon</th>
                  <th>Sequence</th>
                  <th>Submenu</th>
                  <th>Link</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmenus.map((s, i) => (
                  <tr key={s.submenu_id}>
                    <td>{i + 1}</td>
                    <td>{s.menu?.menu_name || '-'}</td>
                    <td><IconPreview iconKey={s.submenu_icon} /></td>
                    <td>{s.submenu_sequence}</td>
                    <td className="text-bold">{s.submenu_name}</td>
                    <td>{s.submenu_link || '—'}</td>
                    <td>{s.is_active ? 'Aktif' : 'Nonaktif'}</td>
                    <td className="cell-actions">
                      <button className="btn-icon btn-edit" onClick={() => openEdit(s)} title="Edit">✎</button>
                      <button className="btn-icon btn-delete" onClick={() => setDeleteTarget(s)} title="Hapus">✕</button>
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
            <h2>{editTarget ? 'Edit Submenu' : 'Tambah Submenu'}</h2>
            <p style={{ marginTop: 0, color: 'var(--text-muted)' }}>
              Submenu adalah fitur turunan dari menu utama di sidebar.
            </p>
            <form onSubmit={submitForm} className="form-grid">
              <div className="form-group">
                <label>Menu *</label>
                <small style={{ color: 'var(--text-muted)' }}>Pilih parent menu untuk submenu ini</small>
                <select value={form.menu_id} onChange={(e) => setForm((p) => ({ ...p, menu_id: e.target.value }))}>
                  <option value="">Pilih Menu</option>
                  {menus.map((m) => <option key={m.menu_id} value={m.menu_id}>{m.menu_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Sequence *</label>
                <small style={{ color: 'var(--text-muted)' }}>Urutan tampil di dalam parent menu</small>
                <input value={form.submenu_sequence} onChange={(e) => setForm((p) => ({ ...p, submenu_sequence: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Nama Submenu *</label>
                <small style={{ color: 'var(--text-muted)' }}>Nama fitur yang akan tampil</small>
                <input value={form.submenu_name} onChange={(e) => setForm((p) => ({ ...p, submenu_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Icon</label>
                <small style={{ color: 'var(--text-muted)' }}>Pilih icon submenu</small>
                <div className="icon-picker-grid">
                  {ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, submenu_icon: opt.value }))}
                      className={form.submenu_icon === opt.value ? 'btn-primary' : 'btn-secondary'}
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
              <div className="form-group span-full">
                <label>Link</label>
                <small style={{ color: 'var(--text-muted)' }}>Contoh route: /items, /reports, /users</small>
                <input value={form.submenu_link} onChange={(e) => setForm((p) => ({ ...p, submenu_link: e.target.value }))} />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <label style={{ marginBottom: 6 }}>Status</label>
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
        title="Hapus Submenu"
        message={`Yakin ingin menghapus submenu "${deleteTarget?.submenu_name}"?`}
        showCancel={true}
        confirmText="Hapus"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
