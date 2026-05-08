import prisma from '../config/prisma.js';

export const getAll = async (req, res, next) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { warehouse_id: 'desc' }
    });
    res.status(200).json({
      success: true,
      data: warehouses
    });
  } catch (error) {
    next(error);
  }
};
