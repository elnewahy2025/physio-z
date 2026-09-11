import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { NoShowPredictionService } from './no-show-prediction.service';

@Controller('intelligence/no-show-prediction')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NoShowPredictionController {
  constructor(private noShowPredictionService: NoShowPredictionService) {}

  @Get('appointment/:appointmentId')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async predictNoShowRisk(@Param('appointmentId') appointmentId: string) {
    return this.noShowPredictionService.predictNoShowRisk(appointmentId);
  }

  @Get('patient/:patientId')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async getPatientRiskProfile(@Param('patientId') patientId: string) {
    return this.noShowPredictionService.getPatientRiskProfile(patientId);
  }

  @Get('upcoming')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async getUpcomingAppointmentsRisk() {
    return this.noShowPredictionService.getUpcomingAppointmentsRisk();
  }
}
