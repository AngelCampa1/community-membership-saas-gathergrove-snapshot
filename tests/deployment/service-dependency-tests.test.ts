/**
 * Service Dependency Tests
 * Tests that validate all service dependencies are available and functioning
 * Catches issues where services start but dependencies fail on first real usage
 */

import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import axios, { AxiosResponse, AxiosInstance } from 'axios';
import { performance } from 'perf_hooks';

// Import mock service conditionally
let mockApiService: any;
if (process.env.OFFLINE_TESTS === 'true' || process.env.NODE_ENV === 'test') {
  mockApiService = require('../__mocks__/mockApiService');
}

interface ServiceDependency {
  name: string;
  required: boolean;
  healthCheck: () => Promise<{ available: boolean; latency?: number; error?: string }>;
  criticalOperations: (() => Promise<void>)[];
}

describe('Service Dependency Validation', () => {
  let baseUrl: string;
  let apiClient: AxiosInstance;
  let dependencies: ServiceDependency[];

  beforeAll(() => {
    const isOfflineTest = process.env.OFFLINE_TESTS === 'true' || process.env.NODE_ENV === 'test';
    baseUrl = process.env.TEST_API_URL || process.env.STAGING_API_URL || 'http://localhost:5284';
    
    apiClient = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'GatherGrove-DependencyTest/1.0.0'
      }
    });

    // Initialize mock service for offline testing
    if (isOfflineTest) {
      console.log('🔒 OFFLINE MODE: Initializing mock API service...');
      mockApiService.initialize(apiClient);
      console.log('✅ Mock API service initialized for offline testing');
    }

    // Define service dependencies to test
    dependencies = [
      {
        name: 'Database (SQL Server)',
        required: true,
        healthCheck: async () => {
          const startTime = performance.now();
          try {
            const response = await apiClient.get('/api/v1/health/deep');
            const endTime = performance.now();
            
            return {
              available: response.status === 200 && response.data.Database?.Status === 'Connected',
              latency: endTime - startTime,
              error: response.data.Database?.Error
            };
          } catch (error) {
            return {
              available: false,
              latency: performance.now() - startTime,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        },
        criticalOperations: [
          async () => {
            // Test database query execution
            const response = await apiClient.get('/api/v1/health/debug');
            expect(response.status).toBe(200);
            expect(response.data.DatabaseConnectivity.CanConnect).toBe(true);
          }
        ]
      },
      {
        name: 'JWT Token Service',
        required: true,
        healthCheck: async () => {
          try {
            const response = await apiClient.get('/api/v1/health/debug');
            return {
              available: response.status === 200 && response.data.Configuration?.HasJwtSecret === true
            };
          } catch (error) {
            return {
              available: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        },
        criticalOperations: [
          async () => {
            // Test JWT token validation (should reject invalid token)
            const invalidTokenClient = axios.create({
              baseURL: baseUrl,
              timeout: 10000,
              validateStatus: () => true,
              headers: {
                'Authorization': 'Bearer invalid-token'
              }
            });
            
            const response = await invalidTokenClient.get('/api/v1/admin/clubs');
            expect(response.status).toBe(401); // Should reject invalid token
          }
        ]
      },
      {
        name: 'Configuration Service',
        required: true,
        healthCheck: async () => {
          try {
            const response = await apiClient.get('/api/v1/health/debug');
            const config = response.data.Configuration;
            
            return {
              available: response.status === 200 && 
                        config?.HasDefaultConnection === true &&
                        config?.HasJwtSecret === true
            };
          } catch (error) {
            return {
              available: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        },
        criticalOperations: [
          async () => {
            // Test configuration loading
            const response = await apiClient.get('/api/v1/health/debug');
            expect(response.status).toBe(200);
            expect(response.data.Environment).toBeDefined();
            expect(['Development', 'Staging', 'Production', 'Testing', 'Test']).toContain(response.data.Environment);
          }
        ]
      },
      {
        name: 'Email Service (Azure Communication Services)',
        required: false, // Non-critical service
        healthCheck: async () => {
          try {
            // Email service health is indirectly tested through app startup
            const response = await apiClient.get('/api/v1/health');
            return {
              available: response.status === 200 && response.data.Status === 'Healthy'
            };
          } catch (error) {
            return {
              available: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        },
        criticalOperations: [
          async () => {
            // Test that email service failure doesn't crash app
            const response = await apiClient.get('/api/v1/health');
            expect(response.status).toBe(200);
            expect(response.data.Status).toBe('Healthy');
          }
        ]
      },
      {
        name: 'Payment Service (Stripe)',
        required: false, // Non-critical service
        healthCheck: async () => {
          try {
            // Stripe service health is indirectly tested through app startup
            const response = await apiClient.get('/api/v1/health');
            return {
              available: response.status === 200 && response.data.Status === 'Healthy'
            };
          } catch (error) {
            return {
              available: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        },
        criticalOperations: [
          async () => {
            // Test that Stripe service issues don't crash app
            const response = await apiClient.get('/api/v1/health');
            expect(response.status).toBe(200);
            expect(response.data.Status).toBe('Healthy');
          }
        ]
      },
      {
        name: 'Memory Cache Service',
        required: true,
        healthCheck: async () => {
          try {
            // Memory cache health is tested through consistent API responses
            const responses = await Promise.all([
              apiClient.get('/api/v1/health'),
              apiClient.get('/api/v1/health'),
              apiClient.get('/api/v1/health')
            ]);
            
            const allHealthy = responses.every(r => r.status === 200);
            return { available: allHealthy };
          } catch (error) {
            return {
              available: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        },
        criticalOperations: [
          async () => {
            // Test memory cache doesn't cause issues
            const startTime = performance.now();
            const response = await apiClient.get('/api/v1/health');
            const endTime = performance.now();
            
            expect(response.status).toBe(200);
            expect(endTime - startTime).toBeLessThan(2000); // Should be fast with caching
          }
        ]
      },
      {
        name: 'Sentry (Telemetry)',
        required: false, // Non-critical service
        healthCheck: async () => {
          try {
            const response = await apiClient.get('/api/v1/health/debug');
            return {
              available: response.status === 200 &&
                        response.data.Configuration?.HasSentry !== false
            };
          } catch (error) {
            return {
              available: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        },
        criticalOperations: [
          async () => {
            // Test that telemetry issues don't crash app
            const response = await apiClient.get('/api/v1/health');
            expect(response.status).toBe(200);
            expect(response.data.Status).toBe('Healthy');
          }
        ]
      }
    ];

    console.log(`🔧 Testing service dependencies against: ${baseUrl}`);
    console.log(`🔍 Offline Testing Mode: ${isOfflineTest ? 'ENABLED' : 'DISABLED'}`);
  });

  describe('1. Critical Service Dependencies', () => {
    it('should have all critical services available', async () => {
      console.log('🔄 Testing critical service dependencies...');
      
      const criticalServices = dependencies.filter(dep => dep.required);
      const results: Array<{ name: string; available: boolean; latency?: number; error?: string }> = [];

      for (const service of criticalServices) {
        console.log(`   Testing ${service.name}...`);
        const result = await service.healthCheck();
        results.push({ name: service.name, ...result });

        if (result.available) {
          console.log(`   ✅ ${service.name}: Available ${result.latency ? `(${result.latency.toFixed(2)}ms)` : ''}`);
        } else {
          console.error(`   ❌ ${service.name}: Unavailable - ${result.error || 'Unknown error'}`);
        }
      }

      // All critical services must be available
      const unavailableServices = results.filter(r => !r.available);
      if (unavailableServices.length > 0) {
        const serviceNames = unavailableServices.map(s => s.name).join(', ');
        throw new Error(`Critical services unavailable: ${serviceNames}`);
      }

      expect(unavailableServices.length).toBe(0);
      console.log('✅ All critical services are available');
    });

    it('should execute critical operations successfully', async () => {
      console.log('🔄 Testing critical operations...');
      
      const criticalServices = dependencies.filter(dep => dep.required);

      for (const service of criticalServices) {
        console.log(`   Testing ${service.name} operations...`);
        
        for (let i = 0; i < service.criticalOperations.length; i++) {
          const operation = service.criticalOperations[i];
          try {
            await operation();
            console.log(`     ✅ Operation ${i + 1} successful`);
          } catch (error) {
            console.error(`     ❌ Operation ${i + 1} failed:`, error);
            throw new Error(`${service.name} operation ${i + 1} failed: ${error}`);
          }
        }
      }
      
      console.log('✅ All critical operations successful');
    });
  });

  describe('2. Non-Critical Service Dependencies', () => {
    it('should gracefully handle non-critical service failures', async () => {
      console.log('🔄 Testing non-critical service dependencies...');
      
      const nonCriticalServices = dependencies.filter(dep => !dep.required);
      const results: Array<{ name: string; available: boolean; error?: string }> = [];

      for (const service of nonCriticalServices) {
        console.log(`   Testing ${service.name}...`);
        const result = await service.healthCheck();
        results.push({ name: service.name, ...result });

        if (result.available) {
          console.log(`   ✅ ${service.name}: Available`);
        } else {
          console.log(`   ⚠️  ${service.name}: Unavailable (graceful degradation) - ${result.error || 'Unknown error'}`);
        }

        // Execute operations to ensure graceful degradation
        for (const operation of service.criticalOperations) {
          try {
            await operation();
          } catch (error) {
            console.error(`   ❌ ${service.name} operation failed:`, error);
            throw error;
          }
        }
      }

      // Non-critical services can be unavailable, but shouldn't crash the app
      console.log('✅ Non-critical services handle failure gracefully');
    });
  });

  describe('3. Service Integration Testing', () => {
    it('should handle service interdependencies correctly', async () => {
      console.log('🔄 Testing service interdependencies...');

      // Test that database + JWT + configuration work together
      const integrationTests = [
        {
          name: 'Database + Configuration integration',
          test: async () => {
            const response = await apiClient.get('/api/v1/health/debug');
            expect(response.status).toBe(200);
            expect(response.data.DatabaseConnectivity.CanConnect).toBe(true);
            expect(response.data.Configuration.HasDefaultConnection).toBe(true);
          }
        },
        {
          name: 'JWT + Authorization integration',
          test: async () => {
            const response = await apiClient.get('/api/v1/admin/clubs');
            expect(response.status).toBe(401); // Properly rejects unauthorized requests
          }
        },
        {
          name: 'Configuration + Environment integration',
          test: async () => {
            const response = await apiClient.get('/api/v1/health/debug');
            expect(response.status).toBe(200);
            expect(response.data.Environment).toBeDefined();
            expect(response.data.Configuration).toBeDefined();
          }
        }
      ];

      for (const integrationTest of integrationTests) {
        try {
          await integrationTest.test();
          console.log(`   ✅ ${integrationTest.name}: Working`);
        } catch (error) {
          console.error(`   ❌ ${integrationTest.name}: Failed`, error);
          throw error;
        }
      }

      console.log('✅ Service interdependencies working correctly');
    });

    it('should maintain service availability under load', async () => {
      console.log('🔄 Testing service availability under load...');

      const loadTest = async (serviceEndpoint: string, concurrency: number, iterations: number) => {
        const requests = Array(concurrency).fill(null).map(async () => {
          const results: boolean[] = [];
          
          for (let i = 0; i < iterations; i++) {
            try {
              const response = await apiClient.get(serviceEndpoint);
              results.push(response.status < 400);
            } catch (error) {
              results.push(false);
            }
            
            // Small delay to prevent overwhelming
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          return results;
        });

        const allResults = await Promise.all(requests);
        const flatResults = allResults.flat();
        const successCount = flatResults.filter(r => r).length;
        const successRate = successCount / flatResults.length;

        return { successRate, totalRequests: flatResults.length, successCount };
      };

      const testEndpoints = [
        { endpoint: '/api/v1/health', name: 'Health Service' },
        { endpoint: '/api/v1/health/deep', name: 'Database Service' },
        { endpoint: '/api/v1/health/debug', name: 'Configuration Service' }
      ];

      for (const test of testEndpoints) {
        const result = await loadTest(test.endpoint, 3, 5); // 3 concurrent, 5 iterations each
        
        expect(result.successRate).toBeGreaterThanOrEqual(0.9); // 90% success rate minimum
        
        console.log(`   ✅ ${test.name}: ${result.successCount}/${result.totalRequests} successful (${(result.successRate * 100).toFixed(1)}%)`);
      }

      console.log('✅ Service availability maintained under load');
    });
  });

  describe('4. Service Failover and Recovery', () => {
    it('should handle temporary service disruptions', async () => {
      console.log('🔄 Testing service recovery from disruptions...');

      // Simulate service disruption by rapid requests that might cause temporary failures
      const disruptionTest = async (endpoint: string, iterations: number) => {
        const results: Array<{ success: boolean; responseTime: number }> = [];
        
        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          try {
            const response = await apiClient.get(endpoint);
            const endTime = performance.now();
            results.push({
              success: response.status < 400,
              responseTime: endTime - startTime
            });
          } catch (error) {
            const endTime = performance.now();
            results.push({
              success: false,
              responseTime: endTime - startTime
            });
          }

          // Very small delay to create pressure but allow recovery
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        return results;
      };

      const testResults = await disruptionTest('/api/v1/health', 50);
      const successCount = testResults.filter(r => r.success).length;
      const successRate = successCount / testResults.length;
      const avgResponseTime = testResults.reduce((sum, r) => sum + r.responseTime, 0) / testResults.length;

      // Should maintain reasonable success rate even under pressure
      expect(successRate).toBeGreaterThanOrEqual(0.8); // 80% minimum success rate
      expect(avgResponseTime).toBeLessThan(5000); // Average response time under 5 seconds

      console.log(`✅ Service disruption recovery: ${successCount}/${testResults.length} successful (${(successRate * 100).toFixed(1)}%)`);
      console.log(`📊 Average response time: ${avgResponseTime.toFixed(2)}ms`);
    });

    it('should have appropriate timeout handling', async () => {
      console.log('🔄 Testing service timeout handling...');

      // Test various timeout scenarios
      const timeoutTests = [
        {
          name: 'Quick health check',
          endpoint: '/api/v1/health',
          expectedMaxTime: 2000
        },
        {
          name: 'Database health check',
          endpoint: '/api/v1/health/deep',
          expectedMaxTime: 5000
        },
        {
          name: 'Debug endpoint',
          endpoint: '/api/v1/health/debug',
          expectedMaxTime: 5000
        }
      ];

      for (const test of timeoutTests) {
        const startTime = performance.now();
        const response = await apiClient.get(test.endpoint);
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        expect([200, 503]).toContain(response.status); // Allow for service unavailable
        expect(responseTime).toBeLessThan(test.expectedMaxTime);

        console.log(`   ✅ ${test.name}: ${responseTime.toFixed(2)}ms (limit: ${test.expectedMaxTime}ms)`);
      }

      console.log('✅ Service timeout handling appropriate');
    });
  });

  describe('5. Service Performance Monitoring', () => {
    it('should provide service performance metrics', async () => {
      console.log('🔄 Testing service performance metrics...');

      const performanceTests = [
        { endpoint: '/api/v1/health', name: 'Basic Health', expectedMaxTime: 500 },
        { endpoint: '/api/v1/health/deep', name: 'Deep Health', expectedMaxTime: 2000 },
        { endpoint: '/api/v1/health/debug', name: 'Debug Info', expectedMaxTime: 3000 }
      ];

      const results: Array<{ name: string; avgTime: number; maxTime: number; minTime: number }> = [];

      for (const test of performanceTests) {
        const times: number[] = [];
        const iterations = 5;

        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          const response = await apiClient.get(test.endpoint);
          const endTime = performance.now();

          expect([200, 503]).toContain(response.status);
          times.push(endTime - startTime);

          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxTime = Math.max(...times);
        const minTime = Math.min(...times);

        results.push({ name: test.name, avgTime, maxTime, minTime });

        expect(avgTime).toBeLessThan(test.expectedMaxTime);
        expect(maxTime).toBeLessThan(test.expectedMaxTime * 1.5); // Allow some variance

        console.log(`   ✅ ${test.name}: Avg ${avgTime.toFixed(2)}ms, Max ${maxTime.toFixed(2)}ms, Min ${minTime.toFixed(2)}ms`);
      }

      console.log('✅ Service performance metrics within acceptable ranges');
    });

    it('should maintain consistent service response times', async () => {
      console.log('🔄 Testing service response time consistency...');

      const consistencyTest = async (endpoint: string, samples: number) => {
        const times: number[] = [];

        for (let i = 0; i < samples; i++) {
          const startTime = performance.now();
          const response = await apiClient.get(endpoint);
          const endTime = performance.now();

          if (response.status < 400) {
            times.push(endTime - startTime);
          }

          await new Promise(resolve => setTimeout(resolve, 200));
        }

        if (times.length === 0) return { consistent: false, variance: 0 };

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const variance = times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / times.length;
        const standardDeviation = Math.sqrt(variance);
        const coefficientOfVariation = standardDeviation / avgTime;

        // Consistency is good if coefficient of variation is low
        return {
          consistent: coefficientOfVariation < 0.5, // 50% coefficient of variation threshold
          variance: coefficientOfVariation,
          avgTime,
          standardDeviation
        };
      };

      const consistencyResult = await consistencyTest('/api/v1/health', 10);
      
      expect(consistencyResult.consistent).toBe(true);
      
      console.log(`✅ Service response consistency: CV=${(consistencyResult.variance * 100).toFixed(1)}%, Avg=${consistencyResult.avgTime?.toFixed(2)}ms`);
    });
  });

  describe('6. Service Dependency Summary', () => {
    it('should provide comprehensive dependency status report', async () => {
      console.log('🔄 Generating comprehensive service dependency report...');
      
      const report: Array<{
        service: string;
        required: boolean;
        available: boolean;
        latency?: number;
        error?: string;
        operationsStatus: string;
      }> = [];

      for (const dependency of dependencies) {
        console.log(`\n📊 Testing ${dependency.name}:`);
        
        // Test availability
        const healthResult = await dependency.healthCheck();
        
        // Test operations
        let operationsStatus = 'PASS';
        try {
          for (const operation of dependency.criticalOperations) {
            await operation();
          }
        } catch (error) {
          operationsStatus = `FAIL: ${error}`;
        }

        const serviceReport = {
          service: dependency.name,
          required: dependency.required,
          available: healthResult.available,
          latency: healthResult.latency,
          error: healthResult.error,
          operationsStatus
        };

        report.push(serviceReport);

        const status = healthResult.available ? '✅ AVAILABLE' : '❌ UNAVAILABLE';
        const requirement = dependency.required ? 'CRITICAL' : 'OPTIONAL';
        const latencyInfo = healthResult.latency ? ` (${healthResult.latency.toFixed(2)}ms)` : '';
        
        console.log(`   Status: ${status} | ${requirement}${latencyInfo}`);
        console.log(`   Operations: ${operationsStatus}`);
        
        if (healthResult.error) {
          console.log(`   Error: ${healthResult.error}`);
        }
      }

      // Summary
      console.log('\n📋 Service Dependency Summary:');
      console.log('=====================================');
      
      const criticalServices = report.filter(r => r.required);
      const optionalServices = report.filter(r => !r.required);
      const availableCritical = criticalServices.filter(r => r.available).length;
      const availableOptional = optionalServices.filter(r => r.available).length;
      
      console.log(`Critical Services: ${availableCritical}/${criticalServices.length} available`);
      console.log(`Optional Services: ${availableOptional}/${optionalServices.length} available`);
      
      report.forEach(service => {
        const status = service.available ? '✅' : '❌';
        const type = service.required ? 'CRIT' : 'OPT';
        console.log(`${status} [${type}] ${service.service}`);
      });
      
      console.log('=====================================\n');

      // All critical services must be available
      const unavailableCritical = criticalServices.filter(r => !r.available);
      expect(unavailableCritical.length).toBe(0);
      
      // All operations must pass
      const failedOperations = report.filter(r => !r.operationsStatus.startsWith('PASS'));
      expect(failedOperations.length).toBe(0);
      
      console.log('🎉 All service dependencies validated successfully!');
    });
  });
});