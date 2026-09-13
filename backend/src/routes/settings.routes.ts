import { Router } from 'express';
import { requireAuth, requireRole, PREMIUM_MANAGER_OR_OWNER } from '../middleware/auth.js';
import * as controller from '../controllers/settings.controller.js';

const router = Router();
// GET: settings visible to PREMIUM+ (OWNER reads, PREMIUM reads)
router.get('/', controller.get);
// PUT: only PREMIUM_MANAGER or OWNER can update settings
router.put('/', requireAuth, requireRole(...PREMIUM_MANAGER_OR_OWNER), controller.update);
export default router;