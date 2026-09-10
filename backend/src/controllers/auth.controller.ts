
import type { Request, Response } from 'express';

import { z } from 'zod';

import * as authService from '../services/auth.service.js';

import { asyncHandler } from '../middleware/errorHandler.js';

import bcrypt from 'bcryptjs';

import { prisma } from '../lib/prisma.js';

import { HttpError } from '../lib/errors.js';

import { signAccessToken, signRefreshToken } from '../lib/tokens.js';

import {
  notifyRole,
  NOTIFICATION_TYPES,
} from '../services/notification.service.js';

const loginSchema = z.object({
  identifier: z.string().min(3, 'Phone or email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const refreshSchema = z.object({ refreshToken: z.string().min(1) });

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password } = loginSchema.parse(req.body);

  res.json(await authService.login(identifier, password));
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = refreshSchema.parse(req.body);

  res.json(await authService.refresh(refreshToken));
});

export const logout = (_req: Request, res: Response) => {
  res.status(204).send();
};

// Patient self-registration
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(8, 'Phone must be at least 8 digits').max(15),
  email: z.string().email('Invalid email').optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  dateOfBirth: z.string().optional().nullable(),
  medicalHistory: z.string().optional().nullable(),
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);

  // Check if phone already exists
  const existingUser = await prisma.user.findUnique({
    where: { phone: data.phone },
  });

  if (existingUser) {
    throw new HttpError(
      409,
      'An account with this phone number already exists',
    );
  }

  if (data.email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new HttpError(
        409,
        'An account with this email already exists',
      );
    }
  }

  // Create user with PATIENT role
  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      passwordHash,
      role: 'PATIENT',
    },
  });

  // Create linked patient record
  const patient = await prisma.patient.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      medicalHistory: data.medicalHistory ?? null,
      userId: user.id,
    },
  });

  // Notify staff about new patient registration
  await notifyRole('SECRETARY', {
    type: NOTIFICATION_TYPES.PATIENT_REGISTERED,
    title: 'New Patient Registered',
    message: `${data.name} (${data.phone}) registered online`,
    link: '/patients',
  });

  await notifyRole('OWNER', {
    type: NOTIFICATION_TYPES.PATIENT_REGISTERED,
    title: 'New Patient',
    message: `${data.name} (${data.phone}) registered online`,
    link: '/patients',
  });

  // Return tokens so they're logged in immediately after registration
  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);

  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
    },

    patient: {
      id: patient.id,
      name: patient.name,
    },

    accessToken,
    refreshToken,
  });
});

