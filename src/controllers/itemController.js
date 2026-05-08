import prisma from '../config/prisma.js';

const itemSelect = {
  item_id: true,
  item_name: true,
  description: true,
  status: true,
  std_qty: true,
  min_stock: true,
  max_stock: true,
  unit_cost: true,
  unit_retail: true,
  supplier_id: true,
  created_at: true,
  created_id: true,
  updated_at: true,
  updated_id: true,
  supplier: {
    select: {
      supplier_id: true,
      supplier_code: true,
      supplier_name: true,
    },
  },
  created_by: {
    select: { user_id: true, full_name: true },
  },
  updated_by: {
    select: { user_id: true, full_name: true },
  },
  inventory: {
    select: {
      on_hand_qty: true,
      on_ordered_qty: true,
    },
  },
};

/**
 * GET /api/items
 * List semua items (search, filter, pagination)
 */
export const getAll = async (req, res, next) => {
  try {
    const {
      search,
      status,
      supplier_id,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { item_name: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (status) {
      where.status = status;
    }
    if (supplier_id) {
      where.supplier_id = BigInt(supplier_id);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        select: itemSelect,
        skip,
        take,
        orderBy: { item_id: 'desc' },
      }),
      prisma.item.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Data item berhasil diambil',
      data: items,
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
 * GET /api/items/:id
 * Detail item + inventory + order count
 */
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { item_id: BigInt(id) },
      select: {
        ...itemSelect,
        inventory: {
          select: {
            on_hand_qty: true,
            on_ordered_qty: true,
          },
        },
        _count: {
          select: { order_details: true },
        },
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item tidak ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Data item berhasil diambil',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/items
 * Buat item baru
 *
 * NOTE: Input sudah divalidasi Zod di middleware (itemCreateSchema).
 */
export const create = async (req, res, next) => {
  try {
    const {
      item_name,
      description,
      status,
      std_qty,
      min_stock,
      max_stock,
      unit_cost,
      unit_retail,
      supplier_id,
    } = req.body;

    // ─── Cek duplikat item_name ───
    const existing = await prisma.item.findUnique({ where: { item_name } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Item dengan nama '${item_name}' sudah ada`,
      });
    }

    // ─── Cek supplier exists ───
    const supplier = await prisma.supplier.findUnique({
      where: { supplier_id },
    });
    if (!supplier) {
      return res.status(400).json({ success: false, message: 'Supplier tidak ditemukan' });
    }

    const item = await prisma.item.create({
      data: {
        item_name,
        description,
        status: status || 'A',
        std_qty: Number(std_qty),
        min_stock: Number(min_stock) || 0,
        max_stock: Number(max_stock),
        unit_cost: Number(unit_cost),
        unit_retail: Number(unit_retail),
        supplier_id,
        created_id: req.user.user_id,
      },
      select: itemSelect,
    });

    console.log(`[ITEM] Created: ${item_name} by user_id:${req.user.user_id}`);

    res.status(201).json({
      success: true,
      message: 'Item berhasil ditambahkan',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/items/:id
 * Update item
 *
 * NOTE: Input sudah divalidasi Zod di middleware (itemUpdateSchema).
 */
export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      item_name,
      description,
      status,
      std_qty,
      min_stock,
      max_stock,
      unit_cost,
      unit_retail,
      supplier_id,
    } = req.body;

    const existing = await prisma.item.findUnique({ where: { item_id: BigInt(id) } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Item tidak ditemukan' });
    }

    if (item_name && item_name !== existing.item_name) {
      const duplicate = await prisma.item.findFirst({
        where: { item_name, NOT: { item_id: BigInt(id) } },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Item dengan nama '${item_name}' sudah ada`,
        });
      }
    }

    if (supplier_id) {
      const supplier = await prisma.supplier.findUnique({ where: { supplier_id } });
      if (!supplier) {
        return res.status(400).json({ success: false, message: 'Supplier tidak ditemukan' });
      }
    }

    const item = await prisma.item.update({
      where: { item_id: BigInt(id) },
      data: {
        ...(item_name && { item_name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(std_qty !== undefined && { std_qty: Number(std_qty) }),
        ...(min_stock !== undefined && { min_stock: Number(min_stock) }),
        ...(max_stock !== undefined && { max_stock: Number(max_stock) }),
        ...(unit_cost !== undefined && { unit_cost: Number(unit_cost) }),
        ...(unit_retail !== undefined && { unit_retail: Number(unit_retail) }),
        ...(supplier_id && { supplier_id }),
        updated_id: req.user.user_id,
      },
      select: itemSelect,
    });

    console.log(`[ITEM] Updated: ${item.item_name} by user_id:${req.user.user_id}`);

    res.status(200).json({
      success: true,
      message: 'Item berhasil diperbarui',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/items/:id
 * Hapus item (only jika tidak punya order detail)
 */
export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.item.findUnique({
      where: { item_id: BigInt(id) },
      include: { _count: { select: { order_details: true } } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Item tidak ditemukan' });
    }

    if (existing._count.order_details > 0) {
      return res.status(400).json({
        success: false,
        message: `Item tidak bisa dihapus karena sudah dipakai di ${existing._count.order_details} order detail`,
      });
    }

    await prisma.item.delete({ where: { item_id: BigInt(id) } });

    console.log(`[ITEM] Deleted: ${existing.item_name} by user_id:${req.user.user_id}`);

    res.status(200).json({ success: true, message: 'Item berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};