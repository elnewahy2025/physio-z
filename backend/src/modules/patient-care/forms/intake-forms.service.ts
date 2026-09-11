import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class IntakeFormsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getFormTemplates(type?: string) {
    const where: any = { isActive: true };
    if (type) {
      where.type = type;
    }

    return this.prisma.formTemplate.findMany({
      where,
      select: {
        id: true,
        type: true,
        title: true,
        titleAr: true,
        description: true,
        version: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFormTemplate(templateId: string) {
    const template = await this.prisma.formTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || !template.isActive) {
      throw new NotFoundException('Form template not found');
    }

    return template;
  }

  async startForm(patientId: string, templateId: string, userId: string) {
    // Validate patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Validate template exists
    const template = await this.prisma.formTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template || !template.isActive) {
      throw new NotFoundException('Form template not found');
    }

    // Check if form already exists for this patient and template
    const existingForm = await this.prisma.patientForm.findFirst({
      where: {
        patientId,
        templateId,
        status: { in: ['pending', 'in_progress'] },
      },
    });

    if (existingForm) {
      return existingForm;
    }

    // Create new form
    const form = await this.prisma.patientForm.create({
      data: {
        patientId,
        templateId,
        status: 'in_progress',
        startedAt: new Date(),
        formData: {},
      },
    });

    // Log audit trail
    await this.auditService.logAction({
      userId,
      action: 'CREATE',
      entityType: 'intake_form',
      entityId: form.id,
      details: { patientId, templateId },
    });

    return form;
  }

  async saveFormProgress(formId: string, formData: any, userId: string) {
    const form = await this.prisma.patientForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    if (form.status === 'completed') {
      throw new BadRequestException('Form already completed');
    }

    return this.prisma.patientForm.update({
      where: { id: formId },
      data: {
        formData,
        status: 'in_progress',
        updatedAt: new Date(),
      },
    });
  }

  async submitForm(
    formId: string,
    formData: any,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const form = await this.prisma.patientForm.findUnique({
      where: { id: formId },
      include: { template: true },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    if (form.status === 'completed') {
      throw new BadRequestException('Form already submitted');
    }

    // Validate form data against template schema (basic validation)
    this.validateFormData(formData, form.template.schema);

    // Update form
    const updatedForm = await this.prisma.patientForm.update({
      where: { id: formId },
      data: {
        formData,
        status: 'completed',
        completedAt: new Date(),
        ipAddress,
        userAgent,
      },
    });

    // Log audit trail
    await this.auditService.logAction({
      userId,
      action: 'UPDATE',
      entityType: 'intake_form',
      entityId: formId,
      details: {
        patientId: form.patientId,
        templateId: form.templateId,
        status: 'completed',
      },
    });

    return updatedForm;
  }

  async getPatientForms(patientId: string, userId: string, userRole: string) {
    // Authorization check
    if (userRole === 'PATIENT' && patientId !== userId) {
      throw new BadRequestException('You can only access your own forms');
    }

    return this.prisma.patientForm.findMany({
      where: { patientId },
      include: {
        template: {
          select: {
            id: true,
            type: true,
            title: true,
            titleAr: true,
            version: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFormById(formId: string, userId: string, userRole: string) {
    const form = await this.prisma.patientForm.findUnique({
      where: { id: formId },
      include: {
        template: true,
        patient: true,
      },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    // Authorization check
    if (userRole === 'PATIENT' && form.patient.userId !== userId) {
      throw new BadRequestException('You can only access your own forms');
    }

    return form;
  }

  private validateFormData(formData: any, schema: any) {
    // Basic validation - in production, use a JSON schema validator
    if (!formData || typeof formData !== 'object') {
      throw new BadRequestException('Invalid form data');
    }

    // Check required fields from schema
    if (schema && schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!formData[field]) {
          throw new BadRequestException(`Missing required field: ${field}`);
        }
      }
    }
  }
}
