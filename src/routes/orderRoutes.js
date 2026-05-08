import { Router } from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import { create, getAll, getById } from '../controllers/orderController.js';

const router = Router();

// ==============================
// Order Routes (semua protected)
// ==============================

// GET    /api/orders        - List semua orders
// GET    /api/orders/:id    - Detail order + line items
// POST   /api/orders        - Buat order baru (with items)

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, getById);
router.post('/', verifyToken, create);

export default router;
