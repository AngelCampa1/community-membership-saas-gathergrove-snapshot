import * as Keychain from 'react-native-keychain';
import { Platform } from 'react-native';

/**
 * Mobile security utilities for React Native
 */


/**
 * Securely store sensitive data using Keychain/Keystore
 */
export class SecureStorage {
  private static readonly SERVICE_NAME = 'GatherGrove';

  static async setItem(key: string, value: string): Promise<void> {
    try {
      await Keychain.setInternetCredentials(
        `${this.SERVICE_NAME}_${key}`,
        key,
        value,
        {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
          authenticationType: Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
          accessGroup: Platform.OS === 'ios' ? 'group.com.gathergrove.mobile' : undefined,
        }
      );
    } catch (error) {
      throw new Error('Failed to store sensitive data securely');
    }
  }

  /**
   * ERR-02 fix: Throw on error to allow callers to distinguish between
   * "key doesn't exist" (returns null) and "keychain access failed" (throws)
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(`${this.SERVICE_NAME}_${key}`);
      if (credentials && credentials.password) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      // ERR-02 fix: Throw on error for consistent error handling
      throw new Error(`Failed to retrieve secure data for key: ${key}`);
    }
  }

  /**
   * ERR-02 fix: Throw on error for consistent error handling
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await Keychain.resetInternetCredentials(`${this.SERVICE_NAME}_${key}`);
    } catch (error) {
      // ERR-02 fix: Throw on error instead of just logging
      throw new Error(`Failed to remove secure data for key: ${key}`);
    }
  }
}

/**
 * Input validation and sanitization
 */
export class InputValidator {
  /**
   * Sanitize user input to prevent injection attacks
   */
  static sanitizeInput(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .trim();
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    if (!email || email.length > 254) return false;
    
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  /**
   * Advanced password strength validation
   */
  static validatePassword(password: string): {
    isValid: boolean;
    strength: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';
    score: number;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 0;
    
    // Length checks
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (password.length < 12) {
      warnings.push('Consider using at least 12 characters for better security');
      score += 1;
    } else {
      score += password.length >= 16 ? 3 : 2;
    }
    
    // Character type checks
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letters');
    } else {
      score += 1;
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters');
    } else {
      score += 1;
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain numbers');
    } else {
      score += 1;
    }
    
    if (!/[!@#$%^&*()_+\-=[\]{};":'\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain special characters');
    } else {
      score += 1;
    }

    // Advanced security checks
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      'dragon', 'pass', '123123'
    ];
    
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('Password contains common words or patterns');
      score -= 2;
    }

    // Check for keyboard patterns
    const keyboardPatterns = [
      'qwerty', 'asdf', 'zxcv', '1234', 'abcd'
    ];
    
    if (keyboardPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
      warnings.push('Avoid keyboard patterns for better security');
      score -= 1;
    }

    // SEC-05 fix: Correct regex for repeated characters (was using double backslash)
    if (/(.)\1{2,}/.test(password)) {
      warnings.push('Avoid repeating characters');
      score -= 1;
    }

    // Bonus points for variety
    if (password.length > 16) score += 1;
    // SEC-05 fix: Correct unicode regex (was using double backslash)
    if (/[\u00C0-\u017F]/.test(password)) score += 1; // Unicode characters
    if (password.split('').some(char => '!@#$%^&*()_+-=[]{}|;:,.<>?'.includes(char))) score += 1;

    // Normalize score (0-10 scale)
    score = Math.max(0, Math.min(10, score));

    let strength: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';
    if (score <= 2) strength = 'very-weak';
    else if (score <= 4) strength = 'weak';
    else if (score <= 6) strength = 'fair';
    else if (score <= 8) strength = 'strong';
    else strength = 'very-strong';
    
    return {
      isValid: errors.length === 0 && score >= 5,
      strength,
      score,
      errors,
      warnings
    };
  }

  /**
   * Check if URL is safe to open
   * SEC-06 fix: Added complete private IP range blocking
   */
  static isSafeURL(url: string): boolean {
    if (!url) return false;

    try {
      const parsedURL = new URL(url);

      // Only allow HTTP/HTTPS protocols
      if (!['http:', 'https:'].includes(parsedURL.protocol)) {
        return false;
      }

      const hostname = parsedURL.hostname.toLowerCase();

      // SEC-06 fix: Check for private/internal IP ranges (RFC 1918 + others)
      if (this.isPrivateIP(hostname)) {
        return false;
      }

      // Block URL shorteners (could redirect to malicious sites)
      const urlShorteners = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd'];
      if (urlShorteners.some(shortener => hostname === shortener || hostname.endsWith('.' + shortener))) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * SEC-06 fix: Check if hostname is a private/internal IP address
   */
  private static isPrivateIP(hostname: string): boolean {
    // Check for localhost variants
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
      return true;
    }

    // Parse IP address
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b, c] = ipv4Match.map(Number);

      // 127.0.0.0/8 - Loopback
      if (a === 127) return true;

      // 10.0.0.0/8 - Private
      if (a === 10) return true;

      // 172.16.0.0/12 - Private (172.16.0.0 - 172.31.255.255)
      if (a === 172 && b >= 16 && b <= 31) return true;

      // 192.168.0.0/16 - Private
      if (a === 192 && b === 168) return true;

      // 169.254.0.0/16 - Link-local
      if (a === 169 && b === 254) return true;

      // 0.0.0.0/8 - Current network
      if (a === 0) return true;

      // 224.0.0.0/4 - Multicast
      if (a >= 224 && a <= 239) return true;

      // 255.255.255.255 - Broadcast
      if (a === 255 && b === 255 && c === 255) return true;
    }

    // Check for IPv6 localhost
    if (hostname === '::1' || hostname === '[::1]') {
      return true;
    }

    return false;
  }

  /**
   * Validate input for security threats
   */
  static validateInputSecurity(input: string): { isSafe: boolean; riskScore: number; threats: string[] } {
    const threats: string[] = [];
    let riskScore = 0;

    // Basic security checks
    if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(input)) {
      threats.push('SCRIPT_INJECTION');
      riskScore += 50;
    }
    
    if (/javascript:/gi.test(input)) {
      threats.push('JAVASCRIPT_PROTOCOL');
      riskScore += 30;
    }
    
    if (/on\w+\s*=/gi.test(input)) {
      threats.push('EVENT_HANDLER');
      riskScore += 25;
    }

    return {
      isSafe: riskScore < 30,
      riskScore,
      threats,
    };
  }
}

/**
 * Runtime Application Self-Protection (RASP)
 */
export class RuntimeProtection {
  private static debuggerDetectionInterval: NodeJS.Timeout | null = null;

  /**
   * Detect if app is running in debug _mode or being analyzed
   */
  static enableAntiDebugging(): void {
    if (__DEV__) {
      // Skip in development _mode
      return;
    }

    // Check for debugging tools periodically
    this.debuggerDetectionInterval = setInterval(() => {
      const start = Date.now();
      
      // Simple timing-based debugger detection
      // Use a more production-safe approach to detect debugging
      try {
        const consoleCheck = () => typeof console !== 'undefined' ? 1 : 0;
        const before = consoleCheck();
        // Brief delay to check for console manipulation
        setTimeout(() => {
          const after = consoleCheck();
          if (before !== after) {
            // Console manipulation detected - could log this
            const { logger } = require('./logger');
            logger.warn('security', 'Console manipulation detected');
          }
        }, 1);
      } catch (error) {
        // Console manipulation detected - could handle this
        const { logger } = require('./logger');
        logger.warn('security', 'Debug detection failed', { error });
      }
      
      const end = Date.now();
      
      if (end - start > 100) {
        // In production, you might want to log out the user or disable functionality
      }
    }, 5000);
  }

  /**
   * Disable anti-debugging when not needed
   */
  static disableAntiDebugging(): void {
    if (this.debuggerDetectionInterval) {
      clearInterval(this.debuggerDetectionInterval);
      this.debuggerDetectionInterval = null;
    }
  }

  /**
   * Check app integrity (basic version)
   */
  static async checkAppIntegrity(): Promise<boolean> {
    // In a real implementation, you would:
    // 1. Check app signature
    // 2. Verify app wasn't modified
    // 3. Check for jailbreak/root
    // 4. Validate runtime environment
    
    // For now, just check if we're in a development environment
    if (__DEV__) {
      return true; // Allow in development
    }
    
    // Basic checks
    try {
      // Check for common jailbreak/root indicators
      // In React Native, we can use available APIs to detect some indicators
      
      // Check for common debugging/tampering indicators
      const suspiciousPatterns = [
        // Check if global variables suggest debugging environment
        () => typeof window !== 'undefined' && 'webkitStorageInfo' in window,
        // Check for common development tools
        () => typeof global !== 'undefined' && '__DEV__' in (global as Record<string, unknown>) && (global as Record<string, unknown>).__DEV__ === true,
        // Check for suspicious global functions
        () => typeof eval !== 'undefined' && eval.toString().length < 30,
      ];
      
      const suspiciousCount = suspiciousPatterns.filter(check => {
        try {
          return check();
        } catch {
          return false;
        }
      }).length;
      
      // If too many suspicious indicators, flag as potentially compromised
      if (suspiciousCount > 2) {
        return false;
      }
      
      return true; // Assume integrity for now
    } catch (error) {
      return false;
    }
  }
}

/**
 * Certificate pinning helper
 */
export class CertificatePinning {
  private static readonly EXPECTED_PINS: string[] = [
    // In production, add your actual certificate pins here
    // Example: 'sha256/YourActualCertificatePinHere='
  ];

  /**
   * Validate server certificate (requires native implementation)
   */
  static async validateCertificate(_hostname: string, certificates: string[]): Promise<boolean> {
    // Skip validation in development
    if (__DEV__) {
      return true;
    }
    
    // If no pins configured, allow but warn
    if (this.EXPECTED_PINS.length === 0) {
      return true;
    }
    
    // Validate certificates against expected pins
    try {
      const hasValidPin = certificates.some(cert => 
        this.EXPECTED_PINS.includes(cert)
      );
      
      if (!hasValidPin) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Network security helpers
 */
export class NetworkSecurity {
  /**
   * Add security headers to API requests
   */
  static getSecureHeaders(): Record<string, string> {
    return {
      'X-Mobile-Client': 'true',
      'User-Agent': 'GatherGrove-Mobile/1.0.0',
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
  }

  /**
   * Validate API response for security threats
   */
  static validateResponse(response: unknown): boolean {
    if (!response) return false;
    
    // Check for common XSS patterns in response
    const responseStr = JSON.stringify(response);
    const xssPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe[^>]*>/i
    ];
    
    return !xssPatterns.some(pattern => pattern.test(responseStr));
  }

  /**
   * Obfuscate sensitive data in logs
   */
  static obfuscateForLogging(data: Record<string, unknown>): Record<string, unknown> {
    if (!data) return data;
    
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'auth', 'credential',
      'ssn', 'credit', 'card', 'cvv', 'pin'
    ];
    
    const obfuscated = { ...data };
    
    for (const key in obfuscated) {
      if (sensitiveKeys.some(sensitive => 
        key.toLowerCase().includes(sensitive.toLowerCase()))) {
        obfuscated[key] = '***REDACTED***';
      }
    }
    
    return obfuscated;
  }
}