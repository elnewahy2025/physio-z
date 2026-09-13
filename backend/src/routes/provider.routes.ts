import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as controller from '../controllers/provider.controller.js';

const router = Router();
router.use(requireAuth);

router.post('/sync-calendar', requireRole('OWNER', 'THERAPIST', 'SECRETARY'), controller.syncEvent);
router.post('/meeting', requireRole('OWNER', 'THERAPIST'), controller.generateMeeting);

export default router;
