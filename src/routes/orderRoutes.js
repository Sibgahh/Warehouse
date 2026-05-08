import { Router } from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';
import { validate } from '../middlewares/validate.js';
import { create, getAll, getById, remove } from '../controllers/orderController.js';
import { orderCreateSchema } from '../validators/schemas.js';

const router = Router();

// ==============================
// Order Routes
// GET  /api/orders      - List orders (all authenticated roles)
// GET  /api/orders/:id  - Detail order + line items (all authenticated roles)
// POST /api/orders      - Create order (ADMIN / MANAGER only)
// ==============================

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, getById);
// Zod validates body before controller runs; checkRole before that
router.post('/', verifyToken, checkRole(['ADMIN', 'MANAGER']), validate(orderCreateSchema), create);
router.delete('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), remove);

export default router;
