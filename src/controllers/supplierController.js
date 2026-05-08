import prisma from '../config/prisma.js';

// ─── Select fields (exclude password-like sensitive data) ───
const supplierSelect = {
  supplier_id: true,
  supplier_code: true,
  supplier_name: true,
  email: true,
  phone_number: true,
  city: true,
  regency: true,
  address: true,
  is_active: true,
  created_at: true,
  created_id: true,
  updated_at: true,
  updated_id: true,
  created_by: {
    select: { user_id: true, full_name: true },
  },
  updated_by: {
    select: { user_id: true, full_name: true },
  },
};

/**
 * GET /api/suppliers
 * Ambil semua supplier (dengan search & filter)
 */
export const getAll = async (req, res, next) => {
  try {
    const { search, is_active, page = 1, limit = 10 } = req.query;

    // ─── Build where clause ───
    const where = {};

    if (search) {
      where.OR = [
        { supplier_code: { contains: search } },
        { supplier_name: { contains: search } },
        { email: { contains: search } },
        { city: { contains: search } },
      ];
    }

    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    // ─── Pagination ───
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        select: supplierSelect,
        skip,
        take,
        orderBy: { supplier_id: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Data supplier berhasil diambil',
      data: suppliers,
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
 * GET /api/suppliers/:id
 * Ambil supplier berdasarkan ID
 */
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { supplier_id: BigInt(id) },
      select: {
        ...supplierSelect,
        items: {
          select: {
            item_id: true,
            item_name: true,
            description: true,
            status: true,
            unit_cost: true,
            unit_retail: true,
          },
        },
        _count: {
          select: { items: true, orders: true },
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier tidak ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Data supplier berhasil diambil',
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/suppliers
 * Buat supplier baru
 *
 * NOTE: Input sudah divalidasi Zod di middleware (supplierCreateSchema).
 */
export const create = async (req, res, next) => {
  try {
    const {
      supplier_code,
      supplier_name,
      email,
      phone_number,
      city,
      regency,
      address,
      is_active,
    } = req.body;

    // ─── Cek duplikat supplier_code ───
    const existing = await prisma.supplier.findUnique({
      where: { supplier_code },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Supplier dengan kode '${supplier_code}' sudah ada`,
      });
    }

    // ─── Simpan supplier ───
    const supplier = await prisma.supplier.create({
      data: {
        supplier_code,
        supplier_name,
        email: email || null,
        phone_number: phone_number || null,
        city: city || null,
        regency: regency || null,
        address: address || null,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
        created_id: req.user.user_id,
      },
      select: supplierSelect,
    });

    console.log(`[SUPPLIER] Created: ${supplier_code} - ${supplier_name} by user_id:${req.user.user_id}`);

    res.status(201).json({
      success: true,
      message: 'Supplier berhasil ditambahkan',
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/suppliers/:id
 * Update supplier berdasarkan ID
 *
 * NOTE: Input sudah divalidasi Zod di middleware (supplierUpdateSchema).
 */
export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      supplier_code,
      supplier_name,
      email,
      phone_number,
      city,
      regency,
      address,
      is_active,
    } = req.body;

    // ─── Cek apakah supplier ada ───
    const existing = await prisma.supplier.findUnique({
      where: { supplier_id: BigInt(id) },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Supplier tidak ditemukan',
      });
    }

    // ─── Cek duplikat supplier_code (exclude current) ───
    if (supplier_code !== existing.supplier_code) {
      const duplicate = await prisma.supplier.findFirst({
        where: {
          supplier_code,
          NOT: { supplier_id: BigInt(id) },
        },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Supplier dengan kode '${supplier_code}' sudah digunakan supplier lain`,
        });
      }
    }

    // ─── Update supplier ───
    const supplier = await prisma.supplier.update({
      where: { supplier_id: BigInt(id) },
      data: {
        supplier_code,
        supplier_name,
        email: email || null,
        phone_number: phone_number || null,
        city: city || null,
        regency: regency || null,
        address: address || null,
        is_active: is_active !== undefined ? Boolean(is_active) : existing.is_active,
        updated_id: req.user.user_id,
      },
      select: supplierSelect,
    });

    console.log(`[SUPPLIER] Updated: ${supplier_code} by user_id:${req.user.user_id}`);

    res.status(200).json({
      success: true,
      message: 'Supplier berhasil diperbarui',
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/suppliers/:id
 * Hapus supplier (soft-check: jika punya items/orders, tolak)
 */
export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ─── Cek apakah supplier ada ───
    const existing = await prisma.supplier.findUnique({
      where: { supplier_id: BigInt(id) },
      include: {
        _count: {
          select: { items: true, orders: true },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Supplier tidak ditemukan',
      });
    }

    // ─── Cek relasi: jika punya items atau orders, tolak delete ───
    if (existing._count.items > 0 || existing._count.orders > 0) {
      return res.status(400).json({
        success: false,
        message: `Supplier tidak bisa dihapus karena masih memiliki ${existing._count.items} item dan ${existing._count.orders} order`,
      });
    }

    // ─── Hapus supplier ───
    await prisma.supplier.delete({
      where: { supplier_id: BigInt(id) },
    });

    console.log(`[SUPPLIER] Deleted: ${existing.supplier_code} by user_id:${req.user.user_id}`);

    res.status(200).json({
      success: true,
      message: 'Supplier berhasil dihapus',
    });
  } catch (error) {
    next(error);
  }
};
