import api from '../../../lib/api';

export const demandForecastingService = {
  async getDemandForecast(days?: number) {
    const response = await api.get('/intelligence/demand-forecasting', {
      params: days ? { days } : {},
    });
    return response.data;
  },

  async getCalendarHeatmap(year?: number, month?: number) {
    const response = await api.get('/intelligence/demand-forecasting/calendar', {
      params: {
        year: year || new Date().getFullYear(),
        month: month || new Date().getMonth() + 1,
      },
    });
    return response.data;
  },

  async getWeeklyPatterns() {
    const response = await api.get('/intelligence/demand-forecasting/weekly-patterns');
    return response.data;
  },
};
