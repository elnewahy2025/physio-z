import api from '../../../services/api';

export const paymentService = {
  async createMyFawryReference(invoiceId: string) {
    const response = await api.post(`/integrations/payments/myfawry/create/${invoiceId}`);
    return response.data;
  },

  async createInstapayPayment(invoiceId: string) {
    const response = await api.post(`/integrations/payments/instapay/create/${invoiceId}`);
    return response.data;
  },

  async confirmPayment(referenceId: string, notes?: string) {
    const response = await api.post(`/integrations/payments/confirm/${referenceId}`, {
      notes,
    });
    return response.data;
  },

  async getInvoicePaymentReferences(invoiceId: string) {
    const response = await api.get(`/integrations/payments/invoice/${invoiceId}`);
    return response.data;
  },

  async getPendingPayments() {
    const response = await api.get('/integrations/payments/pending');
    return response.data;
  },
};
