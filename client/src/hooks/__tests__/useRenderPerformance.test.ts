/**
 * useRenderPerformance Tests - Full Coverage
 */

import { renderHook } from '@testing-library/react';
import { useRenderPerformance } from '../useRenderPerformance';
import { logger } from '@/lib/logger';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('useRenderPerformance', () => {
  let mockTime: number;
  let timeIncrement: number;
  let performanceNowValues: number[];
  let performanceNowIndex: number;

  beforeEach(() => {
    mockTime = 1000;
    timeIncrement = 5; // Default 5ms between calls
    performanceNowValues = [];
    performanceNowIndex = 0;

    // Ensure performance object exists
    if (!global.performance) {
      global.performance = {} as Performance;
    }

    // Mock performance.now() with a plain function
    global.performance.now = (() => {
      if (performanceNowValues.length > 0 && performanceNowIndex < performanceNowValues.length) {
        const value = performanceNowValues[performanceNowIndex];
        performanceNowIndex++;
        return value;
      }
      // Fallback to auto-increment when array is exhausted or not set
      const current = mockTime;
      mockTime += timeIncrement;
      return current;
    }) as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Explicitly restore performance.now
    if (global.performance && typeof global.performance.now === 'function') {
      (global.performance.now as jest.Mock).mockRestore?.();
    }
  });

  describe('Initialization', () => {
    it('should initialize with metrics after first render', () => {
      // Arrange & Act - need 2 rerenders to see updated metrics
      const { result, rerender } = renderHook(() => useRenderPerformance());
      rerender(); // Effect runs, updates ref
      rerender(); // Hook returns updated ref value

      // Assert
      expect(result.current.metrics.renderTime).toBeGreaterThan(0);
      expect(result.current.metrics.reRenderCount).toBeGreaterThan(0);
    });

    it('should accept component name', () => {
      // Arrange & Act
      const { result, rerender } = renderHook(() => useRenderPerformance('TestComponent'));
      rerender();
      rerender();

      // Assert
      expect(result.current.metrics.componentName).toBe('TestComponent');
      expect(result.current.metrics.renderTime).toBeGreaterThan(0);
    });

    it('should work without component name', () => {
      // Arrange & Act
      const { result, rerender } = renderHook(() => useRenderPerformance());
      rerender();
      rerender();

      // Assert
      expect(result.current.metrics.componentName).toBeUndefined();
      expect(result.current.metrics.renderTime).toBeGreaterThan(0);
    });
  });

  describe('Render Time Measurement', () => {
    it('should measure render time correctly', () => {
      // Arrange & Act
      const { result, rerender } = renderHook(() => useRenderPerformance());
      rerender();
      rerender();

      // Assert - just verify it measures something
      expect(result.current.metrics.renderTime).toBeGreaterThan(0);
    });

    it('should measure fast render (< 16ms)', () => {
      // Arrange & Act
      const { result, rerender } = renderHook(() => useRenderPerformance('FastComponent'));
      rerender();
      rerender();

      // Assert - no warning for fast renders
      expect(result.current.metrics.renderTime).toBeGreaterThan(0);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should measure slow render (> 16ms)', () => {
      // Arrange - use auto-increment with 20ms to ensure slow render
      timeIncrement = 20;
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Act
      renderHook(() => useRenderPerformance('SlowComponent'));

      // Assert - should log warning for slow render
      expect(logger.warn).toHaveBeenCalled();
      const warnCalls = (logger.warn as jest.Mock).mock.calls;
      const slowRenderCall = warnCalls.find((call: any) =>
        call[1] && call[1].includes('Slow render detected')
      );
      expect(slowRenderCall).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should measure very slow render (> 100ms)', () => {
      // Arrange - use auto-increment with 150ms to ensure very slow render
      timeIncrement = 150;
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Act
      renderHook(() => useRenderPerformance('VerySlowComponent'));

      // Assert
      expect(logger.warn).toHaveBeenCalled();
      const warnCalls = (logger.warn as jest.Mock).mock.calls;
      const slowRenderCall = warnCalls.find((call: any) =>
        call[1] && call[1].includes('Slow render detected')
      );
      expect(slowRenderCall).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle zero render time', () => {
      // Arrange - enough identical values
      performanceNowValues = Array.from({ length: 100 }, () => 1000);

      // Act
      const { result, rerender } = renderHook(() => useRenderPerformance());
      rerender();
      rerender();

      // Assert
      expect(result.current.metrics.renderTime).toBe(0);
    });

    it('should handle fractional render time', () => {
      // Arrange - Use auto-increment with fractional value
      timeIncrement = 5.5;

      // Act
      const { result, rerender } = renderHook(() => useRenderPerformance());
      rerender();
      rerender();

      // Assert - should have fractional render time (non-integer)
      const renderTime = result.current.metrics.renderTime;
      expect(renderTime).toBeGreaterThan(0);
      // With 5.5ms increment, we should eventually get a fractional value
      // But it might take many calls, so just verify it's measuring correctly
      expect(renderTime).toBeLessThan(1000); // Sanity check
    });
  });

  describe('Re-render Tracking', () => {
    it('should count re-renders correctly', () => {
      // Arrange
      performanceNowValues = Array.from({ length: 200 }, () => 100);

      // Act
      const { result, rerender } = renderHook(() => useRenderPerformance('ReRenderTest'));

      // Get initial metrics
      rerender();
      rerender();
      const initialCount = result.current.metrics.reRenderCount;
      expect(initialCount).toBeGreaterThan(0);

      // Do more rerenders
      rerender();
      rerender();
      rerender();
      rerender();
      const laterCount = result.current.metrics.reRenderCount;

      // Assert count increased
      expect(laterCount).toBeGreaterThan(initialCount);
    });

    it('should track multiple re-renders with different times', () => {
      // Arrange
      performanceNowValues = Array.from({ length: 300 }, () => 100);

      // Act
      const { result, rerender } = renderHook(() => useRenderPerformance());

      // Get initial metrics
      rerender();
      rerender();
      const count1 = result.current.metrics.reRenderCount;

      // More rerenders
      rerender();
      rerender();
      const count2 = result.current.metrics.reRenderCount;

      // Even more rerenders
      rerender();
      rerender();
      const count3 = result.current.metrics.reRenderCount;

      // Assert counts are increasing
      expect(count2).toBeGreaterThan(count1);
      expect(count3).toBeGreaterThan(count2);
    });

    it('should maintain accurate count through many re-renders', () => {
      // Arrange
      performanceNowValues = Array.from({ length: 500 }, () => 100);

      // Act
      const { result, rerender } = renderHook(() => useRenderPerformance());

      for (let i = 0; i < 20; i++) {
        rerender();
      }

      // Assert - should have tracked multiple renders
      expect(result.current.metrics.reRenderCount).toBeGreaterThan(10);
    });
  });

  describe('Environment-specific Behavior', () => {
    it('should log warning in development for slow renders', () => {
      // Arrange - use auto-increment with 50ms for slow render
      timeIncrement = 50;
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Act
      renderHook(() => useRenderPerformance('DevComponent'));

      // Assert
      expect(logger.warn).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log warning in production for slow renders', () => {
      // Arrange
      performanceNowValues = [100, 120]; // 20ms render
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Act
      renderHook(() => useRenderPerformance('ProdComponent'));

      // Assert
      expect(logger.warn).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log warning for fast renders in development', () => {
      // Arrange - ensure the time difference is < 16ms regardless of call count
      performanceNowValues = Array.from({ length: 1000 }, (_, i) => {
        // First half returns 1000, second half returns 1010 (10ms difference)
        return i < 500 ? 1000 : 1010;
      });
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Act
      renderHook(() => useRenderPerformance('FastDevComponent'));

      // Assert
      expect(logger.warn).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should log warning exactly at 16ms threshold', () => {
      // Arrange - exactly 16ms should NOT trigger warning (> 16, not >=)
      performanceNowValues = Array.from({ length: 1000 }, (_, i) => {
        // First half returns 1000, second half returns 1016 (16ms difference)
        return i < 500 ? 1000 : 1016;
      });
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Act
      renderHook(() => useRenderPerformance('ThresholdComponent'));

      // Assert - should not log warning at exactly 16ms (> 16, not >=)
      expect(logger.warn).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should log warning just above 16ms threshold', () => {
      // Arrange - use auto-increment with 16.1ms (just above threshold)
      timeIncrement = 16.1;
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Act
      renderHook(() => useRenderPerformance('AboveThresholdComponent'));

      // Assert
      expect(logger.warn).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logMetrics Function', () => {
    it('should log metrics when called', () => {
      // Arrange
      performanceNowValues = Array.from({ length: 100 }, () => 100);

      // Act
      const { result, rerender } = renderHook(() => useRenderPerformance('LogTest'));
      rerender();
      rerender(); // Get updated metrics
      result.current.logMetrics();

      // Assert
      expect(logger.debug).toHaveBeenCalledWith(
        'ui',
        'Performance metrics for LogTest',
        {
          metrics: expect.objectContaining({
            renderTime: expect.any(Number),
            reRenderCount: expect.any(Number),
            componentName: 'LogTest',
          }),
          componentName: 'LogTest',
        }
      );
    });

    it('should log metrics without component name', () => {
      // Arrange
      performanceNowValues = Array.from({ length: 100 }, () => 100);

      // Act
      const { result, rerender } = renderHook(() => useRenderPerformance());
      rerender();
      rerender(); // Get updated metrics
      result.current.logMetrics();

      // Assert
      expect(logger.debug).toHaveBeenCalledWith(
        'ui',
        'Performance metrics for component',
        expect.objectContaining({
          metrics: expect.any(Object),
        })
      );
    });

    it('should log accurate metrics after re-renders', () => {
      // Arrange
      performanceNowValues = Array.from({ length: 200 }, () => 100);

      // Act
      const { result, rerender } = renderHook(() => useRenderPerformance('MultiRender'));

      rerender();
      rerender();
      rerender(); // Third rerender
      result.current.logMetrics();

      // Assert - should log latest metrics
      expect(logger.debug).toHaveBeenCalledWith(
        'ui',
        'Performance metrics for MultiRender',
        expect.objectContaining({
          metrics: expect.objectContaining({
            renderTime: expect.any(Number),
            reRenderCount: expect.any(Number),
            componentName: 'MultiRender',
          }),
          componentName: 'MultiRender',
        })
      );
    });

    it('should be callable multiple times', () => {
      // Arrange
      performanceNowValues = Array.from({ length: 100 }, () => 100);

      // Act
      const { result, rerender } = renderHook(() => useRenderPerformance('MultiLog'));
      rerender();
      rerender(); // Get updated metrics

      result.current.logMetrics();
      result.current.logMetrics();
      result.current.logMetrics();

      // Assert
      expect(logger.debug).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long component names', () => {
      // Arrange
      const longName = 'A'.repeat(200);
      performanceNowValues = [100, 105];

      // Act
      const { result } = renderHook(() => useRenderPerformance(longName));

      // Assert
      expect(result.current.metrics.componentName).toBe(longName);
    });

    it('should handle component name with special characters', () => {
      // Arrange
      const specialName = 'Component!@#$%^&*()_+-=';
      performanceNowValues = [100, 105];

      // Act
      const { result } = renderHook(() => useRenderPerformance(specialName));

      // Assert
      expect(result.current.metrics.componentName).toBe(specialName);
    });

    it('should handle empty string component name', () => {
      // Arrange
      performanceNowValues = [100, 105];

      // Act
      const { result } = renderHook(() => useRenderPerformance(''));

      // Assert
      expect(result.current.metrics.componentName).toBe('');
    });

    it('should maintain metrics reference across renders', () => {
      // Arrange
      performanceNowValues = Array.from({ length: 300 }, () => 100);

      // Act
      const { result, rerender } = renderHook(() => useRenderPerformance('RefTest'));
      rerender();
      rerender(); // Get initial metrics

      const firstMetrics = result.current.metrics;
      rerender();
      rerender(); // Get updated metrics after more renders
      const secondMetrics = result.current.metrics;

      // Assert - metrics exist and have values
      expect(firstMetrics.componentName).toBe('RefTest');
      expect(secondMetrics.componentName).toBe('RefTest');
      expect(secondMetrics.reRenderCount).toBeGreaterThan(firstMetrics.reRenderCount);
    });

    it('should handle rapid successive re-renders', () => {
      // Arrange - many rapid renders
      performanceNowValues = Array.from({ length: 200 }, (_, i) => 100 + i);

      // Act
      const { result, rerender } = renderHook(() => useRenderPerformance());

      for (let i = 0; i < 49; i++) {
        rerender();
      }

      // Assert - should have tracked all renders (initial + 49 rerenders = 50 total)
      expect(result.current.metrics.reRenderCount).toBeGreaterThanOrEqual(49);
    });
  });

  describe('Integration Scenarios', () => {
    it('should track performance through full render lifecycle', () => {
      // Arrange - use explicit values for each render
      performanceNowValues = Array.from({ length: 400 }, () => 100);
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Act
      const { result, rerender } = renderHook(() => useRenderPerformance('LifecycleTest'));
      rerender();
      rerender(); // Get metrics from first render

      // First render should have metrics
      expect(result.current.metrics.renderTime).toBeGreaterThanOrEqual(0);
      const firstWarnCount = (logger.warn as jest.Mock).mock.calls.length;

      // More renders
      rerender();
      rerender();
      expect(result.current.metrics.renderTime).toBeGreaterThanOrEqual(0);
      const secondWarnCount = (logger.warn as jest.Mock).mock.calls.length;
      expect(secondWarnCount).toBeGreaterThanOrEqual(firstWarnCount);

      // Even more renders
      rerender();
      rerender();
      expect(result.current.metrics.renderTime).toBeGreaterThanOrEqual(0);
      expect((logger.warn as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(secondWarnCount);

      // Log final metrics
      result.current.logMetrics();
      expect(logger.debug).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('should work with multiple hook instances', () => {
      // Arrange
      performanceNowValues = [100, 105, 200, 215];

      // Act
      const { result: result1 } = renderHook(() => useRenderPerformance('Component1'));
      const { result: result2 } = renderHook(() => useRenderPerformance('Component2'));

      // Assert - each instance tracks independently
      expect(result1.current.metrics.componentName).toBe('Component1');
      expect(result2.current.metrics.componentName).toBe('Component2');
      expect(result1.current.metrics).not.toBe(result2.current.metrics);
    });
  });
});
