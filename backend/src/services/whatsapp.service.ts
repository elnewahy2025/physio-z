import { prisma } from '../lib/prisma.js';

export const sendReminder = async (
  appointmentId: string,
  messageContent?: string,
  sentById?: string,
) => {
  console.log(`[WhatsApp Sandbox] ----------------------------------------`);
  console.log(`[WhatsApp Sandbox] Sending simulated WhatsApp message for appointment: ${appointmentId}`);

  let appointment = null;
  try {
    appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        therapist: true,
      },
    });
  } catch (err) {
    console.warn(`[WhatsApp Sandbox] Could not query appointment ${appointmentId}:`, err);
  }

  const patientName = appointment?.patient?.name || 'العميل';
  const patientPhone = appointment?.patient?.phone || 'غير مسجل';
  const apptDateStr = appointment?.dateTime
    ? new Date(appointment.dateTime).toLocaleString('ar-EG')
    : 'الموعد المحدد';

  const defaultMsg = `مرحباً ${patientName}، نود تذكيركم بموعدكم القادم في مركز فيزيو بتاريخ ${apptDateStr}.`;
  const finalMessage = messageContent || defaultMsg;

  console.log(`[WhatsApp Sandbox] Recipient: ${patientName} (${patientPhone})`);
  console.log(`[WhatsApp Sandbox] Message: "${finalMessage}"`);
  console.log(`[WhatsApp Sandbox] Status: SIMULATED_DELIVERY_SUCCESS`);
  console.log(`[WhatsApp Sandbox] ----------------------------------------`);

  // Write a record to Notification table so it appears in the system audit & notifications
  try {
    const targetUserId = appointment?.patient?.userId || appointment?.therapistId || sentById;
    if (targetUserId) {
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: 'تذكير بالموعد (واتساب - محاكاة)',
          message: `تم إرسال تذكير واتساب تجريبي للمريض ${patientName} (${patientPhone}) بنجاح.`,
          type: 'APPOINTMENT_REMINDER',
          link: '/appointments',
        },
      });
    }
  } catch (notifErr) {
    console.warn('[WhatsApp Sandbox] Could not create notification record:', notifErr);
  }

  // Also log to WhatsAppReminderLog if possible
  if (appointment && sentById) {
    try {
      await prisma.whatsAppReminderLog.create({
        data: {
          appointmentId: appointment.id,
          sentById: sentById,
          messageContent: finalMessage,
          status: 'SENT_MANUALLY',
        },
      });
    } catch (logErr) {
      // ignore if staff relation mismatch
    }
  }

  return {
    success: true,
    message: 'WhatsApp reminder sent (Simulation)',
    simulatedData: {
      recipient: patientPhone,
      patientName,
      sentAt: new Date().toISOString(),
      content: finalMessage,
    },
  };
};

export const getReminders = async () => {
  try {
    const upcoming = await prisma.appointment.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        dateTime: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
      },
      include: {
        patient: true,
        therapist: true,
      },
      orderBy: { dateTime: 'asc' },
      take: 30,
    });

    if (upcoming.length > 0) {
      // Group by patient
      const groupedMap = new Map<string, { patient: any; appointments: any[] }>();
      for (const app of upcoming) {
        if (!groupedMap.has(app.patientId)) {
          groupedMap.set(app.patientId, {
            patient: {
              id: app.patient.id,
              name: app.patient.name,
              phone: app.patient.phone || '+201000000000',
            },
            appointments: [],
          });
        }
        groupedMap.get(app.patientId)!.appointments.push({
          id: app.id,
          dateTime: app.dateTime,
          status: app.status,
          videoLink: app.videoLink,
          therapist: {
            name: app.therapist?.name || 'Physiotherapist',
          },
        });
      }
      return Array.from(groupedMap.values());
    }
  } catch (e) {
    console.warn('[WhatsApp] Error fetching real appointments, falling back to mock data:', e);
  }

  // Return fallback formatted mock pending reminders for the sandbox UI
  return [
    {
      patient: {
        id: 'pat-1',
        name: 'أحمد علي',
        phone: '+201001234567',
      },
      appointments: [
        {
          id: 'app-1',
          dateTime: new Date(Date.now() + 3600000).toISOString(),
          status: 'CONFIRMED',
          therapist: { name: 'د. محمد حسن' },
        },
      ],
    },
    {
      patient: {
        id: 'pat-2',
        name: 'سارة أحمد',
        phone: '+201109876543',
      },
      appointments: [
        {
          id: 'app-2',
          dateTime: new Date(Date.now() + 86400000).toISOString(),
          status: 'PENDING',
          therapist: { name: 'د. فاطمة الزهراء' },
        },
      ],
    },
  ];
};
