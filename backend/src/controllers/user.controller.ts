import type { Request, Response } from 'express';
import { z } from 'zod';
import * as userService from '../services/user.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { roleSchema } from '../lib/validation.js';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(8, 'Phone must be at least 8 digits').max(15),
  email: z.string().email().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: roleSchema,
});

const updateUserSchema = createUserSchema.partial();
const listQuerySchema = z.object({ role: roleSchema.optional(), search: z.string().optional() });

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { role, search } = listQuerySchema.parse(req.query);
  res.json(await userService.listUsers(role, search));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  res.json(await userService.getUserById(req.params.id));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = createUserSchema.parse(req.body);
  res.status(201).json(await userService.createUser(data));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = updateUserSchema.parse(req.body);
  res.json(await userService.updateUser(req.params.id, data));
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  res.json(await userService.deactivateUser(req.params.id));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  res.json(await userService.deleteUser(req.params.id));
});