import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { BackupService } from './backup.service';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BackupController {
  constructor(private backupService: BackupService) {}

  @Post('create')
  @Roles('OWNER')
  async createBackup(
    @Query('type') type?: 'FULL' | 'DATABASE_ONLY' | 'FILES_ONLY',
  ) {
    return this.backupService.performBackup(
      'MANUAL',
      type || 'FULL',
    );
  }

  @Get('history')
  @Roles('OWNER', 'SECRETARY')
  async getBackupHistory() {
    return this.backupService.getBackupHistory();
  }

  @Get('statistics')
  @Roles('OWNER', 'SECRETARY')
  async getBackupStatistics() {
    return this.backupService.getBackupStatistics();
  }

  @Get(':backupId/download')
  @Roles('OWNER')
  async downloadBackup(
    @Param('backupId') backupId: string,
    @Res() res: Response,
  ) {
    const backup = await this.backupService.downloadBackup(backupId);
    
    res.set({
      'Content-Type': backup.mimeType,
      'Content-Disposition': `attachment; filename="${backup.filename}"`,
    });
    
    return res.send(backup.content);
  }

  @Delete(':backupId')
  @Roles('OWNER')
  async deleteBackup(@Param('backupId') backupId: string) {
    return this.backupService.deleteBackup(backupId);
  }
}
