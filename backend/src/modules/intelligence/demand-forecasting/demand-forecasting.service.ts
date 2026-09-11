import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DemandForecastingService {
  constructor(private prisma: PrismaService) {}

  async getDemandForecast(days: number = 30) {
    const today = new Date();
    const forecastEndDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    // Get historical data for the past 90 days
    const historicalStartDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const historicalAppointments = await this.prisma.appointment.findMany({
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

    // Calculate moving averages
    const movingAverages = this.calculateMovingAverages(dailyDemand, 7);
    
    // Generate forecast
    const forecast = [];
    const currentDate = new Date(today);
    
    for (let i = 0; i < days; i++) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      
      // Use different weights for different days of week
      const dayWeight = this.getDayWeight(dayOfWeek);
      
      // Get historical average for this day of week
      const historicalAvg = this.getHistoricalAverageForDay(
        dailyDemand,
        dayOfWeek,
        currentDate,
      );
      
      // Apply trend
      const trend = this.calculateTrend(dailyDemand);
      
      // Combine factors
      const predictedDemand = Math.max(
        0,
        Math.round(historicalAvg * dayWeight * (1 + trend)),
      );
      
      forecast.push({
        date: new Date(currentDate),
        predictedAppointments: predictedDemand,
        confidence: this.calculateConfidence(dailyDemand, dayOfWeek),
        dayOfWeek,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
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
        averageDailyDemand: this.calculateAverage(dailyDemand),
        peakDay: this.getPeakDay(dailyDemand),
        lowDay: this.getLowDay(dailyDemand),
        trend: this.calculateTrend(dailyDemand),
      },
    };
  }

  async getCalendarHeatmap(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const appointments = await this.prisma.appointment.findMany({
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
        intensity: this.getIntensity(count),
        dayOfWeek: currentDate.getDay(),
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      year,
      month,
      calendar: calendarData,
      maxAppointments: Math.max(...Array.from(dailyCount.values(), 0)),
      minAppointments: Math.min(...Array.from(dailyCount.values(), 0)),
      averageAppointments: this.calculateAverage(dailyCount),
    };
  }

  async getWeeklyPatterns() {
    const appointments = await this.prisma.appointment.findMany({
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

    const dayPatterns = new Map<number, { count: number; total: number }>();
    
    for (const appointment of appointments) {
      const dayOfWeek = appointment.dateTime.getDay();
      const hour = appointment.dateTime.getHours();
      
      if (!dayPatterns.has(dayOfWeek)) {
        dayPatterns.set(dayOfWeek, { count: 0, total: 0 });
      }
      
      const pattern = dayPatterns.get(dayOfWeek);
      pattern.count++;
      pattern.total += hour;
    }

    const patterns = Array.from(dayPatterns.entries()).map(([day, data]) => ({
      dayOfWeek: day,
      dayName: this.getDayName(day),
      averageAppointments: data.count / 13, // Average over ~13 weeks
      averageHour: data.total / data.count,
      isWeekend: day === 0 || day === 6,
    }));

    return patterns.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }

  private calculateMovingAverages(dailyDemand: Map<string, number>, window: number): Map<string, number> {
    const movingAverages = new Map<string, number>();
    const dates = Array.from(dailyDemand.keys()).sort();
    
    for (let i = 0; i < dates.length; i++) {
      if (i >= window - 1) {
        const windowDates = dates.slice(i - window + 1, i + 1);
        const sum = windowDates.reduce((acc, date) => acc + dailyDemand.get(date), 0);
        movingAverages.set(dates[i], sum / window);
      }
    }
    
    return movingAverages;
  }

  private getDayWeight(dayOfWeek: number): number {
    // Higher weight for weekdays, lower for weekends
    const weights = [0.7, 1.2, 1.1, 1.0, 1.1, 1.2, 0.8]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
    return weights[dayOfWeek] || 1.0;
  }

  private getHistoricalAverageForDay(
    dailyDemand: Map<string, number>,
    dayOfWeek: number,
    currentDate: Date,
  ): number {
    const dayAppointments = [];
    
    for (const [date, count] of dailyDemand) {
      const dateObj = new Date(date);
      if (dateObj.getDay() === dayOfWeek && dateObj < currentDate) {
        dayAppointments.push(count);
      }
    }
    
    if (dayAppointments.length === 0) return 0;
    
    return dayAppointments.reduce((sum, count) => sum + count, 0) / dayAppointments.length;
  }

  private calculateTrend(dailyDemand: Map<string, number>): number {
    const dates = Array.from(dailyDemand.keys()).sort();
    if (dates.length < 2) return 0;
    
    const firstHalf = dates.slice(0, Math.floor(dates.length / 2));
    const secondHalf = dates.slice(Math.floor(dates.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, date) => sum + dailyDemand.get(date), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, date) => sum + dailyDemand.get(date), 0) / secondHalf.length;
    
    if (firstAvg === 0) return 0;
    
    return (secondAvg - firstAvg) / firstAvg;
  }

  private calculateConfidence(dailyDemand: Map<string, number>, dayOfWeek: number): number {
    const dayCounts = Array.from(dailyDemand.values());
    const variance = this.calculateVariance(dayCounts);
    const mean = this.calculateAverage(dailyDemand);
    
    // Lower variance = higher confidence
    const confidence = Math.max(0, 1 - (variance / (mean * mean || 1)));
    return Math.round(confidence * 100);
  }

  private calculateAverage(dailyDemand: Map<string, number>): number {
    const values = Array.from(dailyDemand.values());
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private getPeakDay(dailyDemand: Map<string, number>): string {
    let maxDate = '';
    let maxCount = 0;
    
    for (const [date, count] of dailyDemand) {
      if (count > maxCount) {
        maxCount = count;
        maxDate = date;
      }
    }
    
    return maxDate;
  }

  private getLowDay(dailyDemand: Map<string, number>): string {
    let minDate = '';
    let minCount = Infinity;
    
    for (const [date, count] of dailyDemand) {
      if (count < minCount) {
        minCount = count;
        minDate = date;
      }
    }
    
    return minDate;
  }

  private getIntensity(count: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    if (count === 0) return 'LOW';
    if (count <= 2) return 'MEDIUM';
    if (count <= 5) return 'HIGH';
    return 'VERY_HIGH';
  }

  private getDayName(dayOfWeek: number): string {
    const names = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return names[dayOfWeek] || '';
  }
}
