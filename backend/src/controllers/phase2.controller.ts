// backend/src/controllers/phase2.controller.ts
import type { Request, Response } from 'express';
import { z } from 'zod';
import * as recurringService from '../services/recurring.service.js';
import * as packageService from '../services/package.service.js';
import * as discountService from '../services/discount.service.js';
import * as waitlistService from '../services/waitlist.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HttpError } from '../lib/errors.js';

// ─── Recurring Appointments ───

const createRecurringSchema = z.object({
  patientId: z.string().min(1),
  therapistId: z.string().min(1),
  roomId: z.string().optional().nullable(),
  startDate: z.string().min(1),
  frequency: z.enum(['WEEKLY', 'BIWEEKLY']),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
  sessionCount: z.number().int().min(2).max(50),
  duration: z.number().int().min(15).max(240).optional(),
  notes: z.string().optional().nullable(),
});

export const createRecurring = asyncHandler(async (req: Request, res: Response) => {
  const data = createRecurringSchema.parse(req.body);
  data.startDate = new Date(data.startDate);
  res.status(201).json(await recurringService.createRecurringAppointments(data));
});

export const cancelRecurring = asyncHandler(async (req: Request, res: Response) => {
  const { patternId } = req.params;
  const { cancelFuture } = req.body;
  res.json(await recurringService.cancelRecurringSeries(patternId, cancelFuture));
});

export const listRecurring = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.query;
  res.json(await recurringService.getRecurringPatterns(patientId as string | undefined));
});

// ─── Packages ───

const createPackageSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  sessionCount: z.number().int().min(1).max(100),
  price: z.number().positive(),
  durationDays: z.number().int().min(1).optional().nullable(),
});

export const listPackages = asyncHandler(async (req: Request, res: Response) => {
  const { includeInactive } = req.query;
  res.json(await packageService.listPackages(includeInactive === 'true'));
});

export const createPackage = asyncHandler(async (req: Request, res: Response) => {
  const data = createPackageSchema.parse(req.body);
  res.status(201).json(await packageService.createPackage(data));
});

export const updatePackage = asyncHandler(async (req: Request, res: Response) => {
  res.json(await packageService.updatePackage(req.params.id, req.body));
});

export const deletePackage = asyncHandler(async (req: Request, res: Response) => {
  res.json(await packageService.deletePackage(req.params.id));
});

const sellPackageSchema = z.object({
  patientId: z.string().min(1),
  packageId: z.string().min(1),
  discountCode: z.string().optional(),
});

export const sellPackage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId) throw new HttpError(401, 'Not authenticated');
  const data = sellPackageSchema.parse(req.body);
  res.status(201).json(await packageService.sellPackage({
    ...data,
    createdById: req.userId,
  }));
});

export const getPatientPackages = asyncHandler(async (req: Request, res: Response) => {
  res.json(await packageService.getPatientPackages(req.params.patientId));
});

// ─── Discounts ───

const createDiscountSchema = z.object({
  code: z.string().min(3).max(20),
  name: z.string().min(2),
  type: z.enum(['PERCENT', 'FIXED']),
  value: z.number().positive(),
  minAmount: z.number().positive().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  startsAt: z.string(),
  expiresAt: z.string().optional().nullable(),
});

export const listDiscounts = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await discountService.listDiscounts());
});

export const createDiscount = asyncHandler(async (req: Request, res: Response) => {
  const data = createDiscountSchema.parse(req.body);
  data.startsAt = new Date(data.startsAt);
  if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);
  res.status(201).json(await discountService.createDiscount(data));
});

export const validateDiscountCode = asyncHandler(async (req: Request, res: Response) => {
  const { code, amount } = req.query;
  if (!code || !amount) throw new HttpError(400, 'code and amount required');
  res.json(await discountService.validateDiscount(code as string, Number(amount)));
});

export const deleteDiscount = asyncHandler(async (req: Request, res: Response) => {
  res.json(await discountService.deleteDiscount(req.params.id));
});

// ─── Waitlist ───

const addToWaitlistSchema = z.object({
  patientId: z.string().min(1),
  preferredDate: z.string().min(1),
  preferredTimeStart: z.string().regex(/^\d{2}:\d{2}$/),
  preferredTimeEnd: z.string().regex(/^\d{2}:\d{2}$/),
  therapistId: z.string().optional().nullable(),
  priority: z.number().int().min(0).max(10).optional(),
  notes: z.string().optional().nullable(),
});

export const addToWaitlist = asyncHandler(async (req: Request, res: Response) => {
  const data = addToWaitlistSchema.parse(req.body);
  data.preferredDate = new Date(data.preferredDate);
  res.status(201).json(await waitlistService.addToWaitlist(data));
});

export const listWaitlist = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  res.json(await waitlistService.listWaitlist(status as string | undefined));
});

export const removeFromWaitlist = asyncHandler(async (req: Request, res: Response) => {
  res.json(await waitlistService.removeFromWaitlist(req.params.id));
});

const bookFromWaitlistSchema = z.object({
  therapistId: z.string().min(1),
  roomId: z.string().optional().nullable(),
  dateTime: z.string().min(1),
  duration: z.number().int().min(15).max(240).optional(),
});

export const bookFromWaitlist = asyncHandler(async (req: Request, res: Response) => {
  const data = bookFromWaitlistSchema.parse(req.body);
  data.dateTime = new Date(data.dateTime);
  res.status(201).json(await waitlistService.bookFromWaitlist(req.params.id, data));
});