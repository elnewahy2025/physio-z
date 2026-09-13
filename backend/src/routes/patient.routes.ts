import { Router } from 'express';
import { requireAuth, requireRole, ANY_MANAGER_OR_OWNER, ADVANCED_MANAGER_OR_OWNER } from '../middleware/auth.js';
import * as controller from '../controllers/patient.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/', requireRole('OWNER', 'SECRETARY', 'THERAPIST', ...ANY_MANAGER_OR_OWNER), controller.list);
router.get('/me', requireRole('PATIENT'), controller.getOwn);
router.get('/me/records', requireRole('PATIENT'), controller.getMyRecords);
router.get('/:id', requireRole('OWNER', 'SECRETARY', 'THERAPIST', ...ANY_MANAGER_OR_OWNER), controller.getById);
router.post('/', requireRole('OWNER', 'SECRETARY', ...ANY_MANAGER_OR_OWNER), controller.create);
router.put('/:id', requireRole('OWNER', 'SECRETARY', 'THERAPIST', ...ANY_MANAGER_OR_OWNER), controller.update);
router.delete('/:id', requireRole('OWNER'), controller.remove);
export default router;
