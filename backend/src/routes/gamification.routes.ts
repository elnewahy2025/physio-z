import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as gamificationController from '../controllers/gamification.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/badges', gamificationController.getBadges);
router.get('/:patientId/profile', gamificationController.getProfile);
router.post('/:patientId/log-exercise', gamificationController.logExercise);

export default router;
