import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as controller from '../controllers/report.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/financial', requireRole('OWNER'), controller.financial);
router.get('/appointments', requireRole('OWNER'), controller.appointments);
router.get('/therapists', requireRole('OWNER'), controller.therapists);
export default router;