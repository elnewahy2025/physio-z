// backend/src/jobs/gamification.job.ts
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Daily CRON Job to evaluate streaks at Midnight
export const startGamificationJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[Gamification Job] Starting daily streak evaluation...');
    try {
      const activePatients = await prisma.patient.findMany({
        where: {
          // Add logic to get patients with exercises today
        },
        include: {
          loyaltyProfile: true,
        },
      });

      // Simple implementation: check if they completed an exercise yesterday
      // If yes, increase streak
      // If no, reset streak to 0
      
      console.log('[Gamification Job] Evaluation complete.');
    } catch (error) {
      console.error('[Gamification Job] Error during evaluation:', error);
    }
  });
};
