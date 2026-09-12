// backend/src/controllers/survey.controller.ts
import type { Request, Response } from 'express';
import { z } from 'zod';
import * as surveyService from '../services/survey.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HttpError } from '../lib/errors.js';

const submitSurveySchema = z.object({
  appointmentId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(500).optional(),
});

export const submit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId) throw new HttpError(401, 'Not authenticated');
  const data = submitSurveySchema.parse(req.body);
  res.status(201).json(await surveyService.submitSurvey(data));
});

export const results = asyncHandler(async (req: Request, res: Response) => {
  const { therapistId } = req.query;
  res.json(await surveyService.getSurveyResults(therapistId as string | undefined));
});

export const myPending = asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId) throw new HttpError(401, 'Not authenticated');
  res.json(await surveyService.checkPatientSurveyEligibility(req.userId));
});