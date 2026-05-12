import { useEffect, useMemo, useState } from 'react';
import { createRoleMenu, deleteRoleMenu, getMenus, getRoleMenus, getRoles } from '../services/api';
import { Link } from 'react-router-dom';
import FeedbackModal from '../components/FeedbackModal';

export default function RoleMenus() {
  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null); // `${role_id}_${menu_id}`
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const isAdminRole = (role) => String(role?.role_code || '').toUpperCase() === 'ADMIN';

  const loadAssignments = async () => {
    const { data } = await getRoleMenus();
    setAssignments(data.data || []);
    return data.data || [];
  };

  // Pastikan admin selalu memiliki akses ke semua menu. Membuat assignment
  // yang belum ada agar konsisten dengan UI yang menampilkan admin sebagai
  // selalu-checked.
  const ensureAdminHasAllMenus = async (roleList, menuList, currentAssignments) => {
    const adminRole = roleList.find(isAdminRole);
    if (!adminRole) return currentAssignments;

    const existingMenuIds = new Set(
      currentAssignments
        .filter((a) => String(a.role_id) === String(adminRole.role_id))
        .map((a) => String(a.menu_id))
    );
    const missing = menuList.filter((m) => !existingMenuIds.has(String(m.menu_id)));
    if (missing.length === 0) return currentAssignments;

    await Promise.all(
      missing.map((m) =>
        createRoleMenu({ role_id: Number(adminRole.role_id), menu_id: Number(m.menu_id) })
      )
    );
    return await loadAssignments();
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [roleRes, menuRes] = await Promise.all([getRoles(), getMenus()]);
        const roleList = roleRes.data.data || [];
        const menuList = menuRes.data.data || [];
        setRoles(roleList);
        setMenus(menuList);
        const initial = await loadAssignments();
        await ensureAdminHasAllMenus(roleList, menuList, initial);
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat role menu.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const flash = (msg, type = 'error') => {
    if (type === 'success') {
      setSuccess(msg);
      setError('');
      setTimeout(() => setSuccess(''), 2000);
    } else {
      setError(msg);
      setSuccess('');
    }
  };

  const assignmentMap = useMemo(() => {
    const map = {};
    for (const a of assignments) {
      map[`${a.role_id}_${a.menu_id}`] = a.role_menu_id;
    }
    return map;
  }, [assignments]);

  const filteredMenus = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return menus;
    return menus.filter((m) =>
      String(m.menu_name || '').toLowerCase().includes(q) ||
      String(m.menu_sequence || '').toLowerCase().includes(q)
    );
  }, [menus, search]);

  const toggle = async (role, menuId) => {
    if (isAdminRole(role)) return; // admin tidak bisa diubah
    const key = `${role.role_id}_${menuId}`;
    const existingId = assignmentMap[key];
    setSavingKey(key);
    try {
      if (existingId) {
        await deleteRoleMenu(existingId);
        flash('Akses dicabut.', 'success');
      } else {
        await createRoleMenu({ role_id: Number(role.role_id), menu_id: Number(menuId) });
        flash('Akses ditambahkan.', 'success');
      }
      await loadAssignments();
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal mengubah akses.');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/access-config" className="btn-secondary" title="Kembali ke Alur" style={{ padding: '6px 10px' }}>
              ←
            </Link>
            <h1 style={{ margin: 0 }}>Role Menus</h1>
          </div>
          <p className="page-subtitle">Centang menu untuk tiap role. Perubahan tersimpan otomatis.</p>
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
                placeholder="Cari menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Menu</th>
                  <th>Sequence</th>
                  {roles.map((r) => (
                    <th key={r.role_id} style={{ textAlign: 'center' }}>{r.role_name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMenus.map((menu, i) => (
                  <tr key={menu.menu_id}>
                    <td>{i + 1}</td>
                    <td className="text-bold">{menu.menu_name}</td>
                    <td>{menu.menu_sequence}</td>
                    {roles.map((r) => {
                      const key = `${r.role_id}_${menu.menu_id}`;
                      const isAdmin = isAdminRole(r);
                      const checked = isAdmin || Boolean(assignmentMap[key]);
                      const isSaving = savingKey === key;
                      const disabled = isAdmin || isSaving;
                      return (
                        <td key={r.role_id} style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(r, menu.menu_id)}
                            disabled={disabled}
                            title={isAdmin ? 'Admin selalu akses semua menu' : undefined}
                            style={{
                              width: 18,
                              height: 18,
                              cursor: disabled ? 'not-allowed' : 'pointer',
                              opacity: isAdmin ? 0.7 : 1,
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {filteredMenus.length === 0 && (
                  <tr><td colSpan={3 + roles.length} style={{ textAlign: 'center', padding: 20 }}>Belum ada menu.</td></tr>
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
