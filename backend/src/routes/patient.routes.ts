import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as controller from '../controllers/patient.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), controller.list);
router.get('/me', requireRole('PATIENT'), controller.getOwn);
router.get('/:id', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), controller.getById);
router.post('/', requireRole('OWNER', 'SECRETARY'), controller.create);
router.put('/:id', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), controller.update);
router.delete('/:id', requireRole('OWNER'), controller.remove);
export default router;