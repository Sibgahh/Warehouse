import { Router } from 'express';
import * as warehouseController from '../controllers/warehouseController.js';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';

const router = Router();

// Hanya Admin & Manager yang bisa akses data gudang
router.get('/', verifyToken, checkRole(['ADMIN', 'MANAGER']), warehouseController.getAll);

export default router;
