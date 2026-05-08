import prisma from '../config/prisma.js';

export const getAll = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { warehouse_code: { contains: search } },
        { warehouse_name: { contains: search } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        orderBy: { warehouse_id: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.warehouse.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: warehouses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const warehouse = await prisma.warehouse.findUnique({
      where: { warehouse_id: Number(id) },
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse tidak ditemukan',
      });
    }

    res.status(200).json({ success: true, data: warehouse });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const { warehouse_code, warehouse_name, email, phone_number, city, regency, address, status } = req.body;

    // Cek duplicate code
    const existing = await prisma.warehouse.findFirst({
      where: { warehouse_code },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Warehouse code sudah terdaftar',
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        warehouse_code,
        warehouse_name: warehouse_name || '',
        email: email || '',
        phone_number: phone_number || '',
        city: city || '',
        regency: regency || '',
        address: address || '',
        status: status ?? 'A',
      },
    });

    console.log(`[WAREHOUSE] Created: ${warehouse.warehouse_code} by user_id:${req.user.user_id}`);

    res.status(201).json({
      success: true,
      message: 'Warehouse berhasil ditambahkan',
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { warehouse_code, warehouse_name, email, phone_number, city, regency, address, status } = req.body;

    const existing = await prisma.warehouse.findUnique({
      where: { warehouse_id: Number(id) },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse tidak ditemukan',
      });
    }

    // Cek duplicate code kalau ganti warehouse_code
    if (warehouse_code && warehouse_code !== existing.warehouse_code) {
      const duplicate = await prisma.warehouse.findFirst({
        where: { warehouse_code, warehouse_id: { not: Number(id) } },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'Warehouse code sudah terdaftar',
        });
      }
    }

    const warehouse = await prisma.warehouse.update({
      where: { warehouse_id: Number(id) },
      data: {
        ...(warehouse_code && { warehouse_code }),
        ...(warehouse_name !== undefined && { warehouse_name }),
        ...(email !== undefined && { email }),
        ...(phone_number !== undefined && { phone_number }),
        ...(city !== undefined && { city }),
        ...(regency !== undefined && { regency }),
        ...(address !== undefined && { address }),
        ...(status !== undefined && { status }),
      },
    });

    console.log(`[WAREHOUSE] Updated: ${warehouse.warehouse_code} by user_id:${req.user.user_id}`);

    res.status(200).json({
      success: true,
      message: 'Warehouse berhasil diperbarui',
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.warehouse.findUnique({
      where: { warehouse_id: Number(id) },
      include: { _count: { select: { orders: true } } },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse tidak ditemukan',
      });
    }

    if (existing._count.orders > 0) {
      return res.status(400).json({
        success: false,
        message: `Warehouse tidak bisa dihapus karena sudah dipakai di ${existing._count.orders} order`,
      });
    }

    await prisma.warehouse.delete({
      where: { warehouse_id: Number(id) },
    });

    console.log(`[WAREHOUSE] Deleted: ${existing.warehouse_code} by user_id:${req.user.user_id}`);

    res.status(200).json({
      success: true,
      message: 'Warehouse berhasil dihapus',
    });
  } catch (error) {
    next(error);
  }
};
