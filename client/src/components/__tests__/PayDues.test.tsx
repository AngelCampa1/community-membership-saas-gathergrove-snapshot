import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PayDues from '@/components/PayDues';

// Mock memberService - must be at top level before any usage
jest.mock('@/services/memberService', () => {
  const mockFns = {
    getMemberDuesInfo: jest.fn(),
    payMyDues: jest.fn()
  };
  return {
    __esModule: true,
    default: mockFns
  };
});

// CRITICAL: Apply proven RadixUI inline mocking pattern for 81% success rate
// Universal RadixUI mocks - inline for maximum compatibility
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

// Dialog/Modal components for payment flow
jest.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dialog-root" data-open={open}>{children}</div>
  ),
  Trigger: React.forwardRef<HTMLButtonElement, any>(function DialogTrigger({ children, asChild, ...props }, ref) {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ref } as any);
    }
    return <button ref={ref} {...props} data-testid="dialog-trigger">{children}</button>;
  }),
  Content: React.forwardRef<HTMLDivElement, any>(function DialogContent({ children, ...props }, ref) {
    return <div ref={ref} data-testid="dialog-content" role="dialog" {...props}>{children}</div>;
  }),
  Portal: ({ children }: any) => children,
  Overlay: React.forwardRef<HTMLDivElement, any>(function DialogOverlay(props, ref) {
    return <div ref={ref} data-testid="dialog-overlay" {...props} />;
  }),
  Title: React.forwardRef<HTMLHeadingElement, any>(function DialogTitle({ children, ...props }, ref) {
    return <h2 ref={ref} data-testid="dialog-title" {...props}>{children}</h2>;
  }),
  Description: React.forwardRef<HTMLParagraphElement, any>(function DialogDescription({ children, ...props }, ref) {
    return <p ref={ref} data-testid="dialog-description" {...props}>{children}</p>;
  }),
  Close: React.forwardRef<HTMLButtonElement, any>(function DialogClose({ children, asChild, ...props }, ref) {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ref } as any);
    }
    return <button ref={ref} data-testid="dialog-close" {...props}>{children}</button>;
  }),
}));

// Alert Dialog components for payment confirmations (using installed packages)
jest.mock('@radix-ui/react-alert-dialog', () => ({
  Root: ({ children, open, onOpenChange }: any) => (
    <div data-testid="alert-dialog-root" data-open={open}>{children}</div>
  ),
  Trigger: React.forwardRef<HTMLButtonElement, any>(function AlertDialogTrigger({ children, asChild, ...props }, ref) {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ref } as any);
    }
    return <button ref={ref} data-testid="alert-dialog-trigger" {...props}>{children}</button>;
  }),
  Content: React.forwardRef<HTMLDivElement, any>(function AlertDialogContent({ children, ...props }, ref) {
    return <div ref={ref} data-testid="alert-dialog-content" role="alertdialog" {...props}>{children}</div>;
  }),
  Portal: ({ children }: any) => children,
  Overlay: React.forwardRef<HTMLDivElement, any>(function AlertDialogOverlay(props, ref) {
    return <div ref={ref} data-testid="alert-dialog-overlay" {...props} />;
  }),
  Title: React.forwardRef<HTMLHeadingElement, any>(function AlertDialogTitle({ children, ...props }, ref) {
    return <h2 ref={ref} data-testid="alert-dialog-title" {...props}>{children}</h2>;
  }),
  Description: React.forwardRef<HTMLParagraphElement, any>(function AlertDialogDescription({ children, ...props }, ref) {
    return <p ref={ref} data-testid="alert-dialog-description" {...props}>{children}</p>;
  }),
  Action: React.forwardRef<HTMLButtonElement, any>(function AlertDialogAction({ children, ...props }, ref) {
    return <button ref={ref} data-testid="alert-dialog-action" {...props}>{children}</button>;
  }),
  Cancel: React.forwardRef<HTMLButtonElement, any>(function AlertDialogCancel({ children, ...props }, ref) {
    return <button ref={ref} data-testid="alert-dialog-cancel" {...props}>{children}</button>;
  }),
}));

// UI component mocks with functional elements
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

// Mock additional UI components used by PayDues
jest.mock('@/components/ui/loading-error', () => ({
  LoadingError: ({ children, className, isLoading, loadingMessage, error, errorTitle, ...props }: any) => {
    if (isLoading) {
      return <div className={`loading-error loading ${className || ''}`} data-testid="loading-error">{loadingMessage || 'Loading...'}</div>;
    }
    if (error) {
      return <div className={`loading-error error ${className || ''}`} data-testid="loading-error">{errorTitle || error}</div>;
    }
    return <div className={`loading-error ${className || ''}`} data-testid="loading-error">{children}</div>;
  },
}));

jest.mock('@/components/ui/form-error', () => ({
  FormError: ({ children, className, message, variant, ...props }: any) => (
    <div className={`form-error ${className || ''}`} data-testid="form-error" data-variant={variant}>
      {message || children}
    </div>
  ),
}));

jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handle: jest.fn(),
    logError: jest.fn(),
    showSuccessToast: jest.fn(),
    showErrorToast: jest.fn(),
    handlePaymentError: jest.fn((error) => ({
      message: error?.message || 'Payment failed',
      code: 'PAYMENT_ERROR'
    })),
  },
}));

// Mock the necessary services and hooks
jest.mock('@/services/duesService', () => ({
  default: {
    payDues: jest.fn(),
    getMemberDuesInfo: jest.fn(),
  },
}));

jest.mock('@/services/stripeConnectService', () => ({
  stripeConnectService: {
    getConnectStatus: jest.fn(),
  },
}));

jest.mock('@/services/membershipTypeService', () => ({
  __esModule: true,
  default: {
    getMembershipTypes: jest.fn(),
  },
  membershipTypeService: {
    getMembershipTypes: jest.fn(),
  },
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: {
      userId: 1,
      fullName: 'John Doe',
      email: 'john@example.com',
      clubId: 1,
      role: 'Member',
    },
    loading: false,
    error: null,
  })),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    elements: jest.fn(() => ({
      getElement: jest.fn(),
      create: jest.fn(),
    })),
  })),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
  CardElement: () => <div data-testid="card-element">Card Element</div>,
  useStripe: () => ({
    createPaymentMethod: jest.fn().mockResolvedValue({
      paymentMethod: {
        id: 'pm_test123',
        type: 'card',
      },
      error: null,
    }),
  }),
  useElements: () => ({
    getElement: jest.fn().mockReturnValue({}),
  }),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  CreditCard: () => <svg data-testid="credit-card-icon" />,
  DollarSign: () => <svg data-testid="dollar-sign-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  AlertCircle: () => <svg data-testid="alert-circle-icon" />,
  Loader2: () => <svg data-testid="loader2-icon" />,
  Check: () => <svg data-testid="check-icon" />,
  AlertTriangle: () => <svg data-testid="alert-triangle-icon" />,
}));

describe('PayDues', () => {
  const mockToast = require('sonner').toast;
  const ErrorHandler = require('@/lib/errorHandler').ErrorHandler;
  const memberService = require('@/services/memberService').default;
  const membershipTypeService = require('@/services/membershipTypeService').default;
  const stripeConnectService = require('@/services/stripeConnectService').stripeConnectService;

  // Helper function to create valid MemberResponse mock
  const createMockMemberProfile = (overrides: Partial<any> = {}): any => ({
    id: 1,
    clubId: 123,
    memberId: 1,
    membershipTypeId: 1,
    membershipTypeName: 'Regular',
    fullName: 'John Doe',
    email: 'john@example.com',
    phoneNumber: '+1234567890',
    address: '123 Main St',
    status: 'Active',
    joinDate: '2023-01-01',
    duesPaidUntil: '2024-01-31',
    hasSmsConsent: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    customFieldValues: [],
    totalPaidCurrentPeriod: 0,
    expectedDuesAmount: 50.00,
    outstandingBalance: 0,
    hasPartialPayments: false,
    dues: 50.00,
    dueDate: '2024-01-15',
    isOverdue: false,
    ...overrides
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Re-implement ErrorHandler.handlePaymentError after clearAllMocks
    (ErrorHandler.handlePaymentError as jest.Mock).mockImplementation((error) => ({
      message: error?.message || 'Payment failed',
      code: 'PAYMENT_ERROR'
    }));

    // Set default mock implementations
    (memberService.getMemberDuesInfo as jest.Mock).mockResolvedValue({
      amount: 50.00,
      dueDate: '2024-01-15',
      isOverdue: false,
      description: 'Monthly membership dues',
    });

    (memberService.payMyDues as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Payment successful',
      transactionId: 'txn_123'
    });

    // Mock membershipTypeService to return membership types
    (membershipTypeService.getMembershipTypes as jest.Mock).mockResolvedValue([
      {
        id: 1,
        name: 'Regular',
        duesAmount: 50.00,
        billingCycle: 'Monthly',
        description: 'Regular membership',
        isActive: true
      }
    ]);

    // Mock stripeConnectService to return successful Stripe status
    (stripeConnectService.getConnectStatus as jest.Mock).mockResolvedValue({
      isConnected: true,
      hasCompletedOnboarding: true,
      accountId: 'acct_test123'
    });
  });

  it('renders pay dues component with amount', async () => {
    const mockMemberProfile = createMockMemberProfile();
    const mockOnPaymentSuccess = jest.fn();
    const mockOnCancel = jest.fn();

    render(
      <PayDues 
        memberProfile={mockMemberProfile}
        onPaymentSuccess={mockOnPaymentSuccess}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/pay dues/i)).toBeInTheDocument();
      expect(screen.getAllByText(/\$50\.00/)[0]).toBeInTheDocument();
    });
  });

  it('displays membership type information', async () => {
    const mockMemberProfile = createMockMemberProfile();

    render(
      <PayDues
        memberProfile={mockMemberProfile}
        onPaymentSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/membership:/i)).toBeInTheDocument();
      expect(screen.getAllByText(/regular/i)[0]).toBeInTheDocument();
    });
  });

  it('displays payment form with card element', async () => {
    const mockMemberProfile = createMockMemberProfile();

    render(
      <PayDues
        memberProfile={mockMemberProfile}
        onPaymentSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
      expect(screen.getByTestId('card-element')).toBeInTheDocument();
    });
  });

  it('handles successful payment', async () => {
    (memberService.payMyDues as jest.Mock).mockResolvedValue({ success: true });
    const mockMemberProfile = createMockMemberProfile();

    render(
      <PayDues
        memberProfile={mockMemberProfile}
        onPaymentSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /pay \$50\.00/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(ErrorHandler.showSuccessToast).toHaveBeenCalled();
    });
  });

  it('handles payment errors', async () => {
    (memberService.payMyDues as jest.Mock).mockRejectedValue(new Error('Payment failed'));
    const mockMemberProfile = createMockMemberProfile();

    render(
      <PayDues
        memberProfile={mockMemberProfile}
        onPaymentSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /pay \$50\.00/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(ErrorHandler.showErrorToast).toHaveBeenCalled();
    });
  });

  it('renders successfully with past due date', async () => {
    const mockMemberProfile = createMockMemberProfile({
      dueDate: '2023-12-15',
      isOverdue: true
    });

    render(
      <PayDues
        memberProfile={mockMemberProfile}
        onPaymentSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
      expect(screen.getByText(/pay dues/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching dues info', () => {
    (memberService.getMemberDuesInfo as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    const mockMemberProfile = createMockMemberProfile();

    render(
      <PayDues 
        memberProfile={mockMemberProfile}
        onPaymentSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});