import { Router } from 'express';
import { create, getAll, getById, remove, update } from '../controllers/roleController.js';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';
import { validate } from '../middlewares/validate.js';
import { roleCreateSchema, roleUpdateSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', verifyToken, checkRole(['ADMIN', 'MANAGER']), getAll);
router.get('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), getById);
router.post('/', verifyToken, checkRole(['ADMIN']), validate(roleCreateSchema), create);
router.put('/:id', verifyToken, checkRole(['ADMIN']), validate(roleUpdateSchema), update);
router.delete('/:id', verifyToken, checkRole(['ADMIN']), remove);

export default router;
