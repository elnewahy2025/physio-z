import type { Request, Response } from 'express';
import { z } from 'zod';
import * as gamificationService from '../services/gamification.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const patientId = req.params.patientId;
  const profile = await gamificationService.getLoyaltyProfile(patientId);
  res.json(profile);
});

export const getBadges = asyncHandler(async (_req: Request, res: Response) => {
  const badges = await gamificationService.getBadges();
  res.json(badges);
});

const exerciseCompletionSchema = z.object({
  exerciseLogId: z.string().min(1),
});

export const logExercise = asyncHandler(async (req: Request, res: Response) => {
  const patientId = req.params.patientId;
  const data = exerciseCompletionSchema.parse(req.body);
  const result = await gamificationService.processExerciseCompletion(patientId, data.exerciseLogId);
  res.status(200).json(result);
});
