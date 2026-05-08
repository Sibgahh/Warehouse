import { Router } from 'express';
import { getAll, getById, update, remove } from '../controllers/userController.js';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';

const router = Router();

router.get('/', verifyToken, checkRole(['ADMIN']), getAll);
router.get('/:id', verifyToken, checkRole(['ADMIN']), getById);
router.put('/:id', verifyToken, checkRole(['ADMIN']), update);
router.delete('/:id', verifyToken, checkRole(['ADMIN']), remove);

export default router;
