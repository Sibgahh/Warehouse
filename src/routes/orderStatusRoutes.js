import { Router } from 'express';
import * as orderStatusController from '../controllers/orderStatusController.js';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';
import { validate } from '../middlewares/validate.js';
import { orderStatusCreateSchema, orderStatusUpdateSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', verifyToken, checkRole(['ADMIN', 'MANAGER']), orderStatusController.getAll);
router.get('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), orderStatusController.getById);
router.post('/', verifyToken, checkRole(['ADMIN']), validate(orderStatusCreateSchema), orderStatusController.create);
router.put('/:id', verifyToken, checkRole(['ADMIN']), validate(orderStatusUpdateSchema), orderStatusController.update);
router.delete('/:id', verifyToken, checkRole(['ADMIN']), orderStatusController.remove);

export default router;
