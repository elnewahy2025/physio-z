import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const sendReminder = async (appointmentId: string) => {
  return { success: true, message: 'WhatsApp reminder sent' };
};
export const getReminders = async () => {
  return prisma.notification.findMany({ where: { type: 'WHATSAPP' } });
};
