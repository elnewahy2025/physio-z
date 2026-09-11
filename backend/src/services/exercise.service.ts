import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getExercises = async () => {
  return prisma.exercise.findMany();
};
export const assignExercise = async (patientId: string, exerciseId: string) => {
  return prisma.exerciseAssignment.create({
    data: {
      patientId,
      exerciseId,
      assignedBy: 'system',
      frequency: 'Daily',
      duration: '10 mins',
      status: 'PENDING'
    }
  });
};
