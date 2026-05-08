import { useState, useEffect } from 'react';
import { getUsers, deleteUser } from '../services/api';

const ROLE_LABELS = {
  1: 'Admin',
  2: 'Staff',
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Form tambah user
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ user_name: '', full_name: '', password: '', role_id: 2 });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Edit user
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', role_id: 2, is_active: true });
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await getUsers();
      setUsers(res.data.data);
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Gagal memuat daftar user.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ─── Tambah User ────────────────────────────────────────────────────────────
  const handleAddChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.user_name.trim() || !form.full_name.trim() || !form.password.trim()) {
      setFormError('Semua field wajib diisi.');
      return;
    }
    if (form.password.length < 8) {
      setFormError('Password minimal 8 karakter.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          user_name: form.user_name.trim(),
          full_name: form.full_name.trim(),
          password: form.password,
          role_id: form.role_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || 'Gagal menambah user.');
        return;
      }
      setFormSuccess('User berhasil ditambahkan!');
      setForm({ user_name: '', full_name: '', password: '', role_id: 2 });
      setShowForm(false);
      fetchUsers();
    } catch {
      setFormError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Edit User ─────────────────────────────────────────────────────────────
  const startEdit = (user) => {
    setEditingId(user.user_id);
    setEditForm({ full_name: user.full_name, role_id: user.role_id, is_active: user.is_active });
    setEditError('');
    setEditSuccess('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError('');
    setEditSuccess('');
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setEditError('');
  };

  const handleEditSubmit = async (userId) => {
    setEditError('');
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.message || 'Gagal memperbarui user.');
        return;
      }
      setEditSuccess('User berhasil diperbarui!');
      setEditingId(null);
      fetchUsers();
    } catch {
      setEditError('Terjadi kesalahan. Coba lagi.');
    }
  };

  // ─── Hapus User ─────────────────────────────────────────────────────────────
  const handleDelete = async (userId, userName) => {
    if (!confirm(`Hapus user "${userName}"?`)) return;
    try {
      const res = await deleteUser(userId);
      if (res.data.success) {
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus user.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen User</h1>
          <p className="page-subtitle">Kelola akun Staff & Admin</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setShowForm((p) => !p);
            setFormError('');
            setFormSuccess('');
            setForm({ user_name: '', full_name: '', password: '', role_id: 2 });
          }}
        >
          {showForm ? 'Batal' : '+ Tambah User'}
        </button>
      </div>

      {fetchError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{fetchError}</div>}
      {formError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{formError}</div>}
      {formSuccess && <div className="alert alert-success" style={{ marginBottom: 16 }}>{formSuccess}</div>}
      {editError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{editError}</div>}
      {editSuccess && <div className="alert alert-success" style={{ marginBottom: 16 }}>{editSuccess}</div>}

      {/* ─── Form Tambah User ─────────────────────────────────────── */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-h)', margin: 0 }}>Tambah User Baru</h3>
          </div>
          <form onSubmit={handleAddSubmit} style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label htmlFor="user_name">Username</label>
                <input id="user_name" name="user_name" type="text" autoComplete="username"
                  value={form.user_name} onChange={handleAddChange}
                  placeholder="cth: staff01" disabled={submitting} />
              </div>
              <div className="form-group">
                <label htmlFor="full_name">Nama Lengkap</label>
                <input id="full_name" name="full_name" type="text"
                  value={form.full_name} onChange={handleAddChange}
                  placeholder="cth: John Doe" disabled={submitting} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label htmlFor="role_id">Role</label>
                <select id="role_id" name="role_id" value={form.role_id}
                  onChange={handleAddChange} disabled={submitting}>
                  <option value={2}>Staff</option>
                  <option value={1}>Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" autoComplete="new-password"
                  value={form.password} onChange={handleAddChange}
                  placeholder="Min. 8 karakter" disabled={submitting} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Tabel Users ─────────────────────────────────────────── */}
      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', color: '#999', padding: 32 }}>Memuat...</p>
        ) : users.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: 32 }}>Belum ada data user.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Username</th>
                <th>Nama Lengkap</th>
                <th>Role</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={user.user_id}>
                  {editingId === user.user_id ? (
                    // ── Edit Mode ──
                    <>
                      <td>{i + 1}</td>
                      <td>{user.user_name}</td>
                      <td>
                        <input
                          name="full_name"
                          value={editForm.full_name}
                          onChange={handleEditChange}
                          style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, width: 140, outline: 'none' }}
                        />
                      </td>
                      <td>
                        <select
                          name="role_id"
                          value={editForm.role_id}
                          onChange={handleEditChange}
                          style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, outline: 'none' }}
                        >
                          <option value={2}>Staff</option>
                          <option value={1}>Admin</option>
                        </select>
                      </td>
                      <td>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                          <input
                            type="checkbox"
                            name="is_active"
                            checked={editForm.is_active}
                            onChange={handleEditChange}
                          />
                          Aktif
                        </label>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => handleEditSubmit(user.user_id)}>Simpan</button>
                          <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={cancelEdit}>Batal</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // ── View Mode ──
                    <>
                      <td>{i + 1}</td>
                      <td>{user.user_name}</td>
                      <td>{user.full_name}</td>
                      <td>
                        <span className={`badge badge-${user.role?.role_code === 'ADMIN' ? 'info' : 'default'}`}>
                          {ROLE_LABELS[user.role_id] || user.role?.role_code || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.is_active ? 'badge-success' : 'badge-secondary'}`}>
                          {user.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-edit" onClick={() => startEdit(user)}>Edit</button>
                        <button className="btn-delete" style={{ marginLeft: 8 }} onClick={() => handleDelete(user.user_id, user.user_name)}>Hapus</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}