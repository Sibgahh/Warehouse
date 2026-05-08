import prisma from '../config/prisma.js';

/**
 * Health Check Controller
 * Mengecek status server dan koneksi database
 */
export const healthCheck = async (req, res, next) => {
  try {
    // Cek koneksi database
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: 'Server is running',
      data: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'connected',
      },
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      data: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'disconnected',
      },
    });
  }
};
