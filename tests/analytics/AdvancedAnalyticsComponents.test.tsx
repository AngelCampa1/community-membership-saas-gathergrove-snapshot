/**
 * @fileoverview TDD Test Suite for US-004 Advanced Analytics Components
 * Tests all missing analytics functionality with proper authentication checks
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { jest } from '@jest/globals';

// Mock Chart.js and React-Chartjs-2
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
    defaults: {
      font: {},
      color: '#666',
    },
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options, ...props }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} {...props}>
      <canvas />
    </div>
  ),
  Bar: ({ data, options, ...props }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} {...props}>
      <canvas />
    </div>
  ),
  Doughnut: ({ data, options, ...props }: any) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)} {...props}>
      <canvas />
    </div>
  ),
}));

// Mock file export libraries
jest.mock('jspdf', () => ({
  jsPDF: jest.fn(() => ({
    text: jest.fn(),
    save: jest.fn(),
    addImage: jest.fn(),
    internal: {
      pageSize: { width: 210, height: 297 }
    }
  }))
}));

jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

// Component imports (will be implemented after tests)
import { AdvancedAnalyticsCharts } from '../../client/src/components/analytics';
import { DataExportManager } from '../../client/src/components/analytics/DataExportManager';
import { TierAwareAnalyticsDashboard } from '../../client/src/components/analytics/TierAwareAnalyticsDashboard';
import { RealTimeMetricsWidget } from '../../client/src/components/analytics/RealTimeMetricsWidget';
import { ChartConfigurationManager } from '../../client/src/components/analytics/ChartConfigurationManager';

// Mock data and utilities
const mockAnalyticsData = {
  engagementTrends: [
    { date: '2024-01-01', activeMembers: 100, eventAttendance: 75, engagementRate: 0.85 },
    { date: '2024-01-02', activeMembers: 105, eventAttendance: 80, engagementRate: 0.87 },
  ],
  roiMetrics: [
    { period: '2024-01', revenue: 10000, costs: 7000, profit: 3000, roi: 0.43 },
    { period: '2024-02', revenue: 12000, costs: 7500, profit: 4500, roi: 0.6 },
  ],
  eventPerformance: [
    { eventId: '1', eventName: 'Test Event', attendance: 50, revenue: 5000, satisfaction: 4.5 },
  ],
};

const mockUnlimitedUser = {
  clubId: 1,
  clubTier: 'Enterprise',
  permissions: ['analytics:advanced', 'data:export'],
};

const mockBasicUser = {
  clubId: 1,
  clubTier: 'Free',
  permissions: ['analytics:basic'],
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('US-004 Advanced Analytics Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AdvancedAnalyticsCharts Component', () => {
    it('should render Chart.js line chart with proper data', async () => {
      render(
        <TestWrapper>
          <AdvancedAnalyticsCharts
            data={mockAnalyticsData.engagementTrends}
            chartType="line"
            title="Engagement Trends"
            userTier="unlimited"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      const chart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '{}');
      
      expect(chartData.labels).toContain('2024-01-01');
      expect(chartData.datasets).toHaveLength(1);
    });

    it('should show upgrade prompt for basic tier users', () => {
      render(
        <TestWrapper>
          <AdvancedAnalyticsCharts
            data={mockAnalyticsData.engagementTrends}
            chartType="line"
            title="Advanced Chart"
            userTier="basic"
          />
        </TestWrapper>
      );

      expect(screen.getByText(/upgrade to unlimited/i)).toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });

    it('should handle different chart types correctly', async () => {
      const { rerender } = render(
        <TestWrapper>
          <AdvancedAnalyticsCharts
            data={mockAnalyticsData.roiMetrics}
            chartType="bar"
            title="ROI Metrics"
            userTier="unlimited"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });

      rerender(
        <TestWrapper>
          <AdvancedAnalyticsCharts
            data={mockAnalyticsData.roiMetrics}
            chartType="doughnut"
            title="Revenue Distribution"
            userTier="unlimited"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
      });
    });

    it('should display loading state properly', () => {
      render(
        <TestWrapper>
          <AdvancedAnalyticsCharts
            data={[]}
            chartType="line"
            title="Loading Chart"
            userTier="unlimited"
            loading={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('chart-loading-skeleton')).toBeInTheDocument();
    });

    it('should handle chart errors gracefully', () => {
      render(
        <TestWrapper>
          <AdvancedAnalyticsCharts
            data={null as any}
            chartType="line"
            title="Error Chart"
            userTier="unlimited"
            error="Failed to load chart data"
          />
        </TestWrapper>
      );

      expect(screen.getByText(/failed to load chart data/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('DataExportManager Component', () => {
    it('should render export options for unlimited tier', () => {
      render(
        <TestWrapper>
          <DataExportManager
            data={mockAnalyticsData}
            userTier="unlimited"
            onExport={jest.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export excel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
    });

    it('should restrict export options for basic tier', () => {
      render(
        <TestWrapper>
          <DataExportManager
            data={mockAnalyticsData}
            userTier="basic"
            onExport={jest.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /export pdf/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /export excel/i })).not.toBeInTheDocument();
    });

    it('should trigger PDF export when clicked', async () => {
      const user = userEvent.setup();
      const mockOnExport = jest.fn();

      render(
        <TestWrapper>
          <DataExportManager
            data={mockAnalyticsData}
            userTier="unlimited"
            onExport={mockOnExport}
          />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /export pdf/i }));

      expect(mockOnExport).toHaveBeenCalledWith('pdf', mockAnalyticsData);
    });

    it('should show export progress indicator', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <DataExportManager
            data={mockAnalyticsData}
            userTier="unlimited"
            onExport={jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)))}
          />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /export pdf/i }));

      expect(screen.getByTestId('export-progress')).toBeInTheDocument();
    });

    it('should handle export errors gracefully', async () => {
      const user = userEvent.setup();
      const mockOnExport = jest.fn().mockRejectedValue(new Error('Export failed'));

      render(
        <TestWrapper>
          <DataExportManager
            data={mockAnalyticsData}
            userTier="unlimited"
            onExport={mockOnExport}
          />
        </TestWrapper>
      );

      await user.click(screen.getByRole('button', { name: /export pdf/i }));

      await waitFor(() => {
        expect(screen.getByText(/export failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('TierAwareAnalyticsDashboard Component', () => {
    it('should render unlimited features for enterprise tier', () => {
      render(
        <TestWrapper>
          <TierAwareAnalyticsDashboard
            user={mockUnlimitedUser}
            analyticsData={mockAnalyticsData}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('advanced-charts-section')).toBeInTheDocument();
      expect(screen.getByTestId('export-manager')).toBeInTheDocument();
      expect(screen.getByTestId('realtime-metrics')).toBeInTheDocument();
    });

    it('should show limited features for basic tier', () => {
      render(
        <TestWrapper>
          <TierAwareAnalyticsDashboard
            user={mockBasicUser}
            analyticsData={mockAnalyticsData}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('basic-charts-section')).toBeInTheDocument();
      expect(screen.queryByTestId('advanced-charts-section')).not.toBeInTheDocument();
      expect(screen.getByText(/upgrade to unlock advanced analytics/i)).toBeInTheDocument();
    });

    it('should handle authentication state changes', async () => {
      const { rerender } = render(
        <TestWrapper>
          <TierAwareAnalyticsDashboard
            user={mockBasicUser}
            analyticsData={mockAnalyticsData}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/upgrade to unlock/i)).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <TierAwareAnalyticsDashboard
            user={mockUnlimitedUser}
            analyticsData={mockAnalyticsData}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('advanced-charts-section')).toBeInTheDocument();
      });
    });

    it('should track analytics feature usage', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TierAwareAnalyticsDashboard
            user={mockUnlimitedUser}
            analyticsData={mockAnalyticsData}
          />
        </TestWrapper>
      );

      await user.click(screen.getByRole('tab', { name: /engagement/i }));

      // Should track tab navigation
      expect(screen.getByRole('tabpanel')).toHaveAttribute('data-tab', 'engagement');
    });
  });

  describe('RealTimeMetricsWidget Component', () => {
    it('should display live metrics for unlimited tier', () => {
      render(
        <TestWrapper>
          <RealTimeMetricsWidget
            clubId={1}
            userTier="unlimited"
            enabled={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('realtime-indicator')).toBeInTheDocument();
      expect(screen.getByText(/live data/i)).toBeInTheDocument();
    });

    it('should show disabled state for basic tier', () => {
      render(
        <TestWrapper>
          <RealTimeMetricsWidget
            clubId={1}
            userTier="basic"
            enabled={false}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('realtime-disabled')).toBeInTheDocument();
      expect(screen.getByText(/real-time features available in unlimited tier/i)).toBeInTheDocument();
    });

    it('should handle connection status changes', async () => {
      render(
        <TestWrapper>
          <RealTimeMetricsWidget
            clubId={1}
            userTier="unlimited"
            enabled={true}
          />
        </TestWrapper>
      );

      // Initially connected
      expect(screen.getByTestId('connection-status-connected')).toBeInTheDocument();

      // Simulate disconnection
      await act(async () => {
        fireEvent(window, new Event('offline'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status-disconnected')).toBeInTheDocument();
      });
    });

    it('should update metrics in real-time', async () => {
      jest.useFakeTimers();

      render(
        <TestWrapper>
          <RealTimeMetricsWidget
            clubId={1}
            userTier="unlimited"
            enabled={true}
          />
        </TestWrapper>
      );

      const initialValue = screen.getByTestId('live-users-count').textContent;

      // Fast-forward time to trigger update
      act(() => {
        jest.advanceTimersByTime(30000); // 30 seconds
      });

      await waitFor(() => {
        const updatedValue = screen.getByTestId('live-users-count').textContent;
        expect(updatedValue).not.toBe(initialValue);
      });

      jest.useRealTimers();
    });
  });

  describe('ChartConfigurationManager Component', () => {
    it('should allow chart customization for unlimited tier', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ChartConfigurationManager
            chartConfig={{
              type: 'line',
              colors: ['#3B82F6', '#10B981'],
              gridLines: true,
              animations: true,
            }}
            userTier="unlimited"
            onConfigChange={jest.fn()}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('chart-type-selector')).toBeInTheDocument();
      expect(screen.getByTestId('color-picker')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /change chart type/i }));
      expect(screen.getByRole('option', { name: /bar chart/i })).toBeInTheDocument();
    });

    it('should restrict configuration for basic tier', () => {
      render(
        <TestWrapper>
          <ChartConfigurationManager
            chartConfig={{
              type: 'line',
              colors: ['#3B82F6'],
              gridLines: true,
              animations: false,
            }}
            userTier="basic"
            onConfigChange={jest.fn()}
          />
        </TestWrapper>
      );

      expect(screen.queryByTestId('chart-type-selector')).not.toBeInTheDocument();
      expect(screen.getByText(/chart customization available in unlimited tier/i)).toBeInTheDocument();
    });

    it('should save configuration changes', async () => {
      const user = userEvent.setup();
      const mockOnConfigChange = jest.fn();

      render(
        <TestWrapper>
          <ChartConfigurationManager
            chartConfig={{
              type: 'line',
              colors: ['#3B82F6'],
              gridLines: true,
              animations: true,
            }}
            userTier="unlimited"
            onConfigChange={mockOnConfigChange}
          />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('animations-toggle'));

      expect(mockOnConfigChange).toHaveBeenCalledWith({
        type: 'line',
        colors: ['#3B82F6'],
        gridLines: true,
        animations: false,
      });
    });
  });

  describe('Integration Tests', () => {
    it('should integrate all components in unlimited dashboard', async () => {
      render(
        <TestWrapper>
          <TierAwareAnalyticsDashboard
            user={mockUnlimitedUser}
            analyticsData={mockAnalyticsData}
          />
        </TestWrapper>
      );

      // Should render all unlimited features
      expect(screen.getByTestId('advanced-charts-section')).toBeInTheDocument();
      expect(screen.getByTestId('export-manager')).toBeInTheDocument();
      expect(screen.getByTestId('realtime-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('chart-configuration')).toBeInTheDocument();

      // Charts should be interactive
      const charts = screen.getAllByTestId(/chart$/);
      expect(charts.length).toBeGreaterThan(0);

      // Export should be functional
      expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument();
    });

    it('should handle data loading states across components', async () => {
      render(
        <TestWrapper>
          <TierAwareAnalyticsDashboard
            user={mockUnlimitedUser}
            analyticsData={null}
            loading={true}
          />
        </TestWrapper>
      );

      // All components should show loading states
      expect(screen.getAllByTestId('chart-loading-skeleton')).toHaveLength(
        expect.any(Number)
      );
      expect(screen.getByTestId('export-loading')).toBeInTheDocument();
    });

    it('should handle errors gracefully across components', async () => {
      render(
        <TestWrapper>
          <TierAwareAnalyticsDashboard
            user={mockUnlimitedUser}
            analyticsData={null}
            error="Failed to load analytics data"
          />
        </TestWrapper>
      );

      expect(screen.getByText(/failed to load analytics data/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper ARIA labels on all interactive elements', () => {
      render(
        <TestWrapper>
          <TierAwareAnalyticsDashboard
            user={mockUnlimitedUser}
            analyticsData={mockAnalyticsData}
          />
        </TestWrapper>
      );

      // Check for ARIA labels
      expect(screen.getByRole('button', { name: /export pdf/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(expect.any(Number));
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TierAwareAnalyticsDashboard
            user={mockUnlimitedUser}
            analyticsData={mockAnalyticsData}
          />
        </TestWrapper>
      );

      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement).toHaveAttribute('role', 'tab');

      await user.keyboard('{ArrowRight}');
      // Should move to next tab
      expect(document.activeElement).toHaveAttribute('role', 'tab');
    });

    it('should announce screen reader updates', async () => {
      render(
        <TestWrapper>
          <RealTimeMetricsWidget
            clubId={1}
            userTier="unlimited"
            enabled={true}
          />
        </TestWrapper>
      );

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Performance Tests', () => {
    it('should render large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        activeMembers: Math.floor(Math.random() * 1000),
        eventAttendance: Math.floor(Math.random() * 100),
        engagementRate: Math.random(),
      }));

      const startTime = performance.now();

      render(
        <TestWrapper>
          <AdvancedAnalyticsCharts
            data={largeDataset}
            chartType="line"
            title="Large Dataset Chart"
            userTier="unlimited"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 3 seconds for large datasets
      expect(renderTime).toBeLessThan(3000);
    });

    it('should handle concurrent export operations', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <DataExportManager
            data={mockAnalyticsData}
            userTier="unlimited"
            onExport={jest.fn(() => new Promise(resolve => setTimeout(resolve, 50)))}
          />
        </TestWrapper>
      );

      // Trigger multiple exports simultaneously
      const promises = [
        user.click(screen.getByRole('button', { name: /export pdf/i })),
        user.click(screen.getByRole('button', { name: /export excel/i })),
        user.click(screen.getByRole('button', { name: /export csv/i })),
      ];

      await Promise.all(promises);

      // Should handle all exports without errors
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });
});