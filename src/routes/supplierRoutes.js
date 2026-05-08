import { Router } from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';
import { validate } from '../middlewares/validate.js';
import {
  getAll,
  getById,
  create,
  update,
  remove,
} from '../controllers/supplierController.js';
import { supplierCreateSchema, supplierUpdateSchema } from '../validators/schemas.js';

const router = Router();

// ==============================
// Supplier Routes
// ==============================

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, getById);

// Admin & Manager Only — Zod validates body before controller runs
router.post('/', verifyToken, checkRole(['ADMIN', 'MANAGER']), validate(supplierCreateSchema), create);
router.put('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), validate(supplierUpdateSchema), update);
router.delete('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), remove);

export default router;
