import { Router } from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';
import { validate } from '../middlewares/validate.js';
import { getAll, getById, create, update, remove } from '../controllers/itemController.js';
import { itemCreateSchema, itemUpdateSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, getById);

// Admin & Manager Only — Zod validates body before controller runs
router.post('/', verifyToken, checkRole(['ADMIN', 'MANAGER']), validate(itemCreateSchema), create);
router.put('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), validate(itemUpdateSchema), update);
router.delete('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), remove);

export default router;