// backend/src/routes/foundation.routes.ts
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as controller from '../controllers/foundation.controller.js';

const router = Router();
router.use(requireAuth);

// ─── File Upload ───
router.post('/files', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), controller.uploadFile);
router.get('/files', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), controller.listFiles);
router.get('/files/:id', controller.getFile);
router.delete('/files/:id', requireRole('OWNER', 'SECRETARY'), controller.deleteFile);

// ─── Schedule Blocking ───
router.get('/schedule/blocked', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), controller.listBlockedSlots);
router.post('/schedule/blocked', requireRole('OWNER', 'SECRETARY'), controller.createBlockedSlot);
router.delete('/schedule/blocked/:id', requireRole('OWNER', 'SECRETARY'), controller.deleteBlockedSlot);
router.get('/schedule/available', requireRole('OWNER', 'SECRETARY', 'THERAPIST', 'PATIENT'), controller.getAvailableSlots);

// ─── Progress Tracking ───
router.get('/patients/:patientId/progress', requireRole('OWNER', 'SECRETARY', 'THERAPIST', 'PATIENT'), controller.getPatientProgress);

// ─── P&L + Expenses ───
router.get('/reports/profit-loss', requireRole('OWNER'), controller.getProfitLoss);
router.post('/expenses', requireRole('OWNER'), controller.createExpense);
router.get('/expenses', requireRole('OWNER'), controller.listExpenses);
router.delete('/expenses/:id', requireRole('OWNER'), controller.deleteExpense);

export default router;