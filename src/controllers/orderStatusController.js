import prisma from '../config/prisma.js';

export const getAll = async (_req, res, next) => {
  try {
    const data = await prisma.orderStatus.findMany({
      orderBy: { status_code: 'asc' },
      include: { _count: { select: { orders: true } } },
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = await prisma.orderStatus.findUnique({
      where: { order_status_id: id },
      include: { _count: { select: { orders: true } } },
    });
    if (!data) return res.status(404).json({ success: false, message: 'Order status tidak ditemukan' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const { status_code, status_name } = req.body;
    const duplicate = await prisma.orderStatus.findUnique({ where: { status_code } });
    if (duplicate) return res.status(409).json({ success: false, message: 'status_code sudah terdaftar' });
    const data = await prisma.orderStatus.create({ data: { status_code, status_name } });
    res.status(201).json({ success: true, message: 'Order status berhasil ditambahkan', data });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.orderStatus.findUnique({ where: { order_status_id: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Order status tidak ditemukan' });

    const { status_code, status_name } = req.body;
    if (status_code && status_code !== existing.status_code) {
      const duplicate = await prisma.orderStatus.findUnique({ where: { status_code } });
      if (duplicate) return res.status(409).json({ success: false, message: 'status_code sudah terdaftar' });
    }

    const data = await prisma.orderStatus.update({
      where: { order_status_id: id },
      data: {
        ...(status_code !== undefined && { status_code }),
        ...(status_name !== undefined && { status_name }),
      },
    });
    res.status(200).json({ success: true, message: 'Order status berhasil diperbarui', data });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.orderStatus.findUnique({
      where: { order_status_id: id },
      include: { _count: { select: { orders: true } } },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Order status tidak ditemukan' });
    if (existing._count.orders > 0) {
      return res.status(400).json({ success: false, message: `Order status masih dipakai di ${existing._count.orders} order` });
    }
    await prisma.orderStatus.delete({ where: { order_status_id: id } });
    res.status(200).json({ success: true, message: 'Order status berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};
