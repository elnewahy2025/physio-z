import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as controller from '../controllers/settings.controller.js';

const router = Router();
router.get('/', controller.get);
router.put('/', requireAuth, requireRole('OWNER'), controller.update);
export default router;