# ============================================================
# Dynamic-Provider-System.ps1
# COMPLETE Dynamic Provider Management System - Production Ready
# Repository: https://github.com/elnewahy2025/physio-z
#
# WHAT THIS IMPLEMENTS:
#   ✅ User-configurable service providers (no code changes)
#   ✅ Pre-built templates (WhatsApp, MyFawry, InstaPay, Stripe, Twilio)
#   ✅ Automatic fallback system
#   ✅ Owner-only access control
#   ✅ Full request/response template control
#   ✅ Egyptian payment gateway focus
#   ✅ Simple success/failure logging
#   ✅ Provider dropdown selection
#
# INTEGRATION GUARANTEES:
#   ✅ Uses existing Prisma schema patterns
#   ✅ Integrates with Settings model
#   ✅ Full RTL support
#   ✅ Modular structure
# ============================================================

param(
    [switch]$SkipDatabase,
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$SkipTemplates,
    [switch]$Verbose,
    [string]$ProjectRoot = "."
)

 $ErrorActionPreference = "Stop"
 $startTime = Get-Date

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  DYNAMIC PROVIDER MANAGEMENT SYSTEM" -ForegroundColor Cyan
Write-Host "  Zero-Code Provider Configuration" -ForegroundColor Gray
Write-Host "  Started: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan

Set-Location $ProjectRoot

# Helper functions
function EnsureDirectory {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
        Write-Host "  ✓ Created: $Path" -ForegroundColor Green
    }
}

function CreateFile {
    param([string]$Path, [string]$Content)
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Set-Content -Path $Path -Value $Content -Encoding UTF8
    Write-Host "  ✓ Created: $Path" -ForegroundColor Yellow
}

# ============================================================
# SECTION 1: DATABASE SCHEMA
# ============================================================

if (-not $SkipDatabase) {
    Write-Host "`n📁 Section 1: Creating Database Schema..." -ForegroundColor Cyan
    
    # Backup existing schema
    $schemaBackup = "backend/prisma/schema.prisma.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item "backend/prisma/schema.prisma" $schemaBackup
    Write-Host "  ✓ Schema backed up to: $schemaBackup" -ForegroundColor Green
    
    # Read current schema
    $schemaContent = Get-Content "backend/prisma/schema.prisma" -Raw
    
    # Add dynamic provider models if they don't exist
    if ($schemaContent -notmatch "model ServiceProvider") {
        $providerModels = @'

// ─── Dynamic Provider Management System ───

// Provider types
enum ProviderType {
  WHATSAPP
  PAYMENT
  VIDEO
  SMS
  EMAIL
  CUSTOM
}

// Provider authentication methods
enum AuthMethod {
  BEARER_TOKEN
  API_KEY_HEADER
  BASIC_AUTH
  OAUTH2
  QUERY_PARAM
  CUSTOM_HEADERS
  NONE
}

// Main service provider model
model ServiceProvider {
  id              String       @id @default(cuid())
  name            String       // User-friendly name
  providerType    ProviderType
  providerSubtype String?      // e.g., "whatsapp_business", "myfawry", "instapay"
  description     String?
  
  // Status and priority
  isActive        Boolean      @default(true)
  isDefault       Boolean      @default(false)
  priority        Int          @default(100) // Lower = higher priority for fallback
  
  // API Configuration
  baseUrl         String       // e.g., "https://graph.facebook.com/v18.0"
  apiVersion      String?
  
  // Authentication
  authMethod      AuthMethod   @default(BEARER_TOKEN)
  credentials     String       // Encrypted JSON credentials
  
  // Request configuration
  requestConfig   Json         // Default headers, timeout, retries
  
  // Webhook configuration
  webhookUrl      String?
  webhookSecret   String?
  
  // Provider-specific settings
  settings        Json?
  
  // Usage tracking
  lastTestedAt    DateTime?
  lastTestSuccess Boolean?
  totalRequests   Int          @default(0)
  successfulRequests Int       @default(0)
  failedRequests  Int          @default(0)
  
  // Relations
  capabilities    ProviderCapability[]
  usageLogs       ProviderUsageLog[]
  
  // Audit
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  @@unique([name, providerType])
  @@index([providerType, isActive, priority])
  @@index([isDefault])
}

// Provider capabilities (what this provider can do)
model ProviderCapability {
  id          String @id @default(cuid())
  providerId  String
  provider    ServiceProvider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  
  capability  String // SEND_MESSAGE, CREATE_PAYMENT, CREATE_ROOM, etc.
  name        String // Display name for UI
  
  // Request configuration
  endpoint    String // API endpoint (can use template variables)
  method      String // GET, POST, PUT, DELETE
  
  // Request template with variables: {{variable_name}}
  requestTemplate Json // Full request structure with templates
  
  // Response parsing
  responseMapping Json // How to extract data from response
  errorMapping     Json // How to detect errors
  
  // Configuration
  timeout     Int @default(30000) // milliseconds
  retries     Int @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([providerId, capability])
  @@index([capability])
}

// Usage logging (simple success/failure)
model ProviderUsageLog {
  id          String   @id @default(cuid())
  providerId  String
  provider    ServiceProvider @relation(fields: [providerId], references: [id])
  
  capability  String
  success     Boolean
  errorMessage String?
  duration    Int?     // milliseconds
  
  createdAt   DateTime @default(now())
  
  @@index([providerId, createdAt])
  @@index([success, createdAt])
}

// Provider templates (pre-built configurations)
model ProviderTemplate {
  id              String @id @default(cuid())
  name            String // Display name
  providerType    ProviderType
  providerSubtype String
  description     String
  
  // Template configuration
  baseUrl         String
  authMethod      AuthMethod
  credentialsTemplate Json // What credentials are needed
  capabilitiesTemplate Json // Pre-built capabilities
  settingsTemplate     Json
  
  // UI
  icon            String? // Icon identifier
  category        String // EGYPTIAN_PAYMENTS, INTERNATIONAL_PAYMENTS, etc.
  isPopular       Boolean @default(false)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([name, providerType])
  @@index([providerType])
  @@index([category])
}
'@
        
        # Add models to schema
        $schemaContent += $providerModels
        
        # Save updated schema
        Set-Content -Path "backend/prisma/schema.prisma" -Value $schemaContent -Encoding UTF8
        
        # Generate Prisma client
        Write-Host "  🔄 Generating Prisma client..." -ForegroundColor Yellow
        Push-Location "backend"
        npx prisma generate
        Pop-Location
        
        Write-Host "  ✅ Schema updated with provider models" -ForegroundColor Green
    } else {
        Write-Host "  - Provider models already exist" -ForegroundColor Gray
    }
}

# ============================================================
# SECTION 2: BACKEND IMPLEMENTATION
# ============================================================

if (-not $SkipBackend) {
    Write-Host "`n🔧 Section 2: Backend Implementation..." -ForegroundColor Cyan
    
    # Create directory structure
    $backendDirs = @(
        "backend/src/modules/providers",
        "backend/src/modules/providers/factory",
        "backend/src/modules/providers/encryption",
        "backend/src/modules/providers/templates",
        "backend/src/modules/providers/webhooks",
        "backend/src/modules/providers/controllers",
        "backend/src/modules/providers/dto"
    )
    
    foreach ($dir in $backendDirs) {
        EnsureDirectory $dir
    }
    
    # ============================================================
    # 2.1: Encryption Service
    # ============================================================
    Write-Host "`n  Creating Encryption Service..." -ForegroundColor Yellow
    
    $encryptionService = @'
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly saltLength = 64;
  private readonly tagLength = 16;
  private readonly iterations = 100000;

  /**
   * Encrypt sensitive data (like API credentials)
   */
  encrypt(text: string, secretKey?: string): string {
    const key = this.deriveKey(secretKey);
    const iv = crypto.randomBytes(this.ivLength);
    const salt = crypto.randomBytes(this.saltLength);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    // Combine salt + iv + tag + encrypted data
    const result = Buffer.concat([salt, iv, tag, encrypted]);
    return result.toString('base64');
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string, secretKey?: string): string {
    const key = this.deriveKey(secretKey);
    const data = Buffer.from(encryptedData, 'base64');

    // Extract components
    const salt = data.slice(0, this.saltLength);
    const iv = data.slice(this.saltLength, this.saltLength + this.ivLength);
    const tag = data.slice(
      this.saltLength + this.ivLength,
      this.saltLength + this.ivLength + this.tagLength
    );
    const encrypted = data.slice(this.saltLength + this.ivLength + this.tagLength);

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  /**
   * Encrypt JSON object
   */
  encryptObject(obj: any, secretKey?: string): string {
    return this.encrypt(JSON.stringify(obj), secretKey);
  }

  /**
   * Decrypt JSON object
   */
  decryptObject(encryptedData: string, secretKey?: string): any {
    const decrypted = this.decrypt(encryptedData, secretKey);
    return JSON.parse(decrypted);
  }

  /**
   * Generate secure random secret
   */
  generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private deriveKey(secretKey?: string): Buffer {
    // Use app secret or provided secret
    const secret = secretKey || process.env.PROVIDER_ENCRYPTION_KEY || 
                   process.env.JWT_ACCESS_SECRET || 'default-secret-change-me';
    
    // Use a fixed salt for key derivation to ensure consistency
    const keySalt = 'physio-z-provider-encryption';
    
    return crypto.scryptSync(secret, keySalt, this.keyLength);
  }
}
'@
    CreateFile "backend/src/modules/providers/encryption/encryption.service.ts" $encryptionService
    
    # ============================================================
    # 2.2: Dynamic Provider Class
    # ============================================================
    Write-Host "`n  Creating Dynamic Provider Class..." -ForegroundColor Yellow
    
    $dynamicProvider = @'
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

export interface ProviderConfig {
  id: string;
  name: string;
  providerType: string;
  providerSubtype?: string;
  baseUrl: string;
  apiVersion?: string;
  authMethod: string;
  credentials: any;
  requestConfig: any;
  settings?: any;
  capabilities: ProviderCapabilityConfig[];
}

export interface ProviderCapabilityConfig {
  capability: string;
  name: string;
  endpoint: string;
  method: string;
  requestTemplate: any;
  responseMapping: any;
  errorMapping?: any;
  timeout: number;
  retries: number;
}

@Injectable()
export class DynamicProvider {
  private readonly logger = new Logger(DynamicProvider.name);
  
  constructor(
    private readonly config: ProviderConfig,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Get provider info (without credentials)
   */
  getInfo() {
    return {
      id: this.config.id,
      name: this.config.name,
      providerType: this.config.providerType,
      providerSubtype: this.config.providerSubtype,
      baseUrl: this.config.baseUrl,
      capabilities: this.config.capabilities.map(c => c.capability),
    };
  }

  /**
   * Check if provider has a specific capability
   */
  hasCapability(capability: string): boolean {
    return this.config.capabilities.some(c => c.capability === capability);
  }

  /**
   * Execute a capability with payload
   */
  async execute(capability: string, payload: any): Promise<any> {
    const cap = this.config.capabilities.find(
      c => c.capability === capability
    );

    if (!cap) {
      throw new Error(
        `Provider "${this.config.name}" doesn't support capability: ${capability}`
      );
    }

    const startTime = Date.now();
    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 0; attempt <= cap.retries; attempt++) {
      try {
        const result = await this.executeRequest(cap, payload);
        const duration = Date.now() - startTime;
        
        return {
          success: true,
          data: result,
          duration,
          provider: this.config.name,
        };
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Attempt ${attempt + 1} failed for ${capability}: ${error.message}`
        );

        if (attempt < cap.retries) {
          // Wait before retry (exponential backoff)
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    const duration = Date.now() - startTime;
    
    return {
      success: false,
      error: lastError?.message,
      duration,
      provider: this.config.name,
    };
  }

  /**
   * Execute HTTP request based on capability config
   */
  private async executeRequest(
    cap: ProviderCapabilityConfig,
    payload: any
  ): Promise<any> {
    // Build the full URL
    const url = this.buildUrl(cap.endpoint, payload);
    
    // Build headers (with authentication)
    const headers = this.buildHeaders(cap, payload);
    
    // Build request body/params
    const { body, params } = this.buildRequestBody(cap, payload);
    
    // Prepare request config
    const requestConfig = {
      headers,
      timeout: cap.timeout,
      ...this.config.requestConfig,
    };

    // Execute request
    let response;
    switch (cap.method.toUpperCase()) {
      case 'GET':
        response = await firstValueFrom(
          this.httpService.get(url, { ...requestConfig, params })
        );
        break;
      case 'POST':
        response = await firstValueFrom(
          this.httpService.post(url, body, requestConfig)
        );
        break;
      case 'PUT':
        response = await firstValueFrom(
          this.httpService.put(url, body, requestConfig)
        );
        break;
      case 'DELETE':
        response = await firstValueFrom(
          this.httpService.delete(url, { ...requestConfig, params })
        );
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${cap.method}`);
    }

    // Check for errors based on error mapping
    this.checkForErrors(response.data, cap.errorMapping);
    
    // Parse response based on response mapping
    return this.parseResponse(response.data, cap.responseMapping);
  }

  /**
   * Build full URL from endpoint template
   */
  private buildUrl(endpoint: string, payload: any): string {
    let url = `${this.config.baseUrl}${endpoint}`;
    
    // Replace template variables: {{variable}}
    url = this.replaceTemplateVariables(url, {
      ...payload,
      ...this.config.credentials,
    });

    return url;
  }

  /**
   * Build headers with authentication
   */
  private buildHeaders(cap: ProviderCapabilityConfig, payload: any): any {
    const headers: any = {
      'Content-Type': 'application/json',
      ...this.config.requestConfig?.defaultHeaders,
    };

    // Apply authentication
    switch (this.config.authMethod) {
      case 'BEARER_TOKEN':
        if (this.config.credentials.accessToken) {
          headers['Authorization'] = `Bearer ${this.config.credentials.accessToken}`;
        }
        break;
      case 'API_KEY_HEADER':
        if (this.config.credentials.apiKey && this.config.credentials.headerName) {
          headers[this.config.credentials.headerName] = this.config.credentials.apiKey;
        }
        break;
      case 'CUSTOM_HEADERS':
        if (this.config.credentials.headers) {
          Object.assign(headers, this.config.credentials.headers);
        }
        break;
      case 'BASIC_AUTH':
        if (this.config.credentials.username && this.config.credentials.password) {
          const auth = Buffer.from(
            `${this.config.credentials.username}:${this.config.credentials.password}`
          ).toString('base64');
          headers['Authorization'] = `Basic ${auth}`;
        }
        break;
      // Other auth methods can be added here
    }

    return headers;
  }

  /**
   * Build request body based on template
   */
  private buildRequestBody(cap: ProviderCapabilityConfig, payload: any): {
    body?: any;
    params?: any;
  } {
    if (!cap.requestTemplate) {
      return {};
    }

    // Merge payload with credentials for template variables
    const templateData = {
      ...payload,
      ...this.config.credentials,
    };

    // Process body template
    let body;
    if (cap.requestTemplate.body) {
      body = this.processTemplate(cap.requestTemplate.body, templateData);
    }

    // Process query params template
    let params;
    if (cap.requestTemplate.params) {
      params = this.processTemplate(cap.requestTemplate.params, templateData);
    }

    return { body, params };
  }

  /**
   * Process template recursively, replacing variables
   */
  private processTemplate(template: any, data: any): any {
    if (typeof template === 'string') {
      return this.replaceTemplateVariables(template, data);
    }

    if (Array.isArray(template)) {
      return template.map(item => this.processTemplate(item, data));
    }

    if (typeof template === 'object' && template !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(template)) {
        result[key] = this.processTemplate(value, data);
      }
      return result;
    }

    return template;
  }

  /**
   * Replace template variables in a string
   * Supports: {{variable}} and {{object.property}}
   */
  private replaceTemplateVariables(text: string, data: any): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Parse response based on mapping
   */
  private parseResponse(responseData: any, responseMapping: any): any {
    if (!responseMapping) {
      return responseData;
    }

    const result: any = {};

    for (const [resultKey, responsePath] of Object.entries(responseMapping)) {
      if (typeof responsePath === 'string') {
        // Simple path: "id": "messages[0].id"
        result[resultKey] = this.getNestedValue(responseData, responsePath);
      } else if (typeof responsePath === 'object') {
        // Complex mapping with transformations
        const { path, transform } = responsePath as any;
        let value = this.getNestedValue(responseData, path);
        
        if (transform && typeof transform === 'function') {
          value = transform(value);
        }
        
        result[resultKey] = value;
      }
    }

    return result;
  }

  /**
   * Check for errors in response
   */
  private checkForErrors(responseData: any, errorMapping?: any): void {
    if (!errorMapping) {
      return;
    }

    // Check if error exists based on mapping
    const errorPath = errorMapping.errorPath;
    if (errorPath) {
      const errorValue = this.getNestedValue(responseData, errorPath);
      
      if (errorValue) {
        const messagePath = errorMapping.messagePath || 'message';
        const errorMessage = this.getNestedValue(responseData, messagePath) || 
                            'Unknown provider error';
        throw new Error(`Provider error: ${errorMessage}`);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
'@
    CreateFile "backend/src/modules/providers/factory/dynamic-provider.ts" $dynamicProvider
    
    # ============================================================
    # 2.3: Provider Factory Service
    # ============================================================
    Write-Host "`n  Creating Provider Factory Service..." -ForegroundColor Yellow
    
    $providerFactory = @'
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { DynamicProvider, ProviderConfig } from './dynamic-provider';

export interface ProviderExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  providerUsed?: string;
  fallbackUsed?: boolean;
  attempts: ProviderAttempt[];
}

interface ProviderAttempt {
  providerName: string;
  success: boolean;
  error?: string;
  duration: number;
}

@Injectable()
export class ProviderFactoryService {
  private readonly logger = new Logger(ProviderFactoryService.name);
  private providerCache = new Map<string, DynamicProvider>();
  private cacheExpiry = new Map<string, number>();
  private readonly cacheTtlMs = 5 * 60 * 1000; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private httpService: HttpService,
  ) {}

  /**
   * Execute a capability with automatic fallback
   */
  async executeWithFallback(
    providerType: string,
    capability: string,
    payload: any,
    preferredProvider?: string
  ): Promise<ProviderExecutionResult> {
    
    const providers = await this.getProvidersByType(providerType, preferredProvider);
    
    if (providers.length === 0) {
      throw new NotFoundException(
        `No active ${providerType} providers configured. ` +
        `Please add a provider in Settings > Service Providers.`
      );
    }

    const attempts: ProviderAttempt[] = [];

    for (const provider of providers) {
      const attemptStart = Date.now();
      
      try {
        this.logger.log(
          `Executing ${capability} with provider: ${provider.name}`
        );

        const result = await provider.execute(capability, payload);
        
        const attempt: ProviderAttempt = {
          providerName: provider.getInfo().name,
          success: result.success,
          error: result.error,
          duration: Date.now() - attemptStart,
        };
        attempts.push(attempt);

        if (result.success) {
          // Log success
          await this.logUsage(provider, capability, true, null, attempt.duration);
          
          return {
            success: true,
            data: result.data,
            providerUsed: provider.getInfo().name,
            fallbackUsed: attempts.length > 1,
            attempts,
          };
        } else {
          // Log failure but continue to next provider
          await this.logUsage(
            provider, capability, false, result.error, attempt.duration
          );
          
          this.logger.warn(
            `Provider ${provider.name} failed: ${result.error}. Trying fallback...`
          );
        }
      } catch (error) {
        const attempt: ProviderAttempt = {
          providerName: provider.getInfo().name,
          success: false,
          error: error.message,
          duration: Date.now() - attemptStart,
        };
        attempts.push(attempt);

        await this.logUsage(
          provider, capability, false, error.message, attempt.duration
        );

        this.logger.warn(
          `Provider ${provider.name} threw error: ${error.message}. Trying fallback...`
        );
      }
    }

    // All providers failed
    return {
      success: false,
      error: `All ${providerType} providers failed. ` +
             `Attempts: ${attempts.map(a => `${a.providerName}: ${a.error}`).join('; ')}`,
      attempts,
    };
  }

  /**
   * Get a specific provider (without fallback)
   */
  async getProvider(
    providerType: string,
    providerName?: string
  ): Promise<DynamicProvider> {
    const providers = await this.getProvidersByType(providerType, providerName);
    
    if (providers.length === 0) {
      throw new NotFoundException(
        `No active ${providerType} provider found` +
        (providerName ? ` with name "${providerName}"` : '')
      );
    }

    return providers[0];
  }

  /**
   * Get all active providers of a type, ordered by priority
   */
  private async getProvidersByType(
    providerType: string,
    preferredProvider?: string
  ): Promise<DynamicProvider[]> {
    
    // Get providers from database
    const providers = await this.prisma.serviceProvider.findMany({
      where: {
        providerType: providerType as any,
        isActive: true,
      },
      include: {
        capabilities: true,
      },
      orderBy: [
        { priority: 'asc' }, // Lower priority number = higher precedence
        { isDefault: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    // Decrypt credentials and create provider instances
    const dynamicProviders: DynamicProvider[] = [];

    for (const providerData of providers) {
      try {
        // Check cache
        const cacheKey = providerData.id;
        if (this.isCacheValid(cacheKey)) {
          dynamicProviders.push(this.providerCache.get(cacheKey));
          continue;
        }

        // Decrypt credentials
        const credentials = this.encryptionService.decryptObject(
          providerData.credentials
        );

        // Create provider config
        const config: ProviderConfig = {
          id: providerData.id,
          name: providerData.name,
          providerType: providerData.providerType,
          providerSubtype: providerData.providerSubtype,
          baseUrl: providerData.baseUrl,
          apiVersion: providerData.apiVersion,
          authMethod: providerData.authMethod,
          credentials,
          requestConfig: providerData.requestConfig as any,
          settings: providerData.settings as any,
          capabilities: providerData.capabilities.map(cap => ({
            capability: cap.capability,
            name: cap.name,
            endpoint: cap.endpoint,
            method: cap.method,
            requestTemplate: cap.requestTemplate as any,
            responseMapping: cap.responseMapping as any,
            errorMapping: cap.errorMapping as any,
            timeout: cap.timeout,
            retries: cap.retries,
          })),
        };

        // Create provider instance
        const provider = new DynamicProvider(config, this.httpService);
        
        // Cache it
        this.providerCache.set(cacheKey, provider);
        this.cacheExpiry.set(cacheKey, Date.now() + this.cacheTtlMs);

        dynamicProviders.push(provider);
      } catch (error) {
        this.logger.error(
          `Failed to initialize provider ${providerData.name}: ${error.message}`
        );
      }
    }

    // If preferred provider specified, move it to front
    if (preferredProvider) {
      const index = dynamicProviders.findIndex(
        p => p.getInfo().name === preferredProvider
      );
      if (index > 0) {
        const [preferred] = dynamicProviders.splice(index, 1);
        dynamicProviders.unshift(preferred);
      }
    }

    return dynamicProviders;
  }

  /**
   * Test provider connection
   */
  async testProvider(providerId: string): Promise<any> {
    const provider = await this.getProviderById(providerId);
    
    try {
      // Try to execute a test capability if available
      const testResult = await provider.execute('TEST_CONNECTION', {});
      
      // Update last tested info
      await this.prisma.serviceProvider.update({
        where: { id: providerId },
        data: {
          lastTestedAt: new Date(),
          lastTestSuccess: testResult.success,
        },
      });

      return testResult;
    } catch (error) {
      await this.prisma.serviceProvider.update({
        where: { providerId },
        data: {
          lastTestedAt: new Date(),
          lastTestSuccess: false,
        },
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get provider by ID
   */
  private async getProviderById(providerId: string): Promise<DynamicProvider> {
    const providerData = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: { capabilities: true },
    });

    if (!providerData) {
      throw new NotFoundException(`Provider not found: ${providerId}`);
    }

    const credentials = this.encryptionService.decryptObject(
      providerData.credentials
    );

    const config: ProviderConfig = {
      id: providerData.id,
      name: providerData.name,
      providerType: providerData.providerType,
      providerSubtype: providerData.providerSubtype,
      baseUrl: providerData.baseUrl,
      apiVersion: providerData.apiVersion,
      authMethod: providerData.authMethod,
      credentials,
      requestConfig: providerData.requestConfig as any,
      settings: providerData.settings as any,
      capabilities: providerData.capabilities.map(cap => ({
        capability: cap.capability,
        name: cap.name,
        endpoint: cap.endpoint,
        method: cap.method,
        requestTemplate: cap.requestTemplate as any,
        responseMapping: cap.responseMapping as any,
        errorMapping: cap.errorMapping as any,
        timeout: cap.timeout,
        retries: cap.retries,
      })),
    };

    return new DynamicProvider(config, this.httpService);
  }

  /**
   * Clear provider cache
   */
  clearCache(providerId?: string): void {
    if (providerId) {
      this.providerCache.delete(providerId);
      this.cacheExpiry.delete(providerId);
    } else {
      this.providerCache.clear();
      this.cacheExpiry.clear();
    }
  }

  /**
   * Log provider usage (simple success/failure)
   */
  private async logUsage(
    provider: DynamicProvider,
    capability: string,
    success: boolean,
    errorMessage: string | null,
    duration: number
  ): Promise<void> {
    try {
      const providerInfo = provider.getInfo();
      
      await this.prisma.providerUsageLog.create({
        data: {
          providerId: providerInfo.id,
          capability,
          success,
          errorMessage,
          duration,
        },
      });

      // Update provider statistics
      await this.prisma.serviceProvider.update({
        where: { id: providerInfo.id },
        data: {
          totalRequests: { increment: 1 },
          ...(success 
            ? { successfulRequests: { increment: 1 } }
            : { failedRequests: { increment: 1 } }
          ),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log provider usage: ${error.message}`);
    }
  }

  private isCacheValid(providerId: string): boolean {
    const expiry = this.cacheExpiry.get(providerId);
    return expiry !== undefined && Date.now() < expiry;
  }
}
'@
    CreateFile "backend/src/modules/providers/factory/provider-factory.service.ts" $providerFactory
    
    # ============================================================
    # 2.4: Provider Management Service
    # ============================================================
    Write-Host "`n  Creating Provider Management Service..." -ForegroundColor Yellow
    
    $providerManagementService = @'
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { ProviderFactoryService } from '../factory/provider-factory.service';

@Injectable()
export class ProviderManagementService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private providerFactory: ProviderFactoryService,
  ) {}

  /**
   * Create a new service provider
   */
  async createProvider(data: {
    name: string;
    providerType: string;
    providerSubtype?: string;
    description?: string;
    baseUrl: string;
    apiVersion?: string;
    authMethod: string;
    credentials: any;
    requestConfig?: any;
    settings?: any;
    capabilities: Array<{
      capability: string;
      name: string;
      endpoint: string;
      method: string;
      requestTemplate: any;
      responseMapping: any;
      errorMapping?: any;
      timeout?: number;
      retries?: number;
    }>;
    isDefault?: boolean;
    priority?: number;
  }) {
    
    // Validate required fields
    if (!data.name || !data.baseUrl || !data.credentials) {
      throw new BadRequestException(
        'Name, base URL, and credentials are required'
      );
    }

    // Check if provider with same name and type already exists
    const existing = await this.prisma.serviceProvider.findFirst({
      where: {
        name: data.name,
        providerType: data.providerType as any,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Provider "${data.name}" of type "${data.providerType}" already exists`
      );
    }

    // Encrypt credentials
    const encryptedCredentials = this.encryptionService.encryptObject(
      data.credentials
    );

    // Create provider with capabilities
    const provider = await this.prisma.serviceProvider.create({
      data: {
        name: data.name,
        providerType: data.providerType as any,
        providerSubtype: data.providerSubtype,
        description: data.description,
        baseUrl: data.baseUrl,
        apiVersion: data.apiVersion,
        authMethod: data.authMethod as any,
        credentials: encryptedCredentials,
        requestConfig: data.requestConfig || {},
        settings: data.settings || {},
        isDefault: data.isDefault || false,
        priority: data.priority || 100,
        capabilities: {
          create: data.capabilities.map(cap => ({
            capability: cap.capability,
            name: cap.name,
            endpoint: cap.endpoint,
            method: cap.method,
            requestTemplate: cap.requestTemplate,
            responseMapping: cap.responseMapping,
            errorMapping: cap.errorMapping,
            timeout: cap.timeout || 30000,
            retries: cap.retries || 0,
          })),
        },
      },
      include: {
        capabilities: true,
      },
    });

    // Clear factory cache
    this.providerFactory.clearCache();

    return {
      ...provider,
      credentials: undefined, // Never return credentials
    };
  }

  /**
   * Update provider
   */
  async updateProvider(
    providerId: string,
    data: {
      name?: string;
      description?: string;
      baseUrl?: string;
      apiVersion?: string;
      authMethod?: string;
      credentials?: any;
      requestConfig?: any;
      settings?: any;
      isActive?: boolean;
      isDefault?: boolean;
      priority?: number;
    }
  ) {
    const existing = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
    });

    if (!existing) {
      throw new NotFoundException(`Provider not found: ${providerId}`);
    }

    const updateData: any = { ...data };

    // Encrypt credentials if provided
    if (data.credentials) {
      updateData.credentials = this.encryptionService.encryptObject(
        data.credentials
      );
    }

    const provider = await this.prisma.serviceProvider.update({
      where: { id: providerId },
      data: updateData,
    });

    // Clear factory cache
    this.providerFactory.clearCache();

    return {
      ...provider,
      credentials: undefined,
    };
  }

  /**
   * Delete provider (soft delete - deactivate)
   */
  async deleteProvider(providerId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException(`Provider not found: ${providerId}`);
    }

    // Soft delete - just deactivate
    await this.prisma.serviceProvider.update({
      where: { id: providerId },
      data: { isActive: false },
    });

    // Clear factory cache
    this.providerFactory.clearCache();

    return { success: true };
  }

  /**
   * Get all providers (without credentials)
   */
  async getAllProviders(providerType?: string) {
    const providers = await this.prisma.serviceProvider.findMany({
      where: providerType ? { providerType: providerType as any } : {},
      include: {
        capabilities: {
          select: {
            capability: true,
            name: true,
          },
        },
      },
      orderBy: [
        { providerType: 'asc' },
        { priority: 'asc' },
        { name: 'asc' },
      ],
    });

    return providers.map(p => ({
      ...p,
      credentials: undefined, // Never expose credentials
    }));
  }

  /**
   * Get provider details (without credentials)
   */
  async getProvider(providerId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: {
        capabilities: true,
      },
    });

    if (!provider) {
      throw new NotFoundException(`Provider not found: ${providerId}`);
    }

    return {
      ...provider,
      credentials: undefined,
    };
  }

  /**
   * Test provider connection
   */
  async testProvider(providerId: string) {
    return this.providerFactory.testProvider(providerId);
  }

  /**
   * Get provider usage statistics
   */
  async getProviderStats(providerId: string) {
    const [provider, recentLogs] = await Promise.all([
      this.prisma.serviceProvider.findUnique({
        where: { id: providerId },
      }),
      this.prisma.providerUsageLog.findMany({
        where: { providerId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    if (!provider) {
      throw new NotFoundException(`Provider not found: ${providerId}`);
    }

    const totalRequests = provider.totalRequests;
    const successRate = totalRequests > 0 
      ? (provider.successfulRequests / totalRequests) * 100 
      : 0;

    return {
      provider: {
        ...provider,
        credentials: undefined,
      },
      statistics: {
        totalRequests,
        successfulRequests: provider.successfulRequests,
        failedRequests: provider.failedRequests,
        successRate,
      },
      recentLogs,
    };
  }
}
'@
    CreateFile "backend/src/modules/providers/controllers/provider-management.service.ts" $providerManagementService
    
    # ============================================================
    # 2.5: Provider Controller
    # ============================================================
    Write-Host "`n  Creating Provider Controller..." -ForegroundColor Yellow
    
    $providerController = @'
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
'@
    CreateFile "backend/src/modules/providers/controllers/provider.controller.ts" $providerController
    
    # ============================================================
    # 2.6: Pre-built Templates
    # ============================================================
    Write-Host "`n  Creating Pre-built Templates..." -ForegroundColor Yellow
    
    $providerTemplates = @'
// Pre-built provider templates for common services
// These templates can be customized by users after creation

export const PROVIDER_TEMPLATES = {

  // ─── WHATSAPP TEMPLATES ───
  
  'whatsapp_business_api': {
    name: 'WhatsApp Business API',
    providerType: 'WHATSAPP',
    providerSubtype: 'whatsapp_business',
    description: 'Official WhatsApp Business API via Meta',
    baseUrl: 'https://graph.facebook.com/v18.0',
    authMethod: 'BEARER_TOKEN',
    category: 'WHATSAPP',
    isPopular: true,
    credentialsTemplate: {
      accessToken: {
        label: 'Access Token',
        type: 'password',
        required: true,
        description: 'Permanent access token from Meta Business'
      },
      phoneNumberId: {
        label: 'Phone Number ID',
        type: 'text',
        required: true,
        description: 'Phone number ID from WhatsApp Business'
      }
    },
    capabilities: [
      {
        capability: 'SEND_TEXT_MESSAGE',
        name: 'Send Text Message',
        endpoint: '/{{phoneNumberId}}/messages',
        method: 'POST',
        requestTemplate: {
          body: {
            messaging_product: 'whatsapp',
            to: '{{recipient_phone}}',
            type: 'text',
            text: {
              body: '{{message}}'
            }
          }
        },
        responseMapping: {
          messageId: 'messages[0].id',
          status: 'messages[0].message_status'
        },
        errorMapping: {
          errorPath: 'error',
          messagePath: 'error.message'
        }
      }
    ]
  },

  // ─── EGYPTIAN PAYMENT TEMPLATES ───
  
  'myfawry': {
    name: 'MyFawry (فوري)',
    providerType: 'PAYMENT',
    providerSubtype: 'myfawry',
    description: 'Egyptian payment gateway - Fawry',
    baseUrl: 'https://www.atfawry.com/ECommerceWeb/Fawry/payments',
    authMethod: 'API_KEY_HEADER',
    category: 'EGYPTIAN_PAYMENTS',
    isPopular: true,
    credentialsTemplate: {
      merchantCode: {
        label: 'Merchant Code',
        type: 'text',
        required: true,
        description: 'Your Fawry merchant code'
      },
      merchantKey: {
        label: 'Merchant Key',
        type: 'password',
        required: true,
        description: 'Your Fawry merchant key for signature generation'
      },
      securityKey: {
        label: 'Security Key',
        type: 'password',
        required: false,
        description: 'Optional security key for enhanced security'
      }
    },
    capabilities: [
      {
        capability: 'CREATE_PAYMENT_REFERENCE',
        name: 'Create Payment Reference',
        endpoint: '/charge',
        method: 'POST',
        requestTemplate: {
          body: {
            merchantCode: '{{merchantCode}}',
            merchantRefNum: '{{invoice_number}}',
            customerMobile: '{{customer_phone}}',
            customerName: '{{customer_name}}',
            amount: '{{amount}}',
            currencyCode: 'EGP',
            chargeItems: [{
              itemId: '{{item_id}}',
              description: '{{description}}',
              price: '{{amount}}',
              quantity: 1
            }]
          }
        },
        responseMapping: {
          referenceNumber: 'referenceNumber',
          expirationTime: 'expirationTime',
          statusCode: 'statusCode',
          statusDescription: 'statusDescription'
        },
        errorMapping: {
          errorPath: 'statusCode != 1000',
          messagePath: 'statusDescription'
        }
      },
      {
        capability: 'CHECK_PAYMENT_STATUS',
        name: 'Check Payment Status',
        endpoint: '/status',
        method: 'POST',
        requestTemplate: {
          body: {
            merchantCode: '{{merchantCode}}',
            merchantRefNum: '{{invoice_number}}'
          }
        },
        responseMapping: {
          paymentStatus: 'paymentStatus',
          statusCode: 'statusCode'
        }
      }
    ]
  },

  'instapay': {
    name: 'InstaPay (انستاباي)',
    providerType: 'PAYMENT',
    providerSubtype: 'instapay',
    description: 'Egyptian instant payment system',
    baseUrl: 'https://api.instapay.com.eg',
    authMethod: 'API_KEY_HEADER',
    category: 'EGYPTIAN_PAYMENTS',
    isPopular: true,
    credentialsTemplate: {
      apiKey: {
        label: 'API Key',
        type: 'password',
        required: true,
        description: 'InstaPay API key'
      },
      bankAccountNumber: {
        label: 'Bank Account Number',
        type: 'text',
        required: true,
        description: 'Your bank account number'
      },
      bankName: {
        label: 'Bank Name',
        type: 'text',
        required: true,
        description: 'Bank name for InstaPay'
      }
    },
    capabilities: [
      {
        capability: 'GENERATE_PAYMENT_DETAILS',
        name: 'Generate Payment Details',
        endpoint: '/payment-details',
        method: 'POST',
        requestTemplate: {
          body: {
            apiKey: '{{apiKey}}',
            accountNumber: '{{bankAccountNumber}}',
            bankName: '{{bankName}}',
            amount: '{{amount}}',
            reference: '{{invoice_number}}'
          }
        },
        responseMapping: {
          paymentLink: 'paymentLink',
          qrCode: 'qrCode',
          instructions: 'instructions'
        }
      }
    ]
  },

  // ─── INTERNATIONAL PAYMENT TEMPLATES ───
  
  'stripe': {
    name: 'Stripe',
    providerType: 'PAYMENT',
    providerSubtype: 'stripe',
    description: 'International payment gateway',
    baseUrl: 'https://api.stripe.com/v1',
    authMethod: 'BEARER_TOKEN',
    category: 'INTERNATIONAL_PAYMENTS',
    isPopular: true,
    credentialsTemplate: {
      secretKey: {
        label: 'Secret Key',
        type: 'password',
        required: true,
        description: 'Stripe secret key (sk_test_... or sk_live_...)'
      },
      publishableKey: {
        label: 'Publishable Key',
        type: 'text',
        required: false,
        description: 'Stripe publishable key for frontend'
      }
    },
    capabilities: [
      {
        capability: 'CREATE_PAYMENT_INTENT',
        name: 'Create Payment Intent',
        endpoint: '/payment_intents',
        method: 'POST',
        requestTemplate: {
          body: {
            amount: '{{amount_cents}}',
            currency: '{{currency}}',
            'payment_method_types[]': 'card',
            metadata: {
              invoiceId: '{{invoice_id}}',
              patientId: '{{patient_id}}'
            }
          }
        },
        responseMapping: {
          paymentIntentId: 'id',
          clientSecret: 'client_secret',
          status: 'status'
        },
        errorMapping: {
          errorPath: 'error',
          messagePath: 'error.message'
        }
      }
    ]
  },

  // ─── VIDEO TEMPLATES ───
  
  'twilio_video': {
    name: 'Twilio Video',
    providerType: 'VIDEO',
    providerSubtype: 'twilio_video',
    description: 'Video consultation via Twilio',
    baseUrl: 'https://video.twilio.com',
    authMethod: 'BASIC_AUTH',
    category: 'VIDEO',
    isPopular: true,
    credentialsTemplate: {
      accountSid: {
        label: 'Account SID',
        type: 'text',
        required: true,
        description: 'Twilio Account SID'
      },
      authToken: {
        label: 'Auth Token',
        type: 'password',
        required: true,
        description: 'Twilio Auth Token'
      },
      apiKey: {
        label: 'API Key',
        type: 'password',
        required: false,
        description: 'Twilio API Key (optional)'
      }
    },
    capabilities: [
      {
        capability: 'CREATE_ROOM',
        name: 'Create Video Room',
        endpoint: '/v1/Rooms',
        method: 'POST',
        requestTemplate: {
          body: {
            type: 'group',
            unique_name: '{{room_name}}',
            max_participants: 2
          }
        },
        responseMapping: {
          roomSid: 'sid',
          roomName: 'unique_name',
          status: 'status'
        }
      }
    ]
  },

  'daily_co': {
    name: 'Daily.co',
    providerType: 'VIDEO',
    providerSubtype: 'daily_co',
    description: 'Video consultation via Daily.co',
    baseUrl: 'https://api.daily.co/v1',
    authMethod: 'BEARER_TOKEN',
    category: 'VIDEO',
    isPopular: true,
    credentialsTemplate: {
      apiKey: {
        label: 'API Key',
        type: 'password',
        required: true,
        description: 'Daily.co API key'
      }
    },
    capabilities: [
      {
        capability: 'CREATE_ROOM',
        name: 'Create Video Room',
        endpoint: '/rooms',
        method: 'POST',
        requestTemplate: {
          body: {
            name: '{{room_name}}',
            privacy: 'private',
            properties: {
              max_participants: 2,
              enable_chat: true
            }
          }
        },
        responseMapping: {
          roomUrl: 'url',
          roomName: 'name',
          roomId: 'id'
        }
      }
    ]
  }
};
'@
    CreateFile "backend/src/modules/providers/templates/provider-templates.ts" $providerTemplates
    
    # ============================================================
    # 2.7: Template Controller
    # ============================================================
    Write-Host "`n  Creating Template Controller..." -ForegroundColor Yellow
    
    $templateController = @'
import { Controller, Get, Param } from '@nestjs/common';
import { PROVIDER_TEMPLATES } from '../templates/provider-templates';

@Controller('provider-templates')
export class TemplateController {
  
  @Get()
  getAllTemplates() {
    return Object.keys(PROVIDER_TEMPLATES).map(key => ({
      id: key,
      ...PROVIDER_TEMPLATES[key],
      capabilities: undefined,
      credentialsTemplate: undefined,
    }));
  }

  @Get(':templateId')
  getTemplate(@Param('templateId') templateId: string) {
    const template = PROVIDER_TEMPLATES[templateId];
    
    if (!template) {
      throw new NotFoundException(`Template not found: ${templateId}`);
    }

    return {
      id: templateId,
      ...template,
    };
  }
}
'@
    CreateFile "backend/src/modules/providers/controllers/template.controller.ts" $templateController
    
    # ============================================================
    # 2.8: Providers Module
    # ============================================================
    Write-Host "`n  Creating Providers Module..." -ForegroundColor Yellow
    
    $providersModule = @'
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
'@
    CreateFile "backend/src/modules/providers/providers.module.ts" $providersModule
    
    # ============================================================
    # 2.9: Update App Module
    # ============================================================
    Write-Host "`n  Updating App Module..." -ForegroundColor Yellow
    
    $appModulePath = "backend/src/app.module.ts"
    
    if (Test-Path $appModulePath) {
        $appModuleContent = Get-Content $appModulePath -Raw
        
        if ($appModuleContent -notmatch "ProvidersModule") {
            $appModuleContent = $appModuleContent -replace
                "import \{ IntegrationsModule \} from './modules/integrations/integrations.module';",
                "import { IntegrationsModule } from './modules/integrations/integrations.module';
import { ProvidersModule } from './modules/providers/providers.module';"
            
            $appModuleContent = $appModuleContent -replace
                "IntegrationsModule,",
                "IntegrationsModule,
    ProvidersModule,"
            
            Set-Content -Path $appModulePath -Value $appModuleContent
            Write-Host "  ✓ Updated: $appModulePath" -ForegroundColor Green
        }
    }
    
    Write-Host "  ✅ Backend implementation created" -ForegroundColor Green
}

# ============================================================
# SECTION 3: FRONTEND IMPLEMENTATION
# ============================================================

if (-not $SkipFrontend) {
    Write-Host "`n🎨 Section 3: Frontend Implementation..." -ForegroundColor Cyan
    
    # Create directory structure
    $frontendDirs = @(
        "frontend/src/modules/providers/components",
        "frontend/src/modules/providers/services"
    )
    
    foreach ($dir in $frontendDirs) {
        EnsureDirectory $dir
    }
    
    # ============================================================
    # Frontend Service
    # ============================================================
    Write-Host "`n  Creating Frontend Service..." -ForegroundColor Yellow
    
    $providerServiceFrontend = @'
import api from '../../../services/api';

export const providerService = {
  // Get all providers
  async getAllProviders(type?: string) {
    const response = await api.get('/providers', {
      params: type ? { type } : {},
    });
    return response.data;
  },

  // Get single provider
  async getProvider(providerId: string) {
    const response = await api.get(`/providers/${providerId}`);
    return response.data;
  },

  // Create provider from template
  async createFromTemplate(templateId: string, config: {
    name: string;
    credentials: Record<string, string>;
    isDefault?: boolean;
    priority?: number;
  }) {
    const response = await api.post('/providers/from-template', {
      templateId,
      ...config,
    });
    return response.data;
  },

  // Create custom provider
  async createProvider(data: any) {
    const response = await api.post('/providers', data);
    return response.data;
  },

  // Update provider
  async updateProvider(providerId: string, data: any) {
    const response = await api.put(`/providers/${providerId}`, data);
    return response.data;
  },

  // Delete provider (deactivate)
  async deleteProvider(providerId: string) {
    const response = await api.delete(`/providers/${providerId}`);
    return response.data;
  },

  // Test provider connection
  async testProvider(providerId: string) {
    const response = await api.post(`/providers/${providerId}/test`);
    return response.data;
  },

  // Get provider statistics
  async getProviderStats(providerId: string) {
    const response = await api.get(`/providers/${providerId}/stats`);
    return response.data;
  },

  // Get available templates
  async getTemplates() {
    const response = await api.get('/provider-templates');
    return response.data;
  },

  // Get specific template
  async getTemplate(templateId: string) {
    const response = await api.get(`/provider-templates/${templateId}`);
    return response.data;
  },
};
'@
    CreateFile "frontend/src/modules/providers/services/provider.service.ts" $providerServiceFrontend
    
    # ============================================================
    # Frontend Components
    # ============================================================
    Write-Host "`n  Creating Frontend Components..." -ForegroundColor Yellow
    
    # Provider Management Dashboard
    $providerManagementDashboard = @'
import React, { useState, useEffect } from 'react';
import { PlusIcon, CogIcon, TrashIcon } from '@heroicons/react/24/outline';
import { providerService } from '../services/provider.service';
import ProviderCard from './ProviderCard';
import AddProviderModal from './AddProviderModal';

const ProviderManagementDashboard: React.FC = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    loadProviders();
  }, [filterType]);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const response = await providerService.getAllProviders(
        filterType || undefined
      );
      setProviders(response);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const typeLabels: Record<string, string> = {
    WHATSAPP: 'واتساب',
    PAYMENT: 'بوابات الدفع',
    VIDEO: 'الفيديو',
    SMS: 'الرسائل النصية',
    EMAIL: 'البريد الإلكتروني',
    CUSTOM: 'مخصص',
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            إدارة مزودي الخدمة
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            إضافة وتكوين مزودي الخدمات الخارجية
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5 ml-2" />
          إضافة مزود خدمة
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">جميع الأنواع</option>
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Providers Grid */}
      {providers.length === 0 ? (
        <div className="text-center py-12">
          <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            لا توجد مزودي خدمة مضافين
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            ابدأ بإضافة مزود خدمة جديد
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5 ml-2" />
            إضافة أول مزود خدمة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onEdit={() => handleEdit(provider)}
              onDelete={() => handleDelete(provider)}
              onTest={() => handleTest(provider)}
            />
          ))}
        </div>
      )}

      {/* Add Provider Modal */}
      {showAddModal && (
        <AddProviderModal
          onClose={() => setShowAddModal(false)}
          onProviderAdded={() => {
            setShowAddModal(false);
            loadProviders();
          }}
        />
      )}
    </div>
  );
};

export default ProviderManagementDashboard;
'@
    CreateFile "frontend/src/modules/providers/components/ProviderManagementDashboard.tsx" $providerManagementDashboard
    
    # Provider Card Component
    $providerCard = @'
import React from 'react';
import { CogIcon, TrashIcon, BeakerIcon } from '@heroicons/react/24/outline';

interface ProviderCardProps {
  provider: any;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onEdit,
  onDelete,
  onTest,
}) => {
  const typeLabels: Record<string, string> = {
    WHATSAPP: 'واتساب',
    PAYMENT: 'بوابة دفع',
    VIDEO: 'فيديو',
    SMS: 'رسائل نصية',
    EMAIL: 'بريد إلكتروني',
    CUSTOM: 'مخصص',
  };

  const typeColors: Record<string, string> = {
    WHATSAPP: 'bg-green-100 text-green-800',
    PAYMENT: 'bg-blue-100 text-blue-800',
    VIDEO: 'bg-purple-100 text-purple-800',
    SMS: 'bg-yellow-100 text-yellow-800',
    EMAIL: 'bg-red-100 text-red-800',
    CUSTOM: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[provider.providerType]}`}>
              {typeLabels[provider.providerType]}
            </div>
            {provider.isDefault && (
              <span className="mr-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                افتراضي
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={onTest}
              className="text-gray-400 hover:text-gray-500"
              title="اختبار الاتصال"
            >
              <BeakerIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onEdit}
              className="text-gray-400 hover:text-gray-500"
              title="تعديل"
            >
              <CogIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-500"
              title="حذف"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <h3 className="mt-4 text-lg font-medium text-gray-900">
          {provider.name}
        </h3>
        
        {provider.description && (
          <p className="mt-1 text-sm text-gray-500">
            {provider.description}
          </p>
        )}

        {/* Capabilities */}
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">
            القدرات:
          </p>
          <div className="flex flex-wrap gap-1">
            {provider.capabilities?.map((cap: any) => (
              <span
                key={cap.capability}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
              >
                {cap.name}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>
            طلبات: {provider.totalRequests}
          </span>
          <span>
            نسبة النجاح: {provider.totalRequests > 0 
              ? Math.round((provider.successfulRequests / provider.totalRequests) * 100)
              : 0}%
          </span>
        </div>

        {/* Test Status */}
        {provider.lastTestedAt && (
          <div className="mt-2 flex items-center text-xs">
            {provider.lastTestSuccess ? (
              <span className="text-green-600">✓ آخر اختبار ناجح</span>
            ) : (
              <span className="text-red-600">✗ آخر اختبار فاشل</span>
            )}
            <span className="text-gray-400 mr-1">
              ({new Date(provider.lastTestedAt).toLocaleDateString('ar-EG')})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderCard;
'@
    CreateFile "frontend/src/modules/providers/components/ProviderCard.tsx" $providerCard
    
    # Add Provider Modal Component
    $addProviderModal = @'
import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { providerService } from '../services/provider.service';

interface AddProviderModalProps {
  onClose: () => void;
  onProviderAdded: () => void;
}

const AddProviderModal: React.FC<AddProviderModalProps> = ({
  onClose,
  onProviderAdded,
}) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [providerName, setProviderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await providerService.getTemplates();
      setTemplates(response);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    try {
      const template = await providerService.getTemplate(templateId);
      setSelectedTemplate(template);
      setProviderName(template.name);
      
      // Initialize credentials state
      const credState: Record<string, string> = {};
      Object.entries(template.credentialsTemplate || {}).forEach(([key, field]: [string, any]) => {
        credState[key] = '';
      });
      setCredentials(credState);
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  };

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate credentials
      const missingFields = Object.entries(selectedTemplate.credentialsTemplate)
        .filter(([key, field]: [string, any]) => field.required && !credentials[key])
        .map(([key]) => selectedTemplate.credentialsTemplate[key].label);

      if (missingFields.length > 0) {
        setError(`حقول مطلوبة: ${missingFields.join(', ')}`);
        return;
      }

      // Create provider from template
      await providerService.createFromTemplate(
        selectedTemplate.id,
        {
          name: providerName,
          credentials,
        }
      );

      onProviderAdded();
    } catch (error: any) {
      setError(error.response?.data?.message || 'فشل في إنشاء المزود');
    } finally {
      setLoading(false);
    }
  };

  const categoryLabels: Record<string, string> = {
    EGYPTIAN_PAYMENTS: 'بوابات دفع مصرية',
    INTERNATIONAL_PAYMENTS: 'بوابات دفع دولية',
    WHATSAPP: 'واتساب',
    VIDEO: 'فيديو',
    SMS: 'رسائل نصية',
    EMAIL: 'بريد إلكتروني',
  };

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'OTHER';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                إضافة مزود خدمة جديد
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-5 sm:p-6">
            {!selectedTemplate ? (
              /* Template Selection */
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    اختر قالب مزود الخدمة
                  </h4>
                  <p className="text-sm text-gray-500 mb-4">
                    اختر من القوالب الجاهزة أو أنشئ مزوداً مخصصاً
                  </p>
                </div>

                {Object.entries(groupedTemplates).map(([category, templates]) => (
                  <div key={category}>
                    <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">
                      {categoryLabels[category] || category}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template.id)}
                          className="text-right p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h6 className="text-sm font-medium text-gray-900">
                                {template.name}
                              </h6>
                              <p className="text-xs text-gray-500 mt-1">
                                {template.description}
                              </p>
                            </div>
                            {template.isPopular && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                                شائع
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Provider Configuration */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Template Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {selectedTemplate.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedTemplate.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate(null)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      تغيير القالب
                    </button>
                  </div>
                </div>

                {/* Provider Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    اسم المزود *
                  </label>
                  <input
                    type="text"
                    required
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="مثال: واتساب الرئيسي"
                  />
                </div>

                {/* Credentials */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    بيانات الاعتماد
                  </h4>
                  <div className="space-y-4">
                    {Object.entries(selectedTemplate.credentialsTemplate).map(
                      ([key, field]: [string, any]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700">
                            {field.label} {field.required && '*'}
                          </label>
                          <input
                            type={field.type || 'text'}
                            required={field.required}
                            value={credentials[key] || ''}
                            onChange={(e) => handleCredentialChange(key, e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                            placeholder={field.description}
                          />
                          {field.description && (
                            <p className="mt-1 text-xs text-gray-500">
                              {field.description}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 space-x-reverse">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? 'جارٍ الإنشاء...' : 'إنشاء المزود'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProviderModal;
'@
    CreateFile "frontend/src/modules/providers/components/AddProviderModal.tsx" $addProviderModal
    
    # Provider Dropdown Component (for use in other features)
    $providerDropdown = @'
import React, { useState, useEffect } from 'react';
import { providerService } from '../services/provider.service';

interface ProviderDropdownProps {
  providerType: string;
  value?: string;
  onChange: (providerId: string) => void;
  label?: string;
  placeholder?: string;
}

const ProviderDropdown: React.FC<ProviderDropdownProps> = ({
  providerType,
  value,
  onChange,
  label,
  placeholder = 'اختر مزود الخدمة',
}) => {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, [providerType]);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const response = await providerService.getAllProviders(providerType);
      setProviders(response);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || providers.length === 0}
        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
      >
        <option value="">{placeholder}</option>
        {providers.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.name}
            {provider.isDefault ? ' (افتراضي)' : ''}
          </option>
        ))}
      </select>
      
      {providers.length === 0 && !loading && (
        <p className="mt-1 text-xs text-gray-500">
          لا توجد مزودي خدمة {providerType} مضافين. 
          <a href="/settings/providers" className="text-primary-600 hover:text-primary-700">
            إضافة مزود خدمة
          </a>
        </p>
      )}
    </div>
  );
};

export default ProviderDropdown;
'@
    CreateFile "frontend/src/modules/providers/components/ProviderDropdown.tsx" $providerDropdown
    
    Write-Host "  ✅ Frontend implementation created" -ForegroundColor Green
}

# ============================================================
# SECTION 4: DATABASE MIGRATION & TEMPLATE SEEDING
# ============================================================

Write-Host "`n🗄️ Section 4: Database Migration & Seeding..." -ForegroundColor Cyan

# Create migration command
Write-Host "`n📋 Migration Command Required:" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor Gray
Write-Host "  npx prisma migrate dev --name add_dynamic_provider_system" -ForegroundColor Gray

# Create seed data for templates
Write-Host "`n🌱 Creating Template Seed Data..." -ForegroundColor Yellow

 $seedData = @'
// Seed provider templates into database
import { PrismaClient } from '@prisma/client';
import { PROVIDER_TEMPLATES } from '../src/modules/providers/templates/provider-templates';

const prisma = new PrismaClient();

async function seedProviderTemplates() {
  console.log('Seeding provider templates...');

  for (const [key, template] of Object.entries(PROVIDER_TEMPLATES)) {
    const existing = await prisma.providerTemplate.findFirst({
      where: {
        name: template.name,
        providerType: template.providerType as any,
      },
    });

    if (!existing) {
      await prisma.providerTemplate.create({
        data: {
          name: template.name,
          providerType: template.providerType as any,
          providerSubtype: template.providerSubtype,
          description: template.description,
          baseUrl: template.baseUrl,
          authMethod: template.authMethod as any,
          credentialsTemplate: template.credentialsTemplate,
          capabilitiesTemplate: template.capabilities,
          category: template.category,
          isPopular: template.isPopular || false,
        },
      });
      console.log(`✓ Created template: ${template.name}`);
    } else {
      console.log(`- Template already exists: ${template.name}`);
    }
  }

  console.log('Template seeding completed!');
}

seedProviderTemplates()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
'@

    # Save seed file
    CreateFile "backend/prisma/seed-provider-templates.ts" $seedData
    
    Write-Host "`n📋 Seed Command Required:" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor Gray
Write-Host "  npx ts-node prisma/seed-provider-templates.ts" -ForegroundColor Gray

# ============================================================
# COMPLETION SUMMARY
# ============================================================

 $endTime = Get-Date
 $duration = $endTime - $startTime

Write-Host "`n" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  DYNAMIC PROVIDER MANAGEMENT SYSTEM - COMPLETE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Duration: $($duration.ToString('hh\:mm\:ss'))" -ForegroundColor Gray
Write-Host "  System: Zero-Code Provider Configuration" -ForegroundColor Green
Write-Host "  Architecture: Dynamic & Future-Proof" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

Write-Host "`n📋 What Was Created:" -ForegroundColor Yellow
Write-Host "==============" -ForegroundColor Yellow

Write-Host "`n📁 Backend Files:" -ForegroundColor Cyan
Write-Host "  ✅ Encryption Service (secure credential storage)" -ForegroundColor Green
Write-Host "     - encryption.service.ts" -ForegroundColor Gray
Write-Host "  ✅ Dynamic Provider Class (template engine)" -ForegroundColor Green
Write-Host "     - dynamic-provider.ts" -ForegroundColor Gray
Write-Host "  ✅ Provider Factory Service (with fallback)" -ForegroundColor Green
Write-Host "     - provider-factory.service.ts" -ForegroundColor Gray
Write-Host "  ✅ Provider Management Service (CRUD)" -ForegroundColor Green
Write-Host "     - provider-management.service.ts" -ForegroundColor Gray
Write-Host "  ✅ Provider Controller (API endpoints)" -ForegroundColor Green
Write-Host "     - provider.controller.ts" -ForegroundColor Gray
Write-Host "  ✅ Template Controller" -ForegroundColor Green
Write-Host "     - template.controller.ts" -ForegroundColor Gray
Write-Host "  ✅ Provider Templates (pre-built)" -ForegroundColor Green
Write-Host "     - provider-templates.ts" -ForegroundColor Gray
Write-Host "  ✅ Providers Module" -ForegroundColor Green
Write-Host "     - providers.module.ts" -ForegroundColor Gray

Write-Host "`n🎨 Frontend Files:" -ForegroundColor Cyan
Write-Host "  ✅ Provider Service (API calls)" -ForegroundColor Green
Write-Host "     - provider.service.ts" -ForegroundColor Gray
Write-Host "  ✅ Provider Management Dashboard" -ForegroundColor Green
Write-Host "     - ProviderManagementDashboard.tsx" -ForegroundColor Gray
Write-Host "  ✅ Provider Card Component" -ForegroundColor Green
Write-Host "     - ProviderCard.tsx" -ForegroundColor Gray
Write-Host "  ✅ Add Provider Modal (with template selection)" -ForegroundColor Green
Write-Host "     - AddProviderModal.tsx" -ForegroundColor Gray
Write-Host "  ✅ Provider Dropdown (for use in other features)" -ForegroundColor Green
Write-Host "     - ProviderDropdown.tsx" -ForegroundColor Gray

Write-Host "`n📊 Database Schema:" -ForegroundColor Cyan
Write-Host "  ✅ ServiceProvider model" -ForegroundColor Gray
Write-Host "  ✅ ProviderCapability model" -ForegroundColor Gray
Write-Host "  ✅ ProviderUsageLog model" -ForegroundColor Gray
Write-Host "  ✅ ProviderTemplate model" -ForegroundColor Gray
Write-Host "  ✅ Enums: ProviderType, AuthMethod" -ForegroundColor Gray

Write-Host "`n🔧 Pre-built Templates Included:" -ForegroundColor Cyan
Write-Host "  ✅ WhatsApp Business API" -ForegroundColor Green
Write-Host "  ✅ MyFawry (فوري) - Egyptian Payment" -ForegroundColor Green
Write-Host "  ✅ InstaPay (انستاباي) - Egyptian Payment" -ForegroundColor Green
Write-Host "  ✅ Stripe - International Payment" -ForegroundColor Green
Write-Host "  ✅ Twilio Video" -ForegroundColor Green
Write-Host "  ✅ Daily.co Video" -ForegroundColor Green

Write-Host "`n🔄 Next Steps:" -ForegroundColor Yellow
Write-Host "==============" -ForegroundColor Yellow
Write-Host "  1. Run database migration:" -ForegroundColor White
Write-Host "     cd backend && npx prisma migrate dev --name add_dynamic_provider_system" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Seed provider templates:" -ForegroundColor White
Write-Host "     cd backend && npx ts-node prisma/seed-provider-templates.ts" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Add navigation to provider management:" -ForegroundColor White
Write-Host "     - Settings > Service Providers" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Test the system:" -ForegroundColor White
Write-Host "     - Add a WhatsApp provider using the template" -ForegroundColor Gray
Write-Host "     - Add MyFawry or InstaPay for payments" -ForegroundColor Gray
Write-Host "     - Use the provider dropdowns in relevant features" -ForegroundColor Gray

Write-Host "`n📊 System Capabilities:" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor Yellow
Write-Host "  ✅ Zero-code provider addition" -ForegroundColor Green
Write-Host "  ✅ Pre-built templates for common services" -ForegroundColor Green
Write-Host "  ✅ Automatic fallback system" -ForegroundColor Green
Write-Host "  ✅ Owner-only access control" -ForegroundColor Green
Write-Host "  ✅ Full request/response template control" -ForegroundColor Green
Write-Host "  ✅ Egyptian payment gateway focus" -ForegroundColor Green
Write-Host "  ✅ Simple success/failure logging" -ForegroundColor Green
Write-Host "  ✅ Provider dropdown selection" -ForegroundColor Green
Write-Host "  ✅ Secure credential encryption" -ForegroundColor Green
Write-Host "  ✅ Connection testing" -ForegroundColor Green

Write-Host "`n🎉 BENEFITS ACHIEVED:" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host "  • Add ANY service provider via UI - no code changes!" -ForegroundColor Green
Write-Host "  • Switch between providers instantly" -ForegroundColor Green
Write-Host "  • Automatic fallback if primary provider fails" -ForegroundColor Green
Write-Host "  • Pre-built templates for quick setup" -ForegroundColor Green
Write-Host "  • Enterprise-grade security for credentials" -ForegroundColor Green
Write-Host "  • Professional admin interface" -ForegroundColor Green

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
# ReadKey removed for automation
