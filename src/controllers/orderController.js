import prisma from '../config/prisma.js';

// ─── Select fields untuk list orders ───
const orderSelect = {
  order_id: true,
  order_number: true,
  warehouse_id: true,
  supplier_id: true,
  delivery_start_date: true,
  delivery_end_date: true,
  order_status_id: true,
  created_id: true,
  approval_id: true,
  created_at: true,
  last_updated_at: true,
  verified_at: true,
  warehouse: {
    select: { warehouse_id: true, warehouse_code: true, warehouse_name: true },
  },
  supplier: {
    select: { supplier_id: true, supplier_code: true, supplier_name: true },
  },
  order_status: {
    select: { order_status_id: true, status_code: true, status_name: true },
  },
  created_by: {
    select: { user_id: true, full_name: true },
  },
  approved_by: {
    select: { user_id: true, full_name: true },
  },
  _count: {
    select: { order_details: true },
  },
};

// ─── Select fields untuk detail order (include line items) ───
const orderDetailSelect = {
  ...orderSelect,
  _count: undefined,
  order_details: {
    select: {
      order_detail_id: true,
      item_id: true,
      qty_ordered: true,
      qty_received: true,
      qty_cancelled: true,
      reason_cancelled: true,
      created_at: true,
      item: {
        select: {
          item_id: true,
          item_name: true,
          description: true,
          unit_cost: true,
          unit_retail: true,
        },
      },
      created_by: {
        select: { user_id: true, full_name: true },
      },
    },
  },
};

/**
 * Generate order number: PO-YYMMDD-XX
 *
 * SECURITY FIX: Dipanggil di DALAM transaction dengan row-level lock
 * (SELECT ... FOR UPDATE) untuk mencegah race condition saat 2+
 * request concurrently mencoba generate nomor yang sama.
 *
 * @param {object} tx - Prisma transaction client
 * @returns {string} contoh: "PO26050801"
 */
async function generateOrderNumber(tx) {
  const today = new Date();
  const dateStr =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');

  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  // ─── Atomic count dalam transaction dengan FOR UPDATE lock ───
  // Mengunci baris-baris yang match WHERE sehingga request lain
  // harus menunggu sampai transaction ini selesai.
  const [{ 'COUNT(*)': count }] = await tx.$queryRaw`
    SELECT COUNT(*) FROM orders
    WHERE created_at >= ${startOfDay}
      AND created_at <  ${endOfDay}
    FOR UPDATE
  `;

  const shortDate = dateStr.slice(2); // "260508"
  const seq = String(Number(count) + 1).padStart(2, '0');
  return `PO${shortDate}${seq}`;
}

/**
 * POST /api/orders
 * Buat order baru dengan multiple items (transaction)
 *
 * Flow:
 * 1. Validasi relasi (warehouse, supplier, items exist) — Zod sudah validasi input
 * 2. Generate order_number (dalam transaction, race-condition safe)
 * 3. Transaction: insert order → insert order_details
 * 4. Return order lengkap
 */
export const create = async (req, res, next) => {
  try {
    const {
      warehouse_id,
      supplier_id,
      delivery_start_date,
      delivery_end_date,
      approval_id,
      items,
    } = req.body;

    // item_ids dari parsed body (sudah BigInt oleh Zod)
    const itemIds = items.map((i) => i.item_id);

    // ════════════════════════════════
    // 1. VALIDASI RELASI
    // ════════════════════════════════

    // ─── Warehouse exists? ───
    const warehouse = await prisma.warehouse.findUnique({
      where: { warehouse_id: Number(warehouse_id) },
    });
    if (!warehouse) {
      return res.status(400).json({
        success: false,
        message: `Warehouse dengan id ${warehouse_id} tidak ditemukan`,
      });
    }

    // ─── Supplier exists? ───
    const supplier = await prisma.supplier.findUnique({
      where: { supplier_id: BigInt(supplier_id) },
    });
    if (!supplier) {
      return res.status(400).json({
        success: false,
        message: `Supplier dengan id ${supplier_id} tidak ditemukan`,
      });
    }

    // ─── Approval user exists? ───
    const approver = await prisma.user.findUnique({
      where: { user_id: Number(approval_id) },
    });
    if (!approver) {
      return res.status(400).json({
        success: false,
        message: `User approval dengan id ${approval_id} tidak ditemukan`,
      });
    }

    // ─── All items exist & active? ───
    const existingItems = await prisma.item.findMany({
      where: {
        item_id: { in: itemIds },
        status: 'A',
      },
      select: { item_id: true, item_name: true, status: true },
    });

    if (existingItems.length !== items.length) {
      const foundIds = existingItems.map((i) => String(i.item_id));
      const notFound = itemIds.filter((id) => !foundIds.includes(String(id)));
      return res.status(400).json({
        success: false,
        message: `Item dengan id [${notFound.join(', ')}] tidak ditemukan atau tidak aktif`,
      });
    }

    // ─── Order status "Open" (code: 10) ───
    const openStatus = await prisma.orderStatus.findFirst({
      where: { status_code: '10' },
    });
    if (!openStatus) {
      return res.status(500).json({
        success: false,
        message: 'Order status "Open" (code: 10) belum ada di database. Seed data order_statuses terlebih dahulu.',
      });
    }

    // ════════════════════════════════
    // 2. TRANSACTION: INSERT ORDER + DETAILS
    // ════════════════════════════════
    const orderResult = await prisma.$transaction(async (tx) => {
      // ─── 2a. Generate & insert order header ───
      // Order number di-generate di DALAM transaction dengan row-level lock
      // (SELECT ... FOR UPDATE) sehingga 2 request konkuren tidak bisa
      // dapat nomor yang sama.
      const orderNumber = await generateOrderNumber(tx);

      const newOrder = await tx.order.create({
        data: {
          order_number: orderNumber,
          warehouse_id: Number(warehouse_id),
          supplier_id: BigInt(supplier_id),
          delivery_start_date: new Date(delivery_start_date),
          delivery_end_date: new Date(delivery_end_date),
          order_status_id: openStatus.order_status_id,
          created_id: req.user.user_id,
          approval_id: Number(approval_id),
        },
      });

      // ─── 4b. Insert order details (bulk) ───
      // order_detail_id BUKAN auto-increment — generate sequential IDs
      // dengan FOR UPDATE lock di transaction yang sama.
      const [{ 'MAX(order_detail_id)': maxId }] = await tx.$queryRaw`
        SELECT MAX(order_detail_id) AS \`max_order_detail_id\`
        FROM order_details
        FOR UPDATE
      `;
      let nextDetailId = maxId ? Number(maxId) + 1 : 1;

      const detailData = items.map((item) => ({
        order_detail_id: BigInt(nextDetailId++),
        order_id: newOrder.order_id,
        item_id: item.item_id, // Sudah BigInt dari Zod schema
        qty_ordered: Number(item.qty_ordered),
        created_id: req.user.user_id,
      }));

      await tx.orderDetail.createMany({
        data: detailData,
      });

      // ─── 4c. Return order_number + complete order ───
      return {
        orderNumber,
        data: await tx.order.findUnique({
          where: { order_id: newOrder.order_id },
          select: orderDetailSelect,
        }),
      };
    });

    console.log(
      `[ORDER] Created: ${orderResult.orderNumber} | Warehouse: ${warehouse.warehouse_code} | Supplier: ${supplier.supplier_code} | Items: ${items.length} | by user_id:${req.user.user_id}`
    );

    res.status(201).json({
      success: true,
      message: 'Order berhasil dibuat',
      data: orderResult.data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders
 * List semua orders (dengan filter & pagination)
 */
export const getAll = async (req, res, next) => {
  try {
    const {
      search,
      status_code,
      supplier_id,
      warehouse_id,
      page = 1,
      limit = 10,
    } = req.query;

    const where = {};

    if (search) {
      where.order_number = { contains: search };
    }
    if (status_code) {
      where.order_status = { status_code };
    }
    if (supplier_id) {
      where.supplier_id = BigInt(supplier_id);
    }
    if (warehouse_id) {
      where.warehouse_id = Number(warehouse_id);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: orderSelect,
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Data order berhasil diambil',
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:id
 * Detail order + semua line items
 */
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { order_id: BigInt(id) },
      select: orderDetailSelect,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order tidak ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Data order berhasil diambil',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
