import type { Request, Response } from 'express';
import { z } from 'zod';
import * as userService from '../services/user.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { roleSchema } from '../lib/validation.js';
import type { Role } from '@prisma/client';

// Roles that OWNER is allowed to assign (all roles)
const ASSIGNABLE_ROLES = roleSchema;

// Roles only OWNER can assign (Manager/Owner roles)
const PRIVILEGED_ROLES: Role[] = ['OWNER', 'MANAGER_BASIC', 'MANAGER_ADVANCED', 'MANAGER_PREMIUM'];

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

  // Patients can only list therapists
  if (req.userRole === 'PATIENT' && role !== 'THERAPIST') {
    res.status(403).json({ message: 'Patients can only list therapists' });
    return;
  }

  res.json(await userService.listUsers(role, search));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  res.json(await userService.getUserById(req.params.id));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = createUserSchema.parse(req.body);

  // Anti-escalation: Only OWNER can create Manager or Owner accounts
  if (PRIVILEGED_ROLES.includes(data.role as Role) && req.userRole !== 'OWNER') {
    res.status(403).json({ message: 'Only the Owner can create Manager or Owner accounts' });
    return;
  }

  res.status(201).json(await userService.createUser(data));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = updateUserSchema.parse(req.body);

  // Anti-escalation: Only OWNER can change roles to Manager/Owner roles or change any role at all
  if (data.role !== undefined) {
    if (req.userRole !== 'OWNER') {
      res.status(403).json({ message: 'Only the Owner can change user roles' });
      return;
    }
    // Additionally, no one can assign 'OWNER' role via API (must be done directly in DB)
    if (data.role === 'OWNER') {
      res.status(403).json({ message: 'Cannot assign Owner role via API' });
      return;
    }
  }

  // Anti-escalation: Managers cannot update their own record
  if (req.userId === req.params.id && req.userRole !== 'OWNER') {
    res.status(403).json({ message: 'You cannot update your own account' });
    return;
  }

  res.json(await userService.updateUser(req.params.id, data));
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  // Anti-escalation: Cannot self-deactivate
  if (req.userId === req.params.id) {
    res.status(403).json({ message: 'You cannot deactivate your own account' });
    return;
  }
  res.json(await userService.deactivateUser(req.params.id));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  // Anti-escalation: Cannot self-delete
  if (req.userId === req.params.id) {
    res.status(403).json({ message: 'You cannot delete your own account' });
    return;
  }
  res.json(await userService.deleteUser(req.params.id));
});