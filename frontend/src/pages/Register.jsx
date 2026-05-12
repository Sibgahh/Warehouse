import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerPublic } from '../services/api';
import ModalDialog from '../components/ModalDialog';

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    fullName: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
      await registerPublic({
        user_name: form.username.trim(),
        full_name: form.fullName.trim(),
        password: form.password,
      });
      setShowSuccessModal(true);
    } catch (err) {
      const apiMessage = err.response?.data?.errors?.[0]?.message || err.response?.data?.message;
      setError(
        apiMessage || 'Registrasi gagal. Coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">Warehouse Hypermart</div>
        <h1>Daftar</h1>
        <p className="auth-subtitle">
          Daftar akun baru (otomatis role Staff)
        </p>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

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

        <div className="auth-footer">
          <span>Sudah punya akun?</span>{' '}
          <Link to="/login" className="auth-link">Login</Link>
        </div>

      </div>
      <ModalDialog
        open={showSuccessModal}
        title="Registrasi Berhasil"
        message="Akun berhasil dibuat. Silakan login."
        confirmText="Ke Login"
        onConfirm={() => {
          setShowSuccessModal(false);
          navigate('/login');
        }}
        onCancel={() => setShowSuccessModal(false)}
      />
    </div>
  );
}