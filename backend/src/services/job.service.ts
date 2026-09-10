
import { prisma } from '../lib/prisma.js';
import { notificationEmitter } from '../lib/notification-emitter.js';
import { checkLowStockJob } from './inventory.service.js';
import { checkMaintenanceDueJob } from './equipment.service.js';

import {
  sendEmail,
  weeklyReportTemplate,
  isEmailConfigured,
} from './email.service.js';

// ─── Job Types ───────────────────────────────────────────────────────────────

export const JOB_TYPES = {
  REMINDER_24H: 'REMINDER_24H',
  REMINDER_2H: 'REMINDER_2H',
  FOLLOW_UP_CHECK: 'FOLLOW_UP_CHECK',
  CHURN_CHECK: 'CHURN_CHECK',
  WEEKLY_REPORT: 'WEEKLY_REPORT',
  SURVEY_REMINDER: 'SURVEY_REMINDER',
  // Add to jobHandlers:
// [JOB_TYPES.INVENTORY_CHECK]: checkLowStockJob,
// [JOB_TYPES.MAINTENANCE_CHECK]: checkMaintenanceDueJob,

// Add to JOB_TYPES:
INVENTORY_CHECK: 'INVENTORY_CHECK',
MAINTENANCE_CHECK: 'MAINTENANCE_CHECK',
} as const;

// ─── Job Handlers ────────────────────────────────────────────────────────────

async function handleReminder24h() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      dateTime: {
        gte: tomorrow,
        lt: new Date(tomorrow.getTime() + 60 * 60 * 1000),
      },
      status: 'CONFIRMED',
    },
    include: {
      patient: {
        include: {
          user: true,
        },
      },
    },
  });

  let notified = 0;

  for (const appointment of appointments) {
    if (!appointment.patient.user) {
      continue;
    }

    await prisma.notification.create({
      data: {
        userId: appointment.patient.user.id,
        type: 'APPOINTMENT_REMINDER',
        title: 'Appointment Reminder',
        message: 'You have an appointment tomorrow.',
        link: `/appointments/${appointment.id}`,
      },
    });

    notified++;
  }

  return {
    appointmentsChecked: appointments.length,
    notificationsSent: notified,
  };
}

async function handleReminder2h() {
  const now = new Date();
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      dateTime: {
        gte: inTwoHours,
        lt: new Date(inTwoHours.getTime() + 30 * 60 * 1000),
      },
      status: 'CONFIRMED',
    },
    include: {
      patient: {
        include: {
          user: true,
        },
      },
    },
  });

  let notified = 0;

  for (const appointment of appointments) {
    if (!appointment.patient.user) {
      continue;
    }

    await prisma.notification.create({
      data: {
        userId: appointment.patient.user.id,
        type: 'APPOINTMENT_REMINDER',
        title: 'Appointment Reminder',
        message: 'Your appointment is in approximately 2 hours.',
        link: `/appointments/${appointment.id}`,
      },
    });

    notified++;
  }

  return {
    appointmentsChecked: appointments.length,
    notificationsSent: notified,
  };
}

async function handleFollowUpCheck() {
  const now = new Date();
  const threeDaysAgo = new Date(
    now.getTime() - 3 * 24 * 60 * 60 * 1000,
  );

  const appointments = await prisma.appointment.findMany({
    where: {
      status: 'COMPLETED',
      dateTime: {
        gte: threeDaysAgo,
        lte: now,
      },
    },
    include: {
      patient: {
        include: {
          user: true,
        },
      },
    },
  });

  let notified = 0;

  for (const appointment of appointments) {
    if (!appointment.patient.user) {
      continue;
    }

    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: appointment.patient.user.id,
        type: 'FOLLOW_UP',
      },
    });

    if (!existingNotification) {
      await prisma.notification.create({
        data: {
          userId: appointment.patient.user.id,
          type: 'FOLLOW_UP',
          title: 'How are you feeling?',
          message:
            'We hope you are feeling better after your recent physiotherapy session.',
          link: '/my-records',
        },
      });

      notified++;
    }
  }

  return {
    appointmentsChecked: appointments.length,
    notificationsSent: notified,
  };
}

async function handleChurnCheck() {
  const now = new Date();
  const thirtyDaysAgo = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000,
  );

  const patients = await prisma.patient.findMany({
    where: {
      appointments: {
        some: {
          status: 'COMPLETED',
          dateTime: {
            lt: thirtyDaysAgo,
          },
        },
        none: {
          dateTime: {
            gte: thirtyDaysAgo,
          },
        },
      },
    },
    include: {
      user: true,
    },
  });

  let notified = 0;

  for (const patient of patients) {
    if (!patient.user) {
      continue;
    }

    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: patient.user.id,
        type: 'CHURN_RISK',
      },
    });

    if (!existingNotification) {
      await prisma.notification.create({
        data: {
          userId: patient.user.id,
          type: 'CHURN_RISK',
          title: 'We miss you',
          message:
            'It has been a while since your last physiotherapy session. Consider booking a follow-up appointment.',
          link: '/appointments',
        },
      });

      notified++;
    }
  }

  return {
    patientsChecked: patients.length,
    notificationsSent: notified,
  };
}

// ─── Weekly Report Handler ──────────────────────────────────────────────────

async function handleWeeklyReport() {
  if (!isEmailConfigured()) {
    return {
      skipped: true,
      reason: 'SMTP not configured',
    };
  }

  const now = new Date();

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const weekEnd = now;

  const [
    appointments,
    newPatients,
    payments,
    settings,
    topTherapist,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        dateTime: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    }),

    prisma.patient.count({
      where: {
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    }),

    prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: 'COMPLETED',
      },
      select: {
        amount: true,
      },
    }),

    prisma.settings.findUnique({
      where: {
        id: 'singleton',
      },
    }),

    prisma.survey.groupBy({
      by: ['therapistId'],
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
      orderBy: {
        _avg: {
          rating: 'desc',
        },
      },
      take: 1,
    }),
  ]);

  const completedAppointments = await prisma.appointment.count({
    where: {
      dateTime: {
        gte: weekStart,
        lte: weekEnd,
      },
      status: 'COMPLETED',
    },
  });

  const revenueCollected = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  const currency = settings?.currency || 'EGP';
  const centerName = settings?.centerName || 'Physio Center';

  const outstandingInvoices = await prisma.invoice.findMany({
    where: {
      status: {
        in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'],
      },
    },
    include: {
      payments: {
        where: {
          status: 'COMPLETED',
        },
      },
    },
  });

  const outstanding = outstandingInvoices.reduce((sum, invoice) => {
    const paid = invoice.payments.reduce(
      (paymentSum, payment) => paymentSum + Number(payment.amount),
      0,
    );

    return sum + (Number(invoice.total) - paid);
  }, 0);

  let topTherapistName: string | null = null;
  let topRating: number | null = null;

  if (topTherapist.length > 0) {
    const therapist = await prisma.user.findUnique({
      where: {
        id: topTherapist[0].therapistId,
      },
      select: {
        name: true,
      },
    });

    topTherapistName = therapist?.name || null;

    topRating = topTherapist[0]._avg.rating
      ? Math.round(topTherapist[0]._avg.rating * 10) / 10
      : null;
  }

  const owner = await prisma.user.findFirst({
    where: {
      role: 'OWNER',
      isActive: true,
    },
    select: {
      email: true,
    },
  });

  if (!owner?.email) {
    return {
      skipped: true,
      reason: 'Owner has no email',
    };
  }

  const emailHtml = weeklyReportTemplate({
    centerName,
    weekStart: weekStart.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    }),
    weekEnd: weekEnd.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    totalAppointments: appointments,
    completedAppointments,
    newPatients,
    revenueCollected,
    currency,
    outstandingAmount: outstanding,
    topTherapist: topTherapistName,
    therapistRating: topRating,
  });

  const sent = await sendEmail({
    to: owner.email,
    subject: `📊 Weekly Report — ${centerName} (${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()})`,
    html: emailHtml,
  });

  return {
    emailSent: sent,
    stats: {
      appointments,
      completedAppointments,
      newPatients,
      revenueCollected,
    },
  };
}

// ─── Survey Reminder Handler ────────────────────────────────────────────────

async function handleSurveyReminder() {
  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: 'COMPLETED',
      dateTime: {
        lte: yesterday,
      },
      survey: null,
    },
    include: {
      patient: {
        include: {
          user: true,
        },
      },
    },
    take: 50,
  });

  let notified = 0;

  for (const appointment of appointments) {
    if (!appointment.patient.user) {
      continue;
    }

    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: appointment.patient.user.id,
        type: 'SURVEY_REQUEST',
      },
    });

    if (!existingNotification) {
      await prisma.notification.create({
        data: {
          userId: appointment.patient.user.id,
          type: 'SURVEY_REQUEST',
          title: 'How was your session?',
          message: 'Please rate your recent physiotherapy session',
          link: '/my-records',
        },
      });

      notified++;
    }
  }

  return {
    appointmentsChecked: appointments.length,
    notificationsSent: notified,
  };
}

// ─── Job Handler Registry ────────────────────────────────────────────────────

const jobHandlers: Record<string, () => Promise<unknown>> = {
  [JOB_TYPES.REMINDER_24H]: handleReminder24h,
  [JOB_TYPES.REMINDER_2H]: handleReminder2h,
  [JOB_TYPES.FOLLOW_UP_CHECK]: handleFollowUpCheck,
  [JOB_TYPES.CHURN_CHECK]: handleChurnCheck,
  [JOB_TYPES.WEEKLY_REPORT]: handleWeeklyReport,
  [JOB_TYPES.SURVEY_REMINDER]: handleSurveyReminder,
};

// ─── Run Job ─────────────────────────────────────────────────────────────────

export async function runJob(type: string) {
  const handler = jobHandlers[type];

  if (!handler) {
    throw new Error(`Unknown job type: ${type}`);
  }

  const startedAt = new Date();

  try {
    const result = await handler();

    const completedAt = new Date();

    return {
      type,
      success: true,
      result,
      startedAt,
      completedAt,
    };
  } catch (error) {
    const completedAt = new Date();

    console.error(`[Job] ${type} failed:`, error);

    return {
      type,
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown job error',
      startedAt,
      completedAt,
    };
  }
}

// ─── Recurring Job Scheduler ─────────────────────────────────────────────────

let schedulerStarted = false;

async function scheduleRecurringJobs() {
  const recurringJobs = [
    {
      type: JOB_TYPES.REMINDER_24H,
      intervalHours: 6,
    },
    {
      type: JOB_TYPES.REMINDER_2H,
      intervalHours: 1,
    },
    {
      type: JOB_TYPES.FOLLOW_UP_CHECK,
      intervalHours: 24,
    },
    {
      type: JOB_TYPES.CHURN_CHECK,
      intervalHours: 24,
    },
    {
      type: JOB_TYPES.WEEKLY_REPORT,
      intervalHours: 168, // 7 days
    },
    {
      type: JOB_TYPES.SURVEY_REMINDER,
      intervalHours: 12,
    },
    { type: JOB_TYPES.INVENTORY_CHECK, intervalHours: 24 },
{ type: JOB_TYPES.MAINTENANCE_CHECK, intervalHours: 24 },
  ];

  for (const recurringJob of recurringJobs) {
    const intervalMs = recurringJob.intervalHours * 60 * 60 * 1000;

    // Run once on startup.
    await runJob(recurringJob.type);

    // Continue running at the configured interval.
    setInterval(() => {
      runJob(recurringJob.type).catch((error) => {
        console.error(
          `[Job Scheduler] ${recurringJob.type} failed:`,
          error,
        );
      });
    }, intervalMs);
  }
}

// ─── Scheduler Startup ───────────────────────────────────────────────────────

export function startJobScheduler() {
  if (schedulerStarted) {
    console.log('[Job Scheduler] Already started.');
    return;
  }

  schedulerStarted = true;

  console.log('[Job Scheduler] Starting recurring jobs...');

  scheduleRecurringJobs().catch((error) => {
    console.error('[Job Scheduler] Failed to initialize:', error);
  });
}

export function stopJobScheduler() {
  console.log('[Job Scheduler] Stopping recurring jobs...');
  // Add actual clearInterval logic here if needed
}

// ─── Notification Emitter Integration ───────────────────────────────────────

notificationEmitter.on('job:run', async (type: string) => {
  try {
    await runJob(type);
  } catch (error) {
    console.error(`[Job Scheduler] Event job ${type} failed:`, error);
  }
});

