/**
 * securityIntegration Tests
 *
 * Tests security orchestration service that coordinates security features
 * including input validation, API security, payment security, authentication
 * monitoring, and security dashboards.
 *
 * Following boundary mocking rule:
 * ✅ Mock: auth/payment/cache/security services, API client, security utils (external)
 * ❌ Don't mock: securityManager itself, internal logic
 */

import { SecurityManager, securityManager } from '../securityIntegration';
import { authService } from '../authService';
import { paymentService } from '../paymentService';
import { cacheService } from '../cacheService';
import { securityLogger } from '../securityLogger';
import { apiClient } from '../apiClient';
import { InputValidator, NetworkSecurity, RuntimeProtection } from '@/utils/security';

// Mock external services (boundary mocking)
jest.mock('../authService');
jest.mock('../paymentService');
jest.mock('../cacheService');
jest.mock('../securityLogger');
jest.mock('../apiClient');
jest.mock('@/utils/security');

describe('SecurityManager', () => {
  beforeEach(() => {
    // Reset singleton instance to force re-initialization
    // This allows initialization tests to verify initialization logic each time
    (SecurityManager as any).instance = undefined;

    // Clear call history only (using mockClear instead of clearAllMocks to preserve implementations)
    (RuntimeProtection.enableAntiDebugging as jest.Mock).mockClear();
    (RuntimeProtection.checkAppIntegrity as jest.Mock).mockClear();
    (InputValidator.validateInputSecurity as jest.Mock).mockClear();
    (InputValidator.sanitizeInput as jest.Mock).mockClear();
    (NetworkSecurity.validateResponse as jest.Mock).mockClear();
    (securityLogger.logSecurityEvent as jest.Mock).mockClear();
    (securityLogger.cleanupOldEvents as jest.Mock).mockClear();
    (authService.setSessionTimeoutCallback as jest.Mock).mockClear();

    // Restore mock implementations
    (RuntimeProtection.enableAntiDebugging as jest.Mock).mockImplementation(() => {});
    (RuntimeProtection.checkAppIntegrity as jest.Mock).mockResolvedValue(true);
    (InputValidator.validateInputSecurity as jest.Mock).mockReturnValue({
      isSafe: true,
      riskScore: 10,
      threats: []
    });
    (InputValidator.sanitizeInput as jest.Mock).mockImplementation(input => input);
    (NetworkSecurity.validateResponse as jest.Mock).mockReturnValue(true);
    (securityLogger.logSecurityEvent as jest.Mock).mockResolvedValue(undefined);
    (securityLogger.cleanupOldEvents as jest.Mock).mockResolvedValue(undefined);
    (authService.setSessionTimeoutCallback as jest.Mock).mockImplementation(() => {});
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = SecurityManager.getInstance();
      const instance2 = SecurityManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should be initialized', async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(securityManager.isInitialized()).toBe(true);
    });
  });

  describe('Initialization', () => {
    it('should enable anti-debugging on init', async () => {
      SecurityManager.getInstance();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(RuntimeProtection.enableAntiDebugging).toHaveBeenCalled();
    });

    it('should perform app integrity check on init', async () => {
      SecurityManager.getInstance();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(RuntimeProtection.checkAppIntegrity).toHaveBeenCalled();
    });

    it('should log security event when integrity check fails', async () => {
      (RuntimeProtection.checkAppIntegrity as jest.Mock).mockResolvedValueOnce(false);

      SecurityManager.getInstance();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        'SUSPICIOUS_ACTIVITY',
        'HIGH',
        expect.objectContaining({
          action: 'APP_INTEGRITY_FAILED',
          resource: 'APPLICATION'
        })
      );
    });

    it('should clean up old security events on init', async () => {
      SecurityManager.getInstance();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(securityLogger.cleanupOldEvents).toHaveBeenCalledWith(
        30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
      );
    });

    it('should set session timeout callback', async () => {
      SecurityManager.getInstance();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(authService.setSessionTimeoutCallback).toHaveBeenCalled();
    });

    it('should log error when initialization fails', async () => {
      (RuntimeProtection.enableAntiDebugging as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Initialization error');
      });

      SecurityManager.getInstance();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        'SUSPICIOUS_ACTIVITY',
        'HIGH',
        expect.objectContaining({
          action: 'SECURITY_INIT_FAILED',
          resource: 'SECURITY_MANAGER'
        })
      );
    });
  });

  describe('Input Validation', () => {
    it('should validate user input successfully', async () => {
      const result = await securityManager.validateUserInput(
        'safe input',
        'test-context'
      );

      expect(result.isValid).toBe(true);
      expect(result.sanitizedInput).toBe('safe input');
      expect(result.threats).toEqual([]);
      expect(result.riskScore).toBe(10);
    });

    it('should sanitize input', async () => {
      (InputValidator.sanitizeInput as jest.Mock).mockReturnValueOnce('sanitized');

      const result = await securityManager.validateUserInput(
        '<script>alert("xss")</script>',
        'test-context'
      );

      expect(result.sanitizedInput).toBe('sanitized');
      expect(InputValidator.sanitizeInput).toHaveBeenCalled();
    });

    it('should detect high-risk input', async () => {
      (InputValidator.validateInputSecurity as jest.Mock).mockReturnValueOnce({
        isSafe: false,
        riskScore: 80,
        threats: ['XSS', 'SQL_INJECTION']
      });

      const result = await securityManager.validateUserInput(
        'malicious input',
        'test-context',
        'user123'
      );

      expect(result.isValid).toBe(false);
      expect(result.riskScore).toBe(80);
      expect(result.threats).toContain('XSS');
    });

    it('should log critical security events for high-risk input', async () => {
      (InputValidator.validateInputSecurity as jest.Mock).mockReturnValueOnce({
        isSafe: false,
        riskScore: 90,
        threats: ['XSS']
      });

      await securityManager.validateUserInput(
        'malicious',
        'test-context',
        'user123'
      );

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        'MALICIOUS_INPUT_DETECTED',
        'CRITICAL',
        expect.objectContaining({
          action: 'INPUT_VALIDATION',
          resource: 'test-context'
        }),
        expect.objectContaining({
          riskScore: 90,
          threatTypes: ['XSS']
        }),
        'user123'
      );
    });

    it('should log high security events for medium-risk input', async () => {
      (InputValidator.validateInputSecurity as jest.Mock).mockReturnValueOnce({
        isSafe: false,
        riskScore: 60,
        threats: ['SUSPICIOUS_PATTERN']
      });

      await securityManager.validateUserInput('suspicious', 'test-context');

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        'MALICIOUS_INPUT_DETECTED',
        'HIGH',
        expect.any(Object),
        expect.any(Object),
        undefined
      );
    });

    it('should log medium security events for low-risk input', async () => {
      (InputValidator.validateInputSecurity as jest.Mock).mockReturnValueOnce({
        isSafe: false,
        riskScore: 40,
        threats: ['MINOR_ISSUE']
      });

      await securityManager.validateUserInput('questionable', 'test-context');

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        'MALICIOUS_INPUT_DETECTED',
        'MEDIUM',
        expect.any(Object),
        expect.any(Object),
        undefined
      );
    });

    it('should not log events for safe input', async () => {
      (InputValidator.validateInputSecurity as jest.Mock).mockReturnValueOnce({
        isSafe: true,
        riskScore: 10,
        threats: []
      });

      await securityManager.validateUserInput('safe', 'test-context');

      expect(securityLogger.logSecurityEvent).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      (InputValidator.validateInputSecurity as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Validation error');
      });

      const result = await securityManager.validateUserInput('input', 'test-context');

      expect(result.isValid).toBe(false);
      expect(result.sanitizedInput).toBe('');
      expect(result.threats).toContain('VALIDATION_ERROR');
      expect(result.riskScore).toBe(50);
    });
  });

  describe('Secure API Requests', () => {
    it('should make GET request successfully', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: 'test' });

      const result = await securityManager.secureApiRequest('GET', '/api/test');

      expect(apiClient.get).toHaveBeenCalledWith('/api/test', expect.any(Object));
      expect(result).toEqual({ data: 'test' });
    });

    it('should make POST request successfully', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ id: 1 });

      const result = await securityManager.secureApiRequest(
        'POST',
        '/api/test',
        { name: 'test' }
      );

      expect(apiClient.post).toHaveBeenCalledWith('/api/test', { name: 'test' });
      expect(result).toEqual({ id: 1 });
    });

    it('should make PUT request successfully', async () => {
      (apiClient.put as jest.Mock).mockResolvedValueOnce({ updated: true });

      await securityManager.secureApiRequest('PUT', '/api/test', { id: 1 });

      expect(apiClient.put).toHaveBeenCalledWith('/api/test', { id: 1 });
    });

    it('should make PATCH request successfully', async () => {
      (apiClient.patch as jest.Mock).mockResolvedValueOnce({ patched: true });

      await securityManager.secureApiRequest('PATCH', '/api/test', { field: 'value' });

      expect(apiClient.patch).toHaveBeenCalledWith('/api/test', { field: 'value' });
    });

    it('should make DELETE request successfully', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({ deleted: true });

      await securityManager.secureApiRequest('DELETE', '/api/test');

      expect(apiClient.delete).toHaveBeenCalledWith('/api/test');
    });

    it('should validate input when validateInput option is true', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ success: true });

      await securityManager.secureApiRequest(
        'POST',
        '/api/test',
        { data: 'test' },
        { validateInput: true, userId: 'user123' }
      );

      expect(InputValidator.validateInputSecurity).toHaveBeenCalled();
    });

    it('should block request when input validation fails with high risk', async () => {
      (InputValidator.validateInputSecurity as jest.Mock).mockReturnValueOnce({
        isSafe: false,
        riskScore: 80,
        threats: ['XSS']
      });

      await expect(
        securityManager.secureApiRequest(
          'POST',
          '/api/test',
          { data: '<script>' },
          { validateInput: true }
        )
      ).rejects.toThrow('Request blocked due to security concerns');
    });

    it('should allow request when validation risk is acceptable', async () => {
      (InputValidator.validateInputSecurity as jest.Mock).mockReturnValueOnce({
        isSafe: false,
        riskScore: 40,
        threats: ['MINOR']
      });
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ success: true });

      await expect(
        securityManager.secureApiRequest(
          'POST',
          '/api/test',
          { data: 'test' },
          { validateInput: true }
        )
      ).resolves.toBeDefined();
    });

    it('should validate response', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: 'test' });

      await securityManager.secureApiRequest('GET', '/api/test');

      expect(NetworkSecurity.validateResponse).toHaveBeenCalled();
    });

    it('should block malicious response', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ malicious: 'data' });
      (NetworkSecurity.validateResponse as jest.Mock).mockReturnValueOnce(false);

      await expect(
        securityManager.secureApiRequest('GET', '/api/test', undefined, { userId: 'user123' })
      ).rejects.toThrow('Response blocked due to security concerns');

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        'SUSPICIOUS_ACTIVITY',
        'HIGH',
        expect.objectContaining({
          action: 'MALICIOUS_RESPONSE_DETECTED',
          resource: '/api/test'
        }),
        undefined,
        'user123'
      );
    });

    it('should log API failures', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        securityManager.secureApiRequest('GET', '/api/test', undefined, { userId: 'user123' })
      ).rejects.toThrow();

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        'NETWORK_INTRUSION',
        'MEDIUM',
        expect.objectContaining({
          action: 'API_REQUEST_FAILED_GET',
          resource: '/api/test',
          errorCode: 'Network error'
        }),
        undefined,
        'user123'
      );
    });

    it('should pass cache options to API client', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: 'cached' });

      await securityManager.secureApiRequest('GET', '/api/test', undefined, {
        useCache: true,
        cacheKey: 'test-key'
      });

      expect(apiClient.get).toHaveBeenCalledWith('/api/test', {
        useCache: true,
        cacheKey: 'test-key'
      });
    });
  });

  describe('Payment Security', () => {
    const mockPaymentData = {
      paymentMethodId: 'pm_123',
      membershipTypeId: 1,
      clubId: 1,
      amount: 100
    };

    const mockPaymentResult = {
      paymentId: 1,
      amount: 100,
      memberId: 1,
      status: 'succeeded' as const
    };

    it('should process secure payment successfully', async () => {
      (paymentService.payMyDues as jest.Mock).mockResolvedValueOnce(mockPaymentResult);

      const result = await securityManager.securePaymentRequest(
        mockPaymentData,
        'user123'
      );

      expect(result).toEqual(mockPaymentResult);
      expect(paymentService.payMyDues).toHaveBeenCalledWith(mockPaymentData);
    });

    it('should log payment initiation', async () => {
      (paymentService.payMyDues as jest.Mock).mockResolvedValueOnce(mockPaymentResult);

      await securityManager.securePaymentRequest(mockPaymentData, 'user123');

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        'SUSPICIOUS_ACTIVITY',
        'LOW',
        expect.objectContaining({
          action: 'PAYMENT_INITIATED',
          resource: 'PAYMENT_SYSTEM'
        }),
        expect.objectContaining({
          riskScore: 20,
          threatTypes: ['PAYMENT_ACTIVITY']
        }),
        'user123'
      );
    });

    it('should log payment completion', async () => {
      (paymentService.payMyDues as jest.Mock).mockResolvedValueOnce(mockPaymentResult);

      await securityManager.securePaymentRequest(mockPaymentData, 'user123');

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        'SUSPICIOUS_ACTIVITY',
        'LOW',
        expect.objectContaining({
          action: 'PAYMENT_COMPLETED',
          resource: 'PAYMENT_SYSTEM'
        }),
        expect.objectContaining({
          riskScore: 10,
          threatTypes: ['PAYMENT_SUCCESS']
        }),
        'user123'
      );
    });

    it('should log payment fraud when payment fails', async () => {
      (paymentService.payMyDues as jest.Mock).mockRejectedValueOnce(
        new Error('Payment declined')
      );

      await expect(
        securityManager.securePaymentRequest(mockPaymentData, 'user123')
      ).rejects.toThrow();

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        'PAYMENT_FRAUD_DETECTED',
        'HIGH',
        expect.objectContaining({
          action: 'PAYMENT_FAILED',
          resource: 'PAYMENT_SYSTEM',
          errorCode: 'Payment declined'
        }),
        expect.objectContaining({
          riskScore: 60,
          threatTypes: ['PAYMENT_FRAUD', 'PAYMENT_FAILURE']
        }),
        'user123'
      );
    });
  });

  describe('Authentication Monitoring', () => {
    it('should monitor LOGIN_ATTEMPT event', async () => {
      await securityManager.monitorAuthenticationEvent(
        'LOGIN_ATTEMPT',
        'user123',
        { email: 'test@example.com' }
      );

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        'SUSPICIOUS_ACTIVITY',
        'LOW',
        expect.objectContaining({
          action: 'LOGIN_ATTEMPT',
          resource: 'AUTHENTICATION_SYSTEM'
        }),
        expect.objectContaining({
          riskScore: 10,
          threatTypes: ['LOGIN_ATTEMPT']
        }),
        'user123'
      );
    });

    it('should monitor LOGIN_SUCCESS event', async () => {
      await securityManager.monitorAuthenticationEvent('LOGIN_SUCCESS', 'user123');

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        'SUSPICIOUS_ACTIVITY',
        'LOW',
        expect.any(Object),
        expect.objectContaining({
          riskScore: 10
        }),
        'user123'
      );
    });

    it('should monitor LOGIN_FAILED event with higher severity', async () => {
      await securityManager.monitorAuthenticationEvent('LOGIN_FAILED', 'user123');

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        'AUTHENTICATION_FAILED',
        'MEDIUM',
        expect.objectContaining({
          action: 'LOGIN_FAILED'
        }),
        expect.objectContaining({
          riskScore: 30
        }),
        'user123'
      );
    });

    it('should monitor LOGOUT event', async () => {
      await securityManager.monitorAuthenticationEvent('LOGOUT', 'user123');

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        'SUSPICIOUS_ACTIVITY',
        'LOW',
        expect.objectContaining({
          action: 'LOGOUT'
        }),
        expect.any(Object),
        'user123'
      );
    });
  });

  describe('Security Dashboard', () => {
    const mockMetrics = {
      totalEvents: 100,
      eventsBySeverity: { LOW: 50, MEDIUM: 30, HIGH: 15, CRITICAL: 5 },
      eventsByType: { SUSPICIOUS_ACTIVITY: 80, MALICIOUS_INPUT: 20 },
      averageRiskScore: 25
    };

    const mockEvents = [
      { id: '1', type: 'SUSPICIOUS_ACTIVITY' as const, severity: 'LOW' as const },
      { id: '2', type: 'MALICIOUS_INPUT_DETECTED' as const, severity: 'HIGH' as const }
    ];

    const mockNetworkStatus = { isOnline: true, queuedRequests: 0 };
    const mockCacheStats = {
      totalEntries: 10,
      totalSize: '1KB',
      pendingSyncs: 2,
      conflicts: 0
    };

    beforeEach(() => {
      (securityLogger.getSecurityMetrics as jest.Mock).mockResolvedValue(mockMetrics);
      (securityLogger.getSecurityEvents as jest.Mock).mockResolvedValue(mockEvents);
      (apiClient.getNetworkStatus as jest.Mock).mockResolvedValue(mockNetworkStatus);
      (cacheService.getStats as jest.Mock).mockResolvedValue(mockCacheStats);
    });

    it('should get security dashboard data', async () => {
      const dashboard = await securityManager.getSecurityDashboard();

      expect(dashboard.metrics).toEqual(mockMetrics);
      expect(dashboard.recentEvents).toEqual(mockEvents);
      expect(dashboard.networkStatus).toEqual(mockNetworkStatus);
      expect(dashboard.cacheStats).toEqual(mockCacheStats);
    });

    it('should calculate system health', async () => {
      const dashboard = await securityManager.getSecurityDashboard();

      expect(dashboard.systemHealth).toBeDefined();
      expect(dashboard.systemHealth.isSecure).toBe(true);
      expect(dashboard.systemHealth.riskLevel).toBe('LOW');
      expect(dashboard.systemHealth.activeThreats).toBe(1); // 1 HIGH event
      expect(dashboard.systemHealth.lastUpdate).toBeDefined();
    });

    it('should calculate CRITICAL risk level for high average risk score', async () => {
      (securityLogger.getSecurityMetrics as jest.Mock).mockResolvedValueOnce({
        ...mockMetrics,
        averageRiskScore: 80
      });

      const dashboard = await securityManager.getSecurityDashboard();

      expect(dashboard.systemHealth.riskLevel).toBe('CRITICAL');
      expect(dashboard.systemHealth.isSecure).toBe(false);
    });

    it('should calculate HIGH risk level', async () => {
      (securityLogger.getSecurityMetrics as jest.Mock).mockResolvedValueOnce({
        ...mockMetrics,
        averageRiskScore: 60
      });

      const dashboard = await securityManager.getSecurityDashboard();

      expect(dashboard.systemHealth.riskLevel).toBe('HIGH');
    });

    it('should calculate MEDIUM risk level', async () => {
      (securityLogger.getSecurityMetrics as jest.Mock).mockResolvedValueOnce({
        ...mockMetrics,
        averageRiskScore: 40
      });

      const dashboard = await securityManager.getSecurityDashboard();

      expect(dashboard.systemHealth.riskLevel).toBe('MEDIUM');
    });

    it('should mark system as insecure with many active threats', async () => {
      (securityLogger.getSecurityEvents as jest.Mock).mockResolvedValueOnce([
        { severity: 'HIGH' },
        { severity: 'HIGH' },
        { severity: 'CRITICAL' },
        { severity: 'CRITICAL' },
        { severity: 'CRITICAL' }
      ]);

      const dashboard = await securityManager.getSecurityDashboard();

      expect(dashboard.systemHealth.isSecure).toBe(false);
      expect(dashboard.systemHealth.activeThreats).toBe(5);
    });

    it('should fetch recent events with limit', async () => {
      await securityManager.getSecurityDashboard();

      expect(securityLogger.getSecurityEvents).toHaveBeenCalledWith({ limit: 10 });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup security services', async () => {
      await securityManager.cleanup();

      expect(RuntimeProtection.disableAntiDebugging).toHaveBeenCalled();
      expect(cacheService.clear).toHaveBeenCalled();
      expect(apiClient.clearRequestQueue).toHaveBeenCalled();
      expect(authService.cleanup).toHaveBeenCalled();
    });

    it('should set initialized to false after cleanup', async () => {
      await securityManager.cleanup();

      expect(securityManager.isInitialized()).toBe(false);
    });

    it('should handle cleanup errors gracefully', async () => {
      (cacheService.clear as jest.Mock).mockRejectedValueOnce(new Error('Cleanup error'));

      await expect(securityManager.cleanup()).resolves.not.toThrow();
    });
  });
});
