// backend/src/routes/report.routes.ts
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { reportLimiter } from '../middleware/rateLimiter.js';
import * as controller from '../controllers/report.controller.js';

const router = Router();
router.use(requireAuth);

// All reports are OWNER only
router.get('/financial', reportLimiter, requireRole('OWNER'), controller.financial);
router.get('/outstanding', reportLimiter, requireRole('OWNER'), controller.outstanding);
router.get('/therapists', reportLimiter, requireRole('OWNER'), controller.therapists);
router.get('/patients', reportLimiter, requireRole('OWNER'), controller.patients);
router.get('/appointments', reportLimiter, requireRole('OWNER'), controller.appointments);
router.get('/rooms', reportLimiter, requireRole('OWNER'), controller.rooms);
router.get('/tax', reportLimiter, requireRole('OWNER'), controller.tax);

export default router;