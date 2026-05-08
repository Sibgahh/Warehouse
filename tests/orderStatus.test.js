import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    orderStatus: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../src/config/prisma.js', () => ({ default: prismaMock }));

import { create, getAll, remove, update } from '../src/controllers/orderStatusController.js';
import { mockNext, mockReq, mockRes } from './helpers/mockFactory.js';

describe('Order Status Controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns order status list', async () => {
    prismaMock.orderStatus.findMany.mockResolvedValue([{ order_status_id: 1, status_code: '10' }]);
    const res = mockRes();
    await getAll(mockReq(), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('creates new status if code not exists', async () => {
    prismaMock.orderStatus.findUnique.mockResolvedValue(null);
    prismaMock.orderStatus.create.mockResolvedValue({ order_status_id: 4, status_code: '40' });
    const res = mockRes();
    await create(mockReq({ body: { status_code: '40', status_name: 'Closed' } }), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejects duplicate status code', async () => {
    prismaMock.orderStatus.findUnique.mockResolvedValue({ order_status_id: 1, status_code: '10' });
    const res = mockRes();
    await create(mockReq({ body: { status_code: '10', status_name: 'Open' } }), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('updates existing status', async () => {
    prismaMock.orderStatus.findUnique.mockResolvedValueOnce({ order_status_id: 1, status_code: '10' });
    prismaMock.orderStatus.update.mockResolvedValue({ order_status_id: 1, status_name: 'Open PO' });
    const res = mockRes();
    await update(mockReq({ params: { id: '1' }, body: { status_name: 'Open PO' } }), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('prevents delete when status still used', async () => {
    prismaMock.orderStatus.findUnique.mockResolvedValue({
      order_status_id: 1,
      _count: { orders: 2 },
    });
    const res = mockRes();
    await remove(mockReq({ params: { id: '1' } }), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
