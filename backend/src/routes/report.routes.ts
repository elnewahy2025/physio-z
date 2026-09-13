// backend/src/routes/report.routes.ts
import { Router } from 'express';
import { requireAuth, requireRole, ADVANCED_MANAGER_OR_OWNER } from '../middleware/auth.js';
import { reportLimiter } from '../middleware/rateLimiter.js';
import * as controller from '../controllers/report.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/financial', reportLimiter, requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.financial);
router.get('/outstanding', reportLimiter, requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.outstanding);
router.get('/therapists', reportLimiter, requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.therapists);
router.get('/patients', reportLimiter, requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.patients);
router.get('/appointments', reportLimiter, requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.appointments);
router.get('/rooms', reportLimiter, requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.rooms);
router.get('/tax', reportLimiter, requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.tax);

export default router;