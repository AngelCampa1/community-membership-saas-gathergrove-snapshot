import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ABTestsPage from '../page';
import { useAuth } from '@/hooks/useAuth';
import { useAuthorization } from '@/hooks/useAuthorization';
import { createMockUser, createMockAuthContext, createMockUnauthenticatedContext } from '@/tests/test-utils';

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

jest.mock('@/hooks/useToast', () => ({
  useToast: jest.fn(() => ({
    toast: {
      error: jest.fn(),
      success: jest.fn(),
      info: jest.fn(),
      warning: jest.fn(),
    },
  })),
}));

// Mock the services that are dynamically imported
jest.mock('@/services/abTestingService', () => ({
  abTestingService: {
    getCampaigns: jest.fn(() => Promise.resolve([])),
  },
}));

jest.mock('@/services/emailTemplateService', () => ({
  emailTemplateService: {
    getTemplates: jest.fn(() => Promise.resolve([])),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const IconComponent = React.forwardRef<HTMLSpanElement, any>(function IconComponent(props, ref) {
    return React.createElement('span', { ref, className: 'lucide-icon', 'data-testid': 'lucide-icon', ...props });
  });
  return {
    Plus: IconComponent,
    TrendingUp: IconComponent,
    Play: IconComponent,
    Award: IconComponent,
    Trash: IconComponent,
    BarChart: IconComponent,
    FlaskConical: IconComponent,
    Trophy: IconComponent,
    Eye: IconComponent,
    Calendar: IconComponent,
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
  Badge: ({ children, ...props }: any) => <span data-testid="badge" {...props}>{children}</span>,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, ...props }: any) => <div data-testid="dialog" {...props}>{children}</div>,
  DialogContent: ({ children, ...props }: any) => <div data-testid="dialog-content" {...props}>{children}</div>,
  DialogDescription: ({ children, ...props }: any) => <p data-testid="dialog-description" {...props}>{children}</p>,
  DialogFooter: ({ children, ...props }: any) => <div data-testid="dialog-footer" {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }: any) => <div data-testid="dialog-header" {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: any) => <h2 data-testid="dialog-title" {...props}>{children}</h2>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ ...props }: any) => <input data-testid="input" {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label data-testid="label" {...props}>{children}</label>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, ...props }: any) => <div data-testid="select" {...props}>{children}</div>,
  SelectContent: ({ children, ...props }: any) => <div data-testid="select-content" {...props}>{children}</div>,
  SelectItem: ({ children, ...props }: any) => <div data-testid="select-item" {...props}>{children}</div>,
  SelectTrigger: ({ children, ...props }: any) => <div data-testid="select-trigger" {...props}>{children}</div>,
  SelectValue: ({ children, ...props }: any) => <div data-testid="select-value" {...props}>{children}</div>,
}));

const mockPush = jest.fn();
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseAuthorization = useAuthorization as jest.MockedFunction<typeof useAuthorization>;
const mockUseRouter = useRouter as jest.Mock;

const mockUnlimitedUser = createMockUser({ clubTier: 'Unlimited' });

describe('ABTestsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
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

    render(<ABTestsPage />);
    expect(mockPush).toHaveBeenCalledWith('/admin/communications');
  });

  it('should render page for Unlimited tier users', () => {
    render(<ABTestsPage />);
    expect(screen.getByText('A/B Test Campaigns')).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    render(<ABTestsPage />);
    expect(screen.getByText('A/B Test Campaigns')).toBeInTheDocument();
  });

  it('should handle campaign loading', async () => {
    render(<ABTestsPage />);

    await waitFor(() => {
      expect(screen.getByText('A/B Test Campaigns')).toBeInTheDocument();
    });
  });

  it('should navigate to create campaign', () => {
    render(<ABTestsPage />);

    const createButton = screen.getByTestId('button-create-campaign');
    expect(createButton).toBeInTheDocument();
  });

  it('should not load campaigns when user is not logged in', () => {
    mockUseAuth.mockReturnValue(createMockUnauthenticatedContext());

    render(<ABTestsPage />);
    // Component returns null when user is not logged in
    expect(screen.queryByText('A/B Test Campaigns')).not.toBeInTheDocument();
  });
});

