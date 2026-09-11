import { Module } from '@nestjs/common';
import { TreatmentEffectivenessController } from './treatment-effectiveness/treatment-effectiveness.controller';
import { TreatmentEffectivenessService } from './treatment-effectiveness/treatment-effectiveness.service';
import { NoShowPredictionController } from './no-show-prediction/no-show-prediction.controller';
import { NoShowPredictionService } from './no-show-prediction/no-show-prediction.service';
import { DemandForecastingController } from './demand-forecasting/demand-forecasting.controller';
import { DemandForecastingService } from './demand-forecasting/demand-forecasting.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [
    TreatmentEffectivenessController,
    NoShowPredictionController,
    DemandForecastingController,
  ],
  providers: [
    TreatmentEffectivenessService,
    NoShowPredictionService,
    DemandForecastingService,
  ],
  exports: [
    TreatmentEffectivenessService,
    NoShowPredictionService,
    DemandForecastingService,
  ],
})
export class IntelligenceModule {}
