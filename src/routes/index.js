import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import itemRoutes from './itemRoutes.js';
import orderRoutes from './orderRoutes.js';
import reportRoutes from './reportRoutes.js';
import warehouseRoutes from './warehouseRoutes.js';

const router = Router();

// ==============================
// Register Routes
// ==============================
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/items', itemRoutes);
router.use('/orders', orderRoutes);
router.use('/reports', reportRoutes);
router.use('/warehouses', warehouseRoutes);

export default router;
