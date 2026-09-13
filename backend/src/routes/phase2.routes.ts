// backend/src/routes/phase2.routes.ts
import { Router } from 'express';
import { requireAuth, requireRole, ANY_MANAGER_OR_OWNER, ADVANCED_MANAGER_OR_OWNER } from '../middleware/auth.js';
import * as controller from '../controllers/phase2.controller.js';

const router = Router();
router.use(requireAuth);

// ─── Recurring Appointments ─── (BASIC+)
router.post('/recurring', requireRole('OWNER', 'SECRETARY', ...ANY_MANAGER_OR_OWNER), controller.createRecurring);
router.get('/recurring', requireRole('OWNER', 'SECRETARY', 'THERAPIST', ...ANY_MANAGER_OR_OWNER), controller.listRecurring);
router.patch('/recurring/:patternId/cancel', requireRole('OWNER', 'SECRETARY', ...ANY_MANAGER_OR_OWNER), controller.cancelRecurring);

// ─── Packages ─── (BASIC+)
router.get('/packages', requireRole('OWNER', 'SECRETARY', 'THERAPIST', 'PATIENT', ...ANY_MANAGER_OR_OWNER), controller.listPackages);
router.post('/packages', requireRole('OWNER'), controller.createPackage);           // OWNER only - package definition management
router.put('/packages/:id', requireRole('OWNER'), controller.updatePackage);         // OWNER only
router.delete('/packages/:id', requireRole('OWNER'), controller.deletePackage);      // OWNER only
router.post('/packages/sell', requireRole('OWNER', 'SECRETARY', ...ANY_MANAGER_OR_OWNER), controller.sellPackage);
router.get('/patients/:patientId/packages', requireRole('OWNER', 'SECRETARY', 'THERAPIST', 'PATIENT', ...ANY_MANAGER_OR_OWNER), controller.getPatientPackages);

// ─── Discounts ─── (BASIC+)
router.get('/discounts', requireRole('OWNER', 'SECRETARY', ...ANY_MANAGER_OR_OWNER), controller.listDiscounts);
router.post('/discounts', requireRole('OWNER'), controller.createDiscount);          // OWNER only - discount management
router.delete('/discounts/:id', requireRole('OWNER'), controller.deleteDiscount);    // OWNER only
router.get('/discounts/validate', requireRole('OWNER', 'SECRETARY', ...ANY_MANAGER_OR_OWNER), controller.validateDiscountCode);

// ─── Waitlist ─── (BASIC+)
router.get('/waitlist', requireRole('OWNER', 'SECRETARY', ...ANY_MANAGER_OR_OWNER), controller.listWaitlist);
router.post('/waitlist', requireRole('OWNER', 'SECRETARY', ...ANY_MANAGER_OR_OWNER), controller.addToWaitlist);
router.delete('/waitlist/:id', requireRole('OWNER', 'SECRETARY', ...ANY_MANAGER_OR_OWNER), controller.removeFromWaitlist);
router.post('/waitlist/:id/book', requireRole('OWNER', 'SECRETARY', ...ANY_MANAGER_OR_OWNER), controller.bookFromWaitlist);

export default router;