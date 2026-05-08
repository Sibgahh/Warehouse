/**
 * Item Controller Tests
 *
 * Coverage: getAll, getById, create, update, remove
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock prisma — vi.hoisted so it is initialized before hoisting ────────────
const { prismaMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      item: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      supplier: { findUnique: vi.fn() },
    },
  };
});

vi.mock('../src/config/prisma.js', () => ({ default: prismaMock }));

import { getAll, getById, create, update, remove } from '../src/controllers/itemController.js';
import { mockReq, mockRes, mockNext, MOCK_ITEMS, MOCK_SUPPLIERS } from './helpers/mockFactory.js';

describe('Item Controller', () => {
  beforeEach(() => vi.clearAllMocks());

  // ────────────────────────────────────────────────────────────────────────────
  // GET ALL
  // ────────────────────────────────────────────────────────────────────────────
  describe('getAll', () => {
    it('✅ returns paginated items list', async () => {
      prismaMock.item.findMany.mockResolvedValue(MOCK_ITEMS);
      prismaMock.item.count.mockResolvedValue(2);

      const req = mockReq({ query: { page: '1', limit: '10' } });
      const res = mockRes();

      await getAll(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: MOCK_ITEMS,
          pagination: expect.objectContaining({ total: 2, page: 1 }),
        })
      );
    });

    it('✅ applies search filter (item_name + description)', async () => {
      prismaMock.item.findMany.mockResolvedValue([]);
      prismaMock.item.count.mockResolvedValue(0);

      const req = mockReq({ query: { search: 'beras' } });
      const res = mockRes();

      await getAll(req, res, mockNext());

      expect(prismaMock.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { item_name: { contains: 'beras' } },
              { description: { contains: 'beras' } },
            ]),
          }),
        })
      );
    });

    it('✅ applies status filter', async () => {
      prismaMock.item.findMany.mockResolvedValue([]);
      prismaMock.item.count.mockResolvedValue(0);

      const req = mockReq({ query: { status: 'A' } });
      const res = mockRes();

      await getAll(req, res, mockNext());

      expect(prismaMock.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'A' }) })
      );
    });

    it('✅ applies pagination (skip/take)', async () => {
      prismaMock.item.findMany.mockResolvedValue([]);
      prismaMock.item.count.mockResolvedValue(0);

      const req = mockReq({ query: { page: '2', limit: '20' } });
      const res = mockRes();

      await getAll(req, res, mockNext());

      expect(prismaMock.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 20 })
      );
    });
  });

  // ────────────────────────────────────────────────────────────��───────────────
  // GET BY ID
  // ────────────────────────────────────────────────────────────────────────────
  describe('getById', () => {
    it('✅ returns item details when found', async () => {
      prismaMock.item.findUnique.mockResolvedValue(MOCK_ITEMS[0]);

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();

      await getById(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: MOCK_ITEMS[0] })
      );
    });

    it('❌ returns 404 when item not found', async () => {
      prismaMock.item.findUnique.mockResolvedValue(null);

      const req = mockReq({ params: { id: '999' } });
      const res = mockRes();

      await getById(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Item tidak ditemukan' })
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ────────────────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('✅ creates item successfully when name is unique', async () => {
      const newItem = { ...MOCK_ITEMS[0], item_id: 99n, item_name: 'Gula 1kg' };

      prismaMock.item.findUnique.mockResolvedValue(null);
      prismaMock.supplier.findUnique.mockResolvedValue(MOCK_SUPPLIERS[0]);
      prismaMock.item.create.mockResolvedValue(newItem);

      const req = mockReq({
        body: {
          item_name: 'Gula 1kg',
          description: 'Gula pasir 1 kg',
          std_qty: '50',
          min_stock: '5',
          max_stock: '200',
          unit_cost: '15000',
          unit_retail: '17500',
          supplier_id: 1n,
          status: 'A',
        },
        user: { user_id: 1 },
      });
      const res = mockRes();

      await create(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Item berhasil ditambahkan',
          data: expect.objectContaining({ item_name: 'Gula 1kg' }),
        })
      );
    });

    it('❌ returns 409 when item_name already exists', async () => {
      prismaMock.item.findUnique.mockResolvedValue(MOCK_ITEMS[0]);

      const req = mockReq({
        body: {
          item_name: 'Beras 5kg',
          description: 'Desc',
          std_qty: '100',
          max_stock: '500',
          unit_cost: '45000',
          unit_retail: '52000',
          supplier_id: 1n,
        },
        user: { user_id: 1 },
      });
      const res = mockRes();

      await create(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(409);
      expect(prismaMock.item.create).not.toHaveBeenCalled();
    });

    it('❌ returns 400 when supplier does not exist', async () => {
      prismaMock.item.findUnique.mockResolvedValue(null);
      prismaMock.supplier.findUnique.mockResolvedValue(null);

      const req = mockReq({
        body: {
          item_name: 'BarangBaru',
          description: 'Desc',
          std_qty: '10',
          max_stock: '100',
          unit_cost: '1000',
          unit_retail: '1200',
          supplier_id: 999n,
        },
        user: { user_id: 1 },
      });
      const res = mockRes();

      await create(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Supplier tidak ditemukan' })
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ────────────────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('✅ updates item successfully', async () => {
      const updated = { ...MOCK_ITEMS[0], item_name: 'Updated Name' };

      prismaMock.item.findUnique.mockResolvedValue(MOCK_ITEMS[0]);
      prismaMock.supplier.findUnique.mockResolvedValue(MOCK_SUPPLIERS[0]);
      prismaMock.item.findFirst.mockResolvedValue(null);
      prismaMock.item.update.mockResolvedValue(updated);

      const req = mockReq({
        params: { id: '1' },
        body: { item_name: 'Updated Name', description: 'Updated desc' },
        user: { user_id: 1 },
      });
      const res = mockRes();

      await update(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(prismaMock.item.update).toHaveBeenCalled();
    });

    it('❌ returns 404 when item not found', async () => {
      prismaMock.item.findUnique.mockResolvedValue(null);

      const req = mockReq({ params: { id: '999' }, body: { item_name: 'NewName' }, user: { user_id: 1 } });
      const res = mockRes();

      await update(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('❌ returns 409 when new item_name conflicts with another item', async () => {
      prismaMock.item.findUnique.mockResolvedValue(MOCK_ITEMS[0]);
      prismaMock.item.findFirst.mockResolvedValue(MOCK_ITEMS[1]); // conflict

      const req = mockReq({
        params: { id: '1' },
        body: { item_name: MOCK_ITEMS[1].item_name },
        user: { user_id: 1 },
      });
      const res = mockRes();

      await update(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('✅ allows updating with the same name (no conflict with self)', async () => {
      prismaMock.item.findUnique.mockResolvedValue(MOCK_ITEMS[0]);
      prismaMock.item.findFirst.mockResolvedValue(null);
      prismaMock.item.update.mockResolvedValue(MOCK_ITEMS[0]);

      const req = mockReq({
        params: { id: '1' },
        body: { item_name: MOCK_ITEMS[0].item_name },
        user: { user_id: 1 },
      });
      const res = mockRes();

      await update(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // REMOVE
  // ────────────────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('✅ deletes item when it has no order details', async () => {
      prismaMock.item.findUnique.mockResolvedValue({
        item_id: BigInt(1),
        item_name: 'Beras 5kg',
        description: 'Beras premium',
        status: 'A',
        std_qty: 100,
        min_stock: 10,
        max_stock: 500,
        unit_cost: 45000,
        unit_retail: 52000,
        supplier_id: BigInt(1),
        _count: { order_details: 0 },
      });
      prismaMock.item.delete.mockResolvedValue({ item_id: 1n });

      const req = mockReq({ params: { id: '1' }, user: { user_id: 1 } });
      const res = mockRes();

      await remove(req, res, mockNext());

      expect(prismaMock.item.delete).toHaveBeenCalledWith({ where: { item_id: 1n } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Item berhasil dihapus' })
      );
    });

    it('❌ returns 400 when item is referenced in order_details', async () => {
      prismaMock.item.findUnique.mockResolvedValue({
        ...MOCK_ITEMS[0],
        _count: { order_details: 5 },
      });

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();

      await remove(req, res, mockNext());

      expect(prismaMock.item.delete).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('5 order detail') })
      );
    });

    it('❌ returns 404 when item not found', async () => {
      prismaMock.item.findUnique.mockResolvedValue(null);

      const req = mockReq({ params: { id: '999' } });
      const res = mockRes();

      await remove(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(404);
      expect(prismaMock.item.delete).not.toHaveBeenCalled();
    });
  });
});