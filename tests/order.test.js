/**
 * Order Controller Tests
 *
 * Coverage: getAll, getById, create (relation validation + transaction)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock prisma — vi.hoisted so it is initialized before hoisting ────────────
const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    warehouse: { findUnique: vi.fn() },
    supplier: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    item: { findMany: vi.fn() },
    orderStatus: { findFirst: vi.fn(), findUnique: vi.fn() },
    order: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    orderDetail: { findFirst: vi.fn(), createMany: vi.fn() },
    $queryRaw: vi.fn(),
  };

  // Mock $transaction — calls the async callback(tx) with prismaMock as tx
  prismaMock.$transaction = vi.fn(async (callback) => {
    return callback(prismaMock);
  });

  return { prismaMock };
});

vi.mock('../src/config/prisma.js', () => ({ default: prismaMock }));

import { getAll, getById, create, update, remove } from '../src/controllers/orderController.js';
import { mockReq, mockRes, mockNext, MOCK_SUPPLIERS, MOCK_WAREHOUSES, MOCK_ITEMS } from './helpers/mockFactory.js';

const MOCK_OPEN_STATUS = { order_status_id: 1, status_code: '10', status_name: 'Open' };
const MOCK_APPROVER = { user_id: 1, full_name: 'Admin User', role_id: 1 };

const validOrderBody = {
  warehouse_id: 1,
  supplier_id: '1',
  delivery_start_date: '2026-06-01',
  delivery_end_date: '2026-06-15',
  approval_id: '1',
  items: [
    { item_id: '1', qty_ordered: '100' },
    { item_id: '2', qty_ordered: '50' },
  ],
};

const validAuthReq = (bodyOverrides = {}) =>
  mockReq({
    body: { ...validOrderBody, ...bodyOverrides },
    user: { user_id: 1, role_id: 1, role_code: 'ADMIN' },
  });

describe('Order Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: all relations exist
    prismaMock.warehouse.findUnique.mockResolvedValue(MOCK_WAREHOUSES[0]);
    prismaMock.supplier.findUnique.mockResolvedValue(MOCK_SUPPLIERS[0]);
    prismaMock.user.findUnique.mockResolvedValue(MOCK_APPROVER);
    prismaMock.item.findMany.mockResolvedValue(MOCK_ITEMS.map((i) => ({ ...i, status: 'A' })));
    prismaMock.orderStatus.findFirst.mockResolvedValue(MOCK_OPEN_STATUS);
    prismaMock.orderDetail.deleteMany = vi.fn();
    prismaMock.order.delete = vi.fn();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ────────────────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('✅ updates editable order header fields', async () => {
      prismaMock.order.findUnique.mockResolvedValueOnce({
        order_id: 1n,
        order_status: { status_code: '10', status_name: 'Open' },
      });
      prismaMock.orderStatus.findUnique.mockResolvedValue({ order_status_id: 2 });
      prismaMock.order.update.mockResolvedValue({
        order_id: 1n,
        order_number: 'PO26060101',
      });

      const req = mockReq({
        params: { id: '1' },
        body: {
          supplier_id: '1',
          warehouse_id: '1',
          delivery_start_date: '2026-06-02',
          delivery_end_date: '2026-06-10',
          approval_id: '1',
          order_status_id: '2',
        },
        user: { user_id: 1, role_id: 1, role_code: 'ADMIN' },
      });
      const res = mockRes();

      await update(req, res, mockNext());

      expect(prismaMock.order.update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('❌ blocks update for verified/cancelled order', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        order_id: 1n,
        order_status: { status_code: '40', status_name: 'Verified' },
      });

      const req = mockReq({ params: { id: '1' }, body: { supplier_id: '1' } });
      const res = mockRes();
      await update(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(prismaMock.order.update).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // GET ALL
  // ────────────────────────────────────────────────────────────────────────────
  describe('getAll', () => {
    it('✅ returns paginated orders list', async () => {
      prismaMock.order.findMany.mockResolvedValue([{ order_id: 1n, order_number: 'PO26060101' }]);
      prismaMock.order.count.mockResolvedValue(1);

      const req = mockReq({ query: { page: '1', limit: '10' } });
      const res = mockRes();

      await getAll(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          pagination: expect.objectContaining({ total: 1 }),
        })
      );
    });

    it('✅ filters by search on order_number / supplier name / supplier code (OR)', async () => {
      prismaMock.order.findMany.mockResolvedValue([]);
      prismaMock.order.count.mockResolvedValue(0);

      const req = mockReq({ query: { search: 'PO2606' } });
      const res = mockRes();

      await getAll(req, res, mockNext());

      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ order_number: { contains: 'PO2606' } }),
            ]),
          }),
        })
      );
    });

    it('✅ filters by status_code', async () => {
      prismaMock.order.findMany.mockResolvedValue([]);
      prismaMock.order.count.mockResolvedValue(0);

      const req = mockReq({ query: { status_code: '10' } });
      const res = mockRes();

      await getAll(req, res, mockNext());

      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ order_status: { status_code: '10' } }) })
      );
    });

    it('✅ applies pagination (page 2, limit 5)', async () => {
      prismaMock.order.findMany.mockResolvedValue([]);
      prismaMock.order.count.mockResolvedValue(0);

      const req = mockReq({ query: { page: '2', limit: '5' } });
      const res = mockRes();

      await getAll(req, res, mockNext());

      expect(prismaMock.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 5, take: 5 }));
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // GET BY ID
  // ────────────────────────────────────────────────────────────────────────────
  describe('getById', () => {
    it('✅ returns order with details when found', async () => {
      const order = { order_id: 1n, order_number: 'PO26060101', order_details: [] };
      prismaMock.order.findUnique.mockResolvedValue(order);

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();

      await getById(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ order_number: 'PO26060101' }) })
      );
    });

    it('❌ returns 404 when order not found', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      const req = mockReq({ params: { id: '999' } });
      const res = mockRes();

      await getById(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // CREATE — relation validation
  // ────────────────────────────────────────────────────────────────────────────
  describe('create', () => {
    const setupSuccessOrderCreate = () => {
      const createdOrder = {
        order_id: 10n,
        order_number: 'PO26050801',
        warehouse_id: 1,
        supplier_id: 1n,
      };
      prismaMock.order.findMany.mockResolvedValue([]);
      prismaMock.orderDetail.findFirst.mockResolvedValue(null);
      prismaMock.order.create.mockResolvedValue(createdOrder);
      prismaMock.order.findUnique.mockResolvedValue(createdOrder);
      prismaMock.orderDetail.createMany.mockResolvedValue({ count: 2 });
      prismaMock.$queryRaw.mockResolvedValue([{ 'COUNT(*)': 0 }]);
    };

    it('✅ creates order and calls prisma order.create + detail.createMany', async () => {
      setupSuccessOrderCreate();

      const req = validAuthReq();
      const res = mockRes();
      const next = mockNext();

      await create(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(prismaMock.order.create).toHaveBeenCalled();
      expect(prismaMock.orderDetail.createMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Order berhasil dibuat' })
      );
    });

    it('❌ returns 400 when warehouse not found', async () => {
      prismaMock.warehouse.findUnique.mockResolvedValue(null);

      const req = validAuthReq();
      const res = mockRes();

      await create(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Warehouse') })
      );
      expect(prismaMock.order.create).not.toHaveBeenCalled();
    });

    it('❌ returns 400 when supplier not found', async () => {
      prismaMock.supplier.findUnique.mockResolvedValue(null);

      const req = validAuthReq();
      const res = mockRes();

      await create(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Supplier') })
      );
    });

    it('❌ returns 400 when approval user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const req = validAuthReq();
      const res = mockRes();

      await create(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('approval') })
      );
    });

    it('❌ returns 400 when some items not found or inactive', async () => {
      // Only 1 of 2 items returned — item[1] missing/inactive
      prismaMock.item.findMany.mockResolvedValue([{ item_id: 1n, status: 'A' }]);

      const req = validAuthReq();
      const res = mockRes();

      await create(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('tidak ditemukan') })
      );
    });

    it('❌ returns 500 when order status "Open" missing from DB', async () => {
      prismaMock.orderStatus.findFirst.mockResolvedValue(null);

      const req = validAuthReq();
      const res = mockRes();

      await create(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('order_statuses') })
      );
    });

    it('✅ logs order creation with user context from token', async () => {
      setupSuccessOrderCreate();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const req = validAuthReq({ user: { user_id: 7, role_id: 2, role_code: 'MANAGER' } });
      const res = mockRes();

      await create(req, res, mockNext());

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[ORDER] Created:'));
      consoleSpy.mockRestore();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // DELETE
  // ────────────────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('✅ deletes order and order_details in transaction', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        order_id: 1n,
        order_number: 'PO26060101',
        order_status: { status_code: '10', status_name: 'Open' },
        _count: { order_details: 2 },
      });
      prismaMock.orderDetail.deleteMany.mockResolvedValue({ count: 2 });
      prismaMock.order.delete.mockResolvedValue({ order_id: 1n });

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();
      await remove(req, res, mockNext());

      expect(prismaMock.orderDetail.deleteMany).toHaveBeenCalledWith({ where: { order_id: 1n } });
      expect(prismaMock.order.delete).toHaveBeenCalledWith({ where: { order_id: 1n } });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('❌ returns 400 for verified/cancelled order', async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        order_id: 2n,
        order_number: 'PO26060102',
        order_status: { status_code: '40', status_name: 'Verified' },
        _count: { order_details: 1 },
      });

      const res = mockRes();
      await remove(mockReq({ params: { id: '2' } }), res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(prismaMock.order.delete).not.toHaveBeenCalled();
    });
  });
});