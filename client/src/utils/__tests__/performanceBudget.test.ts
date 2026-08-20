/**
 * PerformanceBudget Tests - Full Coverage
 */

import { PerformanceBudgetEnforcer, performanceBudget } from '../performanceBudget';
import { performanceMonitor } from '../performanceMonitor';

// Mock performanceMonitor
jest.mock('../performanceMonitor', () => ({
  performanceMonitor: {
    getSummary: jest.fn(),
    getMetrics: jest.fn(),
    getLatestMetric: jest.fn(),
    getMetricsByName: jest.fn(),
  },
}));

describe('PerformanceBudget', () => {
  let enforcer: PerformanceBudgetEnforcer;

  beforeEach(() => {
    jest.clearAllMocks();
    enforcer = new PerformanceBudgetEnforcer();

    // Mock performance API
    (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
      coreWebVitals: {},
    });
    (performanceMonitor.getMetrics as jest.Mock).mockReturnValue([]);
    (performanceMonitor.getLatestMetric as jest.Mock).mockReturnValue(null);
    (performanceMonitor.getMetricsByName as jest.Mock).mockReturnValue([]);

    // Mock performance.getEntriesByType
    global.performance.getEntriesByType = jest.fn().mockReturnValue([]);
  });

  describe('Constructor', () => {
    it('should create enforcer with default limits', () => {
      const limits = enforcer.getLimits();

      expect(limits.bundleSize.initial).toBe(250);
      expect(limits.bundleSize.total).toBe(1024);
      expect(limits.coreWebVitals.fcp).toBe(1800);
      expect(limits.memory.initial).toBe(50);
      expect(limits.network.requests).toBe(50);
    });

    it('should create enforcer with custom limits', () => {
      const custom = new PerformanceBudgetEnforcer({
        bundleSize: {
          initial: 300,
          total: 2000,
          vendor: 600,
          css: 150,
        },
      });

      const limits = custom.getLimits();
      expect(limits.bundleSize.initial).toBe(300);
      expect(limits.bundleSize.total).toBe(2000);
    });

    it('should merge custom limits with defaults', () => {
      const custom = new PerformanceBudgetEnforcer({
        coreWebVitals: {
          fcp: 2000,
          lcp: 3000,
          fid: 150,
          cls: 0.15,
          ttfb: 1000,
          tti: 4000,
        },
      });

      const limits = custom.getLimits();
      expect(limits.coreWebVitals.fcp).toBe(2000);
      expect(limits.bundleSize.initial).toBe(250); // Default
    });
  });

  describe('getLimits', () => {
    it('should return copy of limits', () => {
      const limits1 = enforcer.getLimits();
      const limits2 = enforcer.getLimits();

      expect(limits1).not.toBe(limits2);
      expect(limits1).toEqual(limits2);
    });
  });

  describe('updateLimits', () => {
    it('should update specific limits', () => {
      enforcer.updateLimits({
        bundleSize: {
          initial: 500,
          total: 3000,
          vendor: 1000,
          css: 200,
        },
      });

      const limits = enforcer.getLimits();
      expect(limits.bundleSize.initial).toBe(500);
    });

    it('should preserve non-updated limits', () => {
      const originalLimits = enforcer.getLimits();

      enforcer.updateLimits({
        coreWebVitals: {
          fcp: 2500,
          lcp: 3500,
          fid: 200,
          cls: 0.2,
          ttfb: 1200,
          tti: 5000,
        },
      });

      const newLimits = enforcer.getLimits();
      expect(newLimits.bundleSize).toEqual(originalLimits.bundleSize);
      expect(newLimits.coreWebVitals.fcp).toBe(2500);
    });
  });

  describe('checkBudgets', () => {
    it('should return passing report when all budgets met', async () => {
      const report = await enforcer.checkBudgets();

      expect(report.passed).toBe(true);
      expect(report.score).toBe(100);
      expect(report.violations).toHaveLength(0);
      expect(report.summary.total).toBe(0);
      expect(report.summary.warnings).toBe(0);
      expect(report.summary.errors).toBe(0);
    });

    it('should detect FCP violations', async () => {
      (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
        coreWebVitals: {
          fcp: { value: 3000 }, // Exceeds 1800ms limit
        },
      });

      const report = await enforcer.checkBudgets();

      expect(report.passed).toBe(false);
      expect(report.violations.length).toBeGreaterThan(0);
      expect(report.violations[0].metric).toBe('Core Web Vitals - FCP');
      expect(report.violations[0].current).toBe(3000);
      expect(report.violations[0].severity).toBe('error'); // 3000 > 1800 * 1.5
    });

    it('should detect LCP violations', async () => {
      (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
        coreWebVitals: {
          lcp: { value: 4000 }, // Exceeds 2500ms limit
        },
      });

      const report = await enforcer.checkBudgets();

      expect(report.violations.some(v => v.metric === 'Core Web Vitals - LCP')).toBe(true);
    });

    it('should detect FID violations', async () => {
      (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
        coreWebVitals: {
          fid: { value: 200 }, // Exceeds 100ms limit
        },
      });

      const report = await enforcer.checkBudgets();

      expect(report.violations.some(v => v.metric === 'Core Web Vitals - FID')).toBe(true);
    });

    it('should detect CLS violations', async () => {
      (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
        coreWebVitals: {
          cls: { value: 0.3 }, // Exceeds 0.1 limit
        },
      });

      const report = await enforcer.checkBudgets();

      expect(report.violations.some(v => v.metric === 'Core Web Vitals - CLS')).toBe(true);
    });

    it('should detect TTFB violations', async () => {
      (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
        coreWebVitals: {
          ttfb: { value: 1500 }, // Exceeds 800ms limit
        },
      });

      const report = await enforcer.checkBudgets();

      expect(report.violations.some(v => v.metric === 'Core Web Vitals - TTFB')).toBe(true);
    });

    it('should detect resource performance violations', async () => {
      (performanceMonitor.getMetrics as jest.Mock).mockReturnValue([
        { name: 'resource.script', value: 2000 }, // Exceeds 1000ms limit
        { name: 'resource.script', value: 2500 },
      ]);

      const report = await enforcer.checkBudgets();

      expect(report.violations.some(v => v.metric.includes('script'))).toBe(true);
    });

    it('should detect bundle size violations from navigation', async () => {
      const mockNavigation = {
        transferSize: 2 * 1024 * 1024, // 2MB = 2048KB (exceeds 1024KB limit)
      };
      (global.performance.getEntriesByType as jest.Mock).mockReturnValue([mockNavigation]);

      const report = await enforcer.checkBudgets();

      expect(report.violations.some(v => v.metric === 'Bundle Size - Total')).toBe(true);
    });

    it('should detect bundle size violations from metrics', async () => {
      (performanceMonitor.getLatestMetric as jest.Mock).mockReturnValue({
        value: 400, // Exceeds 250KB initial limit
      });

      const report = await enforcer.checkBudgets();

      expect(report.violations.some(v => v.metric === 'Bundle Size - Initial')).toBe(true);
    });

    it('should detect memory usage violations', async () => {
      (performanceMonitor.getMetricsByName as jest.Mock).mockReturnValue([
        { value: 80, timestamp: 1000 }, // Exceeds 50MB initial limit
      ]);

      const report = await enforcer.checkBudgets();

      expect(report.violations.some(v => v.metric === 'Memory Usage - Current')).toBe(true);
    });

    it('should detect peak memory violations', async () => {
      (performanceMonitor.getMetricsByName as jest.Mock).mockReturnValue([
        { value: 50, timestamp: 1000 },
        { value: 120, timestamp: 2000 }, // Peak exceeds 100MB limit
        { value: 60, timestamp: 3000 },
      ]);

      const report = await enforcer.checkBudgets();

      expect(report.violations.some(v => v.metric === 'Memory Usage - Peak')).toBe(true);
    });

    it('should detect memory growth rate violations', async () => {
      (performanceMonitor.getMetricsByName as jest.Mock).mockReturnValue([
        { value: 30, timestamp: 0 },
        { value: 50, timestamp: 60000 }, // 20MB growth in 1 minute = 20MB/min (exceeds 10MB/min limit)
      ]);

      const report = await enforcer.checkBudgets();

      expect(report.violations.some(v => v.metric === 'Memory Usage - Growth Rate')).toBe(true);
    });

    it('should not flag negative memory growth', async () => {
      (performanceMonitor.getMetricsByName as jest.Mock).mockReturnValue([
        { value: 50, timestamp: 0 },
        { value: 40, timestamp: 60000 }, // Negative growth (memory decreased)
      ]);

      const report = await enforcer.checkBudgets();

      expect(report.violations.some(v => v.metric === 'Memory Usage - Growth Rate')).toBe(false);
    });

    it('should detect network request violations', async () => {
      const mockResources = Array(60).fill({ transferSize: 10 }); // 60 requests (exceeds 50 limit)
      (global.performance.getEntriesByType as jest.Mock).mockReturnValue(mockResources);

      const report = await enforcer.checkBudgets();

      expect(report.violations.some(v => v.metric === 'Network - Total Requests')).toBe(true);
    });

    it('should detect network transfer size violations', async () => {
      const mockResources = Array(10).fill({ transferSize: 300 * 1024 }); // 3000KB total (exceeds 2048KB limit)
      (global.performance.getEntriesByType as jest.Mock).mockReturnValue(mockResources);

      const report = await enforcer.checkBudgets();

      expect(report.violations.some(v => v.metric === 'Network - Total Transfer Size')).toBe(true);
    });
  });

  describe('Violation Severity', () => {
    it('should mark as warning when current is 1.3x limit', async () => {
      (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
        coreWebVitals: {
          fcp: { value: 2340 }, // 1.3 * 1800 = 2340
        },
      });

      const report = await enforcer.checkBudgets();

      const fcpViolation = report.violations.find(v => v.metric === 'Core Web Vitals - FCP');
      expect(fcpViolation?.severity).toBe('warning');
    });

    it('should mark as error when current is 1.5x limit', async () => {
      (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
        coreWebVitals: {
          fcp: { value: 2700 }, // 1.5 * 1800 = 2700
        },
      });

      const report = await enforcer.checkBudgets();

      const fcpViolation = report.violations.find(v => v.metric === 'Core Web Vitals - FCP');
      expect(fcpViolation?.severity).toBe('error');
    });
  });

  describe('Violation Impact', () => {
    it('should mark as low impact when current is < 1.3x limit', async () => {
      (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
        coreWebVitals: {
          fcp: { value: 2000 }, // Just above 1800 limit
        },
      });

      const report = await enforcer.checkBudgets();

      const fcpViolation = report.violations.find(v => v.metric === 'Core Web Vitals - FCP');
      expect(fcpViolation?.impact).toBe('low');
    });

    it('should mark as medium impact when current is 1.3-2x limit', async () => {
      (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
        coreWebVitals: {
          fcp: { value: 2700 }, // 1.5 * 1800
        },
      });

      const report = await enforcer.checkBudgets();

      const fcpViolation = report.violations.find(v => v.metric === 'Core Web Vitals - FCP');
      expect(fcpViolation?.impact).toBe('medium');
    });

    it('should mark as high impact when current is > 2x limit', async () => {
      (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
        coreWebVitals: {
          fcp: { value: 4000 }, // > 2 * 1800
        },
      });

      const report = await enforcer.checkBudgets();

      const fcpViolation = report.violations.find(v => v.metric === 'Core Web Vitals - FCP');
      expect(fcpViolation?.impact).toBe('high');
    });
  });

  describe('Score Calculation', () => {
    it('should calculate score with warnings', async () => {
      (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
        coreWebVitals: {
          fcp: { value: 2000 }, // Warning
          lcp: { value: 2800 }, // Warning
        },
      });

      const report = await enforcer.checkBudgets();

      expect(report.score).toBe(90); // 100 - (2 * 5)
    });

    it('should calculate score with errors', async () => {
      (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
        coreWebVitals: {
          fcp: { value: 3000 }, // Error
        },
      });

      const report = await enforcer.checkBudgets();

      expect(report.score).toBe(85); // 100 - (1 * 15)
    });

    it('should calculate score with mixed violations', async () => {
      (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
        coreWebVitals: {
          fcp: { value: 2000 }, // Warning
          lcp: { value: 4000 }, // Error
        },
      });

      const report = await enforcer.checkBudgets();

      expect(report.score).toBe(80); // 100 - (1 * 5 + 1 * 15)
    });

    it('should not allow negative scores', async () => {
      (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
        coreWebVitals: {
          fcp: { value: 5000 }, // Error
          lcp: { value: 6000 }, // Error
          fid: { value: 500 }, // Error
          cls: { value: 2 }, // Error
          ttfb: { value: 3000 }, // Error
        },
      });

      const report = await enforcer.checkBudgets();

      expect(report.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Passed Status', () => {
    it('should pass with no violations', async () => {
      const report = await enforcer.checkBudgets();

      expect(report.passed).toBe(true);
    });

    it('should pass with up to 2 warnings', async () => {
      (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
        coreWebVitals: {
          fcp: { value: 2000 }, // Warning
          lcp: { value: 2800 }, // Warning
        },
      });

      const report = await enforcer.checkBudgets();

      expect(report.passed).toBe(true);
    });

    it('should fail with 3 warnings', async () => {
      (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
        coreWebVitals: {
          fcp: { value: 2000 }, // Warning
          lcp: { value: 2800 }, // Warning
          ttfb: { value: 1000 }, // Warning
        },
      });

      const report = await enforcer.checkBudgets();

      expect(report.passed).toBe(false);
    });

    it('should fail with any errors', async () => {
      (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
        coreWebVitals: {
          fcp: { value: 3000 }, // Error
        },
      });

      const report = await enforcer.checkBudgets();

      expect(report.passed).toBe(false);
    });
  });

  describe('Resource Optimization Recommendations', () => {
    it('should provide script optimization recommendations', async () => {
      (performanceMonitor.getMetrics as jest.Mock).mockReturnValue([
        { name: 'resource.script', value: 2000 },
      ]);

      const report = await enforcer.checkBudgets();

      const violation = report.violations.find(v => v.metric.includes('script'));
      expect(violation?.recommendation).toContain('Minify JavaScript');
    });

    it('should provide stylesheet optimization recommendations', async () => {
      (performanceMonitor.getMetrics as jest.Mock).mockReturnValue([
        { name: 'resource.stylesheet', value: 1000 },
      ]);

      const report = await enforcer.checkBudgets();

      const violation = report.violations.find(v => v.metric.includes('stylesheet'));
      expect(violation?.recommendation).toContain('Minify CSS');
    });

    it('should provide image optimization recommendations', async () => {
      (performanceMonitor.getMetrics as jest.Mock).mockReturnValue([
        { name: 'resource.image', value: 3000 },
      ]);

      const report = await enforcer.checkBudgets();

      const violation = report.violations.find(v => v.metric.includes('image'));
      expect(violation?.recommendation).toContain('Optimize image formats');
    });

    it('should provide font optimization recommendations', async () => {
      (performanceMonitor.getMetrics as jest.Mock).mockReturnValue([
        { name: 'resource.font', value: 2000 },
      ]);

      const report = await enforcer.checkBudgets();

      const violation = report.violations.find(v => v.metric.includes('font'));
      expect(violation?.recommendation).toContain('font-display: swap');
    });

    it('should provide api optimization recommendations', async () => {
      (performanceMonitor.getMetrics as jest.Mock).mockReturnValue([
        { name: 'resource.api', value: 10000 },
      ]);

      const report = await enforcer.checkBudgets();

      const violation = report.violations.find(v => v.metric.includes('api'));
      expect(violation?.recommendation).toContain('Optimize API responses');
    });
  });

  describe('exportReport', () => {
    it('should export report as JSON', async () => {
      const json = await enforcer.exportReport();
      const data = JSON.parse(json);

      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('url');
      expect(data).toHaveProperty('userAgent');
      expect(data).toHaveProperty('limits');
      expect(data).toHaveProperty('report');
    });

    it('should include current URL in export', async () => {
      const json = await enforcer.exportReport();
      const data = JSON.parse(json);

      expect(data.url).toBeDefined();
    });

    it('should include user agent in export', async () => {
      const json = await enforcer.exportReport();
      const data = JSON.parse(json);

      expect(data.userAgent).toBeDefined();
    });

    it('should include violations in export', async () => {
      (performanceMonitor.getSummary as jest.Mock).mockReturnValue({
        coreWebVitals: {
          fcp: { value: 3000 },
        },
      });

      const json = await enforcer.exportReport();
      const data = JSON.parse(json);

      expect(data.report.violations.length).toBeGreaterThan(0);
    });
  });

  describe('Singleton Instance', () => {
    it('should export singleton performanceBudget instance', () => {
      expect(performanceBudget).toBeDefined();
      expect(performanceBudget).toBeInstanceOf(PerformanceBudgetEnforcer);
    });
  });
});
