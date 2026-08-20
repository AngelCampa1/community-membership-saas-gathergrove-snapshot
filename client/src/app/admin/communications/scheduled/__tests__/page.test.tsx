import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ScheduledPage from '../page';
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
    toast: jest.fn(),
  })),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const IconComponent = React.forwardRef<HTMLSpanElement, any>(function IconComponent(props, ref) {
    return React.createElement('span', { ref, className: 'lucide-icon', 'data-testid': 'lucide-icon', ...props });
  });
  return {
    Calendar: IconComponent,
    Clock: IconComponent,
    Mail: IconComponent,
    MessageSquare: IconComponent,
    XCircle: IconComponent,
    CheckCircle: IconComponent,
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

jest.mock('@/components/ui/table', () => ({
  Table: ({ children, ...props }: any) => <table data-testid="table" {...props}>{children}</table>,
  TableBody: ({ children, ...props }: any) => <tbody data-testid="table-body" {...props}>{children}</tbody>,
  TableCell: ({ children, ...props }: any) => <td data-testid="table-cell" {...props}>{children}</td>,
  TableHead: ({ children, ...props }: any) => <th data-testid="table-head" {...props}>{children}</th>,
  TableHeader: ({ children, ...props }: any) => <thead data-testid="table-header" {...props}>{children}</thead>,
  TableRow: ({ children, ...props }: any) => <tr data-testid="table-row" {...props}>{children}</tr>,
}));

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, ...props }: any) => <div data-testid="alert-dialog" {...props}>{children}</div>,
  AlertDialogAction: ({ children, ...props }: any) => <button data-testid="alert-dialog-action" {...props}>{children}</button>,
  AlertDialogCancel: ({ children, ...props }: any) => <button data-testid="alert-dialog-cancel" {...props}>{children}</button>,
  AlertDialogContent: ({ children, ...props }: any) => <div data-testid="alert-dialog-content" {...props}>{children}</div>,
  AlertDialogDescription: ({ children, ...props }: any) => <p data-testid="alert-dialog-description" {...props}>{children}</p>,
  AlertDialogFooter: ({ children, ...props }: any) => <div data-testid="alert-dialog-footer" {...props}>{children}</div>,
  AlertDialogHeader: ({ children, ...props }: any) => <div data-testid="alert-dialog-header" {...props}>{children}</div>,
  AlertDialogTitle: ({ children, ...props }: any) => <h2 data-testid="alert-dialog-title" {...props}>{children}</h2>,
}));

const mockPush = jest.fn();
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseAuthorization = useAuthorization as jest.MockedFunction<typeof useAuthorization>;
const mockUseRouter = useRouter as jest.Mock;

describe('ScheduledPage', () => {
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

    render(<ScheduledPage />);
    expect(mockPush).toHaveBeenCalledWith('/admin/communications');
  });

  it('should render scheduled communications page for Unlimited tier users', async () => {
    render(<ScheduledPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Scheduled Communications' })).toBeInTheDocument();
    });
  });

  it('should display page content correctly', async () => {
    render(<ScheduledPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Scheduled Communications' })).toBeInTheDocument();
    });

    // Check that empty state is displayed since mockData is empty
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No scheduled communications')).toBeInTheDocument();
    expect(screen.getByTestId('button-schedule-email')).toBeInTheDocument();
    expect(screen.queryByTestId('button-schedule-sms')).not.toBeInTheDocument();
  });

  it('should handle scheduled communications loading', async () => {
    render(<ScheduledPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Scheduled Communications' })).toBeInTheDocument();
    });

    // Check for empty state since mockData is empty
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No scheduled communications')).toBeInTheDocument();
  });

  it('should not load scheduled communications when user is not logged in', () => {
    mockUseAuth.mockReturnValue(createMockUnauthenticatedContext());

    render(<ScheduledPage />);
    // Component returns null when user is not logged in
    expect(screen.queryByRole('heading', { name: /Scheduled Communications/i })).not.toBeInTheDocument();
  });
});

