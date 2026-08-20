import { securityLogger, SecurityEventType, SecuritySeverity } from '../securityLogger';

describe('SecurityLogger', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    // Set __DEV__ to false by default to avoid ReferenceError
    (global as any).__DEV__ = false;
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    delete (global as any).__DEV__;
  });

  describe('logSecurityEvent', () => {
    it('should log security event with type and severity', async () => {
      (global as any).__DEV__ = true;
      await securityLogger.logSecurityEvent('AUTHENTICATION_FAILED', 'HIGH');

      // Verify console.warn was called with correct data
      expect(consoleWarnSpy).toHaveBeenCalled();
      const call = consoleWarnSpy.mock.calls[0];
      expect(call[0]).toContain('[Security]');
      expect(call[0]).toContain('HIGH');
      expect(call[0]).toContain('AUTHENTICATION_FAILED');
    });

    it('should log security event with default MEDIUM severity', async () => {
      (global as any).__DEV__ = true;
      await securityLogger.logSecurityEvent('SESSION_EXPIRED');

      expect(consoleWarnSpy).toHaveBeenCalled();
      const call = consoleWarnSpy.mock.calls[0];
      expect(call[0]).toContain('[Security]');
      expect(call[0]).toContain('MEDIUM'); // Default severity
      expect(call[0]).toContain('SESSION_EXPIRED');
    });

    it('should log security event with context', async () => {
      (global as any).__DEV__ = true;
      const context = {
        action: 'login',
        resource: '/api/auth/login',
        apiEndpoint: '/api/auth/login',
      };

      await securityLogger.logSecurityEvent('AUTHENTICATION_FAILED', 'HIGH', context);

      expect(consoleWarnSpy).toHaveBeenCalled();
      const loggedData = consoleWarnSpy.mock.calls[0][1];
      expect(loggedData.context).toEqual(context);
    });

    it('should log security event with threat indicators', async () => {
      (global as any).__DEV__ = true;
      const threatIndicators = {
        riskScore: 0.9,
        threatTypes: ['brute-force', 'credential-stuffing'],
      };

      await securityLogger.logSecurityEvent(
        'AUTHENTICATION_FAILED',
        'CRITICAL',
        undefined,
        threatIndicators
      );

      expect(consoleWarnSpy).toHaveBeenCalled();
      const call = consoleWarnSpy.mock.calls[0];
      expect(call[0]).toContain('CRITICAL');
      expect(call[0]).toContain('AUTHENTICATION_FAILED');
    });

    it('should log security event with userId', async () => {
      (global as any).__DEV__ = true;
      await securityLogger.logSecurityEvent(
        'UNAUTHORIZED_ACCESS',
        'HIGH',
        undefined,
        undefined,
        'user-123'
      );

      expect(consoleWarnSpy).toHaveBeenCalled();
      const loggedData = consoleWarnSpy.mock.calls[0][1];
      expect(loggedData.userId).toBe('user-123');
    });

    it('should log security event with full SecurityEvent object', async () => {
      (global as any).__DEV__ = true;
      const event = {
        id: 'evt-123',
        type: 'PAYMENT_FRAUD_DETECTED' as SecurityEventType,
        severity: 'CRITICAL' as SecuritySeverity,
        timestamp: new Date().toISOString(),
        userId: 'user-456',
        sessionId: 'sess-789',
        deviceInfo: {
          platform: 'iOS',
          version: '17.0',
          userAgent: 'GatherGrove-iOS',
          ipAddress: '192.168.1.1',
        },
        context: {
          action: 'payment',
          resource: '/api/billing/payment',
          additionalData: { amount: 100, currency: 'USD' },
        },
        threatIndicators: {
          riskScore: 0.95,
          threatTypes: ['card-testing', 'velocity-abuse'],
        },
      };

      await securityLogger.logSecurityEvent(event);

      expect(consoleWarnSpy).toHaveBeenCalled();
      const call = consoleWarnSpy.mock.calls[0];
      expect(call[0]).toContain('[Security]');
      expect(call[0]).toContain('CRITICAL');
      expect(call[0]).toContain('PAYMENT_FRAUD_DETECTED');
    });

    it('should log in DEV mode with console.warn', async () => {
      (global as any).__DEV__ = true;

      await securityLogger.logSecurityEvent('SUSPICIOUS_ACTIVITY', 'MEDIUM');

      expect(consoleWarnSpy).toHaveBeenCalled();
      const call = consoleWarnSpy.mock.calls[0];
      expect(call[0]).toContain('[Security]');
      expect(call[0]).toContain('MEDIUM');
      expect(call[0]).toContain('SUSPICIOUS_ACTIVITY');

      delete (global as any).__DEV__;
    });

    it('should not log in production mode', async () => {
      (global as any).__DEV__ = false;

      await securityLogger.logSecurityEvent('DATA_BREACH_SUSPECTED', 'CRITICAL');

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      delete (global as any).__DEV__;
    });

    it('should generate secure ID for events', async () => {
      (global as any).__DEV__ = true;

      await securityLogger.logSecurityEvent('RATE_LIMIT_EXCEEDED', 'LOW');

      expect(consoleWarnSpy).toHaveBeenCalled();
      const loggedData = consoleWarnSpy.mock.calls[0][1];
      expect(loggedData.id).toBeDefined();
      expect(typeof loggedData.id).toBe('string');
      expect(loggedData.id.length).toBeGreaterThan(0);

      delete (global as any).__DEV__;
    });

    it('should log different security event types', async () => {
      (global as any).__DEV__ = true;
      const eventTypes: SecurityEventType[] = [
        'AUTHENTICATION_FAILED',
        'AUTHENTICATION_LOCKED',
        'SESSION_EXPIRED',
        'PAYMENT_FRAUD_DETECTED',
        'CERTIFICATE_VALIDATION_FAILED',
        'MALICIOUS_INPUT_DETECTED',
        'NETWORK_INTRUSION',
        'DATA_BREACH_SUSPECTED',
        'UNAUTHORIZED_ACCESS',
        'SUSPICIOUS_ACTIVITY',
        'RATE_LIMIT_EXCEEDED',
        'INJECTION_ATTEMPT',
        'XSS_ATTEMPT',
        'CSRF_ATTEMPT',
      ];

      for (const eventType of eventTypes) {
        await securityLogger.logSecurityEvent(eventType, 'LOW');
      }

      // Verify all event types were logged
      expect(consoleWarnSpy).toHaveBeenCalledTimes(eventTypes.length);
    });

    it('should log different severity levels', async () => {
      (global as any).__DEV__ = true;
      const severities: SecuritySeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

      for (const severity of severities) {
        await securityLogger.logSecurityEvent('SUSPICIOUS_ACTIVITY', severity);
      }

      // Verify all severity levels were logged
      expect(consoleWarnSpy).toHaveBeenCalledTimes(severities.length);
      // Verify each severity appears in the logs
      severities.forEach((severity, index) => {
        expect(consoleWarnSpy.mock.calls[index][0]).toContain(severity);
      });
    });
  });

  describe('logAuthenticationFailure', () => {
    it('should log authentication failure with userId and reason', async () => {
      (global as any).__DEV__ = true;
      await securityLogger.logAuthenticationFailure('user-123', 'invalid credentials');

      expect(consoleWarnSpy).toHaveBeenCalled();
      const call = consoleWarnSpy.mock.calls[0];
      expect(call[0]).toContain('[Security]');
      expect(call[0]).toContain('AUTH_FAILURE');
      expect(call[0]).toContain('invalid credentials');
      expect(call[1]).toEqual({ userId: 'user-123' });
    });

    it('should log in DEV mode with console.warn', async () => {
      (global as any).__DEV__ = true;

      await securityLogger.logAuthenticationFailure('user-456', 'account locked');

      expect(consoleWarnSpy).toHaveBeenCalled();
      const call = consoleWarnSpy.mock.calls[0];
      expect(call[0]).toContain('[Security]');
      expect(call[0]).toContain('AUTH_FAILURE');
      expect(call[0]).toContain('account locked');
      expect(call[1]).toEqual({ userId: 'user-456' });

      delete (global as any).__DEV__;
    });

    it('should not log in production mode', async () => {
      (global as any).__DEV__ = false;

      await securityLogger.logAuthenticationFailure('user-789', 'session expired');

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      delete (global as any).__DEV__;
    });
  });

  describe('logSuspiciousActivity', () => {
    it('should log suspicious activity with context', async () => {
      (global as any).__DEV__ = true;
      const context = {
        action: 'rapid-requests',
        ipAddress: '192.168.1.1',
        requestCount: 100,
      };

      await securityLogger.logSuspiciousActivity('Rate limit exceeded', context);

      expect(consoleWarnSpy).toHaveBeenCalled();
      const call = consoleWarnSpy.mock.calls[0];
      expect(call[0]).toContain('[Security]');
      expect(call[0]).toContain('SUSPICIOUS');
      expect(call[0]).toContain('Rate limit exceeded');
      expect(call[1]).toEqual(context);
    });

    it('should log in DEV mode with console.warn', async () => {
      (global as any).__DEV__ = true;

      const context = {
        endpoint: '/api/payments',
        suspiciousPattern: 'card-testing',
      };

      await securityLogger.logSuspiciousActivity('Payment fraud detected', context);

      expect(consoleWarnSpy).toHaveBeenCalled();
      const call = consoleWarnSpy.mock.calls[0];
      expect(call[0]).toContain('[Security]');
      expect(call[0]).toContain('SUSPICIOUS');
      expect(call[0]).toContain('Payment fraud detected');
      expect(call[1]).toEqual(context);

      delete (global as any).__DEV__;
    });

    it('should not log in production mode', async () => {
      (global as any).__DEV__ = false;

      await securityLogger.logSuspiciousActivity('Data exfiltration attempt', {
        fileCount: 1000,
      });

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      delete (global as any).__DEV__;
    });

    it('should handle empty context object', async () => {
      (global as any).__DEV__ = true;
      await securityLogger.logSuspiciousActivity('Unknown activity', {});

      expect(consoleWarnSpy).toHaveBeenCalled();
      const call = consoleWarnSpy.mock.calls[0];
      expect(call[0]).toContain('Unknown activity');
      expect(call[1]).toEqual({});
    });
  });

  describe('getSecurityMetrics', () => {
    it('should return placeholder security metrics', async () => {
      const metrics = await securityLogger.getSecurityMetrics();

      expect(metrics).toEqual({
        totalEvents: 0,
        criticalEvents: 0,
        lastEventTime: null,
        eventsBySeverity: {},
        eventsByType: {},
        averageRiskScore: 0,
      });
    });

    it('should always return same placeholder metrics', async () => {
      const metrics1 = await securityLogger.getSecurityMetrics();
      const metrics2 = await securityLogger.getSecurityMetrics();

      expect(metrics1).toEqual(metrics2);
    });
  });

  describe('cleanupOldEvents', () => {
    it('should cleanup old events without error', async () => {
      await expect(securityLogger.cleanupOldEvents(30)).resolves.not.toThrow();
    });

    it('should accept different max age values', async () => {
      // Verify cleanupOldEvents completes without error for various values
      await expect(securityLogger.cleanupOldEvents(7)).resolves.not.toThrow();
      await expect(securityLogger.cleanupOldEvents(14)).resolves.not.toThrow();
      await expect(securityLogger.cleanupOldEvents(90)).resolves.not.toThrow();
    });
  });

  describe('getSecurityEvents', () => {
    it('should return empty array without filter', async () => {
      const events = await securityLogger.getSecurityEvents();

      expect(events).toEqual([]);
    });

    it('should return empty array with filter', async () => {
      const filter = {
        severity: 'HIGH' as SecuritySeverity,
        type: 'AUTHENTICATION_FAILED' as SecurityEventType,
      };

      const events = await securityLogger.getSecurityEvents(filter);

      expect(events).toEqual([]);
    });

    it('should handle date range filter', async () => {
      const filter = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
      };

      const events = await securityLogger.getSecurityEvents(filter);

      expect(events).toEqual([]);
    });

    it('should handle userId filter', async () => {
      const filter = {
        userId: 'user-123',
      };

      const events = await securityLogger.getSecurityEvents(filter);

      expect(events).toEqual([]);
    });

    it('should handle limit filter', async () => {
      const filter = {
        limit: 10,
      };

      const events = await securityLogger.getSecurityEvents(filter);

      expect(events).toEqual([]);
    });

    it('should handle complete filter', async () => {
      const filter = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        severity: 'CRITICAL' as SecuritySeverity,
        type: 'PAYMENT_FRAUD_DETECTED' as SecurityEventType,
        userId: 'user-456',
        limit: 50,
      };

      const events = await securityLogger.getSecurityEvents(filter);

      expect(events).toEqual([]);
    });
  });

  describe('ID generation (crypto API)', () => {
    it('should generate secure IDs', async () => {
      (global as any).__DEV__ = true;
      await securityLogger.logSecurityEvent('SUSPICIOUS_ACTIVITY', 'LOW');

      const loggedData = consoleWarnSpy.mock.calls[0][1];
      expect(loggedData.id).toBeDefined();
      expect(typeof loggedData.id).toBe('string');
      expect(loggedData.id.length).toBeGreaterThan(0);

      delete (global as any).__DEV__;
    });

    it('should generate different IDs for each call', async () => {
      (global as any).__DEV__ = true;

      await securityLogger.logSecurityEvent('SUSPICIOUS_ACTIVITY', 'LOW');
      const id1 = consoleWarnSpy.mock.calls[0][1].id;

      await securityLogger.logSecurityEvent('SUSPICIOUS_ACTIVITY', 'LOW');
      const id2 = consoleWarnSpy.mock.calls[1][1].id;

      expect(id1).not.toBe(id2);

      delete (global as any).__DEV__;
    });

    it('should handle crypto API variations gracefully', async () => {
      // Test that service works regardless of crypto API availability
      (global as any).__DEV__ = true;

      // Call multiple times to ensure consistent behavior
      await securityLogger.logSecurityEvent('RATE_LIMIT_EXCEEDED', 'LOW');
      await securityLogger.logSecurityEvent('INJECTION_ATTEMPT', 'MEDIUM');
      await securityLogger.logSecurityEvent('XSS_ATTEMPT', 'HIGH');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(3);

      delete (global as any).__DEV__;
    });

    it('should use crypto.getRandomValues fallback when randomUUID is not available (lines 87-90)', async () => {
      (global as any).__DEV__ = true;
      
      // Save original values
      const originalRandomUUID = global.crypto?.randomUUID;
      const originalGetRandomValues = global.crypto?.getRandomValues;
      
      // Mock getRandomValues with correct generic type signature
      const mockGetRandomValues = jest.fn(<T extends ArrayBufferView>(array: T): T => {
        // Fill with test data for deterministic behavior
        if (array instanceof Uint8Array) {
          for (let i = 0; i < array.length; i++) {
            array[i] = i % 256;
          }
        }
        return array;
      }) as typeof crypto.getRandomValues;

      // Remove randomUUID but keep getRandomValues
      if (global.crypto) {
        (global.crypto as any).randomUUID = undefined;
        global.crypto.getRandomValues = mockGetRandomValues;
      }

      await securityLogger.logSecurityEvent('SUSPICIOUS_ACTIVITY', 'LOW');

      expect(mockGetRandomValues).toHaveBeenCalled();

      // Restore
      if (global.crypto) {
        (global.crypto as any).randomUUID = originalRandomUUID;
        (global.crypto as any).getRandomValues = originalGetRandomValues;
      }
      delete (global as any).__DEV__;
    });

    it('should use Date.now fallback when crypto is not available (line 93)', async () => {
      (global as any).__DEV__ = true;
      
      // Save original crypto
      const originalCrypto = global.crypto;
      
      // Remove crypto entirely
      (global as any).crypto = undefined;

      await securityLogger.logSecurityEvent('XSS_ATTEMPT', 'HIGH');

      // Should still log the event
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const call = consoleWarnSpy.mock.calls[0];
      expect(call[1]).toHaveProperty('id');
      expect(typeof call[1].id).toBe('string');

      // Restore
      (global as any).crypto = originalCrypto;
      delete (global as any).__DEV__;
    });
  });
});
