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
