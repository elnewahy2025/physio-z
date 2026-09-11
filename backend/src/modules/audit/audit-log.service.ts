import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../settings/settings.service';

export interface AuditLogData {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  category?: 'GENERAL' | 'PATIENT_DATA' | 'MEDICAL_RECORDS' | 'FINANCIAL' | 
             'APPOINTMENTS' | 'USER_MANAGEMENT' | 'SYSTEM' | 'SECURITY';
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  async log(auditData: AuditLogData): Promise<void> {
    try {
      // Check if audit logging is enabled from settings
      const auditEnabled = await this.isAuditEnabled();
      if (!auditEnabled) {
        return;
      }

      await this.prisma.auditLog.create({
        data: {
          userId: auditData.userId,
          action: auditData.action as any,
          entityType: auditData.entityType,
          entityId: auditData.entityId,
          description: auditData.description,
          oldValues: auditData.oldValues,
          newValues: auditData.newValues,
          ipAddress: auditData.ipAddress,
          userAgent: auditData.userAgent,
          sessionId: auditData.sessionId,
          severity: auditData.severity || 'INFO',
          category: auditData.category || 'GENERAL',
        },
      });
    } catch (error) {
      // Log error but don't fail the main operation
      this.logger.error('Failed to create audit log:', error);
    }
  }

  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    category?: string;
    severity?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.category) where.category = filters.category;
    if (filters.severity) where.severity = filters.severity;
    
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 100); // Max 100 per page
    
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAuditStatistics(dateFrom?: Date, dateTo?: Date) {
    const where: any = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [
      totalLogs,
      logsByAction,
      logsBySeverity,
      logsByCategory,
      recentActivity,
    ] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
      }),
      
      this.prisma.auditLog.groupBy({
        by: ['severity'],
        where,
        _count: { severity: true },
      }),
      
      this.prisma.auditLog.groupBy({
        by: ['category'],
        where,
        _count: { category: true },
      }),
      
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      totalLogs,
      byAction: logsByAction.map(item => ({
        action: item.action,
        count: item._count.action,
      })),
      bySeverity: logsBySeverity.map(item => ({
        severity: item.severity,
        count: item._count.severity,
      })),
      byCategory: logsByCategory.map(item => ({
        category: item.category,
        count: item._count.category,
      })),
      recentActivity,
    };
  }

  async getSecurityAlerts(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const securityLogs = await this.prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        OR: [
          { severity: 'WARNING' },
          { severity: 'ERROR' },
          { severity: 'CRITICAL' },
          { category: 'SECURITY' },
          { action: 'LOGIN_FAILED' },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return securityLogs;
  }

  async exportAuditLogs(filters: any) {
    // Get audit logs for export
    const logs = await this.prisma.auditLog.findMany({
      where: filters,
      include: {
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert to CSV format
    const csvContent = this.convertToCSV(logs);
    
    return {
      content: csvContent,
      filename: `audit_logs_${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv',
    };
  }

  private async isAuditEnabled(): Promise<boolean> {
    // Check settings for audit configuration
    const settings = await this.prisma.settings.findFirst();
    return settings?.auditLoggingEnabled ?? true; // Default to true
  }

  private convertToCSV(logs: any[]): string {
    if (logs.length === 0) return '';
    
    const headers = [
      'ID',
      'Timestamp',
      'User',
      'Role',
      'Action',
      'Entity Type',
      'Entity ID',
      'Description',
      'Severity',
      'Category',
      'IP Address',
    ];
    
    const csvRows = [headers.join(',')];
    
    for (const log of logs) {
      const row = [
        log.id,
        log.createdAt.toISOString(),
        log.user?.name || 'Unknown',
        log.user?.role || 'Unknown',
        log.action,
        log.entityType,
        log.entityId || '',
        `"${log.description.replace(/"/g, '""')}"`,
        log.severity,
        log.category,
        log.ipAddress || '',
      ];
      
      csvRows.push(row.join(','));
    }
    
    return csvRows.join('\n');
  }
}
