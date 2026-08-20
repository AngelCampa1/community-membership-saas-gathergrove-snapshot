import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EngagementPage from '../page';

// Mock the components
jest.mock('@/components/engagement', () => ({
  EngagementDashboard: ({ clubId }: { clubId: string }) => (
    <div data-testid="engagement-dashboard">
      <div>Club ID: {clubId}</div>
      <div>Engagement metrics displayed here</div>
    </div>
  ),
  AtRiskMembersAlert: ({ clubId }: { clubId: string }) => (
    <div data-testid="at-risk-members-alert">
      <div>Club ID: {clubId}</div>
      <div>At-risk members: 3</div>
    </div>
  ),
}));

jest.mock('@/components/analytics/FeatureUsageAnalytics', () => ({
  FeatureUsageAnalytics: ({ clubId }: { clubId: number }) => (
    <div data-testid="feature-usage-analytics">
      <div>Club ID: {clubId}</div>
      <div>Feature usage data displayed here</div>
    </div>
  ),
}));

jest.mock('@/components/tier/TierGate', () => ({
  TierGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/ui/data-error', () => ({
  DataError: ({ onRetry, error }: { onRetry: () => void; error: Error }) => (
    <div data-testid="data-error">
      <div>Error: {error.message}</div>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
}));

// Mock the auth hook
const mockUseAuth = jest.fn();
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('EngagementPage', () => {
  let queryClient: QueryClient;

  const renderWithQueryClient = (component: React.ReactElement) => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders loading skeleton when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        error: null,
        retryLastOperation: jest.fn(),
      });

      renderWithQueryClient(<EngagementPage />);

      // Check for loading skeleton elements
      const skeletonElements = screen.getAllByRole('generic').filter(
        el => el.className.includes('animate-pulse')
      );
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error States', () => {
    it('renders error message when auth fails', async () => {
      const mockRetry = jest.fn();
      const mockError = new Error('Authentication failed');

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: mockError,
        retryLastOperation: mockRetry,
      });

      renderWithQueryClient(<EngagementPage />);

      await waitFor(() => {
        expect(screen.getByTestId('data-error')).toBeInTheDocument();
      });

      expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await userEvent.click(retryButton);

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('shows club not found message when user has no clubId', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'test@example.com', clubId: null },
        loading: false,
        error: null,
        retryLastOperation: jest.fn(),
      });

      renderWithQueryClient(<EngagementPage />);

      expect(screen.getByText(/Club Not Found/i)).toBeInTheDocument();
      expect(screen.getByText(/Unable to access engagement data without club information/i)).toBeInTheDocument();
    });
  });

  describe('Successful Render', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          email: 'admin@example.com',
          clubId: 123,
          role: 'Admin',
        },
        loading: false,
        error: null,
        retryLastOperation: jest.fn(),
      });
    });

    it('renders page header with title and description', () => {
      renderWithQueryClient(<EngagementPage />);

      expect(screen.getByText('Member Engagement')).toBeInTheDocument();
      expect(screen.getByText(/Monitor member activity and engagement across your club/i)).toBeInTheDocument();
    });

    it('renders AtRiskMembersAlert with correct clubId', async () => {
      renderWithQueryClient(<EngagementPage />);

      await waitFor(() => {
        expect(screen.getByTestId('at-risk-members-alert')).toBeInTheDocument();
      });

      const alert = screen.getByTestId('at-risk-members-alert');
      expect(within(alert).getByText('Club ID: 123')).toBeInTheDocument();
    });

    it('renders tabs with overview and features options', () => {
      renderWithQueryClient(<EngagementPage />);

      expect(screen.getByRole('tab', { name: /Member Overview/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Feature Analytics/i })).toBeInTheDocument();
    });

    it('renders EngagementDashboard in overview tab by default', async () => {
      renderWithQueryClient(<EngagementPage />);

      await waitFor(() => {
        expect(screen.getByTestId('engagement-dashboard')).toBeInTheDocument();
      });

      const dashboard = screen.getByTestId('engagement-dashboard');
      expect(within(dashboard).getByText('Club ID: 123')).toBeInTheDocument();
    });

    it('switches to feature analytics tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<EngagementPage />);

      // Initially should show EngagementDashboard
      await waitFor(() => {
        expect(screen.getByTestId('engagement-dashboard')).toBeInTheDocument();
      });

      // Click on Feature Analytics tab
      const featuresTab = screen.getByRole('tab', { name: /Feature Analytics/i });
      await user.click(featuresTab);

      // Should now show FeatureUsageAnalytics
      await waitFor(() => {
        expect(screen.getByTestId('feature-usage-analytics')).toBeInTheDocument();
      });

      const analytics = screen.getByTestId('feature-usage-analytics');
      expect(within(analytics).getByText('Club ID: 123')).toBeInTheDocument();
    });

    it('switches back to overview tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<EngagementPage />);

      // Click on Feature Analytics tab
      const featuresTab = screen.getByRole('tab', { name: /Feature Analytics/i });
      await user.click(featuresTab);

      await waitFor(() => {
        expect(screen.getByTestId('feature-usage-analytics')).toBeInTheDocument();
      });

      // Click back to Member Overview tab
      const overviewTab = screen.getByRole('tab', { name: /Member Overview/i });
      await user.click(overviewTab);

      // Should show EngagementDashboard again
      await waitFor(() => {
        expect(screen.getByTestId('engagement-dashboard')).toBeInTheDocument();
      });
    });

    it('renders all components with correct props when user is authenticated', async () => {
      renderWithQueryClient(<EngagementPage />);

      // Wait for all components to be rendered
      await waitFor(() => {
        expect(screen.getByTestId('at-risk-members-alert')).toBeInTheDocument();
        expect(screen.getByTestId('engagement-dashboard')).toBeInTheDocument();
      });

      // Verify AtRiskMembersAlert receives clubId as string
      const alert = screen.getByTestId('at-risk-members-alert');
      expect(within(alert).getByText('Club ID: 123')).toBeInTheDocument();

      // Verify EngagementDashboard receives clubId as string
      const dashboard = screen.getByTestId('engagement-dashboard');
      expect(within(dashboard).getByText('Club ID: 123')).toBeInTheDocument();
    });
  });

  describe('Tab Content Visibility', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          email: 'admin@example.com',
          clubId: 456,
          role: 'Admin',
        },
        loading: false,
        error: null,
        retryLastOperation: jest.fn(),
      });
    });

    it('shows only overview content when overview tab is active', async () => {
      renderWithQueryClient(<EngagementPage />);

      await waitFor(() => {
        expect(screen.getByTestId('engagement-dashboard')).toBeInTheDocument();
      });

      // Feature analytics should not be visible
      expect(screen.queryByTestId('feature-usage-analytics')).not.toBeInTheDocument();
    });

    it('shows only features content when features tab is active', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<EngagementPage />);

      const featuresTab = screen.getByRole('tab', { name: /Feature Analytics/i });
      await user.click(featuresTab);

      await waitFor(() => {
        expect(screen.getByTestId('feature-usage-analytics')).toBeInTheDocument();
      });

      // Engagement dashboard should not be visible (Radix Tabs hides inactive content)
      expect(screen.queryByTestId('engagement-dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          email: 'admin@example.com',
          clubId: 789,
          role: 'Admin',
        },
        loading: false,
        error: null,
        retryLastOperation: jest.fn(),
      });
    });

    it('has proper heading structure', () => {
      renderWithQueryClient(<EngagementPage />);

      const heading = screen.getByText('Member Engagement');
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });

    it('has accessible tab controls', async () => {
      renderWithQueryClient(<EngagementPage />);

      const overviewTab = screen.getByRole('tab', { name: /Member Overview/i });
      const featuresTab = screen.getByRole('tab', { name: /Feature Analytics/i });

      expect(overviewTab).toHaveAttribute('aria-selected', 'true');
      expect(featuresTab).toHaveAttribute('aria-selected', 'false');

      const user = userEvent.setup();
      await user.click(featuresTab);

      await waitFor(() => {
        expect(featuresTab).toHaveAttribute('aria-selected', 'true');
        expect(overviewTab).toHaveAttribute('aria-selected', 'false');
      });
    });
  });
});
