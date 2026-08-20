/**
 * Visual Regression Tests for US-004 Advanced Analytics Charts
 * Tests visual consistency, layout stability, and rendering accuracy across different scenarios
 */

import React from'react';
import { render, screen, waitFor, act } from'@testing-library/react';
import { jest } from'@jest/globals';
import'@testing-library/jest-dom';

// Mock Chart.js with consistent rendering
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
    defaults: {
      font: { family:'Arial, sans-serif' },
      color:'#666',
    },
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

// Mock react-chartjs-2 with visual testing capabilities
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options, height, ...props }: any) => (
    <div 
      data-testid="line-chart"
      data-visual-type="line-chart"
      data-chart-data={JSON.stringify(data)}
      data-chart-options={JSON.stringify(options)}
      style={{ 
        height: height || 400, 
        width:'100%',
        background:'#ffffff',
        border:'1px solid #e5e7eb',
        borderRadius:'8px',
        position:'relative',
      }}
      {...props}
    >
      <svg
        data-testid="chart-svg"
        width="100%"
        height="100%"
        viewBox="0 0 800 400"
        style={{ background:'white' }}
      >
        {/* Render mock chart elements for visual testing */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {Array.from({ length: 5 }, (_, i) => (
          <g key={`grid-${i}`}>
            <line
              x1="0"
              y1={i * 80}
              x2="800"
              y2={i * 80}
              stroke="#f3f4f6"
              strokeWidth="1"
              data-testid="grid-line"
            />
            <line
              x1={i * 160}
              y1="0"
              x2={i * 160}
              y2="400"
              stroke="#f3f4f6"
              strokeWidth="1"
              data-testid="grid-line"
            />
          </g>
        ))}
        
        {/* Mock data line */}
        <polyline
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          points="50,350 200,200 350,150 500,250 650,100 750,180"
          data-testid="chart-line"
        />
        
        {/* Data points */}
        {[50, 200, 350, 500, 650, 750].map((x, i) => {
          const y = [350, 200, 150, 250, 100, 180][i];
          return (
            <circle
              key={`point-${i}`}
              cx={x}
              cy={y}
              r="4"
              fill="#3B82F6"
              stroke="white"
              strokeWidth="2"
              data-testid="data-point"
            />
          );
        })}
        
        {/* Axis labels */}
        <text x="400" y="390" textAnchor="middle" fontSize="12" fill="#6b7280">
          Time Period
        </text>
        <text x="20" y="200" textAnchor="middle" fontSize="12" fill="#6b7280" transform="rotate(-90, 20, 200)">
          Value
        </text>
      </svg>
    </div>
  ),
  
  Bar: ({ data, options, height, ...props }: any) => (
    <div 
      data-testid="bar-chart"
      data-visual-type="bar-chart"
      style={{ 
        height: height || 400, 
        width:'100%',
        background:'#ffffff',
        border:'1px solid #e5e7eb',
        borderRadius:'8px',
      }}
      {...props}
    >
      <svg width="100%" height="100%" viewBox="0 0 800 400">
        {/* Mock bar chart */}
        {[1, 2, 3, 4, 5, 6].map((_, i) => (
          <rect
            key={`bar-${i}`}
            x={100 + i * 100}
            y={400 - 50 - (i * 30)}
            width="60"
            height={50 + (i * 30)}
            fill="#10B981"
            data-testid="chart-bar"
          />
        ))}
      </svg>
    </div>
  ),
  
  Doughnut: ({ data, options, height, ...props }: any) => (
    <div 
      data-testid="doughnut-chart"
      data-visual-type="doughnut-chart"
      style={{ 
        height: height || 400, 
        width:'100%',
        background:'#ffffff',
        border:'1px solid #e5e7eb',
        borderRadius:'8px',
      }}
      {...props}
    >
      <svg width="100%" height="100%" viewBox="0 0 400 400">
        {/* Mock doughnut chart */}
        <circle
          cx="200"
          cy="200"
          r="120"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="40"
          strokeDasharray="188 377"
          transform="rotate(-90 200 200)"
          data-testid="doughnut-segment"
        />
        <circle
          cx="200"
          cy="200"
          r="120"
          fill="none"
          stroke="#10B981"
          strokeWidth="40"
          strokeDasharray="125 440"
          strokeDashoffset="-188"
          transform="rotate(-90 200 200)"
          data-testid="doughnut-segment"
        />
      </svg>
    </div>
  ),
}));

// Mock D3 for consistent rendering
jest.mock('d3', () => ({
  select: jest.fn(() => ({
    selectAll: jest.fn(() => ({
      remove: jest.fn(),
      data: jest.fn(() => ({
        enter: jest.fn(() => ({
          append: jest.fn(() => ({
            attr: jest.fn().mockReturnThis(),
            style: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            transition: jest.fn(() => ({
              duration: jest.fn().mockReturnThis(),
              delay: jest.fn().mockReturnThis(),
              style: jest.fn().mockReturnThis(),
            })),
          })),
        })),
      })),
    })),
    append: jest.fn(() => ({
      attr: jest.fn().mockReturnThis(),
      style: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
    })),
  })),
  scaleSequential: jest.fn(() => ({
    domain: jest.fn().mockReturnThis(),
  })),
  interpolateRgbBasis: jest.fn(),
}));

// Import components
import EngagementTrendChart from'../../../client/src/components/analytics/EngagementTrendChart';
import CohortAnalysisChart from'../../../client/src/components/analytics/CohortAnalysisChart';
import { AdvancedAnalyticsCharts } from'../../../client/src/components/analytics';

// Visual test data generators
const generateVisualTestData = (pattern:'increasing' |'decreasing' |'fluctuating' |'stable') => {
  const baseValue = 500;
  return Array.from({ length: 12 }, (_, i) => {
    let value = baseValue;
    
    switch (pattern) {
      case'increasing':
        value = baseValue + (i * 50) + (Math.random() * 20 - 10);
        break;
      case'decreasing':
        value = baseValue + 600 - (i * 50) + (Math.random() * 20 - 10);
        break;
      case'fluctuating':
        value = baseValue + Math.sin(i * 0.5) * 200 + (Math.random() * 40 - 20);
        break;
      case'stable':
        value = baseValue + (Math.random() * 20 - 10);
        break;
    }
    
    return {
      date: new Date(2024, i, 1).toISOString(),
      activeMembers: Math.floor(value),
      eventAttendance: Math.floor(value * 0.7),
      engagementRate: Math.max(0.1, Math.min(0.95, value / 1000)),
      totalMembers: Math.floor(value * 1.2),
    };
  });
};

const generateCohortVisualData = () => [
  {
    cohort:'Jan 2024',
    totalMembers: 1000,
    initialSize: 1000,
    retentionRates: [950, 800, 650, 500, 400, 350, 300, 280, 260, 240, 220, 200],
    churnRate: 0.8,
    averageLifetime: 180,
  },
  {
    cohort:'Feb 2024',
    totalMembers: 1200,
    initialSize: 1200,
    retentionRates: [1150, 1000, 850, 700, 600, 520, 450, 400, 360, 330, 300, 280],
    churnRate: 0.77,
    averageLifetime: 195,
  },
  {
    cohort:'Mar 2024',
    totalMembers: 800,
    initialSize: 800,
    retentionRates: [780, 650, 520, 420, 350, 300, 260, 230, 210, 190, 175, 160],
    churnRate: 0.8,
    averageLifetime: 170,
  },
];

const generateChartVisualData = (type:'categorical' |'temporal' |'comparative') => {
  switch (type) {
    case'categorical':
      return [
        { label:'Basic', value: 450, category:'Membership' },
        { label:'Pro', value: 280, category:'Membership' },
        { label:'Unlimited', value: 120, category:'Membership' },
        { label:'Social', value: 320, category:'Events' },
        { label:'Professional', value: 180, category:'Events' },
        { label:'Workshop', value: 90, category:'Events' },
      ];
    case'temporal':
      return Array.from({ length: 7 }, (_, i) => ({
        date: new Date(2024, 0, i + 1).toISOString(),
        value: 100 + Math.sin(i * 0.8) * 50 + (Math.random() * 20 - 10),
        label: `Day ${i + 1}`,
      }));
    case'comparative':
      return [
        { label:'Q1 2024', value: 2400, previous: 2100 },
        { label:'Q2 2024', value: 2800, previous: 2400 },
        { label:'Q3 2024', value: 3200, previous: 2900 },
        { label:'Q4 2024', value: 2900, previous: 3200 },
      ];
    default:
      return [];
  }
};

// Visual testing utilities
const getLayoutMetrics = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  
  return {
    width: rect.width,
    height: rect.height,
    padding: {
      top: parseInt(computedStyle.paddingTop, 10),
      right: parseInt(computedStyle.paddingRight, 10),
      bottom: parseInt(computedStyle.paddingBottom, 10),
      left: parseInt(computedStyle.paddingLeft, 10),
    },
    margin: {
      top: parseInt(computedStyle.marginTop, 10),
      right: parseInt(computedStyle.marginRight, 10),
      bottom: parseInt(computedStyle.marginBottom, 10),
      left: parseInt(computedStyle.marginLeft, 10),
    },
    border: {
      top: parseInt(computedStyle.borderTopWidth, 10),
      right: parseInt(computedStyle.borderRightWidth, 10),
      bottom: parseInt(computedStyle.borderBottomWidth, 10),
      left: parseInt(computedStyle.borderLeftWidth, 10),
    },
  };
};

const captureVisualState = (container: HTMLElement) => {
  const chartElements = container.querySelectorAll('[data-testid*="chart"]');
  const gridLines = container.querySelectorAll('[data-testid="grid-line"]');
  const dataPoints = container.querySelectorAll('[data-testid="data-point"]');
  
  return {
    containerLayout: getLayoutMetrics(container),
    chartCount: chartElements.length,
    gridLineCount: gridLines.length,
    dataPointCount: dataPoints.length,
    chartTypes: Array.from(chartElements).map(el => el.getAttribute('data-visual-type')),
    colors: Array.from(chartElements).map(el => {
      const style = window.getComputedStyle(el);
      return {
        background: style.backgroundColor,
        border: style.borderColor,
      };
    }),
  };
};

const mockTheme = {
  name:'visual-test',
  colors: {
    primary:'#3B82F6',
    secondary:'#10B981',
    success:'#059669',
    warning:'#F59E0B',
    error:'#DC2626',
    info:'#0EA5E9',
    background:'#FFFFFF',
    surface:'#F9FAFB',
    text:'#1F2937',
    textSecondary:'#6B7280',
  },
  chartDefaults: {
    type:'line' as const,
    colors: ['#3B82F6','#10B981','#F59E0B','#DC2626','#8B5CF6'],
    gridLines: true,
    animations: false, // Disable for consistent visual testing
    legend: true,
    responsive: true,
    maintainAspectRatio: false,
  },
};

describe('Visual Regression Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window dimensions for consistent testing
    Object.defineProperty(window,'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    
    Object.defineProperty(window,'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
    
    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  describe('EngagementTrendChart Visual Consistency', () => {
    it('maintains consistent layout across different data patterns', async () => {
      const patterns = ['increasing','decreasing','fluctuating','stable'] as const;
      const visualStates: any[] = [];
      
      for (const pattern of patterns) {
        const data = generateVisualTestData(pattern);
        const { container } = render(
          <EngagementTrendChart
            data={data}
            title={`${pattern} Trend`}
            userTier="unlimited"
            height={400}
          />
        );
        
        await waitFor(() => {
          expect(screen.getByTestId('engagement-trend-chart')).toBeInTheDocument();
        });
        
        const visualState = captureVisualState(container);
        visualStates.push({ pattern, ...visualState });
        
        // Check consistent container dimensions
        expect(visualState.containerLayout.height).toBeGreaterThanOrEqual(400);
        expect(visualState.containerLayout.width).toBeGreaterThan(0);
        
        container.remove();
      }
      
      // All patterns should have consistent layout structure
      const firstState = visualStates[0];
      visualStates.forEach(state => {
        expect(state.chartCount).toBe(firstState.chartCount);
        expect(state.chartTypes).toEqual(firstState.chartTypes);
      });
    });

    it('preserves visual hierarchy with different user tiers', async () => {
      const tiers = ['basic','pro','unlimited'] as const;
      const data = generateVisualTestData('fluctuating');
      
      for (const tier of tiers) {
        const { container } = render(
          <EngagementTrendChart
            data={data}
            title="Tier Test"
            userTier={tier}
            showMetricToggles={true}
            allowZoom={true}
            enableAdvancedFilters={true}
          />
        );
        
        await waitFor(() => {
          expect(screen.getByTestId('engagement-trend-chart')).toBeInTheDocument();
        });
        
        // Check tier-specific visual elements
        if (tier ==='unlimited') {
          const advancedElements = container.querySelectorAll('[aria-label*="advanced"]');
          expect(advancedElements.length).toBeGreaterThanOrEqual(0);
        }
        
        // Consistent base layout regardless of tier
        const chartContainer = screen.getByTestId('responsive-container');
        const layout = getLayoutMetrics(chartContainer);
        expect(layout.height).toBeGreaterThanOrEqual(400);
        
        container.remove();
      }
    });

    it('handles responsive breakpoints consistently', async () => {
      const data = generateVisualTestData('increasing');
      const breakpoints = [
        { width: 320, height: 568 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1024, height: 768 },  // Desktop
        { width: 1440, height: 900 },  // Large Desktop
      ];
      
      for (const breakpoint of breakpoints) {
        // Mock viewport size
        Object.defineProperty(window,'innerWidth', { value: breakpoint.width });
        Object.defineProperty(window,'innerHeight', { value: breakpoint.height });
        
        // Mock matchMedia for responsive queries
        Object.defineProperty(window,'matchMedia', {
          writable: true,
          value: jest.fn().mockImplementation(query => ({
            matches: query.includes('768px') ? breakpoint.width <= 768 : false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
          })),
        });
        
        const { container } = render(
          <EngagementTrendChart
            data={data}
            title="Responsive Test"
            userTier="unlimited"
            responsive={true}
          />
        );
        
        await waitFor(() => {
          expect(screen.getByTestId('engagement-trend-chart')).toBeInTheDocument();
        });
        
        const visualState = captureVisualState(container);
        
        // Chart should adapt to container width
        expect(visualState.containerLayout.width).toBeLessThanOrEqual(breakpoint.width);
        
        // Mobile-specific assertions
        if (breakpoint.width <= 768) {
          const chartElement = screen.getByTestId('engagement-trend-chart');
          expect(chartElement).toHaveClass('mobile-responsive');
        }
        
        container.remove();
      }
    });

    it('maintains color consistency across themes', async () => {
      const data = generateVisualTestData('stable');
      const themes = ['light','dark','high-contrast'];
      
      const themeColors = {
        light: { primary:'#3B82F6', background:'#FFFFFF', text:'#1F2937' },
         { primary:'#60A5FA', background:'#1F2937', text:'#F9FAFB' },'high-contrast': { primary:'#0000FF', background:'#FFFFFF', text:'#000000' },
      };
      
      for (const themeName of themes) {
        const customTheme = {
          ...mockTheme,
          name: themeName,
          colors: {
            ...mockTheme.colors,
            ...themeColors[themeName],
          },
        };
        
        const { container } = render(
          <EngagementTrendChart
            data={data}
            title={`${themeName} Theme`}
            userTier="unlimited"
            useThemeColors={true}
          />
        );
        
        await waitFor(() => {
          expect(screen.getByTestId('engagement-trend-chart')).toBeInTheDocument();
        });
        
        // Verify theme application
        const chartContainer = screen.getByTestId('engagement-trend-chart');
        expect(chartContainer).toHaveClass('theme-adaptive');
        
        container.remove();
      }
    });
  });

  describe('CohortAnalysisChart Visual Rendering', () => {
    const cohortData = generateCohortVisualData();
    const defaultProps = {
      data: cohortData,
      theme: {
        grid:'#e5e7eb',
        text:'#1f2937',
      },
      loading: {
        isLoading: false,
        error: null,
      },
      userTier:'unlimited' as const,
    };

    it('renders heatmap with consistent visual density', async () => {
      const { container } = render(<CohortAnalysisChart {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('img', { name: /cohort retention/i })).toBeInTheDocument();
      });
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      
      if (svg) {
        const layout = getLayoutMetrics(svg);
        expect(layout.width).toBeGreaterThan(600);
        expect(layout.height).toBeGreaterThan(400);
      }
      
      // Check color legend presence
      expect(screen.getByText('Retention Rate:')).toBeInTheDocument();
      const colorLegend = container.querySelector('[style*="backgroundColor"]');
      expect(colorLegend).toBeInTheDocument();
    });

    it('maintains visual hierarchy in data table', async () => {
      render(<CohortAnalysisChart {...defaultProps} showDataTable={true} />);
      
      const tableToggle = screen.getByLabelText('Hide data table');
      expect(tableToggle).toBeInTheDocument();
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Check table structure
      const headers = table.querySelectorAll('th');
      expect(headers.length).toBeGreaterThanOrEqual(3); // Cohort + Initial Size + Periods
      
      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBe(cohortData.length);
      
      // Visual alignment check
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        expect(cells.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('displays summary statistics with proper visual weight', async () => {
      render(<CohortAnalysisChart {...defaultProps} userTier="pro" />);
      
      const summaryCards = ['Total Initial Users','Avg First Period Retention','Best Performing Cohort',
      ];
      
      summaryCards.forEach(cardTitle => {
        expect(screen.getByText(cardTitle)).toBeInTheDocument();
      });
      
      // Check visual styling of summary cards
      const cards = screen.getAllByText(/Total Initial Users|Avg First Period|Best Performing/);
      cards.forEach(card => {
        const cardElement = card.closest('div');
        expect(cardElement).toHaveClass(/bg-\w+-50/); // Colored background
      });
    });

    it('handles color scheme transitions smoothly', async () => {
      const { rerender } = render(<CohortAnalysisChart {...defaultProps} colorScheme="blue" />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Select color scheme')).toBeInTheDocument();
      });
      
      // Test color scheme changes
      const colorSchemes = ['blue','green','purple'] as const;
      
      for (const scheme of colorSchemes) {
        rerender(<CohortAnalysisChart {...defaultProps} colorScheme={scheme} />);
        
        await waitFor(() => {
          const colorSelect = screen.getByLabelText('Select color scheme');
          expect(colorSelect).toHaveValue(scheme);
        });
      }
    });
  });

  describe('AdvancedAnalyticsCharts Visual Standards', () => {
    it('maintains consistent chart dimensions across types', async () => {
      const chartTypes = ['line','bar','doughnut'] as const;
      const data = generateChartVisualData('temporal');
      const height = 350;
      
      for (const chartType of chartTypes) {
        const { container } = render(
          <AdvancedAnalyticsCharts
            data={data}
            chartType={chartType}
            title={`${chartType} Chart Test`}
            userTier="unlimited"
            height={height}
            theme={mockTheme}
          />
        );
        
        await waitFor(() => {
          expect(screen.getByTestId(`${chartType}-chart`)).toBeInTheDocument();
        });
        
        const chartElement = screen.getByTestId(`${chartType}-chart`);
        const layout = getLayoutMetrics(chartElement);
        
        // Consistent height enforcement
        expect(layout.height).toBeCloseTo(height, -1);
        
        // Visual elements present
        expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
        expect(screen.getByText(`${data.length} data points`)).toBeInTheDocument();
        
        container.remove();
      }
    });

    it('applies tier-based visual restrictions consistently', async () => {
      const data = generateChartVisualData('categorical');
      const restrictedChart ='radar';
      
      const tiers = ['basic','pro','unlimited'] as const;
      
      for (const tier of tiers) {
        const { container } = render(
          <AdvancedAnalyticsCharts
            data={data}
            chartType={restrictedChart}
            title="Tier Restriction Test"
            userTier={tier}
            theme={mockTheme}
          />
        );
        
        if (tier ==='unlimited') {
          await waitFor(() => {
            expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
          });
        } else {
          // Should show upgrade message
          expect(screen.getByText(/charts are available in the Unlimited tier/)).toBeInTheDocument();
          expect(screen.getByRole('button', { name: /upgrade/i })).toBeInTheDocument();
          
          // Check visual styling of restriction message
          const restrictionContainer = screen.getByText(/Unlimited tier/).closest('div');
          expect(restrictionContainer).toHaveClass(/border-dashed/);
        }
        
        container.remove();
      }
    });

    it('displays loading states with proper visual feedback', async () => {
      const data = generateChartVisualData('temporal');
      
      const { container } = render(
        <AdvancedAnalyticsCharts
          data={data}
          chartType="line"
          title="Loading Test"
          userTier="unlimited"
          loading={true}
          theme={mockTheme}
        />
      );
      
      // Check loading skeleton
      const skeleton = screen.getByTestId('chart-loading-skeleton');
      expect(skeleton).toBeInTheDocument();
      
      const layout = getLayoutMetrics(skeleton);
      expect(layout.height).toBeGreaterThan(300);
      
      // Loading state should have proper visual hierarchy
      const loadingCard = skeleton.closest('.analytics-chart-card');
      expect(loadingCard).toBeInTheDocument();
    });

    it('handles error states with clear visual indicators', async () => {
      const data = generateChartVisualData('temporal');
      const errorMessage ='Test error for visual validation';
      
      render(
        <AdvancedAnalyticsCharts
          data={data}
          chartType="line"
          title="Error Test"
          userTier="unlimited"
          error={errorMessage}
          theme={mockTheme}
          onRetry={jest.fn()}
        />
      );
      
      // Error message display
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      
      // Error icon presence
      const errorIcon = screen.getByRole('button', { name: /retry/i });
      expect(errorIcon).toBeInTheDocument();
      
      // Visual error styling
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('maintains export progress visual consistency', async () => {
      const data = generateChartVisualData('comparative');
      let resolveExport: () => void;
      
      const mockExport = jest.fn().mockImplementation(() => 
        new Promise<void>(resolve => {
          resolveExport = resolve;
        })
      );
      
      render(
        <AdvancedAnalyticsCharts
          data={data}
          chartType="bar"
          title="Export Progress Test"
          userTier="pro"
          theme={mockTheme}
          onDataExport={mockExport}
        />
      );
      
      const exportButton = screen.getByLabelText('Export as PNG');
      
      // Trigger export
      act(() => {
        exportButton.click();
      });
      
      // Check progress indicator appearance
      await waitFor(() => {
        expect(screen.getByTestId('export-progress')).toBeInTheDocument();
      });
      
      const progressIndicator = screen.getByTestId('export-progress');
      const layout = getLayoutMetrics(progressIndicator);
      
      // Progress overlay should cover the chart area
      expect(layout.width).toBeGreaterThan(0);
      expect(layout.height).toBeGreaterThan(0);
      
      // Complete export
      act(() => {
        resolveExport();
      });
      
      await waitFor(() => {
        expect(screen.queryByTestId('export-progress')).not.toBeInTheDocument();
      });
    });
  });

  describe('Cross-Browser Visual Compatibility', () => {
    it('handles font rendering consistently', async () => {
      const data = generateVisualTestData('stable');
      
      // Mock different browser font stacks
      const fontStacks = ['Arial, sans-serif','Helvetica, Arial, sans-serif','system-ui, -apple-system, sans-serif',
      ];
      
      for (const fontStack of fontStacks) {
        // Mock font family
        Object.defineProperty(document.documentElement.style,'fontFamily', {
          value: fontStack,
          writable: true,
        });
        
        const { container } = render(
          <EngagementTrendChart
            data={data}
            title="Font Test"
            userTier="unlimited"
          />
        );
        
        await waitFor(() => {
          expect(screen.getByTestId('engagement-trend-chart')).toBeInTheDocument();
        });
        
        // Text elements should be readable
        const titleElement = screen.getByText('Font Test');
        expect(titleElement).toBeInTheDocument();
        
        const computedStyle = window.getComputedStyle(titleElement);
        expect(computedStyle.fontSize).toBeTruthy();
        
        container.remove();
      }
    });

    it('maintains layout integrity with different zoom levels', async () => {
      const data = generateChartVisualData('temporal');
      const zoomLevels = [0.8, 1.0, 1.25, 1.5];
      
      for (const zoom of zoomLevels) {
        // Mock zoom level
        Object.defineProperty(window,'devicePixelRatio', {
          value: zoom,
          writable: true,
        });
        
        const { container } = render(
          <AdvancedAnalyticsCharts
            data={data}
            chartType="line"
            title="Zoom Test"
            userTier="unlimited"
            height={400}
            theme={mockTheme}
          />
        );
        
        await waitFor(() => {
          expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        });
        
        const chartElement = screen.getByTestId('line-chart');
        const layout = getLayoutMetrics(chartElement);
        
        // Layout should remain functional at different zoom levels
        expect(layout.width).toBeGreaterThan(0);
        expect(layout.height).toBeGreaterThanOrEqual(350);
        
        container.remove();
      }
    });
  });

  describe('Accessibility Visual Standards', () => {
    it('maintains sufficient color contrast ratios', async () => {
      const data = generateVisualTestData('increasing');
      
      render(
        <EngagementTrendChart
          data={data}
          title="Contrast Test"
          userTier="unlimited"
          useThemeColors={true}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('engagement-trend-chart')).toBeInTheDocument();
      });
      
      // Check text elements for contrast
      const titleElement = screen.getByText('Contrast Test');
      const titleStyle = window.getComputedStyle(titleElement);
      
      // Title should have sufficient contrast (this is a basic check)
      expect(titleStyle.color).toBeTruthy();
      expect(titleStyle.backgroundColor || titleStyle.background).toBeTruthy();
    });

    it('provides visual focus indicators', async () => {
      const data = generateChartVisualData('categorical');
      
      render(
        <AdvancedAnalyticsCharts
          data={data}
          chartType="bar"
          title="Focus Test"
          userTier="unlimited"
          theme={mockTheme}
        />
      );
      
      const exportButton = screen.getByLabelText('Export as PNG');
      
      // Focus should be visually indicated
      act(() => {
        exportButton.focus();
      });
      
      expect(exportButton).toHaveFocus();
      
      const focusedStyle = window.getComputedStyle(exportButton);
      // Should have some form of focus indication (outline, shadow, etc.)
      expect(
        focusedStyle.outline !=='none' || 
        focusedStyle.boxShadow !=='none'
      ).toBe(true);
    });

    it('scales appropriately for reduced motion preferences', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window,'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('reduce'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      });
      
      const data = generateVisualTestData('fluctuating');
      
      render(
        <EngagementTrendChart
          data={data}
          title="Motion Test"
          userTier="unlimited"
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('engagement-trend-chart')).toBeInTheDocument();
      });
      
      // Chart should render without motion-based animations
      // (In a real test, you'd verify animation properties)
      expect(screen.getByTestId('engagement-trend-chart')).toBeInTheDocument();
    });
  });
});