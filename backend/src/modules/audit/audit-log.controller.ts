import {
  Controller,
  Get,
  Query,
  Post,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AuditLogService } from './audit-log.service';

@Controller('audit/logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private auditLogService: AuditLogService) {}

  @Get()
  @Roles('OWNER', 'SECRETARY')
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('category') category?: string,
    @Query('severity') severity?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditLogService.getAuditLogs({
      userId,
      action,
      entityType,
      entityId,
      category,
      severity,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Get('statistics')
  @Roles('OWNER', 'SECRETARY')
  async getAuditStatistics(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.auditLogService.getAuditStatistics(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  @Get('security-alerts')
  @Roles('OWNER')
  async getSecurityAlerts(@Query('days') days?: string) {
    return this.auditLogService.getSecurityAlerts(
      days ? parseInt(days) : 7,
    );
  }

  @Post('export')
  @Roles('OWNER', 'SECRETARY')
  async exportAuditLogs(
    @Request() req,
    @Res() res: Response,
  ) {
    const exportData = await this.auditLogService.exportAuditLogs({});
    
    res.set({
      'Content-Type': exportData.mimeType,
      'Content-Disposition': `attachment; filename="${exportData.filename}"`,
    });
    
    return res.send(exportData.content);
  }
}
