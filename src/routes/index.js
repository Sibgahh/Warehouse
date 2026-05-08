import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import itemRoutes from './itemRoutes.js';
import orderRoutes from './orderRoutes.js';
import reportRoutes from './reportRoutes.js';
import warehouseRoutes from './warehouseRoutes.js';
import userRoutes from './userRoutes.js';
import storeRoutes from './storeRoutes.js';
import menuRoutes from './menuRoutes.js';
import submenuRoutes from './submenuRoutes.js';
import roleMenuRoutes from './roleMenuRoutes.js';
import roleSubmenuRoutes from './roleSubmenuRoutes.js';
import roleRoutes from './roleRoutes.js';
import orderStatusRoutes from './orderStatusRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import orderDetailRoutes from './orderDetailRoutes.js';

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
router.use('/users', userRoutes);
router.use('/stores', storeRoutes);
router.use('/menus', menuRoutes);
router.use('/submenus', submenuRoutes);
router.use('/role-menus', roleMenuRoutes);
router.use('/role-submenus', roleSubmenuRoutes);
router.use('/roles', roleRoutes);
router.use('/order-statuses', orderStatusRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/order-details', orderDetailRoutes);

export default router;
