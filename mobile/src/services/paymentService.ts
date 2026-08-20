import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';
import { API_CONFIG, ERROR_MESSAGES } from '@/constants';
import { ErrorHandler } from '@/utils/errorHandler';
import { NetworkSecurity } from '@/utils/security';
import { getPlatformConfig } from '@/utils/platformUtils';

// PAY-01/PAY-02 fix: Storage keys for persistence
const PAYMENT_FAILED_ATTEMPTS_KEY = 'gathergrove_payment_failed_attempts';
const PAYMENT_AUDIT_LOGS_KEY = 'gathergrove_payment_audit_logs';

// ============================================================================
// Dependency Injection Interfaces for Testing
// ============================================================================

/**
 * Interface for AsyncStorage operations (subset used by PaymentService)
 */
export interface AsyncStorageAdapter {
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
}

/**
 * Interface for AuthService operations (subset used by PaymentService)
 */
export interface AuthServiceAdapter {
  getStoredToken: () => Promise<string | null>;
}

// Default adapters that use real implementations
const defaultAsyncStorageAdapter: AsyncStorageAdapter = {
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  getItem: (key: string) => AsyncStorage.getItem(key),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

const defaultAuthServiceAdapter: AuthServiceAdapter = {
  getStoredToken: () => authService.getStoredToken(),
};

// Payment request interface for member self-service
export interface PayMyDuesRequest {
  paymentMethodId: string;
  membershipTypeId: number;
  deviceInfo?: {
    platform: string;
    version: string;
    userAgent: string;
  };
  timestamp?: string;
}

// Payment audit log interface
export interface PaymentAuditLog {
  transactionId: string;
  memberId: number;
  clubId: number;
  amount: number;
  status: 'initiated' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentMethodType: string;
  paymentMethodLast4?: string;
  errorCode?: string;
  errorMessage?: string;
  deviceInfo: {
    platform: string;
    version: string;
    ipAddress?: string;
    userAgent: string;
  };
  timestamp: string;
  riskScore?: number;
  fraudFlags?: string[];
}

// Payment response interface
export interface PaymentResponse {
  paymentId: number;
  memberId: number;
  clubId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}

// Stripe configuration status interface
export interface StripeConfigResponse {
  isConfigured: boolean;
  canAcceptPayments: boolean;
}

class PaymentService {
  private axiosInstance: AxiosInstance;
  private auditLogs: PaymentAuditLog[] = [];
  private maxAuditLogs: number = 100;
  private failedAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private readonly maxFailedAttempts = 3;
  private readonly lockoutDuration = 15 * 60 * 1000; // 15 minutes

  // Dependency injection for storage adapters (for testing)
  private asyncStorage: AsyncStorageAdapter;
  private authServiceAdapter: AuthServiceAdapter;

  constructor(
    asyncStorage: AsyncStorageAdapter = defaultAsyncStorageAdapter,
    authServiceAdapter: AuthServiceAdapter = defaultAuthServiceAdapter
  ) {
    this.asyncStorage = asyncStorage;
    this.authServiceAdapter = authServiceAdapter;

    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...NetworkSecurity.getSecureHeaders(),
      },
    });

    this.setupRequestInterceptor();

    // PAY-01/PAY-02 fix: Restore persisted data
    this.restorePersistedData().catch(() => {
      // Silent fail - will use in-memory only
    });
  }

  /**
   * Set up axios request interceptor to include JWT token
   */
  private setupRequestInterceptor(): void {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await this.authServiceAdapter.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if the club has Stripe configured for accepting payments
   * @returns Promise with Stripe configuration status
   */
  async checkStripeConfiguration(): Promise<StripeConfigResponse> {
    try {
      const response = await this.axiosInstance.get<StripeConfigResponse>(
        '/api/v1/users/me/payment-config'
      );
      return response.data;
    } catch (error) {
      
      // If the endpoint doesn't exist or fails, assume payments are not configured
      return {
        isConfigured: false,
        canAcceptPayments: false,
      };
    }
  }

  /**
   * Allows a member to pay their own dues using Stripe
   * @param request - Payment request with Stripe payment method ID and membership type
   * @returns Promise with payment details
   */
  async payMyDues(request: PayMyDuesRequest): Promise<PaymentResponse> {
    // Validate request data before sending to API
    this.validatePayMyDuesRequest(request);

    // Check for payment fraud patterns
    const riskAssessment = await this.assessPaymentRisk(request);
    if (riskAssessment.isHighRisk) {
      throw new Error('Payment blocked due to security concerns. Please contact support.');
    }

    // Check if user is locked out due to failed attempts
    const userKey = `payment_${request.membershipTypeId}`;
    if (this.isUserLockedOut(userKey)) {
      throw new Error('Too many failed payment attempts. Please try again in 15 minutes.');
    }

    const transactionId = this.generateTransactionId();
    const deviceInfo = this.getDeviceInfo(request);
    
    // Create audit log entry
    const auditLog: PaymentAuditLog = {
      transactionId,
      memberId: 0, // Will be set from user context
      clubId: 0, // Will be set from user context
      amount: 0, // Will be set from response
      status: 'initiated',
      paymentMethodType: 'card',
      deviceInfo,
      timestamp: new Date().toISOString(),
      riskScore: riskAssessment.score,
      fraudFlags: riskAssessment.flags,
    };

    try {
      // Enhanced request with security metadata
      const enhancedRequest = {
        ...request,
        deviceInfo,
        timestamp: new Date().toISOString(),
        transactionId,
        riskScore: riskAssessment.score,
      };

      // PAY-05 fix: Create copy to prevent reference mutation
      this.addAuditLog({ ...auditLog, status: 'processing' });

      const response = await this.axiosInstance.post<PaymentResponse>(
        '/api/v1/users/me/dues/pay',
        enhancedRequest
      );

      // PAY-05 fix: Create copy with updated success data
      this.addAuditLog({
        ...auditLog,
        status: 'completed',
        amount: response.data.amount,
        memberId: response.data.memberId,
        clubId: response.data.clubId,
      });

      // Clear failed attempts on success
      this.failedAttempts.delete(userKey);

      return response.data;
    } catch (error) {

      // PAY-05 fix: Create copy with failure data
      this.addAuditLog({
        ...auditLog,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : undefined,
      });

      // Track failed attempts
      this.recordFailedAttempt(userKey);
      
      if (error && typeof error === 'object' && 
          (('response' in error) || ('request' in error) || error.constructor?.name === 'AxiosError')) {
        throw this.handleApiError(error);
      }
      throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Validate PayMyDuesRequest data
   */
  private validatePayMyDuesRequest(request: PayMyDuesRequest): void {
    if (!request) {
      throw new Error('Payment request is required');
    }

    if (!request.paymentMethodId || typeof request.paymentMethodId !== 'string') {
      throw new Error('Valid payment method is required');
    }

    if (!request.membershipTypeId || typeof request.membershipTypeId !== 'number') {
      throw new Error('Valid membership type is required');
    }

    // PAY-04 fix: More flexible payment method validation
    // Stripe payment methods start with 'pm_' but may contain various characters
    if (!request.paymentMethodId.startsWith('pm_') || request.paymentMethodId.length < 5) {
      throw new Error('Invalid payment method format');
    }
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `tx_${timestamp}_${random}`;
  }

  /**
   * Get device information for security tracking
   */
  private getDeviceInfo(request: PayMyDuesRequest): PaymentAuditLog['deviceInfo'] {
    const platformConfig = getPlatformConfig();
    
    return {
      platform: request.deviceInfo?.platform || platformConfig.platform || 'unknown',
      version: request.deviceInfo?.version || '1.0.0',
      userAgent: request.deviceInfo?.userAgent || `GatherGrove-Mobile/1.0.0 (${platformConfig.platform})`,
    };
  }

  /**
   * Assess payment risk based on patterns and behavior
   */
  private async assessPaymentRisk(request: PayMyDuesRequest): Promise<{
    isHighRisk: boolean;
    score: number;
    flags: string[];
  }> {
    const flags: string[] = [];
    let score = 0;

    // Check for rapid successive payments
    const recentPayments = this.auditLogs.filter(
      log => log.timestamp > new Date(Date.now() - 5 * 60 * 1000).toISOString()
    );
    
    if (recentPayments.length > 2) {
      flags.push('rapid_payments');
      score += 30;
    }

    // PAY-04 fix: More flexible payment method validation
    if (!request.paymentMethodId.startsWith('pm_') || request.paymentMethodId.length < 5) {
      flags.push('invalid_payment_method_format');
      score += 50;
    }

    // Check for suspicious patterns in recent failures
    const recentFailures = this.auditLogs.filter(
      log => log.status === 'failed' &&
             log.timestamp > new Date(Date.now() - 30 * 60 * 1000).toISOString()
    );
    
    if (recentFailures.length > 5) {
      flags.push('high_failure_rate');
      score += 40;
    }

    return {
      isHighRisk: score >= 70,
      score,
      flags,
    };
  }

  /**
   * Check if user is locked out due to failed attempts
   */
  private isUserLockedOut(userKey: string): boolean {
    const attempts = this.failedAttempts.get(userKey);
    if (!attempts) return false;

    const now = new Date();
    const timeSinceLastAttempt = now.getTime() - attempts.lastAttempt.getTime();
    
    if (timeSinceLastAttempt > this.lockoutDuration) {
      this.failedAttempts.delete(userKey);
      return false;
    }

    return attempts.count >= this.maxFailedAttempts;
  }

  /**
   * Record failed payment attempt
   */
  private recordFailedAttempt(userKey: string): void {
    const existing = this.failedAttempts.get(userKey);
    const now = new Date();

    if (existing) {
      existing.count++;
      existing.lastAttempt = now;
    } else {
      this.failedAttempts.set(userKey, {
        count: 1,
        lastAttempt: now,
      });
    }

    // PAY-01 fix: Persist failed attempts
    this.persistFailedAttempts().catch(() => {
      // Silent fail - in-memory tracking still works
    });
  }

  /**
   * Add audit log entry with rotation
   */
  private addAuditLog(log: PaymentAuditLog): void {
    this.auditLogs.push(log);

    // Rotate logs to prevent memory bloat
    if (this.auditLogs.length > this.maxAuditLogs) {
      this.auditLogs = this.auditLogs.slice(-this.maxAuditLogs);
    }

    // PAY-02 fix: Persist audit logs
    this.persistAuditLogs().catch(() => {
      // Silent fail - in-memory tracking still works
    });

    // In production, send to secure logging service
    if (!__DEV__) {
      this.sendToSecureLogging(log);
    }
  }

  /**
   * PAY-03 fix: Send audit log to secure logging service
   */
  private async sendToSecureLogging(log: PaymentAuditLog): Promise<void> {
    // Obfuscate sensitive data before logging
    const sanitizedLog = {
      ...log,
      paymentMethodId: log.paymentMethodLast4 ? `****${log.paymentMethodLast4}` : 'hidden',
    };

    try {
      // PAY-03 fix: Actually send to backend audit endpoint
      await this.axiosInstance.post('/api/v1/audit/payment', sanitizedLog);
    } catch (_error) {
      // Silent fail - don't block payments for logging failures
      // The log is already persisted locally via persistAuditLogs
    }
  }

  /**
   * Get payment audit logs (for debugging/monitoring)
   */
  getAuditLogs(): PaymentAuditLog[] {
    return [...this.auditLogs]; // Return copy to prevent mutation
  }

  /**
   * PAY-01/PAY-02 fix: Restore persisted data on startup
   */
  private async restorePersistedData(): Promise<void> {
    await Promise.all([
      this.restoreFailedAttempts(),
      this.restoreAuditLogs(),
    ]);
  }

  /**
   * PAY-01 fix: Persist failed attempts to AsyncStorage
   */
  private async persistFailedAttempts(): Promise<void> {
    try {
      const data: { [key: string]: { count: number; lastAttempt: string } } = {};
      this.failedAttempts.forEach((value, key) => {
        data[key] = {
          count: value.count,
          lastAttempt: value.lastAttempt.toISOString(),
        };
      });
      await this.asyncStorage.setItem(PAYMENT_FAILED_ATTEMPTS_KEY, JSON.stringify(data));
    } catch (_error) {
      // Silent fail - in-memory tracking still works
    }
  }

  /**
   * PAY-01 fix: Restore failed attempts from AsyncStorage
   */
  private async restoreFailedAttempts(): Promise<void> {
    try {
      const stored = await this.asyncStorage.getItem(PAYMENT_FAILED_ATTEMPTS_KEY);
      if (stored) {
        const data = JSON.parse(stored) as { [key: string]: { count: number; lastAttempt: string } };
        const now = Date.now();
        Object.entries(data).forEach(([key, value]) => {
          const lastAttempt = new Date(value.lastAttempt);
          // Only restore if still within lockout duration
          if (now - lastAttempt.getTime() < this.lockoutDuration) {
            this.failedAttempts.set(key, {
              count: value.count,
              lastAttempt,
            });
          }
        });
      }
    } catch (_error) {
      // Silent fail - will use in-memory only
    }
  }

  /**
   * PAY-02 fix: Persist audit logs to AsyncStorage
   */
  private async persistAuditLogs(): Promise<void> {
    try {
      await this.asyncStorage.setItem(PAYMENT_AUDIT_LOGS_KEY, JSON.stringify(this.auditLogs));
    } catch (_error) {
      // Silent fail - in-memory tracking still works
    }
  }

  /**
   * PAY-02 fix: Restore audit logs from AsyncStorage
   */
  private async restoreAuditLogs(): Promise<void> {
    try {
      const stored = await this.asyncStorage.getItem(PAYMENT_AUDIT_LOGS_KEY);
      if (stored) {
        const logs = JSON.parse(stored) as PaymentAuditLog[];
        // Only restore logs from the last hour for risk assessment relevance
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        this.auditLogs = logs.filter(log => log.timestamp > oneHourAgo);
      }
    } catch (_error) {
      // Silent fail - will use in-memory only
    }
  }

  /**
   * Handle API errors and convert to user-friendly messages
   */
  private handleApiError(error: unknown): Error {
    const appError = ErrorHandler.handlePaymentError(error, 'Payment Processing');
    return new Error(appError.message);
  }
}

// Export class for testing with dependency injection
export { PaymentService };

// Export singleton for app usage
export const paymentService = new PaymentService(); 