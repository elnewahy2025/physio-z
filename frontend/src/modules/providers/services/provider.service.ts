import api from '../../../lib/api';

export const providerService = {
  // Get all providers
  async getAllProviders(type?: string) {
    const response = await api.get('/providers', {
      params: type ? { type } : {},
    });
    return response.data;
  },

  // Get single provider
  async getProvider(providerId: string) {
    const response = await api.get(`/providers/${providerId}`);
    return response.data;
  },

  // Create provider from template
  async createFromTemplate(templateId: string, config: {
    name: string;
    credentials: Record<string, string>;
    isDefault?: boolean;
    priority?: number;
  }) {
    const response = await api.post('/providers/from-template', {
      templateId,
      ...config,
    });
    return response.data;
  },

  // Create custom provider
  async createProvider(data: any) {
    const response = await api.post('/providers', data);
    return response.data;
  },

  // Update provider
  async updateProvider(providerId: string, data: any) {
    const response = await api.put(`/providers/${providerId}`, data);
    return response.data;
  },

  // Delete provider (deactivate)
  async deleteProvider(providerId: string) {
    const response = await api.delete(`/providers/${providerId}`);
    return response.data;
  },

  // Test provider connection
  async testProvider(providerId: string) {
    const response = await api.post(`/providers/${providerId}/test`);
    return response.data;
  },

  // Get provider statistics
  async getProviderStats(providerId: string) {
    const response = await api.get(`/providers/${providerId}/stats`);
    return response.data;
  },

  // Get available templates
  async getTemplates() {
    const response = await api.get('/provider-templates');
    return response.data;
  },

  // Get specific template
  async getTemplate(templateId: string) {
    const response = await api.get(`/provider-templates/${templateId}`);
    return response.data;
  },
};
