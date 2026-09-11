import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import * as controller from '../controllers/phase7.controller';

const router = Router();
router.use(requireAuth);

// RBAC: Only OWNER can see audit logs and trigger backups
router.get('/audit-logs', requireRole('OWNER'), controller.getLogs);
router.post('/backup', requireRole('OWNER'), controller.triggerBackup);

// Therapists and Owners can export patient data
router.get('/export/patient/:patientId', requireRole('OWNER', 'THERAPIST'), controller.exportData);

export default router;
