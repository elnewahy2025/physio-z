// backend/src/controllers/foundation.controller.ts
import type { Request, Response } from 'express';
import { z } from 'zod';
import * as fileService from '../services/file.service.js';
import * as scheduleService from '../services/schedule.service.js';
import * as reportService from '../services/report.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HttpError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';

// ─── File Upload ───

const uploadFileSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  data: z.string().min(1), // base64
  category: z.enum(['MEDICAL_FILE', 'PHOTO', 'CONSENT', 'EXERCISE', 'LOGO']),
  patientId: z.string().optional().nullable(),
});

export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId) throw new HttpError(401, 'Not authenticated');
  const data = uploadFileSchema.parse(req.body);
  res.status(201).json(
    await fileService.uploadFile({
      ...data,
      uploadedById: req.userId,
    }),
  );
});

export const getFile = asyncHandler(async (req: Request, res: Response) => {
  res.json(await fileService.getFile(req.params.id));
});

export const listFiles = asyncHandler(async (req: Request, res: Response) => {
  const { patientId, category } = req.query;
  res.json(
    await fileService.listFiles(
      patientId as string | undefined,
      category as string | undefined,
    ),
  );
});

export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  res.json(await fileService.deleteFile(req.params.id));
});

// ─── Schedule Blocking ───

const createBlockedSlotSchema = z.object({
  userId: z.string().min(1),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().optional().nullable(),
  isRecurring: z.boolean().default(true),
  specificDate: z.string().optional().nullable(),
});

export const listBlockedSlots = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.query;
  res.json(await scheduleService.listBlockedSlots(userId as string | undefined));
});

export const createBlockedSlot = asyncHandler(async (req: Request, res: Response) => {
  const data = createBlockedSlotSchema.parse(req.body);
  res.status(201).json(await scheduleService.createBlockedSlot(data));
});

export const deleteBlockedSlot = asyncHandler(async (req: Request, res: Response) => {
  res.json(await scheduleService.deleteBlockedSlot(req.params.id));
});

export const getAvailableSlots = asyncHandler(async (req: Request, res: Response) => {
  const { userId, date } = req.query;
  if (!userId || !date) throw new HttpError(400, 'userId and date required');
  res.json(await scheduleService.getAvailableSlots(userId as string, new Date(date as string)));
});

// ─── Progress Tracking (Q1) ───

export const getPatientProgress = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;

  const sessions = await prisma.therapySession.findMany({
    where: { appointment: { patientId } },
    include: {
      appointment: {
        select: { dateTime: true },
      },
    },
    orderBy: { appointment: { dateTime: 'asc' } },
  });

  // Build progress data
  const progress = sessions.map((session, index) => ({
    sessionNumber: index + 1,
    date: session.appointment.dateTime,
    painLevel: session.painLevel,
    diagnosis: session.diagnosis,
    duration: session.duration,
  }));

  // Calculate improvement
  const firstPain = progress.find((p) => p.painLevel !== null)?.painLevel;
  const lastPain = [...progress].reverse().find((p) => p.painLevel !== null)?.painLevel;
  const improvement =
    firstPain !== undefined && lastPain !== undefined && firstPain > 0
      ? Math.round(((firstPain - lastPain) / firstPain) * 100)
      : null;

  res.json({
    patientId,
    totalSessions: sessions.length,
    progress,
    summary: {
      initialPainLevel: firstPain,
      currentPainLevel: lastPain,
      improvementPercent: improvement,
      trend:
        improvement !== null
          ? improvement > 20
            ? 'IMPROVING'
            : improvement < -10
              ? 'WORSENING'
              : 'STABLE'
          : 'NO_DATA',
    },
  });
});

// ─── P&L Report (Q3) ───

export const getProfitLoss = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as Record<string, string>;

  if (!startDate || !endDate) {
    throw new HttpError(400, 'startDate and endDate required');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Revenue: collected payments
  const payments = await prisma.payment.findMany({
    where: {
      paymentDate: { gte: start, lte: end },
      status: 'COMPLETED',
    },
    select: { amount: true },
  });
  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);

  // Expenses
  const expenses = await prisma.expense.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { date: 'desc' },
  });
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

  // Group expenses by category
  const expensesByCategory: Record<string, number> = {};
  for (const exp of expenses) {
    expensesByCategory[exp.category] =
      (expensesByCategory[exp.category] || 0) + Number(exp.amount);
  }

  // Outstanding (billed but not collected)
  const outstandingInvoices = await prisma.invoice.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] },
    },
    include: { payments: { where: { status: 'COMPLETED' } } },
  });
  const totalOutstanding = outstandingInvoices.reduce((sum, inv) => {
    const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    return sum + (Number(inv.total) - paid);
  }, 0);

  const profit = totalRevenue - totalExpenses;

  res.json({
    period: { start: start.toISOString(), end: end.toISOString() },
    revenue: {
      collected: totalRevenue,
      outstanding: totalOutstanding,
      total: totalRevenue + totalOutstanding,
    },
    expenses: {
      total: totalExpenses,
      byCategory: expensesByCategory,
      list: expenses.slice(0, 20).map((e) => ({
        id: e.id,
        category: e.category,
        description: e.description,
        amount: Number(e.amount),
        date: e.date,
      })),
    },
    profit: {
      net: profit,
      margin: totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0,
      status: profit > 0 ? 'PROFIT' : profit < 0 ? 'LOSS' : 'BREAK_EVEN',
    },
  });
});

// ─── Expense CRUD (for P&L) ───

const createExpenseSchema = z.object({
  category: z.enum(['RENT', 'SALARIES', 'SUPPLIES', 'UTILITIES', 'EQUIPMENT', 'MARKETING', 'MAINTENANCE', 'OTHER']),
  description: z.string().min(2),
  amount: z.number().positive(),
  date: z.string(),
  paymentMethod: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId) throw new HttpError(401, 'Not authenticated');
  const data = createExpenseSchema.parse(req.body);
  const expense = await prisma.expense.create({
    data: {
      ...data,
      date: new Date(data.date),
      createdById: req.userId,
    },
  });
  res.status(201).json(expense);
});

export const listExpenses = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, category } = req.query as Record<string, string>;
  const where: Record<string, unknown> = {};
  if (startDate && endDate) {
    where.date = { gte: new Date(startDate), lte: new Date(endDate) };
  }
  if (category) where.category = category;

  const expenses = await prisma.expense.findMany({
    where,
    include: { createdBy: { select: { name: true } } },
    orderBy: { date: 'desc' },
  });
  res.json(expenses);
});

export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
  if (!expense) throw new HttpError(404, 'Expense not found');
  await prisma.expense.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});