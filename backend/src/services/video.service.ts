import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const generateMeetingLink = async (appointmentId: string) => {
  return { success: true, link: 'https://meet.physio-z.com/' + appointmentId };
};
