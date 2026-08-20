/**
 * @fileoverview Authentication Test Helpers
 * @description Helper functions for JWT validation and authentication testing
 * @author Claude Code - Hive Mind Integration Specialist
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Authentication Test Helpers for integration tests
 */
class AuthTestHelpers {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'test-secret-key-for-testing-only';
    this.validTokenCache = new Map();
    this.mockUsers = new Map();
  }

  /**
   * Generate a valid JWT token for testing
   * @param {number} userId - User ID
   * @param {object} userInfo - Additional user information
   * @returns {string} Valid JWT token
   */
  async getValidToken(userId, userInfo = {}) {
    // Check cache first
    const cacheKey = `${userId}-${JSON.stringify(userInfo)}`;
    if (this.validTokenCache.has(cacheKey)) {
      const cached = this.validTokenCache.get(cacheKey);
      // Check if token is still valid (not expired)
      if (cached.expires > Date.now()) {
        return cached.token;
      }
      this.validTokenCache.delete(cacheKey);
    }

    // Create user info with defaults
    const user = this.mockUsers.get(userId) || {
      userId,
      email: `user${userId}@test.com`,
      fullName: `Test User ${userId}`,
      role: 'Member',
      clubId: 1,
      clubTier: 'Grow',
      ...userInfo
    };

    // Store in mock users for consistency
    this.mockUsers.set(userId, user);

    const payload = {
      nameid: user.userId.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      ClubId: user.clubId.toString(),
      clubTier: user.clubTier,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 2), // 2 hours
      jti: crypto.randomUUID()
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      algorithm: 'HS256'
    });

    // Cache the token
    this.validTokenCache.set(cacheKey, {
      token,
      expires: payload.exp * 1000
    });

    return token;
  }

  /**
   * Validate JWT token format - FIXED VERSION
   * This function should return false for invalid tokens
   * @param {string} token - JWT token to validate
   * @returns {boolean} True if token format is valid, false otherwise
   */
  validateJWTFormat(token) {
    try {
      // Check if token exists and is a string
      if (!token || typeof token !== 'string') {
        return false;
      }

      // Remove Bearer prefix if present
      const cleanToken = token.startsWith('Bearer ') 
        ? token.substring(7) 
        : token;

      // Check if token is empty after cleaning
      if (!cleanToken || cleanToken.trim() === '') {
        return false;
      }

      // JWT should have exactly 3 parts separated by dots
      const parts = cleanToken.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // Check if each part is base64url encoded (basic validation)
      for (const part of parts) {
        if (!part || part.length === 0) {
          return false;
        }
        
        // Base64url should not contain invalid characters
        if (!/^[A-Za-z0-9_-]*$/.test(part)) {
          return false;
        }
      }

      // Try to decode the header and payload to validate structure
      try {
        const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        
        // Basic structure validation
        if (!header.alg || !header.typ) {
          return false;
        }
        
        if (typeof payload !== 'object' || payload === null) {
          return false;
        }
        
        return true;
      } catch (decodeError) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate an invalid JWT token for testing
   * @param {string} type - Type of invalid token ('malformed', 'expired', 'invalid-signature')
   * @returns {string} Invalid JWT token
   */
  getInvalidToken(type = 'malformed') {
    switch (type) {
      case 'malformed':
        return 'invalid.token.format';
      
      case 'expired':
        const expiredPayload = {
          nameid: '999',
          email: 'expired@test.com',
          role: 'Member',
          ClubId: '1',
          iat: Math.floor(Date.now() / 1000) - 3600,
          exp: Math.floor(Date.now() / 1000) - 1800 // Expired 30 minutes ago
        };
        return jwt.sign(expiredPayload, this.jwtSecret);
      
      case 'invalid-signature':
        const validPayload = {
          nameid: '999',
          email: 'test@test.com',
          role: 'Member',
          ClubId: '1',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600
        };
        return jwt.sign(validPayload, 'wrong-secret-key');
      
      case 'missing-claims':
        const incompletePayload = {
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600
        };
        return jwt.sign(incompletePayload, this.jwtSecret);
      
      default:
        return 'Bearer ';
    }
  }

  /**
   * Validate token signature
   * @param {string} token - JWT token
   * @returns {boolean} True if signature is valid
   */
  validateTokenSignature(token) {
    try {
      jwt.verify(token, this.jwtSecret);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} True if token is expired
   */
  isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        return true;
      }
      return decoded.exp < Math.floor(Date.now() / 1000);
    } catch (error) {
      return true;
    }
  }

  /**
   * Get mock user by ID
   * @param {number} userId - User ID
   * @returns {object|null} Mock user object
   */
  getMockUser(userId) {
    return this.mockUsers.get(userId) || null;
  }

  /**
   * Clear all cached tokens (useful for cleanup)
   */
  clearTokenCache() {
    this.validTokenCache.clear();
  }

  /**
   * Create a test user with specific properties
   * @param {object} userProps - User properties
   * @returns {object} Created user object
   */
  createTestUser(userProps) {
    const user = {
      userId: userProps.userId || Math.floor(Math.random() * 10000),
      email: userProps.email || `test${Date.now()}@test.com`,
      fullName: userProps.fullName || 'Test User',
      role: userProps.role || 'Member',
      clubId: userProps.clubId || 1,
      clubTier: userProps.clubTier || 'Grow',
      isVerified: userProps.isVerified !== false,
      ...userProps
    };

    this.mockUsers.set(user.userId, user);
    return user;
  }

  /**
   * Simulate authentication state consistency check
   * @param {string} token - JWT token
   * @returns {object} Authentication state validation result
   */
  validateAuthenticationState(token) {
    const formatValid = this.validateJWTFormat(token);
    const signatureValid = this.validateTokenSignature(token);
    const notExpired = !this.isTokenExpired(token);

    return {
      isValid: formatValid && signatureValid && notExpired,
      checks: {
        format: formatValid,
        signature: signatureValid,
        notExpired: notExpired
      },
      reasons: [
        !formatValid && 'Invalid token format',
        !signatureValid && 'Invalid signature',
        !notExpired && 'Token expired'
      ].filter(Boolean)
    };
  }

  /**
   * Generate test tokens for cross-platform testing
   * @returns {object} Collection of test tokens
   */
  generateCrossPlatformTokens() {
    return {
      valid: this.getValidToken(1),
      expired: this.getInvalidToken('expired'),
      malformed: this.getInvalidToken('malformed'),
      invalidSignature: this.getInvalidToken('invalid-signature'),
      missingClaims: this.getInvalidToken('missing-claims'),
      empty: '',
      bearerOnly: 'Bearer ',
      invalidFormat: 'not.a.valid.jwt.token'
    };
  }

  /**
   * Cleanup method for test teardown
   */
  cleanup() {
    this.validTokenCache.clear();
    this.mockUsers.clear();
  }
}

module.exports = { AuthTestHelpers };