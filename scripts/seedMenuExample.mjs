import prisma from "../src/config/prisma.js";

async function main() {
  // Normalisasi data lama: "Utama" -> "Dashboard"
  await prisma.$executeRawUnsafe(`
    UPDATE menus
    SET menu_name = 'Dashboard'
    WHERE menu_name = 'Utama'
  `);
  // Normalisasi data lama: "Transaksi" -> "Orders"
  await prisma.$executeRawUnsafe(`
    UPDATE menus
    SET menu_name = 'Orders'
    WHERE menu_name = 'Transaksi'
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE menus
    SET menu_icon = 'settings'
    WHERE menu_name = 'Konfigurasi Akses'
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE submenus s
    INNER JOIN menus m ON m.menu_id = s.menu_id
    SET s.submenu_icon = 'settings'
    WHERE m.menu_name = 'Konfigurasi Akses'
  `);
  await prisma.$executeRawUnsafe(`
    DELETE rs
    FROM role_submenus rs
    INNER JOIN submenus s ON s.submenu_id = rs.submenu_id
    INNER JOIN menus m ON m.menu_id = s.menu_id
    WHERE m.menu_name = 'Konfigurasi Akses'
      AND s.submenu_name IN ('Role Menus', 'Role Submenus', 'Order Details')
  `);
  await prisma.$executeRawUnsafe(`
    DELETE s
    FROM submenus s
    INNER JOIN menus m ON m.menu_id = s.menu_id
    WHERE m.menu_name = 'Konfigurasi Akses'
      AND s.submenu_name IN ('Role Menus', 'Role Submenus', 'Order Details')
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE submenus s
    INNER JOIN menus m ON m.menu_id = s.menu_id
    SET s.is_active = 1
    WHERE m.menu_name = 'Konfigurasi Akses'
      AND s.submenu_name IN ('Menus', 'Submenus', 'Konfigurasi Akses', 'Roles')
  `);

  // Menu master
  await prisma.$executeRawUnsafe(`
    INSERT IGNORE INTO menus (menu_sequence, menu_name, menu_icon, menu_link, is_submenu, is_active)
    VALUES
      ('10', 'Dashboard', 'dashboard', '/', 0, 1),
      ('20', 'Orders', 'orders', '/orders', 0, 1),
      ('30', 'Master Data', 'master', '#', 1, 1),
      ('40', 'Analisa', 'reports', '#', 1, 1),
      ('50', 'Admin', 'users', '#', 1, 1),
      ('60', 'Konfigurasi Akses', 'settings', '#', 1, 1)
  `);

  // Submenu master
  await prisma.$executeRawUnsafe(`
    INSERT IGNORE INTO submenus (menu_id, submenu_sequence, submenu_name, submenu_icon, submenu_link, is_active)
    SELECT m.menu_id, x.submenu_sequence, x.submenu_name, x.submenu_icon, x.submenu_link, 1
    FROM (
      SELECT 'Master Data' AS menu_name, '10' AS submenu_sequence, 'Suppliers' AS submenu_name, 'suppliers' AS submenu_icon, '/suppliers' AS submenu_link
      UNION ALL SELECT 'Master Data', '20', 'Items', 'items', '/items'
      UNION ALL SELECT 'Master Data', '30', 'Warehouses', 'warehouses', '/warehouses'
      UNION ALL SELECT 'Master Data', '40', 'Stores', 'warehouses', '/stores'
      UNION ALL SELECT 'Master Data', '50', 'Inventory', 'items', '/inventory'
      UNION ALL SELECT 'Analisa', '10', 'Reports', 'reports', '/reports'
      UNION ALL SELECT 'Admin', '10', 'Manajemen User', 'users', '/users'
      UNION ALL SELECT 'Konfigurasi Akses', '10', 'Menus', 'settings', '/menus'
      UNION ALL SELECT 'Konfigurasi Akses', '20', 'Submenus', 'settings', '/submenus'
      UNION ALL SELECT 'Konfigurasi Akses', '30', 'Konfigurasi Akses', 'settings', '/access-config'
      UNION ALL SELECT 'Konfigurasi Akses', '40', 'Roles', 'settings', '/roles'
      UNION ALL SELECT 'Konfigurasi Akses', '50', 'Order Statuses', 'settings', '/order-statuses'
    ) x
    INNER JOIN menus m ON m.menu_name = x.menu_name
  `);

  // Role -> Menu assignment
  await prisma.$executeRawUnsafe(`
    INSERT IGNORE INTO role_menus (role_id, menu_id)
    SELECT r.role_id, m.menu_id
    FROM roles r
    INNER JOIN menus m
      ON (
        (r.role_code = 'ADMIN' AND m.menu_name IN ('Dashboard', 'Orders', 'Master Data', 'Analisa', 'Admin', 'Konfigurasi Akses'))
        OR
        (r.role_code = 'MANAGER' AND m.menu_name IN ('Dashboard', 'Orders', 'Master Data', 'Analisa'))
        OR
        (r.role_code = 'STAFF' AND m.menu_name IN ('Dashboard', 'Orders'))
      )
    WHERE r.role_code IN ('ADMIN', 'MANAGER', 'STAFF')
  `);

  // Role -> Submenu assignment
  await prisma.$executeRawUnsafe(`
    INSERT IGNORE INTO role_submenus (role_id, submenu_id)
    SELECT r.role_id, s.submenu_id
    FROM roles r
    INNER JOIN submenus s
      ON (
        (r.role_code = 'ADMIN' AND s.submenu_name IN ('Suppliers', 'Items', 'Warehouses', 'Stores', 'Inventory', 'Reports', 'Manajemen User', 'Menus', 'Submenus', 'Konfigurasi Akses', 'Roles', 'Order Statuses'))
        OR
        (r.role_code = 'MANAGER' AND s.submenu_name IN ('Suppliers', 'Items', 'Warehouses', 'Stores', 'Inventory', 'Reports'))
      )
    WHERE r.role_code IN ('ADMIN', 'MANAGER')
  `);

  const [menus, submenus, roleMenus, roleSubmenus] = await Promise.all([
    prisma.menu.count(),
    prisma.submenu.count(),
    prisma.roleMenu.count(),
    prisma.roleSubmenu.count(),
  ]);

  console.log("Seed menu selesai:");
  console.log({ menus, submenus, roleMenus, roleSubmenus });
}

main()
  .catch((error) => {
    console.error("Gagal seed menu:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
