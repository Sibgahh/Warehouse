import { useEffect, useMemo, useState } from 'react';
import { createRoleMenu, deleteRoleMenu, getMenus, getRoleMenusByRole, getRoles } from '../services/api';
import { Link } from 'react-router-dom';

export default function RoleMenus() {
  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMenuId, setSavingMenuId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const selectedRole = roles.find((r) => String(r.role_id) === String(selectedRoleId));

  const refreshAssignments = async (roleId) => {
    if (!roleId) {
      setAssignments([]);
      return;
    }
    const { data } = await getRoleMenusByRole(roleId);
    setAssignments(data.data?.assignments || []);
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
        const firstRoleId = roleList[0]?.role_id ? String(roleList[0].role_id) : '';
        setSelectedRoleId(firstRoleId);
        if (firstRoleId) await refreshAssignments(firstRoleId);
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
      setTimeout(() => setSuccess(''), 2500);
    } else {
      setError(msg);
      setSuccess('');
    }
  };

  const assignmentMap = useMemo(() => {
    const map = {};
    for (const item of assignments) {
      map[item.menu_id] = item;
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

  const toggleMenu = async (menuId) => {
    if (!selectedRoleId) return;
    const existing = assignmentMap[menuId];
    setSavingMenuId(menuId);
    try {
      if (existing) {
        await deleteRoleMenu(existing.role_menu_id);
        flash('Akses menu dicabut.', 'success');
      } else {
        await createRoleMenu({ role_id: Number(selectedRoleId), menu_id: Number(menuId) });
        flash('Akses menu ditambahkan.', 'success');
      }
      await refreshAssignments(selectedRoleId);
    } catch (err) {
      flash(err.response?.data?.message || 'Gagal mengubah akses menu.');
    } finally {
      setSavingMenuId(null);
    }
  };

  const bulkSet = async (grant) => {
    if (!selectedRoleId) return;
    const targetMenus = filteredMenus;
    for (const menu of targetMenus) {
      const existing = assignmentMap[menu.menu_id];
      if ((grant && !existing) || (!grant && existing)) {
        if (grant) {
          await createRoleMenu({ role_id: Number(selectedRoleId), menu_id: Number(menu.menu_id) });
        } else {
          await deleteRoleMenu(existing.role_menu_id);
        }
      }
    }
    await refreshAssignments(selectedRoleId);
    flash(grant ? 'Semua menu terfilter diizinkan.' : 'Semua menu terfilter dicabut.', 'success');
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
          <p className="page-subtitle">Atur menu mana yang boleh dilihat tiap role</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Cara pakai</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          1) Pilih role. 2) Centang menu yang diizinkan. 3) Perubahan tersimpan otomatis.
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
                  onClick={async () => {
                    const value = String(role.role_id);
                    setSelectedRoleId(value);
                    await refreshAssignments(value);
                  }}
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
                  <th>Izin</th>
                </tr>
              </thead>
              <tbody>
                {filteredMenus.map((menu, i) => (
                  <tr key={menu.menu_id}>
                    <td>{i + 1}</td>
                    <td className="text-bold">{menu.menu_name}</td>
                    <td>{menu.menu_sequence}</td>
                    <td>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(assignmentMap[menu.menu_id])}
                          onChange={() => toggleMenu(menu.menu_id)}
                          disabled={savingMenuId === menu.menu_id}
                        />
                        {savingMenuId === menu.menu_id ? 'Menyimpan...' : 'Izinkan'}
                      </label>
                    </td>
                  </tr>
                ))}
                {filteredMenus.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>Belum ada menu.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
