import { Router } from 'express';
import { requireAuth, requireRole, ADVANCED_MANAGER_OR_OWNER } from '../middleware/auth.js';
import * as payrollController from '../controllers/payroll.controller.js';

const router = Router();

// Protect all routes - Payroll is an ADVANCED+ feature (Expenses category)
router.use(requireAuth);
router.use(requireRole(...ADVANCED_MANAGER_OR_OWNER));

// Get eligible staff for payroll
router.get('/eligible-staff', payrollController.getEligibleStaff);

// Templates
router.get('/templates', payrollController.getTemplates);
router.post('/templates', payrollController.setTemplate);
router.delete('/templates/:id', payrollController.deleteTemplate);

// History and Run
router.get('/history', payrollController.getHistory);
router.post('/run', payrollController.runPayroll);

export default router;
