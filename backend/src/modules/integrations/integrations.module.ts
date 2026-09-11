import { Module } from '@nestjs/common';
import { WhatsAppController } from './whatsapp/whatsapp.controller';
import { WhatsAppService } from './whatsapp/whatsapp.service';
import { PaymentController } from './payments/payment.controller';
import { PaymentService } from './payments/payment.service';
import { VideoConsultationController } from './video/video-consultation.controller';
import { VideoConsultationService } from './video/video-consultation.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [
    WhatsAppController,
    PaymentController,
    VideoConsultationController,
  ],
  providers: [
    WhatsAppService,
    PaymentService,
    VideoConsultationService,
  ],
  exports: [
    WhatsAppService,
    PaymentService,
    VideoConsultationService,
  ],
})
export class IntegrationsModule {}
