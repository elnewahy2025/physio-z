import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ConsentFormsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getConsentTemplates(type?: string) {
    const where: any = { isActive: true };
    if (type) {
      where.type = type;
    }

    return this.prisma.consentTemplate.findMany({
      where,
      select: {
        id: true,
        type: true,
        title: true,
        titleAr: true,
        version: true,
        requiresWitness: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getConsentTemplate(templateId: string) {
    const template = await this.prisma.consentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || !template.isActive) {
      throw new NotFoundException('Consent template not found');
    }

    return template;
  }

  async signConsent(
    patientId: string,
    templateId: string,
    signatureData: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    witnessName?: string,
  ) {
    // Validate patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Validate template exists
    const template = await this.prisma.consentTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template || !template.isActive) {
      throw new NotFoundException('Consent template not found');
    }

    // Check if witness is required
    if (template.requiresWitness && !witnessName) {
      throw new BadRequestException('Witness signature is required for this consent');
    }

    // Validate signature data (basic check)
    if (!signatureData || !signatureData.startsWith('data:image')) {
      throw new BadRequestException('Invalid signature data');
    }

    // Save consent
    const consent = await this.prisma.consentForm.create({
      data: {
        patientId,
        templateId,
        consentText: template.contentAr || template.content,
        signatureData,
        signedAt: new Date(),
        witnessName,
        ipAddress,
        userAgent,
        version: template.version,
      },
    });

    // Log audit trail
    await this.auditService.logAction({
      userId,
      action: 'SIGN',
      entityType: 'consent_form',
      entityId: consent.id,
      details: {
        patientId,
        templateId,
        templateType: template.type,
        version: template.version,
      },
    });

    return consent;
  }

  async getPatientConsents(patientId: string, userId: string, userRole: string) {
    // Authorization check
    if (userRole === 'PATIENT' && patientId !== userId) {
      throw new BadRequestException('You can only access your own consents');
    }

    return this.prisma.consentForm.findMany({
      where: { patientId },
      include: {
        template: {
          select: {
            id: true,
            type: true,
            title: true,
            titleAr: true,
          },
        },
      },
      orderBy: { signedAt: 'desc' },
    });
  }

  async getConsentById(consentId: string, userId: string, userRole: string) {
    const consent = await this.prisma.consentForm.findUnique({
      where: { id: consentId },
      include: {
        template: true,
        patient: true,
      },
    });

    if (!consent) {
      throw new NotFoundException('Consent not found');
    }

    // Authorization check
    if (userRole === 'PATIENT' && consent.patient.userId !== userId) {
      throw new BadRequestException('You can only access your own consents');
    }

    return consent;
  }

  async verifyConsent(consentId: string) {
    const consent = await this.prisma.consentForm.findUnique({
      where: { id: consentId },
      include: { template: true },
    });

    if (!consent) {
      throw new NotFoundException('Consent not found');
    }

    return {
      isValid: true,
      signedAt: consent.signedAt,
      templateType: consent.template.type,
      version: consent.version,
      hasWitness: !!consent.witnessName,
    };
  }
}
