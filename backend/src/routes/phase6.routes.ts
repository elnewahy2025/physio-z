 import { Router } from 'express';
import { requireAuth, requireRole, ANY_MANAGER_OR_OWNER, ADVANCED_MANAGER_OR_OWNER } from '../middleware/auth.js';
import * as controller from '../controllers/phase6.controller.js';

const router = Router();
router.use(requireAuth);

// WhatsApp reminders - BASIC+ managers
router.get('/whatsapp/reminders', requireRole(...ANY_MANAGER_OR_OWNER, 'SECRETARY'), controller.getWhatsAppReminders);
// Payments - BASIC+ managers
router.get('/payments/invoices', requireRole(...ANY_MANAGER_OR_OWNER, 'SECRETARY'), controller.getInvoices);
// Exercises - therapist feature (no manager override needed)
router.get('/exercises', requireRole('OWNER', 'THERAPIST', 'PATIENT'), controller.getExercises);
router.post('/video/:id/generate', requireRole('OWNER', 'THERAPIST', 'PATIENT'), controller.generateMeeting);

export default router;
