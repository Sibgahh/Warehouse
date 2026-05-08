import { PrismaClient } from '../../generated/prisma/client.ts';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// ─── Setup adapter MySQL/MariaDB ───
const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'warehouse_test',
});

const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});

export default prisma;
