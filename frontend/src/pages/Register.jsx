import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/api';

const ROLES = [
  { value: '2', label: 'Staff' },
];

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    roleId: '2', // Default ke Staff — ADMIN cuma dipilih oleh admin
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!form.username.trim() || !form.fullName.trim() || !form.password.trim()) {
      setError('Semua field wajib diisi.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({
        user_name: form.username.trim(),
        full_name: form.fullName.trim(),
        password: form.password,
        role_id: parseInt(form.roleId),
      });
      alert('User berhasil ditambahkan!');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registrasi gagal. Coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Manajemen User</h1>
        <p className="auth-subtitle">
          Tambah user baru — hanya untuk{' '}
          <span className="dev-badge">ADMIN</span>
        </p>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              placeholder="cth: admin"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="fullName">Nama Lengkap</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              placeholder="cth: Administrator"
              disabled={loading}
            />
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
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Konfirmasi Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Ulangi password"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="roleId">Role</label>
            <select
              id="roleId"
              name="roleId"
              value={form.roleId}
              onChange={handleChange}
              disabled={loading}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Mendaftar...
              </>
            ) : (
              'Daftar'
            )}
          </button>
        </form>

      </div>
    </div>
  );
}