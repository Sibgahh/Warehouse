/**
 * Supplier Controller Tests
 *
 * Coverage: getAll, getById, create, update, remove
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock prisma — vi.hoisted so it is initialized before hoisting ────────────
const { prismaMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      supplier: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});

vi.mock('../src/config/prisma.js', () => ({ default: prismaMock }));

import {
  getAll,
  getById,
  create,
  update,
  remove,
} from '../src/controllers/supplierController.js';
import { mockReq, mockRes, mockNext, MOCK_SUPPLIERS } from './helpers/mockFactory.js';

describe('Supplier Controller', () => {
  beforeEach(() => vi.clearAllMocks());

  // ────────────────────────────────────────────────────────────────────────────
  // GET ALL
  // ────────────────────────────────────────────────────────────────────────────
  describe('getAll', () => {
    it('✅ returns paginated suppliers list', async () => {
      prismaMock.supplier.findMany.mockResolvedValue(MOCK_SUPPLIERS);
      prismaMock.supplier.count.mockResolvedValue(2);

      const req = mockReq({ query: { page: '1', limit: '10' } });
      const res = mockRes();

      await getAll(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: MOCK_SUPPLIERS,
          pagination: expect.objectContaining({ total: 2, page: 1 }),
        })
      );
    });

    it('✅ filters by search (supplier_code, supplier_name, email, city)', async () => {
      prismaMock.supplier.findMany.mockResolvedValue([]);
      prismaMock.supplier.count.mockResolvedValue(0);

      const req = mockReq({ query: { search: 'makmur' } });
      const res = mockRes();

      await getAll(req, res, mockNext());

      expect(prismaMock.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { supplier_code: { contains: 'makmur' } },
              { supplier_name: { contains: 'makmur' } },
              { email: { contains: 'makmur' } },
              { city: { contains: 'makmur' } },
            ]),
          }),
        })
      );
    });

    it('✅ filters by is_active', async () => {
      prismaMock.supplier.findMany.mockResolvedValue([]);
      prismaMock.supplier.count.mockResolvedValue(0);

      const req = mockReq({ query: { is_active: 'true' } });
      const res = mockRes();

      await getAll(req, res, mockNext());

      expect(prismaMock.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ is_active: true }) })
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // GET BY ID
  // ────────────────────────────────────────────────────────────────────────────
  describe('getById', () => {
    it('✅ returns supplier with items and counts', async () => {
      const supplierWithDetails = {
        ...MOCK_SUPPLIERS[0],
        items: [],
        _count: { items: 3, orders: 12 },
      };
      prismaMock.supplier.findUnique.mockResolvedValue(supplierWithDetails);

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();

      await getById(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ supplier_code: 'SUP001' }),
        })
      );
    });

    it('❌ returns 404 when supplier not found', async () => {
      prismaMock.supplier.findUnique.mockResolvedValue(null);

      const req = mockReq({ params: { id: '999' } });
      const res = mockRes();

      await getById(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Supplier tidak ditemukan' })
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // CREATE
  // ────────────────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('✅ creates supplier when code is unique', async () => {
      const newSupplier = { ...MOCK_SUPPLIERS[0], supplier_id: 99n, supplier_code: 'SUP999' };

      prismaMock.supplier.findUnique.mockResolvedValue(null);
      prismaMock.supplier.create.mockResolvedValue(newSupplier);

      const req = mockReq({
        body: {
          supplier_code: 'SUP999',
          supplier_name: 'Supplier Baru',
          email: 'new@supplier.com',
          is_active: true,
        },
        user: { user_id: 1 },
      });
      const res = mockRes();

      await create(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Supplier berhasil ditambahkan',
        })
      );
    });

    it('❌ returns 409 when supplier_code already exists', async () => {
      prismaMock.supplier.findUnique.mockResolvedValue(MOCK_SUPPLIERS[0]);

      const req = mockReq({
        body: { supplier_code: 'SUP001', supplier_name: 'Duplicate Supplier' },
        user: { user_id: 1 },
      });
      const res = mockRes();

      await create(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('SUP001') })
      );
      expect(prismaMock.supplier.create).not.toHaveBeenCalled();
    });

    it('✅ stores created_id from req.user', async () => {
      prismaMock.supplier.findUnique.mockResolvedValue(null);
      prismaMock.supplier.create.mockResolvedValue({ ...MOCK_SUPPLIERS[0], supplier_id: 99n });

      const req = mockReq({
        body: { supplier_code: 'SUP999', supplier_name: 'New Supplier' },
        user: { user_id: 5 },
      });
      const res = mockRes();

      await create(req, res, mockNext());

      expect(prismaMock.supplier.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ created_id: 5 }) })
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────��────────
  // UPDATE
  // ────────────────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('✅ updates supplier successfully', async () => {
      prismaMock.supplier.findUnique.mockResolvedValue(MOCK_SUPPLIERS[0]);
      prismaMock.supplier.findFirst.mockResolvedValue(null);
      prismaMock.supplier.update.mockResolvedValue({
        ...MOCK_SUPPLIERS[0],
        supplier_name: 'Updated Name',
      });

      const req = mockReq({
        params: { id: '1' },
        body: {
          supplier_code: 'SUP001',
          supplier_name: 'Updated Name',
          email: 'updated@email.com',
        },
        user: { user_id: 1 },
      });
      const res = mockRes();

      await update(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(prismaMock.supplier.update).toHaveBeenCalled();
    });

    it('❌ returns 404 when supplier not found', async () => {
      prismaMock.supplier.findUnique.mockResolvedValue(null);

      const req = mockReq({
        params: { id: '999' },
        body: { supplier_code: 'SUP001', supplier_name: 'Updated' },
        user: { user_id: 1 },
      });
      const res = mockRes();

      await update(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('❌ returns 409 when supplier_code conflicts with another supplier', async () => {
      prismaMock.supplier.findUnique.mockResolvedValue(MOCK_SUPPLIERS[0]);
      prismaMock.supplier.findFirst.mockResolvedValue(MOCK_SUPPLIERS[1]);

      const req = mockReq({
        params: { id: '1' },
        body: { supplier_code: 'SUP002', supplier_name: 'Rename' },
        user: { user_id: 1 },
      });
      const res = mockRes();

      await update(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('SUP002') })
      );
    });

    it('✅ allows keeping the same supplier_code (no conflict with self)', async () => {
      prismaMock.supplier.findUnique.mockResolvedValue(MOCK_SUPPLIERS[0]);
      prismaMock.supplier.findFirst.mockResolvedValue(null);
      prismaMock.supplier.update.mockResolvedValue(MOCK_SUPPLIERS[0]);

      const req = mockReq({
        params: { id: '1' },
        body: { supplier_code: 'SUP001', supplier_name: 'Renamed' },
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
    it('✅ deletes supplier when no items and no orders', async () => {
      prismaMock.supplier.findUnique.mockResolvedValue({
        ...MOCK_SUPPLIERS[0],
        _count: { items: 0, orders: 0 },
      });
      prismaMock.supplier.delete.mockResolvedValue(MOCK_SUPPLIERS[0]);

      const req = mockReq({ params: { id: '1' }, user: { user_id: 1 } });
      const res = mockRes();

      await remove(req, res, mockNext());

      expect(prismaMock.supplier.delete).toHaveBeenCalledWith({ where: { supplier_id: 1n } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Supplier berhasil dihapus' })
      );
    });

    it('❌ returns 400 when supplier has items', async () => {
      prismaMock.supplier.findUnique.mockResolvedValue({
        ...MOCK_SUPPLIERS[0],
        _count: { items: 3, orders: 0 },
      });

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();

      await remove(req, res, mockNext());

      expect(prismaMock.supplier.delete).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('3 item') })
      );
    });

    it('❌ returns 400 when supplier has orders', async () => {
      prismaMock.supplier.findUnique.mockResolvedValue({
        ...MOCK_SUPPLIERS[0],
        _count: { items: 0, orders: 7 },
      });

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();

      await remove(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('7 order') })
      );
    });

    it('❌ returns 404 when supplier not found', async () => {
      prismaMock.supplier.findUnique.mockResolvedValue(null);

      const req = mockReq({ params: { id: '999' } });
      const res = mockRes();

      await remove(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});