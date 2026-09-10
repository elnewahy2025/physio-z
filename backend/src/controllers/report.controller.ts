// backend/src/controllers/report.controller.ts
import type { Request, Response } from 'express';
import { z } from 'zod';
import * as reportService from '../services/report.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HttpError } from '../lib/errors.js';

const reportQuerySchema = z.object({
  startDate: z.string().min(1, 'startDate is required'),
  endDate: z.string().min(1, 'endDate is required'),
});

function parseDates(query: Record<string, unknown>) {
  const { startDate, endDate } = reportQuerySchema.parse(query);
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new HttpError(400, 'Invalid date format. Use YYYY-MM-DD.');
  }
  if (start > end) {
    throw new HttpError(400, 'startDate must be before endDate');
  }

  return { start, end };
}

export const financial = asyncHandler(async (req: Request, res: Response) => {
  const { start, end } = parseDates(req.query as Record<string, unknown>);
  res.json(await reportService.getFinancialReport(start, end));
});

export const outstanding = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await reportService.getOutstandingBalances());
});

export const therapists = asyncHandler(async (req: Request, res: Response) => {
  const { start, end } = parseDates(req.query as Record<string, unknown>);
  res.json(await reportService.getTherapistReport(start, end));
});

export const patients = asyncHandler(async (req: Request, res: Response) => {
  const { start, end } = parseDates(req.query as Record<string, unknown>);
  res.json(await reportService.getPatientStatistics(start, end));
});

export const appointments = asyncHandler(async (req: Request, res: Response) => {
  const { start, end } = parseDates(req.query as Record<string, unknown>);
  res.json(await reportService.getAppointmentReport(start, end));
});

export const rooms = asyncHandler(async (req: Request, res: Response) => {
  const { start, end } = parseDates(req.query as Record<string, unknown>);
  res.json(await reportService.getRoomUtilization(start, end));
});

export const tax = asyncHandler(async (req: Request, res: Response) => {
  const { start, end } = parseDates(req.query as Record<string, unknown>);
  res.json(await reportService.getTaxReport(start, end));
});