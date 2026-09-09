import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as controller from '../controllers/invoice.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/', requireRole('OWNER', 'SECRETARY', 'PATIENT'), controller.list);
router.get('/:id', requireRole('OWNER', 'SECRETARY', 'PATIENT'), controller.getById);
router.post('/', requireRole('OWNER', 'SECRETARY'), controller.create);
router.put('/:id/status', requireRole('OWNER'), controller.updateStatus);
router.patch('/:id/status', requireRole('OWNER'), controller.updateStatus);
router.post('/payments', requireRole('OWNER', 'SECRETARY'), controller.recordPayment);
router.get('/:id/pdf', requireRole('OWNER', 'SECRETARY', 'PATIENT'), controller.getInvoicePdf);
export default router;