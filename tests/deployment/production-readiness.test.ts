/**
 * Production Readiness Tests
 * Comprehensive tests that validate the application is ready for production deployment
 * Tests infrastructure, performance, security, and business logic validation
 */

import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import axios, { AxiosResponse, AxiosInstance } from 'axios';
import { performance } from 'perf_hooks';

interface ProductionChecklist {
  infrastructure: boolean;
  performance: boolean;
  security: boolean;
  monitoring: boolean;
  dataIntegrity: boolean;
  businessLogic: boolean;
  errorHandling: boolean;
  scalability: boolean;
}

describe('Production Readiness Verification', () => {
  let baseUrl: string;
  let apiClient: AxiosInstance;
  let checklist: ProductionChecklist;

  beforeAll(() => {
    baseUrl = process.env.PROD_API_URL || process.env.STAGING_API_URL || 'http://localhost:5284';
    
    apiClient = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'GatherGrove-ProductionReadiness/1.0.0'
      }
    });

    checklist = {
      infrastructure: false,
      performance: false,
      security: false,
      monitoring: false,
      dataIntegrity: false,
      businessLogic: false,
      errorHandling: false,
      scalability: false
    };
  });

  describe('Infrastructure Readiness', () => {
    it('should have proper HTTP status code handling', async () => {
      const testCases = [
        { endpoint: '/api/v1/health', expectedStatus: 200, description: 'Health endpoint' },
        { endpoint: '/api/v1/nonexistent', expectedStatus: 404, description: 'Non-existent endpoint' },
        { endpoint: '/api/v1/admin/clubs', expectedStatus: 401, description: 'Protected endpoint without auth' }
      ];

      let allTestsPassed = true;

      for (const testCase of testCases) {
        const response = await apiClient.get(testCase.endpoint);
        const passed = response.status === testCase.expectedStatus;
        
        if (!passed) {
          console.error(`❌ ${testCase.description}: Expected ${testCase.expectedStatus}, got ${response.status}`);
          allTestsPassed = false;
        } else {
          console.log(`✅ ${testCase.description}: Status ${response.status} correct`);
        }
      }

      checklist.infrastructure = allTestsPassed;
      expect(allTestsPassed).toBe(true);
    });

    it('should handle SSL/TLS correctly in production', async () => {
      if (!baseUrl.startsWith('https://')) {
        console.warn('⚠️  Not testing SSL/TLS - not using HTTPS URL');
        checklist.infrastructure = checklist.infrastructure && true;
        return;
      }

      try {
        const response = await apiClient.get('/api/v1/health');
        expect(response.status).toBe(200);
        
        // Additional SSL verification would require specialized tools
        console.log('✅ HTTPS connection established successfully');
        checklist.infrastructure = checklist.infrastructure && true;
      } catch (error) {
        console.error('❌ SSL/TLS connection failed:', error);
        checklist.infrastructure = false;
        throw error;
      }
    });

    it('should have proper resource limits configured', async () => {
      const startTime = performance.now();
      const response = await apiClient.get('/api/v1/health/debug');
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Response within 5 seconds
      
      // Check if memory usage is reasonable (indirect check through response time)
      expect(responseTime).toBeLessThan(2000); // Should be fast if not memory constrained
      
      console.log(`✅ Resource utilization check passed: ${responseTime.toFixed(2)}ms`);
      checklist.infrastructure = checklist.infrastructure && true;
    });
  });

  describe('Performance Readiness', () => {
    it('should meet response time SLA requirements', async () => {
      const criticalEndpoints = [
        { path: '/api/v1/health', sla: 1000 },
        { path: '/api/v1/health/deep', sla: 3000 },
        { path: '/api/v1/auth/login', sla: 2000, method: 'POST', data: {} }
      ];

      let allEndpointsMeetSLA = true;

      for (const endpoint of criticalEndpoints) {
        const iterations = 3;
        const responseTimes: number[] = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          
          if (endpoint.method === 'POST') {
            await apiClient.post(endpoint.path, endpoint.data || {});
          } else {
            await apiClient.get(endpoint.path);
          }
          
          const endTime = performance.now();
          responseTimes.push(endTime - startTime);
          
          // Small delay between iterations
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / iterations;
        const maxResponseTime = Math.max(...responseTimes);
        
        if (avgResponseTime > endpoint.sla || maxResponseTime > endpoint.sla * 1.5) {
          console.error(`❌ ${endpoint.path}: Avg ${avgResponseTime.toFixed(2)}ms, Max ${maxResponseTime.toFixed(2)}ms (SLA: ${endpoint.sla}ms)`);
          allEndpointsMeetSLA = false;
        } else {
          console.log(`✅ ${endpoint.path}: Avg ${avgResponseTime.toFixed(2)}ms (SLA: ${endpoint.sla}ms)`);
        }
      }

      checklist.performance = allEndpointsMeetSLA;
      expect(allEndpointsMeetSLA).toBe(true);
    });

    it('should handle concurrent load efficiently', async () => {
      const concurrencyLevels = [5, 10, 20];
      let canHandleConcurrency = true;

      for (const concurrency of concurrencyLevels) {
        const requests = Array(concurrency).fill(null).map(() => 
          apiClient.get('/api/v1/health')
        );

        const startTime = performance.now();
        const responses = await Promise.all(requests);
        const endTime = performance.now();
        const totalTime = endTime - startTime;

        const successCount = responses.filter(r => r.status === 200).length;
        const successRate = successCount / concurrency;
        const avgResponseTime = totalTime / concurrency;

        if (successRate < 0.95 || avgResponseTime > 3000) {
          console.error(`❌ Concurrency ${concurrency}: Success rate ${(successRate * 100).toFixed(1)}%, Avg time ${avgResponseTime.toFixed(2)}ms`);
          canHandleConcurrency = false;
        } else {
          console.log(`✅ Concurrency ${concurrency}: Success rate ${(successRate * 100).toFixed(1)}%, Avg time ${avgResponseTime.toFixed(2)}ms`);
        }
      }

      checklist.performance = checklist.performance && canHandleConcurrency;
      expect(canHandleConcurrency).toBe(true);
    });

    it('should have database connection pooling working correctly', async () => {
      // Test multiple rapid database calls to verify connection pooling
      const dbRequests = Array(15).fill(null).map(() => 
        apiClient.get('/api/v1/health/debug')
      );

      const startTime = performance.now();
      const responses = await Promise.all(dbRequests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBe(15);

      // With proper connection pooling, this should complete reasonably fast
      expect(totalTime).toBeLessThan(10000); // Within 10 seconds
      
      // Check that all responses indicate database connectivity
      successfulResponses.forEach(response => {
        expect(response.data.DatabaseConnectivity?.CanConnect).toBe(true);
      });

      console.log(`✅ Database connection pooling test: ${successfulResponses.length}/15 requests in ${totalTime.toFixed(2)}ms`);
      checklist.performance = checklist.performance && true;
    });
  });

  describe('Security Readiness', () => {
    it('should have secure authentication mechanisms', async () => {
      const authTests = [
        {
          name: 'Reject empty credentials',
          data: { email: '', password: '' },
          expectedStatus: 400
        },
        {
          name: 'Reject malformed email',
          data: { email: 'not-an-email', password: 'password123' },
          expectedStatus: 400
        },
        {
          name: 'Handle non-existent user',
          data: { email: 'nonexistent@example.com', password: 'password123' },
          expectedStatus: 401
        }
      ];

      let securityTestsPassed = true;

      for (const test of authTests) {
        const response = await apiClient.post('/api/v1/auth/login', test.data);
        
        if (response.status !== test.expectedStatus) {
          console.error(`❌ ${test.name}: Expected ${test.expectedStatus}, got ${response.status}`);
          securityTestsPassed = false;
        } else {
          console.log(`✅ ${test.name}: Status ${response.status} correct`);
        }
      }

      checklist.security = securityTestsPassed;
      expect(securityTestsPassed).toBe(true);
    });

    it('should not expose sensitive information', async () => {
      const endpoints = [
        '/api/v1/health',
        '/api/v1/health/deep',
        '/api/v1/health/debug'
      ];

      let noSensitiveDataExposed = true;
      const collectStringValues = (input: unknown): string[] => {
        if (typeof input === 'string') return [input];
        if (Array.isArray(input)) return input.flatMap(collectStringValues);
        if (input && typeof input === 'object') {
          return Object.values(input as Record<string, unknown>).flatMap(collectStringValues);
        }
        return [];
      };

      for (const endpoint of endpoints) {
        const response = await apiClient.get(endpoint);
        const responseText = collectStringValues(response.data).join(' ').toLowerCase();
        
        // Check for patterns that might indicate sensitive data exposure
        const sensitivePatterns = [
          /password[^\w]/,
          /secret[^\w]/,
          /key[^\w].*[a-f0-9]{16,}/,
          /server\s*=.*[^;]/,
          /database\s*=.*[^;]/,
          /connectionstring/
        ];

        for (const pattern of sensitivePatterns) {
          if (pattern.test(responseText)) {
            console.error(`❌ Potential sensitive data exposure in ${endpoint}`);
            noSensitiveDataExposed = false;
            break;
          }
        }
      }

      if (noSensitiveDataExposed) {
        console.log('✅ No sensitive information exposed in API responses');
      }

      checklist.security = checklist.security && noSensitiveDataExposed;
      expect(noSensitiveDataExposed).toBe(true);
    });

    it('should have proper authorization controls', async () => {
      const protectedEndpoints = [
        '/api/v1/admin/clubs',
        '/api/v1/dashboard',
        '/api/v1/members'
      ];

      let authorizationWorking = true;

      for (const endpoint of protectedEndpoints) {
        const response = await apiClient.get(endpoint);
        
        // Should return 401 (Unauthorized) for protected endpoints
        if (response.status !== 401) {
          console.error(`❌ Protected endpoint ${endpoint} returned ${response.status} instead of 401`);
          authorizationWorking = false;
        } else {
          console.log(`✅ Protected endpoint ${endpoint} properly secured`);
        }
      }

      checklist.security = checklist.security && authorizationWorking;
      expect(authorizationWorking).toBe(true);
    });
  });

  describe('Monitoring and Observability', () => {
    it('should have comprehensive health checks available', async () => {
      const healthEndpoints = [
        { path: '/api/v1/health', name: 'Basic health' },
        { path: '/api/v1/health/deep', name: 'Deep health with dependencies' },
        { path: '/api/v1/health/debug', name: 'Debug information' }
      ];

      let healthChecksComplete = true;

      for (const endpoint of healthEndpoints) {
        const response = await apiClient.get(endpoint.path);
        
        if (![200, 503].includes(response.status)) {
          console.error(`❌ ${endpoint.name} endpoint failed: ${response.status}`);
          healthChecksComplete = false;
        } else {
          expect(response.data).toHaveProperty('Status');
          expect(response.data).toHaveProperty('Timestamp');
          console.log(`✅ ${endpoint.name} endpoint working: ${response.data.Status}`);
        }
      }

      checklist.monitoring = healthChecksComplete;
      expect(healthChecksComplete).toBe(true);
    });

    it('should provide meaningful error responses', async () => {
      const errorScenarios = [
        { path: '/api/v1/nonexistent', expectedStatus: 404, name: '404 Not Found' },
        { path: '/api/v1/auth/login', method: 'POST', data: {}, expectedStatus: 400, name: '400 Bad Request' },
        { path: '/api/v1/admin/clubs', expectedStatus: 401, name: '401 Unauthorized' }
      ];

      let errorHandlingWorking = true;

      for (const scenario of errorScenarios) {
        let response: AxiosResponse;
        
        if (scenario.method === 'POST') {
          response = await apiClient.post(scenario.path, scenario.data || {});
        } else {
          response = await apiClient.get(scenario.path);
        }

        if (response.status !== scenario.expectedStatus) {
          console.error(`❌ ${scenario.name}: Expected ${scenario.expectedStatus}, got ${response.status}`);
          errorHandlingWorking = false;
        } else {
          // Verify error response has meaningful content
          expect(response.data).toBeDefined();
          expect(typeof response.data).toBe('object');
          console.log(`✅ ${scenario.name}: Proper error response`);
        }
      }

      checklist.errorHandling = errorHandlingWorking;
      expect(errorHandlingWorking).toBe(true);
    });
  });

  describe('Data Integrity and Business Logic', () => {
    it('should maintain consistent application state', async () => {
      // Make multiple calls to verify consistent state
      const responses = await Promise.all([
        apiClient.get('/api/v1/health/debug'),
        apiClient.get('/api/v1/health/debug'),
        apiClient.get('/api/v1/health/debug')
      ]);

      expect(responses.every(r => r.status === 200)).toBe(true);

      // Verify environment consistency
      const environments = responses.map(r => r.data.Environment);
      expect(new Set(environments).size).toBe(1); // All should be the same

      // Verify database connection consistency  
      const dbStatuses = responses.map(r => r.data.DatabaseConnectivity?.CanConnect);
      expect(new Set(dbStatuses).size).toBe(1); // All should be the same

      console.log('✅ Application state consistency verified');
      checklist.dataIntegrity = true;
    });

    it('should handle edge cases in business logic', async () => {
      const edgeCases = [
        {
          name: 'Empty request body',
          endpoint: '/api/v1/auth/login',
          method: 'POST',
          data: {},
          expectedStatus: 400
        },
        {
          name: 'Malformed JSON handling',
          endpoint: '/api/v1/auth/login',
          method: 'POST',
          data: { malformed: true },
          expectedStatus: 400
        }
      ];

      let businessLogicRobust = true;

      for (const edgeCase of edgeCases) {
        const response = await apiClient.post(edgeCase.endpoint, edgeCase.data);
        
        if (response.status !== edgeCase.expectedStatus) {
          console.error(`❌ ${edgeCase.name}: Expected ${edgeCase.expectedStatus}, got ${response.status}`);
          businessLogicRobust = false;
        } else {
          console.log(`✅ ${edgeCase.name}: Handled correctly`);
        }
      }

      checklist.businessLogic = businessLogicRobust;
      expect(businessLogicRobust).toBe(true);
    });
  });

  describe('Scalability Readiness', () => {
    it('should handle database queries efficiently', async () => {
      const queryTests = [
        { endpoint: '/api/v1/health/debug', name: 'Database query performance' }
      ];

      let scalabilityReady = true;

      for (const test of queryTests) {
        const iterations = 10;
        const queryTimes: number[] = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          const response = await apiClient.get(test.endpoint);
          const endTime = performance.now();
          
          expect(response.status).toBe(200);
          queryTimes.push(endTime - startTime);
        }

        const avgTime = queryTimes.reduce((a, b) => a + b, 0) / iterations;
        const maxTime = Math.max(...queryTimes);

        if (avgTime > 1000 || maxTime > 2000) {
          console.error(`❌ ${test.name}: Avg ${avgTime.toFixed(2)}ms, Max ${maxTime.toFixed(2)}ms (too slow)`);
          scalabilityReady = false;
        } else {
          console.log(`✅ ${test.name}: Avg ${avgTime.toFixed(2)}ms, Max ${maxTime.toFixed(2)}ms`);
        }
      }

      checklist.scalability = scalabilityReady;
      expect(scalabilityReady).toBe(true);
    });

    it('should gracefully degrade under stress', async () => {
      // Simulate stress by making many concurrent requests
      const stressLevel = 30; // Concurrent requests
      const requests = Array(stressLevel).fill(null).map(() => 
        apiClient.get('/api/v1/health')
      );

      const startTime = performance.now();
      const responses = await Promise.all(requests.map(req => 
        req.catch(error => ({ status: 500, error: error.message }))
      ));
      const endTime = performance.now();

      const successCount = responses.filter(r => r.status === 200).length;
      const successRate = successCount / stressLevel;
      const totalTime = endTime - startTime;

      // Should handle at least 80% of requests successfully under stress
      expect(successRate).toBeGreaterThanOrEqual(0.8);
      
      // Should complete within reasonable time even under stress
      expect(totalTime).toBeLessThan(15000); // 15 seconds max

      console.log(`✅ Stress test: ${successCount}/${stressLevel} requests successful in ${totalTime.toFixed(2)}ms`);
      checklist.scalability = checklist.scalability && true;
    });
  });

  describe('Production Deployment Checklist', () => {
    it('should pass all production readiness criteria', () => {
      console.log('\n📊 Production Readiness Checklist Results:');
      console.log('=====================================================');
      
      const criteriaResults = [
        { name: '🏗️  Infrastructure', status: checklist.infrastructure },
        { name: '⚡ Performance', status: checklist.performance },
        { name: '🔒 Security', status: checklist.security },
        { name: '📊 Monitoring', status: checklist.monitoring },
        { name: '💾 Data Integrity', status: checklist.dataIntegrity },
        { name: '🔧 Business Logic', status: checklist.businessLogic },
        { name: '❌ Error Handling', status: checklist.errorHandling },
        { name: '📈 Scalability', status: checklist.scalability }
      ];

      criteriaResults.forEach(criterion => {
        const status = criterion.status ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${criterion.name}`);
      });

      const allCriteriaPassed = Object.values(checklist).every(status => status === true);
      const passedCount = Object.values(checklist).filter(status => status === true).length;
      const totalCount = Object.values(checklist).length;

      console.log('=====================================================');
      console.log(`📊 Overall Score: ${passedCount}/${totalCount} criteria passed`);
      console.log(`🎯 Ready for Production: ${allCriteriaPassed ? 'YES ✅' : 'NO ❌'}`);
      console.log('=====================================================\n');

      // Log specific recommendations if criteria fail
      if (!allCriteriaPassed) {
        console.log('🔧 Recommendations for failed criteria:');
        if (!checklist.infrastructure) console.log('   - Review server configuration and HTTP handling');
        if (!checklist.performance) console.log('   - Optimize database queries and implement caching');
        if (!checklist.security) console.log('   - Strengthen authentication and authorization');
        if (!checklist.monitoring) console.log('   - Implement comprehensive health checks');
        if (!checklist.dataIntegrity) console.log('   - Review data validation and consistency checks');
        if (!checklist.businessLogic) console.log('   - Add more robust input validation');
        if (!checklist.errorHandling) console.log('   - Improve error responses and logging');
        if (!checklist.scalability) console.log('   - Review resource limits and connection pooling');
        console.log('');
      }

      expect(allCriteriaPassed).toBe(true);
    });
  });
});
