import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => {
  const prisma = {
    order: { findUnique: vi.fn() },
    item: { findUnique: vi.fn() },
    orderDetail: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $queryRaw: vi.fn(),
  };
  prisma.$transaction = vi.fn(async (cb) => cb(prisma));
  return { prismaMock: prisma };
});

vi.mock('../src/config/prisma.js', () => ({ default: prismaMock }));

import { create, getAll, remove, update } from '../src/controllers/orderDetailController.js';
import { mockNext, mockReq, mockRes } from './helpers/mockFactory.js';

describe('Order Detail Controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns list order details', async () => {
    prismaMock.orderDetail.findMany.mockResolvedValue([{ order_detail_id: 1n }]);
    const res = mockRes();
    await getAll(mockReq({ query: {} }), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('creates order detail when order and item exist', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ order_id: 1n });
    prismaMock.item.findUnique.mockResolvedValue({ item_id: 2n });
    prismaMock.orderDetail.findFirst.mockResolvedValue(null);
    prismaMock.$queryRaw.mockResolvedValue([{ 'MAX(order_detail_id)': 5 }]);
    prismaMock.orderDetail.create.mockResolvedValue({ order_detail_id: 6n });

    const req = mockReq({
      body: { order_id: 1n, item_id: 2n, qty_ordered: 10 },
      user: { user_id: 1 },
    });
    const res = mockRes();
    await create(req, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejects create when duplicate item in same order', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ order_id: 1n });
    prismaMock.item.findUnique.mockResolvedValue({ item_id: 2n });
    prismaMock.orderDetail.findFirst.mockResolvedValue({ order_detail_id: 9n });
    const res = mockRes();
    await create(mockReq({ body: { order_id: 1n, item_id: 2n, qty_ordered: 10 }, user: { user_id: 1 } }), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('updates existing order detail', async () => {
    prismaMock.orderDetail.findUnique.mockResolvedValue({ order_detail_id: 3n, order_id: 1n, item_id: 1n });
    prismaMock.orderDetail.update.mockResolvedValue({ order_detail_id: 3n });
    const res = mockRes();
    await update(mockReq({ params: { id: '3' }, body: { qty_ordered: 5 }, user: { user_id: 1 } }), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deletes existing order detail', async () => {
    prismaMock.orderDetail.findUnique.mockResolvedValue({ order_detail_id: 2n });
    prismaMock.orderDetail.delete.mockResolvedValue({});
    const res = mockRes();
    await remove(mockReq({ params: { id: '2' } }), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
