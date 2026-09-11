import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PrescriptionService } from './prescription.service';

@Controller('exercise-library/prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionController {
  constructor(private prescriptionService: PrescriptionService) {}

  @Post()
  @Roles('OWNER', 'THERAPIST')
  async createPrescription(@Body() data: any, @Request() req) {
    return this.prescriptionService.createPrescription({
      ...data,
      therapistId: req.user.id, // Default to current user as therapist
      createdById: req.user.id,
    });
  }

  @Get()
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async getPrescriptions(
    @Query('patientId') patientId?: string,
    @Query('therapistId') therapistId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req,
  ) {
    if (patientId) {
      return this.prescriptionService.getPatientPrescriptions(
        patientId,
        status,
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 10,
      );
    }

    // Default to current therapist's prescriptions
    const therapistIdToUse = therapistId || req.user.id;
    return this.prescriptionService.getTherapistPrescriptions(
      therapistIdToUse,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get(':prescriptionId')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async getPrescription(@Param('prescriptionId') prescriptionId: string) {
    return this.prescriptionService.getPrescription(prescriptionId);
  }

  @Put(':prescriptionId')
  @Roles('OWNER', 'THERAPIST')
  async updatePrescription(
    @Param('prescriptionId') prescriptionId: string,
    @Body() data: any,
  ) {
    return this.prescriptionService.updatePrescription(prescriptionId, data);
  }

  @Put(':prescriptionId/complete')
  @Roles('OWNER', 'THERAPIST')
  async completePrescription(@Param('prescriptionId') prescriptionId: string) {
    return this.prescriptionService.completePrescription(prescriptionId);
  }

  @Put(':prescriptionId/cancel')
  @Roles('OWNER', 'THERAPIST')
  async cancelPrescription(@Param('prescriptionId') prescriptionId: string) {
    return this.prescriptionService.cancelPrescription(prescriptionId);
  }

  @Post('log')
  @Roles('PATIENT')
  async logExerciseCompletion(@Body() data: any) {
    return this.prescriptionService.logExerciseCompletion(data);
  }

  @Get('patient/:patientId/history')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async getPatientExerciseHistory(
    @Param('patientId') patientId: string,
    @Query('days') days?: string,
  ) {
    return this.prescriptionService.getPatientExerciseHistory(
      patientId,
      days ? parseInt(days) : 30,
    );
  }
}
