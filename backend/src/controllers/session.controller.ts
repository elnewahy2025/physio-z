import type { Request, Response } from 'express';
import { z } from 'zod';
import * as sessionService from '../services/session.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginationSchema } from '../lib/validation.js';

const createSessionSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment is required'),
  diagnosis: z.string().min(3, 'Diagnosis must be at least 3 characters'),
  treatmentPlan: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  duration: z.number().int().min(15).max(240).optional(),
  painLevel: z.number().int().min(0).max(10).optional().nullable(),
});

const updateSessionSchema = createSessionSchema.partial();
const listQuerySchema = paginationSchema.extend({
  appointmentId: z.string().optional(),
  therapistId: z.string().optional(),
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { appointmentId, therapistId, page, limit } = listQuerySchema.parse(req.query);
  res.json(await sessionService.listSessions({ appointmentId, therapistId, page, limit }));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  res.json(await sessionService.getSessionById(req.params.id));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = createSessionSchema.parse(req.body);
  res.status(201).json(await sessionService.createSession(data));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = updateSessionSchema.parse(req.body);
  res.json(await sessionService.updateSession(req.params.id, data));
});