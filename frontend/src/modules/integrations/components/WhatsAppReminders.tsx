import React, { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { whatsappService } from '../services/whatsapp.service';

const WhatsAppReminders: React.FC = () => {
  const [pendingReminders, setPendingReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingReminders();
  }, []);

  const loadPendingReminders = async () => {
    setLoading(true);
    try {
      const response = await whatsappService.getPendingReminders();
      setPendingReminders(response);
    } catch (error) {
      console.error('Failed to load pending reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (appointmentId: string) => {
    try {
      // Generate WhatsApp link
      const { link, message } = await whatsappService.generateReminderLink(appointmentId);
      
      // Open WhatsApp in new tab
      window.open(link, '_blank');
      
      // Log the reminder as sent
      await whatsappService.logReminderSent({
        appointmentId,
        messageContent: message,
      });
      
      // Refresh the list
      loadPendingReminders();
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          تذكيرات واتساب المعلقة
        </h2>
        <button
          onClick={loadPendingReminders}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
        >
          تحديث
        </button>
      </div>

      {pendingReminders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">لا توجد تذكيرات معلقة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingReminders.map((reminder) => (
            <div key={reminder.patient.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 ml-2" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {reminder.patient.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {reminder.patient.phone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    {reminder.appointments.map((appointment: any) => (
                      <div key={appointment.id} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CalendarIcon className="h-4 w-4 text-gray-400 ml-2" />
                        <span>
                          {new Date(appointment.dateTime).toLocaleString('ar-EG')}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{appointment.therapist?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => handleSendReminder(reminder.appointments[0].id)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 ml-1" />
                  إرسال تذكير
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WhatsAppReminders;
