import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getReminders, sendReminder } from '../services/whatsapp.service.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.use(requireAuth);

// List pending reminders for upcoming appointments
const listRemindersHandler = async (_req: any, res: any) => {
  try {
    const reminders = await getReminders();
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

router.get('/reminders', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), listRemindersHandler);
router.get('/pending-reminders', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), listRemindersHandler);

// Send simulated reminder
const sendReminderHandler = async (req: any, res: any) => {
  try {
    const { appointmentId, message, messageContent } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: 'appointmentId is required' });
    }
    const result = await sendReminder(appointmentId, message || messageContent, req.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send simulated reminder' });
  }
};

router.post('/send', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), sendReminderHandler);
router.post('/log-sent', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), sendReminderHandler);

// Generate WhatsApp deep link for manual redirection
router.get('/appointment/:id/reminder-link', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), async (req, res) => {
  const { id } = req.params;
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true },
    });

    const phone = appointment?.patient?.phone ? appointment.patient.phone.replace(/[^0-9]/g, '') : '';
    const message = `مرحباً ${appointment?.patient?.name || ''}، نود تذكيركم بموعدكم القادم في مركز العلاج الطبيعي.`;
    const encoded = encodeURIComponent(message);
    const link = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;

    res.json({ link, message });
  } catch {
    const message = `مرحباً، نود تذكيركم بموعدكم القادم في المركز.`;
    res.json({ link: `https://wa.me/?text=${encodeURIComponent(message)}`, message });
  }
});

router.get('/appointment/:id/payment-reminder-link', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), async (req, res) => {
  const { id } = req.params;
  const message = `مرحباً، نود تذكيركم بسداد المستحقات المتبقية للفاتورة الخاصة بالموعد #${id}. شكراً لتعاونكم.`;
  const link = `https://wa.me/?text=${encodeURIComponent(message)}`;
  res.json({ link, message });
});

router.get('/appointment/:id/history', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), async (req, res) => {
  const { id } = req.params;
  try {
    const logs = await prisma.whatsAppReminderLog.findMany({
      where: { appointmentId: id },
      orderBy: { sentAt: 'desc' },
      take: 10,
    });
    if (logs.length > 0) {
      return res.json(logs);
    }
  } catch {
    // fallback
  }

  res.json([
    {
      id: 'sim-log-1',
      appointmentId: id,
      sentAt: new Date().toISOString(),
      type: 'APPOINTMENT_REMINDER',
      status: 'SENT (Simulated)',
    },
  ]);
});

export default router;
