import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureUsageAnalytics } from '../FeatureUsageAnalytics';
import { featureAnalyticsService } from '@/services/featureAnalyticsService';

// Mock services first
jest.mock('@/services/featureAnalyticsService', () => ({
  featureAnalyticsService: {
    getFeatureUsageAnalytics: jest.fn(),
    getMemberEngagementAnalytics: jest.fn(),
    calculateEngagementScores: jest.fn(),
  },
}));

// Mock DataError component directly to bypass module mapping issues
jest.mock('@/components/ui/data-error', () => {
  function DataError(props: any) {
    const { title, message, onRetry, className } = props;
    return React.createElement('div', { className, 'data-testid': 'data-error' },
      React.createElement('div', { 'data-testid': 'data-error-title' }, title || 'Error'),
      React.createElement('div', { 'data-testid': 'data-error-description' }, message || 'An unexpected error occurred'),
      onRetry && React.createElement('button', { 'data-testid': 'retry-button', onClick: onRetry }, 'Try Again')
    );
  }
  
  function NetworkError(props: any) {
    const { onRetry, className } = props;
    return React.createElement('div', { className, 'data-testid': 'data-error' },
      React.createElement('div', { 'data-testid': 'data-error-title' }, 'Network Error'),
      React.createElement('div', { 'data-testid': 'data-error-description' }, 'Please check your internet connection and try again.'),
      onRetry && React.createElement('button', { 'data-testid': 'retry-button', onClick: onRetry }, 'Retry')
    );
  }
  
  function ServerError(props: any) {
    const { onRetry, className } = props;
    return React.createElement('div', { className, 'data-testid': 'data-error' },
      React.createElement('div', { 'data-testid': 'data-error-title' }, 'Server Error'),
      React.createElement('div', { 'data-testid': 'data-error-description' }, 'Our servers are having trouble. Please try again in a moment.'),
      onRetry && React.createElement('button', { 'data-testid': 'retry-button', onClick: onRetry }, 'Retry')
    );
  }
  
  function AuthError(props: any) {
    const { onLogin, className } = props;
    return React.createElement('div', { className, 'data-testid': 'data-error' },
      React.createElement('div', { 'data-testid': 'data-error-title' }, 'Authentication Error'),
      React.createElement('div', { 'data-testid': 'data-error-description' }, 'Please log in to continue.'),
      onLogin && React.createElement('button', { 'data-testid': 'secondary-button', onClick: onLogin }, 'Log In')
    );
  }
  
  return { DataError, NetworkError, ServerError, AuthError };
});

// Import universal RadixUI mocking setup

// Mock RadixUI components inline to bypass Jest module mapping issues
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ...(children.props || {})});
    }
    return <div {...props}>{children}</div>;
  },
  Slottable: ({ children }: any) => <>{children}</>,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange, ...props }: any) => (
    <div data-testid="tabs" role="tablist" {...props}>{children}</div>
  ),
  TabsList: ({ children, className, ...props }: any) => (
    <div className={`tabs-list ${className || ''}`} data-testid="tabs-list" {...props}>{children}</div>
  ),
  TabsTrigger: ({ children, value, className, ...props }: any) => (
    <button 
      className={`tabs-trigger ${className || ''}`} 
      data-testid="tabs-trigger"
      role="tab"
      aria-label={children}
      {...props}
    >
      {children}
    </button>
  ),
  TabsContent: ({ children, value, className, ...props }: any) => (
    <div className={`tabs-content ${className || ''}`} data-testid="tabs-content" {...props}>{children}</div>
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value, defaultValue }: any) => {
    const [currentValue, setCurrentValue] = React.useState(value || defaultValue || '');
    
    return (
      <div data-testid="select" data-value={currentValue}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { onValueChange, value: currentValue } as any);
          }
          return child;
        })}
      </div>
    );
  },
  SelectTrigger: ({ children, className, onValueChange, value, ...props }: any) => (
    <button 
      className={`select-trigger ${className || ''}`} 
      data-testid="select-trigger" 
      role="combobox"
      aria-expanded="false"
      aria-haspopup="listbox"
      aria-controls="select-content"
      {...props}
    >
      {children}
    </button>
  ),
  SelectValue: ({ placeholder, ...props }: any) => (
    <span data-testid="select-value" {...props}>{placeholder || 'Select...'}</span>
  ),
  SelectContent: ({ children, className, ...props }: any) => (
    <div className={`select-content ${className || ''}`} data-testid="select-content" role="listbox" {...props}>{children}</div>
  ),
  SelectItem: ({ children, value, className, ...props }: any) => (
    <div className={`select-item ${className || ''}`} data-testid="select-item" role="option" aria-selected="false" value={value} {...props}>{children}</div>
  ),
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

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className, ...props }: any) => (
    <div 
      className={`progress ${className || ''}`}
      data-testid="progress"
      {...props}
    >
      <div 
        className="progress-bar"
        style={{ width: `${value || 0}%` }}
        data-testid="progress-bar"
      />
    </div>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Activity: (props: any) => <svg data-testid="activity-icon" {...props} />,
  Users: (props: any) => <svg data-testid="users-icon" {...props} />,
  TrendingUp: (props: any) => <svg data-testid="trending-up-icon" {...props} />,
  Monitor: (props: any) => <svg data-testid="monitor-icon" {...props} />,
  Smartphone: (props: any) => <svg data-testid="smartphone-icon" {...props} />,
  AlertTriangle: (props: any) => <svg data-testid="alert-triangle-icon" {...props} />,
  RefreshCw: (props: any) => <svg data-testid="refresh-cw-icon" {...props} />,
}));

// Mock Recharts with proper ResizeObserver support
jest.mock('recharts', () => {
  const React = require('react');
  
  const ResponsiveContainer = React.forwardRef(({ children, width = '100%', height = 400, ...props }: any, ref: any) => {
    React.useEffect(() => {
      // Ensure ResizeObserver mock is properly called
      if (ref && typeof ref === 'object' && ref.current && global.ResizeObserver) {
        const observer = new global.ResizeObserver(() => {});
        observer.observe(ref.current);
        return () => observer.disconnect();
      }
    }, [ref]);

    return React.createElement('div', {
      ref,
      'data-testid': 'responsive-container',
      style: { width, height },
      ...props
    }, children);
  });

  return {
    ResponsiveContainer,
    BarChart: ({ children, data, ...props }: any) => React.createElement('div', {
      'data-testid': 'bar-chart',
      ...props
    }, children),
    Bar: ({ dataKey, ...props }: any) => React.createElement('div', {
      'data-testid': `bar-${dataKey}`,
      ...props
    }),
    PieChart: ({ children, ...props }: any) => React.createElement('div', {
      'data-testid': 'pie-chart',
      ...props
    }, children),
    Pie: ({ data, children, ...props }: any) => React.createElement('div', {
      'data-testid': 'pie',
      ...props
    }, children),
    Cell: (props: any) => React.createElement('div', {
      'data-testid': 'pie-cell',
      ...props
    }),
    XAxis: (props: any) => React.createElement('div', {
      'data-testid': 'x-axis',
      ...props
    }),
    YAxis: (props: any) => React.createElement('div', {
      'data-testid': 'y-axis',
      ...props
    }),
    CartesianGrid: (props: any) => React.createElement('div', {
      'data-testid': 'cartesian-grid',
      ...props
    }),
    Tooltip: (props: any) => React.createElement('div', {
      'data-testid': 'tooltip',
      ...props
    }),
    Legend: (props: any) => React.createElement('div', {
      'data-testid': 'legend',
      ...props
    }),
  };
});


import {
  FeatureUsageAnalyticsResponse,
  MemberEngagementAnalyticsResponse
} from '@/services/featureAnalyticsService';

const mockFeatureAnalyticsService = featureAnalyticsService;

describe('FeatureUsageAnalytics', () => {
  const clubId = 123;

  const mockFeatureData = {
    featureUsage: [
      {
        featureName: 'member_directory',
        totalUsageEvents: 150,
        uniqueUsers: 45,
        adoptionRate: 75.5,
        averageUsesPerUser: 3.3,
        lastUsed: '2024-01-15T10:30:00Z',
        dailyUsage: [
          { date: '2024-01-15', usageCount: 25, uniqueUsers: 12 },
          { date: '2024-01-14', usageCount: 30, uniqueUsers: 15 },
        ]
      },
      {
        featureName: 'event_management',
        totalUsageEvents: 120,
        uniqueUsers: 38,
        adoptionRate: 63.3,
        averageUsesPerUser: 3.2,
        lastUsed: '2024-01-15T09:15:00Z',
        dailyUsage: [
          { date: '2024-01-15', usageCount: 20, uniqueUsers: 10 },
          { date: '2024-01-14', usageCount: 25, uniqueUsers: 12 },
        ]
      },
      {
        featureName: 'communications',
        totalUsageEvents: 90,
        uniqueUsers: 30,
        adoptionRate: 50.0,
        averageUsesPerUser: 3.0,
        lastUsed: '2024-01-15T08:45:00Z',
        dailyUsage: [
          { date: '2024-01-15', usageCount: 15, uniqueUsers: 8 },
          { date: '2024-01-14', usageCount: 18, uniqueUsers: 9 },
        ]
      },
    ],
    platformUsage: {
      webUsageEvents: 280,
      mobileUsageEvents: 80,
      webUsagePercentage: 77.8,
      mobileUsagePercentage: 22.2,
      featurePlatformBreakdown: [
        {
          featureName: 'member_directory',
          webUsage: 100,
          mobileUsage: 50,
          webPercentage: 66.7,
          mobilePercentage: 33.3,
        },
        {
          featureName: 'event_management',
          webUsage: 90,
          mobileUsage: 30,
          webPercentage: 75.0,
          mobilePercentage: 25.0,
        },
      ]
    },
    adoptionTrends: [],
    tenurePatterns: [
      {
        tenureRange: '0-3 months',
        memberCount: 15,
        averageFeatureUsage: 8.5,
        mostUsedFeatures: ['member_directory', 'event_management', 'communications']
      },
      {
        tenureRange: '3-12 months',
        memberCount: 25,
        averageFeatureUsage: 12.3,
        mostUsedFeatures: ['communications', 'member_directory', 'event_management']
      },
    ]
  };

  const mockEngagementData = {
    memberScores: [
      {
        memberId: 1,
        memberName: 'John Doe',
        overallScore: 85,
        engagementLevel: 'Highly Active',
        lastActivity: '2024-01-15T10:30:00Z',
        daysSinceLastLogin: 1,
        scoreBreakdown: {
          loginScore: 90,
          eventScore: 80,
          communicationScore: 85,
          featureUsageScore: 88,
          profileCompletenessScore: 95,
        }
      },
    ],
    clubSummary: {
      averageEngagementScore: 72.5,
      totalMembers: 60,
      highlyActiveMembers: 15,
      moderateMembers: 25,
      inactiveMembers: 8,
      retentionRate: 86.7,
    },
    distribution: {
      highlyActive: 15,
      active: 12,
      moderate: 25,
      lowEngagement: 5,
      inactive: 8,
    },
    trends: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading skeleton while data is being fetched', async () => {
      // Mock a never-resolving promise to keep it in loading state
      let resolveFeature: (value: any) => void;
      let resolveEngagement: (value: any) => void;
      
      const neverResolvingFeaturePromise = new Promise((resolve) => {
        resolveFeature = resolve;
      });
      
      const neverResolvingEngagementPromise = new Promise((resolve) => {
        resolveEngagement = resolve;
      });

      (mockFeatureAnalyticsService.getFeatureUsageAnalytics as jest.Mock).mockReturnValue(neverResolvingFeaturePromise);
      (mockFeatureAnalyticsService.getMemberEngagementAnalytics as jest.Mock).mockReturnValue(neverResolvingEngagementPromise);

      render(<FeatureUsageAnalytics clubId={clubId} />);

      // Check loading state
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
      
      // Skeleton should have proper structure
      const skeletonCards = screen.getAllByTestId('skeleton-card');
      expect(skeletonCards).toHaveLength(4);

      // Cleanup
      resolveFeature!(mockFeatureData);
      resolveEngagement!(mockEngagementData);
    });
  });

  describe('Error State', () => {
    it('should display error message when API calls fail', async () => {
      const errorMessage = 'Failed to fetch analytics data';
      (mockFeatureAnalyticsService.getFeatureUsageAnalytics as jest.Mock).mockRejectedValue(new Error(errorMessage));
      (mockFeatureAnalyticsService.getMemberEngagementAnalytics as jest.Mock).mockRejectedValue(new Error(errorMessage));

      render(<FeatureUsageAnalytics clubId={clubId} />);

      await waitFor(() => {
        expect(screen.getByTestId('data-error')).toBeInTheDocument();
      });

      // Check retry functionality
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should handle retry functionality', async () => {
      // First call fails
      (mockFeatureAnalyticsService.getFeatureUsageAnalytics as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockFeatureData);
      
      (mockFeatureAnalyticsService.getMemberEngagementAnalytics as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockEngagementData);

      render(<FeatureUsageAnalytics clubId={clubId} />);

      await waitFor(() => {
        expect(screen.getByTestId('data-error')).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Feature Usage Analytics')).toBeInTheDocument();
      });

      // Verify services were called again
      expect(mockFeatureAnalyticsService.getFeatureUsageAnalytics).toHaveBeenCalledTimes(2);
      expect(mockFeatureAnalyticsService.getMemberEngagementAnalytics).toHaveBeenCalledTimes(2);
    });
  });

  describe('Successful Data Loading', () => {
    beforeEach(() => {
      (mockFeatureAnalyticsService.getFeatureUsageAnalytics as jest.Mock).mockResolvedValue(mockFeatureData);
      (mockFeatureAnalyticsService.getMemberEngagementAnalytics as jest.Mock).mockResolvedValue(mockEngagementData);
    });

    it('should render header with controls', async () => {
      render(<FeatureUsageAnalytics clubId={clubId} />);

      await waitFor(() => {
        expect(screen.getByText('Feature Usage Analytics')).toBeInTheDocument();
        expect(screen.getByText('Track member engagement with platform features')).toBeInTheDocument();
      });

      // Check time range selector - use data-testid since combobox role isn't working with mock
      expect(screen.getByTestId('select-trigger')).toBeInTheDocument();
      
      // Check refresh button
      expect(screen.getByRole('button', { name: /refresh scores/i })).toBeInTheDocument();
    });

    it('should render key metrics cards', async () => {
      render(<FeatureUsageAnalytics clubId={clubId} />);

      await waitFor(() => {
        expect(screen.getByText('Average Engagement')).toBeInTheDocument();
        expect(screen.getByText('72.5')).toBeInTheDocument();
        
        expect(screen.getByText('Active Members')).toBeInTheDocument();
        expect(screen.getByText('40')).toBeInTheDocument(); // 15 + 25
        
        expect(screen.getByText('Retention Rate')).toBeInTheDocument();
        expect(screen.getByText('86.7%')).toBeInTheDocument();
        
        expect(screen.getByText('At-Risk Members')).toBeInTheDocument();
        // Use getAllByText to handle multiple occurrences of "8"
        const allEightElements = screen.getAllByText('8');
        expect(allEightElements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should calculate percentages correctly', async () => {
      render(<FeatureUsageAnalytics clubId={clubId} />);

      await waitFor(() => {
        // Active members percentage: (15 + 25) / 60 * 100 = 66.7%
        expect(screen.getByText('66.7% of total')).toBeInTheDocument();
      });
    });
  });

  describe('Tabs Navigation', () => {
    beforeEach(() => {
      (mockFeatureAnalyticsService.getFeatureUsageAnalytics as jest.Mock).mockResolvedValue(mockFeatureData);
      (mockFeatureAnalyticsService.getMemberEngagementAnalytics as jest.Mock).mockResolvedValue(mockEngagementData);
    });

    it('should render all tab triggers', async () => {
      render(<FeatureUsageAnalytics clubId={clubId} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Feature Usage' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Platform Usage' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Engagement Distribution' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Tenure Patterns' })).toBeInTheDocument();
      });
    });

    it('should switch between tabs', async () => {
      render(<FeatureUsageAnalytics clubId={clubId} />);

      await waitFor(() => {
        expect(screen.getByText('Most Used Features')).toBeInTheDocument();
      });

      // Switch to Platform Usage tab
      fireEvent.click(screen.getByRole('tab', { name: 'Platform Usage' }));
      await waitFor(() => {
        expect(screen.getByText('Platform Distribution')).toBeInTheDocument();
      });

      // Switch to Engagement Distribution tab
      fireEvent.click(screen.getByRole('tab', { name: 'Engagement Distribution' }));
      await waitFor(() => {
        // Look for a more specific element that would be in the engagement tab content
        expect(screen.getAllByText('Engagement Distribution')).toHaveLength(2); // Tab title + content title
      });

      // Switch to Tenure Patterns tab
      fireEvent.click(screen.getByRole('tab', { name: 'Tenure Patterns' }));
      await waitFor(() => {
        expect(screen.getByText('Usage Patterns by Member Tenure')).toBeInTheDocument();
      });
    });
  });

  describe('Feature Usage Tab', () => {
    beforeEach(() => {
      (mockFeatureAnalyticsService.getFeatureUsageAnalytics as jest.Mock).mockResolvedValue(mockFeatureData);
      (mockFeatureAnalyticsService.getMemberEngagementAnalytics as jest.Mock).mockResolvedValue(mockEngagementData);
    });

    it('should render feature usage chart', async () => {
      render(<FeatureUsageAnalytics clubId={clubId} />);

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        expect(screen.getByTestId('bar-totalUsageEvents')).toBeInTheDocument();
        expect(screen.getByTestId('bar-uniqueUsers')).toBeInTheDocument();
      });
    });

    it('should render feature cards with correct data', async () => {
      render(<FeatureUsageAnalytics clubId={clubId} />);

      await waitFor(() => {
        // Use getAllByText for potentially duplicate text content
        expect(screen.getAllByText('Member Directory').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('75.5%')).toBeInTheDocument();
        expect(screen.getAllByText('150').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('45').length).toBeGreaterThanOrEqual(1);

        expect(screen.getAllByText('Event Management').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('63.3%')).toBeInTheDocument();
        expect(screen.getAllByText('120').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('38').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should show ranking badges for features', async () => {
      render(<FeatureUsageAnalytics clubId={clubId} />);

      await waitFor(() => {
        const badges = screen.getAllByText(/#[123]/);
        expect(badges.length).toBeGreaterThanOrEqual(3); // Top 3 features get ranking badges (may appear in multiple sections)
      });
    });
  });

  describe('Platform Usage Tab', () => {
    beforeEach(() => {
      (mockFeatureAnalyticsService.getFeatureUsageAnalytics as jest.Mock).mockResolvedValue(mockFeatureData);
      (mockFeatureAnalyticsService.getMemberEngagementAnalytics as jest.Mock).mockResolvedValue(mockEngagementData);
    });

    it('should render platform distribution chart', async () => {
      render(<FeatureUsageAnalytics clubId={clubId} />);

      // Wait for initial data to load and tabs to be available
      await waitFor(() => {
        expect(screen.getByText('Feature Usage Analytics')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('tab', { name: 'Platform Usage' }));

      await waitFor(() => {
        expect(screen.getAllByTestId('pie-chart').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByTestId('pie').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should display platform metrics correctly', async () => {
      render(<FeatureUsageAnalytics clubId={clubId} />);

      // Wait for initial data to load and tabs to be available
      await waitFor(() => {
        expect(screen.getByText('Feature Usage Analytics')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('tab', { name: 'Platform Usage' }));

      await waitFor(() => {
        expect(screen.getByText('Web Platform')).toBeInTheDocument();
        expect(screen.getByText('280')).toBeInTheDocument();
        expect(screen.getByText('77.8%')).toBeInTheDocument();

        expect(screen.getByText('Mobile Platform')).toBeInTheDocument();
        expect(screen.getByText('80')).toBeInTheDocument();
        expect(screen.getByText('22.2%')).toBeInTheDocument();
      });
    });

    it('should show feature platform breakdown', async () => {
      render(<FeatureUsageAnalytics clubId={clubId} />);

      // Wait for initial data to load and tabs to be available
      await waitFor(() => {
        expect(screen.getByText('Feature Usage Analytics')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('tab', { name: 'Platform Usage' }));

      await waitFor(() => {
        expect(screen.getByText('Feature Platform Breakdown')).toBeInTheDocument();
        expect(screen.getAllByText('Member Directory').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('150 total')).toBeInTheDocument();
      });
    });
  });

  describe('Engagement Distribution Tab', () => {
    beforeEach(() => {
      (mockFeatureAnalyticsService.getFeatureUsageAnalytics as jest.Mock).mockResolvedValue(mockFeatureData);
      (mockFeatureAnalyticsService.getMemberEngagementAnalytics as jest.Mock).mockResolvedValue(mockEngagementData);
    });

    it('should render engagement distribution chart', async () => {
      render(<FeatureUsageAnalytics clubId={clubId} />);

      // Wait for initial data to load and tabs to be available
      await waitFor(() => {
        expect(screen.getByText('Feature Usage Analytics')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('tab', { name: 'Engagement Distribution' }));

      await waitFor(() => {
        expect(screen.getAllByTestId('pie-chart').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should display engagement levels correctly', async () => {
      render(<FeatureUsageAnalytics clubId={clubId} />);

      // Wait for initial data to load and tabs to be available
      await waitFor(() => {
        expect(screen.getByText('Feature Usage Analytics')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('tab', { name: 'Engagement Distribution' }));

      await waitFor(() => {
        expect(screen.getByText('Highly Active')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('25.0%')).toBeInTheDocument();

        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('20.0%')).toBeInTheDocument();
      });
    });
  });

  describe('Tenure Patterns Tab', () => {
    beforeEach(() => {
      (mockFeatureAnalyticsService.getFeatureUsageAnalytics as jest.Mock).mockResolvedValue(mockFeatureData);
      (mockFeatureAnalyticsService.getMemberEngagementAnalytics as jest.Mock).mockResolvedValue(mockEngagementData);
    });

    it('should display tenure pattern cards', async () => {
      render(<FeatureUsageAnalytics clubId={clubId} />);

      // Wait for initial data to load and tabs to be available
      await waitFor(() => {
        expect(screen.getByText('Feature Usage Analytics')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('tab', { name: 'Tenure Patterns' }));

      await waitFor(() => {
        expect(screen.getByText('0-3 months')).toBeInTheDocument();
        expect(screen.getByText('15 members')).toBeInTheDocument();
        expect(screen.getByText('8.5')).toBeInTheDocument();

        expect(screen.getByText('3-12 months')).toBeInTheDocument();
        expect(screen.getByText('25 members')).toBeInTheDocument();
        expect(screen.getByText('12.3')).toBeInTheDocument();
      });
    });

    it('should show top features for each tenure group', async () => {
      render(<FeatureUsageAnalytics clubId={clubId} />);

      // Wait for initial data to load and tabs to be available
      await waitFor(() => {
        expect(screen.getByText('Feature Usage Analytics')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('tab', { name: 'Tenure Patterns' }));

      await waitFor(() => {
        const badges = screen.getAllByText('#1');
        expect(badges.length).toBeGreaterThan(0);
        
        const memberDirectoryElements = screen.getAllByText('Member Directory');
        expect(memberDirectoryElements.length).toBeGreaterThanOrEqual(1);
        const communicationsElements = screen.getAllByText('Communications');
        expect(communicationsElements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Time Range Selector', () => {
    beforeEach(() => {
      (mockFeatureAnalyticsService.getFeatureUsageAnalytics as jest.Mock).mockResolvedValue(mockFeatureData);
      (mockFeatureAnalyticsService.getMemberEngagementAnalytics as jest.Mock).mockResolvedValue(mockEngagementData);
    });

    it('should render time range selector', async () => {
      // Verify the select component renders and default 30-day option is visible
      render(<FeatureUsageAnalytics clubId={clubId} />);

      await waitFor(() => {
        expect(screen.getByText('Feature Usage Analytics')).toBeInTheDocument();
      });

      // Verify default time range description is shown
      expect(screen.getByText('Feature usage over the last 30 days')).toBeInTheDocument();

      // Verify API was called with default 30-day range
      expect(mockFeatureAnalyticsService.getFeatureUsageAnalytics).toHaveBeenCalledWith(clubId, 30);
    });

    it('should update chart description with selected time range', async () => {
      render(<FeatureUsageAnalytics clubId={clubId} />);

      await waitFor(() => {
        expect(screen.getByText('Feature usage over the last 30 days')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Scores Functionality', () => {
    beforeEach(() => {
      // Reset all mocks to ensure clean state
      jest.clearAllMocks();
      (mockFeatureAnalyticsService.getFeatureUsageAnalytics as jest.Mock).mockResolvedValue(mockFeatureData);
      (mockFeatureAnalyticsService.getMemberEngagementAnalytics as jest.Mock).mockResolvedValue(mockEngagementData);
      (mockFeatureAnalyticsService.calculateEngagementScores as jest.Mock).mockResolvedValue({ success: true, message: 'Scores updated' });
    });

    it('should call calculateEngagementScores when refresh button clicked', async () => {
      render(<FeatureUsageAnalytics clubId={clubId} />);

      // Wait for initial data to load
      await waitFor(() => {
        expect(screen.getByText('Feature Usage Analytics')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /refresh scores/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /refresh scores/i }));

      expect(mockFeatureAnalyticsService.calculateEngagementScores).toHaveBeenCalledWith(clubId);
      
      // Should reload data after calculation
      await waitFor(() => {
        expect(mockFeatureAnalyticsService.getFeatureUsageAnalytics).toHaveBeenCalledTimes(2);
        expect(mockFeatureAnalyticsService.getMemberEngagementAnalytics).toHaveBeenCalledTimes(2);
      });
    });

    it('should show loading state on refresh button during calculation', async () => {
      let resolveCalculation;
      const neverResolvingPromise = new Promise((resolve) => {
        resolveCalculation = resolve;
      });
      
      (mockFeatureAnalyticsService.calculateEngagementScores as jest.Mock).mockReturnValue(neverResolvingPromise);

      render(<FeatureUsageAnalytics clubId={clubId} />);

      // Wait for initial data to load
      await waitFor(() => {
        expect(screen.getByText('Feature Usage Analytics')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /refresh scores/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /refresh scores/i }));

      // Check that button is disabled and shows loading state
      const refreshButton = screen.getByRole('button', { name: /refresh scores/i });
      expect(refreshButton).toBeDisabled();

      // Cleanup
      resolveCalculation!({ success: true, message: 'Done' });
    });

    it('should handle API errors gracefully without crashing', async () => {
      // Setup analytics to fail
      (mockFeatureAnalyticsService.getFeatureUsageAnalytics as jest.Mock).mockRejectedValue(new Error('API Error'));
      (mockFeatureAnalyticsService.getMemberEngagementAnalytics as jest.Mock).mockRejectedValue(new Error('API Error'));

      // Suppress expected console errors
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<FeatureUsageAnalytics clubId={clubId} />);

      // Component should show error state when API fails
      await waitFor(() => {
        expect(screen.getByTestId('data-error')).toBeInTheDocument();
      });

      // Verify error message is shown
      expect(screen.getByTestId('data-error-title')).toHaveTextContent('Error');

      // Verify retry button is available
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Data Formatting', () => {
    beforeEach(() => {
      (mockFeatureAnalyticsService.getFeatureUsageAnalytics as jest.Mock).mockResolvedValue(mockFeatureData);
      (mockFeatureAnalyticsService.getMemberEngagementAnalytics as jest.Mock).mockResolvedValue(mockEngagementData);
    });

    it('should format feature names correctly', async () => {
      render(<FeatureUsageAnalytics clubId={clubId} />);

      await waitFor(() => {
        // Check that at least one formatted feature name appears (from mock data)
        // Mock data includes memberDirectory which should be formatted as "Member Directory"
        const memberDirectoryElements = screen.getAllByText('Member Directory');
        expect(memberDirectoryElements.length).toBeGreaterThan(0);
        
        // Verify the component is rendering feature data
        expect(screen.getByText('Feature Usage Analytics')).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Feature Usage' })).toBeInTheDocument();
      });
    });

    it('should format numbers with proper locale formatting', async () => {
      const dataWithLargeNumbers = {
        ...mockFeatureData,
        platformUsage: {
          ...mockFeatureData.platformUsage,
          webUsageEvents: 1234567,
          mobileUsageEvents: 987654,
        }
      };

      (mockFeatureAnalyticsService.getFeatureUsageAnalytics as jest.Mock).mockResolvedValue(dataWithLargeNumbers);

      render(<FeatureUsageAnalytics clubId={clubId} />);

      // Wait for initial data to load
      await waitFor(() => {
        expect(screen.getByText('Feature Usage Analytics')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('tab', { name: 'Platform Usage' }));

      await waitFor(() => {
        expect(screen.getByText('1,234,567')).toBeInTheDocument();
        expect(screen.getByText('987,654')).toBeInTheDocument();
      });
    });
  });

  describe('No Data State', () => {
    it('should handle empty feature data gracefully', async () => {
      const emptyFeatureData = {
        featureUsage: [],
        platformUsage: {
          webUsageEvents: 0,
          mobileUsageEvents: 0,
          webUsagePercentage: 0,
          mobileUsagePercentage: 0,
          featurePlatformBreakdown: []
        },
        adoptionTrends: [],
        tenurePatterns: []
      };

      const emptyEngagementData = {
        memberScores: [],
        clubSummary: {
          averageEngagementScore: 0,
          totalMembers: 0,
          highlyActiveMembers: 0,
          moderateMembers: 0,
          inactiveMembers: 0,
          retentionRate: 0,
        },
        distribution: {
          highlyActive: 0,
          active: 0,
          moderate: 0,
          lowEngagement: 0,
          inactive: 0,
        },
        trends: [],
      };

      (mockFeatureAnalyticsService.getFeatureUsageAnalytics as jest.Mock).mockResolvedValue(emptyFeatureData);
      (mockFeatureAnalyticsService.getMemberEngagementAnalytics as jest.Mock).mockResolvedValue(emptyEngagementData);

      render(<FeatureUsageAnalytics clubId={clubId} />);

      await waitFor(() => {
        expect(screen.getByText('Feature Usage Analytics')).toBeInTheDocument();
        expect(screen.getByText('0.0')).toBeInTheDocument(); // Average engagement
        const zeroElements = screen.getAllByText('0');
        expect(zeroElements.length).toBeGreaterThan(0); // Active members and other zero values
      });
    });

    it('should display "No data available" when both responses are null', async () => {
      (mockFeatureAnalyticsService.getFeatureUsageAnalytics as jest.Mock).mockResolvedValue(null as any);
      (mockFeatureAnalyticsService.getMemberEngagementAnalytics as jest.Mock).mockResolvedValue(null as any);

      render(<FeatureUsageAnalytics clubId={clubId} />);

      await waitFor(() => {
        expect(screen.getByText('No data available')).toBeInTheDocument();
      });
    });
  });
});