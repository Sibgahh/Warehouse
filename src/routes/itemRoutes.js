import { Router } from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';
import { getAll, getById, create, update, remove } from '../controllers/itemController.js';

const router = Router();

router.get('/',  verifyToken, getAll);
router.get('/:id', verifyToken, getById);

// Admin & Manager Only
router.post('/',  verifyToken, checkRole(['ADMIN', 'MANAGER']), create);
router.put('/:id',  verifyToken, checkRole(['ADMIN', 'MANAGER']), update);
router.delete('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), remove);

export default router;