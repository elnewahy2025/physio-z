// backend/src/routes/foundation.routes.ts
import { Router } from 'express';
import { requireAuth, requireRole, ANY_MANAGER_OR_OWNER, ADVANCED_MANAGER_OR_OWNER } from '../middleware/auth.js';
import * as controller from '../controllers/foundation.controller.js';
import { getExpenseStats } from '../controllers/phase3.controller.js';

const router = Router();
router.use(requireAuth);

// ─── File Upload ───
router.post('/files', requireRole('OWNER', 'SECRETARY', 'THERAPIST', ...ANY_MANAGER_OR_OWNER), controller.uploadFile);
router.get('/files', requireRole('OWNER', 'SECRETARY', 'THERAPIST', ...ANY_MANAGER_OR_OWNER), controller.listFiles);
router.get('/files/:id', controller.getFile);
router.delete('/files/:id', requireRole('OWNER', 'SECRETARY', ...ANY_MANAGER_OR_OWNER), controller.deleteFile);

// ─── Schedule Blocking ───
router.get('/schedule/blocked', requireRole('OWNER', 'SECRETARY', 'THERAPIST', ...ANY_MANAGER_OR_OWNER), controller.listBlockedSlots);
router.post('/schedule/blocked', requireRole('OWNER', 'SECRETARY', ...ANY_MANAGER_OR_OWNER), controller.createBlockedSlot);
router.delete('/schedule/blocked/:id', requireRole('OWNER', 'SECRETARY', ...ANY_MANAGER_OR_OWNER), controller.deleteBlockedSlot);
router.get('/schedule/available', requireRole('OWNER', 'SECRETARY', 'THERAPIST', 'PATIENT', ...ANY_MANAGER_OR_OWNER), controller.getAvailableSlots);

// ─── Progress Tracking ───
router.get('/patients/:patientId/progress', requireRole('OWNER', 'SECRETARY', 'THERAPIST', 'PATIENT', ...ANY_MANAGER_OR_OWNER), controller.getPatientProgress);

// ─── P&L + Expenses ─── (ADVANCED_MANAGER_OR_OWNER only)
router.get('/reports/profit-loss', requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.getProfitLoss);
router.post('/expenses', requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.createExpense);
router.get('/expenses/stats', requireRole(...ADVANCED_MANAGER_OR_OWNER), getExpenseStats);
router.get('/expenses', requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.listExpenses);
router.delete('/expenses/:id', requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.deleteExpense);

export default router;