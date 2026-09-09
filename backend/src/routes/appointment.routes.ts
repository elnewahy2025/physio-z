import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as controller from '../controllers/appointment.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/', requireRole('OWNER', 'SECRETARY', 'THERAPIST', 'PATIENT'), controller.list);
router.get('/:id', requireRole('OWNER', 'SECRETARY', 'THERAPIST', 'PATIENT'), controller.getById);
router.post('/', requireRole('OWNER', 'SECRETARY', 'PATIENT'), controller.create);
router.put('/:id', requireRole('OWNER', 'SECRETARY'), controller.update);
router.patch('/:id/status', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), controller.changeStatus);
export default router;