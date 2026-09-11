import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { DemandForecastingService } from './demand-forecasting.service';

@Controller('intelligence/demand-forecasting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DemandForecastingController {
  constructor(private demandForecastingService: DemandForecastingService) {}

  @Get()
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async getDemandForecast(@Query('days') days?: string) {
    const forecastDays = days ? parseInt(days) : 30;
    return this.demandForecastingService.getDemandForecast(forecastDays);
  }

  @Get('calendar')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async getCalendarHeatmap(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    return this.demandForecastingService.getCalendarHeatmap(currentYear, currentMonth);
  }

  @Get('weekly-patterns')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async getWeeklyPatterns() {
    return this.demandForecastingService.getWeeklyPatterns();
  }
}
