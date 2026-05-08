import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    item: { findUnique: vi.fn() },
    inventory: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../src/config/prisma.js', () => ({ default: prismaMock }));

import { create, getAll, remove, update } from '../src/controllers/inventoryController.js';
import { mockNext, mockReq, mockRes } from './helpers/mockFactory.js';

describe('Inventory Controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns inventory list', async () => {
    prismaMock.inventory.findMany.mockResolvedValue([{ inventory_id: 1n }]);
    const res = mockRes();
    await getAll(mockReq({ query: {} }), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('creates inventory when item exists', async () => {
    prismaMock.item.findUnique.mockResolvedValue({ item_id: 1n });
    prismaMock.inventory.findUnique.mockResolvedValue(null);
    prismaMock.inventory.create.mockResolvedValue({ inventory_id: 1n });
    const res = mockRes();
    await create(mockReq({ body: { item_id: 1n, on_hand_qty: 10, on_ordered_qty: 2 } }), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejects duplicate inventory by item', async () => {
    prismaMock.item.findUnique.mockResolvedValue({ item_id: 1n });
    prismaMock.inventory.findUnique.mockResolvedValue({ inventory_id: 9n });
    const res = mockRes();
    await create(mockReq({ body: { item_id: 1n, on_hand_qty: 10 } }), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('updates inventory if exists', async () => {
    prismaMock.inventory.findUnique.mockResolvedValue({ inventory_id: 2n });
    prismaMock.inventory.update.mockResolvedValue({ inventory_id: 2n });
    const res = mockRes();
    await update(mockReq({ params: { id: '2' }, body: { on_hand_qty: 8 } }), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deletes inventory if exists', async () => {
    prismaMock.inventory.findUnique.mockResolvedValue({ inventory_id: 2n });
    prismaMock.inventory.delete.mockResolvedValue({});
    const res = mockRes();
    await remove(mockReq({ params: { id: '2' } }), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
