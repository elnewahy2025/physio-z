import type { Request, Response } from 'express';
import { z } from 'zod';
import * as settingsService from '../services/settings.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const updateSettingsSchema = z.object({
  centerName: z.string().min(2).optional(),
  centerLogo: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  googleMapsLink: z.string().url().optional().nullable(),
  workingHours: z.record(z.string(), z.unknown()).optional().nullable(),
  sessionPrice: z.number().positive().optional(),
  currency: z.string().min(3).max(3).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  defaultLanguage: z.enum(['ar', 'en']).optional(),
  whatsappMessageTemplate: z.string().optional().nullable(),
});

export const get = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await settingsService.getSettings());
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = updateSettingsSchema.parse(req.body);
  res.json(await settingsService.updateSettings(data));
});