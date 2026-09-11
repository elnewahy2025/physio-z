import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { TreatmentEffectivenessService } from './treatment-effectiveness.service';

@Controller('intelligence/treatment-effectiveness')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TreatmentEffectivenessController {
  constructor(private treatmentEffectivenessService: TreatmentEffectivenessService) {}

  @Get()
  @Roles('OWNER', 'THERAPIST')
  async getTreatmentEffectiveness(
    @Query('diagnosis') diagnosis?: string,
    @Query('therapistId') therapistId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.treatmentEffectivenessService.getTreatmentEffectiveness({
      diagnosis,
      therapistId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get('therapist/:therapistId')
  @Roles('OWNER', 'THERAPIST')
  async getTherapistEffectiveness(@Request() req) {
    return this.treatmentEffectivenessService.getTherapistEffectiveness(req.user.id);
  }
}
