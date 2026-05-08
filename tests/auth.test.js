/**
 * Auth Controller Tests
 *
 * Coverage: login, register, getMe, logout
 * Strategy: mock Prisma + bcryptjs + jsonwebtoken
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ─── Mock prisma — MUST use vi.hoisted() so it's initialized before hoisting ───
const { prismaMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      user: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      role: {
        findUnique: vi.fn(),
      },
    },
  };
});

vi.mock('../src/config/prisma.js', () => ({ default: prismaMock }));

import {
  login,
  register,
  getMe,
  logout,
} from '../src/controllers/authController.js';
import { mockReq, mockRes, mockNext, MOCK_ROLES, MOCK_USERS } from './helpers/mockFactory.js';

// ─── Shared bcrypt password hash ────────────────────────────────────────────────
const REAL_PASSWORD = 'password123';
const HASHED_PASSWORD = bcrypt.hashSync(REAL_PASSWORD, 10);

describe('Auth Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // LOGIN
  // ────────────────────────────────────────────────────────────────────────────
  describe('login', () => {
    it('✅ returns token on valid credentials', async () => {
      const mockUser = {
        user_id: 1,
        user_name: 'admin',
        full_name: 'Administrator',
        password: HASHED_PASSWORD,
        role_id: 1,
        is_active: true,
        is_login: false,
        role: { role_code: 'ADMIN', role_name: 'Administrator' },
      };

      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, is_login: true });

      const req = mockReq({ body: { user_name: 'admin', password: REAL_PASSWORD } });
      const res = mockRes();
      const next = mockNext();

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login berhasil',
          data: expect.objectContaining({
            token: expect.any(String),
            user: expect.objectContaining({
              user_name: 'admin',
              role: expect.objectContaining({ role_code: 'ADMIN' }),
            }),
          }),
        })
      );

      // Verify JWT contains role_code
      const callArgs = res.json.mock.calls[0][0];
      const decoded = jwt.verify(callArgs.data.token, process.env.JWT_SECRET);
      expect(decoded.role_code).toBe('ADMIN');
    });

    it('✅ calls prisma update is_login = true after successful login', async () => {
      const mockUser = {
        user_id: 1,
        user_name: 'admin',
        full_name: 'Administrator',
        password: HASHED_PASSWORD,
        role_id: 1,
        is_active: true,
        role: { role_code: 'ADMIN', role_name: 'Administrator' },
      };

      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, is_login: true });

      const req = mockReq({ body: { user_name: 'admin', password: REAL_PASSWORD } });
      const res = mockRes();

      await login(req, res, mockNext());

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { user_id: 1 },
        data: { is_login: true },
      });
    });

    it('❌ returns 401 when user not found', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const req = mockReq({ body: { user_name: 'nobody', password: REAL_PASSWORD } });
      const res = mockRes();

      await login(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Username atau password salah',
        })
      );
    });

    it('❌ returns 403 when account is inactive', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...MOCK_USERS.admin,
        is_active: false,
      });

      const req = mockReq({ body: { user_name: 'admin', password: REAL_PASSWORD } });
      const res = mockRes();

      await login(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Akun tidak aktif. Hubungi admin.' })
      );
    });

    it('❌ returns 401 when password is wrong', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...MOCK_USERS.admin,
        password: HASHED_PASSWORD,
        role: { role_code: 'ADMIN', role_name: 'Administrator' },
      });

      const req = mockReq({ body: { user_name: 'admin', password: 'wrongpassword' } });
      const res = mockRes();

      await login(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Username atau password salah' })
      );
    });

    it('❌ does NOT call prisma update when login fails', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await login(mockReq({ body: { user_name: 'nobody', password: 'x' } }), mockRes(), mockNext());

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // REGISTER
  // ──────────────────────────────────────────────────────────────���─────────────
  describe('register', () => {
    it('✅ creates user successfully when username is unique', async () => {
      const newUser = {
        user_id: 4,
        user_name: 'newuser',
        full_name: 'New User',
        role_id: 3,
        is_active: true,
        created_at: new Date(),
        role: { role_code: 'STAFF', role_name: 'Staff' },
      };

      prismaMock.user.findFirst.mockResolvedValue(null);       // username free
      prismaMock.role.findUnique.mockResolvedValue(MOCK_ROLES.STAFF);
      prismaMock.user.create.mockResolvedValue(newUser);

      const req = mockReq({
        body: {
          user_name: 'newuser',
          full_name: 'New User',
          password: REAL_PASSWORD,
          role_id: 3,
        },
      });
      const res = mockRes();

      await register(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User berhasil didaftarkan',
          data: expect.objectContaining({ user_name: 'newuser' }),
        })
      );
    });

    it('❌ returns 409 when username already exists', async () => {
      prismaMock.user.findFirst.mockResolvedValue(MOCK_USERS.admin);

      const req = mockReq({
        body: {
          user_name: 'admin',
          full_name: 'Administrator',
          password: REAL_PASSWORD,
          role_id: 1,
        },
      });
      const res = mockRes();

      await register(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Username sudah terdaftar' })
      );
      // Ensure create was never called
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('❌ returns 400 when role_id is invalid', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.role.findUnique.mockResolvedValue(null); // role not found

      const req = mockReq({
        body: {
          user_name: 'newuser',
          full_name: 'New User',
          password: REAL_PASSWORD,
          role_id: 999,
        },
      });
      const res = mockRes();

      await register(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'role_id tidak valid' })
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // GET ME
  // ─────────────────────────────────────────────────���──────────────────────────
  describe('getMe', () => {
    it('✅ returns user data when found', async () => {
      const meUser = {
        user_id: 1,
        user_name: 'admin',
        full_name: 'Administrator',
        role_id: 1,
        is_active: true,
        created_at: new Date(),
        role: { role_code: 'ADMIN', role_name: 'Administrator' },
      };

      prismaMock.user.findUnique.mockResolvedValue(meUser);

      const req = mockReq({ user: { user_id: 1, role_id: 1 } });
      const res = mockRes();

      await getMe(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ user_name: 'admin' }),
        })
      );
    });

    it('❌ returns 404 when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const req = mockReq({ user: { user_id: 999, role_id: 1 } });
      const res = mockRes();

      await getMe(req, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'User tidak ditemukan' })
      );
    });
  });

  // ──────────────────────────────────────────────────────────���─────────────────
  // LOGOUT
  // ────────────────────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('✅ resets is_login = false', async () => {
      prismaMock.user.update.mockResolvedValue({ user_id: 1, is_login: false });

      const req = mockReq({ user: { user_id: 1, role_id: 1 } });
      const res = mockRes();

      await logout(req, res, mockNext());

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { user_id: 1 },
        data: { is_login: false },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('❌ propagates error to next() on database failure', async () => {
      const dbError = new Error('Database connection failed');
      prismaMock.user.update.mockRejectedValue(dbError);

      const req = mockReq({ user: { user_id: 1, role_id: 1 } });
      const res = mockRes();
      const next = mockNext();

      await logout(req, res, next);

      expect(next).toHaveBeenCalledWith(dbError);
    });
  });
});