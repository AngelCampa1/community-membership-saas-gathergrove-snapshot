/**
 * Security Integration Service
 * Orchestrates all security services and provides unified security interface
 */

import { authService } from './authService';
import { paymentService, type PayMyDuesRequest, type PaymentResponse } from './paymentService';
import { cacheService } from './cacheService';
import { securityLogger, type SecurityEventType, type SecuritySeverity, type SecurityEvent } from './securityLogger';
import { apiClient } from './apiClient';
import { InputValidator, NetworkSecurity, RuntimeProtection } from '@/utils/security';

// Re-export types from other services for consistency
export type { SecurityEventType, SecuritySeverity, SecurityEvent };
export type PaymentData = PayMyDuesRequest;
export type PaymentResult = PaymentResponse;

// Local type definitions for security integration
type AuthEventType = 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT';

interface SecurityContext {
  action: string;
  resource: string;
  additionalData?: Record<string, unknown>;
  apiEndpoint?: string;
  userInput?: Record<string, unknown>;
  errorCode?: string;
}

interface SecureApiOptions {
  useCache?: boolean;
  cacheKey?: string;
  validateInput?: boolean;
  userId?: string;
}

interface SecurityMetrics {
  totalEvents: number;
  eventsBySeverity: Record<string, number>;
  eventsByType: Record<string, number>;
  averageRiskScore: number;
  [key: string]: unknown;
}

interface NetworkStatus {
  isOnline: boolean;
  queuedRequests: number;
}

interface CacheStats {
  totalEntries: number;
  totalSize: string;
  pendingSyncs: number;
  conflicts: number;
  oldestEntry?: string;
  newestEntry?: string;
}

export class SecurityManager {
  private static instance: SecurityManager;
  private initialized: boolean = false;

  private constructor() {
    this.initializeSecurityServices();
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * Initialize all security services
   */
  private async initializeSecurityServices(): Promise<void> {
    try {
      // Enable runtime protection
      RuntimeProtection.enableAntiDebugging();
      
      // Set up session timeout callback
      authService.setSessionTimeoutCallback(() => {
        this.handleSecurityEvent('SESSION_EXPIRED', 'MEDIUM', {
          action: 'SESSION_TIMEOUT',
          resource: 'USER_SESSION',
        });
      });

      // Perform app integrity check
      const integrityCheck = await RuntimeProtection.checkAppIntegrity();
      if (!integrityCheck) {
        await securityLogger.logSecurityEvent(
          'SUSPICIOUS_ACTIVITY',
          'HIGH',
          {
            action: 'APP_INTEGRITY_FAILED',
            resource: 'APPLICATION',
          }
        );
      }

      // Clean up old security events (30 days retention)
      await securityLogger.cleanupOldEvents(30 * 24 * 60 * 60 * 1000);

      this.initialized = true;

      if (__DEV__) {
        /* Security services initialized successfully */
      }
    } catch (error) {
      await securityLogger.logSecurityEvent(
        'SUSPICIOUS_ACTIVITY',
        'HIGH',
        {
          action: 'SECURITY_INIT_FAILED',
          resource: 'SECURITY_MANAGER',
          additionalData: { error: error instanceof Error ? error.message : 'Unknown error' },
        }
      );
    }
  }

  /**
   * Validate user input with comprehensive security checks
   */
  async validateUserInput(
    input: string,
    context: string,
    userId?: string
  ): Promise<{
    isValid: boolean;
    sanitizedInput: string;
    threats: string[];
    riskScore: number;
  }> {
    try {
      // Comprehensive security validation
      const validation = InputValidator.validateInputSecurity(input);
      
      if (!validation.isSafe || validation.riskScore > 30) {
        // Log security event
        await securityLogger.logSecurityEvent(
          'MALICIOUS_INPUT_DETECTED',
          validation.riskScore > 70 ? 'CRITICAL' : validation.riskScore > 50 ? 'HIGH' : 'MEDIUM',
          {
            action: 'INPUT_VALIDATION',
            resource: context,
            userInput: { originalLength: input.length, threats: validation.threats },
          },
          {
            riskScore: validation.riskScore,
            threatTypes: validation.threats,
          },
          userId
        );
      }

      return {
        isValid: validation.isSafe,
        sanitizedInput: InputValidator.sanitizeInput(input),
        threats: validation.threats,
        riskScore: validation.riskScore,
      };
    } catch (error) {
      return {
        isValid: false,
        sanitizedInput: '',
        threats: ['VALIDATION_ERROR'],
        riskScore: 50,
      };
    }
  }

  /**
   * Handle secure API requests with comprehensive error handling
   */
  async secureApiRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    data?: Record<string, unknown>,
    options: SecureApiOptions = {}
  ): Promise<T> {
    try {
      // Validate input data if requested
      if (options.validateInput && data) {
        const validation = await this.validateUserInput(
          JSON.stringify(data),
          `API_REQUEST_${method}_${url}`,
          options.userId
        );
        
        if (!validation.isValid && validation.riskScore > 50) {
          throw new Error('Request blocked due to security concerns');
        }
      }

      // Make the API request
      const config = {
        useCache: options.useCache,
        cacheKey: options.cacheKey,
      };

      let response: T;
      
      switch (method) {
        case 'GET':
          response = await apiClient.get<T>(url, config);
          break;
        case 'POST':
          response = await apiClient.post<T>(url, data);
          break;
        case 'PUT':
          response = await apiClient.put<T>(url, data);
          break;
        case 'PATCH':
          response = await apiClient.patch<T>(url, data);
          break;
        case 'DELETE':
          response = await apiClient.delete<T>(url);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      // Validate response
      if (!NetworkSecurity.validateResponse(response)) {
        await securityLogger.logSecurityEvent(
          'SUSPICIOUS_ACTIVITY',
          'HIGH',
          {
            action: 'MALICIOUS_RESPONSE_DETECTED',
            resource: url,
            apiEndpoint: url,
          },
          undefined,
          options.userId
        );
        
        throw new Error('Response blocked due to security concerns');
      }

      return response;
    } catch (error) {
      // Log API security events
      await securityLogger.logSecurityEvent(
        'NETWORK_INTRUSION',
        'MEDIUM',
        {
          action: `API_REQUEST_FAILED_${method}`,
          resource: url,
          apiEndpoint: url,
          errorCode: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        },
        undefined,
        options.userId
      );
      
      throw error;
    }
  }

  /**
   * Handle payment security with fraud detection
   */
  async securePaymentRequest(
    paymentData: PaymentData,
    userId: string
  ): Promise<PaymentResult> {
    try {
      // Log payment initiation
      await securityLogger.logSecurityEvent(
        'SUSPICIOUS_ACTIVITY',
        'LOW',
        {
          action: 'PAYMENT_INITIATED',
          resource: 'PAYMENT_SYSTEM',
          additionalData: {
            paymentMethodId: paymentData.paymentMethodId,
            membershipTypeId: paymentData.membershipTypeId
          },
        },
        {
          riskScore: 20,
          threatTypes: ['PAYMENT_ACTIVITY'],
        },
        userId
      );

      // Process payment through enhanced payment service
      const result = await paymentService.payMyDues(paymentData);

      // Log successful payment
      await securityLogger.logSecurityEvent(
        'SUSPICIOUS_ACTIVITY',
        'LOW',
        {
          action: 'PAYMENT_COMPLETED',
          resource: 'PAYMENT_SYSTEM',
          additionalData: {
            paymentId: result.paymentId.toString(),
            amount: result.amount,
            memberId: result.memberId
          },
        },
        {
          riskScore: 10,
          threatTypes: ['PAYMENT_SUCCESS'],
        },
        userId
      );

      return result;
    } catch (error) {
      // Log payment failure
      await securityLogger.logSecurityEvent(
        'PAYMENT_FRAUD_DETECTED',
        'HIGH',
        {
          action: 'PAYMENT_FAILED',
          resource: 'PAYMENT_SYSTEM',
          errorCode: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
          additionalData: paymentData as unknown as Record<string, unknown>,
        },
        {
          riskScore: 60,
          threatTypes: ['PAYMENT_FRAUD', 'PAYMENT_FAILURE'],
        },
        userId
      );
      
      throw error;
    }
  }

  /**
   * Monitor authentication security
   */
  async monitorAuthenticationEvent(
    eventType: AuthEventType,
    userId: string,
    additionalData?: Record<string, unknown>
  ): Promise<void> {
    const severityMap = {
      LOGIN_ATTEMPT: 'LOW' as const,
      LOGIN_SUCCESS: 'LOW' as const,
      LOGIN_FAILED: 'MEDIUM' as const,
      LOGOUT: 'LOW' as const,
    };

    const typeMap = {
      LOGIN_ATTEMPT: 'SUSPICIOUS_ACTIVITY' as const,
      LOGIN_SUCCESS: 'SUSPICIOUS_ACTIVITY' as const,
      LOGIN_FAILED: 'AUTHENTICATION_FAILED' as const,
      LOGOUT: 'SUSPICIOUS_ACTIVITY' as const,
    };

    await securityLogger.logSecurityEvent(
      typeMap[eventType],
      severityMap[eventType],
      {
        action: eventType,
        resource: 'AUTHENTICATION_SYSTEM',
        additionalData,
      },
      {
        riskScore: eventType === 'LOGIN_FAILED' ? 30 : 10,
        threatTypes: [eventType],
      },
      userId
    );
  }

  /**
   * Get security dashboard data
   */
  async getSecurityDashboard(): Promise<{
    metrics: SecurityMetrics;
    recentEvents: SecurityEvent[];
    networkStatus: NetworkStatus;
    cacheStats: CacheStats;
    systemHealth: {
      isSecure: boolean;
      lastUpdate: string;
      activeThreats: number;
      riskLevel: SecuritySeverity;
    };
  }> {
    const [metrics, recentEvents, networkStatus, cacheStats] = await Promise.all([
      securityLogger.getSecurityMetrics(),
      securityLogger.getSecurityEvents({ limit: 10 }),
      apiClient.getNetworkStatus(),
      cacheService.getStats(),
    ]);

    const activeThreats = recentEvents.filter(
      event => event.severity === 'HIGH' || event.severity === 'CRITICAL'
    ).length;

    let riskLevel: SecuritySeverity = 'LOW';
    if (metrics.averageRiskScore > 70) riskLevel = 'CRITICAL';
    else if (metrics.averageRiskScore > 50) riskLevel = 'HIGH';
    else if (metrics.averageRiskScore > 30) riskLevel = 'MEDIUM';

    return {
      metrics,
      recentEvents,
      networkStatus,
      cacheStats,
      systemHealth: {
        isSecure: riskLevel !== 'CRITICAL' && activeThreats < 5,
        lastUpdate: new Date().toISOString(),
        activeThreats,
        riskLevel,
      },
    };
  }

  /**
   * Handle generic security events
   */
  private async handleSecurityEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    context: SecurityContext,
    userId?: string
  ): Promise<void> {
    await securityLogger.logSecurityEvent(type, severity, context, undefined, userId);
  }

  /**
   * Cleanup security services
   */
  async cleanup(): Promise<void> {
    try {
      // Disable runtime protection
      RuntimeProtection.disableAntiDebugging();
      
      // Clear sensitive caches
      await cacheService.clear();
      
      // Clear API request queue
      apiClient.clearRequestQueue();
      
      // Clean up auth service
      authService.cleanup();
      
      this.initialized = false;

      if (__DEV__) {
        /* Security services cleaned up */
      }
    } catch (_err) { /* Error handled */ }
  }

  /**
   * Check if security manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance();

// Export convenience functions
export const validateInput = (input: string, context: string, userId?: string) =>
  securityManager.validateUserInput(input, context, userId);

export const secureRequest = <T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: Record<string, unknown>,
  options?: SecureApiOptions
) => securityManager.secureApiRequest<T>(method, url, data, options);

export const monitorAuth = (
  eventType: AuthEventType,
  userId: string,
  additionalData?: Record<string, unknown>
) => securityManager.monitorAuthenticationEvent(eventType, userId, additionalData);

export default securityManager;