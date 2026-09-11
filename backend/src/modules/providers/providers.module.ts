import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProviderController } from './controllers/provider.controller';
import { TemplateController } from './controllers/template.controller';
import { ProviderManagementService } from './controllers/provider-management.service';
import { ProviderFactoryService } from './factory/provider-factory.service';
import { EncryptionService } from './encryption/encryption.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [ProviderController, TemplateController],
  providers: [
    ProviderManagementService,
    ProviderFactoryService,
    EncryptionService,
  ],
  exports: [
    ProviderManagementService,
    ProviderFactoryService,
    EncryptionService,
  ],
})
export class ProvidersModule {}
