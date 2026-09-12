import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

export async function getLoyaltyProfile(patientId: string) {
  let profile = await prisma.loyaltyProfile.findUnique({
    where: { patientId },
    include: {
      patient: {
        include: {
          patientBadges: {
            include: { badge: true }
          }
        }
      }
    }
  });

  if (!profile) {
    profile = await prisma.loyaltyProfile.create({
      data: { patientId },
      include: {
        patient: {
          include: {
            patientBadges: {
              include: { badge: true }
            }
          }
        }
      }
    });
  }

  return {
    ...profile,
    badges: profile.patient.patientBadges.map(pb => pb.badge)
  };
}

export async function getBadges() {
  return prisma.badge.findMany();
}

export async function processExerciseCompletion(patientId: string, exerciseLogId: string) {
  // Get the patient profile
  let profile = await prisma.loyaltyProfile.findUnique({ where: { patientId } });
  if (!profile) {
    profile = await prisma.loyaltyProfile.create({ data: { patientId } });
  }

  // Verify the log exists
  const log = await prisma.exerciseLog.findUnique({ where: { id: exerciseLogId } });
  if (!log) throw new HttpError(404, 'Exercise log not found');

  // We need to determine if this is the first exercise today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const logsToday = await prisma.exerciseLog.count({
    where: {
      assignment: { prescription: { patientId } },
      completedAt: { gte: todayStart, lt: todayEnd }
    }
  });

  let streakUpdated = false;
  // If this is the only log today, check yesterday for streak
  if (logsToday === 1) {
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    
    const logsYesterday = await prisma.exerciseLog.count({
      where: {
        assignment: { prescription: { patientId } },
        completedAt: { gte: yesterdayStart, lt: todayStart }
      }
    });

    if (logsYesterday > 0) {
      // Continue streak
      profile = await prisma.loyaltyProfile.update({
        where: { id: profile.id },
        data: { 
          currentStreak: { increment: 1 },
          longestStreak: Math.max(profile.longestStreak, profile.currentStreak + 1),
          points: { increment: 10 } // Award points for daily exercise
        }
      });
    } else {
      // Reset streak to 1
      profile = await prisma.loyaltyProfile.update({
        where: { id: profile.id },
        data: { 
          currentStreak: 1,
          longestStreak: Math.max(profile.longestStreak, 1),
          points: { increment: 10 }
        }
      });
    }
    streakUpdated = true;

    // Log the transaction
    await prisma.loyaltyTransaction.create({
      data: {
        patientId,
        amount: 10,
        type: 'EARN',
        description: 'Completed daily exercise routine'
      }
    });
  }

  // Check for new badges
  const earnedBadges = await evaluateBadges(patientId, profile);

  return {
    streakUpdated,
    newStreak: profile.currentStreak,
    pointsEarned: streakUpdated ? 10 : 0,
    newBadges: earnedBadges,
    totalPoints: profile.points
  };
}

async function evaluateBadges(patientId: string, profile: any) {
  const allBadges = await prisma.badge.findMany();
  const earned = await prisma.patientBadge.findMany({
    where: { patientId },
    select: { badgeId: true }
  });
  
  const earnedSet = new Set(earned.map(e => e.badgeId));
  const newBadges = [];

  for (const badge of allBadges) {
    if (!earnedSet.has(badge.id)) {
      let qualifies = false;
      
      switch (badge.criteriaType) {
        case 'STREAK':
          if (profile.currentStreak >= badge.criteriaValue) qualifies = true;
          break;
        case 'POINTS':
          if (profile.points >= badge.criteriaValue) qualifies = true;
          break;
        // EXERCISE_COUNT could be added here
      }

      if (qualifies) {
        const pb = await prisma.patientBadge.create({
          data: { patientId, badgeId: badge.id },
          include: { badge: true }
        });
        newBadges.push(pb.badge);
      }
    }
  }

  return newBadges;
}
