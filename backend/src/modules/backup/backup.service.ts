import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../settings/settings.service';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';
import { createHash } from 'crypto';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  // A2: Scheduled backup (runs daily at 2 AM)
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledBackup() {
    await this.performBackup('SYSTEM', 'FULL');
  }

  // A2: Weekly backup (runs every Sunday at 3 AM)
  @Cron('0 3 * * 0')
  async weeklyBackup() {
    await this.performBackup('SYSTEM', 'FULL');
  }

  async performBackup(
    triggeredBy: string,
    type: 'FULL' | 'PARTIAL' | 'DATABASE_ONLY' | 'FILES_ONLY' = 'FULL',
  ) {
    const backupRecord = await this.prisma.backupRecord.create({
      data: {
        filename: this.generateBackupFilename(type),
        filePath: '', // Will be updated after backup is created
        size: 0,
        type: type as any,
        status: 'IN_PROGRESS' as any,
        startedAt: new Date(),
        triggeredBy,
      },
    });

    try {
      this.logger.log(`Starting backup: ${backupRecord.filename}`);
      
      // Get backup directory from settings
      const backupDir = await this.getBackupDirectory();
      
      // Ensure backup directory exists
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupPath = path.join(backupDir, backupRecord.filename);
      
      // Perform backup based on type
      let backupResult;
      switch (type) {
        case 'FULL':
          backupResult = await this.createFullBackup(backupPath);
          break;
        case 'DATABASE_ONLY':
          backupResult = await this.createDatabaseBackup(backupPath);
          break;
        case 'FILES_ONLY':
          backupResult = await this.createFilesBackup(backupPath);
          break;
        default:
          backupResult = await this.createFullBackup(backupPath);
      }

      // Calculate checksum
      const checksum = await this.calculateChecksum(backupPath);
      
      // Update backup record
      const completedAt = new Date();
      const duration = Math.floor(
        (completedAt.getTime() - backupRecord.startedAt.getTime()) / 1000,
      );

      await this.prisma.backupRecord.update({
        where: { id: backupRecord.id },
        data: {
          filePath: backupPath,
          size: backupResult.size,
          status: 'COMPLETED' as any,
          completedAt,
          duration,
          checksum,
          includes: backupResult.includes,
        },
      });

      this.logger.log(`Backup completed: ${backupRecord.filename}`);
      
      // Clean up old backups
      await this.cleanupOldBackups();
      
      return {
        success: true,
        backupId: backupRecord.id,
        filename: backupRecord.filename,
        size: backupResult.size,
        duration,
      };
    } catch (error) {
      this.logger.error(`Backup failed: ${error.message}`);
      
      await this.prisma.backupRecord.update({
        where: { id: backupRecord.id },
        data: {
          status: 'FAILED' as any,
          error: error.message,
          completedAt: new Date(),
        },
      });
      
      throw error;
    }
  }

  async getBackupHistory() {
    return this.prisma.backupRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async downloadBackup(backupId: string) {
    const backup = await this.prisma.backupRecord.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      throw new Error('Backup not found');
    }

    if (!fs.existsSync(backup.filePath)) {
      throw new Error('Backup file not found on disk');
    }

    const fileContent = fs.readFileSync(backup.filePath);
    
    return {
      content: fileContent,
      filename: backup.filename,
      mimeType: 'application/zip',
    };
  }

  async deleteBackup(backupId: string) {
    const backup = await this.prisma.backupRecord.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      throw new Error('Backup not found');
    }

    // Delete file from disk
    if (fs.existsSync(backup.filePath)) {
      fs.unlinkSync(backup.filePath);
    }

    // Delete record from database
    await this.prisma.backupRecord.delete({
      where: { id: backupId },
    });

    return { success: true };
  }

  async getBackupStatistics() {
    const [totalBackups, successfulBackups, failedBackups, totalSize] = 
      await Promise.all([
        this.prisma.backupRecord.count(),
        this.prisma.backupRecord.count({
          where: { status: 'COMPLETED' },
        }),
        this.prisma.backupRecord.count({
          where: { status: 'FAILED' },
        }),
        this.prisma.backupRecord.aggregate({
          _sum: { size: true },
        }),
      ]);

    return {
      totalBackups,
      successfulBackups,
      failedBackups,
      totalSize: totalSize._sum.size || 0,
      successRate: totalBackups > 0 ? (successfulBackups / totalBackups) * 100 : 0,
    };
  }

  private async createFullBackup(backupPath: string) {
    const includes = {
      database: true,
      files: true,
      settings: true,
      uploads: true,
    };

    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    const output = fs.createWriteStream(backupPath);
    archive.pipe(output);

    // Add database backup (JSON export)
    const databaseBackup = await this.exportDatabaseToJSON();
    archive.append(JSON.stringify(databaseBackup, null, 2), {
      name: 'database_export.json',
    });

    // Add settings
    const settings = await this.prisma.settings.findFirst();
    archive.append(JSON.stringify(settings, null, 2), {
      name: 'settings.json',
    });

    // Add uploads directory if it exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (fs.existsSync(uploadsDir)) {
      archive.directory(uploadsDir, 'uploads');
    }

    await archive.finalize();

    // Wait for stream to finish
    await new Promise((resolve) => {
      output.on('close', resolve);
    });

    const stats = fs.statSync(backupPath);
    
    return {
      size: stats.size,
      includes,
    };
  }

  private async createDatabaseBackup(backupPath: string) {
    const includes = {
      database: true,
      files: false,
      settings: true,
      uploads: false,
    };

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    const output = fs.createWriteStream(backupPath);
    archive.pipe(output);

    const databaseBackup = await this.exportDatabaseToJSON();
    archive.append(JSON.stringify(databaseBackup, null, 2), {
      name: 'database_export.json',
    });

    await archive.finalize();

    await new Promise((resolve) => {
      output.on('close', resolve);
    });

    const stats = fs.statSync(backupPath);
    
    return {
      size: stats.size,
      includes,
    };
  }

  private async createFilesBackup(backupPath: string) {
    const includes = {
      database: false,
      files: true,
      settings: false,
      uploads: true,
    };

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    const output = fs.createWriteStream(backupPath);
    archive.pipe(output);

    // Add uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (fs.existsSync(uploadsDir)) {
      archive.directory(uploadsDir, 'uploads');
    }

    await archive.finalize();

    await new Promise((resolve) => {
      output.on('close', resolve);
    });

    const stats = fs.statSync(backupPath);
    
    return {
      size: stats.size,
      includes,
    };
  }

  private async exportDatabaseToJSON() {
    // Export all tables to JSON
    const [
      users,
      patients,
      appointments,
      invoices,
      payments,
      settings,
      therapySessions,
      files,
      blockedSlots,
      expenses,
      surveys,
      packages,
      patientPackages,
      discounts,
      waitlistEntries,
      inventoryItems,
      equipment,
      maintenanceLogs,
    ] = await Promise.all([
      this.prisma.user.findMany(),
      this.prisma.patient.findMany(),
      this.prisma.appointment.findMany(),
      this.prisma.invoice.findMany(),
      this.prisma.payment.findMany(),
      this.prisma.settings.findMany(),
      this.prisma.therapySession.findMany(),
      this.prisma.file.findMany(),
      this.prisma.blockedSlot.findMany(),
      this.prisma.expense.findMany(),
      this.prisma.survey.findMany(),
      this.prisma.package.findMany(),
      this.prisma.patientPackage.findMany(),
      this.prisma.discount.findMany(),
      this.prisma.waitlistEntry.findMany(),
      this.prisma.inventoryItem.findMany(),
      this.prisma.equipment.findMany(),
      this.prisma.maintenanceLog.findMany(),
    ]);

    return {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        tableCount: 18,
      },
      tables: {
        users,
        patients,
        appointments,
        invoices,
        payments,
        settings,
        therapySessions,
        files,
        blockedSlots,
        expenses,
        surveys,
        packages,
        patientPackages,
        discounts,
        waitlistEntries,
        inventoryItems,
        equipment,
        maintenanceLogs,
      },
    };
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('error', reject);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  private async getBackupDirectory(): Promise<string> {
    // Get backup directory from settings, or use default
    const settings = await this.prisma.settings.findFirst();
    return settings?.backupDirectory || path.join(process.cwd(), 'backups');
  }

  private async cleanupOldBackups() {
    // Get retention days from settings
    const settings = await this.prisma.settings.findFirst();
    const retentionDays = settings?.backupRetentionDays || 30;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldBackups = await this.prisma.backupRecord.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    for (const backup of oldBackups) {
      // Delete file from disk
      if (fs.existsSync(backup.filePath)) {
        fs.unlinkSync(backup.filePath);
      }
      
      // Delete record from database
      await this.prisma.backupRecord.delete({
        where: { id: backup.id },
      });
    }
  }

  private generateBackupFilename(type: string): string {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('.')[0];
    
    return `physio-z-backup-${type.toLowerCase()}-${timestamp}.zip`;
  }
}
