import React, { useState, useEffect } from 'react';
import { demandForecastingService } from '../services/demand-forecasting.service';

const DemandForecastDashboard: React.FC = () => {
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
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      VERY_HIGH: 'bg-red-100 text-red-800',
    };
    
    return colors[intensity] || colors.LOW;
  };

  const getDayName = (dayOfWeek: number) => {
    const names = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return names[dayOfWeek] || '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUpIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="mr-5">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">متوسط الطلب اليومي</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {forecast?.summary?.averageDailyDemand?.toFixed(1) || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="mr-5">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">يوم الذروة</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {forecast?.summary?.peakDay ? 
                    new Date(forecast.summary.peakDay).toLocaleDateString('ar-EG') : 
                    'لا يوجد'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingDownIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="mr-5">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">أقل يوم طلباً</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {forecast?.summary?.lowDay ? 
                    new Date(forecast.summary.lowDay).toLocaleDateString('ar-EG') : 
                    'لا يوجد'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="mr-5">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">الاتجاه العام</p>
                <p className={`text-lg font-semibold ${
                  forecast?.summary?.trend > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {forecast?.summary?.trend > 0 ? '+' : ''}
                  {((forecast?.summary?.trend || 0) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">خريطة حرارة الطلب</h3>
          <div className="flex items-center space-x-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {new Date(2024, month - 1, 1).toLocaleDateString('ar-EG', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
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
            {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarData.calendar.map((day: any, index: number) => (
              <div
                key={index}
                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-center text-sm
                  ${day.appointments === 0 ? 'bg-gray-100 text-gray-400' : getIntensityColor(day.intensity)}
                  ${day.isWeekend ? 'ring-2 ring-blue-200' : ''}
                `}
              >
                <span className="font-medium">{day.date.getDate()}</span>
                {day.appointments > 0 && (
                  <span className="text-xs mt-1">{day.appointments}</span>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Legend */}
        <div className="mt-6 flex items-center justify-center space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">منخفض (0-2)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 rounded mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">متوسط (3-5)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-100 rounded mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">عالي (6-10)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">مرتفع جداً (10+)</span>
          </div>
        </div>
      </div>

      {/* Weekly Patterns */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">أنماط الطلب الأسبوعية</h3>
        <div className="grid grid-cols-7 gap-4">
          {weeklyPatterns.map((pattern) => (
            <div key={pattern.dayOfWeek} className="text-center">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {pattern.dayName}
                </p>
                <p className="text-2xl font-bold text-primary-600">
                  {pattern.averageAppointments.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  مواعيد/أسبوع
                </p>
                {pattern.isWeekend && (
                  <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    نهاية الأسبوع
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 30-Day Forecast */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">توقعات الطلب (30 يوم)</h3>
        <div className="space-y-2">
          {forecast?.forecast?.slice(0, 14).map((day: any) => (
            <div key={day.date.toISOString()} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-16 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(day.date).toLocaleDateString('ar-EG', { weekday: 'short' })}
                </div>
                <div className="w-24 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {new Date(day.date).toLocaleDateString('ar-EG')}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((day.predictedAppointments / 10) * 100, 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-12">
                  {day.predictedAppointments}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 w-12">
                  {day.confidence}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DemandForecastDashboard;
