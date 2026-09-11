// backend/src/routes/intelligence.routes.ts
// Phase 5: Intelligence - All routes (I1-I3)

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as controller from '../controllers/intelligence.controller.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ============================================================
// I1: NO-SHOW PREDICTION (Owner + Therapist + Secretary)
// ============================================================

// Predict no-show risk for specific appointment
router.get('/no-show-prediction/appointment/:appointmentId',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY'),
  controller.predictNoShowRisk
);

// Get patient risk profile
router.get('/no-show-prediction/patient/:patientId',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY'),
  controller.getPatientRiskProfile
);

// Get upcoming appointments risk (next 7 days)
router.get('/no-show-prediction/upcoming',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY'),
  controller.getUpcomingAppointmentsRisk
);

// Get no-show statistics
router.get('/no-show-prediction/statistics',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY'),
  controller.getNoShowStatistics
);

// ============================================================
// I2: DEMAND FORECASTING (Owner + Therapist + Secretary)
// ============================================================

// Get demand forecast
router.get('/demand-forecasting',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY'),
  controller.getDemandForecast
);

// Get calendar heatmap
router.get('/demand-forecasting/calendar',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY'),
  controller.getCalendarHeatmap
);

// Get weekly patterns
router.get('/demand-forecasting/weekly-patterns',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY'),
  controller.getWeeklyPatterns
);

// Get hourly distribution
router.get('/demand-forecasting/hourly-distribution',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY'),
  controller.getHourlyDistribution
);

// Get monthly comparison
router.get('/demand-forecasting/monthly-comparison',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY'),
  controller.getMonthlyComparison
);

// ============================================================
// I3: TREATMENT EFFECTIVENESS (Owner + Therapist)
// ============================================================

// Get treatment effectiveness analysis
router.get('/treatment-effectiveness',
  requireRole('OWNER', 'THERAPIST'),
  controller.getTreatmentEffectiveness
);

// Get therapist effectiveness
router.get('/treatment-effectiveness/therapist/:therapistId',
  requireRole('OWNER', 'THERAPIST'),
  controller.getTherapistEffectiveness
);

// Get treatment trends
router.get('/treatment-effectiveness/trends',
  requireRole('OWNER', 'THERAPIST'),
  controller.getTreatmentTrends
);

export default router;
