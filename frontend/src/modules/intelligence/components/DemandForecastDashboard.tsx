import React, { useState, useEffect } from 'react';
import { demandForecastingService } from '../services/demand-forecasting.service';
import { ArrowTrendingUpIcon as TrendingUpIcon, CalendarIcon, ArrowTrendingDownIcon as TrendingDownIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useI18n } from '../../../i18n';

const DemandForecastDashboard: React.FC = () => {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const L = (ar: string, en: string) => (isRTL ? ar : en);

  const [forecast, setForecast] = useState<any>(null);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [weeklyPatterns, setWeeklyPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    loadCalendarData();
  }, [selectedMonth, selectedYear]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [forecastData, patterns] = await Promise.all([
        demandForecastingService.getDemandForecast(30),
        demandForecastingService.getWeeklyPatterns(),
      ]);
      
      setForecast(forecastData);
      setWeeklyPatterns(patterns);
    } catch (error) {
      console.error('Failed to load demand forecast data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarData = async () => {
    try {
      const calendar = await demandForecastingService.getCalendarHeatmap(
        selectedYear,
        selectedMonth
      );
      setCalendarData(calendar);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    }
  };

  const getIntensityColor = (intensity: string) => {
    const colors = {
      LOW: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
      MEDIUM: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
      HIGH: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300',
      VERY_HIGH: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
    };
    
    return colors[intensity as keyof typeof colors] || colors.LOW;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const daysOfWeek = isRTL
    ? ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
    : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {L('توقعات الطلب على المواعيد والعيادات', 'Demand & Appointment Forecasting')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {L('تحليلات ذكية وتنبؤات مبنية على البيانات التاريخية لتوزيع المواعيد والموارد', 'Predictive analytics based on historical visit trends to optimize clinic capacity')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-blue-500">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('المتوسط اليومي المتوقع', 'Predicted Daily Avg')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {forecast?.summary?.averageDailyDemand?.toFixed(1) || 0} {L('موعد', 'appts')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-green-500">
              <TrendingUpIcon className="h-6 w-6" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('يوم ذروة الطلب', 'Peak Demand Day')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {forecast?.summary?.peakDay ? 
                  new Date(forecast.summary.peakDay).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US') : 
                  L('غير محدد', 'N/A')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-yellow-500">
              <TrendingDownIcon className="h-6 w-6" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('يوم أقل طلب', 'Lowest Demand Day')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {forecast?.summary?.lowDay ? 
                  new Date(forecast.summary.lowDay).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US') : 
                  L('غير محدد', 'N/A')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-purple-500">
              <ChartBarIcon className="h-6 w-6" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('الاتجاه العام للطلب', 'Demand Trend')}
              </p>
              <p className={`text-lg font-bold ${
                forecast?.summary?.trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {forecast?.summary?.trend > 0 ? '+' : ''}
                {((forecast?.summary?.trend || 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {L('خريطة حرارة الطلب والمواعيد المتوقعة', 'Monthly Demand Heatmap')}
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-xs p-2"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {new Date(2024, month - 1, 1).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-xs p-2"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {calendarData?.calendar && (
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-1">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarData.calendar.map((day: any, index: number) => (
              <div
                key={index}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition
                  ${day.appointments === 0 ? 'bg-gray-100 dark:bg-gray-900 text-gray-400' : getIntensityColor(day.intensity)}
                  ${day.isWeekend ? 'ring-1 ring-blue-300 dark:ring-blue-700' : ''}
                `}
              >
                <span>{new Date(day.date).getDate()}</span>
                {day.appointments > 0 && (
                  <span className="text-[10px] opacity-80 mt-0.5">{day.appointments}</span>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-green-100 dark:bg-green-900/60 rounded"></div>
            <span>{L('منخفض (0-2)', 'Low (0-2)')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-yellow-100 dark:bg-yellow-900/60 rounded"></div>
            <span>{L('متوسط (3-5)', 'Medium (3-5)')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-orange-100 dark:bg-orange-900/60 rounded"></div>
            <span>{L('عالي (6-10)', 'High (6-10)')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-red-100 dark:bg-red-900/60 rounded"></div>
            <span>{L('ذروة (11+)', 'Very High (11+)')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemandForecastDashboard;
