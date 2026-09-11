import { Module } from '@nestjs/common';
import { ExerciseController } from './exercises/exercise.controller';
import { ExerciseService } from './exercises/exercise.service';
import { PrescriptionController } from './prescriptions/prescription.controller';
import { PrescriptionService } from './prescriptions/prescription.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [ExerciseController, PrescriptionController],
  providers: [ExerciseService, PrescriptionService],
  exports: [ExerciseService, PrescriptionService],
})
export class ExerciseLibraryModule {}
