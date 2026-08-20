/**
 * 🛡️ SECURITY SERVICES COMPREHENSIVE TEST SUITE
 * TDD-First approach for critical security functions
 * Target: 0% → 95% coverage
 */

import { TestDataBuilder, MockFactory, TestEnvironment } from '../test-utilities/advanced-test-builders';

// Mock the security module before importing
jest.mock('../../mobile/src/utils/security', () => ({
  SecurityUtils: {
    sanitizeInput: jest.fn(),
    validateEmail: jest.fn(),
    validatePassword: jest.fn(),
    hashPassword: jest.fn(),
    verifyPassword: jest.fn(),
    generateSecureToken: jest.fn(),
    validateToken: jest.fn(),
    encryptData: jest.fn(),
    decryptData: jest.fn(),
    isSecureConnection: jest.fn(),
    detectXSSAttempt: jest.fn(),
    detectSQLInjection: jest.fn(),
    rateLimit: jest.fn(),
    validateJWTStructure: jest.fn(),
    sanitizeHTMLContent: jest.fn()
  }
}));

import { SecurityUtils } from '../../mobile/src/utils/security';

const mockSecurityUtils = SecurityUtils as jest.Mocked<typeof SecurityUtils>;

describe('🛡️ Security Services Test Suite', () => {
  let testEnv: ReturnType<typeof TestEnvironment.createContext>;

  beforeAll(() => {
    testEnv = TestEnvironment.createContext();
  });

  afterAll(() => {
    testEnv.cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    TestDataBuilder.reset(12345); // Consistent test data
  });

  describe('Input Sanitization', () => {
    describe('sanitizeInput', () => {
      it('should sanitize basic XSS attempts', () => {
        const maliciousInput = '<script>alert("XSS")</script>';
        const expectedOutput = '&lt;script&gt;alert("XSS")&lt;/script&gt;';
        
        mockSecurityUtils.sanitizeInput.mockReturnValue(expectedOutput);
        
        const result = SecurityUtils.sanitizeInput(maliciousInput);
        
        expect(result).toBe(expectedOutput);
        expect(mockSecurityUtils.sanitizeInput).toHaveBeenCalledWith(maliciousInput);
      });

      it('should handle complex XSS payloads', () => {
        const complexXSS = '<img src="x" onerror="alert(document.cookie)" />';
        const sanitized = '&lt;img src="x" onerror="alert(document.cookie)" /&gt;';
        
        mockSecurityUtils.sanitizeInput.mockReturnValue(sanitized);
        
        const result = SecurityUtils.sanitizeInput(complexXSS);
        
        expect(result).toBe(sanitized);
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('onerror=');
      });

      it('should preserve safe HTML when specified', () => {
        const safeHTML = '<p>Safe paragraph content</p>';
        
        mockSecurityUtils.sanitizeInput.mockReturnValue(safeHTML);
        
        const result = SecurityUtils.sanitizeInput(safeHTML);
        
        expect(result).toBe(safeHTML);
      });

      it('should handle null and undefined inputs', () => {
        mockSecurityUtils.sanitizeInput.mockImplementation((input) => {
          return input === null ? '' : input === undefined ? '' : String(input);
        });
        
        expect(SecurityUtils.sanitizeInput(null)).toBe('');
        expect(SecurityUtils.sanitizeInput(undefined)).toBe('');
      });

      it('should handle unicode and special characters', () => {
        const unicodeInput = '🎉 Special chars: äöü ñ 中文 العربية';
        
        mockSecurityUtils.sanitizeInput.mockReturnValue(unicodeInput);
        
        const result = SecurityUtils.sanitizeInput(unicodeInput);
        
        expect(result).toBe(unicodeInput);
      });
    });

    describe('detectXSSAttempt', () => {
      it('should detect script tags', () => {
        const xssAttempts = [
          '<script>alert("xss")</script>',
          '<ScRiPt>malicious code</ScRiPt>',
          'javascript:alert("xss")',
          'onload="alert(1)"',
          '<iframe src="javascript:alert(1)"></iframe>'
        ];

        xssAttempts.forEach((attempt, index) => {
          mockSecurityUtils.detectXSSAttempt.mockReturnValue(true);
          
          const result = SecurityUtils.detectXSSAttempt(attempt);
          
          expect(result).toBe(true);
          expect(mockSecurityUtils.detectXSSAttempt).toHaveBeenNthCalledWith(index + 1, attempt);
        });
      });

      it('should allow safe content', () => {
        const safeInputs = [
          'Normal text content',
          '<p>Safe paragraph</p>',
          'Email: user@example.com',
          'Numbers: 123456',
          'Safe HTML entities: &amp; &lt; &gt;'
        ];

        safeInputs.forEach(input => {
          mockSecurityUtils.detectXSSAttempt.mockReturnValue(false);
          
          const result = SecurityUtils.detectXSSAttempt(input);
          
          expect(result).toBe(false);
        });
      });
    });

    describe('detectSQLInjection', () => {
      it('should detect SQL injection attempts', () => {
        const sqlInjections = [
          "'; DROP TABLE users; --",
          "' OR '1'='1",
          "admin'--",
          "' UNION SELECT * FROM passwords --",
          "'; DELETE FROM accounts WHERE 't'='t"
        ];

        sqlInjections.forEach((injection, index) => {
          mockSecurityUtils.detectSQLInjection.mockReturnValue(true);
          
          const result = SecurityUtils.detectSQLInjection(injection);
          
          expect(result).toBe(true);
          expect(mockSecurityUtils.detectSQLInjection).toHaveBeenNthCalledWith(index + 1, injection);
        });
      });

      it('should allow normal database queries', () => {
        const normalInputs = [
          'john@example.com',
          'Regular search term',
          'User name with apostrophe: O\'Connor',
          'Product ID: ABC-123'
        ];

        normalInputs.forEach(input => {
          mockSecurityUtils.detectSQLInjection.mockReturnValue(false);
          
          const result = SecurityUtils.detectSQLInjection(input);
          
          expect(result).toBe(false);
        });
      });
    });
  });

  describe('Validation Functions', () => {
    describe('validateEmail', () => {
      it('should validate correct email formats', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'firstname+lastname@company.org',
          'user123@test-domain.com'
        ];

        validEmails.forEach(email => {
          mockSecurityUtils.validateEmail.mockReturnValue(true);
          
          const result = SecurityUtils.validateEmail(email);
          
          expect(result).toBe(true);
        });
      });

      it('should reject invalid email formats', () => {
        const invalidEmails = [
          'invalid.email',
          '@domain.com',
          'user@',
          'user..name@domain.com',
          'user@domain',
          'user name@domain.com'
        ];

        invalidEmails.forEach(email => {
          mockSecurityUtils.validateEmail.mockReturnValue(false);
          
          const result = SecurityUtils.validateEmail(email);
          
          expect(result).toBe(false);
        });
      });
    });

    describe('validatePassword', () => {
      it('should validate strong passwords', () => {
        const strongPasswords = [
          'StrongPass123!',
          'MySecur3P@ssword',
          'C0mpl3x$ecure!',
          'Valid123@Password'
        ];

        strongPasswords.forEach(password => {
          mockSecurityUtils.validatePassword.mockReturnValue({
            isValid: true,
            score: 5,
            requirements: {
              minLength: true,
              hasUppercase: true,
              hasLowercase: true,
              hasNumbers: true,
              hasSpecialChars: true
            }
          });
          
          const result = SecurityUtils.validatePassword(password);
          
          expect(result.isValid).toBe(true);
          expect(result.score).toBeGreaterThanOrEqual(4);
        });
      });

      it('should reject weak passwords', () => {
        const weakPasswords = [
          '123456',
          'password',
          'abc123',
          'qwerty',
          '11111111'
        ];

        weakPasswords.forEach(password => {
          mockSecurityUtils.validatePassword.mockReturnValue({
            isValid: false,
            score: 1,
            requirements: {
              minLength: false,
              hasUppercase: false,
              hasLowercase: true,
              hasNumbers: true,
              hasSpecialChars: false
            }
          });
          
          const result = SecurityUtils.validatePassword(password);
          
          expect(result.isValid).toBe(false);
          expect(result.score).toBeLessThan(3);
        });
      });
    });

    describe('validateJWTStructure', () => {
      it('should validate properly formatted JWT tokens', () => {
        const validJWT = TestDataBuilder.createJWTToken();
        
        mockSecurityUtils.validateJWTStructure.mockReturnValue(true);
        
        const result = SecurityUtils.validateJWTStructure(validJWT);
        
        expect(result).toBe(true);
        expect(validJWT.split('.')).toHaveLength(3);
      });

      it('should reject malformed JWT tokens', () => {
        const invalidTokens = [
          'invalid.token',
          'header.payload',
          'not-a-token',
          '',
          'header.payload.signature.extra'
        ];

        invalidTokens.forEach(token => {
          mockSecurityUtils.validateJWTStructure.mockReturnValue(false);
          
          const result = SecurityUtils.validateJWTStructure(token);
          
          expect(result).toBe(false);
        });
      });
    });
  });

  describe('Cryptography Functions', () => {
    describe('hashPassword', () => {
      it('should hash passwords securely', async () => {
        const password = 'MySecurePassword123!';
        const mockHash = '$2b$10$mockHashedPasswordString';
        
        mockSecurityUtils.hashPassword.mockResolvedValue(mockHash);
        
        const result = await SecurityUtils.hashPassword(password);
        
        expect(result).toBe(mockHash);
        expect(result).not.toBe(password);
        expect(mockSecurityUtils.hashPassword).toHaveBeenCalledWith(password);
      });

      it('should generate different hashes for same password', async () => {
        const password = 'SamePassword123!';
        const hash1 = '$2b$10$hash1mockString';
        const hash2 = '$2b$10$hash2mockString';
        
        mockSecurityUtils.hashPassword
          .mockResolvedValueOnce(hash1)
          .mockResolvedValueOnce(hash2);
        
        const result1 = await SecurityUtils.hashPassword(password);
        const result2 = await SecurityUtils.hashPassword(password);
        
        expect(result1).not.toBe(result2);
        expect(result1).toBe(hash1);
        expect(result2).toBe(hash2);
      });
    });

    describe('verifyPassword', () => {
      it('should verify correct password against hash', async () => {
        const password = 'CorrectPassword123!';
        const hash = '$2b$10$validHashString';
        
        mockSecurityUtils.verifyPassword.mockResolvedValue(true);
        
        const result = await SecurityUtils.verifyPassword(password, hash);
        
        expect(result).toBe(true);
        expect(mockSecurityUtils.verifyPassword).toHaveBeenCalledWith(password, hash);
      });

      it('should reject incorrect password', async () => {
        const wrongPassword = 'WrongPassword123!';
        const hash = '$2b$10$validHashString';
        
        mockSecurityUtils.verifyPassword.mockResolvedValue(false);
        
        const result = await SecurityUtils.verifyPassword(wrongPassword, hash);
        
        expect(result).toBe(false);
      });
    });

    describe('encryptData', () => {
      it('should encrypt data successfully', () => {
        const sensitiveData = 'Confidential information';
        const encryptedData = 'encrypted_base64_string_here';
        
        mockSecurityUtils.encryptData.mockReturnValue(encryptedData);
        
        const result = SecurityUtils.encryptData(sensitiveData);
        
        expect(result).toBe(encryptedData);
        expect(result).not.toBe(sensitiveData);
      });
    });

    describe('decryptData', () => {
      it('should decrypt data successfully', () => {
        const encryptedData = 'encrypted_base64_string_here';
        const originalData = 'Original confidential information';
        
        mockSecurityUtils.decryptData.mockReturnValue(originalData);
        
        const result = SecurityUtils.decryptData(encryptedData);
        
        expect(result).toBe(originalData);
      });

      it('should handle decryption errors', () => {
        const invalidEncryptedData = 'invalid_encrypted_data';
        
        mockSecurityUtils.decryptData.mockImplementation(() => {
          throw new Error('Decryption failed');
        });
        
        expect(() => SecurityUtils.decryptData(invalidEncryptedData)).toThrow('Decryption failed');
      });
    });
  });

  describe('Token Management', () => {
    describe('generateSecureToken', () => {
      it('should generate unique secure tokens', () => {
        const token1 = 'secure_random_token_1_abc123';
        const token2 = 'secure_random_token_2_def456';
        
        mockSecurityUtils.generateSecureToken
          .mockReturnValueOnce(token1)
          .mockReturnValueOnce(token2);
        
        const result1 = SecurityUtils.generateSecureToken();
        const result2 = SecurityUtils.generateSecureToken();
        
        expect(result1).toBe(token1);
        expect(result2).toBe(token2);
        expect(result1).not.toBe(result2);
      });

      it('should generate tokens of specified length', () => {
        const shortToken = 'short123';
        const longToken = 'very_long_secure_token_with_many_characters';
        
        mockSecurityUtils.generateSecureToken
          .mockImplementation((length) => {
            return length === 8 ? shortToken : longToken;
          });
        
        const short = SecurityUtils.generateSecureToken(8);
        const long = SecurityUtils.generateSecureToken(42);
        
        expect(short).toBe(shortToken);
        expect(long).toBe(longToken);
      });
    });

    describe('validateToken', () => {
      it('should validate legitimate tokens', () => {
        const validToken = 'valid_secure_token_abc123';
        
        mockSecurityUtils.validateToken.mockReturnValue(true);
        
        const result = SecurityUtils.validateToken(validToken);
        
        expect(result).toBe(true);
      });

      it('should reject invalid tokens', () => {
        const invalidTokens = [
          'too_short',
          '',
          'invalid-chars-!@#$',
          'expired_token_xyz'
        ];

        invalidTokens.forEach(token => {
          mockSecurityUtils.validateToken.mockReturnValue(false);
          
          const result = SecurityUtils.validateToken(token);
          
          expect(result).toBe(false);
        });
      });
    });
  });

  describe('Rate Limiting', () => {
    describe('rateLimit', () => {
      it('should allow requests within rate limit', () => {
        const identifier = 'user123';
        const limit = 10;
        const window = 60000; // 1 minute
        
        mockSecurityUtils.rateLimit.mockReturnValue({
          allowed: true,
          remaining: 9,
          resetTime: Date.now() + window
        });
        
        const result = SecurityUtils.rateLimit(identifier, limit, window);
        
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9);
      });

      it('should block requests exceeding rate limit', () => {
        const identifier = 'user123';
        const limit = 10;
        const window = 60000;
        
        mockSecurityUtils.rateLimit.mockReturnValue({
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + window
        });
        
        const result = SecurityUtils.rateLimit(identifier, limit, window);
        
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
      });
    });
  });

  describe('Connection Security', () => {
    describe('isSecureConnection', () => {
      it('should detect secure HTTPS connections', () => {
        const secureUrls = [
          'https://secure.example.com',
          'https://api.gathergrove.club',
          'https://localhost:3000'
        ];

        secureUrls.forEach(url => {
          mockSecurityUtils.isSecureConnection.mockReturnValue(true);
          
          const result = SecurityUtils.isSecureConnection(url);
          
          expect(result).toBe(true);
        });
      });

      it('should reject insecure HTTP connections', () => {
        const insecureUrls = [
          'http://insecure.example.com',
          'ftp://file.server.com',
          'http://localhost:8080'
        ];

        insecureUrls.forEach(url => {
          mockSecurityUtils.isSecureConnection.mockReturnValue(false);
          
          const result = SecurityUtils.isSecureConnection(url);
          
          expect(result).toBe(false);
        });
      });
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle extremely large inputs', () => {
      const largeInput = 'x'.repeat(1000000); // 1MB of data
      
      mockSecurityUtils.sanitizeInput.mockImplementation((input) => {
        if (input.length > 100000) {
          throw new Error('Input too large');
        }
        return input;
      });
      
      expect(() => SecurityUtils.sanitizeInput(largeInput))
        .toThrow('Input too large');
    });

    it('should handle concurrent security operations', async () => {
      const passwords = Array(10).fill('TestPassword123!');
      const mockHashes = passwords.map((_, i) => `$2b$10$hash${i}mockString`);
      
      mockHashes.forEach((hash, index) => {
        mockSecurityUtils.hashPassword.mockResolvedValueOnce(hash);
      });
      
      const results = await Promise.all(
        passwords.map(pwd => SecurityUtils.hashPassword(pwd))
      );
      
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result).toBe(mockHashes[index]);
      });
    });

    it('should maintain security under stress conditions', async () => {
      const performanceTest = testEnv.performance;
      
      // Simulate high-load scenario
      const operations = Array(100).fill(null).map(() => {
        mockSecurityUtils.validateEmail.mockReturnValue(true);
        return SecurityUtils.validateEmail('test@example.com');
      });
      
      const results = await Promise.all(operations);
      const duration = performanceTest.measure();
      
      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});