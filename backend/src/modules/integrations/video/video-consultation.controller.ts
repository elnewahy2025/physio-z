import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { VideoConsultationService } from './video-consultation.service';

@Controller('integrations/video')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VideoConsultationController {
  constructor(private videoConsultationService: VideoConsultationService) {}

  @Post('appointment/:appointmentId/link')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async addVideoLink(
    @Param('appointmentId') appointmentId: string,
    @Body() data: {
      videoUrl: string;
      platform?: string;
      password?: string;
      notes?: string;
    },
    @Request() req,
  ) {
    return this.videoConsultationService.addVideoLink(
      appointmentId,
      data,
      req.user.id
    );
  }

  @Get('appointment/:appointmentId')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async getAppointmentVideoLinks(@Param('appointmentId') appointmentId: string) {
    return this.videoConsultationService.getAppointmentVideoLinks(appointmentId);
  }

  @Get('patient/:patientId')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async getPatientVideoConsultations(@Param('patientId') patientId: string) {
    return this.videoConsultationService.getPatientVideoConsultations(patientId);
  }

  @Put(':videoId/deactivate')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async deactivateVideoLink(@Param('videoId') videoId: string) {
    return this.videoConsultationService.deactivateVideoLink(videoId);
  }
}
