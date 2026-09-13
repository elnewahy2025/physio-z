// backend/src/routes/session.routes.ts
import { Router } from 'express';
import { requireAuth, requireRole, ANY_MANAGER_OR_OWNER } from '../middleware/auth.js';
import * as controller from '../controllers/session.controller.js';

const router = Router();
router.use(requireAuth);
// Sessions are BASIC+ (all managers)
router.get('/', requireRole('OWNER', 'THERAPIST', ...ANY_MANAGER_OR_OWNER), controller.list);
router.get('/:id', requireRole('OWNER', 'THERAPIST', ...ANY_MANAGER_OR_OWNER), controller.getById);
router.post('/', requireRole('OWNER', 'THERAPIST', ...ANY_MANAGER_OR_OWNER), controller.create);
router.put('/:id', requireRole('OWNER', 'THERAPIST', ...ANY_MANAGER_OR_OWNER), controller.update);
export default router;