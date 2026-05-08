import prisma from '../config/prisma.js';

const orderDetailSelect = {
  order_detail_id: true,
  order_id: true,
  item_id: true,
  qty_ordered: true,
  qty_received: true,
  qty_cancelled: true,
  reason_cancelled: true,
  created_id: true,
  created_at: true,
  updated_at: true,
  received_id: true,
  last_receive_dttm: true,
  order: {
    select: {
      order_id: true,
      order_number: true,
    },
  },
  item: {
    select: {
      item_id: true,
      item_name: true,
    },
  },
  created_by: {
    select: {
      user_id: true,
      full_name: true,
    },
  },
};

export const getAll = async (req, res, next) => {
  try {
    const { order_id, item_id } = req.query;
    const where = {};
    if (order_id) where.order_id = BigInt(order_id);
    if (item_id) where.item_id = BigInt(item_id);

    const data = await prisma.orderDetail.findMany({
      where,
      select: orderDetailSelect,
      orderBy: { order_detail_id: 'desc' },
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const data = await prisma.orderDetail.findUnique({
      where: { order_detail_id: id },
      select: orderDetailSelect,
    });
    if (!data) return res.status(404).json({ success: false, message: 'Order detail tidak ditemukan' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const { order_id, item_id, qty_ordered, qty_received, qty_cancelled, reason_cancelled } = req.body;

    const [order, item] = await Promise.all([
      prisma.order.findUnique({ where: { order_id } }),
      prisma.item.findUnique({ where: { item_id } }),
    ]);
    if (!order) return res.status(400).json({ success: false, message: 'order_id tidak valid' });
    if (!item) return res.status(400).json({ success: false, message: 'item_id tidak valid' });

    const duplicate = await prisma.orderDetail.findFirst({ where: { order_id, item_id } });
    if (duplicate) return res.status(409).json({ success: false, message: 'Item ini sudah ada di order tersebut' });

    const data = await prisma.$transaction(async (tx) => {
      const [{ max_order_detail_id: maxId }] = await tx.$queryRaw`
        SELECT MAX(order_detail_id) AS \`max_order_detail_id\`
        FROM order_details
        FOR UPDATE
      `;
      const nextId = BigInt(maxId ? Number(maxId) + 1 : 1);
      return tx.orderDetail.create({
        data: {
          order_detail_id: nextId,
          order_id,
          item_id,
          qty_ordered,
          qty_received: qty_received ?? null,
          qty_cancelled: qty_cancelled ?? null,
          reason_cancelled: reason_cancelled || null,
          created_id: req.user.user_id,
          received_id: qty_received ? req.user.user_id : null,
          last_receive_dttm: qty_received ? new Date() : null,
        },
        select: orderDetailSelect,
      });
    });

    res.status(201).json({ success: true, message: 'Order detail berhasil ditambahkan', data });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const existing = await prisma.orderDetail.findUnique({ where: { order_detail_id: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Order detail tidak ditemukan' });

    const { item_id, qty_ordered, qty_received, qty_cancelled, reason_cancelled } = req.body;
    if (item_id && item_id !== existing.item_id) {
      const item = await prisma.item.findUnique({ where: { item_id } });
      if (!item) return res.status(400).json({ success: false, message: 'item_id tidak valid' });
      const duplicate = await prisma.orderDetail.findFirst({
        where: { order_id: existing.order_id, item_id, order_detail_id: { not: id } },
      });
      if (duplicate) return res.status(409).json({ success: false, message: 'Item ini sudah ada di order tersebut' });
    }

    const data = await prisma.orderDetail.update({
      where: { order_detail_id: id },
      data: {
        ...(item_id !== undefined && { item_id }),
        ...(qty_ordered !== undefined && { qty_ordered }),
        ...(qty_received !== undefined && { qty_received, received_id: req.user.user_id, last_receive_dttm: new Date() }),
        ...(qty_cancelled !== undefined && { qty_cancelled }),
        ...(reason_cancelled !== undefined && { reason_cancelled: reason_cancelled || null }),
        updated_at: new Date(),
      },
      select: orderDetailSelect,
    });

    res.status(200).json({ success: true, message: 'Order detail berhasil diperbarui', data });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const existing = await prisma.orderDetail.findUnique({ where: { order_detail_id: id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Order detail tidak ditemukan' });
    await prisma.orderDetail.delete({ where: { order_detail_id: id } });
    res.status(200).json({ success: true, message: 'Order detail berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};
