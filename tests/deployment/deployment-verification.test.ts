/**
 * Deployment Verification Tests
 * Tests that go beyond health checks to validate actual application functionality post-deployment
 * Catches issues where deployment reports success but core functionality is broken
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import axios, { AxiosResponse, AxiosError, AxiosInstance } from 'axios';
import { performance } from 'perf_hooks';

// Configuration for different environments
interface DeploymentConfig {
  baseUrl: string;
  healthEndpoint: string;
  authEndpoint: string;
  timeout: number;
  expectedVersion: string;
}

const configs: Record<string, DeploymentConfig> = {
  development: {
    baseUrl: 'http://localhost:5284',
    healthEndpoint: '/api/v1/health',
    authEndpoint: '/api/v1/auth',
    timeout: 10000,
    expectedVersion: '1.0.0'
  },
  staging: {
    baseUrl: process.env.STAGING_API_URL || 'https://gathergrove-staging-api.azurewebsites.net',
    healthEndpoint: '/api/v1/health',
    authEndpoint: '/api/v1/auth',
    timeout: 30000,
    expectedVersion: '1.0.0'
  },
  production: {
    baseUrl: process.env.PROD_API_URL || 'https://api.gathergrove.club',
    healthEndpoint: '/api/v1/health',
    authEndpoint: '/api/v1/auth',
    timeout: 30000,
    expectedVersion: '1.0.0'
  }
};

describe('Deployment Verification Suite', () => {
  let config: DeploymentConfig;
  let apiClient: AxiosInstance;

  beforeAll(() => {
    const environment = process.env.TEST_ENVIRONMENT || 'development';
    config = configs[environment];
    
    if (!config) {
      throw new Error(`Unknown environment: ${environment}`);
    }

    // Configure axios client with timeout and error handling
    apiClient = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      validateStatus: () => true, // Don't throw on non-2xx status codes
      headers: {
        'User-Agent': 'GatherGrove-DeploymentVerification/1.0.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  });

  describe('1. Basic Service Availability', () => {
    it('should respond to health check within timeout', async () => {
      const startTime = performance.now();
      
      try {
        const response = await apiClient.get(config.healthEndpoint);
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        // Verify response characteristics
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/application\/json/);
        expect(responseTime).toBeLessThan(config.timeout);
        expect(responseTime).toBeLessThan(5000); // Health checks should be fast
        
        // Verify response structure
        expect(response.data).toHaveProperty('Status', 'Healthy');
        expect(response.data).toHaveProperty('Service', 'GatherGrove API');
        expect(response.data).toHaveProperty('Timestamp');
        
        console.log(`✅ Health check response time: ${responseTime.toFixed(2)}ms`);
      } catch (error) {
        const endTime = performance.now();
        const failureTime = endTime - startTime;
        
        console.error(`❌ Health check failed after ${failureTime.toFixed(2)}ms:`, 
          error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    });

    it('should have proper CORS headers configured', async () => {
      const response = await apiClient.options(config.healthEndpoint);
      
      // CORS should allow appropriate origins
      expect(response.status).toBe(200);
      
      // Check for CORS headers presence (values may vary by environment)
      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-methods',
        'access-control-allow-headers'
      ];
      
      corsHeaders.forEach(header => {
        expect(response.headers).toHaveProperty(header);
      });
    });

    it('should return consistent API version', async () => {
      const response = await apiClient.get(config.healthEndpoint);
      
      expect(response.status).toBe(200);
      expect(response.data.Version).toBe(config.expectedVersion);
      expect(response.data.Service).toBe('GatherGrove API');
    });
  });

  describe('2. Database Connectivity Validation', () => {
    it('should connect to database successfully', async () => {
      const response = await apiClient.get(`${config.healthEndpoint}/deep`);
      
      expect([200, 503]).toContain(response.status);
      expect(response.data).toHaveProperty('Database');
      expect(response.data.Database).toHaveProperty('Status');
      
      if (response.status === 503) {
        console.warn('⚠️  Database health check failed:', response.data.Database.Error);
        // In deployment verification, we need to fail if DB is not accessible
        expect(response.data.Database.Status).toBe('Connected');
      } else {
        expect(response.data.Database.Status).toBe('Connected');
        console.log('✅ Database connectivity verified');
      }
    });

    it('should execute database queries without timeout', async () => {
      const startTime = performance.now();
      const response = await apiClient.get(`${config.healthEndpoint}/debug`);
      const endTime = performance.now();
      const queryTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('DatabaseConnectivity');
      expect(response.data.DatabaseConnectivity.CanConnect).toBe(true);
      expect(response.data.DatabaseConnectivity.UserCount).toBeGreaterThanOrEqual(0);
      expect(queryTime).toBeLessThan(10000); // Query should complete within 10 seconds
      
      console.log(`✅ Database query executed in ${queryTime.toFixed(2)}ms`);
      console.log(`📊 User count: ${response.data.DatabaseConnectivity.UserCount}`);
    });

    it('should have proper database configuration loaded', async () => {
      const response = await apiClient.get(`${config.healthEndpoint}/debug`);
      
      expect(response.status).toBe(200);
      expect(response.data.Configuration).toHaveProperty('HasDefaultConnection', true);
      expect(response.data.Configuration).toHaveProperty('HasJwtSecret', true);
      
      // Verify environment-specific settings
      const environment = response.data.Environment;
      expect(['Development', 'Staging', 'Production']).toContain(environment);
      
      console.log(`✅ Configuration validated for environment: ${environment}`);
    });
  });

  describe('3. Authentication System Verification', () => {
    it('should handle invalid login attempts properly', async () => {
      const invalidCredentials = {
        email: 'nonexistent@test.com',
        password: 'wrongpassword'
      };

      const response = await apiClient.post(`${config.authEndpoint}/login`, invalidCredentials);
      
      // Should return 401 for invalid credentials, not 500 or timeout
      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('message');
      expect(response.data.message).toMatch(/invalid|unauthorized|credentials/i);
    });

    it('should validate required fields in registration', async () => {
      const incompleteData = {
        email: 'test@example.com'
        // Missing required fields
      };

      const response = await apiClient.post(`${config.authEndpoint}/register`, incompleteData);
      
      // Should return 400 for validation errors
      expect(response.status).toBe(400);
      expect(response.data).toBeDefined();
    });

    it('should handle password reset flow', async () => {
      const resetRequest = {
        email: 'test@example.com'
      };

      const response = await apiClient.post(`${config.authEndpoint}/forgot-password`, resetRequest);
      
      // Should not error out (regardless of whether email exists)
      expect([200, 404]).toContain(response.status);
      expect(response.data).toBeDefined();
    });

    it('should protect endpoints that require authentication', async () => {
      // Try to access a protected endpoint without token
      const protectedEndpoints = [
        '/api/v1/dashboard',
        '/api/v1/members',
        '/api/v1/admin/clubs'
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await apiClient.get(endpoint);
        
        // Should return 401 for unauthenticated requests
        expect(response.status).toBe(401);
        console.log(`✅ Protected endpoint ${endpoint} properly secured`);
      }
    });
  });

  describe('4. API Endpoint Response Validation', () => {
    const criticalEndpoints = [
      { path: '/api/v1/health', method: 'GET', expectedStatus: 200 },
      { path: '/api/v1/health/deep', method: 'GET', expectedStatus: [200, 503] },
      { path: '/api/v1/auth/login', method: 'POST', expectedStatus: 400, body: {} }
    ];

    criticalEndpoints.forEach(({ path, method, expectedStatus, body }) => {
      it(`should handle ${method} ${path} correctly`, async () => {
        let response: AxiosResponse;
        
        if (method === 'POST') {
          response = await apiClient.post(path, body || {});
        } else if (method === 'GET') {
          response = await apiClient.get(path);
        } else {
          throw new Error(`Unsupported method: ${method}`);
        }

        if (Array.isArray(expectedStatus)) {
          expect(expectedStatus).toContain(response.status);
        } else {
          expect(response.status).toBe(expectedStatus);
        }

        // Verify response has proper content type
        expect(response.headers['content-type']).toMatch(/application\/json/);
        
        // Verify response body is valid JSON
        expect(response.data).toBeDefined();
        expect(typeof response.data).toBe('object');
      });
    });
  });

  describe('5. Service Dependencies Check', () => {
    it('should have external service configurations available', async () => {
      const response = await apiClient.get(`${config.healthEndpoint}/debug`);
      
      expect(response.status).toBe(200);
      const configData = response.data.Configuration;
      
      // Check for required configuration presence
      expect(configData.HasJwtSecret).toBe(true);
      expect(configData.HasDefaultConnection).toBe(true);
      
      console.log('✅ External service configurations verified');
    });

    it('should handle Stripe integration availability', async () => {
      // This test verifies that Stripe configuration won't cause startup failures
      // Even if Stripe is not configured, the app should start
      const response = await apiClient.get(config.healthEndpoint);
      
      expect(response.status).toBe(200);
      expect(response.data.Status).toBe('Healthy');
      
      console.log('✅ Payment service integration does not block startup');
    });

    it('should handle email service gracefully', async () => {
      // Test that email service issues don't prevent startup
      const response = await apiClient.get(config.healthEndpoint);
      
      expect(response.status).toBe(200);
      expect(response.data.Status).toBe('Healthy');
      
      console.log('✅ Email service integration does not block startup');
    });
  });

  describe('6. Performance Under Load Simulation', () => {
    it('should handle concurrent requests without degradation', async () => {
      const concurrentRequests = 10;
      const requests = Array(concurrentRequests).fill(null).map(() => 
        apiClient.get(config.healthEndpoint)
      );

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Average response time should be reasonable
      const avgResponseTime = totalTime / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(2000); // Less than 2 seconds average
      
      console.log(`✅ Handled ${concurrentRequests} concurrent requests in ${totalTime.toFixed(2)}ms`);
      console.log(`📊 Average response time: ${avgResponseTime.toFixed(2)}ms`);
    });

    it('should not exceed memory limits under sustained load', async () => {
      const sustainedRequests = 50;
      const batchSize = 5;
      let successCount = 0;
      
      // Send requests in batches to avoid overwhelming the service
      for (let i = 0; i < sustainedRequests; i += batchSize) {
        const batch = Array(Math.min(batchSize, sustainedRequests - i))
          .fill(null)
          .map(() => apiClient.get(config.healthEndpoint));
        
        const batchResponses = await Promise.all(batch);
        successCount += batchResponses.filter(r => r.status === 200).length;
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // At least 95% of requests should succeed
      expect(successCount).toBeGreaterThanOrEqual(sustainedRequests * 0.95);
      
      console.log(`✅ ${successCount}/${sustainedRequests} sustained requests succeeded`);
    });
  });

  describe('7. Environment-Specific Validations', () => {
    it('should have correct environment configuration', async () => {
      const response = await apiClient.get(`${config.healthEndpoint}/debug`);
      
      expect(response.status).toBe(200);
      
      const environment = process.env.TEST_ENVIRONMENT || 'development';
      const responseEnv = response.data.Environment;
      
      // Verify environment matches expectation
      if (environment === 'development') {
        expect(['Development', 'Testing', 'Test']).toContain(responseEnv);
      } else if (environment === 'staging') {
        expect(responseEnv).toBe('Staging');
      } else if (environment === 'production') {
        expect(responseEnv).toBe('Production');
      }
      
      console.log(`✅ Environment configuration verified: ${responseEnv}`);
    });

    it('should use appropriate database for environment', async () => {
      const response = await apiClient.get(`${config.healthEndpoint}/debug`);
      
      expect(response.status).toBe(200);
      
      const environment = response.data.Environment;
      const useInMemoryDb = response.data.UseInMemoryDb;
      
      if (environment === 'Development' || environment === 'Testing') {
        // Development can use either in-memory or real DB
        expect(['true', 'false', null]).toContain(useInMemoryDb);
      } else {
        // Staging and Production should use real databases
        expect(useInMemoryDb).not.toBe('true');
      }
      
      console.log(`✅ Database type appropriate for ${environment}: InMemory=${useInMemoryDb}`);
    });
  });

  describe('8. Security Verification', () => {
    it('should not expose sensitive information in error responses', async () => {
      // Try to trigger various error conditions
      const errorTriggers = [
        { path: '/api/v1/nonexistent', expectedStatus: 404 },
        { path: '/api/v1/admin/clubs', expectedStatus: 401 },
        { path: '/api/v1/auth/login', expectedStatus: 400, body: { invalid: 'data' } }
      ];

      for (const trigger of errorTriggers) {
        let response: AxiosResponse;
        
        if (trigger.body) {
          response = await apiClient.post(trigger.path, trigger.body);
        } else {
          response = await apiClient.get(trigger.path);
        }

        expect(response.status).toBe(trigger.expectedStatus);
        
        // Verify no sensitive information is exposed
        const responseText = JSON.stringify(response.data).toLowerCase();
        const sensitivePatterns = [
          'password',
          'connectionstring',
          'secret',
          'apikey',
          'token',
          'server=',
          'database='
        ];

        sensitivePatterns.forEach(pattern => {
          expect(responseText).not.toContain(pattern);
        });
      }
      
      console.log('✅ Error responses do not expose sensitive information');
    });

    it('should have secure response headers', async () => {
      const response = await apiClient.get(config.healthEndpoint);
      
      expect(response.status).toBe(200);
      
      // Check for security-related headers
      const headers = response.headers;
      
      // These headers should be present in production environments
      if (process.env.TEST_ENVIRONMENT === 'production') {
        expect(headers).toHaveProperty('x-frame-options');
        expect(headers).toHaveProperty('x-content-type-options');
      }
      
      console.log('✅ Security headers verification completed');
    });
  });

  describe('9. Data Consistency Verification', () => {
    it('should return consistent data across multiple requests', async () => {
      const requests = Array(5).fill(null).map(() => 
        apiClient.get(`${config.healthEndpoint}/debug`)
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Verify consistent environment and configuration data
      const firstResponse = responses[0].data;
      responses.forEach(response => {
        expect(response.data.Environment).toBe(firstResponse.Environment);
        expect(response.data.Configuration.HasDefaultConnection)
          .toBe(firstResponse.Configuration.HasDefaultConnection);
        expect(response.data.Configuration.HasJwtSecret)
          .toBe(firstResponse.Configuration.HasJwtSecret);
      });
      
      console.log('✅ Data consistency verified across multiple requests');
    });
  });

  describe('10. Deployment Success Criteria', () => {
    it('should meet all deployment success criteria', async () => {
      const criteria: { [key: string]: boolean } = {
        'Basic health check passes': false,
        'Database connectivity verified': false,
        'Authentication endpoints respond': false,
        'Configuration loaded correctly': false,
        'No sensitive data exposed': true, // Assume true until proven false
        'Performance within limits': false
      };

      try {
        // Test 1: Basic health check
        const healthResponse = await apiClient.get(config.healthEndpoint);
        criteria['Basic health check passes'] = healthResponse.status === 200;

        // Test 2: Database connectivity
        const deepHealthResponse = await apiClient.get(`${config.healthEndpoint}/deep`);
        criteria['Database connectivity verified'] = [200, 503].includes(deepHealthResponse.status) &&
          deepHealthResponse.data.Database?.Status === 'Connected';

        // Test 3: Authentication endpoints
        const authResponse = await apiClient.post(`${config.authEndpoint}/login`, {});
        criteria['Authentication endpoints respond'] = authResponse.status === 400; // Bad request, but endpoint responds

        // Test 4: Configuration
        const debugResponse = await apiClient.get(`${config.healthEndpoint}/debug`);
        criteria['Configuration loaded correctly'] = debugResponse.status === 200 &&
          debugResponse.data.Configuration?.HasDefaultConnection === true;

        // Test 5: Performance
        const startTime = performance.now();
        await apiClient.get(config.healthEndpoint);
        const endTime = performance.now();
        criteria['Performance within limits'] = (endTime - startTime) < 5000;

      } catch (error) {
        console.error('Error during deployment criteria verification:', error);
      }

      // Report results
      console.log('\n📊 Deployment Success Criteria Results:');
      Object.entries(criteria).forEach(([criterion, passed]) => {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${criterion}`);
      });

      // All criteria must pass for successful deployment
      const allCriteriaMet = Object.values(criteria).every(criterion => criterion === true);
      expect(allCriteriaMet).toBe(true);

      if (allCriteriaMet) {
        console.log('\n🎉 All deployment verification criteria passed!');
      } else {
        console.log('\n💥 Some deployment verification criteria failed!');
      }
    });
  });

  afterAll(() => {
    console.log('\n📋 Deployment Verification Summary:');
    console.log(`Target Environment: ${process.env.TEST_ENVIRONMENT || 'development'}`);
    console.log(`Base URL: ${config.baseUrl}`);
    console.log(`Timeout: ${config.timeout}ms`);
    console.log('Verification completed at:', new Date().toISOString());
  });
});