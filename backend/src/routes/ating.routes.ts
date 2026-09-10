// backend/src/routes/rating.routes.ts
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as controller from '../controllers/rating.controller.js';

const router = Router();
router.use(requireAuth);

// Patient rates a completed appointment
router.post('/', requireRole('PATIENT'), controller.create);

// Get a therapist's average rating (anyone can view)
router.get('/therapist/:therapistId', controller.getTherapistRating);

// Get patient's own ratings
router.get('/me', requireRole('PATIENT'), controller.getMyRatings);

export default router;