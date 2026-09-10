// backend/src/services/discount.service.ts
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

export async function validateDiscount(code: string, invoiceAmount: number) {
  const discount = await prisma.discount.findUnique({ where: { code } });

  if (!discount) {
    return { valid: false, reason: 'Invalid code' };
  }

  if (!discount.isActive) {
    return { valid: false, reason: 'Discount is inactive' };
  }

  const now = new Date();
  if (discount.startsAt > now) {
    return { valid: false, reason: 'Discount not started yet' };
  }

  if (discount.expiresAt && discount.expiresAt < now) {
    return { valid: false, reason: 'Discount expired' };
  }

  if (discount.maxUses && discount.usedCount >= discount.maxUses) {
    return { valid: false, reason: 'Usage limit reached' };
  }

  if (discount.minAmount && invoiceAmount < Number(discount.minAmount)) {
    return {
      valid: false,
      reason: `Minimum amount is ${Number(discount.minAmount)}`,
    };
  }

  // Calculate discount amount
  const discountAmount =
    discount.type === 'PERCENT'
      ? Math.round(invoiceAmount * Number(discount.value)) / 100
      : Number(discount.value);

  // Don't exceed invoice amount
  const finalAmount = Math.min(discountAmount, invoiceAmount);

  return {
    valid: true,
    code: discount.code,
    name: discount.name,
    type: discount.type,
    value: Number(discount.value),
    discountAmount: finalAmount,
    finalPrice: invoiceAmount - finalAmount,
  };
}

export async function listDiscounts() {
  return prisma.discount.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function createDiscount(data: {
  code: string;
  name: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minAmount?: number;
  maxUses?: number;
  startsAt: Date;
  expiresAt?: Date;
}) {
  // Validate
  if (data.type === 'PERCENT' && (data.value <= 0 || data.value > 100)) {
    throw new HttpError(400, 'Percent discount must be 1-100');
  }
  if (data.type === 'FIXED' && data.value <= 0) {
    throw new HttpError(400, 'Fixed discount must be positive');
  }

  // Check code uniqueness
  const existing = await prisma.discount.findUnique({ where: { code: data.code } });
  if (existing) throw new HttpError(409, 'Discount code already exists');

  return prisma.discount.create({ data });
}

export async function deleteDiscount(id: string) {
  const discount = await prisma.discount.findUnique({ where: { id } });
  if (!discount) throw new HttpError(404, 'Discount not found');
  await prisma.discount.delete({ where: { id } });
  return { success: true };
}