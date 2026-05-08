import { Router } from 'express';
import * as menuController from '../controllers/menuController.js';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';
import { validate } from '../middlewares/validate.js';
import { menuCreateSchema, menuUpdateSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', verifyToken, checkRole(['ADMIN', 'MANAGER']), menuController.getAll);
router.get('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), menuController.getById);
router.post('/', verifyToken, checkRole(['ADMIN']), validate(menuCreateSchema), menuController.create);
router.put('/:id', verifyToken, checkRole(['ADMIN']), validate(menuUpdateSchema), menuController.update);
router.delete('/:id', verifyToken, checkRole(['ADMIN']), menuController.remove);

export default router;
