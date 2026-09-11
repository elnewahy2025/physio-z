import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as controller from '../controllers/user.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/', requireRole('OWNER', 'SECRETARY'), controller.list);
router.get('/:id', requireRole('OWNER', 'SECRETARY'), controller.getById);
router.post('/', requireRole('OWNER'), controller.create);
router.put('/:id', requireRole('OWNER'), controller.update);
router.patch('/:id/deactivate', requireRole('OWNER'), controller.deactivate);
export default router;