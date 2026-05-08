import prisma from '../config/prisma.js';

const inventorySelect = {
  inventory_id: true,
  item_id: true,
  on_hand_qty: true,
  on_ordered_qty: true,
  created_at: true,
  last_updated_at: true,
  item: {
    select: {
      item_id: true,
      item_name: true,
      min_stock: true,
      max_stock: true,
      status: true,
      supplier: { select: { supplier_name: true } },
    },
  },
};

export const getAll = async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = {};
    if (search) {
      where.item = { item_name: { contains: search } };
    }
    const data = await prisma.inventory.findMany({
      where,
      select: inventorySelect,
      orderBy: { inventory_id: 'desc' },
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const data = await prisma.inventory.findUnique({
      where: { inventory_id: id },
      select: inventorySelect,
    });
    if (!data) return res.status(404).json({ success: false, message: 'Inventory tidak ditemukan' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const { item_id, on_hand_qty, on_ordered_qty } = req.body;
    const item = await prisma.item.findUnique({ where: { item_id } });
    if (!item) return res.status(400).json({ success: false, message: 'item_id tidak valid' });

    const existing = await prisma.inventory.findUnique({ where: { item_id } });
    if (existing) return res.status(409).json({ success: false, message: 'Inventory untuk item ini sudah ada' });

    const data = await prisma.inventory.create({
      data: { item_id, on_hand_qty, on_ordered_qty },
      select: inventorySelect,
    });
    res.status(201).json({ success: true, message: 'Inventory berhasil ditambahkan', data });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const existing = await prisma.inventory.findUnique({ where: { inventory_id: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Inventory tidak ditemukan' });

    const { on_hand_qty, on_ordered_qty } = req.body;
    const data = await prisma.inventory.update({
      where: { inventory_id: id },
      data: {
        ...(on_hand_qty !== undefined && { on_hand_qty }),
        ...(on_ordered_qty !== undefined && { on_ordered_qty }),
      },
      select: inventorySelect,
    });
    res.status(200).json({ success: true, message: 'Inventory berhasil diperbarui', data });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const existing = await prisma.inventory.findUnique({ where: { inventory_id: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Inventory tidak ditemukan' });
    await prisma.inventory.delete({ where: { inventory_id: id } });
    res.status(200).json({ success: true, message: 'Inventory berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};
