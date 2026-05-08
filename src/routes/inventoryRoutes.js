import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController.js';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';
import { validate } from '../middlewares/validate.js';
import { inventoryCreateSchema, inventoryUpdateSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', verifyToken, checkRole(['ADMIN', 'MANAGER']), inventoryController.getAll);
router.get('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), inventoryController.getById);
router.post('/', verifyToken, checkRole(['ADMIN', 'MANAGER']), validate(inventoryCreateSchema), inventoryController.create);
router.put('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), validate(inventoryUpdateSchema), inventoryController.update);
router.delete('/:id', verifyToken, checkRole(['ADMIN']), inventoryController.remove);

export default router;
