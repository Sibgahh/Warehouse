/**
 * Middleware Tests
 *
 * Coverage: verifyToken, checkRole, validate middleware + Zod schemas
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// ─── Mock prisma — vi.hoisted so it is initialized before hoisting ────────────
const { prismaMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      role: { findUnique: vi.fn() },
      user: { findUnique: vi.fn() },
    },
  };
});

vi.mock('../src/config/prisma.js', () => ({ default: prismaMock }));

import verifyToken from '../src/middlewares/verifyToken.js';
import checkRole from '../src/middlewares/checkRole.js';
import { validate } from '../src/middlewares/validate.js';
import {
  registerSchema,
  loginSchema,
  orderCreateSchema,
  supplierCreateSchema,
} from '../src/validators/schemas.js';
import { mockReq, mockRes, mockNext, MOCK_ROLES } from './helpers/mockFactory.js';

// ─── helpers ──────────────────────────────────────────────────────────────────
const makeToken = (payload, secret = process.env.JWT_SECRET) =>
  jwt.sign(payload, secret, { expiresIn: '1h' });

describe('verifyToken middleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('✅ decodes valid token and attaches user to req', async () => {
    const token = makeToken({ user_id: 5, role_id: 2, role_code: 'MANAGER' });
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = mockRes();
    const next = mockNext();

    await verifyToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ user_id: 5, role_id: 2, role_code: 'MANAGER' });
  });

  it('❌ returns 401 when Authorization header is missing', async () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();
    const next = mockNext();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Akses ditolak. Token tidak ditemukan.' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('❌ returns 401 when token is malformed', async () => {
    const req = mockReq({ headers: { authorization: 'Bearer not.a.valid.jwt' } });
    const res = mockRes();
    const next = mockNext();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('❌ returns 401 when token is expired', async () => {
    const token = jwt.sign({ user_id: 1 }, process.env.JWT_SECRET, { expiresIn: '-1s' });
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = mockRes();
    const next = mockNext();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Token sudah kadaluarsa. Silakan login ulang.' })
    );
  });

  it('❌ returns 401 when token signed with wrong secret', async () => {
    const token = jwt.sign({ user_id: 1 }, 'wrong-secret');
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = mockRes();
    const next = mockNext();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Token tidak valid.' })
    );
  });

  it('✅ forwards role_code as null for legacy tokens without it', async () => {
    const token = makeToken({ user_id: 3, role_id: 1 }); // no role_code
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = mockRes();
    const next = mockNext();

    await verifyToken(req, res, next);

    expect(req.user.role_code).toBeNull();
  });
});

describe('checkRole middleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('✅ allows user with matching role_code from token (NO DB call)', async () => {
    const req = mockReq({ user: { user_id: 1, role_id: 1, role_code: 'ADMIN' } });
    const res = mockRes();
    const next = mockNext();

    await checkRole(['ADMIN', 'MANAGER'])(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(prismaMock.role.findUnique).not.toHaveBeenCalled(); // zero DB queries
  });

  it('✅ case-insensitive role matching', async () => {
    const req = mockReq({ user: { user_id: 2, role_id: 2, role_code: 'manager' } });
    const res = mockRes();
    const next = mockNext();

    await checkRole(['ADMIN', 'MANAGER'])(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('❌ returns 403 when role not in allowed list', async () => {
    const req = mockReq({ user: { user_id: 3, role_id: 3, role_code: 'STAFF' } });
    const res = mockRes();
    const next = mockNext();

    prismaMock.user.findUnique.mockResolvedValue({
      role: { role_code: 'STAFF', role_name: 'Staff' },
    });

    await checkRole(['ADMIN', 'MANAGER'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('❌ returns 401 when req.user is missing', async () => {
    const req = mockReq({ user: null });
    const res = mockRes();
    const next = mockNext();

    await checkRole(['ADMIN'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('✅ falls back to DB lookup for legacy tokens (no role_code in token)', async () => {
    const req = mockReq({ user: { user_id: 1, role_id: 1, role_code: null } });
    const res = mockRes();
    const next = mockNext();

    prismaMock.user.findUnique.mockResolvedValue({
      role: { role_code: MOCK_ROLES.ADMIN.role_code, role_name: MOCK_ROLES.ADMIN.role_name },
    });

    await checkRole(['ADMIN'])(req, res, next);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { user_id: 1 },
      select: {
        role: {
          select: { role_code: true, role_name: true },
        },
      },
    });
    expect(next).toHaveBeenCalled();
  });

  it('❌ returns 403 when DB role lookup also fails', async () => {
    const req = mockReq({ user: { user_id: 1, role_id: 99, role_code: null } });
    const res = mockRes();
    const next = mockNext();

    prismaMock.user.findUnique.mockResolvedValue(null);

    await checkRole(['ADMIN'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('validate middleware — body', () => {
  beforeEach(() => vi.clearAllMocks());

  it('✅ passes valid data through to controller (req.body replaced)', async () => {
    const req = mockReq({
      body: { user_name: 'staffuser', password: 'securepass123' },
    });
    const res = mockRes();
    const next = mockNext();

    await validate(loginSchema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ user_name: 'staffuser', password: 'securepass123' });
  });

  it('❌ returns 400 with field-level errors on invalid data', async () => {
    const req = mockReq({ body: { user_name: '', password: '' } });
    const res = mockRes();
    const next = mockNext();

    await validate(loginSchema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Validasi gagal',
        errors: expect.arrayContaining([
          expect.objectContaining({ field: 'user_name' }),
          expect.objectContaining({ field: 'password' }),
        ]),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('❌ returns 400 when body is completely empty', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();
    const next = mockNext();

    await validate(loginSchema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

// ─── Zod Schema Tests ─────────────────────────────────────────────────────────
describe('Zod schemas', () => {
  describe('loginSchema', () => {
    it('✅ accepts valid username + password', async () => {
      const result = await loginSchema.safeParseAsync({
        user_name: 'admin',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('❌ rejects missing user_name', async () => {
      const result = await loginSchema.safeParseAsync({ password: 'pass' });
      expect(result.success).toBe(false);
      expect(result.error.issues[0].path).toContain('user_name');
    });

    it('❌ rejects missing password', async () => {
      const result = await loginSchema.safeParseAsync({ user_name: 'admin' });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('✅ accepts valid registration data', async () => {
      const result = await registerSchema.safeParseAsync({
        user_name: 'newstaff',
        full_name: 'New Staff Member',
        password: 'securepassword123',
        role_id: '3',
      });
      expect(result.success).toBe(true);
      expect(result.data.role_id).toBe(3); // transformed to number
    });

    it('❌ rejects username with spaces', async () => {
      const result = await registerSchema.safeParseAsync({
        user_name: 'admin user',
        full_name: 'Admin',
        password: 'securepassword123',
        role_id: '1',
      });
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('huruf, angka');
    });

    it('❌ rejects password shorter than 8 chars', async () => {
      const result = await registerSchema.safeParseAsync({
        user_name: 'newuser',
        full_name: 'New',
        password: '1234567',
        role_id: '3',
      });
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('8 karakter');
    });
  });

  describe('orderCreateSchema', () => {
    it('✅ accepts valid order payload with type transformations', async () => {
      const result = await orderCreateSchema.safeParseAsync({
        warehouse_id: '1',
        supplier_id: '1',
        delivery_start_date: '2026-06-01',
        delivery_end_date: '2026-06-15',
        approval_id: '1',
        items: [
          { item_id: '1', qty_ordered: '100' },
          { item_id: '2', qty_ordered: '50' },
        ],
      });
      expect(result.success).toBe(true);
      expect(result.data.warehouse_id).toBe(1);    // string → Number
      expect(result.data.supplier_id).toBe(1n);    // string → BigInt
      expect(result.data.items[0].qty_ordered).toBe(100);
    });

    it('❌ rejects order without items', async () => {
      const result = await orderCreateSchema.safeParseAsync({
        warehouse_id: '1',
        supplier_id: '1',
        delivery_start_date: '2026-06-01',
        delivery_end_date: '2026-06-15',
        approval_id: '1',
        items: [],
      });
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('minimal 1 item');
    });

    it('❌ rejects order with duplicate item_id', async () => {
      const result = await orderCreateSchema.safeParseAsync({
        warehouse_id: '1',
        supplier_id: '1',
        delivery_start_date: '2026-06-01',
        delivery_end_date: '2026-06-15',
        approval_id: '1',
        items: [
          { item_id: '1', qty_ordered: '100' },
          { item_id: '1', qty_ordered: '50' },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('duplikat');
    });

    it('❌ rejects qty_ordered = 0', async () => {
      const result = await orderCreateSchema.safeParseAsync({
        warehouse_id: '1',
        supplier_id: '1',
        delivery_start_date: '2026-06-01',
        delivery_end_date: '2026-06-15',
        approval_id: '1',
        items: [{ item_id: '1', qty_ordered: '0' }],
      });
      expect(result.success).toBe(false);
    });

    it('❌ rejects negative qty_ordered', async () => {
      const result = await orderCreateSchema.safeParseAsync({
        warehouse_id: '1',
        supplier_id: '1',
        delivery_start_date: '2026-06-01',
        delivery_end_date: '2026-06-15',
        approval_id: '1',
        items: [{ item_id: '1', qty_ordered: '-5' }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('supplierCreateSchema', () => {
    it('✅ accepts valid supplier with optional fields', async () => {
      const result = await supplierCreateSchema.safeParseAsync({
        supplier_code: 'SUP999',
        supplier_name: 'PT Testing Supplier',
        email: 'test@supplier.com',
      });
      expect(result.success).toBe(true);
    });

    it('❌ rejects invalid email format', async () => {
      const result = await supplierCreateSchema.safeParseAsync({
        supplier_code: 'SUP999',
        supplier_name: 'PT Testing',
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('email');
    });

    it('❌ rejects supplier_code longer than 10 chars', async () => {
      const result = await supplierCreateSchema.safeParseAsync({
        supplier_code: 'SUPPLIERCODE123',
        supplier_name: 'Too Long Code',
      });
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toContain('10 karakter');
    });

    it('❌ rejects empty supplier_name', async () => {
      const result = await supplierCreateSchema.safeParseAsync({
        supplier_code: 'SUP999',
        supplier_name: '',
      });
      expect(result.success).toBe(false);
    });
  });
});