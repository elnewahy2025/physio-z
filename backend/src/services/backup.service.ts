import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const exportPatientData = async (patientId: string) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { appointments: true, MedicalFile: true }
  });
  return { success: true, data: patient };
};

export const triggerSystemBackup = async () => {
  // In a real app, this would dump the postgres DB to S3
  return { success: true, message: 'Database backup initiated successfully' };
};
