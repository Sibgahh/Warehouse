import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    role: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../src/config/prisma.js', () => ({ default: prismaMock }));

import { create, getAll, remove, update } from '../src/controllers/roleController.js';
import { mockNext, mockReq, mockRes } from './helpers/mockFactory.js';

describe('Role Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all roles', async () => {
    prismaMock.role.findMany.mockResolvedValue([{ role_id: 1, role_code: 'ADMIN' }]);
    const res = mockRes();
    await getAll(mockReq(), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('creates role when code is unique', async () => {
    prismaMock.role.findUnique.mockResolvedValue(null);
    prismaMock.role.create.mockResolvedValue({ role_id: 4, role_code: 'QA', role_name: 'Quality' });

    const res = mockRes();
    await create(mockReq({ body: { role_code: 'QA', role_name: 'Quality', is_active: true } }), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(201);
    expect(prismaMock.role.create).toHaveBeenCalled();
  });

  it('rejects duplicate role_code', async () => {
    prismaMock.role.findUnique.mockResolvedValue({ role_id: 1, role_code: 'ADMIN' });
    const res = mockRes();
    await create(mockReq({ body: { role_code: 'ADMIN', role_name: 'Admin' } }), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('updates existing role', async () => {
    prismaMock.role.findUnique.mockResolvedValueOnce({ role_id: 2, role_code: 'MGR' });
    prismaMock.role.update.mockResolvedValue({ role_id: 2, role_name: 'Manager' });
    const res = mockRes();
    await update(mockReq({ params: { id: '2' }, body: { role_name: 'Manager' } }), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('prevents delete when role still used by users', async () => {
    prismaMock.role.findUnique.mockResolvedValue({
      role_id: 2,
      _count: { users: 3, role_menus: 0, role_submenus: 0 },
    });
    const res = mockRes();
    await remove(mockReq({ params: { id: '2' } }), res, mockNext());
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
