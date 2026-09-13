import { Router } from 'express';
import { requireAuth, requireRole, ANY_MANAGER_OR_OWNER } from '../middleware/auth.js';
import * as controller from '../controllers/invoice.controller.js';

const router = Router();
router.use(requireAuth);
// Invoices are BASIC+ (all managers)
router.get('/', requireRole('OWNER', 'SECRETARY', 'PATIENT', ...ANY_MANAGER_OR_OWNER), controller.list);
router.get('/:id', requireRole('OWNER', 'SECRETARY', 'PATIENT', ...ANY_MANAGER_OR_OWNER), controller.getById);
router.post('/', requireRole('OWNER', 'SECRETARY', ...ANY_MANAGER_OR_OWNER), controller.create);
router.put('/:id/status', requireRole('OWNER', ...ANY_MANAGER_OR_OWNER), controller.updateStatus);
router.patch('/:id/status', requireRole('OWNER', ...ANY_MANAGER_OR_OWNER), controller.updateStatus);
router.post('/payments', requireRole('OWNER', 'SECRETARY', ...ANY_MANAGER_OR_OWNER), controller.recordPayment);
router.get('/:id/pdf', requireRole('OWNER', 'SECRETARY', 'PATIENT', ...ANY_MANAGER_OR_OWNER), controller.getInvoicePdf);
export default router;