import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../audit-log.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = request.method;
    const url = request.url;
    const user = request.user;

    // Skip certain endpoints
    if (this.shouldSkipAudit(url)) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.logSuccessfulRequest(
            request,
            response,
            method,
            url,
            user,
            data,
            startTime,
          );
        },
        error: (error) => {
          this.logFailedRequest(
            request,
            method,
            url,
            user,
            error,
            startTime,
          );
        },
      }),
    );
  }

  private shouldSkipAudit(url: string): boolean {
    // Skip audit for these endpoints
    const skipPaths = [
      '/auth/login',
      '/auth/refresh',
      '/health',
      '/metrics',
      '/audit/logs', // Don't audit audit log queries
    ];
    
    return skipPaths.some((path) => url.startsWith(path));
  }

  private async logSuccessfulRequest(
    request: any,
    response: any,
    method: string,
    url: string,
    user: any,
    data: any,
    startTime: number,
  ) {
    // Only log write operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      await this.auditLogService.log({
        userId: user?.id || 'SYSTEM',
        action: this.getActionFromMethod(method),
        entityType: this.getEntityTypeFromUrl(url),
        entityId: this.getEntityIdFromUrl(url) || data?.id,
        description: `${method} ${url}`,
        newValues: method !== 'DELETE' ? data : undefined,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        severity: 'INFO',
        category: this.getCategoryFromUrl(url),
      });
    }
  }

  private async logFailedRequest(
    request: any,
    method: string,
    url: string,
    user: any,
    error: any,
    startTime: number,
  ) {
    await this.auditLogService.log({
      userId: user?.id || 'SYSTEM',
      action: this.getActionFromMethod(method),
      entityType: this.getEntityTypeFromUrl(url),
      description: `${method} ${url} - FAILED: ${error.message}`,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      severity: 'ERROR',
      category: 'SYSTEM',
    });
  }

  private getActionFromMethod(method: string): string {
    switch (method) {
      case 'POST':
        return 'CREATE';
      case 'GET':
        return 'READ';
      case 'PUT':
      case 'PATCH':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      default:
        return 'READ';
    }
  }

  private getEntityTypeFromUrl(url: string): string {
    // Extract entity type from URL
    const parts = url.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return parts[1].toUpperCase(); // e.g., 'patients', 'appointments'
    }
    return 'UNKNOWN';
  }

  private getEntityIdFromUrl(url: string): string | undefined {
    // Extract entity ID from URL
    const parts = url.split('/').filter(Boolean);
    if (parts.length >= 3) {
      return parts[2];
    }
    return undefined;
  }

  private getCategoryFromUrl(url: string): string {
    const entityType = this.getEntityTypeFromUrl(url);
    
    switch (entityType) {
      case 'PATIENTS':
        return 'PATIENT_DATA';
      case 'APPOINTMENTS':
        return 'APPOINTMENTS';
      case 'INVOICES':
      case 'PAYMENTS':
        return 'FINANCIAL';
      case 'USERS':
        return 'USER_MANAGEMENT';
      case 'SETTINGS':
        return 'SYSTEM';
      default:
        return 'GENERAL';
    }
  }
}
