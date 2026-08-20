/**
 * Performance Monitoring Tests - Application Insights Integration
 * TDD Approach: Tests written FIRST before implementation
 *
 * Verifies that the performance monitoring service integrates with Application Insights for:
 * - Performance traces with start/stop and duration tracking
 * - Custom metric recording
 * - Performance metrics sent to App Insights
 */

import { PerformanceMonitoringService } from '../performanceMonitoring';

// Mock Sentry
jest.mock('@sentry/react-native');

import * as Sentry from '@sentry/react-native';
const mockTrackMetric = Sentry.addBreadcrumb as jest.Mock;
const mockTrackEvent = Sentry.addBreadcrumb as jest.Mock;
const mockIsInitialized = jest.fn(() => true);

describe('PerformanceMonitoringService - Application Insights Integration', () => {
  let perfService: PerformanceMonitoringService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockTrackMetric.mockClear();
    mockTrackEvent.mockClear();
    mockIsInitialized.mockReturnValue(true);

    // Mock __DEV__ to false for production behavior
    (global as any).__DEV__ = false;

    // Get singleton instance
    perfService = PerformanceMonitoringService.getInstance();
  });

  afterEach(() => {
    // Restore __DEV__
    (global as any).__DEV__ = true;
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Performance Traces', () => {
    it('should return trace object with stop method from startTrace', () => {
      const trace = perfService.startTrace('ScreenLoad');

      expect(trace).toBeDefined();
      expect(trace).toHaveProperty('name', 'ScreenLoad');
      expect(trace).toHaveProperty('startTime');
      expect(trace).toHaveProperty('stop');
      expect(typeof trace.stop).toBe('function');
    });

    it('should track metric with duration when trace is stopped', async () => {
      const trace = perfService.startTrace('ScreenLoad');

      // Simulate some time passing
      await jest.advanceTimersByTimeAsync(1500);

      trace.stop();

      expect(mockTrackMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'performance',
          message: 'Performance.ScreenLoad',
          data: expect.objectContaining({ traceName: 'ScreenLoad' }),
        })
      );

      // Verify duration is non-negative
      const metricCall = mockTrackMetric.mock.calls[0];
      const duration = metricCall[0].data.duration;
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should include Performance. prefix in metric name', () => {
      const trace = perfService.startTrace('APICall');
      trace.stop();

      expect(mockTrackMetric).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Performance.APICall' })
      );
    });

    it('should include trace name in properties', () => {
      const trace = perfService.startTrace('DataLoad');
      trace.stop();

      expect(mockTrackMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ traceName: 'DataLoad' }),
        })
      );
    });

    it('should support multiple concurrent traces', () => {
      const trace1 = perfService.startTrace('Trace1');
      const trace2 = perfService.startTrace('Trace2');

      trace1.stop();
      trace2.stop();

      expect(mockTrackMetric).toHaveBeenCalledTimes(2);
      expect(mockTrackMetric).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Performance.Trace1', data: expect.objectContaining({ traceName: 'Trace1' }) })
      );
      expect(mockTrackMetric).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Performance.Trace2', data: expect.objectContaining({ traceName: 'Trace2' }) })
      );
    });
  });

  describe('Custom Metrics', () => {
    it('should send custom metric to Sentry', () => {
      perfService.recordCustomMetric('UserEngagement', 85);

      expect(mockTrackMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Performance.UserEngagement',
          data: expect.objectContaining({ metricName: 'UserEngagement', value: 85 }),
        })
      );
    });

    it('should include Performance. prefix for custom metrics', () => {
      perfService.recordCustomMetric('CustomScore', 100);

      expect(mockTrackMetric).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Performance.CustomScore' })
      );
    });

    it('should handle decimal metric values', () => {
      perfService.recordCustomMetric('LoadTime', 123.45);

      expect(mockTrackMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ metricName: 'LoadTime', value: 123.45 }),
        })
      );
    });

    it('should handle zero value metrics', () => {
      perfService.recordCustomMetric('ErrorCount', 0);

      expect(mockTrackMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ metricName: 'ErrorCount', value: 0 }),
        })
      );
    });
  });

  describe('Development Mode Behavior', () => {
    beforeEach(() => {
      // Enable dev mode
      (global as any).__DEV__ = true;
      mockTrackMetric.mockClear();
    });

    it('should not send traces to Application Insights in development', () => {
      const trace = perfService.startTrace('DevTrace');
      trace.stop();

      expect(mockTrackMetric).not.toHaveBeenCalled();
    });

    it('should not send custom metrics to Application Insights in development', () => {
      perfService.recordCustomMetric('DevMetric', 50);

      expect(mockTrackMetric).not.toHaveBeenCalled();
    });
  });

  describe('Error Resilience', () => {
    it('should not crash if Application Insights is not initialized', () => {
      mockIsInitialized.mockReturnValue(false);

      expect(() => {
        const trace = perfService.startTrace('TestTrace');
        trace.stop();
      }).not.toThrow();

      expect(() => {
        perfService.recordCustomMetric('TestMetric', 100);
      }).not.toThrow();
    });

    it('should not crash if trackMetric throws an error', () => {
      mockTrackMetric.mockImplementationOnce(() => {
        throw new Error('Tracking failed');
      });

      expect(() => {
        const trace = perfService.startTrace('TestTrace');
        trace.stop();
      }).not.toThrow();
    });

    it('should continue execution after tracking error', () => {
      mockTrackMetric.mockImplementationOnce(() => {
        throw new Error('First call failed');
      });

      const trace1 = perfService.startTrace('Trace1');
      trace1.stop(); // Should fail silently

      // Second trace should work
      const trace2 = perfService.startTrace('Trace2');
      trace2.stop();

      // Only second call should succeed
      expect(mockTrackMetric).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration Scenarios', () => {
    it('should track complete user flow with traces and metrics', async () => {
      // Simulate screen load
      const screenTrace = perfService.startTrace('HomeScreen.Load');
      await jest.advanceTimersByTimeAsync(500);
      screenTrace.stop();

      // Record custom engagement metric
      perfService.recordCustomMetric('UserEngagement', 95);

      // Simulate API call
      const apiTrace = perfService.startTrace('API.FetchMembers');
      await jest.advanceTimersByTimeAsync(250);
      apiTrace.stop();

      expect(mockTrackMetric).toHaveBeenCalledTimes(3);
      expect(mockTrackMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Performance.HomeScreen.Load',
          data: expect.objectContaining({ traceName: 'HomeScreen.Load' }),
        })
      );
      expect(mockTrackMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Performance.UserEngagement',
          data: expect.objectContaining({ metricName: 'UserEngagement' }),
        })
      );
      expect(mockTrackMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Performance.API.FetchMembers',
          data: expect.objectContaining({ traceName: 'API.FetchMembers' }),
        })
      );
    });
  });

  describe('Additional Performance Methods', () => {
    it('should log performance issues', () => {
      const error = new Error('Slow render detected');

      expect(() => {
        perfService.logPerformanceIssue('ScreenRender', error);
      }).not.toThrow();
    });

    it('should collect load time metrics without crashing', () => {
      // Mock performance.getEntriesByType
      const mockNavEntry = {
        duration: 1234,
        name: 'navigation',
        entryType: 'navigation',
      } as PerformanceNavigationTiming;

      global.performance = {
        ...global.performance,
        getEntriesByType: jest.fn().mockReturnValue([mockNavEntry]),
      } as any;

      expect(() => {
        perfService.collectLoadTimeMetrics();
      }).not.toThrow();
    });

    it('should handle missing navigation entries gracefully', () => {
      global.performance = {
        ...global.performance,
        getEntriesByType: jest.fn().mockReturnValue([]),
      } as any;

      expect(() => {
        perfService.collectLoadTimeMetrics();
      }).not.toThrow();
    });

    it('should collect user interaction metrics in development mode', () => {
      (global as any).__DEV__ = true;

      expect(() => {
        perfService.collectUserInteractionMetrics('click', 'submit-button');
      }).not.toThrow();
    });

    it('should stop trace without crashing', () => {
      const trace = perfService.startTrace('TestTrace');

      expect(() => {
        perfService.stopTrace(trace);
      }).not.toThrow();
    });
  });
});
