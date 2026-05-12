import { useEffect, useMemo, useState } from 'react';
import { createRoleSubmenu, deleteRoleSubmenu, getRoleSubmenus, getRoles, getSubmenus } from '../services/api';
import { Link } from 'react-router-dom';
import FeedbackModal from '../components/FeedbackModal';

export default function RoleSubmenus() {
  const [roles, setRoles] = useState([]);
  const [submenus, setSubmenus] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingSubmenuId, setSavingSubmenuId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const selectedRole = roles.find((r) => String(r.role_id) === String(selectedRoleId));

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [roleRes, submenuRes, assignmentRes] = await Promise.all([
          getRoles(),
          getSubmenus(),
          getRoleSubmenus(),
        ]);
        const roleList = roleRes.data.data || [];
        const submenuList = submenuRes.data.data || [];
        setRoles(roleList);
        setSubmenus(submenuList);
        setAllAssignments(assignmentRes.data.data || []);
        setSelectedRoleId(roleList[0]?.role_id ? String(roleList[0].role_id) : '');
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat role submenu.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const assignments = useMemo(
    () => allAssignments.filter((a) => String(a.role_id) === String(selectedRoleId)),
    [allAssignments, selectedRoleId]
  );
  const assignmentMap = useMemo(() => {
    const map = {};
    for (const item of assignments) {
      map[item.submenu_id] = item;
    }
    return map;
  }, [assignments]);
  const filteredSubmenus = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return submenus;
    return submenus.filter((s) =>
      String(s.submenu_name || '').toLowerCase().includes(q) ||
      String(s.menu?.menu_name || '').toLowerCase().includes(q) ||
      String(s.submenu_sequence || '').toLowerCase().includes(q)
    );
  }, [submenus, search]);

  const refresh = async () => {
    const { data } = await getRoleSubmenus();
    setAllAssignments(data.data || []);
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

  const toggleSubmenu = async (submenuId) => {
    if (!selectedRoleId) return;
    const existing = assignmentMap[submenuId];
    setSavingSubmenuId(submenuId);
    try {
      if (existing) {
        await deleteRoleSubmenu(existing.role_submenu_id);
        flash('Akses submenu dicabut.', 'success');
      } else {
        await createRoleSubmenu({ role_id: Number(selectedRoleId), submenu_id: Number(submenuId) });
        flash('Akses submenu ditambahkan.', 'success');
      }
      await refresh();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal mengubah akses submenu.');
    } finally {
      setSavingSubmenuId(null);
    }
  };

  const bulkSet = async (grant) => {
    if (!selectedRoleId) return;
    const targetSubmenus = filteredSubmenus;
    for (const submenu of targetSubmenus) {
      const existing = assignmentMap[submenu.submenu_id];
      if ((grant && !existing) || (!grant && existing)) {
        if (grant) {
          await createRoleSubmenu({ role_id: Number(selectedRoleId), submenu_id: Number(submenu.submenu_id) });
        } else {
          await deleteRoleSubmenu(existing.role_submenu_id);
        }
      }
    }
    await refresh();
    flash(grant ? 'Semua submenu terfilter diizinkan.' : 'Semua submenu terfilter dicabut.', 'success');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/access-config" className="btn-secondary" title="Kembali ke Alur" style={{ padding: '6px 10px' }}>
              ←
            </Link>
            <h1 style={{ margin: 0 }}>Role Submenus</h1>
          </div>
          <p className="page-subtitle">Atur submenu apa saja yang bisa diakses tiap role</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Cara pakai</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          1) Pilih role. 2) Centang submenu yang boleh diakses. 3) Perubahan langsung tersimpan.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: 16 }}>
          <label style={{ display: 'block', marginBottom: 10, fontWeight: 600 }}>Pilih Role</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {roles.map((role) => {
              const active = String(selectedRoleId) === String(role.role_id);
              return (
                <button
                  key={role.role_id}
                  type="button"
                  className={active ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setSelectedRoleId(String(role.role_id))}
                >
                  {role.role_name} ({role.role_code})
                </button>
              );
            })}
          </div>
          <p style={{ marginTop: 10, marginBottom: 0, color: 'var(--text-muted)' }}>
            Role aktif: <strong>{selectedRole ? `${selectedRole.role_name} (${selectedRole.role_code})` : '-'}</strong>
          </p>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button type="button" className="btn-secondary" onClick={() => bulkSet(true)}>Izinkan Semua (Filter)</button>
            <button type="button" className="btn-secondary" onClick={() => bulkSet(false)}>Cabut Semua (Filter)</button>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="table-loading"><span className="spinner large" /></div>
        ) : (
          <div className="table-wrapper">
            <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
              <input
                className="filter-input"
                placeholder="Cari submenu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Submenu</th>
                  <th>Menu</th>
                  <th>Izin</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmenus.map((s, i) => (
                  <tr key={s.submenu_id}>
                    <td>{i + 1}</td>
                    <td className="text-bold">{s.submenu_name}</td>
                    <td>{s.menu?.menu_name || '-'}</td>
                    <td>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(assignmentMap[s.submenu_id])}
                          onChange={() => toggleSubmenu(s.submenu_id)}
                          disabled={savingSubmenuId === s.submenu_id}
                        />
                        {savingSubmenuId === s.submenu_id ? 'Menyimpan...' : 'Izinkan'}
                      </label>
                    </td>
                  </tr>
                ))}
                {filteredSubmenus.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>Belum ada submenu.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FeedbackModal open={!!error} type="error" message={error} onClose={() => setError('')} />
      <FeedbackModal open={!!success} type="success" message={success} onClose={() => setSuccess('')} />
    </div>
  );
}
