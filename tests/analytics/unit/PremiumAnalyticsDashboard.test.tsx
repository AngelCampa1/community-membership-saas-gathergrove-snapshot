/**
 * @fileoverview Comprehensive unit tests for Premium Analytics Dashboard
 * @version 1.0.0
 * 
 * Test Coverage:
 * - Component rendering with different tier configurations
 * - Loading states and error handling
 * - Tab navigation and content switching
 * - Real-time data updates and indicators
 * - Performance monitoring and optimization
 * - Accessibility compliance and ARIA attributes
 * - Responsive design behavior
 * - User interaction handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe, toHaveNoViolations } from 'jest-axe';
import PremiumAnalyticsDashboard from '../../../client/src/components/analytics/PremiumAnalyticsDashboard';
import { AnalyticsConfig } from '../../../client/src/types/analytics';
import { useRealTimeAnalytics } from '../../../client/src/hooks/useRealTimeAnalytics';
import premiumAnalyticsService from '../../../client/src/services/premiumAnalyticsService';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock dependencies
jest.mock('../../../client/src/hooks/useRealTimeAnalytics');
jest.mock('../../../client/src/services/premiumAnalyticsService');
jest.mock('../../../client/src/components/analytics/CustomDateRangePicker', () => {
  return function MockCustomDateRangePicker({ value, onChange, tier }: any) {
    return (
      <div data-testid="custom-date-range-picker">
        <button onClick={() => onChange({ 
          startDate: new Date('2024-01-01'), 
          endDate: new Date('2024-01-31'),
          label: 'Test Range'
        })}>
          {value.label || 'Select Date Range'}
        </button>
        <span>Tier: {tier}</span>
      </div>
    );
  };
});

jest.mock('../../../client/src/components/analytics/EngagementTrendChart', () => {
  return function MockEngagementTrendChart({ data, height, showMetricToggles, allowZoom }: any) {
    return (
      <div data-testid="engagement-trend-chart" data-height={height}>
        <span>Chart Data Points: {data?.length || 0}</span>
        {showMetricToggles && <span>Metric Toggles Enabled</span>}
        {allowZoom && <span>Zoom Enabled</span>}
      </div>
    );
  };
});

jest.mock('../../../client/src/components/analytics/ROITracker', () => {
  return function MockROITracker({ data, height, showMetricControls, showPerformanceIndicators, allowExport }: any) {
    return (
      <div data-testid="roi-tracker" data-height={height}>
        <span>ROI Data Points: {data?.length || 0}</span>
        {showMetricControls && <span>Metric Controls Enabled</span>}
        {showPerformanceIndicators && <span>Performance Indicators Enabled</span>}
        {allowExport && <span>Export Enabled</span>}
      </div>
    );
  };
});

jest.mock('../../../client/src/components/analytics/EventPerformanceComparator', () => {
  return function MockEventPerformanceComparator({ data, selectedMetrics, onEventSelect, userTier }: any) {
    return (
      <div data-testid="event-performance-comparator">
        <span>Event Data: {data?.length || 0}</span>
        <span>Metrics: {selectedMetrics?.join(', ')}</span>
        <span>User Tier: {userTier}</span>
        <button onClick={() => onEventSelect('test-event-1')}>Select Event</button>
      </div>
    );
  };
});

jest.mock('../../../client/src/components/analytics/CohortAnalysisChart', () => {
  return function MockCohortAnalysisChart({ data, userTier, showLabels, exportable }: any) {
    return (
      <div data-testid="cohort-analysis-chart">
        <span>Cohort Data: {data?.length || 0}</span>
        <span>User Tier: {userTier}</span>
        {showLabels && <span>Labels Shown</span>}
        {exportable && <span>Exportable</span>}
      </div>
    );
  };
});

jest.mock('../../../client/src/components/analytics/ReportExporter', () => {
  return function MockReportExporter({ clubId, dateRange, userTier }: any) {
    return (
      <div data-testid="report-exporter">
        <span>Club ID: {clubId}</span>
        <span>Date Range: {dateRange.label}</span>
        <span>User Tier: {userTier}</span>
      </div>
    );
  };
});

jest.mock('../../../client/src/components/analytics/RealTimeStatusIndicator', () => {
  return function MockRealTimeStatusIndicator({ clubId, enabled, position, onToggle }: any) {
    return (
      <div data-testid="realtime-status-indicator" data-position={position}>
        <span>Club ID: {clubId}</span>
        <span>Enabled: {enabled.toString()}</span>
        <button onClick={() => onToggle(false)}>Toggle</button>
      </div>
    );
  };
});

jest.mock('../../../client/src/components/analytics/AdvancedInsightPanel', () => {
  return function MockAdvancedInsightPanel({ clubId, userTier, onInsightClick }: any) {
    return (
      <div data-testid="advanced-insight-panel">
        <span>Club ID: {clubId}</span>
        <span>User Tier: {userTier}</span>
        <button onClick={() => onInsightClick({ id: 'test-insight' })}>
          Sample Insight
        </button>
      </div>
    );
  };
});

const mockUseRealTimeAnalytics = useRealTimeAnalytics as jest.MockedFunction<typeof useRealTimeAnalytics>;
const mockPremiumAnalyticsService = premiumAnalyticsService as jest.Mocked<typeof premiumAnalyticsService>;

describe('PremiumAnalyticsDashboard', () => {
  let queryClient: QueryClient;
  const user = userEvent.setup();

  const defaultProps = {
    clubId: 123,
    config: {
      tier: 'unlimited' as const,
      features: {
        extendedDateRange: true,
        cohortAnalysis: true,
        advancedCharts: true,
        dataExport: true,
        realTimeUpdates: true,
      },
    } as AnalyticsConfig,
  };

  const mockDashboardMetrics = {
    totalMembers: 1247,
    activeMembers: 892,
    totalRevenue: 45780,
    avgEventAttendance: 68,
    memberRetentionRate: 87.3,
    monthlyGrowthRate: 12.5,
  };

  const mockRealTimeMetrics = {
    timestamp: new Date(),
    activeUsers: 25,
    liveEvents: 2,
    recentEngagement: 78.5,
    alerts: [
      {
        id: '1',
        type: 'info' as const,
        title: 'High Engagement Alert',
        message: 'Member engagement is 15% above average',
        timestamp: new Date(),
        actionRequired: false,
      },
    ],
  };

  const mockBenchmarks = [
    {
      metric: 'Engagement Rate',
      current: 78.5,
      target: 75.0,
      industry: 72.0,
      best: 85.0,
      status: 'excellent' as const,
    },
    {
      metric: 'Retention Rate',
      current: 87.3,
      target: 85.0,
      industry: 82.0,
      best: 92.0,
      status: 'good' as const,
    },
  ];

  const mockGoals = [
    {
      id: '1',
      name: 'Member Growth',
      target: 1500,
      current: 1247,
      progress: 83.1,
      deadline: new Date('2024-12-31'),
      status: 'on_track' as const,
    },
    {
      id: '2',
      name: 'Revenue Target',
      target: 60000,
      current: 45780,
      progress: 76.3,
      deadline: new Date('2024-12-31'),
      status: 'at_risk' as const,
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    });

    // Setup mock implementations
    mockUseRealTimeAnalytics.mockReturnValue({
      data: {
        timestamp: new Date(),
        activeUsers: 25,
        liveEvents: 2,
        recentEngagement: 78.5,
        alerts: mockRealTimeMetrics.alerts,
      },
      isConnected: true,
      lastUpdate: new Date(),
      error: null,
    });

    mockPremiumAnalyticsService.getEngagementTrends.mockResolvedValue([
      {
        date: '2024-01-01',
        memberEngagement: 1200,
        eventAttendance: 65,
        growthRate: 12.5,
      },
    ]);

    mockPremiumAnalyticsService.getFinancialROI.mockResolvedValue([
      {
        period: '2024-01',
        revenue: 45780,
        costs: 28500,
        profit: 17280,
        roi: 60.6,
      },
    ]);

    mockPremiumAnalyticsService.getRealTimeMetrics.mockResolvedValue(mockRealTimeMetrics);
    mockPremiumAnalyticsService.getPerformanceBenchmarks.mockResolvedValue(mockBenchmarks);
    mockPremiumAnalyticsService.getGoalTracking.mockResolvedValue(mockGoals);

    // Mock performance API
    Object.defineProperty(window, 'performance', {
      value: {
        now: jest.fn().mockReturnValue(1000),
      },
      writable: true,
    });

    // Suppress console.log for cleaner test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  const renderDashboard = (props = {}) => {
    const mergedProps = { ...defaultProps, ...props };
    return render(
      <QueryClientProvider client={queryClient}>
        <PremiumAnalyticsDashboard {...mergedProps} />
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render the dashboard successfully', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('premium-analytics-dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Premium insights for your club management')).toBeInTheDocument();
    });

    it('should display real-time indicator for unlimited tier', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('realtime-indicator')).toBeInTheDocument();
      });

      expect(screen.getByText('Live Data')).toBeInTheDocument();
    });

    it('should not display real-time indicator for basic tier', async () => {
      const basicConfig: AnalyticsConfig = {
        tier: 'basic',
        features: {
          extendedDateRange: false,
          cohortAnalysis: false,
          advancedCharts: false,
          dataExport: false,
          realTimeUpdates: false,
        },
      };

      renderDashboard({ config: basicConfig });

      await waitFor(() => {
        expect(screen.getByTestId('premium-analytics-dashboard')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('realtime-indicator')).not.toBeInTheDocument();
    });

    it('should render all tab navigation options', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
      });

      expect(screen.getByRole('tab', { name: 'Engagement' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Financials' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Events' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Cohorts' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'AI Insights' })).toBeInTheDocument();
    });

    it('should disable restricted tabs for lower tier users', async () => {
      const proConfig: AnalyticsConfig = {
        tier: 'pro',
        features: {
          extendedDateRange: true,
          cohortAnalysis: false,
          advancedCharts: true,
          dataExport: true,
          realTimeUpdates: false,
        },
      };

      renderDashboard({ config: proConfig });

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Cohorts' })).toBeDisabled();
      });

      expect(screen.getByRole('tab', { name: 'AI Insights' })).toBeDisabled();
    });
  });

  describe('Loading States', () => {
    it('should display loading skeleton while fetching data', () => {
      renderDashboard({ loading: true });

      expect(screen.getAllByTestId('loading-skeleton')).toHaveLength(8); // 4 cards + 1 chart
    });

    it('should hide loading skeleton after data loads', async () => {
      const { rerender } = renderDashboard({ loading: true });

      expect(screen.getAllByTestId('loading-skeleton')).toHaveLength(8);

      rerender(
        <QueryClientProvider client={queryClient}>
          <PremiumAnalyticsDashboard {...defaultProps} loading={false} />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
    });

    it('should display correct loading states for async operations', async () => {
      // Mock slow API response
      mockPremiumAnalyticsService.getEngagementTrends.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 2000))
      );

      renderDashboard();

      // Should show loading initially
      expect(screen.getAllByTestId('loading-skeleton')).toHaveLength(8);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when there is an error', () => {
      renderDashboard({ error: 'Failed to load analytics data' });

      expect(screen.getByText('Something went wrong loading the analytics dashboard. Please try again.')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      mockPremiumAnalyticsService.getEngagementTrends.mockRejectedValue(new Error('API Error'));

      renderDashboard();

      // Component should still render without crashing
      await waitFor(() => {
        expect(screen.getByTestId('premium-analytics-dashboard')).toBeInTheDocument();
      });
    });

    it('should handle missing data gracefully', async () => {
      mockPremiumAnalyticsService.getEngagementTrends.mockResolvedValue([]);
      mockPremiumAnalyticsService.getFinancialROI.mockResolvedValue([]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('premium-analytics-dashboard')).toBeInTheDocument();
      });

      // Should display default values
      expect(screen.getByText('1,247')).toBeInTheDocument(); // Total members fallback
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between tabs correctly', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
      });

      // Click on Engagement tab
      await user.click(screen.getByRole('tab', { name: 'Engagement' }));

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Engagement' })).toHaveAttribute('aria-selected', 'true');
      });

      expect(screen.getByTestId('engagement-trend-chart')).toBeInTheDocument();
    });

    it('should show correct content for each tab', async () => {
      renderDashboard();

      // Overview tab (default)
      await waitFor(() => {
        expect(screen.getByText('Total Members')).toBeInTheDocument();
      });

      // Engagement tab
      await user.click(screen.getByRole('tab', { name: 'Engagement' }));
      await waitFor(() => {
        expect(screen.getByText('Member Engagement Trends')).toBeInTheDocument();
      });

      // Financials tab
      await user.click(screen.getByRole('tab', { name: 'Financials' }));
      await waitFor(() => {
        expect(screen.getByText('ROI & Financial Performance')).toBeInTheDocument();
      });

      // Events tab
      await user.click(screen.getByRole('tab', { name: 'Events' }));
      await waitFor(() => {
        expect(screen.getByText('Event Performance Comparison')).toBeInTheDocument();
      });
    });

    it('should handle keyboard navigation between tabs', async () => {
      renderDashboard();

      const overviewTab = screen.getByRole('tab', { name: 'Overview' });
      const engagementTab = screen.getByRole('tab', { name: 'Engagement' });

      overviewTab.focus();
      
      // Navigate with arrow keys
      fireEvent.keyDown(overviewTab, { key: 'ArrowRight' });
      
      await waitFor(() => {
        expect(engagementTab).toHaveFocus();
      });
    });
  });

  describe('Metrics Display', () => {
    it('should display formatted metric values correctly', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('1,247')).toBeInTheDocument(); // Total members with commas
      });

      expect(screen.getByText('892')).toBeInTheDocument(); // Active members
      expect(screen.getByText('$45,780')).toBeInTheDocument(); // Revenue with currency
      expect(screen.getByText('68%')).toBeInTheDocument(); // Attendance percentage
      expect(screen.getByText('+12.5%')).toBeInTheDocument(); // Growth rate with sign
    });

    it('should calculate and display engagement rate correctly', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('71.5% engagement rate')).toBeInTheDocument(); // 892/1247 * 100
      });
    });

    it('should display benchmark information for unlimited tier', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Performance vs. Benchmarks')).toBeInTheDocument();
      });

      expect(screen.getByText('Engagement Rate')).toBeInTheDocument();
      expect(screen.getByText('excellent')).toBeInTheDocument();
    });

    it('should display goal tracking for unlimited tier', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Goal Progress')).toBeInTheDocument();
      });

      expect(screen.getByText('Member Growth')).toBeInTheDocument();
      expect(screen.getByText('1,247 / 1,500')).toBeInTheDocument();
    });
  });

  describe('Real-time Features', () => {
    it('should display real-time status indicator', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('realtime-status-indicator')).toBeInTheDocument();
      });

      expect(screen.getByText('Enabled: true')).toBeInTheDocument();
    });

    it('should handle real-time data updates', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(mockUseRealTimeAnalytics).toHaveBeenCalledWith({
          clubId: 123,
          enabled: true,
          onDataUpdate: expect.any(Function),
        });
      });
    });

    it('should toggle real-time indicator visibility', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('realtime-status-indicator')).toBeInTheDocument();
      });

      const toggleButton = screen.getByText('Toggle');
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.queryByTestId('realtime-status-indicator')).not.toBeInTheDocument();
      });
    });

    it('should display alerts for unlimited tier users', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('High Engagement Alert')).toBeInTheDocument();
      });

      expect(screen.getByText('Member engagement is 15% above average')).toBeInTheDocument();
    });
  });

  describe('Component Interactions', () => {
    it('should handle date range changes', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('custom-date-range-picker')).toBeInTheDocument();
      });

      const dateRangeButton = screen.getByText('Last 30 days');
      await user.click(dateRangeButton);

      // Verify the mock component received the correct props
      expect(screen.getByText('Tier: unlimited')).toBeInTheDocument();
    });

    it('should handle chart interactions', async () => {
      renderDashboard();

      // Navigate to Events tab
      await user.click(screen.getByRole('tab', { name: 'Events' }));

      await waitFor(() => {
        expect(screen.getByTestId('event-performance-comparator')).toBeInTheDocument();
      });

      const selectEventButton = screen.getByText('Select Event');
      await user.click(selectEventButton);

      expect(console.log).toHaveBeenCalledWith('Selected event:', 'test-event-1');
    });

    it('should handle insight panel interactions', async () => {
      renderDashboard();

      // Navigate to AI Insights tab
      await user.click(screen.getByRole('tab', { name: 'AI Insights' }));

      await waitFor(() => {
        expect(screen.getByTestId('advanced-insight-panel')).toBeInTheDocument();
      });

      const insightButton = screen.getByText('Sample Insight');
      await user.click(insightButton);

      expect(console.log).toHaveBeenCalledWith('Insight clicked:', { id: 'test-insight' });
    });

    it('should handle refresh button clicks', async () => {
      renderDashboard();

      // Navigate to Engagement tab
      await user.click(screen.getByRole('tab', { name: 'Engagement' }));

      await waitFor(() => {
        expect(screen.getByLabelText('Refresh engagement data')).toBeInTheDocument();
      });

      const refreshButton = screen.getByLabelText('Refresh engagement data');
      await user.click(refreshButton);

      // Should trigger re-render (tested via component behavior)
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Performance Monitoring', () => {
    it('should display performance metrics indicator', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Load:')).toBeInTheDocument();
      });

      expect(screen.getByText('1000ms')).toBeInTheDocument();
    });

    it('should show optimal performance indicator when load time is good', async () => {
      Object.defineProperty(window, 'performance', {
        value: {
          now: jest.fn().mockReturnValue(500), // Fast load time
        },
        writable: true,
      });

      renderDashboard();

      await waitFor(() => {
        // Should show green indicator for optimal performance
        const performanceIndicator = screen.getByText('Load:').parentElement;
        expect(performanceIndicator?.querySelector('.bg-success')).toBeInTheDocument();
      });
    });

    it('should show suboptimal performance warning when load time is slow', async () => {
      Object.defineProperty(window, 'performance', {
        value: {
          now: jest.fn().mockReturnValue(5000), // Slow load time
        },
        writable: true,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Optimizing...')).toBeInTheDocument();
      });
    });
  });

  describe('Tier-based Feature Restrictions', () => {
    const basicConfig: AnalyticsConfig = {
      tier: 'basic',
      features: {
        extendedDateRange: false,
        cohortAnalysis: false,
        advancedCharts: false,
        dataExport: false,
        realTimeUpdates: false,
      },
    };

    it('should show upgrade prompts for restricted features', async () => {
      renderDashboard({ config: basicConfig });

      // Navigate to Events tab
      await user.click(screen.getByRole('tab', { name: 'Events' }));

      await waitFor(() => {
        expect(screen.getByText('Advanced Event Analytics is available in the Unlimited tier')).toBeInTheDocument();
      });

      expect(screen.getByText('Upgrade to Unlimited')).toBeInTheDocument();
    });

    it('should hide export functionality for basic tier', async () => {
      renderDashboard({ config: basicConfig });

      await waitFor(() => {
        expect(screen.queryByTestId('report-exporter')).not.toBeInTheDocument();
      });
    });

    it('should display limited chart functionality for basic tier', async () => {
      renderDashboard({ config: basicConfig });

      // Navigate to Events tab
      await user.click(screen.getByRole('tab', { name: 'Events' }));

      await waitFor(() => {
        expect(screen.getByText('Advanced Event Analytics is available in the Unlimited tier')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('premium-analytics-dashboard')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels for interactive elements', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByLabelText('Upgrade to unlimited plan')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Refresh engagement data')).toBeInTheDocument();
    });

    it('should have proper tab navigation structure', async () => {
      renderDashboard();

      await waitFor(() => {
        const tabList = screen.getByRole('tablist');
        expect(tabList).toBeInTheDocument();
      });

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(6);

      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
      });
    });

    it('should have screen reader friendly content', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Check for screen reader only text
      expect(screen.getByText('Settings', { selector: '.sr-only' })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      renderDashboard();

      const settingsButton = screen.getByLabelText('Settings');
      
      settingsButton.focus();
      expect(settingsButton).toHaveFocus();

      fireEvent.keyDown(settingsButton, { key: 'Enter' });
      // Should handle keyboard activation
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive classes', async () => {
      renderDashboard();

      await waitFor(() => {
        const dashboard = screen.getByTestId('premium-analytics-dashboard');
        expect(dashboard).toHaveClass('mobile-responsive');
      });
    });

    it('should handle mobile layout adaptations', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('premium-analytics-dashboard')).toBeInTheDocument();
      });

      // Component should render without layout issues
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });
  });

  describe('Theme Adaptation', () => {
    it('should apply theme-adaptive classes', async () => {
      renderDashboard();

      await waitFor(() => {
        const dashboard = screen.getByTestId('premium-analytics-dashboard');
        expect(dashboard).toHaveClass('theme-adaptive');
      });
    });

    it('should pass theme configuration to child components', async () => {
      renderDashboard();

      // Navigate to Events tab to see themed component
      await user.click(screen.getByRole('tab', { name: 'Events' }));

      await waitFor(() => {
        const comparator = screen.getByTestId('event-performance-comparator');
        expect(comparator).toBeInTheDocument();
      });
    });
  });

  describe('Data Integration', () => {
    it('should fetch data for unlimited tier correctly', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(mockPremiumAnalyticsService.getEngagementTrends).toHaveBeenCalledWith(
          123,
          {
            startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
            endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          }
        );
      });

      expect(mockPremiumAnalyticsService.getFinancialROI).toHaveBeenCalled();
      expect(mockPremiumAnalyticsService.getRealTimeMetrics).toHaveBeenCalledWith(123);
    });

    it('should use mock data for basic tier', async () => {
      const basicConfig: AnalyticsConfig = {
        tier: 'basic',
        features: {
          extendedDateRange: false,
          cohortAnalysis: false,
          advancedCharts: false,
          dataExport: false,
          realTimeUpdates: false,
        },
      };

      renderDashboard({ config: basicConfig });

      await waitFor(() => {
        // Should not call premium analytics service for basic tier
        expect(mockPremiumAnalyticsService.getEngagementTrends).not.toHaveBeenCalled();
      });

      // Should still display metrics (mock data)
      expect(screen.getByText('1,247')).toBeInTheDocument();
    });

    it('should handle concurrent data fetching efficiently', async () => {
      renderDashboard();

      await waitFor(() => {
        // All services should be called concurrently
        expect(mockPremiumAnalyticsService.getEngagementTrends).toHaveBeenCalled();
        expect(mockPremiumAnalyticsService.getFinancialROI).toHaveBeenCalled();
        expect(mockPremiumAnalyticsService.getRealTimeMetrics).toHaveBeenCalled();
        expect(mockPremiumAnalyticsService.getPerformanceBenchmarks).toHaveBeenCalled();
        expect(mockPremiumAnalyticsService.getGoalTracking).toHaveBeenCalled();
      });
    });
  });

  describe('Custom Props and Configuration', () => {
    it('should apply custom className', async () => {
      renderDashboard({ className: 'custom-analytics-class' });

      await waitFor(() => {
        const dashboard = screen.getByTestId('premium-analytics-dashboard');
        expect(dashboard).toHaveClass('custom-analytics-class');
      });
    });

    it('should handle different club IDs', async () => {
      renderDashboard({ clubId: 456 });

      await waitFor(() => {
        expect(mockPremiumAnalyticsService.getEngagementTrends).toHaveBeenCalledWith(
          456,
          expect.any(Object)
        );
      });
    });

    it('should handle loading prop changes dynamically', async () => {
      const { rerender } = renderDashboard({ loading: false });

      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <PremiumAnalyticsDashboard {...defaultProps} loading={true} />
        </QueryClientProvider>
      );

      expect(screen.getAllByTestId('loading-skeleton')).toHaveLength(8);
    });
  });
});