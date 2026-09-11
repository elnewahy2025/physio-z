import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ProviderManagementService } from './provider-management.service';

@Controller('providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER') // Owner only as per requirements
export class ProviderController {
  constructor(private providerManagementService: ProviderManagementService) {}

  @Post()
  async createProvider(@Body() data: any) {
    return this.providerManagementService.createProvider(data);
  }

  @Get()
  async getAllProviders(@Query('type') providerType?: string) {
    return this.providerManagementService.getAllProviders(providerType);
  }

  @Get(':providerId')
  async getProvider(@Param('providerId') providerId: string) {
    return this.providerManagementService.getProvider(providerId);
  }

  @Put(':providerId')
  async updateProvider(
    @Param('providerId') providerId: string,
    @Body() data: any,
  ) {
    return this.providerManagementService.updateProvider(providerId, data);
  }

  @Delete(':providerId')
  async deleteProvider(@Param('providerId') providerId: string) {
    return this.providerManagementService.deleteProvider(providerId);
  }

  @Post(':providerId/test')
  async testProvider(@Param('providerId') providerId: string) {
    return this.providerManagementService.testProvider(providerId);
  }

  @Get(':providerId/stats')
  async getProviderStats(@Param('providerId') providerId: string) {
    return this.providerManagementService.getProviderStats(providerId);
  }
}
