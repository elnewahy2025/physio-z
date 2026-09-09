import { z } from 'zod';

export const roleSchema = z.enum(['OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT']);
export const appointmentStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']);
export const invoiceStatusSchema = z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED']);
export const paymentMethodSchema = z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'OTHER']);
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const isoDateSchema = z.coerce.date();