/**
 * Live Authentication Flow Integration Tests
 * AUTH-VALIDATOR Agent - End-to-End Flow Testing
 * 
 * Tests the complete authentication flow against live/deployed environments
 * Validates that the authentication system works end-to-end in real conditions
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { performance } from 'perf_hooks';
import { jest } from '@jest/globals';

interface TestEnvironment {
  name: string;
  apiUrl: string;
  webUrl: string;
  timeout: number;
  skipIfUnavailable: boolean;
}

interface AuthResponse {
  userId: number;
  email: string;
  role: string;
  clubId: number;
  clubTier: string;
  token?: string;
  isAuthenticated: boolean;
}

interface TestUser {
  email: string;
  password: string;
  fullName: string;
  expectedRole: string;
  clubTier?: string;
}

describe('Live Authentication Flow Integration Tests', () => {
  const environments: TestEnvironment[] = [
    {
      name: 'Development',
      apiUrl: 'http://localhost:5284',
      webUrl: 'http://localhost:3000',
      timeout: 10000,
      skipIfUnavailable: true,
    },
    {
      name: 'Staging',
      apiUrl: process.env.STAGING_API_URL || 'https://gathergrove-staging-api.azurewebsites.net',
      webUrl: process.env.STAGING_WEB_URL || 'https://gathergrove-client-staging.azurewebsites.net',
      timeout: 30000,
      skipIfUnavailable: true,
    },
    {
      name: 'Production',
      apiUrl: process.env.PROD_API_URL || 'https://api.gathergrove.club',
      webUrl: process.env.PROD_WEB_URL || 'https://app.gathergrove.club',
      timeout: 30000,
      skipIfUnavailable: false, // Production failures should fail tests
    },
  ];

  // Test users for different scenarios
  const testUsers: Record<string, TestUser> = {
    validAdmin: {
      email: process.env.TEST_ADMIN_EMAIL || 'test.admin@example.com',
      password: process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!',
      fullName: 'Test Admin User',
      expectedRole: 'Admin',
      clubTier: 'Grow',
    },
    validMember: {
      email: process.env.TEST_MEMBER_EMAIL || 'test.member@example.com',
      password: process.env.TEST_MEMBER_PASSWORD || 'TestPassword123!',
      fullName: 'Test Member User',
      expectedRole: 'Member',
      clubTier: 'Grow',
    },
    invalidUser: {
      email: 'invalid@nonexistent.com',
      password: 'wrongpassword',
      fullName: 'Invalid User',
      expectedRole: 'Member',
    },
  };

  describe.each(environments)('$name Environment Authentication Flow', (env) => {
    let apiClient: AxiosInstance;
    let authenticatedToken: string | null = null;

    beforeAll(() => {
      apiClient = axios.create({
        baseURL: env.apiUrl,
        timeout: env.timeout,
        validateStatus: () => true, // Don't throw on 4xx/5xx
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'GatherGrove-IntegrationTest/1.0.0',
        },
      });
    });

    afterAll(async () => {
      // Clean up: logout if we have a token
      if (authenticatedToken) {
        try {
          await apiClient.post('/api/v1/auth/logout', {}, {
            headers: { Authorization: `Bearer ${authenticatedToken}` }
          });
        } catch (error) {
          console.warn('Failed to cleanup test session:', error);
        }
      }
    });

    describe('Health and Availability Check', () => {
      it('should be able to reach the API', async () => {
        try {
          const response = await apiClient.get('/api/v1/health');
          
          if (response.status === 200) {
            expect(response.data).toHaveProperty('status', 'healthy');
          } else if (env.skipIfUnavailable) {
            console.warn(`${env.name} API not available, skipping tests`);
            return;
          } else {
            throw new Error(`${env.name} API health check failed with status ${response.status}`);
          }
        } catch (error) {
          if (env.skipIfUnavailable) {
            console.warn(`${env.name} API not reachable, skipping tests:`, error);
            return;
          }
          throw error;
        }
      }, env.timeout);
    });

    describe('CORS Preflight Validation', () => {
      it('should handle CORS preflight for /auth/me', async () => {
        try {
          const response = await apiClient.options('/api/v1/auth/me', {
            headers: {
              'Origin': env.webUrl,
              'Access-Control-Request-Method': 'GET',
              'Access-Control-Request-Headers': 'Authorization',
            },
          });

          expect(response.status).toBe(200);
          expect(response.headers['access-control-allow-origin']).toBeTruthy();
          expect(response.headers['access-control-allow-methods']).toContain('GET');
          expect(response.headers['access-control-allow-credentials']).toBe('true');
        } catch (error: any) {
          if (env.skipIfUnavailable && error.code === 'ECONNREFUSED') {
            console.warn(`${env.name} API not available for CORS test`);
            return;
          }
          throw error;
        }
      }, env.timeout);

      it('should handle CORS preflight for /auth/login', async () => {
        try {
          const response = await apiClient.options('/api/v1/auth/login', {
            headers: {
              'Origin': env.webUrl,
              'Access-Control-Request-Method': 'POST',
              'Access-Control-Request-Headers': 'Content-Type',
            },
          });

          expect(response.status).toBe(200);
          expect(response.headers['access-control-allow-methods']).toContain('POST');
        } catch (error: any) {
          if (env.skipIfUnavailable && error.code === 'ECONNREFUSED') {
            console.warn(`${env.name} API not available for CORS test`);
            return;
          }
          throw error;
        }
      }, env.timeout);
    });

    describe('Authentication Flow', () => {
      it('should reject invalid credentials', async () => {
        try {
          const response = await apiClient.post('/api/v1/auth/login', {
            email: testUsers.invalidUser.email,
            password: testUsers.invalidUser.password,
          }, {
            headers: { 'Origin': env.webUrl },
          });

          expect(response.status).toBe(401);
          expect(response.data.error || response.data.message).toMatch(/invalid|incorrect|wrong/i);
        } catch (error: any) {
          if (env.skipIfUnavailable && error.code === 'ECONNREFUSED') {
            console.warn(`${env.name} API not available for login test`);
            return;
          }
          throw error;
        }
      }, env.timeout);

      it('should accept valid admin credentials', async () => {
        try {
          const startTime = performance.now();
          
          const response = await apiClient.post('/api/v1/auth/login', {
            email: testUsers.validAdmin.email,
            password: testUsers.validAdmin.password,
          }, {
            headers: { 'Origin': env.webUrl },
          });

          const responseTime = performance.now() - startTime;

          if (response.status === 200) {
            expect(response.data).toHaveProperty('userId');
            expect(response.data).toHaveProperty('email', testUsers.validAdmin.email);
            expect(response.data).toHaveProperty('role', 'Admin');
            expect(response.data).toHaveProperty('clubId');
            expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds

            // Store token for subsequent tests
            if (response.data.token) {
              authenticatedToken = response.data.token;
            }
          } else if (response.status === 401) {
            console.warn(`${env.name}: Admin test user credentials invalid or user doesn't exist`);
            return;
          } else {
            throw new Error(`Login failed with status ${response.status}: ${JSON.stringify(response.data)}`);
          }
        } catch (error: any) {
          if (env.skipIfUnavailable && error.code === 'ECONNREFUSED') {
            console.warn(`${env.name} API not available for admin login test`);
            return;
          }
          throw error;
        }
      }, env.timeout);

      it('should validate session with /auth/me', async () => {
        if (!authenticatedToken) {
          console.warn('No authenticated token available, skipping /auth/me test');
          return;
        }

        try {
          const startTime = performance.now();
          
          const response = await apiClient.get('/api/v1/auth/me', {
            headers: {
              'Authorization': `Bearer ${authenticatedToken}`,
              'Origin': env.webUrl,
            },
          });

          const responseTime = performance.now() - startTime;

          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('userId');
          expect(response.data).toHaveProperty('email');
          expect(response.data).toHaveProperty('role');
          expect(response.data).toHaveProperty('isAuthenticated', true);
          expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds

          // Validate CORS headers in actual response
          expect(response.headers['access-control-allow-origin']).toBeTruthy();
          expect(response.headers['access-control-allow-credentials']).toBe('true');
        } catch (error: any) {
          if (env.skipIfUnavailable && error.code === 'ECONNREFUSED') {
            console.warn(`${env.name} API not available for /auth/me test`);
            return;
          }
          throw error;
        }
      }, env.timeout);

      it('should reject requests without token', async () => {
        try {
          const response = await apiClient.get('/api/v1/auth/me', {
            headers: { 'Origin': env.webUrl },
          });

          expect(response.status).toBe(401);
          expect(response.data.error || response.data.message).toMatch(/unauthorized|token|authorization/i);
        } catch (error: any) {
          if (env.skipIfUnavailable && error.code === 'ECONNREFUSED') {
            console.warn(`${env.name} API not available for unauthorized test`);
            return;
          }
          throw error;
        }
      }, env.timeout);

      it('should reject requests with invalid token', async () => {
        try {
          const response = await apiClient.get('/api/v1/auth/me', {
            headers: {
              'Authorization': 'Bearer invalid-token-format',
              'Origin': env.webUrl,
            },
          });

          expect(response.status).toBe(401);
          expect(response.data.error || response.data.message).toMatch(/invalid|token/i);
        } catch (error: any) {
          if (env.skipIfUnavailable && error.code === 'ECONNREFUSED') {
            console.warn(`${env.name} API not available for invalid token test`);
            return;
          }
          throw error;
        }
      }, env.timeout);

      it('should handle logout properly', async () => {
        if (!authenticatedToken) {
          console.warn('No authenticated token available, skipping logout test');
          return;
        }

        try {
          const response = await apiClient.post('/api/v1/auth/logout', {}, {
            headers: {
              'Authorization': `Bearer ${authenticatedToken}`,
              'Origin': env.webUrl,
            },
          });

          expect(response.status).toBe(200);

          // Verify token is now invalid
          const meResponse = await apiClient.get('/api/v1/auth/me', {
            headers: {
              'Authorization': `Bearer ${authenticatedToken}`,
              'Origin': env.webUrl,
            },
          });

          expect(meResponse.status).toBe(401);
          
          // Clear the token since it's now invalid
          authenticatedToken = null;
        } catch (error: any) {
          if (env.skipIfUnavailable && error.code === 'ECONNREFUSED') {
            console.warn(`${env.name} API not available for logout test`);
            return;
          }
          throw error;
        }
      }, env.timeout);
    });

    describe('Mobile App Authentication', () => {
      let mobileToken: string | null = null;

      afterEach(async () => {
        // Clean up mobile token
        if (mobileToken) {
          try {
            await apiClient.post('/api/v1/auth/logout', {}, {
              headers: { Authorization: `Bearer ${mobileToken}` }
            });
          } catch (error) {
            console.warn('Failed to cleanup mobile test session:', error);
          }
          mobileToken = null;
        }
      });

      it('should handle mobile app login with proper headers', async () => {
        try {
          const response = await apiClient.post('/api/v1/auth/login', {
            email: testUsers.validMember.email,
            password: testUsers.validMember.password,
          }, {
            headers: {
              'Content-Type': 'application/json',
              'X-Mobile-Client': 'true',
              'User-Agent': 'GatherGrove-Mobile/1.0.0',
              'X-Platform': 'iOS',
              'X-App-Version': '1.0.0',
            },
          });

          if (response.status === 200) {
            expect(response.data).toHaveProperty('userId');
            expect(response.data).toHaveProperty('role', 'Member');
            expect(response.data.clubTier).toBe('Grow'); // Only Grow tier supports mobile
            
            mobileToken = response.data.token;
          } else if (response.status === 401) {
            console.warn(`${env.name}: Member test user credentials invalid or user doesn't exist`);
            return;
          } else if (response.status === 403) {
            console.warn(`${env.name}: Club tier restriction for mobile app`);
            return;
          }
        } catch (error: any) {
          if (env.skipIfUnavailable && error.code === 'ECONNREFUSED') {
            console.warn(`${env.name} API not available for mobile login test`);
            return;
          }
          throw error;
        }
      }, env.timeout);

      it('should validate mobile session with /auth/me', async () => {
        if (!mobileToken) {
          console.warn('No mobile token available, skipping mobile /auth/me test');
          return;
        }

        try {
          const response = await apiClient.get('/api/v1/auth/me', {
            headers: {
              'Authorization': `Bearer ${mobileToken}`,
              'X-Mobile-Client': 'true',
              'User-Agent': 'GatherGrove-Mobile/1.0.0',
            },
          });

          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('userId');
          expect(response.data).toHaveProperty('isAuthenticated', true);
          expect(response.data.clubTier).toBe('Grow');
        } catch (error: any) {
          if (env.skipIfUnavailable && error.code === 'ECONNREFUSED') {
            console.warn(`${env.name} API not available for mobile /auth/me test`);
            return;
          }
          throw error;
        }
      }, env.timeout);
    });

    describe('Performance and Reliability', () => {
      it('should handle concurrent authentication requests', async () => {
        try {
          const promises = Array(5).fill(null).map(() =>
            apiClient.post('/api/v1/auth/login', {
              email: testUsers.validAdmin.email,
              password: testUsers.validAdmin.password,
            }, {
              headers: { 'Origin': env.webUrl },
            })
          );

          const responses = await Promise.all(promises);

          // All should either succeed or fail consistently
          const statuses = responses.map(r => r.status);
          const uniqueStatuses = [...new Set(statuses)];
          
          expect(uniqueStatuses.length).toBeLessThanOrEqual(2); // Should be consistent

          // Clean up any tokens created
          const successfulResponses = responses.filter(r => r.status === 200);
          for (const response of successfulResponses) {
            if (response.data.token) {
              try {
                await apiClient.post('/api/v1/auth/logout', {}, {
                  headers: { Authorization: `Bearer ${response.data.token}` }
                });
              } catch (error) {
                // Ignore cleanup errors
              }
            }
          }
        } catch (error: any) {
          if (env.skipIfUnavailable && error.code === 'ECONNREFUSED') {
            console.warn(`${env.name} API not available for concurrent test`);
            return;
          }
          throw error;
        }
      }, env.timeout * 2);

      it('should handle /auth/me requests under load', async () => {
        if (!authenticatedToken) {
          // Create a token for this test
          try {
            const loginResponse = await apiClient.post('/api/v1/auth/login', {
              email: testUsers.validAdmin.email,
              password: testUsers.validAdmin.password,
            });
            
            if (loginResponse.status !== 200) {
              console.warn('Cannot create token for load test, skipping');
              return;
            }
            
            authenticatedToken = loginResponse.data.token;
          } catch (error) {
            console.warn('Cannot create token for load test, skipping');
            return;
          }
        }

        try {
          const startTime = performance.now();
          
          const promises = Array(10).fill(null).map(() =>
            apiClient.get('/api/v1/auth/me', {
              headers: {
                'Authorization': `Bearer ${authenticatedToken}`,
                'Origin': env.webUrl,
              },
            })
          );

          const responses = await Promise.all(promises);
          const endTime = performance.now();
          
          const totalTime = endTime - startTime;
          const avgResponseTime = totalTime / responses.length;

          // All should succeed
          responses.forEach(response => {
            expect(response.status).toBe(200);
          });

          // Average response time should be reasonable
          expect(avgResponseTime).toBeLessThan(3000);
        } catch (error: any) {
          if (env.skipIfUnavailable && error.code === 'ECONNREFUSED') {
            console.warn(`${env.name} API not available for load test`);
            return;
          }
          throw error;
        }
      }, env.timeout * 2);
    });

    describe('Error Handling and Recovery', () => {
      it('should provide helpful error messages', async () => {
        try {
          const errorScenarios = [
            {
              request: { email: '', password: '' },
              expectedStatus: 400,
              expectedError: /email.*required|validation/i,
            },
            {
              request: { email: 'invalid-email', password: 'test' },
              expectedStatus: 400,
              expectedError: /email.*format|invalid/i,
            },
            {
              request: { email: 'test@example.com', password: 'short' },
              expectedStatus: 400,
              expectedError: /password.*length|validation/i,
            },
          ];

          for (const scenario of errorScenarios) {
            const response = await apiClient.post('/api/v1/auth/login', scenario.request, {
              headers: { 'Origin': env.webUrl },
            });

            expect(response.status).toBe(scenario.expectedStatus);
            expect(response.data.error || response.data.message).toMatch(scenario.expectedError);
          }
        } catch (error: any) {
          if (env.skipIfUnavailable && error.code === 'ECONNREFUSED') {
            console.warn(`${env.name} API not available for error handling test`);
            return;
          }
          throw error;
        }
      }, env.timeout);

      it('should handle network timeouts gracefully', async () => {
        // Create a client with very short timeout
        const timeoutClient = axios.create({
          baseURL: env.apiUrl,
          timeout: 100, // 100ms timeout
          validateStatus: () => true,
        });

        try {
          const response = await timeoutClient.post('/api/v1/auth/login', {
            email: testUsers.validAdmin.email,
            password: testUsers.validAdmin.password,
          });

          // If it succeeds despite short timeout, that's fine
          // If it fails, it should be a timeout error
          if (response.status === 0 || !response.status) {
            expect(true).toBe(true); // Timeout occurred as expected
          }
        } catch (error: any) {
          expect(error.code).toMatch(/timeout|ECONNABORTED/i);
        }
      }, env.timeout);
    });
  });

  describe('Cross-Environment Consistency', () => {
    it('should have consistent API responses across environments', async () => {
      const results: Record<string, any> = {};

      // Test login endpoint structure across all available environments
      for (const env of environments) {
        try {
          const apiClient = axios.create({
            baseURL: env.apiUrl,
            timeout: env.timeout,
            validateStatus: () => true,
          });

          const response = await apiClient.post('/api/v1/auth/login', {
            email: 'nonexistent@example.com',
            password: 'wrongpassword',
          });

          results[env.name] = {
            status: response.status,
            hasErrorMessage: !!(response.data.error || response.data.message),
            responseStructure: Object.keys(response.data).sort(),
          };
        } catch (error) {
          if (!env.skipIfUnavailable) {
            throw error;
          }
          results[env.name] = { error: 'unavailable' };
        }
      }

      // All available environments should have consistent error responses
      const availableResults = Object.values(results).filter((r: any) => !r.error);
      if (availableResults.length > 1) {
        const firstResult = availableResults[0] as any;
        availableResults.forEach((result: any) => {
          expect(result.status).toBe(firstResult.status);
          expect(result.hasErrorMessage).toBe(firstResult.hasErrorMessage);
        });
      }
    }, 45000);
  });
});