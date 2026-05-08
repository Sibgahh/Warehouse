import prisma from '../config/prisma.js';

/**
 * Helper: parse date filter dari query params
 * Mendukung: ?start_date=2026-01-01&end_date=2026-12-31
 */
function parseDateFilter(start_date, end_date) {
  const where = {};

  if (start_date) {
    where.gte = new Date(start_date);
  }
  if (end_date) {
    // End date inclusive: set ke akhir hari
    const end = new Date(end_date);
    end.setHours(23, 59, 59, 999);
    where.lte = end;
  }

  return Object.keys(where).length > 0 ? where : undefined;
}

/**
 * GET /api/reports/orders-per-supplier
 *
 * Total order per supplier, dengan breakdown per status.
 * Filter: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 *
 * SECURITY FIX: Menggunakan $queryRaw (template tag) — parameterized,
 * TIDAK ada string interpolation. ? placeholder di-escape secara type-safe
 * oleh Prisma, menangkal SQL injection.
 */
export const ordersPerSupplier = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    // ─── Parameterized date range ───
    // Selalu gunakan $queryRaw (template tag), BUKAN $queryRawUnsafe.
    // Parameter di-pass sebagai template values, bukan di-interpolasi.
    const startParam = start_date || '1970-01-01';
    const endParam = end_date
      ? `${end_date} 23:59:59`
      : '2099-12-31 23:59:59';

    // ─── Raw SQL parameterized (aman) ───
    // ${placeholder} = parameterized, di-escape oleh Prisma.
    // JANJAN tidak pakai string interpolation langsung di SQL string.
    const results = await prisma.$queryRaw`
      SELECT
        s.supplier_id,
        s.supplier_code,
        s.supplier_name,
        COUNT(o.order_id)                                                    AS total_orders,
        SUM(CASE WHEN os.status_code = '10' THEN 1 ELSE 0 END)              AS orders_open,
        SUM(CASE WHEN os.status_code = '20' THEN 1 ELSE 0 END)              AS orders_in_transit,
        SUM(CASE WHEN os.status_code IN ('30','40') THEN 1 ELSE 0 END)      AS orders_received,
        SUM(CASE WHEN os.status_code = '50' THEN 1 ELSE 0 END)              AS orders_cancelled,
        COALESCE(SUM(detail_agg.total_qty_ordered), 0)                       AS total_qty_ordered,
        COALESCE(SUM(detail_agg.total_qty_received), 0)                      AS total_qty_received,
        COALESCE(SUM(detail_agg.total_items), 0)                             AS total_line_items
      FROM suppliers s
      INNER JOIN orders o ON o.supplier_id = s.supplier_id
      INNER JOIN order_statuses os ON os.order_status_id = o.order_status_id
      LEFT JOIN (
        SELECT
          od.order_id,
          SUM(od.qty_ordered)  AS total_qty_ordered,
          SUM(COALESCE(od.qty_received, 0)) AS total_qty_received,
          COUNT(od.order_detail_id) AS total_items
        FROM order_details od
        GROUP BY od.order_id
      ) detail_agg ON detail_agg.order_id = o.order_id
      WHERE o.created_at BETWEEN ${startParam} AND ${endParam}
      GROUP BY s.supplier_id, s.supplier_code, s.supplier_name
      ORDER BY total_orders DESC
    `;

    // ─── Convert BigInt fields ───
    const data = results.map((row) => ({
      supplier_id: Number(row.supplier_id),
      supplier_code: row.supplier_code?.trim(),
      supplier_name: row.supplier_name,
      total_orders: Number(row.total_orders),
      orders_open: Number(row.orders_open),
      orders_in_transit: Number(row.orders_in_transit),
      orders_received: Number(row.orders_received),
      orders_cancelled: Number(row.orders_cancelled),
      total_qty_ordered: Number(row.total_qty_ordered),
      total_qty_received: Number(row.total_qty_received),
      total_line_items: Number(row.total_line_items),
    }));

    res.status(200).json({
      success: true,
      message: 'Laporan order per supplier',
      filter: {
        start_date: start_date || null,
        end_date: end_date || null,
      },
      summary: {
        total_suppliers: data.length,
        total_orders: data.reduce((sum, r) => sum + r.total_orders, 0),
      },
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/qty-per-item
 *
 * Total qty ordered & received per item, across all orders.
 * Filter: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&supplier_id=X
 *
 * SECURITY FIX: Menggunakan $queryRaw (template tag) dengan parameterized
 * supplier_id via tagged template. String interpolation DIHAPUS.
 */
export const qtyPerItem = async (req, res, next) => {
  try {
    const { start_date, end_date, supplier_id } = req.query;

    const startParam = start_date || '1970-01-01';
    const endParam = end_date
      ? `${end_date} 23:59:59`
      : '2099-12-31 23:59:59';

    // ─── Supplier filter: parameterized (aman) ───
    // supplier_id di-pass sebagai tagged-template value,
    // BUKAN di-interpolasi langsung ke SQL string.
    const supplierNum = supplier_id ? Number(supplier_id) : null;

    // ─── SQL parameterized via $queryRaw ───
    const results = supplierNum
      ? await prisma.$queryRaw`
          SELECT
            i.item_id,
            i.item_name,
            i.description,
            i.unit_cost,
            i.unit_retail,
            s.supplier_code,
            s.supplier_name,
            COUNT(DISTINCT o.order_id)                   AS total_orders,
            SUM(od.qty_ordered)                          AS total_qty_ordered,
            SUM(COALESCE(od.qty_received, 0))            AS total_qty_received,
            SUM(COALESCE(od.qty_cancelled, 0))           AS total_qty_cancelled,
            SUM(od.qty_ordered) - SUM(COALESCE(od.qty_received, 0))
              - SUM(COALESCE(od.qty_cancelled, 0))       AS qty_outstanding,
            SUM(od.qty_ordered * i.unit_cost)             AS total_cost_value
          FROM order_details od
          INNER JOIN orders o ON o.order_id = od.order_id
          INNER JOIN items i ON i.item_id = od.item_id
          INNER JOIN suppliers s ON s.supplier_id = i.supplier_id
          WHERE o.created_at BETWEEN ${startParam} AND ${endParam}
            AND o.supplier_id = ${supplierNum}
          GROUP BY i.item_id, i.item_name, i.description, i.unit_cost, i.unit_retail,
                   s.supplier_code, s.supplier_name
          ORDER BY total_qty_ordered DESC
        `
      : await prisma.$queryRaw`
          SELECT
            i.item_id,
            i.item_name,
            i.description,
            i.unit_cost,
            i.unit_retail,
            s.supplier_code,
            s.supplier_name,
            COUNT(DISTINCT o.order_id)                   AS total_orders,
            SUM(od.qty_ordered)                          AS total_qty_ordered,
            SUM(COALESCE(od.qty_received, 0))            AS total_qty_received,
            SUM(COALESCE(od.qty_cancelled, 0))           AS total_qty_cancelled,
            SUM(od.qty_ordered) - SUM(COALESCE(od.qty_received, 0))
              - SUM(COALESCE(od.qty_cancelled, 0))       AS qty_outstanding,
            SUM(od.qty_ordered * i.unit_cost)             AS total_cost_value
          FROM order_details od
          INNER JOIN orders o ON o.order_id = od.order_id
          INNER JOIN items i ON i.item_id = od.item_id
          INNER JOIN suppliers s ON s.supplier_id = i.supplier_id
          WHERE o.created_at BETWEEN ${startParam} AND ${endParam}
          GROUP BY i.item_id, i.item_name, i.description, i.unit_cost, i.unit_retail,
                   s.supplier_code, s.supplier_name
          ORDER BY total_qty_ordered DESC
        `;

    const data = results.map((row) => ({
      item_id: Number(row.item_id),
      item_name: row.item_name?.trim(),
      description: row.description,
      unit_cost: Number(row.unit_cost),
      unit_retail: Number(row.unit_retail),
      supplier_code: row.supplier_code?.trim(),
      supplier_name: row.supplier_name,
      total_orders: Number(row.total_orders),
      total_qty_ordered: Number(row.total_qty_ordered),
      total_qty_received: Number(row.total_qty_received),
      total_qty_cancelled: Number(row.total_qty_cancelled),
      qty_outstanding: Number(row.qty_outstanding),
      total_cost_value: Number(row.total_cost_value),
    }));

    res.status(200).json({
      success: true,
      message: 'Laporan qty per item',
      filter: {
        start_date: start_date || null,
        end_date: end_date || null,
        supplier_id: supplierNum,
      },
      summary: {
        total_items: data.length,
        grand_total_qty_ordered: data.reduce((s, r) => s + r.total_qty_ordered, 0),
        grand_total_qty_received: data.reduce((s, r) => s + r.total_qty_received, 0),
        grand_total_cost_value: data.reduce((s, r) => s + r.total_cost_value, 0),
      },
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/summary
 *
 * Dashboard summary: quick overview angka-angka penting.
 */
export const summary = async (_req, res, next) => {
  try {
    const [
      totalOrders,
      totalSuppliers,
      totalItems,
      totalWarehouses,
      ordersByStatus,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.supplier.count({ where: { is_active: true } }),
      prisma.item.count({ where: { status: 'A' } }),
      prisma.warehouse.count({ where: { status: 'A' } }),
      prisma.order.groupBy({
        by: ['order_status_id'],
        _count: { order_id: true },
      }),
    ]);

    // ─── Enrich status names ───
    const statuses = await prisma.orderStatus.findMany();
    const statusMap = Object.fromEntries(
      statuses.map((s) => [s.order_status_id, s.status_name])
    );

    const orderStatusBreakdown = ordersByStatus.map((g) => ({
      status_name: statusMap[g.order_status_id] || 'Unknown',
      count: g._count.order_id,
    }));

    res.status(200).json({
      success: true,
      message: 'Dashboard summary',
      data: {
        total_orders: totalOrders,
        total_active_suppliers: totalSuppliers,
        total_active_items: totalItems,
        total_active_warehouses: totalWarehouses,
        orders_by_status: orderStatusBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};