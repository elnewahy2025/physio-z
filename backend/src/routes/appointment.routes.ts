// backend/src/routes/appointment.routes.ts
import { Router } from 'express';
import { requireAuth, requireRole, ANY_MANAGER_OR_OWNER } from '../middleware/auth.js';
import * as controller from '../controllers/appointment.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', requireRole('OWNER', 'SECRETARY', 'THERAPIST', 'PATIENT', ...ANY_MANAGER_OR_OWNER), controller.list);
router.get('/:id', requireRole('OWNER', 'SECRETARY', 'THERAPIST', 'PATIENT', ...ANY_MANAGER_OR_OWNER), controller.getById);

// Patients can CREATE appointments (for themselves); Managers can too
router.post('/', requireRole('OWNER', 'SECRETARY', 'PATIENT', ...ANY_MANAGER_OR_OWNER), controller.create);

router.put('/:id', requireRole('OWNER', 'SECRETARY', 'THERAPIST', ...ANY_MANAGER_OR_OWNER), controller.update);
router.patch('/:id/status', requireRole('OWNER', 'SECRETARY', 'THERAPIST', ...ANY_MANAGER_OR_OWNER), controller.changeStatus);

export default router;