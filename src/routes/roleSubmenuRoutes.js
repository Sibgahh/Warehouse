import { Router } from 'express';
import * as roleSubmenuController from '../controllers/roleSubmenuController.js';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';
import { validate } from '../middlewares/validate.js';
import { roleSubmenuCreateSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', verifyToken, checkRole(['ADMIN']), roleSubmenuController.getAll);
router.post('/', verifyToken, checkRole(['ADMIN']), validate(roleSubmenuCreateSchema), roleSubmenuController.create);
router.delete('/:id', verifyToken, checkRole(['ADMIN']), roleSubmenuController.remove);

export default router;
