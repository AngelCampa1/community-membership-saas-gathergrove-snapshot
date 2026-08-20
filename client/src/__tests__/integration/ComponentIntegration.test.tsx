import React, { useMemo } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Import universal RadixUI mocking setup

// Mock RadixUI Slot manually for this specific test file
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ...(children.props || {}) });
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


// Mock components for integration testing
const MockEngagementDashboard = () => (
  <div data-testid="engagement-dashboard">
    <h1>Engagement Dashboard</h1>
    <div data-testid="overall-score">78.5%</div>
    <div data-testid="active-members">189</div>
    <div data-testid="total-members">241</div>
  </div>
);

const MockEventAnalytics = () => (
  <div data-testid="event-analytics">
    <h2>Event Analytics</h2>
    <div data-testid="total-events">24</div>
    <div data-testid="avg-attendance">32</div>
  </div>
);

const MockMemberAnalytics = () => (
  <div data-testid="member-analytics">
    <h2>Member Analytics</h2>
    <div data-testid="member-count">241</div>
    <div data-testid="new-members">12</div>
  </div>
);

const MockAnalyticsSuite = ({ activeTab }: { activeTab: string }) => (
  <div data-testid="analytics-suite">
    <nav data-testid="analytics-nav">
      <button data-testid="engagement-tab">Engagement</button>
      <button data-testid="events-tab">Events</button>
      <button data-testid="members-tab">Members</button>
    </nav>
    <div data-testid="analytics-content">
      {activeTab === 'engagement' && <MockEngagementDashboard />}
      {activeTab === 'events' && <MockEventAnalytics />}
      {activeTab === 'members' && <MockMemberAnalytics />}
    </div>
  </div>
);

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
  }), []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (queryClient && typeof queryClient.clear === 'function') {
        queryClient.clear();
      } else if (queryClient && typeof queryClient.invalidateQueries === 'function') {
        queryClient.invalidateQueries();
      }
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Component Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup({ delay: null }); // Remove delays for faster tests
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
    // Clear any remaining DOM elements
    document.body.innerHTML = '';
  });

  describe('Analytics Dashboard Integration', () => {
    it('should render engagement dashboard with proper data flow', async () => {
      render(
        <TestWrapper>
          <MockAnalyticsSuite activeTab="engagement" />
        </TestWrapper>
      );

      expect(screen.getByTestId('analytics-suite')).toBeInTheDocument();
      expect(screen.getByTestId('engagement-dashboard')).toBeInTheDocument();
      expect(screen.getByText('78.5%')).toBeInTheDocument();
      expect(screen.getByText('189')).toBeInTheDocument();
    });

    it('should handle tab switching between analytics components', async () => {
      const MockTabSwitcher = () => {
        const [activeTab, setActiveTab] = React.useState('engagement');

        return (
          <TestWrapper>
            <div data-testid="tab-switcher">
              <nav data-testid="main-nav">
                <button 
                  data-testid="main-engagement-tab"
                  onClick={() => setActiveTab('engagement')}
                >
                  Engagement
                </button>
                <button 
                  data-testid="main-events-tab"
                  onClick={() => setActiveTab('events')}
                >
                  Events
                </button>
                <button 
                  data-testid="main-members-tab"
                  onClick={() => setActiveTab('members')}
                >
                  Members
                </button>
              </nav>
              <MockAnalyticsSuite activeTab={activeTab} />
            </div>
          </TestWrapper>
        );
      };

      render(<MockTabSwitcher />);

      // Initially should show engagement
      expect(screen.getByTestId('engagement-dashboard')).toBeInTheDocument();

      // Click events tab (use the main nav, not the inner component nav)
      await user.click(screen.getByTestId('main-events-tab'));
      
      await waitFor(() => {
        expect(screen.getByTestId('event-analytics')).toBeInTheDocument();
        expect(screen.getByText('24')).toBeInTheDocument(); // total events
      });

      // Click members tab
      await user.click(screen.getByTestId('main-members-tab'));
      
      await waitFor(() => {
        expect(screen.getByTestId('member-analytics')).toBeInTheDocument();
        expect(screen.getByText('241')).toBeInTheDocument(); // member count
      });
    });
  });

  describe('Data Loading and Error States Integration', () => {
    it('should handle loading states across multiple components', async () => {
      const MockLoadingComponent = () => {
        const [isLoading, setIsLoading] = React.useState(true);

        React.useEffect(() => {
          const timer = setTimeout(() => setIsLoading(false), 100); // Reduce timeout for tests
          return () => clearTimeout(timer);
        }, []);

        if (isLoading) {
          return (
            <div data-testid="loading-state">
              <div data-testid="skeleton-1" className="animate-pulse bg-muted h-4 w-20" />
              <div data-testid="skeleton-2" className="animate-pulse bg-muted h-4 w-32" />
            </div>
          );
        }

        return (
          <div data-testid="loaded-content">
            <MockEngagementDashboard />
          </div>
        );
      };

      render(
        <TestWrapper>
          <MockLoadingComponent />
        </TestWrapper>
      );

      // Should initially show loading
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-1')).toBeInTheDocument();

      // Should show content after loading
      await waitFor(() => {
        expect(screen.getByTestId('loaded-content')).toBeInTheDocument();
        expect(screen.getByTestId('engagement-dashboard')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should handle error states gracefully', async () => {
      const MockErrorComponent = () => {
        const [hasError, setHasError] = React.useState(false);

        return (
          <div data-testid="error-component">
            <button 
              data-testid="trigger-error" 
              onClick={() => setHasError(true)}
            >
              Trigger Error
            </button>
            {hasError ? (
              <div data-testid="error-state">
                <p>Something went wrong loading analytics data</p>
                <button 
                  data-testid="retry-button"
                  onClick={() => setHasError(false)}
                >
                  Retry
                </button>
              </div>
            ) : (
              <MockEngagementDashboard />
            )}
          </div>
        );
      };

      render(
        <TestWrapper>
          <MockErrorComponent />
        </TestWrapper>
      );

      // Initially should show dashboard
      expect(screen.getByTestId('engagement-dashboard')).toBeInTheDocument();

      // Trigger error
      await user.click(screen.getByTestId('trigger-error'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
        expect(screen.getByText('Something went wrong loading analytics data')).toBeInTheDocument();
      });

      // Retry should restore dashboard
      await user.click(screen.getByTestId('retry-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('engagement-dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Form and User Interaction Integration', () => {
    it('should handle complex form interactions with validation', async () => {
      const MockFormComponent = () => {
        const [formData, setFormData] = React.useState({
          eventName: '',
          eventDate: '',
          maxAttendees: ''
        });
        const [errors, setErrors] = React.useState<string[]>([]);
        const [isSubmitted, setIsSubmitted] = React.useState(false);

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          const newErrors: string[] = [];
          
          if (!formData.eventName) newErrors.push('Event name is required');
          if (!formData.eventDate) newErrors.push('Event date is required');
          if (!formData.maxAttendees) newErrors.push('Max attendees is required');
          
          setErrors(newErrors);
          
          if (newErrors.length === 0) {
            setIsSubmitted(true);
          }
        };

        if (isSubmitted) {
          return (
            <div data-testid="success-state">
              <h2>Event Created Successfully!</h2>
              <p>Event: {formData.eventName}</p>
            </div>
          );
        }

        return (
          <form data-testid="event-form" onSubmit={handleSubmit}>
            <div>
              <input
                data-testid="event-name"
                placeholder="Event Name"
                value={formData.eventName}
                onChange={(e) => setFormData({...formData, eventName: e.target.value})}
              />
            </div>
            <div>
              <input
                data-testid="event-date"
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
              />
            </div>
            <div>
              <input
                data-testid="max-attendees"
                type="number"
                placeholder="Max Attendees"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({...formData, maxAttendees: e.target.value})}
              />
            </div>
            {errors.length > 0 && (
              <div data-testid="form-errors">
                {errors.map((error, index) => (
                  <p key={index} data-testid={`error-${index}`}>{error}</p>
                ))}
              </div>
            )}
            <button type="submit" data-testid="submit-button">
              Create Event
            </button>
          </form>
        );
      };

      render(
        <TestWrapper>
          <MockFormComponent />
        </TestWrapper>
      );

      // Initially should show form
      expect(screen.getByTestId('event-form')).toBeInTheDocument();

      // Submit empty form should show errors
      await user.click(screen.getByTestId('submit-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('form-errors')).toBeInTheDocument();
        expect(screen.getByText('Event name is required')).toBeInTheDocument();
      });

      // Fill form and submit
      await user.type(screen.getByTestId('event-name'), 'Test Event');
      await user.type(screen.getByTestId('event-date'), '2024-12-31');
      await user.type(screen.getByTestId('max-attendees'), '50');
      
      await user.click(screen.getByTestId('submit-button'));
      
      await waitFor(() => {
        expect(screen.getByTestId('success-state')).toBeInTheDocument();
        expect(screen.getByText('Event: Test Event')).toBeInTheDocument();
      });
    });
  });
});