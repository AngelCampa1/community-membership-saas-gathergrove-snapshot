import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import EmailTemplatesPage from '../page';
import { useAuth } from '@/hooks/useAuth';
import { useAuthorization } from '@/hooks/useAuthorization';
import { createMockUser, createMockAuthContext, createMockUnauthenticatedContext } from '@/tests/test-utils';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5000';
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_APP_ENV = 'test';

// Add comprehensive environment variable mocking to prevent undefined errors
Object.defineProperty(process, 'env', {
  value: {
    ...process.env,
    NEXT_PUBLIC_API_URL: 'http://localhost:5000',
    NODE_ENV: 'test',
    NEXT_PUBLIC_APP_ENV: 'test',
  },
});

// Create a comprehensive mock for useToast
const mockToast = {
  error: jest.fn(),
  success: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
};

// Add global toast mock for error handling
(global as any).toast = mockToast;

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
  useToast: jest.fn(() => mockToast),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const IconComponent = React.forwardRef<HTMLSpanElement, any>(function IconComponent({ size = 16, className, ...props }, ref) {
    return React.createElement('span', {
      ref,
      className: `lucide-icon ${className || ''}`,
      'data-testid': 'lucide-icon',
      style: { width: size, height: size },
      ...props
    });
  });
  
  return {
    Plus: IconComponent,
    Mail: IconComponent,
    Edit: IconComponent,
    Copy: IconComponent,
    Trash: IconComponent,
    MoreVertical: IconComponent,
    Eye: IconComponent,
    Calendar: IconComponent,
    User: IconComponent,
  };
});

// Mock UI components
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
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="button" {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => (
    <span data-testid="badge" {...props}>{children}</span>
  ),
}));

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) => open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogContent: ({ children }: any) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div data-testid="alert-dialog-header">{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2 data-testid="alert-dialog-title">{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <p data-testid="alert-dialog-description">{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div data-testid="alert-dialog-footer">{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="alert-dialog-action">{children}</button>
  ),
  AlertDialogCancel: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="alert-dialog-cancel">{children}</button>
  ),
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div data-testid="dropdown-menu-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-menu-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick, ...props }: any) => (
    <div onClick={onClick} data-testid="dropdown-menu-item" {...props}>{children}</div>
  ),
}));

const mockPush = jest.fn();
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseAuthorization = useAuthorization as jest.MockedFunction<typeof useAuthorization>;
const mockUseRouter = useRouter as jest.Mock;

const mockTemplates = [
  {
    id: 1,
    clubId: 1,
    templateName: 'Welcome Email',
    description: 'Welcome new members',
    templateHtml: '<html><body>Welcome!</body></html>',
    templateJson: '{}',
    createdBy: 1,
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date('2025-01-01').toISOString(),
    isActive: true,
  },
  {
    id: 2,
    clubId: 1,
    templateName: 'Newsletter Template',
    description: 'Monthly newsletter',
    templateHtml: '<html><body>Newsletter</body></html>',
    templateJson: '{}',
    createdBy: 1,
    createdAt: new Date('2025-01-02').toISOString(),
    updatedAt: new Date('2025-01-02').toISOString(),
    isActive: true,
  },
];

describe('EmailTemplatesPage', () => {
  // Helper to setup default MSW handlers
  const setupDefaultHandlers = () => {
    server.use(
      http.get('http://localhost:5000/api/v1/clubs/:clubId/email-templates', () => {
        return HttpResponse.json(mockTemplates);
      }),
      http.delete('http://localhost:5000/api/v1/clubs/:clubId/email-templates/:templateId', () => {
        return HttpResponse.json(null, { status: 204 });
      }),
      http.post('http://localhost:5000/api/v1/clubs/:clubId/email-templates/:templateId/duplicate', ({ params }) => {
        const { templateId } = params;
        const original = mockTemplates.find(t => t.id === Number(templateId));
        if (!original) {
          return HttpResponse.json({ message: 'Template not found' }, { status: 404 });
        }
        return HttpResponse.json({
          ...original,
          id: 999,
          templateName: `${original.templateName} (Copy)`,
        });
      })
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseRouter.mockReturnValue({
      push: mockPush,
    });

    mockUseAuth.mockReturnValue(createMockAuthContext({ clubTier: 'Unlimited' }));

    // Setup default handlers (will be overridden in specific suites if needed)
    setupDefaultHandlers();

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

    // Clear toast mock
    mockToast.error.mockClear();
    mockToast.success.mockClear();
    mockToast.info.mockClear();
    mockToast.warning.mockClear();
  });

  describe('Tier Authorization', () => {
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

      render(<EmailTemplatesPage />);

      expect(mockPush).toHaveBeenCalledWith('/admin/communications');
    });

    it('should allow Unlimited tier users to access', async () => {
      // Mock dynamic import
      jest.isolateModules(() => {
        jest.doMock('@/services/emailTemplateService', () => ({
          emailTemplateService: {
            getTemplates: jest.fn().mockResolvedValue(mockTemplates),
          },
        }));
      });

      render(<EmailTemplatesPage />);

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalledWith('/admin/communications');
      });
    });
  });

  describe('Template Loading', () => {
    it('should display loading state initially', () => {
      render(<EmailTemplatesPage />);

      expect(screen.getByRole('heading', { name: 'Email Templates' })).toBeInTheDocument();
    });

    it('should load and display templates via MSW', async () => {
      render(<EmailTemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText('Welcome Email')).toBeInTheDocument();
        expect(screen.getByText('Newsletter Template')).toBeInTheDocument();
      });
    });

    it('should handle template loading error gracefully', async () => {
      // Override MSW handler to return error
      server.use(
        http.get('http://localhost:5000/api/v1/clubs/:clubId/email-templates', () => {
          return new HttpResponse(null, {
            status: 500,
            statusText: 'Internal Server Error',
          });
        })
      );

      render(<EmailTemplatesPage />);

      // The component should show the main heading even on error
      expect(screen.getByText('Email Templates')).toBeInTheDocument();

      // Wait for error to be handled - component should still be in loading/error state
      await waitFor(() => {
        // Since there's an error, templates won't load
        expect(screen.queryByText('Welcome Email')).not.toBeInTheDocument();
      });
    });
  });

  describe('Template Actions', () => {
    it('should navigate to template designer on create button click', () => {
      render(<EmailTemplatesPage />);

      const createButton = screen.getByRole('button', { name: /Create Template/i });
      fireEvent.click(createButton);

      expect(mockPush).toHaveBeenCalledWith('/admin/communications/templates/designer');
    });

    it('should navigate to edit page when edit action is clicked', async () => {
      render(<EmailTemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText('Welcome Email')).toBeInTheDocument();
      });

      // Find and click edit button using the specific test ID
      const editButton = screen.getByTestId('button-edit-1');
      fireEvent.click(editButton);

      expect(mockPush).toHaveBeenCalledWith('/admin/communications/templates/1/edit');
    });

    it('should display template actions menu', async () => {
      render(<EmailTemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText('Welcome Email')).toBeInTheDocument();
      });

      // Verify that the menu trigger exists for the first template
      const menuTrigger = screen.getByTestId('button-template-menu-1');
      expect(menuTrigger).toBeInTheDocument();
    });

    it('should have delete option in menu', async () => {
      render(<EmailTemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText('Welcome Email')).toBeInTheDocument();
      });

      // Verify delete button exists in menu
      const deleteButton = screen.getByTestId('menu-delete-1');
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveClass('text-destructive');
    });
  });

  describe('Empty State', () => {
    it('should have create template button for empty state', () => {
      render(<EmailTemplatesPage />);

      // The create button should always be available
      const createButton = screen.getByTestId('button-create-template');
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveTextContent('Create Template');
    });
  });

  describe('User Context', () => {
    it('should not load templates when user is not logged in', () => {
      mockUseAuth.mockReturnValue(createMockUnauthenticatedContext());

      render(<EmailTemplatesPage />);

      // Component should return null when no user, rendering empty content
      // Check that the main content is not rendered
      expect(screen.queryByText('Email Templates')).not.toBeInTheDocument();
    });
  });
});

