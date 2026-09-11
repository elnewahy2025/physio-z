import { Module } from '@nestjs/common';
import { MedicalFileController } from './medical-files/medical-file.controller';
import { MedicalFileService } from './medical-files/medical-file.service';
import { PhotoProgressController } from './photos/photo-progress.controller';
import { PhotoProgressService } from './photos/photo-progress.service';
import { IntakeFormsController } from './forms/intake-forms.controller';
import { IntakeFormsService } from './forms/intake-forms.service';
import { ConsentFormsController } from './consent/consent-forms.controller';
import { ConsentFormsService } from './consent/consent-forms.service';
import { PainMapController } from './pain-map/pain-map.controller';
import { PainMapService } from './pain-map/pain-map.service';
import { AuditService } from './audit/audit.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [
    MedicalFileController,
    PhotoProgressController,
    IntakeFormsController,
    ConsentFormsController,
    PainMapController,
  ],
  providers: [
    MedicalFileService,
    PhotoProgressService,
    IntakeFormsService,
    ConsentFormsService,
    PainMapService,
    AuditService,
  ],
  exports: [
    MedicalFileService,
    PhotoProgressService,
    IntakeFormsService,
    ConsentFormsService,
    PainMapService,
    AuditService,
  ],
})
export class PatientCareModule {}
