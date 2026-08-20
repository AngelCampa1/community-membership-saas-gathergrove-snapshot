import { PerformanceMonitor } from '../performanceMonitor';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

// Mock web-vitals
jest.mock('web-vitals', () => ({
  onCLS: jest.fn(),
  onINP: jest.fn(),
  onFCP: jest.fn(),
  onLCP: jest.fn(),
  onTTFB: jest.fn(),
}));

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let mockPerformanceObserver: jest.Mock;
  let observerInstances: any[];

  beforeEach(() => {
    observerInstances = [];

    // Mock PerformanceObserver
    mockPerformanceObserver = jest.fn().mockImplementation((callback) => {
      const instance = {
        observe: jest.fn(),
        disconnect: jest.fn(),
        callback,
      };
      observerInstances.push(instance);
      return instance;
    });
    global.PerformanceObserver = mockPerformanceObserver as any;

    // Mock performance.memory
    Object.defineProperty(global.performance, 'memory', {
      writable: true,
      configurable: true,
      value: {
        usedJSHeapSize: 52428800, // 50MB
        jsHeapSizeLimit: 2147483648, // 2GB
        totalJSHeapSize: 104857600, // 100MB
      },
    });

    // Mock performance.getEntriesByType
    global.performance.getEntriesByType = jest.fn().mockReturnValue([
      {
        name: 'navigation',
        transferSize: 512000, // 500 KB
        duration: 1500,
        startTime: 0,
      },
    ]);

    // Mock navigator
    Object.defineProperty(global, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        serviceWorker: true,
      },
    });

    // Reset web-vitals mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
    if (monitor) {
      monitor.destroy();
    }
  });

  describe('Constructor', () => {
    it('should create instance with default budget', () => {
      monitor = new PerformanceMonitor();
      expect(monitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('should create instance with custom budget', () => {
      monitor = new PerformanceMonitor({
        fcp: 2000,
        lcp: 3000,
        cls: 0.15,
      });
      expect(monitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('should merge custom budget with defaults', () => {
      monitor = new PerformanceMonitor({ fcp: 2500 });
      const metrics = monitor.getMetrics();
      expect(metrics).toEqual([]);
    });
  });

  describe('Initialization', () => {
    it('should initialize performance monitoring', () => {
      monitor = new PerformanceMonitor();
      monitor.init();

      expect(onCLS).toHaveBeenCalled();
      expect(onINP).toHaveBeenCalled();
      expect(onFCP).toHaveBeenCalled();
      expect(onLCP).toHaveBeenCalled();
      expect(onTTFB).toHaveBeenCalled();
    });

    it('should not initialize twice', () => {
      monitor = new PerformanceMonitor();
      monitor.init();
      monitor.init();

      // web-vitals callbacks should only be called once
      expect(onCLS).toHaveBeenCalledTimes(1);
    });

    it('should not initialize in non-browser environment', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      monitor = new PerformanceMonitor();
      monitor.init();

      expect(onCLS).not.toHaveBeenCalled();

      (global as any).window = originalWindow;
    });

    it('should setup PerformanceObserver for resource timing', () => {
      monitor = new PerformanceMonitor();
      monitor.init();

      expect(mockPerformanceObserver).toHaveBeenCalled();
      expect(observerInstances.length).toBeGreaterThan(0);
    });
  });

  describe('Web Vitals Integration', () => {
    it('should record CLS metric', () => {
      const callback = jest.fn();
      monitor = new PerformanceMonitor();
      monitor.subscribe(callback);
      monitor.init();

      const clsCallback = (onCLS as jest.Mock).mock.calls[0][0];
      clsCallback({
        name: 'CLS',
        value: 0.05,
        rating: 'good',
        id: 'cls-1',
        entries: [],
      });

      const metrics = monitor.getMetrics();
      expect(metrics.some(m => m.name === 'cls')).toBe(true); // lowercase
    });

    it('should record INP metric', () => {
      monitor = new PerformanceMonitor();
      monitor.init();

      const inpCallback = (onINP as jest.Mock).mock.calls[0][0];
      inpCallback({
        name: 'INP',
        value: 50,
        rating: 'good',
        id: 'inp-1',
        entries: [],
      });

      const metrics = monitor.getMetrics();
      expect(metrics.some(m => m.name === 'inp')).toBe(true); // lowercase
    });

    it('should record FCP metric', () => {
      monitor = new PerformanceMonitor();
      monitor.init();

      const fcpCallback = (onFCP as jest.Mock).mock.calls[0][0];
      fcpCallback({
        name: 'FCP',
        value: 1500,
        rating: 'good',
        id: 'fcp-1',
        entries: [],
      });

      const metrics = monitor.getMetrics();
      expect(metrics.some(m => m.name === 'fcp')).toBe(true); // lowercase
    });

    it('should record LCP metric', () => {
      monitor = new PerformanceMonitor();
      monitor.init();

      const lcpCallback = (onLCP as jest.Mock).mock.calls[0][0];
      lcpCallback({
        name: 'LCP',
        value: 2000,
        rating: 'good',
        id: 'lcp-1',
        entries: [],
      });

      const metrics = monitor.getMetrics();
      expect(metrics.some(m => m.name === 'lcp')).toBe(true); // lowercase
    });

    it('should record TTFB metric', () => {
      monitor = new PerformanceMonitor();
      monitor.init();

      const ttfbCallback = (onTTFB as jest.Mock).mock.calls[0][0];
      ttfbCallback({
        name: 'TTFB',
        value: 500,
        rating: 'good',
        id: 'ttfb-1',
        entries: [],
      });

      const metrics = monitor.getMetrics();
      expect(metrics.some(m => m.name === 'ttfb')).toBe(true); // lowercase
    });
  });

  describe('Rating Logic', () => {
    beforeEach(() => {
      monitor = new PerformanceMonitor();
      monitor.init();
    });

    it('should rate FCP as good (< 1800ms)', () => {
      const fcpCallback = (onFCP as jest.Mock).mock.calls[0][0];
      fcpCallback({ name: 'FCP', value: 1500, rating: 'good', id: 'fcp-1', entries: [] });

      const metric = monitor.getLatestMetric('fcp'); // lowercase
      expect(metric?.rating).toBe('good');
    });

    it('should rate FCP as needs-improvement (1800-3000ms)', () => {
      const fcpCallback = (onFCP as jest.Mock).mock.calls[0][0];
      fcpCallback({ name: 'FCP', value: 2500, rating: 'needs-improvement', id: 'fcp-2', entries: [] });

      const metric = monitor.getLatestMetric('fcp'); // lowercase
      expect(metric?.rating).toBe('needs-improvement');
    });

    it('should rate FCP as poor (> 3000ms)', () => {
      const fcpCallback = (onFCP as jest.Mock).mock.calls[0][0];
      fcpCallback({ name: 'FCP', value: 3500, rating: 'poor', id: 'fcp-3', entries: [] });

      const metric = monitor.getLatestMetric('fcp'); // lowercase
      expect(metric?.rating).toBe('poor');
    });

    it('should rate LCP as good (< 2500ms)', () => {
      const lcpCallback = (onLCP as jest.Mock).mock.calls[0][0];
      lcpCallback({ name: 'LCP', value: 2000, rating: 'good', id: 'lcp-1', entries: [] });

      const metric = monitor.getLatestMetric('lcp'); // lowercase
      expect(metric?.rating).toBe('good');
    });

    it('should rate LCP as needs-improvement (2500-4000ms)', () => {
      const lcpCallback = (onLCP as jest.Mock).mock.calls[0][0];
      lcpCallback({ name: 'LCP', value: 3000, rating: 'needs-improvement', id: 'lcp-2', entries: [] });

      const metric = monitor.getLatestMetric('lcp'); // lowercase
      expect(metric?.rating).toBe('needs-improvement');
    });

    it('should rate LCP as poor (> 4000ms)', () => {
      const lcpCallback = (onLCP as jest.Mock).mock.calls[0][0];
      lcpCallback({ name: 'LCP', value: 4500, rating: 'poor', id: 'lcp-3', entries: [] });

      const metric = monitor.getLatestMetric('lcp'); // lowercase
      expect(metric?.rating).toBe('poor');
    });

    it('should rate INP (FID) as good (< 100ms)', () => {
      const inpCallback = (onINP as jest.Mock).mock.calls[0][0];
      inpCallback({ name: 'INP', value: 50, rating: 'good', id: 'inp-1', entries: [] });

      const metric = monitor.getLatestMetric('inp'); // lowercase
      expect(metric?.rating).toBe('good');
    });

    it('should rate INP (FID) as needs-improvement (100-300ms)', () => {
      const inpCallback = (onINP as jest.Mock).mock.calls[0][0];
      inpCallback({ name: 'INP', value: 200, rating: 'needs-improvement', id: 'inp-2', entries: [] });

      const metric = monitor.getLatestMetric('inp'); // lowercase
      expect(metric?.rating).toBe('needs-improvement');
    });

    it('should rate INP (FID) as poor (> 300ms)', () => {
      const inpCallback = (onINP as jest.Mock).mock.calls[0][0];
      inpCallback({ name: 'INP', value: 350, rating: 'poor', id: 'inp-3', entries: [] });

      const metric = monitor.getLatestMetric('inp'); // lowercase
      expect(metric?.rating).toBe('poor');
    });

    it('should rate CLS as good (< 0.1)', () => {
      const clsCallback = (onCLS as jest.Mock).mock.calls[0][0];
      clsCallback({ name: 'CLS', value: 0.05, rating: 'good', id: 'cls-1', entries: [] });

      const metric = monitor.getLatestMetric('cls'); // lowercase
      expect(metric?.rating).toBe('good');
    });

    it('should rate CLS as needs-improvement (0.1-0.25)', () => {
      const clsCallback = (onCLS as jest.Mock).mock.calls[0][0];
      clsCallback({ name: 'CLS', value: 0.15, rating: 'needs-improvement', id: 'cls-2', entries: [] });

      const metric = monitor.getLatestMetric('cls'); // lowercase
      expect(metric?.rating).toBe('needs-improvement');
    });

    it('should rate CLS as poor (> 0.25)', () => {
      const clsCallback = (onCLS as jest.Mock).mock.calls[0][0];
      clsCallback({ name: 'CLS', value: 0.30, rating: 'poor', id: 'cls-3', entries: [] });

      const metric = monitor.getLatestMetric('cls'); // lowercase
      expect(metric?.rating).toBe('poor');
    });

    it('should rate TTFB as good (< 800ms)', () => {
      const ttfbCallback = (onTTFB as jest.Mock).mock.calls[0][0];
      ttfbCallback({ name: 'TTFB', value: 500, rating: 'good', id: 'ttfb-1', entries: [] });

      const metric = monitor.getLatestMetric('ttfb'); // lowercase
      expect(metric?.rating).toBe('good');
    });

    it('should rate TTFB as needs-improvement (800-1800ms)', () => {
      const ttfbCallback = (onTTFB as jest.Mock).mock.calls[0][0];
      ttfbCallback({ name: 'TTFB', value: 1200, rating: 'needs-improvement', id: 'ttfb-2', entries: [] });

      const metric = monitor.getLatestMetric('ttfb'); // lowercase
      expect(metric?.rating).toBe('needs-improvement');
    });

    it('should rate TTFB as poor (> 1800ms)', () => {
      const ttfbCallback = (onTTFB as jest.Mock).mock.calls[0][0];
      ttfbCallback({ name: 'TTFB', value: 2000, rating: 'poor', id: 'ttfb-3', entries: [] });

      const metric = monitor.getLatestMetric('ttfb'); // lowercase
      expect(metric?.rating).toBe('poor');
    });
  });

  describe('Subscription', () => {
    it('should notify subscribers when metrics are recorded', () => {
      const callback = jest.fn();
      monitor = new PerformanceMonitor();
      monitor.subscribe(callback);

      // Clear initial calls from any pre-init setup
      callback.mockClear();

      monitor.init();

      // Init creates memory and bundle metrics automatically
      expect(callback).toHaveBeenCalled();

      // Clear to test FCP callback specifically
      callback.mockClear();

      const fcpCallback = (onFCP as jest.Mock).mock.calls[0][0];
      fcpCallback({ name: 'FCP', value: 1500, rating: 'good', id: 'fcp-1', entries: [] });

      expect(callback).toHaveBeenCalled();
      // The last call should be for FCP (lowercase)
      const lastCall = callback.mock.calls[callback.mock.calls.length - 1][0];
      expect(lastCall).toMatchObject({
        name: 'fcp', // lowercase
        value: 1500,
      });
    });

    it('should support multiple subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      monitor = new PerformanceMonitor();
      monitor.subscribe(callback1);
      monitor.subscribe(callback2);
      monitor.init();

      const fcpCallback = (onFCP as jest.Mock).mock.calls[0][0];
      fcpCallback({ name: 'FCP', value: 1500, rating: 'good', id: 'fcp-1', entries: [] });

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should unsubscribe callback', () => {
      const callback = jest.fn();
      monitor = new PerformanceMonitor();
      const unsubscribe = monitor.subscribe(callback);
      monitor.init();

      // Callback is called during init for memory and bundle metrics
      const callCountBeforeUnsubscribe = callback.mock.calls.length;
      expect(callCountBeforeUnsubscribe).toBeGreaterThan(0);

      unsubscribe();

      // Clear the mock to reset call count
      callback.mockClear();

      const fcpCallback = (onFCP as jest.Mock).mock.calls[0][0];
      fcpCallback({ name: 'FCP', value: 1500, rating: 'good', id: 'fcp-1', entries: [] });

      // After unsubscribe, callback should NOT be called for new metrics
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Public API', () => {
    beforeEach(() => {
      monitor = new PerformanceMonitor();
      monitor.init();
    });

    it('should get all metrics', () => {
      const fcpCallback = (onFCP as jest.Mock).mock.calls[0][0];
      fcpCallback({ name: 'FCP', value: 1500, rating: 'good', id: 'fcp-1', entries: [] });

      const lcpCallback = (onLCP as jest.Mock).mock.calls[0][0];
      lcpCallback({ name: 'LCP', value: 2000, rating: 'good', id: 'lcp-1', entries: [] });

      const metrics = monitor.getMetrics();
      // Init creates memory and bundle metrics, plus we added FCP and LCP
      expect(metrics.length).toBeGreaterThanOrEqual(2);

      // Check that FCP and LCP are in the metrics
      const fcpMetric = metrics.find(m => m.name === 'fcp');
      const lcpMetric = metrics.find(m => m.name === 'lcp');
      expect(fcpMetric).toBeDefined();
      expect(lcpMetric).toBeDefined();
      expect(fcpMetric?.value).toBe(1500);
      expect(lcpMetric?.value).toBe(2000);
    });

    it('should get metrics by name', () => {
      const fcpCallback = (onFCP as jest.Mock).mock.calls[0][0];
      fcpCallback({ name: 'FCP', value: 1500, rating: 'good', id: 'fcp-1', entries: [] });
      fcpCallback({ name: 'FCP', value: 1600, rating: 'good', id: 'fcp-2', entries: [] });

      const metrics = monitor.getMetricsByName('fcp'); // lowercase
      expect(metrics).toHaveLength(2);
      expect(metrics[0].value).toBe(1500);
      expect(metrics[1].value).toBe(1600);
    });

    it('should get latest metric by name', () => {
      const fcpCallback = (onFCP as jest.Mock).mock.calls[0][0];
      fcpCallback({ name: 'FCP', value: 1500, rating: 'good', id: 'fcp-1', entries: [] });
      fcpCallback({ name: 'FCP', value: 1600, rating: 'good', id: 'fcp-2', entries: [] });

      const metric = monitor.getLatestMetric('fcp'); // lowercase
      expect(metric?.value).toBe(1600);
    });

    it('should return undefined for non-existent metric', () => {
      const metric = monitor.getLatestMetric('NONEXISTENT');
      expect(metric).toBeUndefined();
    });

    it('should get summary of all metrics', () => {
      const fcpCallback = (onFCP as jest.Mock).mock.calls[0][0];
      fcpCallback({ name: 'FCP', value: 1500, rating: 'good', id: 'fcp-1', entries: [] });

      const lcpCallback = (onLCP as jest.Mock).mock.calls[0][0];
      lcpCallback({ name: 'LCP', value: 2000, rating: 'good', id: 'lcp-1', entries: [] });

      const summary = monitor.getSummary();
      // getSummary returns an object with coreWebVitals property
      expect(summary).toHaveProperty('coreWebVitals');
      expect(summary.coreWebVitals).toHaveProperty('fcp');
      expect(summary.coreWebVitals).toHaveProperty('lcp');
      expect(summary.coreWebVitals.fcp.value).toBe(1500);
      expect(summary.coreWebVitals.fcp.rating).toBe('good');
    });

    it('should export metrics as JSON', () => {
      const fcpCallback = (onFCP as jest.Mock).mock.calls[0][0];
      fcpCallback({ name: 'FCP', value: 1500, rating: 'good', id: 'fcp-1', entries: [] });

      const exported = monitor.exportMetrics();
      expect(exported).toContain('fcp'); // lowercase
      expect(exported).toContain('1500');

      const parsed = JSON.parse(exported);
      // exportMetrics returns an object with metrics array, not a flat array
      expect(parsed).toHaveProperty('metrics');
      expect(parsed).toHaveProperty('summary');
      expect(parsed).toHaveProperty('budget');
      expect(Array.isArray(parsed.metrics)).toBe(true);
      // Find the FCP metric (there may be other metrics from initialization)
      const fcpMetric = parsed.metrics.find((m: any) => m.name === 'fcp');
      expect(fcpMetric).toBeDefined();
      expect(fcpMetric.value).toBe(1500);
    });
  });

  describe('Resource Timing', () => {
    it('should monitor resource timing', () => {
      monitor = new PerformanceMonitor();
      monitor.init();

      // Get the resource observer callback
      const resourceObserver = observerInstances.find(obs =>
        obs.observe.mock.calls[0]?.[0]?.entryTypes?.includes('resource')
      );
      expect(resourceObserver).toBeDefined();

      // Simulate resource entries
      const mockResourceEntry = {
        name: 'https://example.com/script.js',
        duration: 150,
        initiatorType: 'script',
      };

      resourceObserver.callback({
        getEntries: () => [mockResourceEntry],
      });

      const metrics = monitor.getMetrics();
      const resourceMetric = metrics.find(m => m.name.startsWith('resource.'));
      expect(resourceMetric).toBeDefined();
      expect(resourceMetric?.name).toBe('resource.script'); // 'script' not 'js'
    });
  });

  describe('Navigation Timing', () => {
    it('should monitor navigation timing', () => {
      monitor = new PerformanceMonitor();
      monitor.init();

      // Get the navigation observer callback
      const navObserver = observerInstances.find(obs =>
        obs.observe.mock.calls[0]?.[0]?.entryTypes?.includes('navigation')
      );
      expect(navObserver).toBeDefined();

      // Simulate navigation entry
      const mockNavigationEntry = {
        type: 'navigate',
        domContentLoadedEventStart: 100,
        domContentLoadedEventEnd: 150,
        loadEventStart: 200,
        loadEventEnd: 250,
      };

      navObserver.callback({
        getEntries: () => [mockNavigationEntry],
      });

      const metrics = monitor.getMetrics();
      const dclMetric = metrics.find(m => m.name === 'navigation.domContentLoaded');
      const loadMetric = metrics.find(m => m.name === 'navigation.load');

      expect(dclMetric).toBeDefined();
      expect(dclMetric?.value).toBe(50);
      expect(loadMetric).toBeDefined();
      expect(loadMetric?.value).toBe(50);
    });
  });

  describe('Resource Type Detection', () => {
    it('should detect JavaScript resources', () => {
      monitor = new PerformanceMonitor();
      monitor.init();

      const resourceObserver = observerInstances.find(obs =>
        obs.observe.mock.calls[0]?.[0]?.entryTypes?.includes('resource')
      );

      resourceObserver.callback({
        getEntries: () => [{
          name: 'https://example.com/app.js',
          duration: 100,
          initiatorType: 'script',
        }],
      });

      const metrics = monitor.getMetrics();
      expect(metrics.some(m => m.name === 'resource.script')).toBe(true); // 'script' not 'js'
    });

    it('should detect CSS resources', () => {
      monitor = new PerformanceMonitor();
      monitor.init();

      const resourceObserver = observerInstances.find(obs =>
        obs.observe.mock.calls[0]?.[0]?.entryTypes?.includes('resource')
      );

      resourceObserver.callback({
        getEntries: () => [{
          name: 'https://example.com/styles.css',
          duration: 100,
          initiatorType: 'link',
        }],
      });

      const metrics = monitor.getMetrics();
      expect(metrics.some(m => m.name === 'resource.stylesheet')).toBe(true); // 'stylesheet' not 'css'
    });

    it('should detect image resources', () => {
      monitor = new PerformanceMonitor();
      monitor.init();

      const resourceObserver = observerInstances.find(obs =>
        obs.observe.mock.calls[0]?.[0]?.entryTypes?.includes('resource')
      );

      resourceObserver.callback({
        getEntries: () => [{
          name: 'https://example.com/image.png',
          duration: 100,
          initiatorType: 'img',
        }],
      });

      const metrics = monitor.getMetrics();
      expect(metrics.some(m => m.name === 'resource.image')).toBe(true);
    });

    it('should detect font resources', () => {
      monitor = new PerformanceMonitor();
      monitor.init();

      const resourceObserver = observerInstances.find(obs =>
        obs.observe.mock.calls[0]?.[0]?.entryTypes?.includes('resource')
      );

      resourceObserver.callback({
        getEntries: () => [{
          name: 'https://example.com/font.woff2',
          duration: 100,
          initiatorType: 'css',
        }],
      });

      const metrics = monitor.getMetrics();
      expect(metrics.some(m => m.name === 'resource.font')).toBe(true);
    });

    it('should detect API resources', () => {
      monitor = new PerformanceMonitor();
      monitor.init();

      const resourceObserver = observerInstances.find(obs =>
        obs.observe.mock.calls[0]?.[0]?.entryTypes?.includes('resource')
      );

      resourceObserver.callback({
        getEntries: () => [{
          name: 'https://example.com/api/data', // Must contain '/api/' in path
          duration: 100,
          initiatorType: 'fetch',
        }],
      });

      const metrics = monitor.getMetrics();
      expect(metrics.some(m => m.name === 'resource.api')).toBe(true);
    });

    it('should default to "other" for unknown resources', () => {
      monitor = new PerformanceMonitor();
      monitor.init();

      const resourceObserver = observerInstances.find(obs =>
        obs.observe.mock.calls[0]?.[0]?.entryTypes?.includes('resource')
      );

      resourceObserver.callback({
        getEntries: () => [{
          name: 'https://example.com/unknown.xyz',
          duration: 100,
          initiatorType: 'other',
        }],
      });

      const metrics = monitor.getMetrics();
      expect(metrics.some(m => m.name === 'resource.other')).toBe(true);
    });
  });

  describe('Rating Thresholds', () => {
    beforeEach(() => {
      monitor = new PerformanceMonitor();
      monitor.init();
    });

    it('should rate resource as good/needs-improvement/poor', () => {
      const resourceObserver = observerInstances.find(obs =>
        obs.observe.mock.calls[0]?.[0]?.entryTypes?.includes('resource')
      );

      // Good: <= 200ms
      resourceObserver.callback({
        getEntries: () => [{ name: 'https://example.com/good.js', duration: 150, initiatorType: 'script' }],
      });

      // Needs improvement: 200-1000ms
      resourceObserver.callback({
        getEntries: () => [{ name: 'https://example.com/medium.js', duration: 500, initiatorType: 'script' }],
      });

      // Poor: > 1000ms
      resourceObserver.callback({
        getEntries: () => [{ name: 'https://example.com/slow.js', duration: 1500, initiatorType: 'script' }],
      });

      const metrics = monitor.getMetrics();
      const goodMetric = metrics.find(m => m.id === 'https://example.com/good.js');
      const mediumMetric = metrics.find(m => m.id === 'https://example.com/medium.js');
      const slowMetric = metrics.find(m => m.id === 'https://example.com/slow.js');

      expect(goodMetric?.rating).toBe('good');
      expect(mediumMetric?.rating).toBe('needs-improvement');
      expect(slowMetric?.rating).toBe('poor');
    });

    it('should rate navigation metrics correctly', () => {
      const navObserver = observerInstances.find(obs =>
        obs.observe.mock.calls[0]?.[0]?.entryTypes?.includes('navigation')
      );

      // Test DCL and Load metrics with different ratings
      navObserver.callback({
        getEntries: () => [{
          type: 'navigate',
          domContentLoadedEventStart: 0,
          domContentLoadedEventEnd: 800, // Good: <= 1000ms
          loadEventStart: 0,
          loadEventEnd: 1500, // Needs improvement: 1000-2000ms
        }],
      });

      const metrics = monitor.getMetrics();
      const dclMetric = metrics.find(m => m.name === 'navigation.domContentLoaded');
      const loadMetric = metrics.find(m => m.name === 'navigation.load');

      expect(dclMetric?.rating).toBe('good');
      expect(loadMetric?.rating).toBe('needs-improvement');
    });

    it('should rate memory usage correctly', () => {
      const memoryMetric = monitor.getLatestMetric('memory.used');

      // Memory metric should exist from init
      expect(memoryMetric).toBeDefined();
      expect(memoryMetric?.rating).toBe('good'); // 50MB is good (< 50)
    });

    it('should rate bundle size correctly', () => {
      const bundleMetric = monitor.getLatestMetric('bundle.size');

      // Bundle metric should exist from init
      expect(bundleMetric).toBeDefined();
      expect(bundleMetric?.rating).toBe('good'); // 500KB is good (< 1024KB)
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing PerformanceObserver gracefully', () => {
      const originalObserver = global.PerformanceObserver;
      delete (global as any).PerformanceObserver;

      monitor = new PerformanceMonitor();
      monitor.init(); // Should not throw

      // Restore
      global.PerformanceObserver = originalObserver;
    });

    it('should handle navigation entries with zero duration', () => {
      monitor = new PerformanceMonitor();
      monitor.init();

      const navObserver = observerInstances.find(obs =>
        obs.observe.mock.calls[0]?.[0]?.entryTypes?.includes('navigation')
      );

      navObserver.callback({
        getEntries: () => [{
          type: 'navigate',
          domContentLoadedEventStart: 100,
          domContentLoadedEventEnd: 100, // Zero duration
          loadEventStart: 100,
          loadEventEnd: 100, // Zero duration
        }],
      });

      const metrics = monitor.getMetrics();
      const dclMetric = metrics.find(m => m.name === 'navigation.domContentLoaded');

      expect(dclMetric).toBeDefined();
      expect(dclMetric?.value).toBe(0);
    });

    it('should handle metrics limit (> 1000)', () => {
      monitor = new PerformanceMonitor();
      monitor.init();

      const fcpCallback = (onFCP as jest.Mock).mock.calls[0][0];

      // Add 1001 metrics
      for (let i = 0; i < 1001; i++) {
        fcpCallback({
          name: 'FCP',
          value: 1500 + i,
          rating: 'good',
          id: `fcp-${i}`,
          entries: [],
        });
      }

      const metrics = monitor.getMetrics();
      // Should be limited to 500 most recent
      expect(metrics.length).toBeLessThanOrEqual(502); // 500 + memory + bundle
    });
  });

  describe('Cleanup', () => {
    it('should disconnect all observers on destroy', () => {
      monitor = new PerformanceMonitor();
      monitor.init();

      monitor.destroy();

      observerInstances.forEach(observer => {
        expect(observer.disconnect).toHaveBeenCalled();
      });
    });

    it('should clear all metrics on destroy', () => {
      monitor = new PerformanceMonitor();
      monitor.init();

      const fcpCallback = (onFCP as jest.Mock).mock.calls[0][0];
      fcpCallback({ name: 'FCP', value: 1500, rating: 'good', id: 'fcp-1', entries: [] });

      monitor.destroy();

      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(0);
    });

    it('should clear all subscribers on destroy', () => {
      const callback = jest.fn();
      monitor = new PerformanceMonitor();
      monitor.subscribe(callback);
      monitor.init();

      // Callback is called during init for memory and bundle metrics
      const callCountBeforeDestroy = callback.mock.calls.length;
      expect(callCountBeforeDestroy).toBeGreaterThan(0);

      monitor.destroy();

      // Clear the mock to reset call count
      callback.mockClear();

      const fcpCallback = (onFCP as jest.Mock).mock.calls[0][0];
      fcpCallback({ name: 'FCP', value: 1500, rating: 'good', id: 'fcp-1', entries: [] });

      // After destroy, callback should NOT be called for new metrics
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
