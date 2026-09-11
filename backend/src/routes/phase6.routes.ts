import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import * as controller from '../controllers/phase6.controller';

const router = Router();
router.use(requireAuth);

router.get('/whatsapp/reminders', requireRole('OWNER', 'SECRETARY'), controller.getWhatsAppReminders);
router.get('/payments/invoices', requireRole('OWNER', 'SECRETARY'), controller.getInvoices);
router.get('/exercises', requireRole('OWNER', 'THERAPIST', 'PATIENT'), controller.getExercises);
router.post('/video/:id/generate', requireRole('OWNER', 'THERAPIST', 'PATIENT'), controller.generateMeeting);

export default router;
