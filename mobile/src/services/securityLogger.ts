/**
 * Simplified Security Logger for E2E Testing
 * Minimal implementation to avoid TypeScript compilation errors
 */

export type SecurityEventType = 
  | 'AUTHENTICATION_FAILED'
  | 'AUTHENTICATION_LOCKED'
  | 'SESSION_EXPIRED'
  | 'PAYMENT_FRAUD_DETECTED'
  | 'CERTIFICATE_VALIDATION_FAILED'
  | 'MALICIOUS_INPUT_DETECTED'
  | 'NETWORK_INTRUSION'
  | 'DATA_BREACH_SUSPECTED'
  | 'UNAUTHORIZED_ACCESS'
  | 'SUSPICIOUS_ACTIVITY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INJECTION_ATTEMPT'
  | 'XSS_ATTEMPT'
  | 'CSRF_ATTEMPT';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityEventContext {
  action: string;
  resource: string;
  userInput?: Record<string, unknown>;
  apiEndpoint?: string;
  errorCode?: string;
  additionalData?: Record<string, unknown>;
}

export interface ThreatIndicators {
  riskScore: number;
  threatTypes: string[];
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  deviceInfo: {
    platform: string;
    version: string;
    userAgent: string;
    ipAddress?: string;
  };
  context: SecurityEventContext;
  threatIndicators: ThreatIndicators;
}

export interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  lastEventTime: string | null;
  eventsBySeverity: Record<string, number>;
  eventsByType: Record<string, number>;
  averageRiskScore: number;
  [key: string]: number | string | null | Record<string, number>;
}

export interface SecurityEventFilter {
  startDate?: string;
  endDate?: string;
  severity?: SecuritySeverity;
  type?: SecurityEventType;
  userId?: string;
  limit?: number;
}

/**
 * Simplified SecurityLogger class for E2E testing
 */
class SecurityLogger {
  /**
   * SEC-04 fix: Generate cryptographically secure ID for security events
   */
  private generateSecureId(): string {
    // Use crypto.randomUUID if available (modern browsers/Node 16+)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback: use crypto.getRandomValues for better randomness than Math.random
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    // Last resort fallback with timestamp for uniqueness
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log security event
   * SILENT-02 fix: Log events in development mode so they're visible
   */
  async logSecurityEvent(
    eventTypeOrEvent: SecurityEventType | SecurityEvent,
    severity?: SecuritySeverity,
    context?: SecurityEventContext,
    threatIndicators?: ThreatIndicators,
    userId?: string
  ): Promise<void> {
    let event: SecurityEvent;

    if (typeof eventTypeOrEvent === 'string') {
      // Create event from parameters
      event = {
        id: this.generateSecureId(),
        type: eventTypeOrEvent,
        severity: severity || 'MEDIUM',
        timestamp: new Date().toISOString(),
        userId: userId,
        deviceInfo: {
          platform: 'mobile',
          version: '1.0.0',
          userAgent: 'GatherGrove-Mobile'
        },
        context: context || {
          action: 'unknown',
          resource: 'unknown'
        },
        threatIndicators: threatIndicators || {
          riskScore: 0.5,
          threatTypes: []
        }
      };
    } else {
      event = eventTypeOrEvent;
    }

    // SILENT-02 fix: Actually log security events in development
    if (__DEV__) {
      console.warn(`[Security] ${event.severity}: ${event.type}`, {
        id: event.id,
        context: event.context,
        userId: event.userId,
      });
    }
    // In production, this would send to a security monitoring service
  }

  /**
   * Log authentication failure
   * SILENT-02 fix: Log in development mode
   */
  async logAuthenticationFailure(userId: string, reason: string): Promise<void> {
    if (__DEV__) {
      console.warn(`[Security] AUTH_FAILURE: ${reason}`, { userId });
    }
    // In production, this would send to a security monitoring service
  }

  /**
   * Log suspicious activity
   * SILENT-02 fix: Log in development mode
   */
  async logSuspiciousActivity(activity: string, context: Record<string, unknown>): Promise<void> {
    if (__DEV__) {
      console.warn(`[Security] SUSPICIOUS: ${activity}`, context);
    }
    // In production, this would send to a security monitoring service
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    return {
      totalEvents: 0,
      criticalEvents: 0,
      lastEventTime: null,
      eventsBySeverity: {},
      eventsByType: {},
      averageRiskScore: 0,
    };
  }
  
  /**
   * Clean up old events (placeholder)
   */
  async cleanupOldEvents(maxAge: number): Promise<void> {
    // Log: Cleaning up old security events based on max age
    void maxAge;
  }
  
  /**
   * Get security events (placeholder)
   */
  async getSecurityEvents(filter?: SecurityEventFilter): Promise<SecurityEvent[]> {
    // Log: Filtering events with provided filter
    void filter;
    return [];
  }
}

// Export singleton instance
const securityLogger = new SecurityLogger();
export { securityLogger };
export default SecurityLogger;