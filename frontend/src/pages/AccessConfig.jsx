import { Link } from 'react-router-dom';

const STEPS = [
  {
    no: 1,
    title: 'Siapkan Role',
    desc: 'Buat role dulu (misalnya ADMIN, MANAGER, STAFF) agar mapping akses jelas.',
    to: '/roles',
    action: 'Kelola Roles',
  },
  {
    no: 2,
    title: 'Atur Struktur Menu',
    desc: 'Buat menu utama dan submenu fitur yang ingin ditampilkan di sidebar.',
    links: [
      { to: '/menus', label: 'Kelola Menus' },
      { to: '/submenus', label: 'Kelola Submenus' },
    ],
  },
  {
    no: 3,
    title: 'Assign Akses per Role',
    desc: 'Pilih role, lalu centang menu/submenu yang boleh diakses.',
    links: [
      { to: '/role-menus', label: 'Assign Role Menus' },
      { to: '/role-submenus', label: 'Assign Role Submenus' },
    ],
  },
];

export default function AccessConfig() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Konfigurasi Akses</h1>
          <p className="page-subtitle">Alur paling simpel untuk setup menu dan hak akses role</p>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <p style={{ marginTop: 0, color: 'var(--text-muted)' }}>
          Ikuti langkah dari atas ke bawah. Jika sudah pernah setup, kamu bisa langsung lompat ke langkah yang ingin diubah.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {STEPS.map((step) => (
          <div key={step.no} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {step.no}
              </span>
              <div style={{ width: '100%' }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>{step.title}</h3>
                <p style={{ margin: '6px 0 12px', color: 'var(--text-muted)' }}>{step.desc}</p>

                {step.to && (
                  <Link to={step.to} className="btn-primary" style={{ display: 'inline-flex' }}>
                    {step.action}
                  </Link>
                )}

                {step.links && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {step.links.map((lnk) => (
                      <Link key={lnk.to} to={lnk.to} className="btn-secondary" style={{ display: 'inline-flex' }}>
                        {lnk.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
