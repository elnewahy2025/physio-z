import type { Request, Response } from 'express';
import { z } from 'zod';
import * as appointmentService from '../services/appointment.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginationSchema, appointmentStatusSchema, isoDateSchema } from '../lib/validation.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

const createAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  therapistId: z.string().min(1, 'Therapist is required'),
  roomId: z.string().optional().nullable(),
  dateTime: isoDateSchema,
  duration: z.number().int().min(15).max(240).optional(),
  notes: z.string().optional().nullable(),
});

const updateAppointmentSchema = z.object({
  dateTime: isoDateSchema.optional(),
  duration: z.number().int().min(15).max(240).optional(),
  roomId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const listQuerySchema = paginationSchema.extend({
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  therapistId: z.string().optional(),
  patientId: z.string().optional(),
  status: appointmentStatusSchema.optional(),
});

const changeStatusSchema = z.object({ status: appointmentStatusSchema });

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { date, startDate, endDate, therapistId, patientId, status, page, limit } = listQuerySchema.parse(req.query);
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
  res.json(await appointmentService.listAppointments({
    date: date ? new Date(date) : undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    therapistId, 
    patientId: patientFilter, 
    status, 
    page, 
    limit,
  }));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  res.json(await appointmentService.getAppointmentById(req.params.id));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = createAppointmentSchema.parse(req.body);

  // If patient is booking for themselves, use their own patient ID
  if (req.userRole === 'PATIENT' && req.userId) {
    const ownPatient = await prisma.patient.findFirst({
      where: { userId: req.userId },
    });
    if (!ownPatient) {
      throw new HttpError(404, 'No patient profile found for this account');
    }
    // Override patientId with their own
    data.patientId = ownPatient.id;
  }

  res.status(201).json(await appointmentService.createAppointment(data));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = updateAppointmentSchema.parse(req.body);
  res.json(await appointmentService.updateAppointment(req.params.id, data));
});

export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = changeStatusSchema.parse(req.body);
  res.json(await appointmentService.changeAppointmentStatus(req.params.id, status));
});