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
