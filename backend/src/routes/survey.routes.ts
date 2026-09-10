// backend/src/routes/survey.routes.ts
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as controller from '../controllers/survey.controller.js';

const router = Router();
router.use(requireAuth);

// Patient submits survey
router.post('/', requireRole('PATIENT'), controller.submit);

// Get survey results (Owner sees all, Therapist sees own)
router.get('/results', requireRole('OWNER', 'THERAPIST'), controller.results);

// Patient checks which appointments need surveys
router.get('/pending', requireRole('PATIENT'), controller.myPending);

export default router;