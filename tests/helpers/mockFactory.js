/**
 * Test helpers — shared mock factories and utilities
 */
import jwt from 'jsonwebtoken';

// ─── Prisma mock factory ─────────────────────────────────────────────────────
/**
 * Build a minimal Prisma mock that intercepts calls from controllers.
 *
 * Usage:
 *   const prisma = buildPrismaMock({
 *     user: {
 *       findFirst: vi.fn().mockResolvedValue(null),
 *       create: vi.fn().mockResolvedValue(mockUser),
 *     },
 *   });
 *
 * @param {object} models - flat object of model mocks { modelName: { methodName: fn } }
 * @returns a proxy that returns sub-mocks on property access
 */
export function buildPrismaMock(models = {}) {
  return new Proxy(models, {
    get(target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined;
      if (!target[prop]) {
        // Auto-create empty model mock for any accessed model
        target[prop] = {};
      }
      return target[prop];
    },
  });
}

// ─── Mock req / res / next ──────────────────────────────────────────────────
/**
 * Build a mock Express req object
 */
export function mockReq(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides,
  };
}

/**
 * Build a mock Express res object with vi.fn() spies for every method
 */
export function mockRes(overrides = {}) {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    statusCode: 200,
    ...overrides,
  };
  return res;
}

/**
 * Build a mock Express next function
 */
export function mockNext() {
  return vi.fn();
}

// ─── JWT helpers ─────────────────────────────────────────────────────────────
/**
 * Create a valid JWT for testing
 *
 * @param {object} payload - token payload { user_id, role_id, role_code }
 * @param {string} secret - defaults to process.env.JWT_SECRET
 */
export function makeToken(payload = {}, secret = process.env.JWT_SECRET) {
  const defaultPayload = { user_id: 1, role_id: 1, role_code: 'ADMIN', ...payload };
  return jwt.sign(defaultPayload, secret, { expiresIn: '1h' });
}

/**
 * Return an Authorization header value for a valid token
 */
export function authHeader(extraPayload = {}, secret = process.env.JWT_SECRET) {
  return `Bearer ${makeToken(extraPayload, secret)}`;
}

/**
 * Create an Express req with valid auth headers
 */
export function mockAuthReq(rolePayload = {}, overrides = {}) {
  const token = makeToken(rolePayload);
  return mockReq({
    headers: { authorization: `Bearer ${token}` },
    ...overrides,
  });
}

// ─── Date helpers ────────────────────────────────────────────────────────────
/**
 * Return YYYY-MM-DD string for N days from now
 */
export function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─── Seed data ───────────────────────────────────────────────────────────────
export const MOCK_ROLES = {
  ADMIN: { role_id: 1, role_code: 'ADMIN', role_name: 'Administrator', is_active: true },
  MANAGER: { role_id: 2, role_code: 'MANAGER', role_name: 'Manager', is_active: true },
  STAFF: { role_id: 3, role_code: 'STAFF', role_name: 'Staff', is_active: true },
};

export const MOCK_USERS = {
  admin: {
    user_id: 1,
    user_name: 'admin',
    full_name: 'Administrator',
    password: '$2a$10$kIqMZIWdPz0zJ5Pz9q5H5OqH5OqH5OqH5OqH5OqH5OqH5OqH5OqH5O', // dummy bcrypt hash
    role_id: 1,
    role_code: 'ADMIN',
    is_active: true,
    is_login: false,
  },
  manager: {
    user_id: 2,
    user_name: 'manager',
    full_name: 'Manager User',
    password: '$2a$10$kIqMZIWdPz0zJ5Pz9q5H5OqH5OqH5OqH5OqH5OqH5OqH5OqH5OqH5O',
    role_id: 2,
    role_code: 'MANAGER',
    is_active: true,
    is_login: false,
  },
  staff: {
    user_id: 3,
    user_name: 'staff',
    full_name: 'Staff User',
    password: '$2a$10$kIqMZIWdPz0zJ5Pz9q5H5OqH5OqH5OqH5OqH5OqH5OqH5OqH5OqH5O',
    role_id: 3,
    role_code: 'STAFF',
    is_active: true,
    is_login: false,
  },
};

export const MOCK_SUPPLIERS = [
  {
    supplier_id: 1n,
    supplier_code: 'SUP001',
    supplier_name: 'CV Sumber Makmur',
    email: 'info@sumbermakmur.co.id',
    phone_number: '0215551234',
    city: 'Jakarta',
    regency: 'Jakarta Selatan',
    address: 'Jl. Raya Pondok Indah No. 10',
    is_active: true,
  },
  {
    supplier_id: 2n,
    supplier_code: 'SUP002',
    supplier_name: 'PT Berkah Sentosa',
    email: 'sales@berkahsentosa.com',
    phone_number: '0215555678',
    city: 'Bandung',
    regency: 'Bandung',
    address: 'Jl. Braga No. 5',
    is_active: true,
  },
];

export const MOCK_WAREHOUSES = [
  {
    warehouse_id: 1,
    warehouse_code: 'WH01',
    warehouse_name: 'Gudang Utama Jakarta',
    email: 'gudang@hypermart.co.id',
    phone_number: '0215550001',
    city: 'Jakarta',
    regency: 'Jakarta Utara',
    address: 'Jl. Industri Raya No. 1',
    status: 'A',
  },
];

export const MOCK_ITEMS = [
  {
    item_id: 1n,
    item_name: 'Beras 5kg',
    description: 'Beras premium kemasan 5 kg',
    status: 'A',
    std_qty: 100,
    min_stock: 10,
    max_stock: 500,
    unit_cost: 45000,
    unit_retail: 52000,
    supplier_id: 1n,
  },
  {
    item_id: 2n,
    item_name: 'Minyak 2L',
    description: 'Minyak goreng curah 2 liter',
    status: 'A',
    std_qty: 80,
    min_stock: 5,
    max_stock: 300,
    unit_cost: 28000,
    unit_retail: 33000,
    supplier_id: 1n,
  },
];