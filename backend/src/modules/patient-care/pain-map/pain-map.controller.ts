import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PainMapService } from './pain-map.service';

@Controller('patient-care/pain-map')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PainMapController {
  constructor(private painMapService: PainMapService) {}

  @Post('marker')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async addPainMarker(
    @Body() body: {
      patientId: string;
      bodyView: string;
      xCoordinate: number;
      yCoordinate: number;
      painIntensity: number;
      painType: string;
      painDescription?: string;
      appointmentId?: string;
    },
    @Request() req,
  ) {
    return this.painMapService.addPainMarker(body.patientId, body, req.user.id);
  }

  @Get('patient/:patientId/history')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async getPainHistory(
    @Param('patientId') patientId: string,
    @Request() req,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.painMapService.getPatientPainHistory(
      patientId,
      req.user.id,
      req.user.role,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  @Get('appointment/:appointmentId')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async getPainMapForAppointment(
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.painMapService.getPainMapForAppointment(appointmentId);
  }

  @Get('patient/:patientId/statistics')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async getPainStatistics(
    @Param('patientId') patientId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.painMapService.getPainStatistics(
      patientId,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  @Delete('marker/:markerId')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async deletePainMarker(
    @Param('markerId') markerId: string,
    @Request() req,
  ) {
    return this.painMapService.deletePainMarker(markerId, req.user.id);
  }
}
