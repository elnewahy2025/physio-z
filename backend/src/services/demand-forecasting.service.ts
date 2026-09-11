// backend/src/services/demand-forecasting.service.ts
// I2: Demand Forecasting - Predict busy/slow periods

import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

/**
 * Get demand forecast for specified number of days
 */
export async function getDemandForecast(days: number = 30) {
  const today = new Date();
  const forecastEndDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

  // Get historical data for the past 90 days
  const historicalStartDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  const historicalAppointments = await prisma.appointment.findMany({
    where: {
      dateTime: {
        gte: historicalStartDate,
        lte: today,
      },
      status: {
        in: ['COMPLETED', 'CONFIRMED', 'PENDING'],
      },
    },
    select: {
      dateTime: true,
      duration: true,
    },
  });

  // Group by date
  const dailyDemand = new Map<string, number>();
  
  for (const appointment of historicalAppointments) {
    const dateKey = appointment.dateTime.toISOString().split('T')[0];
    dailyDemand.set(dateKey, (dailyDemand.get(dateKey) || 0) + 1);
  }

  // Generate forecast
  const forecast = [];
  const currentDate = new Date(today);
  
  for (let i = 0; i < days; i++) {
    const dateKey = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.getDay();
    
    // Use different weights for different days of week
    const dayWeight = getDayWeight(dayOfWeek);
    
    // Get historical average for this day of week
    const historicalAvg = getHistoricalAverageForDay(
      dailyDemand,
      dayOfWeek,
      currentDate
    );
    
    // Apply trend
    const trend = calculateTrend(dailyDemand);
    
    // Combine factors
    const predictedDemand = Math.max(
      0,
      Math.round(historicalAvg * dayWeight * (1 + trend))
    );
    
    forecast.push({
      date: new Date(currentDate),
      predictedAppointments: predictedDemand,
      confidence: calculateConfidence(dailyDemand, dayOfWeek),
      dayOfWeek,
      isWeekend: dayOfWeek === 5 || dayOfWeek === 6, // Friday/Saturday in Egypt
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    forecast,
    historical: Array.from(dailyDemand.entries()).map(([date, count]) => ({
      date: new Date(date),
      appointments: count,
    })),
    summary: {
      averageDailyDemand: calculateAverage(dailyDemand),
      peakDay: getPeakDay(dailyDemand),
      lowDay: getLowDay(dailyDemand),
      trend: calculateTrend(dailyDemand),
      totalHistoricalDays: dailyDemand.size,
    },
  };
}

/**
 * Get calendar heatmap data for a specific month
 */
export async function getCalendarHeatmap(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const appointments = await prisma.appointment.findMany({
    where: {
      dateTime: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ['COMPLETED', 'CONFIRMED', 'PENDING'],
      },
    },
    select: {
      dateTime: true,
    },
  });

  // Group by date
  const dailyCount = new Map<string, number>();
  
  for (const appointment of appointments) {
    const dateKey = appointment.dateTime.toISOString().split('T')[0];
    dailyCount.set(dateKey, (dailyCount.get(dateKey) || 0) + 1);
  }

  // Generate calendar data
  const calendarData = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    const count = dailyCount.get(dateKey) || 0;
    
    calendarData.push({
      date: new Date(currentDate),
      appointments: count,
      intensity: getIntensity(count),
      dayOfWeek: currentDate.getDay(),
      isWeekend: currentDate.getDay() === 5 || currentDate.getDay() === 6,
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    year,
    month,
    calendar: calendarData,
    maxAppointments: Math.max(...Array.from(dailyCount.values(), 0)),
    averageAppointments: calculateAverage(dailyCount),
  };
}

/**
 * Get weekly patterns analysis
 */
export async function getWeeklyPatterns() {
  const appointments = await prisma.appointment.findMany({
    where: {
      dateTime: {
        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
      status: {
        in: ['COMPLETED', 'CONFIRMED', 'PENDING'],
      },
    },
    select: {
      dateTime: true,
    },
  });

  // Group by day of week and hour
  const patterns: Record<number, { count: number; totalHour: number }> = {};
  
  for (const appointment of appointments) {
    const dayOfWeek = appointment.dateTime.getDay();
    const hour = appointment.dateTime.getHours();
    
    if (!patterns[dayOfWeek]) {
      patterns[dayOfWeek] = { count: 0, totalHour: 0 };
    }
    
    patterns[dayOfWeek].count++;
    patterns[dayOfWeek].totalHour += hour;
  }

  const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  return Object.entries(patterns)
    .map(([day, data]) => ({
      dayOfWeek: parseInt(day),
      dayName: dayNames[parseInt(day)],
      averageAppointments: data.count / 13, // Average over ~13 weeks
      averageHour: data.count > 0 ? data.totalHour / data.count : 0,
      isWeekend: parseInt(day) === 5 || parseInt(day) === 6,
    }))
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

/**
 * Get hourly distribution
 */
export async function getHourlyDistribution() {
  const appointments = await prisma.appointment.findMany({
    where: {
      dateTime: {
        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
      status: {
        in: ['COMPLETED', 'CONFIRMED', 'PENDING'],
      },
    },
    select: {
      dateTime: true,
    },
  });

  // Group by hour
  const hourlyCount: Record<number, number> = {};
  
  for (const appointment of appointments) {
    const hour = appointment.dateTime.getHours();
    hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
  }

  // Fill in missing hours with 0
  const distribution = [];
  for (let hour = 0; hour < 24; hour++) {
    distribution.push({
      hour,
      count: hourlyCount[hour] || 0,
      label: `${hour}:00 - ${hour + 1}:00`,
    });
  }

  return distribution;
}

/**
 * Get monthly comparison
 */
export async function getMonthlyComparison(months: number = 6) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const appointments = await prisma.appointment.findMany({
    where: {
      dateTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      dateTime: true,
      status: true,
    },
  });

  // Group by month
  const monthlyData = new Map<string, { total: number; completed: number; cancelled: number; noShow: number }>();
  
  for (const appointment of appointments) {
    const monthKey = `${appointment.dateTime.getFullYear()}-${String(appointment.dateTime.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { total: 0, completed: 0, cancelled: 0, noShow: 0 });
    }
    
    const month = monthlyData.get(monthKey)!;
    month.total++;
    
    if (appointment.status === 'COMPLETED') month.completed++;
    else if (appointment.status === 'CANCELLED') month.cancelled++;
    else if (appointment.status === 'NO_SHOW') month.noShow++;
  }

  return Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      ...data,
      completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Private helper functions
 */

function getDayWeight(dayOfWeek: number): number {
  // Higher weight for weekdays, lower for weekends (Egypt: Friday/Saturday weekend)
  const weights = [0.9, 1.2, 1.1, 1.0, 1.1, 0.7, 0.8]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
  return weights[dayOfWeek] || 1.0;
}

function getHistoricalAverageForDay(
  dailyDemand: Map<string, number>,
  dayOfWeek: number,
  currentDate: Date
): number {
  const sameDayCounts: number[] = [];
  
  // Look back 8 weeks for same day of week
  for (let week = 1; week <= 8; week++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() - week * 7);
    
    const dateKey = checkDate.toISOString().split('T')[0];
    const count = dailyDemand.get(dateKey);
    
    if (count !== undefined) {
      sameDayCounts.push(count);
    }
  }
  
  if (sameDayCounts.length === 0) return 0;
  
  return sameDayCounts.reduce((sum, count) => sum + count, 0) / sameDayCounts.length;
}

function calculateTrend(dailyDemand: Map<string, number>): number {
  const dates = Array.from(dailyDemand.keys()).sort();
  if (dates.length < 2) return 0;
  
  const firstHalf = dates.slice(0, Math.floor(dates.length / 2));
  const secondHalf = dates.slice(Math.floor(dates.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, date) => sum + (dailyDemand.get(date) || 0), 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, date) => sum + (dailyDemand.get(date) || 0), 0) / secondHalf.length;
  
  if (firstAvg === 0) return 0;
  
  return (secondAvg - firstAvg) / firstAvg;
}

function calculateConfidence(dailyDemand: Map<string, number>, dayOfWeek: number): number {
  // Calculate variance for this day of week to determine confidence
  const counts = Array.from(dailyDemand.values());
  if (counts.length === 0) return 50;
  
  const mean = counts.reduce((sum, count) => sum + count, 0) / counts.length;
  const squaredDiffs = counts.map(count => Math.pow(count - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / counts.length;
  
  // Lower variance = higher confidence
  const confidence = Math.max(0, 1 - (Math.sqrt(variance) / (mean || 1)));
  return Math.round(confidence * 100);
}

function calculateAverage(dailyDemand: Map<string, number>): number {
  const values = Array.from(dailyDemand.values());
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function getPeakDay(dailyDemand: Map<string, number>): string | null {
  let maxDate = '';
  let maxCount = 0;
  
  for (const [date, count] of dailyDemand) {
    if (count > maxCount) {
      maxCount = count;
      maxDate = date;
    }
  }
  
  return maxDate || null;
}

function getLowDay(dailyDemand: Map<string, number>): string | null {
  let minDate = '';
  let minCount = Infinity;
  
  for (const [date, count] of dailyDemand) {
    if (count < minCount) {
      minCount = count;
      minDate = date;
    }
  }
  
  return minDate || null;
}

function getIntensity(count: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
  if (count === 0) return 'LOW';
  if (count <= 2) return 'MEDIUM';
  if (count <= 5) return 'HIGH';
  return 'VERY_HIGH';
}
