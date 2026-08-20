/**
 * ⚡ PERFORMANCE TESTING FRAMEWORK
 * Comprehensive performance validation and benchmarking
 */

import { TestDataBuilder } from '../test-utilities/advanced-test-builders';

export interface PerformanceThresholds {
  maxExecutionTime: number; // milliseconds
  maxMemoryUsage: number;    // bytes
  maxCPUUsage?: number;      // percentage (if available)
  minThroughput?: number;    // operations per second
}

export interface PerformanceResult {
  executionTime: number;
  memoryUsage: {
    initial: number;
    peak: number;
    final: number;
    increase: number;
  };
  throughput?: number;
  success: boolean;
  errors: string[];
}

export class PerformanceTester {
  private static instance: PerformanceTester;
  private measurements: Map<string, PerformanceResult[]> = new Map();

  static getInstance(): PerformanceTester {
    if (!PerformanceTester.instance) {
      PerformanceTester.instance = new PerformanceTester();
    }
    return PerformanceTester.instance;
  }

  /**
   * Measure execution performance of a function
   */
  async measurePerformance<T>(
    testName: string,
    fn: () => Promise<T> | T,
    thresholds: PerformanceThresholds
  ): Promise<PerformanceResult> {
    const errors: string[] = [];
    let success = true;

    // Initial memory measurement
    const initialMemory = this.getMemoryUsage();
    let peakMemory = initialMemory;
    let finalMemory = initialMemory;

    // Start performance measurement
    const startTime = performance.now();
    
    try {
      // Monitor memory during execution
      const memoryMonitor = setInterval(() => {
        const currentMemory = this.getMemoryUsage();
        if (currentMemory > peakMemory) {
          peakMemory = currentMemory;
        }
      }, 10);

      // Execute the function
      await fn();

      // Stop monitoring
      clearInterval(memoryMonitor);
      
      // Final measurements
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      finalMemory = this.getMemoryUsage();

      // Validate thresholds
      if (executionTime > thresholds.maxExecutionTime) {
        success = false;
        errors.push(`Execution time ${executionTime}ms exceeds threshold ${thresholds.maxExecutionTime}ms`);
      }

      const memoryIncrease = peakMemory - initialMemory;
      if (memoryIncrease > thresholds.maxMemoryUsage) {
        success = false;
        errors.push(`Memory usage increase ${memoryIncrease} bytes exceeds threshold ${thresholds.maxMemoryUsage} bytes`);
      }

      const result: PerformanceResult = {
        executionTime,
        memoryUsage: {
          initial: initialMemory,
          peak: peakMemory,
          final: finalMemory,
          increase: memoryIncrease
        },
        success,
        errors
      };

      // Store result
      if (!this.measurements.has(testName)) {
        this.measurements.set(testName, []);
      }
      this.measurements.get(testName)!.push(result);

      return result;

    } catch (error) {
      success = false;
      errors.push(`Execution failed: ${error.message}`);
      
      const executionTime = performance.now() - startTime;
      finalMemory = this.getMemoryUsage();

      return {
        executionTime,
        memoryUsage: {
          initial: initialMemory,
          peak: peakMemory,
          final: finalMemory,
          increase: finalMemory - initialMemory
        },
        success: false,
        errors
      };
    }
  }

  /**
   * Measure throughput for repetitive operations
   */
  async measureThroughput<T>(
    testName: string,
    fn: () => Promise<T> | T,
    iterations: number,
    thresholds: PerformanceThresholds
  ): Promise<PerformanceResult> {
    const startTime = performance.now();
    const initialMemory = this.getMemoryUsage();
    let peakMemory = initialMemory;
    const errors: string[] = [];
    let successCount = 0;

    // Monitor memory during execution
    const memoryMonitor = setInterval(() => {
      const currentMemory = this.getMemoryUsage();
      if (currentMemory > peakMemory) {
        peakMemory = currentMemory;
      }
    }, 50);

    // Execute iterations
    for (let i = 0; i < iterations; i++) {
      try {
        await fn();
        successCount++;
      } catch (error) {
        errors.push(`Iteration ${i + 1} failed: ${error.message}`);
      }
    }

    clearInterval(memoryMonitor);

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const throughput = (successCount / totalTime) * 1000; // operations per second
    const finalMemory = this.getMemoryUsage();

    // Validate thresholds
    let success = true;
    
    if (totalTime > thresholds.maxExecutionTime) {
      success = false;
      errors.push(`Total execution time ${totalTime}ms exceeds threshold ${thresholds.maxExecutionTime}ms`);
    }

    if (thresholds.minThroughput && throughput < thresholds.minThroughput) {
      success = false;
      errors.push(`Throughput ${throughput} ops/sec below threshold ${thresholds.minThroughput} ops/sec`);
    }

    const result: PerformanceResult = {
      executionTime: totalTime,
      memoryUsage: {
        initial: initialMemory,
        peak: peakMemory,
        final: finalMemory,
        increase: peakMemory - initialMemory
      },
      throughput,
      success: success && errors.length === 0,
      errors
    };

    // Store result
    if (!this.measurements.has(testName)) {
      this.measurements.set(testName, []);
    }
    this.measurements.get(testName)!.push(result);

    return result;
  }

  /**
   * Stress test with concurrent operations
   */
  async measureConcurrentPerformance<T>(
    testName: string,
    fn: () => Promise<T> | T,
    concurrency: number,
    thresholds: PerformanceThresholds
  ): Promise<PerformanceResult> {
    const startTime = performance.now();
    const initialMemory = this.getMemoryUsage();
    let peakMemory = initialMemory;
    const errors: string[] = [];

    // Monitor memory during execution
    const memoryMonitor = setInterval(() => {
      const currentMemory = this.getMemoryUsage();
      if (currentMemory > peakMemory) {
        peakMemory = currentMemory;
      }
    }, 25);

    try {
      // Create concurrent operations
      const promises = Array(concurrency).fill(null).map(async (_, index) => {
        try {
          return await fn();
        } catch (error) {
          errors.push(`Concurrent operation ${index + 1} failed: ${error.message}`);
          throw error;
        }
      });

      // Execute all concurrent operations
      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;

      clearInterval(memoryMonitor);

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const throughput = (successCount / totalTime) * 1000;
      const finalMemory = this.getMemoryUsage();

      // Validate thresholds
      let success = true;

      if (totalTime > thresholds.maxExecutionTime) {
        success = false;
        errors.push(`Concurrent execution time ${totalTime}ms exceeds threshold ${thresholds.maxExecutionTime}ms`);
      }

      const memoryIncrease = peakMemory - initialMemory;
      if (memoryIncrease > thresholds.maxMemoryUsage) {
        success = false;
        errors.push(`Memory usage increase ${memoryIncrease} bytes exceeds threshold ${thresholds.maxMemoryUsage} bytes`);
      }

      const result: PerformanceResult = {
        executionTime: totalTime,
        memoryUsage: {
          initial: initialMemory,
          peak: peakMemory,
          final: finalMemory,
          increase: memoryIncrease
        },
        throughput,
        success: success && (successCount / concurrency) >= 0.95, // 95% success rate required
        errors
      };

      // Store result
      if (!this.measurements.has(testName)) {
        this.measurements.set(testName, []);
      }
      this.measurements.get(testName)!.push(result);

      return result;

    } catch (error) {
      clearInterval(memoryMonitor);
      errors.push(`Concurrent test failed: ${error.message}`);
      
      return {
        executionTime: performance.now() - startTime,
        memoryUsage: {
          initial: initialMemory,
          peak: peakMemory,
          final: this.getMemoryUsage(),
          increase: peakMemory - initialMemory
        },
        success: false,
        errors
      };
    }
  }

  /**
   * Memory leak detection
   */
  async detectMemoryLeaks<T>(
    testName: string,
    fn: () => Promise<T> | T,
    iterations: number = 100
  ): Promise<{ hasLeak: boolean; memoryGrowth: number; measurements: number[] }> {
    const measurements: number[] = [];
    
    // Force initial garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const baseline = this.getMemoryUsage();
    measurements.push(baseline);

    // Run multiple iterations to detect memory growth
    for (let i = 0; i < iterations; i++) {
      await fn();
      
      // Periodic garbage collection attempts
      if (i % 10 === 0 && global.gc) {
        global.gc();
      }
      
      const currentMemory = this.getMemoryUsage();
      measurements.push(currentMemory);
    }

    // Final cleanup attempt
    if (global.gc) {
      global.gc();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const finalMemory = this.getMemoryUsage();
    measurements.push(finalMemory);

    // Analyze memory growth trend
    const memoryGrowth = finalMemory - baseline;
    const averageGrowthPerIteration = memoryGrowth / iterations;
    
    // Consider it a leak if memory grows consistently by more than 1KB per iteration
    const hasLeak = averageGrowthPerIteration > 1024;

    return {
      hasLeak,
      memoryGrowth,
      measurements
    };
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    
    // Fallback for browser environments
    if (typeof performance !== 'undefined' && performance.memory) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    
    return 0;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    let report = '\n📊 PERFORMANCE TEST REPORT\n';
    report += '='.repeat(50) + '\n\n';

    for (const [testName, results] of this.measurements.entries()) {
      report += `📋 Test: ${testName}\n`;
      report += `-`.repeat(30) + '\n';
      
      const successRate = (results.filter(r => r.success).length / results.length) * 100;
      const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
      const avgMemoryIncrease = results.reduce((sum, r) => sum + r.memoryUsage.increase, 0) / results.length;
      const avgThroughput = results
        .filter(r => r.throughput)
        .reduce((sum, r) => sum + r.throughput!, 0) / results.filter(r => r.throughput).length || 0;

      report += `✅ Success Rate: ${successRate.toFixed(1)}%\n`;
      report += `⏱️  Avg Execution Time: ${avgExecutionTime.toFixed(2)}ms\n`;
      report += `🧠 Avg Memory Increase: ${this.formatBytes(avgMemoryIncrease)}\n`;
      
      if (avgThroughput > 0) {
        report += `🚀 Avg Throughput: ${avgThroughput.toFixed(2)} ops/sec\n`;
      }

      const failedResults = results.filter(r => !r.success);
      if (failedResults.length > 0) {
        report += `❌ Failed Tests: ${failedResults.length}\n`;
        const allErrors = failedResults.flatMap(r => r.errors);
        const uniqueErrors = [...new Set(allErrors)];
        uniqueErrors.forEach(error => {
          report += `   • ${error}\n`;
        });
      }

      report += '\n';
    }

    return report;
  }

  /**
   * Clear all measurements
   */
  clearMeasurements(): void {
    this.measurements.clear();
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * Performance test utilities for Jest
 */
export class PerformanceTestUtils {
  /**
   * Jest matcher for performance expectations
   */
  static expectPerformance(result: PerformanceResult) {
    return {
      toMeetThresholds: () => {
        if (!result.success) {
          throw new Error(`Performance test failed:\n${result.errors.join('\n')}`);
        }
        return { pass: true, message: () => 'Performance test passed' };
      },
      
      toExecuteUnder: (maxTime: number) => {
        const pass = result.executionTime <= maxTime;
        return {
          pass,
          message: () => pass 
            ? `Execution time ${result.executionTime}ms is under ${maxTime}ms`
            : `Expected execution time to be under ${maxTime}ms, but was ${result.executionTime}ms`
        };
      },
      
      toUseMemoryUnder: (maxMemory: number) => {
        const pass = result.memoryUsage.increase <= maxMemory;
        return {
          pass,
          message: () => pass
            ? `Memory usage increase ${result.memoryUsage.increase} bytes is under ${maxMemory} bytes`
            : `Expected memory usage to be under ${maxMemory} bytes, but increased by ${result.memoryUsage.increase} bytes`
        };
      }
    };
  }

  /**
   * Create performance test suite
   */
  static createTestSuite(suiteName: string) {
    const tester = PerformanceTester.getInstance();
    
    return {
      /**
       * Test execution performance
       */
      testExecution: async <T>(
        testName: string,
        fn: () => Promise<T> | T,
        thresholds: PerformanceThresholds
      ) => {
        const result = await tester.measurePerformance(
          `${suiteName}.${testName}`,
          fn,
          thresholds
        );
        
        expect(result.success).toBe(true);
        if (!result.success) {
          console.error('Performance test failed:', result.errors);
        }
        
        return result;
      },

      /**
       * Test throughput performance
       */
      testThroughput: async <T>(
        testName: string,
        fn: () => Promise<T> | T,
        iterations: number,
        thresholds: PerformanceThresholds
      ) => {
        const result = await tester.measureThroughput(
          `${suiteName}.${testName}`,
          fn,
          iterations,
          thresholds
        );
        
        expect(result.success).toBe(true);
        return result;
      },

      /**
       * Test concurrent performance
       */
      testConcurrency: async <T>(
        testName: string,
        fn: () => Promise<T> | T,
        concurrency: number,
        thresholds: PerformanceThresholds
      ) => {
        const result = await tester.measureConcurrentPerformance(
          `${suiteName}.${testName}`,
          fn,
          concurrency,
          thresholds
        );
        
        expect(result.success).toBe(true);
        return result;
      },

      /**
       * Test for memory leaks
       */
      testMemoryLeaks: async <T>(
        testName: string,
        fn: () => Promise<T> | T,
        iterations: number = 100
      ) => {
        const result = await tester.detectMemoryLeaks(
          `${suiteName}.${testName}`,
          fn,
          iterations
        );
        
        expect(result.hasLeak).toBe(false);
        if (result.hasLeak) {
          console.warn(`Memory leak detected in ${testName}:`, {
            memoryGrowth: result.memoryGrowth,
            averageGrowthPerIteration: result.memoryGrowth / iterations
          });
        }
        
        return result;
      }
    };
  }
}

/**
 * Common performance thresholds for different operation types
 */
export const PERFORMANCE_THRESHOLDS = {
  FAST_OPERATION: {
    maxExecutionTime: 10, // 10ms
    maxMemoryUsage: 1024 * 1024 // 1MB
  },
  
  MEDIUM_OPERATION: {
    maxExecutionTime: 100, // 100ms
    maxMemoryUsage: 5 * 1024 * 1024 // 5MB
  },
  
  SLOW_OPERATION: {
    maxExecutionTime: 1000, // 1s
    maxMemoryUsage: 10 * 1024 * 1024 // 10MB
  },
  
  API_REQUEST: {
    maxExecutionTime: 5000, // 5s
    maxMemoryUsage: 2 * 1024 * 1024, // 2MB
    minThroughput: 10 // 10 requests/sec
  },
  
  DATABASE_OPERATION: {
    maxExecutionTime: 2000, // 2s
    maxMemoryUsage: 5 * 1024 * 1024 // 5MB
  },
  
  FILE_PROCESSING: {
    maxExecutionTime: 10000, // 10s
    maxMemoryUsage: 50 * 1024 * 1024 // 50MB
  },
  
  CONCURRENT_OPERATIONS: {
    maxExecutionTime: 3000, // 3s for 100 concurrent ops
    maxMemoryUsage: 20 * 1024 * 1024 // 20MB
  }
};

export default PerformanceTester;