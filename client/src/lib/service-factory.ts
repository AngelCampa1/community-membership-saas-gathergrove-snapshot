/**
 * Service Factory - Perfect Service Layer Abstraction
 * 
 * Provides a centralized factory for creating and managing service instances
 * with consistent patterns, error handling, and performance optimization.
 */

import { BaseService, ServiceOptions, ServiceResponse } from './architectural-patterns';
import { ErrorHandler } from './errorHandler';
import apiClient from '@/services/apiClient';
import { AxiosRequestConfig, AxiosResponse, Method } from 'axios';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Decorator target type for method decorators
 */
type DecoratorTarget = {
  [key: string]: unknown;
};

/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Error with status property
 */
interface ErrorWithStatus {
  status?: number;
}

// ============================================================================
// SERVICE REGISTRY & FACTORY
// ============================================================================

/**
 * Service configuration interface
 */
export interface ServiceConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  version?: string;
}

/**
 * Service registry for managing instances
 */
class ServiceRegistry {
  private services = new Map<string, BaseService>();
  private configs = new Map<string, ServiceConfig>();

  register<T extends BaseService>(name: string, service: T, config: ServiceConfig): void {
    this.services.set(name, service);
    this.configs.set(name, config);
  }

  get<T extends BaseService>(name: string): T {
    const service = this.services.get(name) as T;
    if (!service) {
      throw new Error(`Service '${name}' not registered`);
    }
    return service;
  }

  getConfig(name: string): ServiceConfig {
    const config = this.configs.get(name);
    if (!config) {
      throw new Error(`Service config for '${name}' not found`);
    }
    return config;
  }

  list(): string[] {
    return Array.from(this.services.keys());
  }

  clear(): void {
    this.services.clear();
    this.configs.clear();
  }
}

export const serviceRegistry = new ServiceRegistry();

// ============================================================================
// ENHANCED BASE SERVICE
// ============================================================================

/**
 * Enhanced base service with comprehensive patterns
 */
export abstract class EnhancedBaseService extends BaseService {
  protected config: ServiceConfig;
  protected abortController?: AbortController;

  constructor(config: ServiceConfig) {
    super();
    this.config = config;
  }

  get baseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * Generic GET method with enhanced error handling
   */
  protected async get<T>(
    endpoint: string, 
    options?: ServiceOptions & { params?: Record<string, unknown> }
  ): Promise<ServiceResponse<T>> {
    return this.executeRequest<T>('GET', endpoint, undefined, options);
  }

  /**
   * Generic POST method with enhanced error handling
   */
  protected async post<T>(
    endpoint: string, 
    data?: unknown, 
    options?: ServiceOptions
  ): Promise<ServiceResponse<T>> {
    return this.executeRequest<T>('POST', endpoint, data, options);
  }

  /**
   * Generic PUT method with enhanced error handling
   */
  protected async put<T>(
    endpoint: string, 
    data?: unknown, 
    options?: ServiceOptions
  ): Promise<ServiceResponse<T>> {
    return this.executeRequest<T>('PUT', endpoint, data, options);
  }

  /**
   * Generic DELETE method with enhanced error handling
   */
  protected async delete<T>(
    endpoint: string, 
    options?: ServiceOptions
  ): Promise<ServiceResponse<T>> {
    return this.executeRequest<T>('DELETE', endpoint, undefined, options);
  }

  /**
   * Generic PATCH method with enhanced error handling
   */
  protected async patch<T>(
    endpoint: string, 
    data?: unknown, 
    options?: ServiceOptions
  ): Promise<ServiceResponse<T>> {
    return this.executeRequest<T>('PATCH', endpoint, data, options);
  }

  /**
   * Execute HTTP request with comprehensive error handling and retry logic
   */
  private async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    options?: ServiceOptions & { params?: Record<string, unknown> }
  ): Promise<ServiceResponse<T>> {
    const url = this.buildUrl(endpoint);
    const retries = options?.retries ?? this.config.retries ?? 0;
    
    // Create abort controller for this request
    this.abortController = new AbortController();
    
    const requestConfig: AxiosRequestConfig = {
      method: method.toLowerCase() as Method,
      url,
      data,
      params: options?.params,
      timeout: options?.timeout ?? this.config.timeout,
      signal: options?.signal ?? this.abortController.signal,
    };

    let lastError: unknown;
    
    // Retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response: AxiosResponse<T> = await apiClient.request(requestConfig);
        
        return {
          data: response.data,
          success: true,
          message: response.statusText,
        };
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (this.shouldNotRetry(error) || attempt === retries) {
          break;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await this.delay(delay);
      }
    }

    // Handle final error
    throw this.handleServiceError(lastError, `${method} ${endpoint}`);
  }

  /**
   * Determine if error should not be retried
   */
  private shouldNotRetry(error: unknown): boolean {
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as ErrorWithStatus).status;
      // Don't retry 4xx errors (client errors) except 408, 429
      return status !== undefined && status >= 400 && status < 500 && status !== 408 && status !== 429;
    }
    return false;
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cancel ongoing requests
   */
  public cancelRequests(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
  }

  /**
   * Enhanced error handling with context
   */
  protected handleServiceError(error: unknown, context: string): never {
    const enhancedError = ErrorHandler.handleApiError(error, {
      context: `${this.constructor.name}: ${context}`,
      action: 'The operation failed. Please try again.',
    });
    
    throw enhancedError;
  }
}

// ============================================================================
// SERVICE FACTORY
// ============================================================================

/**
 * Factory for creating service instances with consistent patterns
 */
export class ServiceFactory {
  /**
   * Create a new service instance
   */
  static create<T extends EnhancedBaseService>(
    ServiceClass: new (config: ServiceConfig) => T,
    config: ServiceConfig,
    name?: string
  ): T {
    const service = new ServiceClass(config);
    
    if (name) {
      serviceRegistry.register(name, service, config);
    }
    
    return service;
  }

  /**
   * Get existing service instance
   */
  static get<T extends EnhancedBaseService>(name: string): T {
    return serviceRegistry.get<T>(name);
  }

  /**
   * Check if service exists
   */
  static has(name: string): boolean {
    try {
      serviceRegistry.get(name);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List all registered services
   */
  static list(): string[] {
    return serviceRegistry.list();
  }

  /**
   * Clear all services (useful for testing)
   */
  static clear(): void {
    serviceRegistry.clear();
  }
}

// ============================================================================
// SERVICE DECORATORS
// ============================================================================

/**
 * Cache decorator for service methods
 */
export function cached(ttl: number = 5 * 60 * 1000) {
  return function<T>(target: DecoratorTarget, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<T>;
    const cache = new Map<string, CacheEntry<T>>();

    descriptor.value = async function(this: unknown, ...args: unknown[]): Promise<T> {
      const key = JSON.stringify(args);
      const cached = cache.get(key);

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data;
      }

      const result = await originalMethod.apply(this, args);
      cache.set(key, { data: result, timestamp: Date.now() });

      return result;
    };

    return descriptor;
  };
}

/**
 * Retry decorator for service methods
 */
export function retry(attempts: number = 3, delay: number = 1000) {
  return function<T>(target: DecoratorTarget, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<T>;

    descriptor.value = async function(this: unknown, ...args: unknown[]): Promise<T> {
      let lastError: unknown;

      for (let attempt = 0; attempt < attempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;

          if (attempt === attempts - 1) break;

          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}

/**
 * Debounce decorator for service methods
 */
export function debounced(delay: number = 300) {
  return function<T>(target: DecoratorTarget, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<T>;
    let timeout: NodeJS.Timeout;

    descriptor.value = function(this: unknown, ...args: unknown[]): Promise<T> {
      clearTimeout(timeout);

      return new Promise<T>((resolve, reject) => {
        timeout = setTimeout(async () => {
          try {
            const result = await originalMethod.apply(this, args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    };

    return descriptor;
  };
}

// ============================================================================
// COMMON SERVICE CONFIGURATIONS
// ============================================================================

export const SERVICE_CONFIGS = {
  DEFAULT: {
    baseUrl: '/api/v1',
    timeout: 15000,
    retries: 2,
    cache: true,
  },
  
  ANALYTICS: {
    baseUrl: '/api/v1/analytics',
    timeout: 30000,
    retries: 1,
    cache: true,
  },
  
  REAL_TIME: {
    baseUrl: '/api/v1/realtime',
    timeout: 5000,
    retries: 0,
    cache: false,
  },
  
  UPLOADS: {
    baseUrl: '/api/v1/uploads',
    timeout: 60000,
    retries: 3,
    cache: false,
  },
} as const;

export default {
  ServiceFactory,
  EnhancedBaseService,
  serviceRegistry,
  SERVICE_CONFIGS,
};