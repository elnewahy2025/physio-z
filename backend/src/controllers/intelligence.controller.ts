// backend/src/controllers/intelligence.controller.ts
// Phase 5: Intelligence - All controllers (I1-I3)

import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as noShowPredictionService from '../services/no-show-prediction.service.js';
import * as demandForecastingService from '../services/demand-forecasting.service.js';
import * as treatmentEffectivenessService from '../services/treatment-effectiveness.service.js';

// ============================================================
// I1: NO-SHOW PREDICTION
// ============================================================

// Predict no-show risk for appointment
export const predictNoShowRisk = asyncHandler(async (req: Request, res: Response) => {
  const appointmentId = req.params.appointmentId;
  const prediction = await noShowPredictionService.predictNoShowRisk(appointmentId);
  res.json(prediction);
});

// Get patient risk profile
export const getPatientRiskProfile = asyncHandler(async (req: Request, res: Response) => {
  const patientId = req.params.patientId;
  const profile = await noShowPredictionService.getPatientRiskProfile(patientId);
  res.json(profile);
});

// Get upcoming appointments risk
export const getUpcomingAppointmentsRisk = asyncHandler(async (req: Request, res: Response) => {
  const result = await noShowPredictionService.getUpcomingAppointmentsRisk();
  res.json(result);
});

// Get no-show statistics
export const getNoShowStatistics = asyncHandler(async (req: Request, res: Response) => {
  const days = req.query.days ? parseInt(req.query.days as string) : 30;
  const stats = await noShowPredictionService.getNoShowStatistics(days);
  res.json(stats);
});

// ============================================================
// I2: DEMAND FORECASTING
// ============================================================

// Get demand forecast
export const getDemandForecast = asyncHandler(async (req: Request, res: Response) => {
  const days = req.query.days ? parseInt(req.query.days as string) : 30;
  
  if (days < 1 || days > 90) {
    return res.status(400).json({ message: 'عدد الأيام يجب أن يكون بين 1 و 90' });
  }
  
  const forecast = await demandForecastingService.getDemandForecast(days);
  res.json(forecast);
});

// Get calendar heatmap
export const getCalendarHeatmap = asyncHandler(async (req: Request, res: Response) => {
  const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
  const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
  
  if (month < 1 || month > 12) {
    return res.status(400).json({ message: 'الشهر يجب أن يكون بين 1 و 12' });
  }
  
  const heatmap = await demandForecastingService.getCalendarHeatmap(year, month);
  res.json(heatmap);
});

// Get weekly patterns
export const getWeeklyPatterns = asyncHandler(async (req: Request, res: Response) => {
  const patterns = await demandForecastingService.getWeeklyPatterns();
  res.json(patterns);
});

// Get hourly distribution
export const getHourlyDistribution = asyncHandler(async (req: Request, res: Response) => {
  const distribution = await demandForecastingService.getHourlyDistribution();
  res.json(distribution);
});

// Get monthly comparison
export const getMonthlyComparison = asyncHandler(async (req: Request, res: Response) => {
  const months = req.query.months ? parseInt(req.query.months as string) : 6;
  const comparison = await demandForecastingService.getMonthlyComparison(months);
  res.json(comparison);
});

// ============================================================
// I3: TREATMENT EFFECTIVENESS
// ============================================================

// Get treatment effectiveness
export const getTreatmentEffectiveness = asyncHandler(async (req: Request, res: Response) => {
  const diagnosis = req.query.diagnosis as string | undefined;
  const therapistId = req.query.therapistId as string | undefined;
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo = req.query.dateTo as string | undefined;
  const minSessions = req.query.minSessions ? parseInt(req.query.minSessions as string) : undefined;
  
  const effectiveness = await treatmentEffectivenessService.getTreatmentEffectiveness({
    diagnosis,
    therapistId,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
    minSessions,
  });
  
  res.json(effectiveness);
});

// Get therapist effectiveness
export const getTherapistEffectiveness = asyncHandler(async (req: Request, res: Response) => {
  const therapistId = req.params.therapistId;
  const effectiveness = await treatmentEffectivenessService.getTherapistEffectiveness(therapistId);
  res.json(effectiveness);
});

// Get treatment trends
export const getTreatmentTrends = asyncHandler(async (req: Request, res: Response) => {
  const months = req.query.months ? parseInt(req.query.months as string) : 6;
  const trends = await treatmentEffectivenessService.getTreatmentTrends(months);
  res.json(trends);
});
