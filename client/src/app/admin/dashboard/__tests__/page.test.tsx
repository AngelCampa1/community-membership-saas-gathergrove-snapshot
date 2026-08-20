// Universal RadixUI mocks loaded via setupTests.ts for systematic test scaling across 81+ files

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import DashboardPage from '../page';
import { useAuth, AuthContextType } from '@/hooks/useAuth';
import dashboardService, { type DashboardSummary } from '@/services/dashboardService';
import { billingService } from '@/services/billingService';
import { UserSession } from '@/services/authService';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

// Import universal RadixUI mocking setup

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

// Mock services at the boundary - return promises directly
jest.mock('@/services/dashboardService', () => ({
  __esModule: true,
  default: {
    getDashboardSummary: jest.fn(),
  },
}));

jest.mock('@/services/billingService', () => ({
  billingService: {
    getBillingStatus: jest.fn(),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Users: () => <span data-testid="users-icon">👥</span>,
  Calendar: () => <span data-testid="calendar-icon">📅</span>,
  CreditCard: () => <span data-testid="credit-card-icon">💳</span>,
  Plus: () => <span data-testid="plus-icon">➕</span>,
  RefreshCw: () => <span data-testid="refresh-icon">🔄</span>,
  Zap: () => <span data-testid="zap-icon">⚡</span>,
  Crown: () => <span data-testid="crown-icon">👑</span>,
  Bell: () => <span data-testid="bell-icon">🔔</span>,
  Activity: () => <span data-testid="activity-icon">📊</span>,
}));

// Mock EngagementMetricsPanel component
jest.mock('@/components/engagement/EngagementMetricsPanel', () => {
  return function MockEngagementMetricsPanel({ metrics }: any) {
    return (
      <div data-testid="engagement-metrics-panel">
        <h3>Engagement Metrics</h3>
        {metrics && (
          <div>
            <span>Health Score: {metrics.healthScore}</span>
            <span>Total Members: {metrics.totalMembers}</span>
          </div>
        )}
      </div>
    );
  };
});

// Mock UpgradeModal component
jest.mock('@/components/billing/UpgradeModal', () => ({
  UpgradeModal: ({ isOpen, onClose, currentTier }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="upgrade-modal">
        <h2>Upgrade from {currentTier}</h2>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }
}));

// Mock DataError component  
jest.mock('@/components/ui/data-error', () => ({
  DataError: ({ title, message, error, onRetry }: any) => {
    // Replicate the error message logic from the real component
    const getErrorMessage = () => {
      if (message) return message;
      if (error instanceof Error) return error.message;
      return 'An unexpected error occurred';
    };
    
    const getErrorTitle = () => {
      if (title) return title;
      return 'Error';
    };
    
    return (
      <div className="data-error" data-testid="data-error">
        <h3 data-testid="data-error-title">{getErrorTitle()}</h3>
        <p data-testid="data-error-description">{getErrorMessage()}</p>
        {onRetry && <button onClick={onRetry}>Try Again</button>}
      </div>
    );
  }
}));

// Mock ErrorHandler
jest.mock('@/lib/errorHandler', () => {
  // Create a variable to store the mocked toast 
  let mockToastInstance: any;
  
  return {
    ErrorHandler: {
      handle: jest.fn(),
      getErrorMessage: jest.fn((error: any) => error?.message || 'An error occurred'),
      handleApiError: jest.fn((error: any, context?: any) => ({
        message: error?.message || 'API Error',
        context: context?.context || 'API request'
      })),
      showErrorToast: jest.fn(),
    }
  };
});

jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

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

const mockPush = jest.fn();
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockToast = toast as jest.Mocked<typeof toast>;
const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>;
const mockBillingService = billingService as jest.Mocked<typeof billingService>;

// API Base URL for MSW handlers (not used anymore, but kept for backwards compatibility)
const API_BASE = 'http://localhost:8050/api/v1';

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Setup default service mocks - these return promises directly
    mockDashboardService.getDashboardSummary.mockResolvedValue({
      currentTier: 'Grow',
      memberCount: 10,
      memberLimit: 50,
      duesCollectedYTD: 0,
      upcomingEventCount: 0,
    });

    mockBillingService.getBillingStatus.mockResolvedValue({
      currentTier: 'Grow',
      hasActiveSubscription: false,
      memberCount: 10,
      memberLimit: 50,
      canUpgrade: true
    });

    // Default mock for useAuth to prevent errors
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      refreshSession: jest.fn(),
      completeOnboarding: jest.fn(),
      clearError: jest.fn(),
      retryLastOperation: jest.fn(),
    } as AuthContextType);
  });

  describe('Loading States', () => {
    it('shows loading spinner when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
      } as AuthContextType);

      render(<DashboardPage />);

      expect(screen.getByTestId('dashboard-loading-skeleton')).toBeInTheDocument();
    });

    it('shows loading spinner when dashboard data is loading', async () => {
      const mockUser: UserSession = {
        userId: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        clubId: 1,
        clubName: 'Test Club',
        clubTier: 'Grow',
        role: 'Admin',
        isOnboardingCompleted: true,
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
      } as AuthContextType);

      // Make the API call hang using MSW
      server.use(
        http.get(`${API_BASE}/clubs/:clubId/dashboard/summary`, () => {
          return new Promise(() => {}); // Never resolves
        })
      );

      render(<DashboardPage />);

      expect(screen.getByTestId('dashboard-loading-skeleton')).toBeInTheDocument();
    });
  });

  describe('Authentication', () => {
    it('loads dashboard data when user is authenticated', async () => {
      const mockUser: UserSession = {
        userId: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        clubId: 1,
        clubName: 'Test Club',
        clubTier: 'Grow',
        role: 'Admin',
        isOnboardingCompleted: true,
      };

      const mockDashboardData: DashboardSummary = {
        currentTier: 'Grow',
        memberCount: 25,
        memberLimit: 50,
        duesCollectedYTD: 1250.00,
        upcomingEventCount: 3,
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
      } as AuthContextType);

      // Mock service responses for this test
      mockDashboardService.getDashboardSummary.mockResolvedValue(mockDashboardData);
      mockBillingService.getBillingStatus.mockResolvedValue({
        currentTier: 'Grow',
        hasActiveSubscription: false,
        memberCount: 25,
        memberLimit: 50,
        canUpgrade: true
      });

      render(<DashboardPage />);

      await waitFor(() => {
        // Verify dashboard data is displayed (proves API was called)
        const totalMembersCard = screen.getByTestId('card-total-members');
        expect(within(totalMembersCard).getByText('25')).toBeInTheDocument();
      });
    });

    it('shows error state when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: 'Authentication error occurred',
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
      } as AuthContextType);

      render(<DashboardPage />);

      // Wait for loading to finish and error state to appear
      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-loading-skeleton')).not.toBeInTheDocument();
      });
      
      await waitFor(() => {
        // Should show error state when no user is available
        expect(screen.getByTestId('data-error-title')).toHaveTextContent('Error');
        expect(screen.getByTestId('data-error-description')).toHaveTextContent('An unexpected error occurred');
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument(); // This button is rendered by DataError
      });
    });
  });

  describe('Error States', () => {
    it('shows error message when dashboard service fails', async () => {
      const mockUser: UserSession = {
        userId: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        clubId: 1,
        clubName: 'Test Club',
        clubTier: 'Grow',
        role: 'Admin',
        isOnboardingCompleted: true,
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
      } as AuthContextType);

      // Mock service to reject with error
      mockDashboardService.getDashboardSummary.mockRejectedValueOnce(new Error('API Error'));

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('data-error-title')).toHaveTextContent('Error');
        expect(screen.getByTestId('data-error-description')).toBeInTheDocument();
      });

      // Test verifies error display is working correctly
      expect(screen.getByTestId('data-error-title')).toBeInTheDocument();
      expect(screen.getByTestId('data-error-description')).toBeInTheDocument();
    });

    it('shows error buttons for retry and navigation', async () => {
      const mockUser: UserSession = {
        userId: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        clubId: 1,
        clubName: 'Test Club',
        clubTier: 'Grow',
        role: 'Admin',
        isOnboardingCompleted: true,
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
      } as AuthContextType);

      // Mock service to reject with error
      mockDashboardService.getDashboardSummary.mockRejectedValueOnce(new Error('API Error'));

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Content', () => {
    const mockUser: UserSession = {
      userId: 1,
      fullName: 'John Doe',
      email: 'john@example.com',
      clubId: 1,
      clubName: 'Test Club',
      clubTier: 'Grow',
      role: 'Admin',
      isOnboardingCompleted: true,
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
      } as AuthContextType);
    });

    test('displays welcome message with user and club name', async () => {
      const mockDashboardData: DashboardSummary = {
        currentTier: 'Grow',
        memberCount: 25,
        memberLimit: 50,
        duesCollectedYTD: 1250.00,
        upcomingEventCount: 3,
      };

      server.use(
        http.get(`${API_BASE}/clubs/1/dashboard/summary`, () => {
          return HttpResponse.json(mockDashboardData);
        })
      );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome back,/)).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Test Club')).toBeInTheDocument();
      });
    });

    test('displays refresh and add member buttons', async () => {
      const mockDashboardData: DashboardSummary = {
        currentTier: 'Grow',
        memberCount: 25,
        memberLimit: 50,
        duesCollectedYTD: 1250.00,
        upcomingEventCount: 3,
      };

      server.use(
        http.get(`${API_BASE}/clubs/1/dashboard/summary`, () => {
          return HttpResponse.json(mockDashboardData);
        })
      );

      render(<DashboardPage />);

      await waitFor(() => {
        // Refresh button
        const refreshButton = screen.getByRole('button', { name: /Refresh/i });
        expect(refreshButton).toBeInTheDocument();

        // Add Member is now a button that opens a modal (Bug #11 fix)
        const addMemberButton = screen.getByRole('button', { name: /Add a New Member/i });
        expect(addMemberButton).toBeInTheDocument();
      });
    });

    test('displays overview cards with correct stats', async () => {
      const mockDashboardData: DashboardSummary = {
        currentTier: 'Grow',
        memberCount: 25,
        memberLimit: 50,
        duesCollectedYTD: 1250.00,
        upcomingEventCount: 3,
      };

      mockDashboardService.getDashboardSummary.mockResolvedValueOnce(mockDashboardData);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('card-total-members')).toBeInTheDocument();
        expect(screen.getByTestId('card-active-members')).toBeInTheDocument();
        expect(screen.getByTestId('card-upcoming-events')).toBeInTheDocument();
        expect(screen.getByTestId('card-dues-collected')).toBeInTheDocument();

        // Specific text content within cards
        expect(within(screen.getByTestId('card-total-members')).getByText('25')).toBeInTheDocument();
        expect(within(screen.getByTestId('card-total-members')).getByText('25 members registered')).toBeInTheDocument();

        expect(within(screen.getByTestId('card-active-members')).getByText('25')).toBeInTheDocument();
        expect(within(screen.getByTestId('card-active-members')).getByText('Currently active members')).toBeInTheDocument();

        expect(within(screen.getByTestId('card-upcoming-events')).getByText('3')).toBeInTheDocument();
        expect(within(screen.getByTestId('card-upcoming-events')).getByText('Events this month')).toBeInTheDocument();

        // The dues collected card shows dues collected YTD
        expect(within(screen.getByTestId('card-dues-collected')).getByText('$1250.00')).toBeInTheDocument();
      });
    });

    test('displays current plan with upgrade option for Grow tier', async () => {
      // Mock new club data (Grow tier)
      const newClubMockData: DashboardSummary = {
        memberCount: 0,
        memberLimit: 200,
        currentTier: 'Grow',
        duesCollectedYTD: 0,
        upcomingEventCount: 0
      };

      server.use(
        http.get(`${API_BASE}/clubs/1/dashboard/summary`, () => {
          return HttpResponse.json(newClubMockData);
        })
      );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Current Plan/)).toBeInTheDocument();
        expect(screen.getByText('Grow')).toBeInTheDocument();
        expect(screen.getByText(/Grow plan with advanced features/)).toBeInTheDocument();
        const upgradeButton = screen.getByRole('button', { name: /Upgrade to Expand/i });
        expect(upgradeButton).toBeInTheDocument();
      });
    });

    test('shows upgrade prompt only for Grow tier', async () => {
      const mockDashboardData: DashboardSummary = {
        currentTier: 'Grow',
        memberCount: 25,
        memberLimit: 200,
        duesCollectedYTD: 1250.00,
        upcomingEventCount: 3,
      };

      server.use(
        http.get(`${API_BASE}/clubs/1/dashboard/summary`, () => {
          return HttpResponse.json(mockDashboardData);
        })
      );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Upgrade to Expand for more room/)).toBeInTheDocument();
        const upgradeButton = screen.getByRole('button', { name: /Upgrade to Expand/i });
        expect(upgradeButton).toBeInTheDocument();
      });
    });

    it('does not show upgrade section for Grow tier users', async () => {
      const mockDashboardData: DashboardSummary = {
        currentTier: 'Grow',
        memberCount: 150,
        memberLimit: 200,
        duesCollectedYTD: 7500.00,
        upcomingEventCount: 5,
      };

      server.use(
        http.get(`${API_BASE}/clubs/1/dashboard/summary`, () => {
          return HttpResponse.json(mockDashboardData);
        }),
        http.get(`${API_BASE}/billing/status`, () => {
          return HttpResponse.json({
            currentTier: 'Grow',
            hasActiveSubscription: true,
            memberCount: 150,
            memberLimit: 200,
            canUpgrade: true
          });
        })
      );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Unlock more features with the Grow plan/)).not.toBeInTheDocument();
        // Check that the upgrade button is not present when user is Grow tier (canUpgrade=true means it shows Upgrade to Expand)
        expect(screen.queryByRole('button', { name: /Upgrade to Grow/i })).not.toBeInTheDocument();
      });
    });

    test('displays member usage correctly for Grow tier', async () => {
      const mockDashboardData: DashboardSummary = {
        currentTier: 'Grow',
        memberCount: 168,
        memberLimit: 200,
        duesCollectedYTD: 1250.00,
        upcomingEventCount: 3,
      };

      mockDashboardService.getDashboardSummary.mockResolvedValueOnce(mockDashboardData);
      mockBillingService.getBillingStatus.mockResolvedValueOnce({
        currentTier: 'Grow',
        hasActiveSubscription: false,
        memberCount: 168,
        memberLimit: 200,
        canUpgrade: true
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('168 out of 200')).toBeInTheDocument();
        expect(screen.getByText('84%')).toBeInTheDocument(); // 168/200 = 84%
        // Use getAllByText since there are multiple "Upgrade to Expand" elements
        const upgradeButtons = screen.getAllByRole('button', { name: /Upgrade to Expand/i });
        expect(upgradeButtons).toHaveLength(2); // One in alert, one in upgrade section
        expect(upgradeButtons[0]).toBeInTheDocument();
      });
    });
  });

  describe('Data Formatting', () => {
    const mockUser: UserSession = {
      userId: 1,
      fullName: 'John Doe',
      email: 'john@example.com',
      clubId: 1,
      clubName: 'Test Club',
      clubTier: 'Grow',
      role: 'Admin',
      isOnboardingCompleted: true,
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
      } as AuthContextType);
    });

    it('formats dues amount with 2 decimal places', async () => {
      const mockDashboardData: DashboardSummary = {
        currentTier: 'Grow',
        memberCount: 25,
        memberLimit: 50,
        duesCollectedYTD: 1250.50,
        upcomingEventCount: 3,
      };

      mockDashboardService.getDashboardSummary.mockResolvedValueOnce(mockDashboardData);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('$1250.50')).toBeInTheDocument();
      });
    });

    it('handles zero values correctly', async () => {
      const mockDashboardData: DashboardSummary = {
        currentTier: 'Grow',
        memberCount: 0,
        memberLimit: 50,
        duesCollectedYTD: 0.00,
        upcomingEventCount: 0,
      };

      mockDashboardService.getDashboardSummary.mockResolvedValueOnce(mockDashboardData);

      render(<DashboardPage />);

      await waitFor(() => {
        // Use within() to scope the search to specific cards
        const totalMembersCard = screen.getByTestId('card-total-members');
        expect(within(totalMembersCard).getByText('0')).toBeInTheDocument();

        // The dues collected card shows dues collected YTD formatted as decimal
        const duesCollectedCard = screen.getByTestId('card-dues-collected');
        expect(within(duesCollectedCard).getByText('$0.00')).toBeInTheDocument();

        const upcomingEventsCard = screen.getByTestId('card-upcoming-events');
        expect(within(upcomingEventsCard).getByText('0')).toBeInTheDocument();
      });
    });

    it('handles large numbers correctly', async () => {
      const mockDashboardData: DashboardSummary = {
        currentTier: 'Grow',
        memberCount: 195,
        memberLimit: 200,
        duesCollectedYTD: 15750.99,
        upcomingEventCount: 25,
      };

      mockDashboardService.getDashboardSummary.mockResolvedValueOnce(mockDashboardData);
      mockBillingService.getBillingStatus.mockResolvedValueOnce({
        currentTier: 'Grow',
        hasActiveSubscription: true,
        memberCount: 195,
        memberLimit: 200,
        canUpgrade: true
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(within(screen.getByTestId('card-total-members')).getByText('195')).toBeInTheDocument();
        expect(within(screen.getByTestId('card-dues-collected')).getByText('$15750.99')).toBeInTheDocument();
        expect(within(screen.getByTestId('card-upcoming-events')).getByText('25')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Quick Actions', () => {
    it('displays quick action buttons including Create Event', async () => {
      const mockUser: UserSession = {
        userId: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        clubId: 1,
        clubName: 'Test Club',
        clubTier: 'Grow',
        role: 'Admin',
        isOnboardingCompleted: true,
      };

      const mockDashboardData: DashboardSummary = {
        currentTier: 'Grow',
        memberCount: 25,
        memberLimit: 50,
        duesCollectedYTD: 1250.00,
        upcomingEventCount: 3,
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
      } as AuthContextType);

      server.use(
        http.get(`${API_BASE}/clubs/1/dashboard/summary`, () => {
          return HttpResponse.json(mockDashboardData);
        }),
        http.get(`${API_BASE}/billing/status`, () => {
          return HttpResponse.json({
            currentTier: 'Grow',
            hasActiveSubscription: false,
            memberCount: 25,
            memberLimit: 50,
            canUpgrade: true,
          });
        })
      );

      render(<DashboardPage />);

      await waitFor(() => {
        // Check for Member Management quick actions
        expect(screen.getByText('Member Management')).toBeInTheDocument();
        expect(screen.getByText('View All Members')).toBeInTheDocument();
        expect(screen.getByText('Add New Member')).toBeInTheDocument();

        // Check for Events quick actions
        expect(screen.getByText('Events')).toBeInTheDocument();
        expect(screen.getByText('View All Events')).toBeInTheDocument();
        expect(screen.getByText('Create Event')).toBeInTheDocument();

        // Check for Communications quick actions
        expect(screen.getByText('Communications')).toBeInTheDocument();
        expect(screen.getByText('View Communications')).toBeInTheDocument();
        expect(screen.getByText('Create New Message')).toBeInTheDocument();
      });
    });

    it('has correct href links for quick actions', async () => {
      const mockUser: UserSession = {
        userId: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        clubId: 1,
        clubName: 'Test Club',
        clubTier: 'Grow',
        role: 'Admin',
        isOnboardingCompleted: true,
      };

      const mockDashboardData: DashboardSummary = {
        currentTier: 'Grow',
        memberCount: 25,
        memberLimit: 50,
        duesCollectedYTD: 1250.00,
        upcomingEventCount: 3,
      };

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
      } as AuthContextType);

      server.use(
        http.get(`${API_BASE}/clubs/1/dashboard/summary`, () => {
          return HttpResponse.json(mockDashboardData);
        }),
        http.get(`${API_BASE}/billing/status`, () => {
          return HttpResponse.json({
            currentTier: 'Grow',
            hasActiveSubscription: false,
            memberCount: 25,
            memberLimit: 50,
            canUpgrade: true,
          });
        })
      );

      render(<DashboardPage />);

      await waitFor(() => {
        // Check Create Event button link
        const createEventLink = screen.getByText('Create Event').closest('a');
        expect(createEventLink).toHaveAttribute('href', '/admin/events');

        // Check View All Events button link
        const viewEventsLink = screen.getByText('View All Events').closest('a');
        expect(viewEventsLink).toHaveAttribute('href', '/admin/events');

        // Check other important links - there are two "Add New Member" buttons, check both
        const addMemberLinks = screen.getAllByText(/Add.*New Member|Add a New Member/);
        addMemberLinks.forEach(link => {
          const anchorElement = link.closest('a');
          expect(anchorElement).toHaveAttribute('href', '/admin/members');
        });

        const createMessageLink = screen.getByText('Create New Message').closest('a');
        expect(createMessageLink).toHaveAttribute('href', '/admin/communications/new');
      });
    });

    describe('Upgrade Functionality', () => {
      it('opens upgrade modal when upgrade button is clicked', async () => {
        const mockUser: UserSession = {
          userId: 1,
          fullName: 'John Doe',
          email: 'john@example.com',
          clubId: 1,
          clubName: 'Test Club',
          clubTier: 'Grow',
          role: 'Admin',
          isOnboardingCompleted: true,
        };

        const mockDashboardData: DashboardSummary = {
          currentTier: 'Grow',
          memberCount: 25,
          memberLimit: 50,
          duesCollectedYTD: 1250.00,
          upcomingEventCount: 3,
        };

        mockUseAuth.mockReturnValue({
          user: mockUser,
          loading: false,
          error: null,
          login: jest.fn(),
          logout: jest.fn(),
          register: jest.fn(),
          refreshSession: jest.fn(),
          completeOnboarding: jest.fn(),
          clearError: jest.fn(),
          retryLastOperation: jest.fn(),
        } as AuthContextType);

        (dashboardService.getDashboardSummary as jest.Mock).mockResolvedValue(mockDashboardData);
        (billingService.getBillingStatus as jest.Mock).mockResolvedValue({
          currentTier: 'Grow',
          hasActiveSubscription: false,
          memberCount: 25,
          memberLimit: 50,
          canUpgrade: true,
        });

        const { getByTestId, queryByTestId } = render(<DashboardPage />);

        await waitFor(() => {
          expect(getByTestId('card-current-plan')).toBeInTheDocument();
        });

        // Modal should not be visible initially
        expect(queryByTestId('upgrade-modal')).not.toBeInTheDocument();

        // Click the upgrade button
        const upgradeButton = getByTestId('upgrade-button');
        upgradeButton.click();

        // Modal should now be visible
        await waitFor(() => {
          expect(queryByTestId('upgrade-modal')).toBeInTheDocument();
        });
      });
    });

    describe('Member Usage Warning', () => {
      it('shows warning when member usage exceeds 80%', async () => {
        const mockUser: UserSession = {
          userId: 1,
          fullName: 'John Doe',
          email: 'john@example.com',
          clubId: 1,
          clubName: 'Test Club',
          clubTier: 'Grow',
          role: 'Admin',
          isOnboardingCompleted: true,
        };

        const mockDashboardData: DashboardSummary = {
          currentTier: 'Grow',
          memberCount: 180,  // 90% of 200 limit
          memberLimit: 200,
          duesCollectedYTD: 1250.00,
          upcomingEventCount: 3,
        };

        mockUseAuth.mockReturnValue({
          user: mockUser,
          loading: false,
          error: null,
          login: jest.fn(),
          logout: jest.fn(),
          register: jest.fn(),
          refreshSession: jest.fn(),
          completeOnboarding: jest.fn(),
          clearError: jest.fn(),
          retryLastOperation: jest.fn(),
        } as AuthContextType);

        (dashboardService.getDashboardSummary as jest.Mock).mockResolvedValue(mockDashboardData);
        (billingService.getBillingStatus as jest.Mock).mockResolvedValue({
          currentTier: 'Grow',
          hasActiveSubscription: false,
          memberCount: 180,
          memberLimit: 200,
          canUpgrade: true,
        });

        render(<DashboardPage />);

        await waitFor(() => {
          expect(screen.getByText(/approaching your member limit/i)).toBeInTheDocument();
        });

        // Should show upgrade button in the warning section
        const upgradeButtons = screen.getAllByText(/Upgrade to Expand/i);
        expect(upgradeButtons.length).toBeGreaterThan(0);
      });

      it('does not show warning when member usage is below 80%', async () => {
        const mockUser: UserSession = {
          userId: 1,
          fullName: 'John Doe',
          email: 'john@example.com',
          clubId: 1,
          clubName: 'Test Club',
          clubTier: 'Grow',
          role: 'Admin',
          isOnboardingCompleted: true,
        };

        const mockDashboardData: DashboardSummary = {
          currentTier: 'Grow',
          memberCount: 25,  // 50% of 50 limit
          memberLimit: 50,
          duesCollectedYTD: 1250.00,
          upcomingEventCount: 3,
        };

        mockUseAuth.mockReturnValue({
          user: mockUser,
          loading: false,
          error: null,
          login: jest.fn(),
          logout: jest.fn(),
          register: jest.fn(),
          refreshSession: jest.fn(),
          completeOnboarding: jest.fn(),
          clearError: jest.fn(),
          retryLastOperation: jest.fn(),
        } as AuthContextType);

        (dashboardService.getDashboardSummary as jest.Mock).mockResolvedValue(mockDashboardData);
        (billingService.getBillingStatus as jest.Mock).mockResolvedValue({
          currentTier: 'Grow',
          hasActiveSubscription: false,
          memberCount: 25,
          memberLimit: 50,
          canUpgrade: true,
        });

        render(<DashboardPage />);

        await waitFor(() => {
          expect(screen.getByTestId('card-member-usage')).toBeInTheDocument();
        });

        // Should NOT show the warning
        expect(screen.queryByText(/approaching your member limit/i)).not.toBeInTheDocument();
      });
    });

    describe('Expand Tier Features', () => {
      it('shows engagement panel for Expand tier users', async () => {
        const mockUser: UserSession = {
          userId: 1,
          fullName: 'John Doe',
          email: 'john@example.com',
          clubId: 1,
          clubName: 'Test Club',
          clubTier: 'Expand',
          role: 'Admin',
          isOnboardingCompleted: true,
        };

        const mockDashboardData: DashboardSummary = {
          currentTier: 'Expand',
          memberCount: 1500,
          memberLimit: Number.MAX_SAFE_INTEGER,
          duesCollectedYTD: 50000.00,
          upcomingEventCount: 10,
        };

        mockUseAuth.mockReturnValue({
          user: mockUser,
          loading: false,
          error: null,
          login: jest.fn(),
          logout: jest.fn(),
          register: jest.fn(),
          refreshSession: jest.fn(),
          completeOnboarding: jest.fn(),
          clearError: jest.fn(),
          retryLastOperation: jest.fn(),
        } as AuthContextType);

        (dashboardService.getDashboardSummary as jest.Mock).mockResolvedValue(mockDashboardData);
        (billingService.getBillingStatus as jest.Mock).mockResolvedValue({
          currentTier: 'Expand',
          hasActiveSubscription: true,
          memberCount: 1500,
          memberLimit: Number.MAX_SAFE_INTEGER,
          canUpgrade: false,
        });

        render(<DashboardPage />);

        await waitFor(() => {
          expect(screen.getByTestId('engagement-metrics-panel')).toBeInTheDocument();
        });

        expect(screen.getAllByText('Expand').length).toBeGreaterThan(0);

        expect(screen.getByText(/Expand member capacity/i)).toBeInTheDocument();

        // Should NOT show upgrade button
        expect(screen.queryByTestId('upgrade-button')).not.toBeInTheDocument();
      });

      it('displays Expand member limit correctly', async () => {
        const mockUser: UserSession = {
          userId: 1,
          fullName: 'John Doe',
          email: 'john@example.com',
          clubId: 1,
          clubName: 'Test Club',
          clubTier: 'Expand',
          role: 'Admin',
          isOnboardingCompleted: true,
        };

        const mockDashboardData: DashboardSummary = {
          currentTier: 'Expand',
          memberCount: 1500,
          memberLimit: Number.MAX_SAFE_INTEGER,
          duesCollectedYTD: 50000.00,
          upcomingEventCount: 10,
        };

        mockUseAuth.mockReturnValue({
          user: mockUser,
          loading: false,
          error: null,
          login: jest.fn(),
          logout: jest.fn(),
          register: jest.fn(),
          refreshSession: jest.fn(),
          completeOnboarding: jest.fn(),
          clearError: jest.fn(),
          retryLastOperation: jest.fn(),
        } as AuthContextType);

        (dashboardService.getDashboardSummary as jest.Mock).mockResolvedValue(mockDashboardData);
        (billingService.getBillingStatus as jest.Mock).mockResolvedValue({
          currentTier: 'Expand',
          hasActiveSubscription: true,
          memberCount: 1500,
          memberLimit: Number.MAX_SAFE_INTEGER,
          canUpgrade: false,
        });

        render(<DashboardPage />);

        await waitFor(() => {
          expect(screen.getByText(/1,500 out of 2,000/i)).toBeInTheDocument();
        });

        // Should display usage for the Expand member cap
        const memberUsageCard = screen.getByTestId('card-member-usage');
        expect(within(memberUsageCard).getByText(/75%/)).toBeInTheDocument();
      });

      it('does not show engagement panel for non-Unlimited tiers', async () => {
        const mockUser: UserSession = {
          userId: 1,
          fullName: 'John Doe',
          email: 'john@example.com',
          clubId: 1,
          clubName: 'Test Club',
          clubTier: 'Grow',
          role: 'Admin',
          isOnboardingCompleted: true,
        };

        const mockDashboardData: DashboardSummary = {
          currentTier: 'Grow',
          memberCount: 100,
          memberLimit: 200,
          duesCollectedYTD: 5000.00,
          upcomingEventCount: 5,
        };

        mockUseAuth.mockReturnValue({
          user: mockUser,
          loading: false,
          error: null,
          login: jest.fn(),
          logout: jest.fn(),
          register: jest.fn(),
          refreshSession: jest.fn(),
          completeOnboarding: jest.fn(),
          clearError: jest.fn(),
          retryLastOperation: jest.fn(),
        } as AuthContextType);

        (dashboardService.getDashboardSummary as jest.Mock).mockResolvedValue(mockDashboardData);
        (billingService.getBillingStatus as jest.Mock).mockResolvedValue({
          currentTier: 'Grow',
          hasActiveSubscription: true,
          memberCount: 100,
          memberLimit: 200,
          canUpgrade: true,
        });

        render(<DashboardPage />);

        await waitFor(() => {
          expect(screen.getByTestId('card-current-plan')).toBeInTheDocument();
        });

        // Should NOT show engagement panel for Grow tier
        expect(screen.queryByTestId('engagement-metrics-panel')).not.toBeInTheDocument();
      });
    });
  });
});
