import fs from 'fs';

const hash = '$2b$10$GHhE84Xs15Wdxk4Iy3n3VeRwmR1jPguGSpzMgcj2hF5b2crv9bRCW';

let sql = '';
sql += 'USE warehouse_test;\n\n';

sql += 'SET FOREIGN_KEY_CHECKS = 0;\n';
sql += 'DELETE FROM order_details;\n';
sql += 'DELETE FROM orders;\n';
sql += 'DELETE FROM inventory;\n';
sql += 'DELETE FROM items;\n';
sql += 'DELETE FROM suppliers;\n';
sql += 'DELETE FROM stores;\n';
sql += 'DELETE FROM warehouses;\n';
sql += 'DELETE FROM role_submenus;\n';
sql += 'DELETE FROM role_menus;\n';
sql += 'DELETE FROM submenus;\n';
sql += 'DELETE FROM menus;\n';
sql += 'DELETE FROM order_statuses;\n';
sql += 'DELETE FROM users;\n';
sql += 'DELETE FROM roles;\n';
sql += 'SET FOREIGN_KEY_CHECKS = 1;\n\n';

// Roles (4 cols)
sql += '-- 1. Roles\n';
sql += "INSERT INTO roles (role_id, role_code, role_name, is_active) VALUES\n";
sql += "  (1, 'ADMIN', 'Administrator', 1),\n";
sql += "  (2, 'STAFF', 'Staff', 1),\n";
sql += "  (3, 'MANAGER', 'Manager', 1);\n\n";

// Users (10 cols)
sql += '-- 2. Users\n';
sql += "INSERT INTO users (user_id, user_name, full_name, password, role_id, is_active, must_change_password, is_login, created_at, updated_at) VALUES\n";
sql += "  (1, 'admin', 'Budi Santoso', '" + hash + "', 1, 1, 0, 0, NOW(), NULL),\n";
sql += "  (2, 'staff1', 'Siti Rahayu', '" + hash + "', 2, 1, 0, 0, NOW(), NULL),\n";
sql += "  (3, 'staff2', 'Ahmad Fauzi', '" + hash + "', 2, 1, 0, 0, NOW(), NULL),\n";
sql += "  (4, 'manager1', 'Dewi Lestari', '" + hash + "', 3, 1, 0, 0, NOW(), NULL);\n\n";

// Warehouses (13 cols)
sql += '-- 3. Warehouses\n';
sql += "INSERT INTO warehouses (warehouse_id, warehouse_code, warehouse_name, email, phone_number, city, regency, address, status, created_at, created_id, updated_at, updated_id) VALUES\n";
sql += "  (1, 'WH01', 'Gudang Utama Jakarta', 'gudang.jkt@perusahaan.com', '021-5550001', 'Jakarta Utara', 'Jakarta', 'Jl. Industri Raya No. 10, Tanjung Priok', 'A', NOW(), 1, NULL, NULL),\n";
sql += "  (2, 'WH02', 'Gudang Surabaya', 'gudang.sby@perusahaan.com', '031-5550002', 'Surabaya', 'Surabaya', 'Jl. Rungkut Madya No. 25, Rungkut', 'A', NOW(), 1, NULL, NULL),\n";
sql += "  (3, 'WH03', 'Gudang Bandung', 'gudang.bdg@perusahaan.com', '022-5550003', 'Bandung', 'Bandung', 'Jl. Pasteur No. 88, Sukajadi', 'A', NOW(), 1, NULL, NULL);\n\n";

// Suppliers (13 cols)
sql += '-- 4. Suppliers\n';
sql += "INSERT INTO suppliers (supplier_id, supplier_code, supplier_name, email, phone_number, city, regency, address, is_active, created_at, created_id, updated_at, updated_id) VALUES\n";
sql += "  (1, 'SUP001', 'PT Sumber Makmur Jaya', 'marketing@supplier1.com', '021-8880001', 'Jakarta', 'Jakarta Barat', 'Jl. Puri Indah Raya Blok A-15', 1, NOW(), 1, NULL, NULL),\n";
sql += "  (2, 'SUP002', 'CV Berkah Trading', 'sales@berkah-tc.com', '024-8880002', 'Semarang', 'Semarang', 'Jl. Pemuda No. 45-47', 1, NOW(), 1, NULL, NULL),\n";
sql += "  (3, 'SUP003', 'PT Indochem Corpora', 'info@indochem.co.id', '031-8880003', 'Surabaya', 'Surabaya', 'Jl. Rungkut Harapan Blok G-12', 1, NOW(), 1, NULL, NULL),\n";
sql += "  (4, 'SUP004', 'UD Karya Bahari', 'kontak@karyabahari.com', '022-8880004', 'Bandung', 'Bandung', 'Jl. Braga No. 100, Sumur Bandung', 1, NOW(), 1, NULL, NULL),\n";
sql += "  (5, 'SUP005', 'PT Tiga Dara Chemical', 'order@3dara.com', '0271-8880005', 'Solo', 'Surakarta', 'Jl. Slamet Riyadi No. 201', 1, NOW(), 1, NULL, NULL);\n\n";

// Stores (13 cols)
sql += '-- 5. Stores\n';
sql += "INSERT INTO stores (store_id, store_code, store_name, email, phone_number, city, regency, address, status, created_at, created_id, updated_at, updated_id) VALUES\n";
sql += "  (1, 'ST01', 'Toko Pusat Mangga Besar', 'toko1@perusahaan.com', '021-6660001', 'Jakarta Barat', 'Jakarta Barat', 'Jl. Mangga Besar No. 22, Tambora', 'A', NOW(), 1, NULL, NULL),\n";
sql += "  (2, 'ST02', 'Cabang Kelapa Gading', 'toko2@perusahaan.com', '021-6660002', 'Jakarta Utara', 'Jakarta Utara', 'Jl. Boulevar Raya Blok LB-3', 'A', NOW(), 1, NULL, NULL),\n";
sql += "  (3, 'ST03', 'Gerai Surabaya Barat', 'toko3@perusahaan.com', '031-6660003', 'Surabaya', 'Surabaya', 'Jl. Diponegoro No. 55, Wonokromo', 'A', NOW(), 1, NULL, NULL),\n";
sql += "  (4, 'ST04', 'Outlet Bandung Dago', 'toko4@perusahaan.com', '022-6660004', 'Bandung', 'Bandung', 'Jl. Ir. H. Juanda No. 70, Dago', 'A', NOW(), 1, NULL, NULL);\n\n";

// Order Statuses (3 cols)
sql += '-- 6. Order Statuses\n';
sql += "INSERT INTO order_statuses (order_status_id, status_code, status_name) VALUES\n";
sql += "  (1, '10', 'Open'),\n";
sql += "  (2, '20', 'InTransit'),\n";
sql += "  (3, '30', 'Receiving Started'),\n";
sql += "  (4, '40', 'Receiving Verified'),\n";
sql += "  (5, '50', 'Cancelled');\n\n";

// Menus (5 cols)
sql += '-- 7. Menus\n';
sql += "INSERT INTO menus (menu_id, menu_sequence, menu_name, menu_link, is_active) VALUES\n";
sql += "  (1, '01', 'Dashboard', '/dashboard', 1),\n";
sql += "  (2, '02', 'Purchasing', '#', 1),\n";
sql += "  (3, '03', 'Inventory', '#', 1),\n";
sql += "  (4, '04', 'Suppliers', '/suppliers', 1),\n";
sql += "  (5, '05', 'Items', '/items', 1),\n";
sql += "  (6, '06', 'Orders', '/orders', 1),\n";
sql += "  (7, '07', 'Stores', '/stores', 1),\n";
sql += "  (8, '08', 'Reports', '/reports', 1);\n\n";

// Items - 14 cols: item_id, item_name, description, status, std_qty, min_stock, max_stock, unit_cost, unit_retail, supplier_id, created_at, created_id, updated_at, updated_id
// Each row: id, name, desc, status, std_qty, min_stock, max_stock, unit_cost, unit_retail, supplier_id, created_id
// 14 values = id, name, desc, status, std_qty, min_stock, max_stock, unit_cost, unit_retail, supplier_id, NOW(), created_id, NULL, NULL
sql += '-- 8. Items\n';
sql += "INSERT INTO items (item_id, item_name, description, status, std_qty, min_stock, max_stock, unit_cost, unit_retail, supplier_id, created_at, created_id, updated_at, updated_id) VALUES\n";
sql += "  (1, 'BRG000001', 'Sabun Cair 500ml', 'A', 12.00, 50.00, 500.00, 8500.00, 12500.00, 1, NOW(), 1, NULL, NULL),\n";
sql += "  (2, 'BRG000002', 'Shampo Botol 350ml', 'A', 8.00, 30.00, 300.00, 12000.00, 17500.00, 1, NOW(), 1, NULL, NULL),\n";
sql += "  (3, 'BRG000003', 'Pasta Gigi 150g', 'A', 24.00, 100.00, 1000.00, 4500.00, 7500.00, 2, NOW(), 1, NULL, NULL),\n";
sql += "  (4, 'BRG000004', 'Mie Instan 24pcs', 'A', 24.00, 50.00, 400.00, 35000.00, 48000.00, 2, NOW(), 1, NULL, NULL),\n";
sql += "  (5, 'BRG000005', 'Kopi Sachet 50pcs', 'A', 50.00, 100.00, 800.00, 65000.00, 90000.00, 3, NOW(), 1, NULL, NULL),\n";
sql += "  (6, 'BRG000006', 'Teh Celup 100s', 'A', 6.00, 30.00, 200.00, 28000.00, 40000.00, 3, NOW(), 1, NULL, NULL),\n";
sql += "  (7, 'BRG000007', 'Gula Pasir 1kg', 'A', 10.00, 50.00, 500.00, 14000.00, 18500.00, 5, NOW(), 1, NULL, NULL),\n";
sql += "  (8, 'BRG000008', 'Minyak Goreng 2L', 'A', 6.00, 20.00, 200.00, 22000.00, 28000.00, 5, NOW(), 1, NULL, NULL),\n";
sql += "  (9, 'BRG000009', 'Sabun Cuci 800ml', 'A', 8.00, 40.00, 300.00, 11000.00, 16500.00, 4, NOW(), 1, NULL, NULL),\n";
sql += "  (10, 'BRG000010', 'Pewangi Pod 30pcs', 'A', 30.00, 50.00, 400.00, 18000.00, 26000.00, 4, NOW(), 1, NULL, NULL),\n";
sql += "  (11, 'BRG000011', 'Sabun Batangan 12', 'A', 12.00, 50.00, 300.00, 7000.00, 10500.00, 1, NOW(), 1, NULL, NULL),\n";
sql += "  (12, 'BRG000012', 'Odol Anak 75g', 'A', 12.00, 40.00, 200.00, 5500.00, 9000.00, 2, NOW(), 1, NULL, NULL),\n";
sql += "  (13, 'BRG000013', 'Sosis Mini 1kg', 'A', 5.00, 20.00, 150.00, 55000.00, 72000.00, 3, NOW(), 1, NULL, NULL),\n";
sql += "  (14, 'BRG000014', 'Teh Botol 24pcs', 'A', 24.00, 50.00, 400.00, 36000.00, 48000.00, 3, NOW(), 1, NULL, NULL),\n";
sql += "  (15, 'BRG000015', 'Sabun Laundry 800gr', 'A', 10.00, 50.00, 300.00, 14000.00, 21000.00, 4, NOW(), 1, NULL, NULL);\n\n";

// Inventory - 6 cols: inventory_id, item_id, on_hand_qty, on_ordered_qty, created_at, last_updated_at
sql += '-- 9. Inventory\n';
sql += "INSERT INTO inventory (inventory_id, item_id, on_hand_qty, on_ordered_qty, created_at, last_updated_at) VALUES\n";
sql += "  (1, 1, 150.00, 0.00, NOW(), NULL),\n";
sql += "  (2, 2, 120.00, 50.00, NOW(), NULL),\n";
sql += "  (3, 3, 380.00, 0.00, NOW(), NULL),\n";
sql += "  (4, 4, 200.00, 0.00, NOW(), NULL),\n";
sql += "  (5, 5, 300.00, 100.00, NOW(), NULL),\n";
sql += "  (6, 6, 180.00, 0.00, NOW(), NULL),\n";
sql += "  (7, 7, 420.00, 0.00, NOW(), NULL),\n";
sql += "  (8, 8, 110.00, 0.00, NOW(), NULL),\n";
sql += "  (9, 9, 200.00, 80.00, NOW(), NULL),\n";
sql += "  (10, 10, 250.00, 0.00, NOW(), NULL),\n";
sql += "  (11, 11, 140.00, 0.00, NOW(), NULL),\n";
sql += "  (12, 12, 190.00, 0.00, NOW(), NULL),\n";
sql += "  (13, 13, 75.00, 50.00, NOW(), NULL),\n";
sql += "  (14, 14, 300.00, 0.00, NOW(), NULL),\n";
sql += "  (15, 15, 220.00, 0.00, NOW(), NULL);\n\n";

// Orders - 14 cols: order_id, order_number, warehouse_id, supplier_id, delivery_start_date, delivery_end_date, order_status_id, created_id, approval_id, created_at, last_updated_at, last_updated_id, verified_id, verified_at
sql += '-- 10. Orders\n';
sql += "INSERT INTO orders (order_id, order_number, warehouse_id, supplier_id, delivery_start_date, delivery_end_date, order_status_id, created_id, approval_id, created_at, last_updated_at, last_updated_id, verified_id, verified_at) VALUES\n";
sql += "  (1, 'PO-2026-001', 1, 1, '2026-05-10', '2026-05-15', 4, 2, 4, NOW(), NULL, NULL, 1, NOW()),\n";
sql += "  (2, 'PO-2026-002', 1, 3, '2026-05-12', '2026-05-18', 3, 2, 4, NOW(), NULL, NULL, NULL, NULL),\n";
sql += "  (3, 'PO-2026-003', 2, 2, '2026-05-11', '2026-05-16', 2, 3, 4, NOW(), NULL, NULL, NULL, NULL),\n";
sql += "  (4, 'PO-2026-004', 3, 4, '2026-05-13', '2026-05-20', 1, 2, 4, NOW(), NULL, NULL, NULL, NULL),\n";
sql += "  (5, 'PO-2026-005', 1, 5, '2026-05-15', '2026-05-22', 4, 2, 4, NOW(), NULL, NULL, 1, NOW());\n\n";

// Order Details - 12 cols: order_detail_id, order_id, item_id, qty_ordered, qty_received, qty_cancelled, reason_cancelled, created_id, created_at, updated_at, received_id, last_receive_dttm
sql += '-- 11. Order Details\n';
sql += "INSERT INTO order_details (order_detail_id, order_id, item_id, qty_ordered, qty_received, qty_cancelled, reason_cancelled, created_id, created_at, updated_at, received_id, last_receive_dttm) VALUES\n";
sql += "  (1, 1, 1, 50.00, 50.00, NULL, NULL, 2, NOW(), NULL, 1, NOW()),\n";
sql += "  (2, 1, 2, 30.00, 30.00, NULL, NULL, 2, NOW(), NULL, 1, NOW()),\n";
sql += "  (3, 1, 11, 40.00, 40.00, NULL, NULL, 2, NOW(), NULL, 1, NOW()),\n";
sql += "  (4, 2, 5, 100.00, 60.00, NULL, NULL, 2, NOW(), NULL, NULL, NULL),\n";
sql += "  (5, 2, 6, 80.00, 80.00, NULL, NULL, 2, NOW(), NULL, NULL, NULL),\n";
sql += "  (6, 3, 3, 200.00, 0.00, NULL, NULL, 3, NOW(), NULL, NULL, NULL),\n";
sql += "  (7, 3, 12, 100.00, 0.00, NULL, NULL, 3, NOW(), NULL, NULL, NULL),\n";
sql += "  (8, 4, 9, 100.00, 0.00, NULL, NULL, 2, NOW(), NULL, NULL, NULL),\n";
sql += "  (9, 4, 10, 80.00, 0.00, NULL, NULL, 2, NOW(), NULL, NULL, NULL),\n";
sql += "  (10, 4, 15, 120.00, 0.00, NULL, NULL, 2, NOW(), NULL, NULL, NULL),\n";
sql += "  (11, 5, 7, 200.00, 200.00, NULL, NULL, 2, NOW(), NULL, 1, NOW()),\n";
sql += "  (12, 5, 8, 100.00, 100.00, NULL, NULL, 2, NOW(), NULL, 1, NOW()),\n";
sql += "  (13, 5, 4, 150.00, 150.00, NULL, NULL, 2, NOW(), NULL, 1, NOW());\n\n";

sql += '-- Seed selesai\n';
sql += '-- Login: admin/password123 | staff1/password123 | staff2/password123 | manager1/password123\n';

fs.writeFileSync('d:/Tugas/POS/seed_data.sql', sql, 'utf8');
console.log('File written, bytes:', sql.length);