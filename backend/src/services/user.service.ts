import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';
import type { Role } from '@prisma/client';

export interface CreateUserData {
  name: string;
  phone: string;
  email?: string;
  password: string;
  role: Role;
}

const userSelect = {
  id: true, name: true, phone: true, email: true, role: true, isActive: true, createdAt: true,
} as const;

export async function listUsers(role?: Role, search?: string) {
  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  return prisma.user.findMany({ where, select: userSelect, orderBy: { createdAt: 'desc' } });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) throw new HttpError(404, 'User not found');
  return user;
}

export async function createUser(data: CreateUserData) {
  const existingPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (existingPhone) throw new HttpError(409, 'A user with this phone number already exists');
  if (data.email) {
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) throw new HttpError(409, 'A user with this email already exists');
  }
  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: { name: data.name, phone: data.phone, email: data.email ?? null, passwordHash, role: data.role },
    select: userSelect,
  });
}

export async function updateUser(id: string, data: Partial<CreateUserData>) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, 'User not found');
  if (data.phone && data.phone !== user.phone) {
    const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing) throw new HttpError(409, 'A user with this phone number already exists');
  }
  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new HttpError(409, 'A user with this email already exists');
  }
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.update({ where: { id }, data: updateData, select: userSelect });
}

export async function deactivateUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, 'User not found');
  if (user.role === 'OWNER' && user.isActive) {
    const activeOwners = await prisma.user.count({ where: { role: 'OWNER', isActive: true } });
    if (activeOwners <= 1) throw new HttpError(400, 'Cannot deactivate the last active owner');
  }
  return prisma.user.update({ where: { id }, data: { isActive: false }, select: userSelect });
}