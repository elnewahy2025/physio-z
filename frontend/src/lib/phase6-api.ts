import api from './api';
export const phase6Api = {
  getReminders: () => api.get('/phase6/whatsapp/reminders'),
  getInvoices: () => api.get('/phase6/payments/invoices'),
  getExercises: () => api.get('/phase6/exercises'),
  generateMeeting: (id: string) => api.post(/phase6/video/\/generate)
};
