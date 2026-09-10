// backend/src/routes/report.routes.ts
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { reportLimiter } from '../middleware/rateLimiter.js';
import * as controller from '../controllers/report.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/financial', reportLimiter, requireRole('OWNER'), controller.financial);
router.get('/appointments', reportLimiter, requireRole('OWNER'), controller.appointments);
router.get('/therapists', reportLimiter, requireRole('OWNER'), controller.therapists);

export default router;