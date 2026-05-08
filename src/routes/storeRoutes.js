import { Router } from 'express';
import * as storeController from '../controllers/storeController.js';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';
import { validate } from '../middlewares/validate.js';
import { storeCreateSchema, storeUpdateSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', verifyToken, checkRole(['ADMIN', 'MANAGER']), storeController.getAll);
router.get('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), storeController.getById);
router.post('/', verifyToken, checkRole(['ADMIN', 'MANAGER']), validate(storeCreateSchema), storeController.create);
router.put('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), validate(storeUpdateSchema), storeController.update);
router.delete('/:id', verifyToken, checkRole(['ADMIN']), storeController.remove);

export default router;
