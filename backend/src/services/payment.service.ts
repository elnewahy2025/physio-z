import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const processPayment = async (amount: number, currency: string) => {
  return { success: true, transactionId: 'txn_' + Date.now() };
};
export const getInvoices = async () => {
  return prisma.invoice.findMany();
};
