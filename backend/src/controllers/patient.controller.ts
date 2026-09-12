import type { Request, Response } from 'express';

import { z } from 'zod';

import * as patientService from '../services/patient.service.js';

import { asyncHandler } from '../middleware/errorHandler.js';

import { paginationSchema } from '../lib/validation.js';

import { HttpError } from '../lib/errors.js';

const createPatientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),

  phone: z.string().min(8, 'Phone must be at least 8 digits').max(15),

  email: z.string().email().optional(),

  address: z.string().optional(),

  dateOfBirth: z.coerce.date().optional(),

  medicalHistory: z.string().optional(),
});

const updatePatientSchema = createPatientSchema.partial();

const listQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
});

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

export const getMyRecords = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.userId) throw new Error('Not authenticated');

    const { prisma } = await import('../lib/prisma.js');

    // Find the patient linked to this user
    const patient = await prisma.patient.findFirst({
      where: { userId: req.userId },
    });

    if (!patient) throw new HttpError(404, 'No patient profile found');

    // Fetch all appointments with session notes, ratings, invoices,
    // and survey status.
    const records = await prisma.appointment.findMany({
      where: { patientId: patient.id },

      include: {
        therapist: {
          select: {
            id: true,
            name: true,
          },
        },

        room: {
          select: {
            number: true,
            name: true,
          },
        },

        therapySessions: {
          select: {
            id: true,
            diagnosis: true,
            treatmentPlan: true,
            notes: true,
            duration: true,
            painLevel: true,
            createdAt: true,
          },
        },

        invoices: {
          select: {
            id: true,
            number: true,
            total: true,
            status: true,
          },
        },

        rating: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },

        survey: {
          select: {
            id: true,
          },
        },
      },

      orderBy: { dateTime: 'desc' },
    });

    res.json(
      records.map((appt) => ({
        ...appt,
        hasSurvey: !!appt.survey,
        survey: undefined,
      })),
    );
  },
);
