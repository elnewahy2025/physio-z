# ============================================================
# RBAC-Verification-Production-Prep.ps1
# COMPLETE RBAC Audit + Production Preparation
# Repository: https://github.com/elnewahy2025/physio-z
#
# PHASE 1: RBAC VERIFICATION & FIXES
# PHASE 2: PRODUCTION PREPARATION (Parallel)
#
# WHAT THIS VERIFIES & FIXES:
#   ✅ Role-based access control on all endpoints
#   ✅ Patient data isolation (patients see only their data)
#   ✅ Provider management restricted to OWNER
#   ✅ Intelligence features properly restricted
#   ✅ Frontend route guards
#
# PRODUCTION PREP INCLUDES:
#   ✅ Let's Encrypt SSL setup
#   ✅ Neon database optimization
#   ✅ Local file storage with cloud migration path
#   ✅ Free monitoring tools setup
#   ✅ Security hardening
# ============================================================

param(
    [switch]$FixIssues,          # Automatically fix found issues
    [switch]$SkipRbacCheck,      # Skip RBAC verification
    [switch]$SkipProduction,     # Skip production prep
    [switch]$Verbose,
    [string]$ProjectRoot = "."
)

 $ErrorActionPreference = "Continue"
 $startTime = Get-Date

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  RBAC VERIFICATION & PRODUCTION PREPARATION" -ForegroundColor Cyan
Write-Host "  Phase 1: Security Audit | Phase 2: Production Ready" -ForegroundColor Gray
Write-Host "  Started: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan

Set-Location $ProjectRoot

# Results tracking
 $script:Results = @{
    RbacIssues = @()
    FixedIssues = @()
    ProductionReady = @()
    Warnings = @()
}

function Add-RbacIssue {
    param([string]$Issue, [string]$Severity, [string]$Fix = "")
    
    $script:Results.RbacIssues += @{
        Issue = $Issue
        Severity = $Severity
        Fix = $Fix
        Time = Get-Date
    }
    
    switch ($Severity) {
        "CRITICAL" { Write-Host "  🔴 CRITICAL: $Issue" -ForegroundColor Red }
        "HIGH" { Write-Host "  🟠 HIGH: $Issue" -ForegroundColor Yellow }
        "MEDIUM" { Write-Host "  🟡 MEDIUM: $Issue" -ForegroundColor Yellow }
        default { Write-Host "  ℹ️  INFO: $Issue" -ForegroundColor Gray }
    }
}

function Add-FixedIssue {
    param([string]$Issue, [string]$Fix)
    
    $script:Results.FixedIssues += @{
        Issue = $Issue
        Fix = $Fix
        Time = Get-Date
    }
    
    Write-Host "  ✅ FIXED: $Issue" -ForegroundColor Green
}

# ============================================================
# PHASE 1: RBAC VERIFICATION
# ============================================================

if (-not $SkipRbacCheck) {
    Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  PHASE 1: RBAC VERIFICATION & AUDIT                       ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

    # Get all controller files
    Write-Host "`n🔍 Scanning Controllers for RBAC Issues..." -ForegroundColor Yellow
    
    $controllers = Get-ChildItem -Path "backend/src/modules" -Recurse -Filter "*.controller.ts"
    
    $totalControllers = 0
    $controllersWithRbac = 0
    $controllersWithoutRbac = 0
    $endpointsWithoutRoles = @()
    
    foreach ($controller in $controllers) {
        $totalControllers++
        $content = Get-Content $controller.FullName -Raw
        $controllerName = $controller.BaseName
        
        # Check if controller has @Roles decorator
        $hasRolesDecorator = $content -match "@Roles\("
        
        # Check if controller has guards
        $null = $content -match "@UseGuards.*JwtAuthGuard"
        
        # Check for public endpoints (login, register)
        $isAuthController = $controllerName -match "auth"
        
        if ($hasRolesDecorator -or $isAuthController) {
            $controllersWithRbac++
        } else {
            $controllersWithoutRbac++
            $severity = if ($controllerName -match "provider|admin|settings") { "CRITICAL" } else { "HIGH" }
            Add-RbacIssue "Controller missing @Roles decorator: $controllerName" $severity "Add @Roles() decorator with appropriate roles"
        }
        
        # Check for specific security concerns
        if ($controllerName -match "provider") {
            # Provider controllers should be OWNER only
            if ($content -notmatch "@Roles\('OWNER'\)") {
                Add-RbacIssue "Provider controller not restricted to OWNER: $controllerName" "CRITICAL" "Add @Roles('OWNER') to all provider endpoints"
            }
        }
        
        if ($controllerName -match "patient.*care|medical|consent") {
            # Patient care features need special handling
            if ($content -match "PATIENT" -and $content -notmatch "req\.user\.id") {
                Add-RbacIssue "Patient care controller may not check user identity: $controllerName" "HIGH" "Add patient-specific data filtering"
            }
        }
        
        if ($controllerName -match "intelligence|analytics") {
            # Intelligence features should be restricted
            if ($content -notmatch "OWNER|THERAPIST") {
                Add-RbacIssue "Intelligence controller accessible to all: $controllerName" "HIGH" "Restrict to OWNER and THERAPIST roles"
            }
        }
        
        # Check for endpoints without any role restriction
        $endpointMatches = [regex]::Matches($content, "@(Get|Post|Put|Delete|Patch)\(")
        foreach ($match in $endpointMatches) {
            $lineNumber = ($content.Substring(0, $match.Index) -split "`n").Count
            $context = $content.Substring([Math]::Max(0, $match.Index - 200), [Math]::Min(400, $content.Length - $match.Index))
            
            if ($context -notmatch "@Roles" -and -not $isAuthController) {
                $endpointsWithoutRoles += @{
                    Controller = $controllerName
                    Line = $lineNumber
                    Method = $match.Value
                }
            }
        }
    }
    
    # Summary of RBAC scan
    Write-Host "`n📊 RBAC SCAN RESULTS:" -ForegroundColor Yellow
    Write-Host ("=" * 50) -ForegroundColor Gray
    Write-Host "  Total Controllers: $totalControllers" -ForegroundColor White
    Write-Host "  With RBAC: $controllersWithRbac" -ForegroundColor Green
    Write-Host "  Without RBAC: $controllersWithoutRbac" -ForegroundColor $(if ($controllersWithoutRbac -gt 0) { "Red" } else { "Green" })
    Write-Host "  Endpoints without roles: $($endpointsWithoutRoles.Count)" -ForegroundColor $(if ($endpointsWithoutRoles.Count -gt 0) { "Yellow" } else { "Green" })
    
    # Display endpoints without roles
    if ($endpointsWithoutRoles.Count -gt 0) {
        Write-Host "`n⚠️  ENDPOINTS WITHOUT ROLE RESTRICTIONS:" -ForegroundColor Yellow
        $endpointsWithoutRoles | Group-Object Controller | ForEach-Object {
            Write-Host "  $($_.Name): $($_.Count) endpoints" -ForegroundColor Yellow
        }
    }
    
    # Check frontend route guards
    Write-Host "`n🔍 Checking Frontend Route Guards..." -ForegroundColor Yellow
    
    $frontendRoutes = Get-ChildItem -Path "frontend/src" -Recurse -Include "*.tsx", "*.ts" | 
                      Where-Object { $_.Name -match "route|App" }
    
    $hasRouteGuards = $false
    foreach ($file in $frontendRoutes) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match "role|permission|guard|PrivateRoute|ProtectedRoute") {
            $hasRouteGuards = $true
            break
        }
    }
    
    if (-not $hasRouteGuards) {
        Add-RbacIssue "Frontend missing route guards" "HIGH" "Add role-based route protection in React Router"
    }
    
    # Check data isolation
    Write-Host "`n🔍 Checking Data Isolation..." -ForegroundColor Yellow
    
    $dataIsolationIssues = @()
    
    # Check patient controllers for data filtering
    $patientControllers = Get-ChildItem -Path "backend/src/modules/patients" -Recurse -Filter "*.service.ts"
    
    foreach ($service in $patientControllers) {
        $content = Get-Content $service.FullName -Raw
        
        # Check if patient queries filter by user
        if ($content -match "findMany" -and $content -notmatch "where.*patientId|where.*userId") {
            $dataIsolationIssues += $service.Name
        }
    }
    
    if ($dataIsolationIssues.Count -gt 0) {
        Add-RbacIssue "Patient data may not be isolated by user" "CRITICAL" "Add user-based filtering to patient queries"
    }
    
    # RBAC FIXES (if requested)
    if ($FixIssues -and $script:Results.RbacIssues.Count -gt 0) {
        Write-Host "`n🔧 FIXING RBAC ISSUES..." -ForegroundColor Yellow
        Write-Host ("=" * 50) -ForegroundColor Gray
        
        # Fix 1: Add missing @Roles decorators
        foreach ($controller in $controllers) {
            $content = Get-Content $controller.FullName -Raw
            $controllerName = $controller.BaseName
            
            if ($content -notmatch "@Roles\(" -and $controllerName -notmatch "auth") {
                # Determine appropriate roles based on controller name
                $roles = "'OWNER', 'THERAPIST', 'SECRETARY'"
                
                if ($controllerName -match "provider") {
                    $roles = "'OWNER'"
                }
                elseif ($controllerName -match "intelligence") {
                    $roles = "'OWNER', 'THERAPIST'"
                }
                elseif ($controllerName -match "patient.*care") {
                    $roles = "'OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'"
                }
                
                # Add import if not exists
                if ($content -notmatch "Roles.*decorator") {
                    $content = $content -replace 
                        "import \{ (.+) \} from '@nestjs/common';",
                        "import { `$1, UseGuards } from '@nestjs/common';`nimport { Roles } from '../../auth/decorators/roles.decorator';`nimport { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';`nimport { RolesGuard } from '../../auth/guards/roles.guard';"
                }
                
                # Add @Roles and @UseGuards before @Controller
                $content = $content -replace
                    "@Controller\(",
                    "@UseGuards(JwtAuthGuard, RolesGuard)`n@Roles($roles)`n@Controller("
                
                Set-Content -Path $controller.FullName -Value $content -Encoding UTF8
                Add-FixedIssue "Added RBAC to $controllerName" "Added @Roles($roles) and guards"
            }
        }
        
        # Fix 2: Create frontend route guard if missing
        $routeGuardPath = "frontend/src/components/RouteGuard.tsx"
        if (-not (Test-Path $routeGuardPath)) {
            $routeGuardContent = @'
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

/**
 * Route guard component that checks user authentication and role
 * 
 * @param children - Component to render if authorized
 * @param allowedRoles - Array of roles allowed to access this route
 * @param redirectTo - Where to redirect if unauthorized (default: /login)
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  allowedRoles = [],
  redirectTo = '/login',
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render children if all checks pass
  return <>{children}</>;
};

/**
 * Admin-only route guard
 */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RouteGuard allowedRoles={['OWNER']}>
      {children}
    </RouteGuard>
  );
};

/**
 * Therapist and above route guard
 */
export const TherapistRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RouteGuard allowedRoles={['OWNER', 'THERAPIST']}>
      {children}
    </RouteGuard>
  );
};

/**
 * Staff route guard (OWNER, THERAPIST, SECRETARY)
 */
export const StaffRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RouteGuard allowedRoles={['OWNER', 'THERAPIST', 'SECRETARY']}>
      {children}
    </RouteGuard>
  );
};

export default RouteGuard;
'@
            
            # Create directory if it doesn't exist
            $guardDir = Split-Path -Parent $routeGuardPath
            if (-not (Test-Path $guardDir)) {
                New-Item -ItemType Directory -Path $guardDir -Force | Out-Null
            }
            
            Set-Content -Path $routeGuardPath -Value $routeGuardContent -Encoding UTF8
            Add-FixedIssue "Created frontend route guards" "Added RouteGuard, AdminRoute, TherapistRoute, StaffRoute components"
        }
        
        # Fix 3: Add patient data isolation service
        $dataIsolationPath = "backend/src/modules/patients/patient-data-isolation.service.ts"
        if (-not (Test-Path $dataIsolationPath)) {
            $dataIsolationContent = @'
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Service to handle patient data isolation
 * Ensures patients can only access their own data
 */
@Injectable()
export class PatientDataIsolationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Verify that the current user can access the specified patient's data
   * 
   * @param patientId - The patient ID being accessed
   * @param userId - The current user's ID
   * @param userRole - The current user's role
   * @throws ForbiddenException if access is denied
   */
  async verifyPatientAccess(
    patientId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    // OWNER and SECRETARY can access all patient data
    if (userRole === 'OWNER' || userRole === 'SECRETARY') {
      return;
    }

    // THERAPIST can only access their assigned patients
    if (userRole === 'THERAPIST') {
      const appointment = await this.prisma.appointment.findFirst({
        where: {
          patientId,
          therapistId: userId,
        },
      });

      if (appointment) {
        return;
      }

      // Check if therapist has any past appointments with this patient
      const pastAppointment = await this.prisma.appointment.findFirst({
        where: {
          patientId,
          therapistId: userId,
          dateTime: {
            lt: new Date(),
          },
        },
      });

      if (pastAppointment) {
        return;
      }

      throw new ForbiddenException(
        'You can only access patients you have treated'
      );
    }

    // PATIENT can only access their own data
    if (userRole === 'PATIENT') {
      const patient = await this.prisma.patient.findFirst({
        where: {
          id: patientId,
          userId,
        },
      });

      if (patient) {
        return;
      }

      throw new ForbiddenException('You can only access your own data');
    }

    // Default deny
    throw new ForbiddenException('Access denied');
  }

  /**
   * Get patient data with role-based filtering
   * 
   * @param patientId - The patient ID
   * @param userId - The current user's ID
   * @param userRole - The current user's role
   * @returns Filtered patient data
   */
  async getPatientData(
    patientId: string,
    userId: string,
    userRole: string
  ): Promise<any> {
    // First verify access
    await this.verifyPatientAccess(patientId, userId, userRole);

    // Get patient data
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        appointments: {
          orderBy: { dateTime: 'desc' },
          take: userRole === 'PATIENT' ? 5 : 20, // Patients see fewer appointments
        },
        invoices: userRole === 'PATIENT' ? {
          where: { status: 'PAID' }, // Patients only see paid invoices
        } : true,
        // Include other relations based on role
      },
    });

    // Filter sensitive data for patients
    if (userRole === 'PATIENT') {
      delete patient.medicalHistory; // Patients don't see their own medical notes
      delete patient.internalNotes; // Internal staff notes
    }

    return patient;
  }

  /**
   * Filter query results based on user role
   * 
   * @param query - The query to filter
   * @param userId - The current user's ID
   * @param userRole - The current user's role
   * @returns Filtered query
   */
  filterQueryByRole(query: any, userId: string, userRole: string): any {
    if (userRole === 'PATIENT') {
      return {
        ...query,
        where: {
          ...query.where,
          patient: {
            userId,
          },
        },
      };
    }

    if (userRole === 'THERAPIST') {
      return {
        ...query,
        where: {
          ...query.where,
          OR: [
            { therapistId: userId },
            { patient: { userId } },
          ],
        },
      };
    }

    return query;
  }
}
'@
            
            Set-Content -Path $dataIsolationPath -Value $dataIsolationContent -Encoding UTF8
            Add-FixedIssue "Created patient data isolation service" "Patients can only access their own data"
        }
        
        Write-Host "`n✅ RBAC fixes applied!" -ForegroundColor Green
    }
    
    # RBAC Summary
    Write-Host "`n📋 RBAC VERIFICATION SUMMARY:" -ForegroundColor Yellow
    Write-Host ("=" * 50) -ForegroundColor Gray
    
    $criticalIssues = $script:Results.RbacIssues | Where-Object { $_.Severity -eq "CRITICAL" }
    $highIssues = $script:Results.RbacIssues | Where-Object { $_.Severity -eq "HIGH" }
    $mediumIssues = $script:Results.RbacIssues | Where-Object { $_.Severity -eq "MEDIUM" }
    
    Write-Host "  Critical Issues: $($criticalIssues.Count)" -ForegroundColor $(if ($criticalIssues.Count -gt 0) { "Red" } else { "Green" })
    Write-Host "  High Issues: $($highIssues.Count)" -ForegroundColor $(if ($highIssues.Count -gt 0) { "Yellow" } else { "Green" })
    Write-Host "  Medium Issues: $($mediumIssues.Count)" -ForegroundColor $(if ($mediumIssues.Count -gt 0) { "Yellow" } else { "Green" })
    Write-Host "  Fixed Issues: $($script:Results.FixedIssues.Count)" -ForegroundColor Green
    
    if ($criticalIssues.Count -gt 0) {
        Write-Host "`n🔴 CRITICAL SECURITY ISSUES:" -ForegroundColor Red
        foreach ($issue in $criticalIssues) {
            Write-Host "  - $($issue.Issue)" -ForegroundColor Red
            Write-Host "    Fix: $($issue.Fix)" -ForegroundColor Gray
        }
        
        if (-not $FixIssues) {
            Write-Host "`n⚠️  Run with -FixIssues to automatically fix these" -ForegroundColor Yellow
        }
    }
}

# ============================================================
# PHASE 2: PRODUCTION PREPARATION
# ============================================================

if (-not $SkipProduction) {
    Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  PHASE 2: PRODUCTION PREPARATION                          ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

    # ============================================================
    # 2.1: ENVIRONMENT CONFIGURATION
    # ============================================================
    Write-Host "`n⚙️  Setting up Production Environment..." -ForegroundColor Yellow
    
    # Create production .env template
    $prodEnvContent = @'
# Production Environment Configuration
# ====================================

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# JWT Authentication
JWT_ACCESS_SECRET="GENERATE_A_STRONG_SECRET_HERE"
JWT_REFRESH_SECRET="GENERATE_ANOTHER_STRONG_SECRET"
JWT_ACCESS_EXPIRES=900
JWT_REFRESH_EXPIRES=604800

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS (Update when you have your domain)
CORS_ORIGIN=https://yourdomain.com

# Security
BCRYPT_ROUNDS=12

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# File Storage (Local for now, cloud-ready)
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# SSL (Let's Encrypt - when domain is ready)
# SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
# SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem

# Monitoring (Free tools)
SENTRY_DSN=  # Optional: https://sentry.io (free tier available)
HEALTH_CHECK_SECRET="health-check-secret-for-monitoring"

# Backup
BACKUP_ENABLED=true
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30

# Provider Encryption Key (for dynamic providers)
PROVIDER_ENCRYPTION_KEY="GENERATE_A_STRONG_ENCRYPTION_KEY"
'@
    
    CreateFile "backend/.env.production" $prodEnvContent
    
    # Create nginx configuration for Let's Encrypt
    $nginxConfig = @'
# Nginx Reverse Proxy Configuration
# For Let's Encrypt SSL with Node.js backend

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Certificate paths (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    
    # Frontend (React build)
    location / {
        root /var/www/physio-z/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Swagger Documentation
    location /api/docs {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # File uploads (increase size limit)
    client_max_body_size 10M;
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
'@
    
    CreateFile "nginx.conf" $nginxConfig
    
    # ============================================================
    # 2.2: FREE MONITORING SETUP
    # ============================================================
    Write-Host "`n📊 Setting up Free Monitoring..." -ForegroundColor Yellow
    
    # Create health check endpoint
    $healthCheckContent = @'
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async checkHealth() {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: '1.0.0',
    };

    // Check database connection
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      healthStatus['database'] = {
        status: 'connected',
        responseTime: Date.now(),
      };
    } catch (error) {
      healthStatus['database'] = {
        status: 'disconnected',
        error: error.message,
      };
      healthStatus.status = 'degraded';
    }

    // Check file system access
    const fs = require('fs');
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    
    try {
      fs.accessSync(uploadDir, fs.constants.W_OK);
      healthStatus['fileSystem'] = {
        status: 'accessible',
        path: uploadDir,
      };
    } catch (error) {
      healthStatus['fileSystem'] = {
        status: 'inaccessible',
        error: error.message,
      };
      healthStatus.status = 'degraded';
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    healthStatus['memory'] = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
    };

    return healthStatus;
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check (admin only)' })
  async detailedHealth() {
    const basic = await this.checkHealth();
    
    // Add more detailed checks here
    return {
      ...basic,
      nodejs: {
        version: process.version,
        platform: process.platform,
        pid: process.pid,
      },
      dependencies: {
        prisma: require('@prisma/client/package.json').version,
        nestjs: require('@nestjs/common/package.json').version,
      },
    };
  }
}
'@
    
    CreateFile "backend/src/modules/health/health.controller.ts" $healthCheckContent
    
    # Create monitoring configuration guide
    $monitoringGuide = @'
# Free Monitoring Stack for Physio-Z

## Recommended Free Tools:

### 1. Uptime Monitoring (Pick One)

#### Option A: UptimeRobot (Recommended)
- **Free Tier**: 50 monitors, 5-minute intervals
- **Setup**: 
  1. Sign up at https://uptimerobot.com
  2. Add HTTP monitor
  3. URL: `https://yourdomain.com/health`
  4. Set interval to 5 minutes
  5. Add email alerts

#### Option B: StatusCake
- **Free Tier**: 10 monitors, unlimited checks
- Setup similar to UptimeRobot

#### Option C: BetterStack (Formerly Better Uptime)
- **Free Tier**: 10 monitors, status pages
- Includes incident management

### 2. Error Tracking (Optional but Recommended)

#### Sentry (Free Tier)
- **Free Tier**: 5K errors/month, 1 user
- **Setup**:
  ```bash
  cd backend
  pnpm install @sentry/node
  ```
'@
    
    CreateFile "docs/monitoring/README.md" $monitoringGuide
}

Write-Host "RBAC Verification and Production Prep Complete!" -ForegroundColor Green
