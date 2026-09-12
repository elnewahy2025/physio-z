// backend/src/services/package.service.ts
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';
import { validateDiscount } from './discount.service.js';

// ─── Package Management (Owner) ───

export async function listPackages(includeInactive = false) {
  const where: Record<string, unknown> = {};
  if (!includeInactive) where.isActive = true;

  return prisma.package.findMany({
    where,
    include: {
      _count: { select: { patientPackages: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createPackage(data: {
  name: string;
  description?: string;
  sessionCount: number;
  price: number;
  durationDays?: number;
}) {
  if (data.sessionCount < 1) throw new HttpError(400, 'Session count must be at least 1');
  if (data.price <= 0) throw new HttpError(400, 'Price must be positive');

  return prisma.package.create({ data });
}

export async function updatePackage(id: string, data: Partial<{
  name: string;
  description: string;
  sessionCount: number;
  price: number;
  durationDays: number;
  isActive: boolean;
}>) {
  const existing = await prisma.package.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Package not found');

  return prisma.package.update({ where: { id }, data });
}

export async function deletePackage(id: string) {
  // Soft delete — just deactivate
  const existing = await prisma.package.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Package not found');

  await prisma.package.update({ where: { id }, data: { isActive: false } });
  return { success: true };
}

// ─── Sell Package to Patient ───

export async function sellPackage(data: {
  patientId: string;
  packageId: string;
  createdById: string;
  discountCode?: string;
}) {
  const [patient, package_] = await Promise.all([
    prisma.patient.findUnique({ where: { id: data.patientId } }),
    prisma.package.findUnique({ where: { id: data.packageId } }),
  ]);

  if (!patient) throw new HttpError(404, 'Patient not found');
  if (!package_ || !package_.isActive) throw new HttpError(404, 'Package not found or inactive');

  // Calculate final price with discount
  let finalPrice = Number(package_.price);
  let appliedDiscount: { code: string; amount: number } | null = null;

  if (data.discountCode) {
    const discount = await validateDiscount(data.discountCode, Number(package_.price));
    if (discount.valid && discount.discountAmount) {
      finalPrice -= discount.discountAmount;
      appliedDiscount = { code: discount.code, amount: discount.discountAmount };
    }
  }

  // Calculate expiry
  const expiryDate = package_.durationDays
    ? new Date(Date.now() + package_.durationDays * 24 * 60 * 60 * 1000)
    : null;

  // Create patient package
  const patientPackage = await prisma.patientPackage.create({
    data: {
      patientId: data.patientId,
      packageId: data.packageId,
      sessionsUsed: 0,
      sessionsTotal: package_.sessionCount,
      purchasePrice: finalPrice,
      purchaseDate: new Date(),
      expiryDate,
      status: 'ACTIVE',
      createdById: data.createdById,
    },
    include: {
      patient: { select: { id: true, name: true } },
      package: { select: { id: true, name: true, sessionCount: true } },
    },
  });

  // Create invoice for the package
  const invoice = await prisma.invoice.create({
    data: {
      number: await generateInvoiceNumber(),
      patientId: data.patientId,
      amount: finalPrice,
      tax: 0, // Package price is final
      total: finalPrice,
      status: 'UNPAID',
      createdById: data.createdById,
    },
  });

  // Update discount usage if applied
  if (appliedDiscount) {
    await prisma.discount.update({
      where: { code: appliedDiscount.code },
      data: { usedCount: { increment: 1 } },
    });
  }

  return { patientPackage, invoice, appliedDiscount };
}

// ─── Use Session (Auto-deduct when appointment completed) ───

export async function useSession(patientId: string, appointmentId: string) {
  // Find active package for this patient with remaining sessions
  const activePackage = await prisma.patientPackage.findFirst({
    where: {
      patientId,
      status: 'ACTIVE',
      sessionsUsed: { lt: prisma.patientPackage.fields.sessionsTotal },
      OR: [
        { expiryDate: null },
        { expiryDate: { gte: new Date() } },
      ],
    },
    include: { package: true },
    orderBy: { purchaseDate: 'asc' }, // Use oldest package first
  });

  if (!activePackage) {
    return { used: false, reason: 'No active package' };
  }

  // Check if session limit reached
  if (activePackage.sessionsUsed >= activePackage.sessionsTotal) {
    // Mark as completed
    await prisma.patientPackage.update({
      where: { id: activePackage.id },
      data: { status: 'COMPLETED' },
    });
    return { used: false, reason: 'Package completed' };
  }

  // Increment sessions used
  const updated = await prisma.patientPackage.update({
    where: { id: activePackage.id },
    data: { sessionsUsed: { increment: 1 } },
  });

  // If all sessions used, mark as completed
  if (updated.sessionsUsed >= updated.sessionsTotal) {
    await prisma.patientPackage.update({
      where: { id: updated.id },
      data: { status: 'COMPLETED' },
    });
  }

  return {
    used: true,
    package: {
      name: activePackage.package.name,
      sessionsRemaining: updated.sessionsTotal - updated.sessionsUsed,
      sessionsTotal: updated.sessionsTotal,
    },
  };
}

// ─── Patient's Active Packages ───

export async function getPatientPackages(patientId: string) {
  return prisma.patientPackage.findMany({
    where: {
      patientId,
      status: { in: ['ACTIVE', 'COMPLETED'] },
    },
    include: {
      package: { select: { name: true, description: true } },
    },
    orderBy: { purchaseDate: 'desc' },
  });
}

// ─── Helper: Generate Invoice Number ───
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00Z`),
        lt: new Date(`${year + 1}-01-01T00:00:00Z`),
      },
    },
  });
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
}
