import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ConsentFormsService } from './consent-forms.service';

@Controller('patient-care/consents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsentFormsController {
  constructor(private consentFormsService: ConsentFormsService) {}

  @Get('templates')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async getConsentTemplates(@Query('type') type?: string) {
    return this.consentFormsService.getConsentTemplates(type);
  }

  @Get('templates/:templateId')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async getConsentTemplate(@Param('templateId') templateId: string) {
    return this.consentFormsService.getConsentTemplate(templateId);
  }

  @Post('sign')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async signConsent(
    @Body() body: {
      patientId: string;
      templateId: string;
      signatureData: string;
      witnessName?: string;
    },
    @Request() req,
  ) {
    return this.consentFormsService.signConsent(
      body.patientId,
      body.templateId,
      body.signatureData,
      req.user.id,
      req.ip,
      req.headers['user-agent'],
      body.witnessName,
    );
  }

  @Get('patient/:patientId')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async getPatientConsents(
    @Param('patientId') patientId: string,
    @Request() req,
  ) {
    return this.consentFormsService.getPatientConsents(
      patientId,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':consentId')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async getConsent(@Param('consentId') consentId: string, @Request() req) {
    return this.consentFormsService.getConsentById(
      consentId,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':consentId/verify')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async verifyConsent(@Param('consentId') consentId: string) {
    return this.consentFormsService.verifyConsent(consentId);
  }
}
