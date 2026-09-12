import api from '../../../lib/api';

export const auditService = {
  async getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    entityType?: string;
    category?: string;
    severity?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await api.get('/audit/logs', { params: filters });
    return response.data;
  },

  async getAuditStatistics(dateFrom?: string, dateTo?: string) {
    const response = await api.get('/audit/logs/statistics', {
      params: { dateFrom, dateTo },
    });
    return response.data;
  },

  async getSecurityAlerts(days?: number) {
    const response = await api.get('/audit/logs/security-alerts', {
      params: { days },
    });
    return response.data;
  },

  async exportAuditLogs(filters?: any) {
    const response = await api.post('/audit/logs/export', filters || {}, {
      responseType: 'blob',
    });
    return response.data;
  },
};
