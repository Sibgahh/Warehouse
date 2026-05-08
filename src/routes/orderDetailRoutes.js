import { Router } from 'express';
import * as orderDetailController from '../controllers/orderDetailController.js';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';
import { validate } from '../middlewares/validate.js';
import { orderDetailCreateSchema, orderDetailUpdateSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', verifyToken, checkRole(['ADMIN', 'MANAGER']), orderDetailController.getAll);
router.get('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), orderDetailController.getById);
router.post('/', verifyToken, checkRole(['ADMIN', 'MANAGER']), validate(orderDetailCreateSchema), orderDetailController.create);
router.put('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), validate(orderDetailUpdateSchema), orderDetailController.update);
router.delete('/:id', verifyToken, checkRole(['ADMIN']), orderDetailController.remove);

export default router;
