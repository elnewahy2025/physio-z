// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { login, refresh, logout, register, changePassword } from '../controllers/auth.controller.js';
import {
  loginLimiter,
  registerLimiter,
  sensitiveOpLimiter,
} from '../middleware/rateLimiter.js';

const router = Router();

// Public (rate-limited) endpoints
router.post('/login', loginLimiter, login);
router.post('/register', registerLimiter, register);
router.post('/refresh', sensitiveOpLimiter, refresh);
router.post('/logout', logout);

// Authenticated endpoint — change password
router.patch('/change-password', requireAuth, sensitiveOpLimiter, changePassword);

export default router;