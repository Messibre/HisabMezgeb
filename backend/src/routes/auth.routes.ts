import { Router } from 'express';
import validate from '../middlewares/validate.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  refreshTokenSchema,
} from '../schemas/auth.schema.js';
import {
  register,
  login,
  refresh,
  logout,
  changePassword,
} from '../controllers/auth.controller.js';

const router = Router();

// Public routes (rate-limited)
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', authLimiter, validate(refreshTokenSchema), refresh);

// Protected routes
router.post('/logout', authMiddleware, logout);
router.patch('/password', authMiddleware, validate(changePasswordSchema), changePassword);

export default router;
