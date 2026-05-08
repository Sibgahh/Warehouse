import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/authController.js';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';
import { loginLimiter, registerLimiter } from '../middlewares/rateLimiter.js';
import { validate } from '../middlewares/validate.js';
import {
  registerSchema,
  loginSchema,
} from '../validators/schemas.js';

const router = Router();

// ==============================
// Auth Routes
// ==============================

// POST /api/auth/register - Daftar user baru (HANYA ADMIN)
// Rate limited: max 5× per IP per 15 menit
router.post('/register',
  verifyToken,
  checkRole(['ADMIN']),
  registerLimiter,
  validate(registerSchema),
  register
);

// POST /api/auth/login - Login & generate JWT
// Rate limited: max 10× per IP per 15 menit (brute-force protection)
router.post('/login',
  loginLimiter,
  validate(loginSchema),
  login
);

// GET  /api/auth/me    - Get current user profile (protected)
// POST /api/auth/logout - Logout & reset is_login (protected)
router.get('/me', verifyToken, getMe);
router.post('/logout', verifyToken, logout);

export default router;
