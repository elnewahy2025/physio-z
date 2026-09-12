import { Router } from 'express';
import { requirePatientAuth } from '../middleware/auth.js';
import * as controller from '../controllers/portal.controller.js';

const router = Router();
router.use(requirePatientAuth);

router.get('/appointments', controller.getAppointments);
router.get('/appointments/availability', controller.getAvailability);
router.post('/appointments', controller.createAppointment);
router.get('/therapists', controller.getTherapists);
router.get('/invoices', controller.getInvoices);

export default router;
