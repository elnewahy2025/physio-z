import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as controller from '../controllers/room.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), controller.list);
router.get('/availability', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), controller.availability);
export default router;