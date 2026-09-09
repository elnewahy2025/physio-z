import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

export interface CreatePatientData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  dateOfBirth?: Date;
  medicalHistory?: string;
}

export async function listPatients(search: string | undefined, page: number, limit: number) {
  const where = search
    ? { OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ] }
    : {};
  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      select: { id: true, name: true, phone: true, email: true, dateOfBirth: true, createdAt: true,
        _count: { select: { appointments: true, invoices: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.patient.count({ where }),
  ]);
  return { data: patients, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getPatientById(id: string) {
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: { select: { id: true, dateTime: true, status: true, duration: true,
        therapist: { select: { id: true, name: true } },
        room: { select: { number: true, name: true } } },
        orderBy: { dateTime: 'desc' }, take: 10 },
      invoices: { select: { id: true, number: true, total: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' }, take: 10 },
      user: { select: { id: true, email: true } },
    },
  });
  if (!patient) throw new HttpError(404, 'Patient not found');
  return patient;
}

export async function createPatient(data: CreatePatientData) {
  return prisma.patient.create({
    data: { name: data.name, phone: data.phone, email: data.email ?? null,
      address: data.address ?? null, dateOfBirth: data.dateOfBirth ?? null,
      medicalHistory: data.medicalHistory ?? null },
    select: { id: true, name: true, phone: true, email: true, address: true,
      dateOfBirth: true, medicalHistory: true, createdAt: true },
  });
}

export async function updatePatient(id: string, data: Partial<CreatePatientData>) {
  const existing = await prisma.patient.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Patient not found');
  return prisma.patient.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth }),
      ...(data.medicalHistory !== undefined && { medicalHistory: data.medicalHistory }),
    },
    select: { id: true, name: true, phone: true, email: true, address: true,
      dateOfBirth: true, medicalHistory: true, updatedAt: true },
  });
}

export async function deletePatient(id: string) {
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: { _count: { select: { appointments: true, invoices: true } } },
  });
  if (!patient) throw new HttpError(404, 'Patient not found');
  if (patient._count.invoices > 0 || patient._count.appointments > 0) {
    throw new HttpError(409, 'Cannot delete a patient with records. Medical data must be preserved.');
  }
  await prisma.patient.delete({ where: { id } });
  return { success: true };
}

export async function getPatientByUserId(userId: string) {
  const patient = await prisma.patient.findFirst({ where: { userId } });
  if (!patient) throw new HttpError(404, 'No patient profile linked to this account');
  return patient;
}