import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { IntakeFormsService } from './intake-forms.service';

@Controller('patient-care/forms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntakeFormsController {
  constructor(private intakeFormsService: IntakeFormsService) {}

  @Get('templates')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async getFormTemplates(@Query('type') type?: string) {
    return this.intakeFormsService.getFormTemplates(type);
  }

  @Get('templates/:templateId')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async getFormTemplate(@Param('templateId') templateId: string) {
    return this.intakeFormsService.getFormTemplate(templateId);
  }

  @Post('start')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async startForm(
    @Body() body: { patientId: string; templateId: string },
    @Request() req,
  ) {
    return this.intakeFormsService.startForm(
      body.patientId,
      body.templateId,
      req.user.id,
    );
  }

  @Put(':formId/progress')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async saveFormProgress(
    @Param('formId') formId: string,
    @Body() body: { formData: any },
    @Request() req,
  ) {
    return this.intakeFormsService.saveFormProgress(
      formId,
      body.formData,
      req.user.id,
    );
  }

  @Put(':formId/submit')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async submitForm(
    @Param('formId') formId: string,
    @Body() body: { formData: any },
    @Request() req,
  ) {
    return this.intakeFormsService.submitForm(
      formId,
      body.formData,
      req.user.id,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('patient/:patientId')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async getPatientForms(
    @Param('patientId') patientId: string,
    @Request() req,
  ) {
    return this.intakeFormsService.getPatientForms(
      patientId,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':formId')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async getForm(@Param('formId') formId: string, @Request() req) {
    return this.intakeFormsService.getFormById(
      formId,
      req.user.id,
      req.user.role,
    );
  }
}
