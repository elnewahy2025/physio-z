import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as controller from '../controllers/session.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/', requireRole('OWNER', 'THERAPIST'), controller.list);
router.get('/:id', requireRole('OWNER', 'THERAPIST'), controller.getById);
router.post('/', requireRole('OWNER', 'THERAPIST'), controller.create);
router.put('/:id', requireRole('OWNER', 'THERAPIST'), controller.update);
export default router;