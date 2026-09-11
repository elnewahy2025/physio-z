import api from '../../../services/api';

export const whatsappService = {
  async getPendingReminders() {
    const response = await api.get('/integrations/whatsapp/pending-reminders');
    return response.data;
  },

  async generateReminderLink(appointmentId: string) {
    const response = await api.get(`/integrations/whatsapp/appointment/${appointmentId}/reminder-link`);
    return response.data;
  },

  async generatePaymentReminderLink(appointmentId: string) {
    const response = await api.get(`/integrations/whatsapp/appointment/${appointmentId}/payment-reminder-link`);
    return response.data;
  },

  async logReminderSent(data: {
    appointmentId: string;
    messageContent: string;
    status?: string;
  }) {
    const response = await api.post('/integrations/whatsapp/log-sent', data);
    return response.data;
  },

  async getReminderHistory(appointmentId: string) {
    const response = await api.get(`/integrations/whatsapp/appointment/${appointmentId}/history`);
    return response.data;
  },
};
