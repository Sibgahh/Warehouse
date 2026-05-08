import prisma from '../config/prisma.js';

const storeSelect = {
  store_id: true,
  store_code: true,
  store_name: true,
  email: true,
  phone_number: true,
  city: true,
  regency: true,
  address: true,
  status: true,
  created_at: true,
  created_id: true,
  updated_at: true,
  updated_id: true,
};

export const getAll = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { store_code: { contains: search } },
        { store_name: { contains: search } },
        { city: { contains: search } },
      ];
    }
    if (status) where.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [stores, total] = await Promise.all([
      prisma.store.findMany({ where, select: storeSelect, skip, take, orderBy: { store_id: 'desc' } }),
      prisma.store.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: stores,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / take) },
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({
      where: { store_id: BigInt(req.params.id) },
      select: storeSelect,
    });
    if (!store) return res.status(404).json({ success: false, message: 'Store tidak ditemukan' });
    res.status(200).json({ success: true, data: store });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const { store_code, store_name, email, phone_number, city, regency, address, status } = req.body;
    const codeExists = await prisma.store.findUnique({ where: { store_code } });
    if (codeExists) return res.status(409).json({ success: false, message: 'Store code sudah terdaftar' });
    const nameExists = await prisma.store.findUnique({ where: { store_name } });
    if (nameExists) return res.status(409).json({ success: false, message: 'Store name sudah terdaftar' });

    const store = await prisma.store.create({
      data: {
        store_code,
        store_name,
        email: email || null,
        phone_number: phone_number || null,
        city: city || null,
        regency: regency || null,
        address: address || null,
        status: status || 'A',
        created_id: req.user.user_id,
      },
      select: storeSelect,
    });

    res.status(201).json({ success: true, message: 'Store berhasil ditambahkan', data: store });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const existing = await prisma.store.findUnique({ where: { store_id: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Store tidak ditemukan' });

    const { store_code, store_name, email, phone_number, city, regency, address, status } = req.body;

    if (store_code && store_code !== existing.store_code) {
      const dupCode = await prisma.store.findFirst({ where: { store_code, store_id: { not: id } } });
      if (dupCode) return res.status(409).json({ success: false, message: 'Store code sudah terdaftar' });
    }
    if (store_name && store_name !== existing.store_name) {
      const dupName = await prisma.store.findFirst({ where: { store_name, store_id: { not: id } } });
      if (dupName) return res.status(409).json({ success: false, message: 'Store name sudah terdaftar' });
    }

    const store = await prisma.store.update({
      where: { store_id: id },
      data: {
        ...(store_code !== undefined && { store_code }),
        ...(store_name !== undefined && { store_name }),
        ...(email !== undefined && { email: email || null }),
        ...(phone_number !== undefined && { phone_number: phone_number || null }),
        ...(city !== undefined && { city: city || null }),
        ...(regency !== undefined && { regency: regency || null }),
        ...(address !== undefined && { address: address || null }),
        ...(status !== undefined && { status }),
        updated_id: req.user.user_id,
      },
      select: storeSelect,
    });

    res.status(200).json({ success: true, message: 'Store berhasil diperbarui', data: store });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const existing = await prisma.store.findUnique({ where: { store_id: id }, select: { store_id: true } });
    if (!existing) return res.status(404).json({ success: false, message: 'Store tidak ditemukan' });
    await prisma.store.delete({ where: { store_id: id } });
    res.status(200).json({ success: true, message: 'Store berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};
