import type { Request, Response } from 'express';
import { z } from 'zod';
import * as invoiceService from '../services/invoice.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginationSchema, invoiceStatusSchema, paymentMethodSchema, isoDateSchema } from '../lib/validation.js';

const createInvoiceSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  appointmentId: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  tax: z.number().min(0).optional(),
  dueDate: z.coerce.date().optional(),
});

const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  method: paymentMethodSchema,
  transactionId: z.string().optional(),
});

const listQuerySchema = paginationSchema.extend({
  patientId: z.string().optional(),
  status: invoiceStatusSchema.optional(),
});

const updateStatusSchema = z.object({ status: invoiceStatusSchema });

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { patientId, status, page, limit } = listQuerySchema.parse(req.query);
  let patientFilter = patientId;
  if (req.userRole === 'PATIENT' && req.userId) {
    const { prisma } = await import('../lib/prisma.js');
    const ownPatient = await prisma.patient.findFirst({ where: { userId: req.userId } });
    if (!ownPatient) {
      res.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      return;
    }
    patientFilter = ownPatient.id;
  }
  res.json(await invoiceService.listInvoices({ patientId: patientFilter, status, page, limit }));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  res.json(await invoiceService.getInvoiceById(req.params.id));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = createInvoiceSchema.parse(req.body);
  if (!req.userId) throw new Error('Not authenticated');
  res.status(201).json(await invoiceService.createInvoice(data, req.userId));
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = updateStatusSchema.parse(req.body);
  res.json(await invoiceService.updateInvoiceStatus(req.params.id, status));
});

export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  const data = recordPaymentSchema.parse(req.body);
  res.status(201).json(await invoiceService.recordPayment(data));
});

export const getInvoicePdf = asyncHandler(async (req: Request, res: Response) => {
  res.status(501).json({ message: 'PDF generation will be implemented in Phase 3', invoiceId: req.params.id });
});