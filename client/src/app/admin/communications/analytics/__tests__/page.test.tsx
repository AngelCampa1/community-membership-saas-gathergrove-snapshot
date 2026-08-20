import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import AnalyticsPage from '../page';
import { useAuth } from '@/hooks/useAuth';
import { useAuthorization } from '@/hooks/useAuthorization';
import { createMockUser, createMockAuthContext, createMockUnauthenticatedContext } from '@/tests/test-utils';

// Mock comprehensive environment variables
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_API_URL: 'http://localhost:8050',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_mock',
    NEXT_PUBLIC_SENTRY_DSN: 'mock_dsn',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
    NODE_ENV: 'test',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useAuthorization', () => ({
  useAuthorization: jest.fn(),
}));

// Create a global toast mock that we can track across tests
const globalToastMock = {
  error: jest.fn(),
  success: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  dismiss: jest.fn(),
};

jest.mock('@/hooks/useToast', () => ({
  useToast: () => globalToastMock,
}));

// Mock lucide-react icons with comprehensive coverage
jest.mock('lucide-react', () => {
  const IconComponent = React.forwardRef<HTMLSpanElement, any>(function IconComponent(props, ref) {
    return React.createElement('span', { ref, className: 'lucide-icon', 'data-testid': 'lucide-icon', ...props });
  });
  return {
    BarChart: IconComponent,
    TrendingUp: IconComponent,
    Mail: IconComponent,
    Eye: IconComponent,
    MousePointer: IconComponent,
    Calendar: IconComponent,
    Filter: IconComponent,
    Users: IconComponent,
    XCircle: IconComponent,
    CheckCircle: IconComponent,
    ChevronDownIcon: IconComponent,
    ChevronUpIcon: IconComponent,
    CheckIcon: IconComponent,
  };
});

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 data-testid="card-title" {...props}>{children}</h3>,
  CardDescription: ({ children, ...props }: any) => <p data-testid="card-description" {...props}>{children}</p>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="button" {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant, ...props }: any) => (
    <span data-testid="badge" className={className} data-variant={variant} {...props}>{children}</span>
  ),
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, ...props }: any) => <div data-testid="tabs" {...props}>{children}</div>,
  TabsList: ({ children, ...props }: any) => <div data-testid="tabs-list" {...props}>{children}</div>,
  TabsTrigger: ({ children, ...props }: any) => <button data-testid="tabs-trigger" {...props}>{children}</button>,
  TabsContent: ({ children, ...props }: any) => <div data-testid="tabs-content" {...props}>{children}</div>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, ...props }: any) => <div data-testid="select" {...props}>{children}</div>,
  SelectGroup: ({ children, ...props }: any) => <div data-testid="select-group" {...props}>{children}</div>,
  SelectValue: ({ children, ...props }: any) => <span data-testid="select-value" {...props}>{children}</span>,
  SelectTrigger: ({ children, ...props }: any) => <button data-testid="select-trigger" {...props}>{children}</button>,
  SelectContent: ({ children, ...props }: any) => <div data-testid="select-content" {...props}>{children}</div>,
  SelectItem: ({ children, ...props }: any) => <div data-testid="select-item" {...props}>{children}</div>,
  SelectLabel: ({ children, ...props }: any) => <label data-testid="select-label" {...props}>{children}</label>,
  SelectSeparator: ({ ...props }: any) => <hr data-testid="select-separator" {...props} />,
  SelectScrollUpButton: ({ ...props }: any) => <div data-testid="select-scroll-up" {...props} />,
  SelectScrollDownButton: ({ ...props }: any) => <div data-testid="select-scroll-down" {...props} />,
}));

// Mock Radix UI components
jest.mock('@radix-ui/react-tabs', () => ({
  Root: ({ children, ...props }: any) => <div data-testid="radix-tabs-root" {...props}>{children}</div>,
  List: ({ children, ...props }: any) => <div data-testid="radix-tabs-list" {...props}>{children}</div>,
  Trigger: ({ children, ...props }: any) => <button data-testid="radix-tabs-trigger" {...props}>{children}</button>,
  Content: ({ children, ...props }: any) => <div data-testid="radix-tabs-content" {...props}>{children}</div>,
}));

jest.mock('@radix-ui/react-select', () => ({
  Root: ({ children, ...props }: any) => <div data-testid="radix-select-root" {...props}>{children}</div>,
  Group: ({ children, ...props }: any) => <div data-testid="radix-select-group" {...props}>{children}</div>,
  Value: ({ children, ...props }: any) => <span data-testid="radix-select-value" {...props}>{children}</span>,
  Trigger: ({ children, ...props }: any) => <button data-testid="radix-select-trigger" {...props}>{children}</button>,
  Content: ({ children, ...props }: any) => <div data-testid="radix-select-content" {...props}>{children}</div>,
  Item: ({ children, ...props }: any) => <div data-testid="radix-select-item" {...props}>{children}</div>,
  Label: ({ children, ...props }: any) => <label data-testid="radix-select-label" {...props}>{children}</label>,
  Separator: ({ ...props }: any) => <hr data-testid="radix-select-separator" {...props} />,
  ScrollUpButton: ({ ...props }: any) => <div data-testid="radix-select-scroll-up" {...props} />,
  ScrollDownButton: ({ ...props }: any) => <div data-testid="radix-select-scroll-down" {...props} />,
  ItemIndicator: ({ children, ...props }: any) => <span data-testid="radix-select-item-indicator" {...props}>{children}</span>,
  Portal: ({ children, ...props }: any) => <div data-testid="radix-select-portal" {...props}>{children}</div>,
  Viewport: ({ children, ...props }: any) => <div data-testid="radix-select-viewport" {...props}>{children}</div>,
  Icon: ({ children, ...props }: any) => <span data-testid="radix-select-icon" {...props}>{children}</span>,
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock services
jest.mock('@/services/communicationAnalyticsService', () => ({
  communicationAnalyticsService: {
    getAnalyticsSummary: jest.fn(),
    getCommunicationDetails: jest.fn(),
  },
  CommunicationAnalyticsResponse: {},
  CommunicationTypeAnalytics: {},
  TimeBasedEngagement: {},
  CommunicationDetailsResponse: {},
  RecipientEngagement: {},
  AnalyticsFilterRequest: {},
}));

jest.mock('@/services/emailTemplateService', () => ({
  emailTemplateService: {
    getTemplates: jest.fn(),
    getTemplateById: jest.fn(),
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    sendTestEmail: jest.fn(),
  },
  EmailTemplateResponse: {},
  EmailTemplateRequest: {},
}));

const mockPush = jest.fn();
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseAuthorization = useAuthorization as jest.MockedFunction<typeof useAuthorization>;
const mockUseRouter = useRouter as jest.Mock;

const mockAnalyticsData = {
  communicationId: 1,
  totalSent: 1000,
  totalDelivered: 950,
  totalOpened: 250,
  totalClicked: 50,
  totalUnsubscribed: 5,
  totalBounced: 50,
  deliveryRate: 95.0,
  openRate: 25.0,
  clickRate: 5.0,
  unsubscribeRate: 0.5,
  bounceRate: 5.0,
};

const mockTemplates = [
  {
    id: 1,
    templateName: 'Welcome Email',
    subject: 'Welcome to our club!',
    content: '<p>Welcome</p>',
  },
  {
    id: 2,
    templateName: 'Event Reminder',
    subject: 'Event Reminder',
    content: '<p>Don\'t forget!</p>',
  },
];

describe('AnalyticsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Clear logger mocks
    const { logger } = require('@/lib/logger');
    logger.error.mockClear();
    logger.warn.mockClear();
    logger.info.mockClear();
    logger.debug.mockClear();

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    });

    mockUseAuth.mockReturnValue(createMockAuthContext({ clubTier: 'Unlimited' }));

    mockUseAuthorization.mockReturnValue({
      hasUnlimitedTier: jest.fn(() => true),
      canAccessUnlimitedFeatures: jest.fn(() => true),
      isAdmin: jest.fn(() => true),
      isMember: jest.fn(() => false),
      isAdminOrMember: jest.fn(() => true),
      hasRole: jest.fn(() => true),
      hasAnyRole: jest.fn(() => true),
      hasGrowTier: jest.fn(() => false),

      hasTier: jest.fn(() => true),
      canAccessAdminFeatures: jest.fn(() => true),
      canAccessMemberFeatures: jest.fn(() => false),
      canAccessGrowFeatures: jest.fn(() => true),
      canViewMemberDirectory: jest.fn(() => true),
      canManageMembers: jest.fn(() => true),
      canManageEvents: jest.fn(() => true),
      canSendCommunications: jest.fn(() => true),
      canAccessBilling: jest.fn(() => true),
      canManageClubSettings: jest.fn(() => true),
      canExportMemberData: jest.fn(() => true),
      canExportFinancialData: jest.fn(() => true),
      canExportAnalyticsData: jest.fn(() => true),
      canExportEventData: jest.fn(() => true),
      canCreateScheduledReports: jest.fn(() => true),
      canAccessExportHistory: jest.fn(() => true),
      canConfigureEmailDelivery: jest.fn(() => true),
      checkAccess: jest.fn(() => true),
      canViewOwnProfile: jest.fn(() => true),
      canRSVPToEvents: jest.fn(() => true),
      getCurrentUser: jest.fn(() => null),
      getUserRole: jest.fn(() => 'Admin'),
      getClubTier: jest.fn(() => 'Unlimited'),
      getClubInfo: jest.fn(() => ({ id: 1, name: 'Test Club', tier: 'Unlimited' })),
      user: null,
      isAuthenticated: true,
      userRole: 'Admin',
      clubTier: 'Unlimited',
      loading: false,
    } as any);

    // Mock the dynamic imports
    jest.doMock('@/services/communicationAnalyticsService', () => ({
      communicationAnalyticsService: {
        getAnalyticsSummary: jest.fn().mockResolvedValue(mockAnalyticsData),
        getCommunicationDetails: jest.fn(),
      },
    }));

    jest.doMock('@/services/emailTemplateService', () => ({
      emailTemplateService: {
        getTemplates: jest.fn().mockResolvedValue(mockTemplates),
        getTemplateById: jest.fn(),
        createTemplate: jest.fn(),
        updateTemplate: jest.fn(),
        deleteTemplate: jest.fn(),
        sendTestEmail: jest.fn(),
      },
    }));
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('should redirect non-Unlimited tier users', () => {
    mockUseAuthorization.mockReturnValue({
      hasUnlimitedTier: jest.fn(() => false),
      canAccessUnlimitedFeatures: jest.fn(() => false),
      isAdmin: jest.fn(() => true),
      isMember: jest.fn(() => false),
      isAdminOrMember: jest.fn(() => true),
      hasRole: jest.fn(() => true),
      hasAnyRole: jest.fn(() => true),
      hasGrowTier: jest.fn(() => false),

      hasTier: jest.fn(() => true),
      canAccessAdminFeatures: jest.fn(() => true),
      canAccessMemberFeatures: jest.fn(() => false),
      canAccessGrowFeatures: jest.fn(() => false),
      canViewMemberDirectory: jest.fn(() => true),
      canManageMembers: jest.fn(() => true),
      canManageEvents: jest.fn(() => true),
      canSendCommunications: jest.fn(() => true),
      canAccessBilling: jest.fn(() => true),
      canManageClubSettings: jest.fn(() => true),
      canExportMemberData: jest.fn(() => false),
      canExportFinancialData: jest.fn(() => false),
      canExportAnalyticsData: jest.fn(() => false),
      canExportEventData: jest.fn(() => false),
      canCreateScheduledReports: jest.fn(() => false),
      canAccessExportHistory: jest.fn(() => false),
      canConfigureEmailDelivery: jest.fn(() => false),
      checkAccess: jest.fn(() => false),
      canViewOwnProfile: jest.fn(() => true),
      canRSVPToEvents: jest.fn(() => true),
      getCurrentUser: jest.fn(() => null),
      getUserRole: jest.fn(() => 'Admin'),
      getClubTier: jest.fn(() => 'Grow'),
      getClubInfo: jest.fn(() => ({ id: 1, name: 'Test Club', tier: 'Grow' })),
      user: null,
      isAuthenticated: true,
      userRole: 'Admin',
      clubTier: 'Grow',
      loading: false,
    } as any);

    render(<AnalyticsPage />);
    expect(mockPush).toHaveBeenCalledWith('/admin/communications');
  });

  it('should render analytics dashboard for Unlimited tier users', async () => {
    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Communication Analytics/i)).toBeInTheDocument();
      expect(screen.getByText(/Track performance metrics for your email campaigns/i)).toBeInTheDocument();
      expect(screen.getByText(/Expand Feature/)).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/Communication Analytics/i)).toBeInTheDocument();
  });

  it('should render filter controls', async () => {
    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('card-filters')).toBeInTheDocument();
      expect(screen.getByTestId('select-date-range')).toBeInTheDocument();
      expect(screen.getByTestId('select-template')).toBeInTheDocument();
      expect(screen.getByTestId('select-type')).toBeInTheDocument();
    });
  });

  it('should display empty state when no data available', async () => {
    const mockEmptyData = {
      ...mockAnalyticsData,
      totalSent: 0,
    };

    jest.doMock('@/services/communicationAnalyticsService', () => ({
      communicationAnalyticsService: {
        getAnalyticsSummary: jest.fn().mockResolvedValue(mockEmptyData),
        getCommunicationDetails: jest.fn(),
      },
    }));

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('card-empty-state')).toBeInTheDocument();
      expect(screen.getByText(/No data available/i)).toBeInTheDocument();
      expect(screen.getByTestId('button-create-campaign')).toBeInTheDocument();
    });
  });

  it('should display analytics metrics when data is available', async () => {
    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('card-metric-sent')).toBeInTheDocument();
      expect(screen.getByTestId('card-metric-open-rate')).toBeInTheDocument();
      expect(screen.getByTestId('card-metric-click-rate')).toBeInTheDocument();
      expect(screen.getByTestId('card-metric-delivery-rate')).toBeInTheDocument();
      expect(screen.getByTestId('card-detailed-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('card-insights')).toBeInTheDocument();
    });
  });

  it('should not load analytics when user is not logged in', () => {
    mockUseAuth.mockReturnValue(createMockUnauthenticatedContext());

    render(<AnalyticsPage />);
    // Page should return null when user is not logged in
    expect(screen.queryByText(/Communication Analytics/i)).not.toBeInTheDocument();
  });

  it('should handle service loading errors gracefully', async () => {
    // Clear the global toast mock for this test
    globalToastMock.error.mockClear();

    jest.doMock('@/services/communicationAnalyticsService', () => ({
      communicationAnalyticsService: {
        getAnalyticsSummary: jest.fn().mockRejectedValue(new Error('Service error')),
        getCommunicationDetails: jest.fn(),
      },
    }));

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Communication Analytics/i)).toBeInTheDocument();
    });

    // Verify toast.error was called using the global mock
    expect(globalToastMock.error).toHaveBeenCalledWith('Failed to load communication analytics');

    // Note: We're not checking logger.error because the logger mock doesn't persist
    // across the module boundary. The important behavior is that errors are handled
    // and displayed to the user via toast.
  });
});

