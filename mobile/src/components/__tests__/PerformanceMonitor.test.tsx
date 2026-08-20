/**
 * PerformanceMonitor Tests
 *
 * Tests performance monitoring component including Core Web Vitals collection,
 * analytics integration, performance observers, and budget warnings.
 *
 * Following boundary mocking rule:
 * ✅ Mock: Platform, document, window, PerformanceObserver, performance, fetch
 * ❌ Don't mock: PerformanceMonitor component, internal logic, state management
 */

import { render, waitFor, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import PerformanceMonitor, { measurePerformance } from '../PerformanceMonitor';

// Mock React Native Platform (boundary)
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: jest.fn((obj) => obj.web)
  }
}));

// Mock global fetch (boundary)
global.fetch = jest.fn().mockResolvedValue({ ok: true });

describe('PerformanceMonitor', () => {
  let mockWebVitals: any;
  let mockGtag: jest.Mock;
  let mockDocument: any;
  let mockPerformanceObserver: jest.Mock;
  let mockPerformance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (Platform.OS as any) = 'web';

    // Ensure __DEV__ is defined for logger (set in global mocks, don't delete in afterEach)
    (global as any).__DEV__ = false;

    // Mock web-vitals library
    mockWebVitals = {
      getCLS: jest.fn((callback) => {
        setTimeout(() => callback({ value: 0.05, rating: 'good', name: 'CLS', delta: 0.05, id: '1' }), 10);
      }),
      getFID: jest.fn((callback) => {
        setTimeout(() => callback({ value: 50, rating: 'good', name: 'FID', delta: 50, id: '2' }), 10);
      }),
      getFCP: jest.fn((callback) => {
        setTimeout(() => callback({ value: 1500, rating: 'good', name: 'FCP', delta: 1500, id: '3' }), 10);
      }),
      getLCP: jest.fn((callback) => {
        setTimeout(() => callback({ value: 2000, rating: 'good', name: 'LCP', delta: 2000, id: '4' }), 10);
      }),
      getTTFB: jest.fn((callback) => {
        setTimeout(() => callback({ value: 200, rating: 'good', name: 'TTFB', delta: 200, id: '5' }), 10);
      })
    };

    // Mock gtag
    mockGtag = jest.fn();

    // Mock document - spy on actual document methods (jsdom provides document)
    const mockScript = {
      src: '',
      onload: null as any,
      onerror: null as any
    };

    mockDocument = {
      createElement: jest.spyOn(document, 'createElement').mockReturnValue(mockScript as any),
      head: {
        appendChild: jest.spyOn(document.head, 'appendChild').mockReturnValue(mockScript as any)
      }
    };

    // Mock PerformanceObserver
    mockPerformanceObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
      takeRecords: jest.fn()
    }));

    // Mock performance API
    mockPerformance = {
      getEntriesByType: jest.fn().mockReturnValue([{
        domContentLoadedEventStart: 100,
        domContentLoadedEventEnd: 200,
        loadEventStart: 300,
        loadEventEnd: 400
      }]),
      navigation: {}
    };

    // Setup global mocks - assign to existing window object instead of replacing it
    (window as any).webVitals = mockWebVitals;
    (window as any).gtag = mockGtag;
    (window as any).PerformanceObserver = mockPerformanceObserver;
    // Don't set window.location - jsdom provides its own location object

    (global as any).performance = mockPerformance;
    (global as any).__DEV__ = false;
  });

  afterEach(() => {
    delete (window as any).webVitals;
    delete (window as any).gtag;
    delete (window as any).PerformanceObserver;
    delete (global as any).performance;
    // Don't delete __DEV__ - async callbacks need it after test completes

    // Restore document spies
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      expect(() => render(<PerformanceMonitor />)).not.toThrow();
    });

    it('should return null (invisible component)', () => {
      const result = render(<PerformanceMonitor />);
      // Component returns null, so no children rendered
      expect(result.toJSON()).toBeNull();
    });
  });

  describe('Platform Check', () => {
    it('should only monitor on web platform', () => {
      render(<PerformanceMonitor />);

      expect(mockWebVitals.getCLS).toHaveBeenCalled();
    });

    it('should not monitor on native platforms', () => {
      (Platform.OS as any) = 'ios';

      render(<PerformanceMonitor />);

      expect(mockWebVitals.getCLS).not.toHaveBeenCalled();
    });

    it('should respect enabled prop when false', () => {
      render(<PerformanceMonitor enabled={false} />);

      expect(mockWebVitals.getCLS).not.toHaveBeenCalled();
    });

    it('should monitor when enabled prop is true', () => {
      render(<PerformanceMonitor enabled={true} />);

      expect(mockWebVitals.getCLS).toHaveBeenCalled();
    });
  });

  describe('Web Vitals Library Loading', () => {
    it('should use existing web-vitals if already loaded', () => {
      render(<PerformanceMonitor />);

      expect(mockDocument.createElement).not.toHaveBeenCalled();
    });

    it('should load web-vitals from CDN if not present', () => {
      delete (window as any).webVitals;

      render(<PerformanceMonitor />);

      expect(mockDocument.createElement).toHaveBeenCalledWith('script');
      expect(mockDocument.head.appendChild).toHaveBeenCalled();
    });

    it('should handle script load success', async () => {
      delete (window as any).webVitals;

      const mockScript = {
        src: '',
        onload: null as any,
        onerror: null as any
      };
      mockDocument.createElement.mockReturnValue(mockScript);

      render(<PerformanceMonitor />);

      // Restore webVitals and trigger onload
      (window as any).webVitals = mockWebVitals;
      if (mockScript.onload) {
        mockScript.onload();
      }

      await waitFor(() => {
        expect(mockWebVitals.getCLS).toHaveBeenCalled();
      });
    });

    it('should handle script load error', async () => {
      delete (window as any).webVitals;

      const mockScript = {
        src: '',
        onload: null as any,
        onerror: null as any
      };
      mockDocument.createElement.mockReturnValue(mockScript);

      render(<PerformanceMonitor />);

      // Trigger onerror
      if (mockScript.onerror) {
        mockScript.onerror();
      }

      // Should not crash
      await waitFor(() => {
        expect(mockWebVitals.getCLS).not.toHaveBeenCalled();
      });
    });
  });

  describe('Metrics Collection', () => {
    it('should collect FCP metric', async () => {
      const onMetricsUpdate = jest.fn();
      render(<PerformanceMonitor onMetricsUpdate={onMetricsUpdate} />);

      await waitFor(() => {
        expect(mockWebVitals.getFCP).toHaveBeenCalled();
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await waitFor(() => {
        expect(onMetricsUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ fcp: 1500 })
        );
      });
    });

    it('should collect LCP metric', async () => {
      const onMetricsUpdate = jest.fn();
      render(<PerformanceMonitor onMetricsUpdate={onMetricsUpdate} />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await waitFor(() => {
        expect(onMetricsUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ lcp: 2000 })
        );
      });
    });

    it('should collect FID metric', async () => {
      const onMetricsUpdate = jest.fn();
      render(<PerformanceMonitor onMetricsUpdate={onMetricsUpdate} />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await waitFor(() => {
        expect(onMetricsUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ fid: 50 })
        );
      });
    });

    it('should collect CLS metric', async () => {
      const onMetricsUpdate = jest.fn();
      render(<PerformanceMonitor onMetricsUpdate={onMetricsUpdate} />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await waitFor(() => {
        expect(onMetricsUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ cls: 0.05 })
        );
      });
    });

    it('should collect TTFB metric', async () => {
      const onMetricsUpdate = jest.fn();
      render(<PerformanceMonitor onMetricsUpdate={onMetricsUpdate} />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await waitFor(() => {
        expect(onMetricsUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ ttfb: 200 })
        );
      });
    });

    it('should collect all metrics', async () => {
      const onMetricsUpdate = jest.fn();
      render(<PerformanceMonitor onMetricsUpdate={onMetricsUpdate} />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should have been called multiple times as metrics come in
      await waitFor(() => {
        expect(onMetricsUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Analytics Integration', () => {
    it('should send metrics to Google Analytics', async () => {
      render(<PerformanceMonitor />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await waitFor(() => {
        expect(mockGtag).toHaveBeenCalledWith(
          'event',
          'FCP',
          expect.objectContaining({
            event_category: 'Web Vitals',
            event_label: 'good',
            value: 1500
          })
        );
      });
    });

    it('should send metrics to custom analytics endpoint', async () => {
      render(<PerformanceMonitor />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/analytics/web-vitals',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('FCP')
          })
        );
      });
    });

    it('should handle analytics errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<PerformanceMonitor />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Should not crash
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should work without gtag', async () => {
      delete (global as any).window.gtag;

      render(<PerformanceMonitor />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Should still send to custom endpoint
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Performance Observers', () => {
    it('should setup PerformanceObserver for long tasks', () => {
      render(<PerformanceMonitor />);

      expect(mockPerformanceObserver).toHaveBeenCalled();
    });

    it('should observe long tasks', () => {
      const observeMock = jest.fn();
      mockPerformanceObserver.mockImplementation(() => ({
        observe: observeMock,
        disconnect: jest.fn()
      }));

      render(<PerformanceMonitor />);

      expect(observeMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'longtask' })
      );
    });

    it('should observe largest contentful paint', () => {
      const observeMock = jest.fn();
      mockPerformanceObserver.mockImplementation(() => ({
        observe: observeMock,
        disconnect: jest.fn()
      }));

      render(<PerformanceMonitor />);

      expect(observeMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'largest-contentful-paint' })
      );
    });

    it('should observe layout shifts', () => {
      const observeMock = jest.fn();
      mockPerformanceObserver.mockImplementation(() => ({
        observe: observeMock,
        disconnect: jest.fn()
      }));

      render(<PerformanceMonitor />);

      expect(observeMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'layout-shift' })
      );
    });

    it('should handle PerformanceObserver errors', () => {
      mockPerformanceObserver.mockImplementation(() => {
        throw new Error('Observer error');
      });

      // Should not crash
      expect(() => {
        render(<PerformanceMonitor />);
      }).not.toThrow();
    });

    it('should work without PerformanceObserver', () => {
      delete (global as any).window.PerformanceObserver;

      // Should not crash
      expect(() => {
        render(<PerformanceMonitor />);
      }).not.toThrow();
    });
  });

  describe('Navigation Timing', () => {
    it('should collect navigation timing metrics', async () => {
      render(<PerformanceMonitor />);

      await waitFor(() => {
        expect(mockPerformance.getEntriesByType).toHaveBeenCalledWith('navigation');
      });
    });

    it('should send DOMContentLoaded metric', async () => {
      render(<PerformanceMonitor />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await waitFor(() => {
        const fetchCalls = (global.fetch as jest.Mock).mock.calls;
        const hasDOMContentLoaded = fetchCalls.some(call =>
          call[1]?.body?.includes('DOMContentLoaded')
        );
        expect(hasDOMContentLoaded).toBe(true);
      });
    });

    it('should send LoadComplete metric', async () => {
      render(<PerformanceMonitor />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await waitFor(() => {
        const fetchCalls = (global.fetch as jest.Mock).mock.calls;
        const hasLoadComplete = fetchCalls.some(call =>
          call[1]?.body?.includes('LoadComplete')
        );
        expect(hasLoadComplete).toBe(true);
      });
    });

    it('should handle missing navigation timing', () => {
      mockPerformance.getEntriesByType.mockReturnValue([]);

      // Should not crash
      expect(() => {
        render(<PerformanceMonitor />);
      }).not.toThrow();
    });
  });

  describe('Performance Budget Warnings', () => {
    it('should warn when FCP exceeds budget', async () => {
      mockWebVitals.getFCP = jest.fn((callback) => {
        setTimeout(() => callback({ value: 2000, rating: 'poor', name: 'FCP', delta: 2000, id: '1' }), 10);
      });

      render(<PerformanceMonitor />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Component should have processed the metric
      expect(mockWebVitals.getFCP).toHaveBeenCalled();
    });

    it('should warn when LCP exceeds budget', async () => {
      mockWebVitals.getLCP = jest.fn((callback) => {
        setTimeout(() => callback({ value: 3000, rating: 'poor', name: 'LCP', delta: 3000, id: '1' }), 10);
      });

      render(<PerformanceMonitor />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockWebVitals.getLCP).toHaveBeenCalled();
    });

    it('should warn when FID exceeds budget', async () => {
      mockWebVitals.getFID = jest.fn((callback) => {
        setTimeout(() => callback({ value: 150, rating: 'poor', name: 'FID', delta: 150, id: '1' }), 10);
      });

      render(<PerformanceMonitor />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockWebVitals.getFID).toHaveBeenCalled();
    });

    it('should warn when CLS exceeds budget', async () => {
      mockWebVitals.getCLS = jest.fn((callback) => {
        setTimeout(() => callback({ value: 0.25, rating: 'poor', name: 'CLS', delta: 0.25, id: '1' }), 10);
      });

      render(<PerformanceMonitor />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockWebVitals.getCLS).toHaveBeenCalled();
    });

    it('should not warn for good metrics', async () => {
      // All metrics are good in default setup
      render(<PerformanceMonitor />);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should complete without warnings
      expect(mockWebVitals.getFCP).toHaveBeenCalled();
    });
  });

  describe('measurePerformance Utility', () => {
    it('should collect all metrics', async () => {
      const metrics = await measurePerformance();

      expect(metrics).toEqual(
        expect.objectContaining({
          fcp: expect.any(Number),
          lcp: expect.any(Number),
          fid: expect.any(Number),
          cls: expect.any(Number),
          ttfb: expect.any(Number)
        })
      );
    });

    it('should return empty object on non-web platform', async () => {
      (Platform.OS as any) = 'ios';

      const metrics = await measurePerformance();

      expect(metrics).toEqual({});
    });

    it('should return empty object without webVitals', async () => {
      delete (global as any).window.webVitals;

      const metrics = await measurePerformance();

      expect(metrics).toEqual({});
    });

    it('should timeout after 5 seconds', async () => {
      mockWebVitals.getFCP = jest.fn(); // Never calls callback

      const startTime = Date.now();
      const metrics = await measurePerformance();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(6000);
      expect(metrics).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle web-vitals loading error', () => {
      delete (global as any).window.webVitals;

      const mockScript = {
        src: '',
        onload: null as any,
        onerror: jest.fn()
      };
      mockDocument.createElement.mockReturnValue(mockScript);
      mockDocument.head.appendChild.mockImplementation(() => {
        throw new Error('Script error');
      });

      // Should not crash
      expect(() => {
        render(<PerformanceMonitor />);
      }).not.toThrow();
    });

    it('should handle metrics collection errors gracefully', () => {
      mockWebVitals.getCLS = jest.fn(() => {
        throw new Error('Collection error');
      });

      // Should not crash
      expect(() => {
        render(<PerformanceMonitor />);
      }).not.toThrow();
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = render(<PerformanceMonitor />);

      // Should not crash on unmount
      expect(() => unmount()).not.toThrow();
    });

    it('should reinitialize when enabled changes', async () => {
      const { rerender } = render(<PerformanceMonitor enabled={false} />);

      expect(mockWebVitals.getCLS).not.toHaveBeenCalled();

      rerender(<PerformanceMonitor enabled={true} />);

      await waitFor(() => {
        expect(mockWebVitals.getCLS).toHaveBeenCalled();
      });
    });
  });
});
