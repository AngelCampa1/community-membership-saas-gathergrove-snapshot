import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import WorkflowsPage from '../page';
import { useAuth } from '@/hooks/useAuth';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useToast } from '@/hooks/useToast';
import { createMockUser, createMockAuthContext, createMockUnauthenticatedContext } from '@/tests/test-utils';

// Mock environment variables
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_API_URL: 'http://localhost:5000',
    NODE_ENV: 'test',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/admin/communications/workflows'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
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
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      info: jest.fn(),
    },
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  })),
}));

// Mock the service that is dynamically imported
jest.mock('@/services/communicationWorkflowService', () => ({
  communicationWorkflowService: {
    getWorkflows: jest.fn(() => Promise.resolve([])),
    createWorkflow: jest.fn(() => Promise.resolve({
      id: 1,
      clubId: 1,
      workflowName: 'Test Workflow',
      description: 'Test Description',
      triggerType: 'member_join',
      workflowSteps: '[]',
      isActive: true,
      createdByUserId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    toggleWorkflow: jest.fn(() => Promise.resolve({
      id: 1,
      clubId: 1,
      workflowName: 'Test Workflow',
      description: 'Test Description',
      triggerType: 'member_join',
      workflowSteps: '[]',
      isActive: false,
      createdByUserId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    deleteWorkflow: jest.fn(() => Promise.resolve()),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const IconComponent = React.forwardRef<HTMLSpanElement, any>(function IconComponent(props, ref) {
    return React.createElement('span', { ref, className: 'lucide-icon', 'data-testid': 'lucide-icon', ...props });
  });
  return {
    Plus: IconComponent,
    Play: IconComponent,
    Pause: IconComponent,
    Edit: IconComponent,
    Trash: IconComponent,
    Workflow: IconComponent,
    MoreVertical: IconComponent,
    Calendar: IconComponent,
    TrendingUp: IconComponent,
    CheckCircle: IconComponent,
    XCircle: IconComponent,
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

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ ...props }: any) => <textarea data-testid="textarea" {...props} />,
}));

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, ...props }: any) => <div data-testid="alert-dialog" {...props}>{children}</div>,
  AlertDialogContent: ({ children, ...props }: any) => <div data-testid="alert-dialog-content" {...props}>{children}</div>,
  AlertDialogDescription: ({ children, ...props }: any) => <p data-testid="alert-dialog-description" {...props}>{children}</p>,
  AlertDialogFooter: ({ children, ...props }: any) => <div data-testid="alert-dialog-footer" {...props}>{children}</div>,
  AlertDialogHeader: ({ children, ...props }: any) => <div data-testid="alert-dialog-header" {...props}>{children}</div>,
  AlertDialogTitle: ({ children, ...props }: any) => <h2 data-testid="alert-dialog-title" {...props}>{children}</h2>,
  AlertDialogAction: ({ children, onClick, ...props }: any) => <button onClick={onClick} data-testid="alert-dialog-action" {...props}>{children}</button>,
  AlertDialogCancel: ({ children, onClick, ...props }: any) => <button onClick={onClick} data-testid="alert-dialog-cancel" {...props}>{children}</button>,
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-menu-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => <div onClick={onClick} data-testid="dropdown-menu-item">{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div data-testid="dropdown-menu-trigger">{children}</div>,
}));

const mockPush = jest.fn();
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseAuthorization = useAuthorization as jest.MockedFunction<typeof useAuthorization>;
const mockUseRouter = useRouter as jest.Mock;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('WorkflowsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      replace: jest.fn(),
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

    render(<WorkflowsPage />);
    expect(mockPush).toHaveBeenCalledWith('/admin/communications');
  });

  it('should render workflows page for Unlimited tier users', () => {
    render(<WorkflowsPage />);
    expect(screen.getByText('Communication Workflows')).toBeInTheDocument();
    expect(screen.getByText('Automate member communications with triggered workflows')).toBeInTheDocument();
  });

  it('should display create workflow button', () => {
    render(<WorkflowsPage />);
    const createButton = screen.getByTestId('button-create-workflow');
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveTextContent('Create Workflow');
  });

  it('should display Expand feature badge', () => {
    render(<WorkflowsPage />);
    expect(screen.getByText('Expand Feature')).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    render(<WorkflowsPage />);
    // Should show loading cards
    expect(screen.getByTestId('card-loading-1')).toBeInTheDocument();
    expect(screen.getByTestId('card-loading-2')).toBeInTheDocument();
  });

  it('should display empty state when no workflows exist', async () => {
    render(<WorkflowsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('card-empty-state')).toBeInTheDocument();
      expect(screen.getByText('No workflows yet')).toBeInTheDocument();
      expect(screen.getByText('Create your first workflow to automate communications based on member actions and events')).toBeInTheDocument();
      expect(screen.getByTestId('button-create-first-workflow')).toBeInTheDocument();
    });
  });

  it('should handle workflow loading', async () => {
    render(<WorkflowsPage />);

    await waitFor(() => {
      expect(screen.getByText('Communication Workflows')).toBeInTheDocument();
    });
  });

  it('should not load workflows when user is not logged in', () => {
    mockUseAuth.mockReturnValue(createMockUnauthenticatedContext());

    render(<WorkflowsPage />);
    // Component returns null when user is not logged in
    expect(screen.queryByText('Communication Workflows')).not.toBeInTheDocument();
  });

  it('should open create workflow dialog when create button is clicked', async () => {
    render(<WorkflowsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('card-empty-state')).toBeInTheDocument();
    });

    const createButton = screen.getByTestId('button-create-workflow');
    fireEvent.click(createButton);

    expect(screen.getByTestId('dialog-create-workflow')).toBeInTheDocument();
    expect(screen.getByText('Create Communication Workflow')).toBeInTheDocument();
    expect(screen.getByText('Set up automated communications triggered by member actions')).toBeInTheDocument();
  });

  it('should have proper form fields in create dialog', async () => {
    render(<WorkflowsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('card-empty-state')).toBeInTheDocument();
    });

    const createButton = screen.getByTestId('button-create-workflow');
    fireEvent.click(createButton);

    expect(screen.getByTestId('input-workflow-name')).toBeInTheDocument();
    expect(screen.getByTestId('input-workflow-description')).toBeInTheDocument();
    expect(screen.getByTestId('select-trigger-type')).toBeInTheDocument();
    expect(screen.getByTestId('button-cancel')).toBeInTheDocument();
    expect(screen.getByTestId('button-create')).toBeInTheDocument();
  });

  it('creates a workflow, shows success, and resets the form without raising an error toast', async () => {
    // Stable toast references so we can assert against them.
    const successToast = jest.fn();
    const errorToast = jest.fn();
    mockUseToast.mockReturnValue({
      toast: { success: successToast, error: errorToast, warning: jest.fn(), info: jest.fn() },
      success: successToast,
      error: errorToast,
      warning: jest.fn(),
      info: jest.fn(),
    } as any);

    render(<WorkflowsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('card-empty-state')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('button-create-workflow'));

    const nameInput = screen.getByTestId('input-workflow-name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Welcome Sequence' } });
    expect(nameInput.value).toBe('Welcome Sequence');

    fireEvent.click(screen.getByTestId('button-create'));

    // Success toast must fire on a successful create.
    await waitFor(() => {
      expect(successToast).toHaveBeenCalled();
    });

    // The create handler must NOT raise a spurious failure toast. Before the
    // E-001 fix, resetForm() referenced an undefined `setWorkflowSteps`, throwing
    // a ReferenceError that the catch block surfaced as "Failed to create".
    expect(errorToast).not.toHaveBeenCalled();

    // resetForm must run to completion and clear the name field.
    await waitFor(() => {
      expect((screen.getByTestId('input-workflow-name') as HTMLInputElement).value).toBe('');
    });
  });
});

