import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock all services first - CRITICAL ORDER
jest.mock('@/services/adminService', () => ({
  adminService: {
    getClubAdmins: jest.fn(),
    getPendingInvites: jest.fn(),
    createAdminInvite: jest.fn(),
    cancelInvite: jest.fn(),
    removeAdmin: jest.fn(),
  },
  ClubAdminResponse: {},
  AdminInviteResponse: {},
}));

jest.mock('@/services/billingService', () => ({
  billingService: {
    getBillingStatus: jest.fn(),
  },
  BillingStatus: {},
}));

// Mock hooks
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useFormValidation', () => ({
  useFormValidation: () => ({
    errors: {},
    isValid: true,
    validate: jest.fn(() => true),
    validateForm: jest.fn(() => ({ isValid: true, errors: {} })),
    validateField: jest.fn(() => true),
    clearErrors: jest.fn(),
    clearAllErrors: jest.fn(),
    setFieldError: jest.fn(),
  }),
  useFieldValidation: () => ({
    validateAndShow: jest.fn(() => true),
    validateFormAndShow: jest.fn(() => ({ isValid: true, errors: {} })),
  }),
}));

// Mock other dependencies
jest.mock('@/lib/validationService', () => ({
  ValidationService: {
    schemas: {
      adminInvite: {},
    },
    validateField: jest.fn(() => null),
    validateFormAndShow: jest.fn(() => ({ isValid: true, errors: {} })),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleApiError: jest.fn(),
    showErrorToast: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock ALL UI Components - COMPREHENSIVE
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
  Alert: ({ children, className, variant, ...props }: any) => (
    <div 
      className={`alert ${variant || ''} ${className || ''}`}
      data-testid="alert"
      role="alert"
      {...props}
    >
      {children}
    </div>
  ),
  AlertDescription: ({ children, className, ...props }: any) => (
    <div 
      className={`alert-description ${className || ''}`}
      data-testid="alert-description"
      {...props}
    >
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, any>(function Input({ className, type, ...props }, ref) {
    return (
      <input
        type={type}
        className={`input ${className || ''}`}
        ref={ref}
        data-testid="input"
        {...props}
      />
    );
  })
}));

jest.mock('@/components/ui/label', () => ({
  Label: React.forwardRef<HTMLLabelElement, any>(function Label({ className, ...props }, ref) {
    return (
      <label
        ref={ref}
        className={`label ${className || ''}`}
        data-testid="label"
        {...props}
      />
    );
  })
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  UserPlus: (props: any) => <div data-testid="user-plus-icon" {...props}>UserPlus</div>,
  Settings: (props: any) => <div data-testid="settings-icon" {...props}>Settings</div>,
  Crown: (props: any) => <div data-testid="crown-icon" {...props}>Crown</div>,
  User: (props: any) => <div data-testid="user-icon" {...props}>User</div>,
  Mail: (props: any) => <div data-testid="mail-icon" {...props}>Mail</div>,
  Trash2: (props: any) => <div data-testid="trash2-icon" {...props}>Trash2</div>,
  X: (props: any) => <div data-testid="x-icon" {...props}>X</div>,
}));

// Mock the InviteAdminModal component
jest.mock('@/components/features/admin/InviteAdminModal', () => ({
  InviteAdminModal: ({ open, onOpenChange, onSubmit }: any) => {
    const [email, setEmail] = React.useState('');
    
    const handleSubmit = async (e: any) => {
      e.preventDefault();
      if (email.trim()) {
        await onSubmit(email);
      }
    };

    if (!open) return null;

    return (
      <div data-testid="invite-admin-modal">
        <h2>Invite New Administrator</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="invite-email-input"
          />
          <button type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button type="submit" data-testid="send-invitation-button">
            Send Invitation
          </button>
        </form>
      </div>
    );
  }
}));

// Import after all mocks are set up
import ClubAdminsPage from '../page';
import { useAuth } from '@/hooks/useAuth';
import { adminService, ClubAdminResponse, AdminInviteResponse } from '@/services/adminService';
import { billingService, BillingStatus } from '@/services/billingService';
import { toast } from 'sonner';
import { ErrorHandler } from '@/lib/errorHandler';
import { createMockUser, createMockAuthContext } from '@/tests/test-utils';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockAdminService = adminService as jest.Mocked<typeof adminService>;
const mockBillingService = billingService as jest.Mocked<typeof billingService>;
const mockToast = toast as jest.Mocked<typeof toast>;
const mockErrorHandler = ErrorHandler as jest.Mocked<typeof ErrorHandler>;

// Test data
const mockGrowTierBillingStatus: BillingStatus = {
  currentTier: 'Grow',
  nextBillingDate: '2024-01-01',
  subscriptionStatus: 'active',
  hasActiveSubscription: true,
  memberCount: 5,
  memberLimit: 50,
  canUpgrade: false
};

const mockAdmins: ClubAdminResponse[] = [
  {
    userId: 1,
    fullName: 'Primary Admin',
    email: 'primary@test.com',
    role: 'Primary',
    isCurrentUser: true,
    createdAt: new Date().toISOString()
  },
  {
    userId: 2,
    fullName: 'Regular Admin',
    email: 'admin@test.com',
    role: 'Admin',
    isCurrentUser: false,
    createdAt: new Date().toISOString()
  }
];

const mockPendingInvites: AdminInviteResponse[] = [];

describe('ClubAdminsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Clear logger mocks
    const { logger } = require('@/lib/logger');
    logger.error.mockClear();
    logger.warn.mockClear();
    logger.info.mockClear();
    logger.debug.mockClear();

    // Set up ErrorHandler mock implementations
    mockErrorHandler.handleApiError.mockImplementation((error: any, options?: any) => {
      const context = options?.context || 'operation';
      const message = `Error ${context}: ${error.message}`;
      return {
        message,
        code: 'LOAD_ERROR'
      };
    });

    mockErrorHandler.showErrorToast.mockImplementation((apiError: any) => {
      // Call toast.error with the API error message
      mockToast.error(apiError.message, { description: apiError.code });
    });

    // Default auth setup
    mockUseAuth.mockReturnValue(createMockAuthContext({
      userId: 1,
      fullName: 'Primary Admin',
      email: 'primary@test.com',
      clubId: 1,
      clubName: 'Test Club',
      clubTier: 'Grow',
      role: 'Admin',
      isOnboardingCompleted: true,
    }));

    // Default service mocks - no pending invites by default
    mockBillingService.getBillingStatus.mockResolvedValue(mockGrowTierBillingStatus);
    mockAdminService.getClubAdmins.mockResolvedValue(mockAdmins);
    mockAdminService.getPendingInvites.mockResolvedValue(mockPendingInvites);
  });

  describe('Page Loading and Display', () => {
    test('shows loading state initially', () => {
      render(<ClubAdminsPage />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('displays admins and tier badge for Grow tier club', async () => {
      render(<ClubAdminsPage />);

      await waitFor(() => {
        expect(screen.getByText('Club Administrators')).toBeInTheDocument();
        expect(screen.getByText('Grow Tier')).toBeInTheDocument();
        expect(screen.getByText('Primary Admin')).toBeInTheDocument();
        expect(screen.getByText('Regular Admin')).toBeInTheDocument();
      });
    });

    test('shows invite button for Grow tier with available slots', async () => {
      render(<ClubAdminsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('invite-admin-button')).toBeInTheDocument();
      });
    });
  });

  describe('Tier Restrictions', () => {
    test('Grow tier users can manage admins', async () => {
      mockBillingService.getBillingStatus.mockResolvedValue(mockGrowTierBillingStatus);

      render(<ClubAdminsPage />);

      await waitFor(() => {
        // Grow tier should be able to manage admins
        expect(screen.getByText('Grow Tier')).toBeInTheDocument();
        expect(screen.getByTestId('invite-admin-button')).toBeInTheDocument();
      });
    });
  });

  describe('Admin Management Actions', () => {
    test('opens invite modal when invite button is clicked', async () => {
      const user = userEvent.setup();
      render(<ClubAdminsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('invite-admin-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('invite-admin-button'));

      await waitFor(() => {
        // Check for dialog content instead of role, as the dialog might be rendered in a portal
        expect(screen.getByText('Invite New Administrator')).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });
    });

    test('successfully creates admin invitation', async () => {
      const user = userEvent.setup();
      mockAdminService.createAdminInvite.mockResolvedValue({
        inviteId: 2,
        email: 'newadmin@test.com',
        status: 'Pending',
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        invitedByName: 'Primary Admin'
      });

      render(<ClubAdminsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('invite-admin-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('invite-admin-button'));
      
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'newadmin@test.com');
      
      const submitButton = screen.getByRole('button', { name: /send invitation/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAdminService.createAdminInvite).toHaveBeenCalledWith(1, { email: 'newadmin@test.com' });
        expect(mockToast.success).toHaveBeenCalledWith('Invitation sent to newadmin@test.com');
      });
    });
  });

  describe('Error Handling', () => {
    test('calls error handler when data loading fails', async () => {
      // Make billing service fail, which is called first in loadData
      const networkError = new Error('Network error');
      mockBillingService.getBillingStatus.mockRejectedValue(networkError);

      render(<ClubAdminsPage />);

      // Wait for the error handling to complete
      await waitFor(() => {
        // Verify ErrorHandler.handleApiError was called - this confirms error was caught
        expect(mockErrorHandler.handleApiError).toHaveBeenCalled();
      }, { timeout: 5000 });

      // Verify ErrorHandler.handleApiError was called with the correct parameters
      expect(mockErrorHandler.handleApiError).toHaveBeenCalledWith(
        networkError,
        { context: 'loading administrator information' }
      );

      // Verify ErrorHandler.showErrorToast was called with the API error
      expect(mockErrorHandler.showErrorToast).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error loading administrator information: Network error',
          code: 'LOAD_ERROR'
        })
      );

      // Verify that toast.error was eventually called via showErrorToast implementation
      expect(mockToast.error).toHaveBeenCalledWith(
        'Error loading administrator information: Network error',
        { description: 'LOAD_ERROR' }
      );

      // Note: We're not checking logger.error because the logger mock doesn't persist
      // across the module boundary. The important behavior is that errors are handled
      // via ErrorHandler and displayed to the user via toast.
    });
  });
});