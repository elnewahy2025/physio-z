// frontend/src/lib/intelligence-api.ts
// Phase 5: Intelligence - API service

import api from './api.js';

// ============================================================
// I1: NO-SHOW PREDICTION
// ============================================================

export const noShowPredictionApi = {
  predictRisk: async (appointmentId: string) => {
    const response = await api.get(`/intelligence/no-show-prediction/appointment/${appointmentId}`);
    return response.data;
  },

  getPatientRiskProfile: async (patientId: string) => {
    const response = await api.get(`/intelligence/no-show-prediction/patient/${patientId}`);
    return response.data;
  },

  getUpcomingAppointmentsRisk: async () => {
    const response = await api.get('/intelligence/no-show-prediction/upcoming');
    return response.data;
  },

  getStatistics: async (days?: number) => {
    const response = await api.get('/intelligence/no-show-prediction/statistics', {
      params: days ? { days } : {},
    });
    return response.data;
  },
};

// ============================================================
// I2: DEMAND FORECASTING
// ============================================================

export const demandForecastingApi = {
  getForecast: async (days?: number) => {
    const response = await api.get('/intelligence/demand-forecasting', {
      params: days ? { days } : {},
    });
    return response.data;
  },

  getCalendarHeatmap: async (year?: number, month?: number) => {
    const response = await api.get('/intelligence/demand-forecasting/calendar', {
      params: {
        year: year || new Date().getFullYear(),
        month: month || new Date().getMonth() + 1,
      },
    });
    return response.data;
  },

  getWeeklyPatterns: async () => {
    const response = await api.get('/intelligence/demand-forecasting/weekly-patterns');
    return response.data;
  },

  getHourlyDistribution: async () => {
    const response = await api.get('/intelligence/demand-forecasting/hourly-distribution');
    return response.data;
  },

  getMonthlyComparison: async (months?: number) => {
    const response = await api.get('/intelligence/demand-forecasting/monthly-comparison', {
      params: months ? { months } : {},
    });
    return response.data;
  },
};

// ============================================================
// I3: TREATMENT EFFECTIVENESS
// ============================================================

export const treatmentEffectivenessApi = {
  getEffectiveness: async (filters?: {
    diagnosis?: string;
    therapistId?: string;
    dateFrom?: string;
    dateTo?: string;
    minSessions?: number;
  }) => {
    const response = await api.get('/intelligence/treatment-effectiveness', {
      params: filters || {},
    });
    return response.data;
  },

  getTherapistEffectiveness: async (therapistId: string) => {
    const response = await api.get(`/intelligence/treatment-effectiveness/therapist/${therapistId}`);
    return response.data;
  },

  getTreatmentTrends: async (months?: number) => {
    const response = await api.get('/intelligence/treatment-effectiveness/trends', {
      params: months ? { months } : {},
    });
    return response.data;
  },
};
