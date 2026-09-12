// backend/src/controllers/rating.controller.ts
import type { Request, Response } from 'express';
import { z } from 'zod';
import * as ratingService from '../services/rating.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const createRatingSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(500, 'Comment must be under 500 characters').optional(),
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId) throw new Error('Not authenticated');
  const data = createRatingSchema.parse(req.body);
  res.status(201).json(await ratingService.createRating(req.userId, data));
});

export const getTherapistRating = asyncHandler(async (req: Request, res: Response) => {
  const { therapistId } = req.params;
  res.json(await ratingService.getTherapistRating(therapistId));
});

export const getMyRatings = asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId) throw new Error('Not authenticated');
  const { prisma } = await import('../lib/prisma.js');
  const patient = await prisma.patient.findFirst({ where: { userId: req.userId } });
  if (!patient) {
    res.json([]);
    return;
  }
  res.json(await ratingService.getPatientRatings(patient.id));
});