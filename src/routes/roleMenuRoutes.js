import { Router } from 'express';
import * as roleMenuController from '../controllers/roleMenuController.js';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';
import { validate } from '../middlewares/validate.js';
import { roleMenuCreateSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', verifyToken, checkRole(['ADMIN']), roleMenuController.getAll);
router.get('/by-role/:roleId', verifyToken, checkRole(['ADMIN']), roleMenuController.getByRole);
router.post('/', verifyToken, checkRole(['ADMIN']), validate(roleMenuCreateSchema), roleMenuController.create);
router.delete('/:id', verifyToken, checkRole(['ADMIN']), roleMenuController.remove);

export default router;
