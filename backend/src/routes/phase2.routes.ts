// backend/src/routes/phase2.routes.ts
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as controller from '../controllers/phase2.controller.js';

const router = Router();
router.use(requireAuth);

// ─── Recurring Appointments ───
router.post('/recurring', requireRole('OWNER', 'SECRETARY'), controller.createRecurring);
router.get('/recurring', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), controller.listRecurring);
router.patch('/recurring/:patternId/cancel', requireRole('OWNER', 'SECRETARY'), controller.cancelRecurring);

// ─── Packages ───
router.get('/packages', requireRole('OWNER', 'SECRETARY', 'THERAPIST', 'PATIENT'), controller.listPackages);
router.post('/packages', requireRole('OWNER'), controller.createPackage);
router.put('/packages/:id', requireRole('OWNER'), controller.updatePackage);
router.delete('/packages/:id', requireRole('OWNER'), controller.deletePackage);
router.post('/packages/sell', requireRole('OWNER', 'SECRETARY'), controller.sellPackage);
router.get('/patients/:patientId/packages', requireRole('OWNER', 'SECRETARY', 'THERAPIST', 'PATIENT'), controller.getPatientPackages);

// ─── Discounts ───
router.get('/discounts', requireRole('OWNER', 'SECRETARY'), controller.listDiscounts);
router.post('/discounts', requireRole('OWNER'), controller.createDiscount);
router.delete('/discounts/:id', requireRole('OWNER'), controller.deleteDiscount);
router.get('/discounts/validate', requireRole('OWNER', 'SECRETARY'), controller.validateDiscountCode);

// ─── Waitlist ───
router.get('/waitlist', requireRole('OWNER', 'SECRETARY'), controller.listWaitlist);
router.post('/waitlist', requireRole('OWNER', 'SECRETARY'), controller.addToWaitlist);
router.delete('/waitlist/:id', requireRole('OWNER', 'SECRETARY'), controller.removeFromWaitlist);
router.post('/waitlist/:id/book', requireRole('OWNER', 'SECRETARY'), controller.bookFromWaitlist);

export default router;