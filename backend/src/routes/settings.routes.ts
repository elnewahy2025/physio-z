import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as controller from '../controllers/settings.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/', requireRole('OWNER', 'SECRETARY'), controller.get);
router.put('/', requireRole('OWNER'), controller.update);
export default router;