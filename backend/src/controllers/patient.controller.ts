import type { Request, Response } from 'express';
import { z } from 'zod';
import * as patientService from '../services/patient.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginationSchema } from '../lib/validation.js';

const createPatientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(8, 'Phone must be at least 8 digits').max(15),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  medicalHistory: z.string().optional().nullable(),
});

const updatePatientSchema = createPatientSchema.partial();
const listQuerySchema = paginationSchema.extend({ search: z.string().optional() });

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, page, limit } = listQuerySchema.parse(req.query);
  res.json(await patientService.listPatients(search, page, limit));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  res.json(await patientService.getPatientById(req.params.id));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = createPatientSchema.parse(req.body);
  res.status(201).json(await patientService.createPatient(data));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = updatePatientSchema.parse(req.body);
  res.json(await patientService.updatePatient(req.params.id, data));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  res.json(await patientService.deletePatient(req.params.id));
});

export const getOwn = asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId) throw new Error('Not authenticated');
  res.json(await patientService.getPatientByUserId(req.userId));
});