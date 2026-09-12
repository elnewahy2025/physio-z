import api from '../../../lib/api';

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  provider: string; // 'fawry', 'instapay', 'stripe', 'paypal', 'custom', etc.
  isActive: boolean;
  config: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export const paymentService = {
  async getGateways(): Promise<PaymentGatewayConfig[]> {
    const response = await api.get('/integrations/payments/gateways');
    return response.data;
  },

  async createGateway(data: Partial<PaymentGatewayConfig>): Promise<PaymentGatewayConfig> {
    const response = await api.post('/integrations/payments/gateways', data);
    return response.data;
  },

  async updateGateway(id: string, data: Partial<PaymentGatewayConfig>): Promise<PaymentGatewayConfig> {
    const response = await api.put(`/integrations/payments/gateways/${id}`, data);
    return response.data;
  },

  async deleteGateway(id: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/integrations/payments/gateways/${id}`);
    return response.data;
  },

  async toggleGateway(id: string): Promise<PaymentGatewayConfig> {
    const response = await api.patch(`/integrations/payments/gateways/${id}/toggle`);
    return response.data;
  },

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
