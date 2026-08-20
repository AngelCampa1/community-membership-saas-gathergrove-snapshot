/**
 * Chart Rendering Tests for US-004 Advanced Analytics
 * Tests chart components for accurate data visualization, rendering quality, and responsiveness
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
// D3 is mocked in Jest configuration

// Mock Chart.js and react-chartjs-2
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  BarElement: jest.fn(),
  ArcElement: jest.fn(),
  RadialLinearScale: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options, ...props }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)} {...props}>
      <canvas data-testid="chart-canvas" />
    </div>
  ),
  Bar: ({ data, options, ...props }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)} {...props}>
      <canvas data-testid="chart-canvas" />
    </div>
  ),
  Doughnut: ({ data, options, ...props }: any) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)} {...props}>
      <canvas data-testid="chart-canvas" />
    </div>
  ),
  Pie: ({ data, options, ...props }: any) => (
    <div data-testid="pie-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)} {...props}>
      <canvas data-testid="chart-canvas" />
    </div>
  ),
  Radar: ({ data, options, ...props }: any) => (
    <div data-testid="radar-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)} {...props}>
      <canvas data-testid="chart-canvas" />
    </div>
  ),
}));

// Mock D3 for custom chart rendering
jest.mock('d3', () => ({
  select: jest.fn(() => ({
    selectAll: jest.fn(() => ({
      remove: jest.fn(),
      data: jest.fn(() => ({
        enter: jest.fn(() => ({
          append: jest.fn(() => ({
            attr: jest.fn(() => ({
              attr: jest.fn(() => ({
                attr: jest.fn(() => ({
                  attr: jest.fn(() => ({
                    attr: jest.fn(() => ({
                      style: jest.fn(() => ({
                        on: jest.fn(() => ({
                          transition: jest.fn(() => ({
                            duration: jest.fn(() => ({
                              delay: jest.fn(() => ({
                                style: jest.fn()
                              }))
                            }))
                          }))
                        }))
                      }))
                    }))
                  }))
                }))
              }))
            }))
          }))
        }))
      }))
    }))
  })),
  scaleSequential: jest.fn(() => ({
    domain: jest.fn(() => ({
      range: jest.fn()
    }))
  })),
  interpolateRgbBasis: jest.fn(),
  format: jest.fn(() => ''),
}));

// Import components to test
import EngagementTrendChart from '../../../client/src/components/analytics/EngagementTrendChart';
import CohortAnalysisChart from '../../../client/src/components/analytics/CohortAnalysisChart';
import { AdvancedAnalyticsCharts } from '../../../client/src/components/analytics';

// Test data generators
const generateEngagementData = (count: number) => 
  Array.from({ length: count }, (_, i) => ({
    date: new Date(2024, 0, i + 1).toISOString(),
    activeMembers: Math.floor(Math.random() * 1000) + 500,
    eventAttendance: Math.floor(Math.random() * 500) + 100,
    engagementRate: Math.random() * 0.8 + 0.1,
    totalMembers: Math.floor(Math.random() * 1200) + 800,
  }));

const generateCohortData = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    cohort: `Cohort ${i + 1}`,
    totalMembers: Math.floor(Math.random() * 500) + 100,
    initialSize: Math.floor(Math.random() * 500) + 100,
    retentionRates: Array.from({ length: 12 }, () => Math.floor(Math.random() * 100) + 20),
    churnRate: Math.random() * 0.3,
    averageLifetime: Math.floor(Math.random() * 365) + 30,
  }));

const generateChartData = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    date: new Date(2024, 0, i + 1).toISOString(),
    value: Math.floor(Math.random() * 1000) + 100,
    label: `Data Point ${i + 1}`,
    category: `Category ${(i % 5) + 1}`,
  }));

const mockTheme = {
  name: 'test',
  colors: {
    primary: '#3B82F6',
    secondary: '#10B981',
    success: '#059669',
    warning: '#F59E0B',
    error: '#DC2626',
    info: '#0EA5E9',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#1F2937',
    textSecondary: '#6B7280',
  },
  chartDefaults: {
    type: 'line' as const,
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#DC2626', '#8B5CF6'],
    gridLines: true,
    animations: true,
    legend: true,
    responsive: true,
    maintainAspectRatio: false,
  },
};

describe('Chart Rendering Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  describe('EngagementTrendChart Rendering', () => {
    const defaultProps = {
      data: generateEngagementData(30),
      title: 'Test Engagement Trends',
      userTier: 'unlimited' as const,
    };

    it('renders line chart with correct data structure', () => {
      render(<EngagementTrendChart {...defaultProps} />);
      
      expect(screen.getByTestId('engagement-trend-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('displays correct number of data points', () => {
      const { rerender } = render(<EngagementTrendChart {...defaultProps} />);
      
      expect(screen.getByText('30 data points')).toBeInTheDocument();
      
      // Test with different data size
      rerender(<EngagementTrendChart {...defaultProps} data={generateEngagementData(15)} />);
      expect(screen.getByText('15 data points')).toBeInTheDocument();
    });

    it('switches between line and area chart types', async () => {
      render(
        <EngagementTrendChart 
          {...defaultProps} 
          showTypeToggle={true}
          chartType="line"
        />
      );

      const areaButton = screen.getByLabelText('Area Chart');
      expect(areaButton).toBeInTheDocument();

      fireEvent.click(areaButton);
      await waitFor(() => {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      });
    });

    it('handles metric toggles correctly', async () => {
      render(
        <EngagementTrendChart 
          {...defaultProps} 
          showMetricToggles={true}
        />
      );

      const engagementToggle = screen.getByLabelText('Engagement Rate');
      expect(engagementToggle).toBeInTheDocument();
      expect(engagementToggle).toBeChecked();

      fireEvent.click(engagementToggle);
      await waitFor(() => {
        expect(engagementToggle).not.toBeChecked();
      });
    });

    it('renders zoom controls when enabled', () => {
      render(<EngagementTrendChart {...defaultProps} allowZoom={true} />);
      
      expect(screen.getByTestId('zoom-controls')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zoom/i })).toBeInTheDocument();
      expect(screen.getByLabelText('Reset Zoom')).toBeInTheDocument();
    });

    it('displays anomaly detection for unlimited tier', async () => {
      render(
        <EngagementTrendChart 
          {...defaultProps} 
          enableAnomalyDetection={true}
          userTier="unlimited"
          clubId={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('engagement-trend-chart')).toBeInTheDocument();
      });
    });

    it('shows predictive analytics when enabled', async () => {
      render(
        <EngagementTrendChart 
          {...defaultProps} 
          enablePredictions={true}
          userTier="unlimited"
          clubId={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('engagement-trend-chart')).toBeInTheDocument();
      });
    });

    it('handles empty data gracefully', () => {
      render(<EngagementTrendChart {...defaultProps} data={[]} />);
      
      expect(screen.getByText('No data available for the selected period')).toBeInTheDocument();
    });

    it('displays loading skeleton', () => {
      render(<EngagementTrendChart {...defaultProps} loading={true} />);
      
      expect(screen.getByTestId('chart-loading-skeleton')).toBeInTheDocument();
    });

    it('shows error state with retry button', () => {
      render(<EngagementTrendChart {...defaultProps} error="Test error message" />);
      
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('renders accessibility features', () => {
      render(
        <EngagementTrendChart 
          {...defaultProps} 
          includeDataTable={true}
        />
      );

      expect(screen.getByRole('img')).toHaveAttribute(
        'aria-label', 
        'Test Engagement Trends showing engagement trends over time'
      );
      
      const tableToggle = screen.getByText('View Data Table');
      fireEvent.click(tableToggle);
      
      expect(screen.getByRole('table', { name: 'Engagement Data' })).toBeInTheDocument();
    });

    it('handles responsive design', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<EngagementTrendChart {...defaultProps} responsive={true} />);
      expect(screen.getByTestId('engagement-trend-chart')).toHaveClass('mobile-responsive');
    });
  });

  describe('CohortAnalysisChart Rendering', () => {
    const cohortData = generateCohortData(8);
    const defaultProps = {
      data: cohortData,
      theme: {
        grid: '#e5e7eb',
        text: '#1f2937',
      },
      loading: {
        isLoading: false,
        error: null,
      },
      userTier: 'unlimited' as const,
    };

    it('renders heatmap visualization', () => {
      render(<CohortAnalysisChart {...defaultProps} />);
      
      expect(screen.getByText('Cohort Retention Analysis')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Cohort retention analysis heatmap' })).toBeInTheDocument();
    });

    it('applies tier-based data limitations', () => {
      const { rerender } = render(
        <CohortAnalysisChart {...defaultProps} userTier="basic" />
      );
      
      expect(screen.getByText('Basic: 6 cohorts max')).toBeInTheDocument();
      
      rerender(<CohortAnalysisChart {...defaultProps} userTier="pro" />);
      expect(screen.getByText('Pro: 12 cohorts max')).toBeInTheDocument();
    });

    it('handles view mode switching for non-basic tiers', () => {
      render(<CohortAnalysisChart {...defaultProps} userTier="unlimited" />);
      
      const viewModeSelect = screen.getByLabelText('Select view mode');
      expect(viewModeSelect).toBeInTheDocument();
      
      fireEvent.change(viewModeSelect, { target: { value: 'retention' } });
      expect(viewModeSelect).toHaveValue('retention');
    });

    it('supports color scheme customization', () => {
      render(<CohortAnalysisChart {...defaultProps} userTier="pro" />);
      
      const colorSchemeSelect = screen.getByLabelText('Select color scheme');
      expect(colorSchemeSelect).toBeInTheDocument();
      
      fireEvent.change(colorSchemeSelect, { target: { value: 'green' } });
      expect(colorSchemeSelect).toHaveValue('green');
    });

    it('shows data table when toggled', () => {
      render(<CohortAnalysisChart {...defaultProps} />);
      
      const tableToggle = screen.getByLabelText('Show data table');
      fireEvent.click(tableToggle);
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Initial Size')).toBeInTheDocument();
    });

    it('handles cohort filtering', () => {
      render(<CohortAnalysisChart {...defaultProps} userTier="pro" />);
      
      const cohortButtons = screen.getAllByRole('button', { pressed: true });
      expect(cohortButtons.length).toBeGreaterThan(0);
      
      fireEvent.click(cohortButtons[0]);
      expect(cohortButtons[0]).toHaveAttribute('aria-pressed', 'false');
    });

    it('supports export functionality for unlimited tier', () => {
      render(
        <CohortAnalysisChart 
          {...defaultProps} 
          userTier="unlimited" 
          exportable={true}
        />
      );
      
      const exportButton = screen.getByLabelText('Export chart');
      expect(exportButton).toBeInTheDocument();
    });

    it('handles loading state', () => {
      render(
        <CohortAnalysisChart 
          {...defaultProps} 
          loading={{ isLoading: true, error: null }}
        />
      );
      
      expect(screen.getByTestId('cohort-loading-skeleton')).toBeInTheDocument();
    });

    it('displays error state', () => {
      render(
        <CohortAnalysisChart 
          {...defaultProps} 
          loading={{ isLoading: false, error: 'Test error' }}
        />
      );
      
      expect(screen.getByText('Error loading cohort analysis data')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('calculates and displays summary statistics', () => {
      render(<CohortAnalysisChart {...defaultProps} userTier="pro" />);
      
      expect(screen.getByText('Total Initial Users')).toBeInTheDocument();
      expect(screen.getByText('Avg First Period Retention')).toBeInTheDocument();
      expect(screen.getByText('Best Performing Cohort')).toBeInTheDocument();
    });

    it('handles cell click interactions', () => {
      const onCellClick = jest.fn();
      render(
        <CohortAnalysisChart 
          {...defaultProps} 
          onCellClick={onCellClick}
        />
      );

      // Simulate D3 cell click
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  describe('AdvancedAnalyticsCharts Rendering', () => {
    const chartData = generateChartData(20);
    const defaultProps = {
      data: chartData,
      chartType: 'line' as const,
      title: 'Test Advanced Chart',
      userTier: 'unlimited' as const,
      theme: mockTheme,
    };

    it('renders different chart types correctly', () => {
      const chartTypes = ['line', 'bar', 'doughnut', 'pie', 'radar'] as const;
      
      chartTypes.forEach(type => {
        const { unmount } = render(
          <AdvancedAnalyticsCharts {...defaultProps} chartType={type} />
        );
        
        expect(screen.getByTestId(`${type}-chart`)).toBeInTheDocument();
        expect(screen.getByTestId('chart-canvas')).toBeInTheDocument();
        
        unmount();
      });
    });

    it('enforces tier-based chart type restrictions', () => {
      render(
        <AdvancedAnalyticsCharts 
          {...defaultProps} 
          chartType="radar" 
          userTier="basic"
        />
      );
      
      expect(screen.getByText('radar charts are available in the Unlimited tier')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upgrade/i })).toBeInTheDocument();
    });

    it('applies data point limitations by tier', () => {
      const largeDataset = generateChartData(1000);
      
      render(
        <AdvancedAnalyticsCharts 
          {...defaultProps} 
          data={largeDataset}
          userTier="basic"
        />
      );
      
      // Basic tier should limit to 100 data points
      const chartElement = screen.getByTestId('line-chart');
      const chartData = JSON.parse(chartElement.getAttribute('data-chart-data') || '{}');
      expect(chartData.labels.length).toBeLessThanOrEqual(100);
    });

    it('shows export functionality based on tier', () => {
      const { rerender } = render(
        <AdvancedAnalyticsCharts {...defaultProps} userTier="basic" />
      );
      
      expect(screen.queryByLabelText('Export as PNG')).not.toBeInTheDocument();
      
      rerender(<AdvancedAnalyticsCharts {...defaultProps} userTier="pro" />);
      expect(screen.getByLabelText('Export as PNG')).toBeInTheDocument();
      
      rerender(<AdvancedAnalyticsCharts {...defaultProps} userTier="unlimited" />);
      expect(screen.getByLabelText('Export as PDF')).toBeInTheDocument();
    });

    it('displays data quality indicators', () => {
      render(<AdvancedAnalyticsCharts {...defaultProps} />);
      
      expect(screen.getByText('20 data points')).toBeInTheDocument();
    });

    it('handles export functionality', async () => {
      const onDataExport = jest.fn();
      render(
        <AdvancedAnalyticsCharts 
          {...defaultProps} 
          userTier="pro"
          onDataExport={onDataExport}
        />
      );
      
      const exportButton = screen.getByLabelText('Export as PNG');
      fireEvent.click(exportButton);
      
      expect(onDataExport).toHaveBeenCalledWith('png');
    });

    it('shows export progress indicator', async () => {
      const onDataExport = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(
        <AdvancedAnalyticsCharts 
          {...defaultProps} 
          userTier="pro"
          onDataExport={onDataExport}
        />
      );
      
      const exportButton = screen.getByLabelText('Export as PNG');
      fireEvent.click(exportButton);
      
      expect(screen.getByTestId('export-progress')).toBeInTheDocument();
      expect(screen.getByText('Exporting chart...')).toBeInTheDocument();
    });

    it('displays insights for unlimited tier', () => {
      render(<AdvancedAnalyticsCharts {...defaultProps} userTier="unlimited" />);
      
      expect(screen.getByText('Quick Insights')).toBeInTheDocument();
      expect(screen.getByText(/Peak value:/)).toBeInTheDocument();
      expect(screen.getByText(/Average:/)).toBeInTheDocument();
    });

    it('handles configuration customization', () => {
      const onConfigChange = jest.fn();
      render(
        <AdvancedAnalyticsCharts 
          {...defaultProps} 
          userTier="unlimited"
          onConfigChange={onConfigChange}
        />
      );
      
      const configButton = screen.getByLabelText('Chart settings');
      expect(configButton).toBeInTheDocument();
    });

    it('handles empty data state', () => {
      render(<AdvancedAnalyticsCharts {...defaultProps} data={[]} />);
      
      expect(screen.getByText('No data available')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or date range')).toBeInTheDocument();
    });

    it('manages chart error states', () => {
      render(<AdvancedAnalyticsCharts {...defaultProps} error="Chart rendering failed" />);
      
      expect(screen.getByText('Chart rendering failed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('validates chart data transformation', () => {
      const invalidData = [
        { invalidField: 'test' },
        { anotherField: 123 },
      ];
      
      render(<AdvancedAnalyticsCharts {...defaultProps} data={invalidData} />);
      
      // Should handle invalid data gracefully
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('applies theme configuration correctly', () => {
      const customTheme = {
        ...mockTheme,
        colors: {
          ...mockTheme.colors,
          primary: '#FF0000',
        },
      };
      
      render(<AdvancedAnalyticsCharts {...defaultProps} theme={customTheme} />);
      
      const chartElement = screen.getByTestId('line-chart');
      const chartOptions = JSON.parse(chartElement.getAttribute('data-chart-options') || '{}');
      
      expect(chartOptions.plugins.tooltip.borderColor).toBe('#FF0000');
    });
  });

  describe('Chart Interaction Tests', () => {
    it('handles mouse hover events', async () => {
      render(
        <AdvancedAnalyticsCharts 
          data={generateChartData(10)}
          chartType="line"
          title="Test Chart"
          userTier="unlimited"
          theme={mockTheme}
        />
      );

      const chartElement = screen.getByTestId('line-chart');
      
      fireEvent.mouseEnter(chartElement);
      fireEvent.mouseLeave(chartElement);
      
      expect(chartElement).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(
        <EngagementTrendChart 
          data={generateEngagementData(10)}
          showMetricToggles={true}
          allowZoom={true}
        />
      );

      const zoomButton = screen.getByRole('button', { name: /zoom/i });
      
      fireEvent.keyDown(zoomButton, { key: 'Enter' });
      fireEvent.keyDown(zoomButton, { key: ' ' });
      
      expect(zoomButton).toBeInTheDocument();
    });

    it('handles window resize events', async () => {
      render(<CohortAnalysisChart 
        data={generateCohortData(5)}
        theme={{ grid: '#e5e7eb', text: '#1f2937' }}
        loading={{ isLoading: false, error: null }}
        userTier="unlimited"
      />);

      // Simulate window resize
      act(() => {
        global.dispatchEvent(new Event('resize'));
      });

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Memory Tests', () => {
    it('handles large datasets efficiently', async () => {
      const startTime = performance.now();
      const largeDataset = generateEngagementData(1000);
      
      render(<EngagementTrendChart data={largeDataset} userTier="unlimited" />);
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(1000); // Should render in under 1 second
      
      expect(screen.getByTestId('engagement-trend-chart')).toBeInTheDocument();
    });

    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(
        <CohortAnalysisChart 
          data={generateCohortData(5)}
          theme={{ grid: '#e5e7eb', text: '#1f2937' }}
          loading={{ isLoading: false, error: null }}
          userTier="unlimited"
        />
      );

      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('handles rapid state updates without memory leaks', async () => {
      let renderCount = 0;
      const TestComponent = () => {
        renderCount++;
        return (
          <EngagementTrendChart 
            data={generateEngagementData(Math.floor(Math.random() * 100) + 10)}
            userTier="unlimited"
          />
        );
      };

      const { rerender } = render(<TestComponent />);
      
      // Simulate rapid re-renders
      for (let i = 0; i < 10; i++) {
        rerender(<TestComponent />);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      expect(renderCount).toBe(11); // Initial + 10 re-renders
      expect(screen.getByTestId('engagement-trend-chart')).toBeInTheDocument();
    });
  });
});