// backend/src/controllers/phase3.controller.ts
import type { Request, Response } from 'express';
import { z } from 'zod';
import * as inventoryService from '../services/inventory.service.js';
import * as equipmentService from '../services/equipment.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HttpError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';

// ─── Inventory ───

const createInventorySchema = z.object({
  name: z.string().min(2),
  category: z.enum(['SUPPLIES', 'MEDICATION', 'EQUIPMENT_PARTS', 'OFFICE', 'CLEANING']),
  unit: z.string().min(1),
  quantity: z.number().int().min(0).optional(),
  minQuantity: z.number().int().min(0).optional(),
  maxQuantity: z.number().int().min(1).optional(),
  unitCost: z.number().positive().optional().nullable(),
  supplier: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const listInventory = asyncHandler(async (req: Request, res: Response) => {
  const { category, lowStock } = req.query;
  res.json(
    await inventoryService.listInventory(
      category as string | undefined,
      lowStock === 'true',
    ),
  );
});

export const getInventoryStats = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await inventoryService.getInventoryStats());
});

export const createInventory = asyncHandler(async (req: Request, res: Response) => {
  const data = createInventorySchema.parse(req.body);
  res.status(201).json(await inventoryService.createInventoryItem(data));
});

export const updateInventory = asyncHandler(async (req: Request, res: Response) => {
  res.json(await inventoryService.updateInventoryItem(req.params.id, req.body));
});

export const deleteInventory = asyncHandler(async (req: Request, res: Response) => {
  res.json(await inventoryService.deleteInventoryItem(req.params.id));
});

const stockTransactionSchema = z.object({
  itemId: z.string().min(1),
  type: z.enum(['IN', 'OUT', 'ADJUST']),
  quantity: z.number().int().positive(),
  reason: z.string().optional().nullable(),
});

export const stockTransaction = asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId) throw new HttpError(401, 'Not authenticated');
  const data = stockTransactionSchema.parse(req.body);
  res.json(
    await inventoryService.stockTransaction({
      ...data,
      recordedById: req.userId,
    }),
  );
});

export const getTransactionHistory = asyncHandler(async (req: Request, res: Response) => {
  res.json(await inventoryService.getTransactionHistory(req.params.itemId));
});

// ─── Equipment ───

const createEquipmentSchema = z.object({
  name: z.string().min(2),
  category: z.enum(['TREATMENT', 'DIAGNOSTIC', 'EXERCISE', 'FURNITURE', 'OTHER']),
  serialNumber: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  purchaseCost: z.number().positive().optional().nullable(),
  maintenanceIntervalDays: z.number().int().min(1).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const listEquipment = asyncHandler(async (req: Request, res: Response) => {
  const { category, status } = req.query;
  res.json(
    await equipmentService.listEquipment(
      category as string | undefined,
      status as string | undefined,
    ),
  );
});

export const getEquipmentStats = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await equipmentService.getMaintenanceStats());
});

export const createEquipment = asyncHandler(async (req: Request, res: Response) => {
  const data = createEquipmentSchema.parse(req.body);
  if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate);
  res.status(201).json(await equipmentService.createEquipment(data));
});

export const updateEquipment = asyncHandler(async (req: Request, res: Response) => {
  res.json(await equipmentService.updateEquipment(req.params.id, req.body));
});

export const deleteEquipment = asyncHandler(async (req: Request, res: Response) => {
  res.json(await equipmentService.deleteEquipment(req.params.id));
});

const logMaintenanceSchema = z.object({
  equipmentId: z.string().min(1),
  type: z.enum(['ROUTINE', 'REPAIR', 'INSPECTION', 'CALIBRATION']),
  description: z.string().min(3),
  cost: z.number().positive().optional().nullable(),
  performedBy: z.string().optional().nullable(),
  nextDueInDays: z.number().int().min(1).optional().nullable(),
});

export const logMaintenance = asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId) throw new HttpError(401, 'Not authenticated');
  const data = logMaintenanceSchema.parse(req.body);
  res.status(201).json(
    await equipmentService.logMaintenance({
      ...data,
      createdById: req.userId,
    }),
  );
});

export const getMaintenanceHistory = asyncHandler(async (req: Request, res: Response) => {
  res.json(await equipmentService.getMaintenanceHistory(req.params.equipmentId));
});

// ─── Expenses (full CRUD — backend exists, adding list endpoint) ───

export const getExpenseStats = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as Record<string, string>;

  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = endDate ? new Date(endDate) : new Date();

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { date: 'desc' },
  });

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const byCategory: Record<string, number> = {};
  for (const exp of expenses) {
    byCategory[exp.category] = (byCategory[exp.category] || 0) + Number(exp.amount);
  }

  const byMonth: Record<string, number> = {};
  for (const exp of expenses) {
    const monthKey = exp.date.toISOString().slice(0, 7);
    byMonth[monthKey] = (byMonth[monthKey] || 0) + Number(exp.amount);
  }

  res.json({
    period: { start: start.toISOString(), end: end.toISOString() },
    totals: {
      total,
      count: expenses.length,
      average: expenses.length > 0 ? total / expenses.length : 0,
    },
    byCategory,
    byMonth: Object.entries(byMonth).map(([month, amount]) => ({ month, amount: Math.round(amount) })),
    recentExpenses: expenses.slice(0, 20).map((e) => ({
      id: e.id,
      category: e.category,
      description: e.description,
      amount: Number(e.amount),
      date: e.date,
    })),
  });
});