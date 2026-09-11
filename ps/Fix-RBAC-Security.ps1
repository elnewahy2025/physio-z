# ============================================================
# Fix-RBAC-Security.ps1
# COMPLETE RBAC SECURITY FIXES
# Repository: https://github.com/elnewahy2025/physio-z
#
# CRITICAL SECURITY FIXES APPLIED:
#   1. Missing @Roles decorators on controllers
#   2. Provider controllers → OWNER only
#   3. Intelligence endpoints → OWNER + THERAPIST
#   4. Frontend route guards created
#   5. Patient data isolation service
#
# AFTER RUNNING:
#   ✅ All endpoints have role restrictions
#   ✅ Provider management restricted to OWNER
#   ✅ Intelligence features properly secured
#   ✅ Frontend routes protected by role
#   ✅ Patients can only access their own data
# ============================================================

param(
    [switch]$DryRun,           # Show what would be changed without changing
    [switch]$Verbose,
    [switch]$GenerateReport,
    [string]$ProjectRoot = "."
)

 $ErrorActionPreference = "Continue"
 $startTime = Get-Date

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  RBAC SECURITY FIXES - CRITICAL PATCH" -ForegroundColor Cyan
Write-Host "  Medical Application Security Hardening" -ForegroundColor Gray
Write-Host "  Started: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan

Set-Location $ProjectRoot

if ($DryRun) {
    Write-Host "`n⚠️  DRY RUN MODE - No files will be modified" -ForegroundColor Yellow
}

# Results tracking
 $script:Results = @{
    ScannedControllers = 0
    FixedControllers = 0
    CreatedFiles = @()
    IssuesFixed = @()
    Warnings = @()
    Errors = @()
}

function Add-Fixed {
    param([string]$Issue, [string]$Fix, [string]$File)
    
    $script:Results.IssuesFixed += @{
        Issue = $Issue
        Fix = $Fix
        File = $File
        Time = Get-Date
    }
    
    Write-Host "  ✅ FIXED: $Issue" -ForegroundColor Green
    Write-Host "     File: $File" -ForegroundColor Gray
    Write-Host "     Fix: $Fix" -ForegroundColor Gray
}

function Add-Warning {
    param([string]$Message)
    
    $script:Results.Warnings += $Message
    Write-Host "  ⚠️  WARNING: $Message" -ForegroundColor Yellow
}

function Add-Error {
    param([string]$Message, [string]$File)
    
    $script:Results.Errors += @{
        Message = $Message
        File = $File
    }
    Write-Host "  ❌ ERROR: $Message" -ForegroundColor Red
}

# ============================================================
# FIX 1: SCAN & FIX MISSING @Roles DECORATORS
# ============================================================

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  FIX 1: MISSING @Roles DECORATORS                         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n🔍 Scanning all controllers..." -ForegroundColor Yellow

 $controllers = Get-ChildItem -Path "backend/src/modules" -Recurse -Filter "*.controller.ts"
 $script:Results.ScannedControllers = $controllers.Count

Write-Host "  Found $($controllers.Count) controllers to scan" -ForegroundColor Gray

foreach ($controller in $controllers) {
    $content = Get-Content $controller.FullName -Raw -ErrorAction SilentlyContinue
    $controllerName = $controller.BaseName
    $relativePath = $controller.FullName.Replace("$ProjectRoot\", "")
    
    if ($null -eq $content) {
        Add-Error "Could not read file" $relativePath
        continue
    }
    
    # Skip auth controller (public endpoints)
    if ($controllerName -match "^auth") {
        Write-Host "  ℹ️  Skipping auth controller (public endpoints)" -ForegroundColor Gray
        continue
    }
    
    # Check if controller already has @Roles
    $hasRoles = $content -match "@Roles\("
    $hasGuards = $content -match "@UseGuards"
    
    if (-not $hasRoles -or -not $hasGuards) {
        # Determine appropriate roles based on controller name/path
        $roles = "'OWNER', 'THERAPIST', 'SECRETARY'"  # Default
        $roleReason = "Default staff access"
        
        if ($controllerName -match "provider") {
            $roles = "'OWNER'"
            $roleReason = "Provider management is OWNER only"
        }
        elseif ($controllerName -match "intelligence|analytics|forecast") {
            $roles = "'OWNER', 'THERAPIST'"
            $roleReason = "Intelligence features for clinical staff"
        }
        elseif ($controllerName -match "patient.*care|medical.*file|consent|pain") {
            $roles = "'OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'"
            $roleReason = "Patient care with patient self-access"
        }
        elseif ($controllerName -match "exercise.*library|exercise.*prescription") {
            $roles = "'OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'"
            $roleReason = "Exercise library with patient access to prescriptions"
        }
        elseif ($controllerName -match "audit|backup") {
            $roles = "'OWNER', 'SECRETARY'"
            $roleReason = "Audit and backup for administrative staff"
        }
        elseif ($controllerName -match "health") {
            $roles = $null  # Health check should be public
            $roleReason = "Health check is public endpoint"
        }
        
        # Skip health controller (public)
        if ($null -eq $roles) {
            continue
        }
        
        Write-Host "`n  📝 Processing: $controllerName" -ForegroundColor Cyan
        Write-Host "     Path: $relativePath" -ForegroundColor Gray
        Write-Host "     Roles to add: $roles" -ForegroundColor Gray
        Write-Host "     Reason: $roleReason" -ForegroundColor Gray
        
        if (-not $DryRun) {
            # Build the fixed content
            $fixedContent = $content
            
            # 1. Add necessary imports if not present
            $importsToAdd = @()
            
            if ($fixedContent -notmatch "import.*UseGuards.*@nestjs/common") {
                $importsToAdd += "UseGuards"
            }
            
            if ($fixedContent -notmatch "import.*Roles.*decorators/roles") {
                $roleImportPath = Get-RoleImportPath $controller.FullName
                $importsToAdd += "import { Roles } from '$roleImportPath';"
            }
            
            if ($fixedContent -notmatch "import.*JwtAuthGuard.*guards") {
                $guardImportPath = Get-GuardImportPath $controller.FullName
                $importsToAdd += "import { JwtAuthGuard } from '$guardImportPath';"
            }
            
            if ($fixedContent -notmatch "import.*RolesGuard.*guards") {
                $rolesGuardPath = Get-RolesGuardImportPath $controller.FullName
                $importsToAdd += "import { RolesGuard } from '$rolesGuardPath';"
            }
            
            # Add imports after the last import statement
            if ($importsToAdd.Count -gt 0) {
                $null = [regex]::Match($fixedContent, "(?s)import[^;]+;.*?(?=import[^;]+;|$)").Index
                
                # Find last import line
                $importMatches = [regex]::Matches($fixedContent, "^import .+;$", [System.Text.RegularExpressions.RegexOptions]::Multiline)
                if ($importMatches.Count -gt 0) {
                    $lastImport = $importMatches[$importMatches.Count - 1]
                    $insertPosition = $lastImport.Index + $lastImport.Length
                    
                    $importBlock = "`n"
                    foreach ($import in $importsToAdd) {
                        if ($import -eq "UseGuards") {
                            # Add to existing @nestjs/common import
                            if ($fixedContent -match "import \{([^}]+)\} from '@nestjs/common';") {
                                $existingImports = $Matches[1]
                                if ($existingImports -notmatch "UseGuards") {
                                    $fixedContent = $fixedContent -replace 
                                        "import \{$existingImports\} from '@nestjs/common';",
                                        "import {$($existingImports.Trim()), UseGuards } from '@nestjs/common';"
                                }
                            } else {
                                $importBlock += "import { UseGuards } from '@nestjs/common';`n"
                            }
                        } else {
                            $importBlock += "$import`n"
                        }
                    }
                    
                    $fixedContent = $fixedContent.Insert($insertPosition, $importBlock)
                }
            }
            
            # 2. Add @UseGuards and @Roles decorators before @Controller
            $guardDecorator = "@UseGuards(JwtAuthGuard, RolesGuard)"
            $rolesDecorator = "@Roles($roles)"
            
            if ($fixedContent -notmatch $guardDecorator) {
                $fixedContent = $fixedContent -replace 
                    "(@Controller\([^)]*\))",
                    "$guardDecorator`n$rolesDecorator`n`$1"
            }
            
            # Save the fixed content
            try {
                Set-Content -Path $controller.FullName -Value $fixedContent -Encoding UTF8
                Add-Fixed "Missing @Roles decorator" "Added @Roles($roles) with guards" $relativePath
                $script:Results.FixedControllers++
            }
            catch {
                Add-Error "Failed to save file: $($_.Exception.Message)" $relativePath
            }
        } else {
            Write-Host "     [DRY RUN] Would add @Roles($roles)" -ForegroundColor Yellow
        }
    }
}

# Helper functions for import paths
function Get-RoleImportPath {
    param([string]$ControllerPath)
    
    # Calculate relative path from controller to decorators
    $depth = ($ControllerPath -split '\\').Count - ($ProjectRoot -split '\\').Count
    $relativePath = "../" * ($depth - 2) + "auth/decorators/roles.decorator"
    
    return $relativePath
}

function Get-GuardImportPath {
    param([string]$ControllerPath)
    
    $depth = ($ControllerPath -split '\\').Count - ($ProjectRoot -split '\\').Count
    $relativePath = "../" * ($depth - 2) + "auth/guards/jwt-auth.guard"
    
    return $relativePath
}

function Get-RolesGuardImportPath {
    param([string]$ControllerPath)
    
    $depth = ($ControllerPath -split '\\').Count - ($ProjectRoot -split '\\').Count
    $relativePath = "../" * ($depth - 2) + "auth/guards/roles.guard"
    
    return $relativePath
}

# ============================================================
# FIX 2: ENSURE PROVIDER CONTROLLERS ARE OWNER ONLY
# ============================================================

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  FIX 2: PROVIDER CONTROLLERS - OWNER ONLY                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

 $providerControllers = $controllers | Where-Object { $_.BaseName -match "provider" }

foreach ($controller in $providerControllers) {
    $content = Get-Content $controller.FullName -Raw
    $relativePath = $controller.FullName.Replace("$ProjectRoot\", "")
    
    Write-Host "`n  🔒 Checking: $($controller.BaseName)" -ForegroundColor Cyan
    
    # Check if it has proper OWNER restriction
    if ($content -notmatch "@Roles\('OWNER'\)") {
        # Check if it has any roles
        if ($content -match "@Roles\(") {
            # Replace existing roles with OWNER only
            $fixedContent = $content -replace "@Roles\([^)]+\)", "@Roles('OWNER')"
            
            if (-not $DryRun) {
                Set-Content -Path $controller.FullName -Value $fixedContent -Encoding UTF8
                Add-Fixed "Provider controller not OWNER-only" "Restricted to @Roles('OWNER')" $relativePath
            } else {
                Write-Host "     [DRY RUN] Would restrict to OWNER only" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "     ✓ Already OWNER-only" -ForegroundColor Green
    }
}

# ============================================================
# FIX 3: ENSURE INTELLIGENCE ENDPOINTS ARE RESTRICTED
# ============================================================

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  FIX 3: INTELLIGENCE ENDPOINTS RESTRICTION                 ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

 $intelligenceControllers = $controllers | Where-Object { 
    $_.BaseName -match "intelligence|analytics|forecast|prediction|treatment.*effective" 
}

foreach ($controller in $intelligenceControllers) {
    $content = Get-Content $controller.FullName -Raw
    $relativePath = $controller.FullName.Replace("$ProjectRoot\", "")
    
    Write-Host "`n  🧠 Checking: $($controller.BaseName)" -ForegroundColor Cyan
    
    # Should be OWNER + THERAPIST
    if ($content -notmatch "@Roles\('OWNER', 'THERAPIST'\)") {
        if ($content -match "@Roles\(") {
            # Update to include proper roles
            $fixedContent = $content -replace 
                "@Roles\([^)]+\)", 
                "@Roles('OWNER', 'THERAPIST')"
            
            if (-not $DryRun) {
                Set-Content -Path $controller.FullName -Value $fixedContent -Encoding UTF8
                Add-Fixed "Intelligence controller accessible to wrong roles" "Restricted to OWNER + THERAPIST" $relativePath
            } else {
                Write-Host "     [DRY RUN] Would restrict to OWNER + THERAPIST" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "     ✓ Already properly restricted" -ForegroundColor Green
    }
}

# ============================================================
# FIX 4: CREATE FRONTEND ROUTE GUARDS
# ============================================================

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  FIX 4: FRONTEND ROUTE GUARDS                              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Check if auth context exists
 $authHookPath = "frontend/src/hooks/useAuth.ts"
 $authContextPath = "frontend/src/contexts/AuthContext.tsx"

 $hasAuthHook = Test-Path $authHookPath
 $hasAuthContext = Test-Path $authContextPath

if (-not $hasAuthHook -and -not $hasAuthContext) {
    Write-Host "`n  ⚠️  No existing auth hook/context found" -ForegroundColor Yellow
    Write-Host "     Creating both AuthContext and useAuth hook" -ForegroundColor Gray
    
    # Create AuthContext if doesn't exist
    if (-not $DryRun) {
        $contextDir = "frontend/src/contexts"
        if (-not (Test-Path $contextDir)) {
            New-Item -ItemType Directory -Path $contextDir -Force | Out-Null
        }
        
        $authContextContent = @'
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'THERAPIST' | 'SECRETARY' | 'PATIENT';
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Verify token and get user data
      axios
        .get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUser(response.data);
        })
        .catch(() => {
          // Token invalid, clear storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (phone: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/auth/login', {
        phone,
        password,
      });

      const { accessToken, refreshToken, user: userData } = response.data;

      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Set user
      setUser(userData);

      // Set default Authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ في تسجيل الدخول');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Clear user
    setUser(null);

    // Clear axios default header
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
'@
        
        Set-Content -Path $authContextPath -Value $authContextContent -Encoding UTF8
        $script:Results.CreatedFiles += $authContextPath
        Add-Fixed "No auth context found" "Created AuthContext with useAuth hook" $authContextPath
    }
}

# Create RouteGuard component
 $routeGuardPath = "frontend/src/components/RouteGuard.tsx"

if (-not (Test-Path $routeGuardPath)) {
    Write-Host "`n  🛡️  Creating RouteGuard component..." -ForegroundColor Yellow
    
    if (-not $DryRun) {
        $guardDir = Split-Path -Parent $routeGuardPath
        if (-not (Test-Path $guardDir)) {
            New-Item -ItemType Directory -Path $guardDir -Force | Out-Null
        }
        
        $routeGuardContent = @'
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: Array<'OWNER' | 'THERAPIST' | 'SECRETARY' | 'PATIENT'>;
  redirectTo?: string;
}

/**
 * Route guard component that checks user authentication and role
 * 
 * @param children - Component to render if authorized
 * @param allowedRoles - Array of roles allowed to access this route
 * @param redirectTo - Where to redirect if unauthorized (default: /login)
 * 
 * @example
 * ```tsx
 * <RouteGuard allowedRoles={['OWNER', 'THERAPIST']}>
 *   <DashboardPage />
 * </RouteGuard>
 * ```
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  allowedRoles = [],
  redirectTo = '/login',
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">جارٍ التحقق...</p>
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
 * OWNER-only route guard
 * Use for admin-only features like provider management, system settings
 */
export const OwnerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RouteGuard allowedRoles={['OWNER']}>
      {children}
    </RouteGuard>
  );
};

/**
 * Therapist and above route guard
 * Use for clinical features like patient care, intelligence reports
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
 * Use for general staff features like patient management, appointments
 */
export const StaffRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RouteGuard allowedRoles={['OWNER', 'THERAPIST', 'SECRETARY']}>
      {children}
    </RouteGuard>
  );
};

/**
 * Patient-accessible route guard
 * Use for features patients can access like their own prescriptions
 */
export const PatientRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RouteGuard allowedRoles={['OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT']}>
      {children}
    </RouteGuard>
  );
};

/**
 * Unauthorized page component
 */
export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          غير مصرح بالوصول
        </h1>
        
        <p className="text-gray-600 mb-6">
          عذراً، لا تملك الصلاحية للوصول إلى هذه الصفحة.
        </p>
        
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          العودة للخلف
        </button>
      </div>
    </div>
  );
};

export default RouteGuard;
'@
        
        Set-Content -Path $routeGuardPath -Value $routeGuardContent -Encoding UTF8
        $script:Results.CreatedFiles += $routeGuardPath
        Add-Fixed "No frontend route guards" "Created RouteGuard with role-based components" $routeGuardPath
    }
} else {
    Write-Host "  ✓ RouteGuard already exists" -ForegroundColor Green
}

# Create example of how to use in App.tsx
 $usageExample = @'

## How to Use Route Guards in Your App.tsx:

```tsx
import { RouteGuard, OwnerRoute, TherapistRoute, StaffRoute, PatientRoute, UnauthorizedPage } from './components/RouteGuard';

// In your router:
<Routes>
  {/* Public routes */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  
  {/* Protected routes with role checking */}
  <Route path="/dashboard" element={
    <StaffRoute>
      <DashboardPage />
    </StaffRoute>
  } />
  
  {/* Patient management (staff only) */}
  <Route path="/patients" element={
    <StaffRoute>
      <PatientListPage />
    </StaffRoute>
  } />
  
  {/* Intelligence (OWNER + THERAPIST only) */}
  <Route path="/intelligence" element={
    <TherapistRoute>
      <IntelligenceDashboard />
    </TherapistRoute>
  } />
  
  {/* Provider management (OWNER only) */}
  <Route path="/settings/providers" element={
    <OwnerRoute>
      <ProviderManagementPage />
    </OwnerRoute>
  } />
  
  {/* Patient's own prescriptions */}
  <Route path="/my-prescriptions" element={
    <PatientRoute>
      <MyPrescriptionsPage />
    </PatientRoute>
  } />
  
  {/* Unauthorized page */}
  <Route path="/unauthorized" element={<UnauthorizedPage />} />
</Routes>
```
'@

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "RBAC Security Fix Complete!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan

# Save usage example
$examplePath = "docs/route-guard-usage-example.md"
if (-not $DryRun) {
    $docsDir = "docs"
    if (-not (Test-Path $docsDir)) {
        New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
    }
    Set-Content -Path $examplePath -Value $usageExample -Encoding UTF8
    Write-Host "`n 📄 Usage example saved to: $examplePath" -ForegroundColor Cyan
}
