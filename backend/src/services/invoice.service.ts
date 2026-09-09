import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';
import type { InvoiceStatus, PaymentMethod } from '@prisma/client';

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      createdAt: {
        gte: new Date(year + '-01-01T00:00:00Z'),
        lt: new Date((year + 1) + '-01-01T00:00:00Z'),
      },
    },
  });
  return 'INV-' + year + '-' + String(count + 1).padStart(4, '0');
}

const invoiceInclude = {
  patient: { select: { id: true, name: true, phone: true } },
  appointment: { select: { id: true, dateTime: true, status: true } },
  payments: true,
} as const;

export async function listInvoices(filters: { patientId?: string; status?: InvoiceStatus; page: number; limit: number }) {
  const where: Record<string, unknown> = {};
  if (filters.patientId) where.patientId = filters.patientId;
  if (filters.status) where.status = filters.status;
  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where, include: invoiceInclude, orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit, take: filters.limit,
    }),
    prisma.invoice.count({ where }),
  ]);
  return { data: invoices, pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } };
}

export async function getInvoiceById(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { ...invoiceInclude, createdBy: { select: { id: true, name: true } } },
  });
  if (!invoice) throw new HttpError(404, 'Invoice not found');
  return invoice;
}

export async function createInvoice(data: {
  patientId: string; appointmentId?: string; amount: number; tax?: number; dueDate?: Date;
}, createdById: string) {
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient) throw new HttpError(404, 'Patient not found');
  if (data.appointmentId) {
    const appointment = await prisma.appointment.findUnique({ where: { id: data.appointmentId } });
    if (!appointment) throw new HttpError(404, 'Appointment not found');
    if (appointment.patientId !== data.patientId) {
      throw new HttpError(400, 'Appointment does not belong to this patient');
    }
  }
  const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
  if (!settings) throw new HttpError(500, 'Settings not configured');
  if (data.amount <= 0) throw new HttpError(400, 'Amount must be greater than 0');
  const tax = data.tax ?? Math.round(data.amount * Number(settings.taxRate)) / 100;
  const total = Math.round((data.amount + tax) * 100) / 100;
  const number = await generateInvoiceNumber();
  return prisma.invoice.create({
    data: {
      number, patientId: data.patientId, appointmentId: data.appointmentId ?? null,
      amount: data.amount, tax, total, dueDate: data.dueDate ?? null, createdById,
    },
    include: invoiceInclude,
  });
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new HttpError(404, 'Invoice not found');
  if (invoice.status === 'PAID' && status !== 'PAID') {
    throw new HttpError(400, 'Cannot change status of a paid invoice');
  }
  return prisma.invoice.update({ where: { id }, data: { status }, include: invoiceInclude });
}

export async function recordPayment(data: {
  invoiceId: string; amount: number; method: PaymentMethod; transactionId?: string;
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
    include: { payments: true },
  });
  if (!invoice) throw new HttpError(404, 'Invoice not found');
  if (invoice.status === 'PAID') throw new HttpError(400, 'This invoice is already fully paid');
  if (invoice.status === 'CANCELLED') throw new HttpError(400, 'Cannot record payment on a cancelled invoice');
  if (data.amount <= 0) throw new HttpError(400, 'Payment amount must be greater than 0');
  const totalPaid = invoice.payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalDue = Number(invoice.total) - totalPaid;
  if (data.amount > totalDue) {
    throw new HttpError(400, 'Payment exceeds remaining balance. Amount due: ' + totalDue.toFixed(2));
  }
  const payment = await prisma.payment.create({
    data: {
      invoiceId: data.invoiceId, amount: data.amount, method: data.method,
      status: 'COMPLETED', transactionId: data.transactionId ?? null,
    },
  });
  const newTotalPaid = totalPaid + data.amount;
  let newStatus: InvoiceStatus;
  if (newTotalPaid >= Number(invoice.total)) newStatus = 'PAID';
  else if (newTotalPaid > 0) newStatus = 'PARTIALLY_PAID';
  else newStatus = 'UNPAID';
  await prisma.invoice.update({
    where: { id: data.invoiceId },
    data: { status: newStatus, ...(newStatus === 'PAID' && { paymentMethod: data.method }) },
  });
  return {
    payment,
    invoice: {
      id: invoice.id, number: invoice.number, status: newStatus,
      totalPaid: newTotalPaid, totalDue: Number(invoice.total) - newTotalPaid,
    },
  };
}