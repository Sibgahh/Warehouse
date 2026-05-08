import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import verifyToken from '../middlewares/verifyToken.js';

const router = Router();

// ==============================
// Auth Routes
// ==============================

// POST /api/auth/register - Daftar user baru
router.post('/register', register);

// POST /api/auth/login - Login & generate JWT
router.post('/login', login);

// GET /api/auth/me - Get current user profile (protected)
router.get('/me', verifyToken, getMe);

export default router;
