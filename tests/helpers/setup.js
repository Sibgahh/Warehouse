/**
 * Test setup file — runs before every test file
 * Set NODE_ENV=test so prisma.js doesn't spam console logs
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests-only';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = '';
process.env.DB_NAME = 'warehouse_test';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173';