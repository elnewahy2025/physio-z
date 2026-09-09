import type { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';

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