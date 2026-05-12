import { Router } from 'express';
import * as submenuController from '../controllers/submenuController.js';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';
import { validate } from '../middlewares/validate.js';
import { submenuCreateSchema, submenuUpdateSchema, submenuReorderSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', verifyToken, checkRole(['ADMIN', 'MANAGER']), submenuController.getAll);
router.get('/:id', verifyToken, checkRole(['ADMIN', 'MANAGER']), submenuController.getById);
router.post('/', verifyToken, checkRole(['ADMIN']), validate(submenuCreateSchema), submenuController.create);
// PATCH /reorder didaftarkan SEBELUM /:id supaya tidak ditangkap sebagai param id.
router.patch('/reorder', verifyToken, checkRole(['ADMIN']), validate(submenuReorderSchema), submenuController.reorder);
router.put('/:id', verifyToken, checkRole(['ADMIN']), validate(submenuUpdateSchema), submenuController.update);
router.delete('/:id', verifyToken, checkRole(['ADMIN']), submenuController.remove);

export default router;
