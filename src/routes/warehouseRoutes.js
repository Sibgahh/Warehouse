import { Router } from 'express';
import * as warehouseController from '../controllers/warehouseController.js';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';
import { validate } from '../middlewares/validate.js';
import { warehouseCreateSchema, warehouseUpdateSchema } from '../validators/schemas.js';

const router = Router();

// ==============================
// Warehouse Routes
// GET    /api/warehouses          - List all (ADMIN/MANAGER)
// POST   /api/warehouses          - Create (ADMIN/MANAGER)
// GET    /api/warehouses/:id      - Detail (ADMIN/MANAGER)
// PUT    /api/warehouses/:id      - Update (ADMIN/MANAGER)
// DELETE /api/warehouses/:id      - Delete (ADMIN/MANAGER)
// ==============================

router.get('/', verifyToken, checkRole(['ADMIN', 'MANAGER']), warehouseController.getAll);
router.post('/', verifyToken, checkRole(['ADMIN', 'MANAGER']), validate(warehouseCreateSchema), warehouseController.create);
router.get('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), warehouseController.getById);
router.put('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), validate(warehouseUpdateSchema), warehouseController.update);
router.delete('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), warehouseController.remove);

export default router;
