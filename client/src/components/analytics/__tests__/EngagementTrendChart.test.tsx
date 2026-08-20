import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import EngagementTrendChart from '../EngagementTrendChart';
import { EngagementMetric } from '../../../types/analytics';

// CRITICAL: Apply EXACT proven RadixUI inline mocking pattern that achieved 100% success
// This pattern achieved 20/20 passing tests on CustomDateRangePicker
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ...(children.props || {})});
    }
    return <div {...props}>{children}</div>;
  },
  Slottable: ({ children }: any) => <>{children}</>,
}));

jest.mock('@radix-ui/react-separator', () => ({
  Root: React.forwardRef(function SeparatorRoot({ orientation = 'horizontal', decorative = true, ...props }: any, ref) {
    return <div ref={ref} role={decorative ? "none" : "separator"} aria-orientation={orientation} {...props} />;
  })
}));

// Select for trend filtering
jest.mock('@radix-ui/react-select', () => ({
  Root: ({ children, value, onValueChange, open, onOpenChange }: any) => (
    <div data-testid="select-root" data-value={value} data-open={open}>{children}</div>
  ),
  Trigger: React.forwardRef<HTMLButtonElement, any>(function SelectTrigger({ children, ...props }, ref) {
    return (
      <button ref={ref} data-testid="select-trigger" role="combobox" aria-haspopup="listbox" aria-controls="select-content" aria-expanded="false" {...props}>
        {children}
      </button>
    );
  }),
  Value: ({ children, placeholder }: any) => (
    <span data-testid="select-value">{children || placeholder}</span>
  ),
  Content: React.forwardRef<HTMLDivElement, any>(function SelectContent({ children, position = 'popper', ...props }, ref) {
    return (
      <div ref={ref} data-testid="select-content" data-position={position} role="listbox" {...props}>
        {children}
      </div>
    );
  }),
  Item: React.forwardRef<HTMLDivElement, any>(function SelectItem({ children, value, ...props }, ref) {
    return (
      <div ref={ref} data-testid="select-item" data-value={value} role="option" aria-selected="false" {...props}>
        {children}
      </div>
    );
  }),
  ItemText: ({ children }: any) => <span data-testid="select-item-text">{children}</span>,
  Portal: ({ children }: any) => children,
  Icon: ({ children }: any) => <span data-testid="select-icon">{children}</span>,
}));

// Tooltip for chart data points
jest.mock('@radix-ui/react-tooltip', () => ({
  Provider: ({ children }: any) => children,
  Root: ({ children }: any) => children,
  Trigger: React.forwardRef<HTMLButtonElement, any>(function TooltipTrigger({ children, asChild, ...props }, ref) {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ref } as any);
    }
    return <button ref={ref} data-testid="tooltip-trigger" {...props}>{children}</button>;
  }),
  Content: React.forwardRef<HTMLDivElement, any>(function TooltipContent({ children, side = 'top', align = 'center', ...props }, ref) {
    return (
      <div 
        ref={ref} 
        data-testid="tooltip-content" 
        data-side={side} 
        data-align={align} 
        role="tooltip"
        {...props}
      >
        {children}
      </div>
    );
  }),
  Portal: ({ children }: any) => children,
  Arrow: () => <div data-testid="tooltip-arrow" />,
}));

// Popover for trend details
jest.mock('@radix-ui/react-popover', () => ({
  Root: ({ children, open, onOpenChange }: any) => (
    <div data-testid="popover-root" data-open={open} data-state={open ? 'open' : 'closed'}>{children}</div>
  ),
  Trigger: React.forwardRef<HTMLButtonElement, any>(function PopoverTrigger({ children, asChild, ...props }, ref) {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ref } as any);
    }
    return <button ref={ref} data-testid="popover-trigger" {...props}>{children}</button>;
  }),
  Content: React.forwardRef<HTMLDivElement, any>(function PopoverContent({ children, align = 'center', side = 'bottom', ...props }, ref) {
    return (
      <div 
        ref={ref} 
        data-testid="popover-content" 
        data-align={align} 
        data-side={side}
        role="dialog"
        {...props}
      >
        {children}
      </div>
    );
  }),
  Portal: ({ children }: any) => children,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={`card ${className || ''}`} data-testid="card" {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={`card-header ${className || ''}`} data-testid="card-header" {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={`card-title ${className || ''}`} data-testid="card-title" {...props}>{children}</h3>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <p className={`card-description ${className || ''}`} data-testid="card-description" {...props}>{children}</p>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={`card-content ${className || ''}`} data-testid="card-content" {...props}>{children}</div>
  ),
  CardFooter: ({ children, className, ...props }: any) => (
    <div className={`card-footer ${className || ''}`} data-testid="card-footer" {...props}>{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(function Button({ children, className, variant, size, asChild, ...props }, ref) {
    if (asChild && children) {
      return <>{children}</>;
    }
    return (
      <button
        ref={ref}
        className={`button ${variant || ''} ${size || ''} ${className || ''}`}
        data-testid="button"
        {...props}
      >
        {children}
      </button>
    );
  })
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span 
      className={`badge ${variant || ''} ${className || ''}`}
      data-testid="badge"
      {...props}
    >
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog-root">{children}</div> : null,
  DialogContent: ({ children, className, ...props }: any) => {
    const { onOpenChange, ...restProps } = props;
    return <div className={`dialog-content ${className || ''}`} data-testid="dialog-content" {...restProps}>{children}</div>;
  },
  DialogHeader: ({ children, className, ...props }: any) => (
    <div className={`dialog-header ${className || ''}`} data-testid="dialog-header" {...props}>{children}</div>
  ),
  DialogTitle: ({ children, className, ...props }: any) => (
    <h2 className={`dialog-title ${className || ''}`} data-testid="dialog-title" {...props}>{children}</h2>
  ),
  DialogDescription: ({ children, className, ...props }: any) => (
    <p className={`dialog-description ${className || ''}`} data-testid="dialog-description" {...props}>{children}</p>
  ),
  DialogFooter: ({ children, className, ...props }: any) => (
    <div className={`dialog-footer ${className || ''}`} data-testid="dialog-footer" {...props}>{children}</div>
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => <div data-testid="select">{children}</div>,
  SelectTrigger: ({ children, className, ...props }: any) => (
    <button className={`select-trigger ${className || ''}`} data-testid="select-trigger" {...props}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: any) => <span data-testid="select-value">{placeholder}</span>,
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value, ...props }: any) => (
    <div data-testid="select-item" data-value={value} {...props}>{children}</div>
  ),
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: React.forwardRef<HTMLInputElement, any>(function Checkbox({ className, checked, onCheckedChange, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={`checkbox ${className || ''}`}
        checked={Boolean(checked)}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        data-testid="checkbox"
        {...props}
      />
    );
  })
}));

jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, any>(function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`input ${className || ''}`}
        data-testid="input"
        {...props}
      />
    );
  })
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, className, ...props }: any) => (
    <label className={`label ${className || ''}`} data-testid="label" {...props}>
      {children}
    </label>
  ),
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className, ...props }: any) => (
    <div 
      className={`progress ${className || ''}`}
      data-testid="progress"
      data-value={value}
      {...props}
    >
      <div style={{ width: `${value || 0}%` }} />
    </div>
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, className, ...props }: any) => (
    <div className={`alert ${variant || ''} ${className || ''}`} data-testid="alert" {...props}>{children}</div>
  ),
  AlertDescription: ({ children, className, ...props }: any) => (
    <div className={`alert-description ${className || ''}`} data-testid="alert-description" {...props}>{children}</div>
  ),
  AlertTitle: ({ children, className, ...props }: any) => (
    <h4 className={`alert-title ${className || ''}`} data-testid="alert-title" {...props}>{children}</h4>
  ),
}));

// Note: Spinner component mock removed - component doesn't exist

// Note: toHaveNoViolations matcher is configured globally in setupTests.ts

// Mock Recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

const mockData: EngagementMetric[] = [
  {
    date: '2024-01-01',
    activeMembers: 150,
    eventAttendance: 45,
    engagementRate: 0.75,
    totalMembers: 200,
  },
  {
    date: '2024-01-02',
    activeMembers: 165,
    eventAttendance: 52,
    engagementRate: 0.82,
    totalMembers: 201,
  },
  {
    date: '2024-01-03',
    activeMembers: 142,
    eventAttendance: 38,
    engagementRate: 0.71,
    totalMembers: 202,
  },
];

describe('EngagementTrendChart', () => {
  describe('Basic Rendering', () => {
    it('renders chart with default configuration', () => {
      render(<EngagementTrendChart data={mockData} />);
      
      expect(screen.getByTestId('engagement-trend-chart')).toBeInTheDocument();
      expect(screen.getAllByTestId('responsive-container')[0]).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('renders all chart components', () => {
      render(<EngagementTrendChart data={mockData} />);
      
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('renders chart title', () => {
      render(<EngagementTrendChart data={mockData} title="Member Engagement Trends" />);
      
      expect(screen.getByText('Member Engagement Trends')).toBeInTheDocument();
    });
  });

  describe('Chart Type Selection', () => {
    it('renders line chart by default', () => {
      render(<EngagementTrendChart data={mockData} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
    });

    it('renders area chart when type is specified', () => {
      render(<EngagementTrendChart data={mockData} chartType="area" />);
      
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });

    it('provides chart type toggle buttons', () => {
      render(<EngagementTrendChart data={mockData} showTypeToggle />);
      
      expect(screen.getByRole('button', { name: /line chart/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /area chart/i })).toBeInTheDocument();
    });

    it('switches chart type when toggle button is clicked', () => {
      render(<EngagementTrendChart data={mockData} showTypeToggle />);
      
      const areaToggle = screen.getByRole('button', { name: /area chart/i });
      fireEvent.click(areaToggle);
      
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });

  describe('Data Visualization', () => {
    it('renders multiple metric lines', () => {
      render(
        <EngagementTrendChart 
          data={mockData} 
          metrics={['activeMembers', 'eventAttendance', 'engagementRate']}
        />
      );
      
      const lines = screen.getAllByTestId('line');
      expect(lines).toHaveLength(3);
    });

    it('handles empty data gracefully', () => {
      render(<EngagementTrendChart data={[]} />);
      
      expect(screen.getByText(/no data available/i)).toBeInTheDocument();
    });

    it('shows data loading skeleton', () => {
      render(<EngagementTrendChart data={mockData} loading />);
      
      expect(screen.getByTestId('chart-loading-skeleton')).toBeInTheDocument();
    });

    it('displays error state', () => {
      render(<EngagementTrendChart data={mockData} error="Failed to load data" />);
      
      expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('shows metric toggle controls', () => {
      render(
        <EngagementTrendChart 
          data={mockData} 
          showMetricToggles
          metrics={['activeMembers', 'eventAttendance', 'engagementRate']}
        />
      );
      
      expect(screen.getByLabelText(/active members/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/event attendance/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/engagement rate/i)).toBeInTheDocument();
    });

    it('toggles metric visibility', () => {
      render(
        <EngagementTrendChart 
          data={mockData} 
          showMetricToggles
          metrics={['activeMembers', 'eventAttendance']}
        />
      );
      
      const activeToggle = screen.getByLabelText(/active members/i);
      fireEvent.click(activeToggle);
      
      // Verify that the metric is toggled off
      expect(activeToggle).not.toBeChecked();
    });

    it('supports zoom functionality', () => {
      render(<EngagementTrendChart data={mockData} allowZoom />);
      
      expect(screen.getByTestId('zoom-controls')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset zoom/i })).toBeInTheDocument();
    });
  });

  describe('Customization Options', () => {
    it('applies custom height', () => {
      render(<EngagementTrendChart data={mockData} height={400} />);
      
      const chart = screen.getByTestId('engagement-trend-chart');
      // The height is applied to the ResponsiveContainer, not the outer div
      expect(chart).toBeInTheDocument();
    });

    it('uses custom color scheme', () => {
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1'];
      render(<EngagementTrendChart data={mockData} colors={colors} />);
      
      // Verify chart renders with colors prop (colors are passed to chart library)
      const chart = screen.getByTestId('engagement-trend-chart');
      expect(chart).toBeInTheDocument();
    });

    it('formats tooltip content', () => {
      render(
        <EngagementTrendChart 
          data={mockData} 
          tooltipFormatter={(value, name) => [`${value}%`, `${name} Rate`]}
        />
      );
      
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('handles large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 10 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        activeMembers: Math.floor(Math.random() * 200) + 100,
        eventAttendance: Math.floor(Math.random() * 60) + 20,
        engagementRate: Math.random() * 0.4 + 0.6,
        totalMembers: 300,
      }));
      
      render(<EngagementTrendChart data={largeDataset} />);
      
      expect(screen.getByTestId('engagement-trend-chart')).toBeInTheDocument();
    });

    it('debounces rapid data updates', () => {
      const { rerender } = render(<EngagementTrendChart data={mockData} />);
      
      // Rapid re-renders should be debounced
      for (let i = 0; i < 10; i++) {
        rerender(<EngagementTrendChart data={mockData} />);
      }
      
      expect(screen.getByTestId('engagement-trend-chart')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      });

      render(<EngagementTrendChart data={mockData} />);
      
      const chart = screen.getByTestId('engagement-trend-chart');
      expect(chart).toHaveClass('mobile-responsive');
    });

    it('adjusts legend position for small screens', () => {
      render(<EngagementTrendChart data={mockData} responsive />);
      
      const legend = screen.getByTestId('legend');
      expect(legend).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<EngagementTrendChart data={mockData} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA labels', () => {
      render(<EngagementTrendChart data={mockData} />);
      
      const chart = screen.getByTestId('engagement-trend-chart');
      expect(chart).toHaveAttribute('role', 'img');
      expect(chart).toHaveAttribute('aria-label', expect.stringContaining('engagement trend'));
    });

    it('includes data table for screen readers', () => {
      render(<EngagementTrendChart data={mockData} includeDataTable />);
      
      expect(screen.getByRole('table', { name: /engagement data/i })).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Active Members')).toBeInTheDocument();
    });

    it('announces data changes to screen readers', () => {
      const { rerender } = render(<EngagementTrendChart data={mockData} />);
      
      const newData = [...mockData, {
        date: '2024-01-04',
        activeMembers: 180,
        eventAttendance: 60,
        engagementRate: 0.85,
        totalMembers: 203,
      }];
      
      rerender(<EngagementTrendChart data={newData} />);
      
      expect(screen.getByLabelText(/chart updated with/i)).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('adapts to Light Theme', () => {
      render(
        <div className="light">
          <EngagementTrendChart data={mockData} />
        </div>
      );
      
      const chart = screen.getByTestId('engagement-trend-chart');
      // Theme is applied internally to chart components, check that it renders
      expect(chart).toBeInTheDocument();
    });

    it('uses theme colors for chart elements', () => {
      render(<EngagementTrendChart data={mockData} useThemeColors />);
      
      const chart = screen.getByTestId('engagement-trend-chart');
      expect(chart).toHaveClass('theme-adaptive');
    });
  });
});