/**
 * Comprehensive /auth/me Endpoint Tests
 * AUTH-VALIDATOR Agent Test Suite
 * 
 * Tests all scenarios for the /auth/me endpoint including:
 * - Token validation
 * - CORS preflight handling
 * - Session management
 * - Error scenarios
 * - Performance validation
 */

import request from 'supertest';
import { jest } from '@jest/globals';
import * as jwt from 'jsonwebtoken';
import { performance } from 'perf_hooks';

// Create a proper Express app mock for supertest
import express from 'express';
const mockApp = express();

// Add CORS middleware
mockApp.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Mock the auth endpoint
mockApp.get('/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.substring(7);
  try {
    jwt.verify(token, VALID_JWT_SECRET);
    res.json({ user: { id: 1, email: 'test@example.com' } });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

describe('/auth/me Endpoint Validation', () => {
  const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:5284';
  const VALID_JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CORS Preflight Validation', () => {
    const corsOrigins = [
      'http://localhost:3000',
      'https://app.gathergrove.club',
      'https://gathergrove-client.azurewebsites.net',
      'http://localhost:19006', // Expo dev server
      'exp://127.0.0.1:19000', // Expo mobile
    ];

    it('should handle OPTIONS preflight request correctly', async () => {
      for (const origin of corsOrigins) {
        const response = await request(mockApp as any)
          .options('/auth/me')
          .set('Origin', origin)
          .set('Access-Control-Request-Method', 'GET')
          .set('Access-Control-Request-Headers', 'Authorization, Content-Type');

        expect(response.status).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBe(origin);
        expect(response.headers['access-control-allow-methods']).toContain('GET');
        expect(response.headers['access-control-allow-headers']).toContain('Authorization');
        expect(response.headers['access-control-allow-credentials']).toBe('true');
        expect(response.headers['access-control-max-age']).toBeTruthy();
      }
    });

    it('should reject preflight requests from unauthorized origins', async () => {
      const unauthorizedOrigins = [
        'https://malicious-site.com',
        'http://fake-app.com',
        'https://phishing-site.net',
      ];

      for (const origin of unauthorizedOrigins) {
        const response = await request(mockApp as any)
          .options('/auth/me')
          .set('Origin', origin)
          .set('Access-Control-Request-Method', 'GET');

        expect(response.status).toBe(403);
        expect(response.headers['access-control-allow-origin']).toBeUndefined();
      }
    });

    it('should handle missing Origin header gracefully', async () => {
      const response = await request(mockApp as any)
        .options('/auth/me')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should validate Access-Control-Request-Method', async () => {
      const invalidMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of invalidMethods) {
        const response = await request(mockApp as any)
          .options('/auth/me')
          .set('Origin', 'http://localhost:3000')
          .set('Access-Control-Request-Method', method);

        expect(response.status).toBe(405);
      }
    });
  });

  describe('Token Validation Scenarios', () => {
    const validUser = {
      userId: 123,
      email: 'test@example.com',
      role: 'Member',
      clubId: 1,
      fullName: 'Test User'
    };

    function generateValidToken(payload: any = validUser, expiresIn: string = '1h') {
      return jwt.sign(payload, VALID_JWT_SECRET, { expiresIn } as jwt.SignOptions);
    }

    function generateExpiredToken(payload: any = validUser) {
      return jwt.sign(payload, VALID_JWT_SECRET, { expiresIn: '-1h' } as jwt.SignOptions);
    }

    it('should return user session for valid token', async () => {
      const validToken = generateValidToken();
      
      const response = await request(mockApp as any)
        .get('/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        userId: validUser.userId,
        email: validUser.email,
        role: validUser.role,
        clubId: validUser.clubId,
        fullName: validUser.fullName,
      });
      expect(response.body.isAuthenticated).toBe(true);
    });

    it('should return 401 for expired tokens', async () => {
      const expiredToken = generateExpiredToken();
      
      const response = await request(mockApp as any)
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token expired');
      expect(response.body.code).toBe('TOKEN_EXPIRED');
    });

    it('should return 401 for malformed tokens', async () => {
      const malformedTokens = [
        'invalid.token.format',
        'Bearer',
        'Bearer ',
        'not-a-jwt-token',
        'Bearer invalid-token-format',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.malformed',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyM30.invalid-signature'
      ];

      for (const token of malformedTokens) {
        const response = await request(mockApp as any)
          .get('/auth/me')
          .set('Authorization', token)
          .set('Origin', 'http://localhost:3000');
        
        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Invalid token format');
        expect(response.body.code).toBe('INVALID_TOKEN');
      }
    });

    it('should return 401 when Authorization header is missing', async () => {
      const response = await request(mockApp as any)
        .get('/auth/me')
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authorization header required');
      expect(response.body.code).toBe('MISSING_TOKEN');
    });

    it('should return 401 for tokens with invalid signature', async () => {
      const tokenWithBadSignature = jwt.sign(validUser, 'wrong-secret');
      
      const response = await request(mockApp as any)
        .get('/auth/me')
        .set('Authorization', `Bearer ${tokenWithBadSignature}`)
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token signature');
      expect(response.body.code).toBe('INVALID_SIGNATURE');
    });

    it('should return 401 for blacklisted tokens', async () => {
      const blacklistedToken = generateValidToken();
      // Assume token is blacklisted in database/cache
      
      const response = await request(mockApp as any)
        .get('/auth/me')
        .set('Authorization', `Bearer ${blacklistedToken}`)
        .set('Origin', 'http://localhost:3000')
        .set('X-Test-Blacklisted', 'true'); // Test flag

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token has been revoked');
      expect(response.body.code).toBe('TOKEN_REVOKED');
    });

    it('should validate required JWT claims', async () => {
      const incompletePayloads = [
        { userId: 123 }, // missing email, role, clubId
        { email: 'test@example.com' }, // missing userId, role, clubId
        { userId: 123, email: 'test@example.com' }, // missing role, clubId
        {}, // empty payload
      ];

      for (const payload of incompletePayloads) {
        const invalidToken = jwt.sign(payload, VALID_JWT_SECRET);
        
        const response = await request(mockApp as any)
          .get('/auth/me')
          .set('Authorization', `Bearer ${invalidToken}`)
          .set('Origin', 'http://localhost:3000');

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Invalid token claims');
        expect(response.body.code).toBe('INVALID_CLAIMS');
      }
    });
  });

  describe('Session Management', () => {
    it('should handle concurrent session validation requests', async () => {
      const validToken = jwt.sign({
        userId: 123,
        email: 'test@example.com',
        role: 'Member',
        clubId: 1
      }, VALID_JWT_SECRET);

      // Fire 10 concurrent requests
      const promises = Array(10).fill(null).map(() =>
        request(mockApp as any)
          .get('/auth/me')
          .set('Authorization', `Bearer ${validToken}`)
          .set('Origin', 'http://localhost:3000')
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach((response: any) => {
        expect(response.status).toBe(200);
        expect(response.body.userId).toBe(123);
      });
    });

    it('should handle session refresh scenarios', async () => {
      const nearExpiredToken = jwt.sign({
        userId: 123,
        email: 'test@example.com',
        role: 'Member',
        clubId: 1
      }, VALID_JWT_SECRET, { expiresIn: '5m' });

      const response = await request(mockApp as any)
        .get('/auth/me')
        .set('Authorization', `Bearer ${nearExpiredToken}`)
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
      // Should include refresh token in response headers when token is near expiration
      if (response.body.tokenExpiresIn < 300) { // Less than 5 minutes
        expect(response.headers['x-new-token']).toBeTruthy();
      }
    });

    it('should validate user still exists and is active', async () => {
      const tokenForDeletedUser = jwt.sign({
        userId: 99999, // Non-existent user
        email: 'deleted@example.com',
        role: 'Member',
        clubId: 1
      }, VALID_JWT_SECRET);

      const response = await request(mockApp as any)
        .get('/auth/me')
        .set('Authorization', `Bearer ${tokenForDeletedUser}`)
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('User account not found or inactive');
      expect(response.body.code).toBe('USER_NOT_FOUND');
    });

    it('should validate club membership is still active', async () => {
      const tokenForInactiveClub = jwt.sign({
        userId: 123,
        email: 'test@example.com',
        role: 'Member',
        clubId: 99999 // Non-existent or inactive club
      }, VALID_JWT_SECRET);

      const response = await request(mockApp as any)
        .get('/auth/me')
        .set('Authorization', `Bearer ${tokenForInactiveClub}`)
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Club membership inactive or club not found');
      expect(response.body.code).toBe('CLUB_ACCESS_DENIED');
    });
  });

  describe('Mobile App Specific Tests', () => {
    it('should handle mobile user agent headers', async () => {
      const validToken = jwt.sign({
        userId: 123,
        email: 'test@example.com',
        role: 'Member',
        clubId: 1
      }, VALID_JWT_SECRET);

      const mobileHeaders = [
        'GatherGrove-Mobile/1.0.0',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        'Mozilla/5.0 (Linux; Android 10; SM-G975F)',
      ];

      for (const userAgent of mobileHeaders) {
        const response = await request(mockApp as any)
          .get('/auth/me')
          .set('Authorization', `Bearer ${validToken}`)
          .set('User-Agent', userAgent)
          .set('X-Mobile-Client', 'true');

        expect(response.status).toBe(200);
        expect(response.body.clientType).toBe('mobile');
      }
    });

    it('should validate club tier for mobile access', async () => {
      const memberInSproutTier = jwt.sign({
        userId: 123,
        email: 'test@example.com',
        role: 'Member',
        clubId: 1,
        clubTier: 'Sprout'
      }, VALID_JWT_SECRET);

      const response = await request(mockApp as any)
        .get('/auth/me')
        .set('Authorization', `Bearer ${memberInSproutTier}`)
        .set('X-Mobile-Client', 'true');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Club must be on Grow tier for mobile app access');
      expect(response.body.code).toBe('TIER_RESTRICTION');
    });

    it('should allow Grow tier mobile access', async () => {
      const memberInGrowTier = jwt.sign({
        userId: 123,
        email: 'test@example.com',
        role: 'Member',
        clubId: 1,
        clubTier: 'Grow'
      }, VALID_JWT_SECRET);

      const response = await request(mockApp as any)
        .get('/auth/me')
        .set('Authorization', `Bearer ${memberInGrowTier}`)
        .set('X-Mobile-Client', 'true');

      expect(response.status).toBe(200);
      expect(response.body.mobileAccess).toBe(true);
    });
  });

  describe('Performance and Caching', () => {
    it('should respond within acceptable time limits', async () => {
      const validToken = jwt.sign({
        userId: 123,
        email: 'test@example.com',
        role: 'Member',
        clubId: 1
      }, VALID_JWT_SECRET);

      const startTime = performance.now();
      
      const response = await request(mockApp as any)
        .get('/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .set('Origin', 'http://localhost:3000');

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500); // Should respond within 500ms
    });

    it('should implement proper caching headers', async () => {
      const validToken = jwt.sign({
        userId: 123,
        email: 'test@example.com',
        role: 'Member',
        clubId: 1
      }, VALID_JWT_SECRET);

      const response = await request(mockApp as any)
        .get('/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
      expect(response.headers['cache-control']).toBe('private, no-cache, no-store, must-revalidate');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['expires']).toBe('0');
    });

    it('should handle high concurrent load', async () => {
      const validToken = jwt.sign({
        userId: 123,
        email: 'test@example.com',
        role: 'Member',
        clubId: 1
      }, VALID_JWT_SECRET);

      // Fire 50 concurrent requests
      const promises = Array(50).fill(null).map(() =>
        request(mockApp as any)
          .get('/auth/me')
          .set('Authorization', `Bearer ${validToken}`)
          .set('Origin', 'http://localhost:3000')
      );

      const startTime = performance.now();
      const responses = await Promise.all(promises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / responses.length;

      // All requests should succeed
      responses.forEach((response: any) => {
        expect(response.status).toBe(200);
      });

      // Average response time should be reasonable under load
      expect(avgResponseTime).toBeLessThan(1000);
    });
  });

  describe('Error Handling and Security', () => {
    it('should not leak sensitive information in error responses', async () => {
      const responses = await Promise.all([
        request(mockApp as any).get('/auth/me'),
        request(mockApp as any).get('/auth/me').set('Authorization', 'Bearer invalid'),
        request(mockApp as any).get('/auth/me').set('Authorization', 'Bearer expired.token.here'),
      ]);

      responses.forEach((response: any) => {
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body).not.toHaveProperty('stack');
        expect(response.body).not.toHaveProperty('internalError');
        expect(JSON.stringify(response.body)).not.toMatch(/secret|password|key|database/i);
      });
    });

    it('should implement proper rate limiting', async () => {
      const promises = Array(100).fill(null).map(() =>
        request(mockApp as any)
          .get('/auth/me')
          .set('X-Forwarded-For', '192.168.1.100') // Same IP for all requests
      );

      const responses = await Promise.all(promises);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should log authentication attempts appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await request(mockApp as any)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      // Verify security-relevant events are logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/auth.*attempt.*failed/i)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Environment-Specific Validation', () => {
    it('should validate production CORS configuration', async () => {
      const productionOrigins = [
        'https://app.gathergrove.club',
        'https://www.gathergrove.club'
      ];

      Object.assign(process.env, { NODE_ENV: 'production' });

      for (const origin of productionOrigins) {
        const response = await request(mockApp as any)
          .options('/auth/me')
          .set('Origin', origin)
          .set('Access-Control-Request-Method', 'GET');

        expect(response.status).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBe(origin);
      }

      // Should reject localhost in production
      const localhostResponse = await request(mockApp as any)
        .options('/auth/me')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(localhostResponse.status).toBe(403);
    });

    it('should validate development CORS configuration', async () => {
      Object.assign(process.env, { NODE_ENV: 'development' });

      const devOrigins = [
        'http://localhost:3000',
        'http://localhost:19006',
        'http://127.0.0.1:3000'
      ];

      for (const origin of devOrigins) {
        const response = await request(mockApp as any)
          .options('/auth/me')
          .set('Origin', origin)
          .set('Access-Control-Request-Method', 'GET');

        expect(response.status).toBe(200);
        expect(response.headers['access-control-allow-origin']).toBe(origin);
      }
    });
  });
});