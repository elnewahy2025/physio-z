import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../settings/settings.service';

@Injectable()
export class WhatsAppService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  /**
   * Generate WhatsApp link with pre-filled message
   */
  generateWhatsAppLink(phoneNumber: string, message: string): string {
    // Remove any non-digit characters from phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Ensure country code is included (default to Egypt +20 if not present)
    let formattedPhone = cleanPhone;
    if (!cleanPhone.startsWith('20') && cleanPhone.length === 10) {
      formattedPhone = '20' + cleanPhone; // Egypt country code
    }
    
    // URL encode the message
    const encodedMessage = encodeURIComponent(message);
    
    // Return wa.me link
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  }

  /**
   * Generate appointment reminder message
   */
  generateAppointmentReminder(appointment: any): string {
    const settings = await this.getSettings();
    const template = settings?.whatsappMessageTemplate || 
      "مرحباً {patientName}،\n\nتذكير بموعدك في {centerName}:\n\n📅 التاريخ: {date}\n🕐 الوقت: {time}\n📍 العنوان: {address}\n\nنتطلع لرؤيتك!";
    
    // Replace template variables
    let message = template
      .replace('{patientName}', appointment.patient?.name || 'المريض')
      .replace('{centerName}', settings?.centerName || 'مركز العلاج الطبيعي')
      .replace('{date}', new Date(appointment.dateTime).toLocaleDateString('ar-EG'))
      .replace('{time}', new Date(appointment.dateTime).toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
      }))
      .replace('{address}', settings?.address || 'العنوان غير متوفر');
    
    return message;
  }

  /**
   * Log WhatsApp reminder sent manually
   */
  async logReminderSent(
    appointmentId: string,
    sentById: string,
    messageContent: string,
    status: string = 'SENT_MANUALLY'
  ) {
    return this.prisma.whatsAppReminderLog.create({
      data: {
        appointmentId,
        sentById,
        messageContent,
        status,
      },
      include: {
        appointment: {
          include: {
            patient: true,
          },
        },
        sentBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get WhatsApp reminder history for an appointment
   */
  async getReminderHistory(appointmentId: string) {
    return this.prisma.whatsAppReminderLog.findMany({
      where: { appointmentId },
      include: {
        sentBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { sentAt: 'desc' },
    });
  }

  /**
   * Get pending reminders (appointments in next 24 hours)
   */
  async getPendingReminders() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const appointments = await this.prisma.appointment.findMany({
      where: {
        dateTime: {
          gte: now,
          lte: tomorrow,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        therapist: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { dateTime: 'asc' },
    });
    
    // Group by patient to avoid duplicate reminders
    const patientMap = new Map<string, any>();
    
    for (const appointment of appointments) {
      if (!patientMap.has(appointment.patient.id)) {
        patientMap.set(appointment.patient.id, {
          patient: appointment.patient,
          appointments: [],
        });
      }
      
      patientMap.get(appointment.patient.id).appointments.push(appointment);
    }
    
    return Array.from(patientMap.values());
  }

  /**
   * Generate payment reminder message
   */
  generatePaymentReminder(invoice: any): string {
    const settings = await this.getSettings();
    
    let message = `مرحباً ${invoice.patient?.name || 'المريض'},\n\n`;
    message += `تذكير بفاتورة غير مسددة:\n\n`;
    message += `🧾 رقم الفاتورة: ${invoice.number}\n`;
    message += `💰 المبلغ: ${invoice.total} ${settings?.currency || 'ج.م'}\n`;
    message += `📅 تاريخ الاستحقاق: ${new Date(invoice.dueDate).toLocaleDateString('ar-EG')}\n\n`;
    message += `يمكنك السداد عبر:\n`;
    message += `• فوري (MyFawry)\n`;
    message += `• انستاباي (Instapay)\n\n`;
    message += `شكراً لك!`;
    
    return message;
  }

  /**
   * Generate no-show warning message
   */
  generateNoShowWarning(appointment: any): string {
    let message = `مرحباً ${appointment.patient?.name || 'المريض'},\n\n`;
    message += `نلاحظ أنك لم تحضر موعدك في ${new Date(appointment.dateTime).toLocaleDateString('ar-EG')}\n\n`;
    message += `نأمل التواصل معنا لإعادة الجدولة.\n\n`;
    message += `شكراً لتفهمك!`;
    
    return message;
  }

  private async getSettings() {
    return this.prisma.settings.findFirst();
  }
}
