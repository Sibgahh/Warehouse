import { useState, useEffect } from 'react';
import { getRoleFromToken } from '../utils/token.js';

const ROLE_OPTIONS = [
  { value: '1', label: 'Admin' },
  { value: '2', label: 'Staff' },
];

export default function Users() {
  const role = getRoleFromToken();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    user_name: '',
    full_name: '',
    password: '',
    role_id: '2',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.user_name.trim() || !form.full_name.trim() || !form.password.trim()) {
      setError('Semua field wajib diisi.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

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
          role_id: parseInt(form.role_id),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Gagal menambah user.');
        return;
      }

      setSuccess('User berhasil ditambahkan!');
      setForm({ user_name: '', full_name: '', password: '', role_id: '2' });
      setShowForm(false);
    } catch (err) {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setSubmitting(false);
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
            setShowForm((prev) => !prev);
            setError('');
            setSuccess('');
            setForm({ user_name: '', full_name: '', password: '', role_id: '2' });
          }}
        >
          {showForm ? 'Batal' : '+ Tambah User'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          {success}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '24px', maxWidth: '480px' }}>
          <h3 style={{ marginBottom: '16px' }}>Tambah User Baru</h3>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="user_name">Username</label>
              <input
                id="user_name"
                name="user_name"
                type="text"
                autoComplete="username"
                value={form.user_name}
                onChange={handleChange}
                placeholder="cth: staff01"
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="full_name">Nama Lengkap</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handleChange}
                placeholder="cth: John Doe"
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role_id">Role</label>
              <select
                id="role_id"
                name="role_id"
                value={form.role_id}
                onChange={handleChange}
                disabled={submitting}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 karakter"
                disabled={submitting}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
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
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', color: '#999', padding: '32px' }}>
                {loading ? 'Memuat...' : 'Belum ada data user.'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}