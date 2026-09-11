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
