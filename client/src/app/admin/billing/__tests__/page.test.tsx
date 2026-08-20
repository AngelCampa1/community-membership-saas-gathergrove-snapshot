import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BillingPage from '../page';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { billingService, type BillingStatus } from '@/services/billingService';
import { ErrorHandler } from '@/lib/errorHandler';
import { createMockAuthContext, createMockUser } from '@/tests/test-utils';

jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ...(children.props || {}) });
    }
    return <div {...props}>{children}</div>;
  },
  Slottable: ({ children }: any) => <>{children}</>,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
  CardDescription: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardFooter: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(function Button(
    { children, asChild, ...props },
    ref,
  ) {
    if (asChild && children) return <>{children}</>;
    return (
      <button ref={ref} {...props}>
        {children}
      </button>
    );
  }),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: (props: any) => <div {...props} />,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children, ...props }: any) => (
    <div data-testid="dialog-content" {...props}>
      {children}
    </div>
  ),
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/billing/UpgradeModal', () => ({
  UpgradeModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="modal-upgrade" /> : null),
}));

jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/useToast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/services/billingService', () => ({
  billingService: {
    getBillingStatus: jest.fn(),
    claimTrial: jest.fn(),
    createCustomerPortalSession: jest.fn(),
    cancelSubscription: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleBillingError: jest.fn().mockReturnValue({ message: 'Error loading billing status: API Error' }),
    showErrorToast: jest.fn(),
  },
}));

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    Suspense: ({ children }: { children: React.ReactNode }) => children,
  };
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockBillingService = jest.mocked(billingService);

describe('BillingPage', () => {
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  };

  const mockUser = createMockUser({
    userId: 123,
    fullName: 'Test User',
    email: 'test@example.com',
    clubId: 123,
    clubName: 'Test Club',
    clubTier: 'Grow',
    role: 'Admin',
    isOnboardingCompleted: true,
  });

  const inactiveStatus: BillingStatus = {
    currentTier: 'Grow',
    hasActiveSubscription: false,
    memberCount: 25,
    memberLimit: 200,
    canUpgrade: true,
    trialStatus: 'inactive',
    accountLocked: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(createMockAuthContext({ ...mockUser }));
    mockUseToast.mockReturnValue(mockToast as any);
    mockBillingService.getBillingStatus.mockResolvedValue(inactiveStatus);
    mockBillingService.claimTrial.mockResolvedValue({
      success: true,
      message: 'Trial claimed successfully',
      subscriptionId: 'sub_123',
      trialEndsAt: '2026-03-22T00:00:00Z',
    });
    mockBillingService.createCustomerPortalSession.mockResolvedValue({
      url: 'https://billing.stripe.com/session/test',
    });
    mockBillingService.cancelSubscription.mockResolvedValue({
      message: 'Subscription cancelled successfully',
    });
  });

  it('renders billing page with inactive subscription status', async () => {
    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getByText('Billing & Subscription')).toBeInTheDocument();
      expect(screen.getByTestId('badge-subscription-status')).toHaveTextContent('Inactive');
    });
  });

  it('shows trial state when trialing', async () => {
    mockBillingService.getBillingStatus.mockResolvedValue({
      ...inactiveStatus,
      trialStatus: 'trialing',
      trialEndsAt: '2026-03-22T00:00:00Z',
    });

    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getByTestId('badge-subscription-status')).toHaveTextContent('Trial');
      expect(screen.getByTestId('button-open-billing-portal')).toBeInTheDocument();
    });
  });

  it('opens billing portal when trial is active', async () => {
    mockBillingService.getBillingStatus.mockResolvedValue({
      ...inactiveStatus,
      trialStatus: 'trialing',
      trialEndsAt: '2026-03-22T00:00:00Z',
    });

    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { href: '' };

    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getByTestId('button-open-billing-portal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('button-open-billing-portal'));

    await waitFor(() => {
      expect(mockBillingService.createCustomerPortalSession).toHaveBeenCalledTimes(1);
      expect(window.location.href).toBe('https://billing.stripe.com/session/test');
    });

    (window as any).location = originalLocation;
  });

  it('shows active status for active subscriptions', async () => {
    mockBillingService.getBillingStatus.mockResolvedValue({
      ...inactiveStatus,
      hasActiveSubscription: true,
      trialStatus: 'active',
      billingCycle: 'monthly',
      nextBillingDate: '2026-03-22T00:00:00Z',
    });

    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getByTestId('badge-subscription-status')).toHaveTextContent('Active');
      expect(screen.getByText(/Next billing date:/)).toBeInTheDocument();
    });
  });

  it('shows locked state when account is locked', async () => {
    mockBillingService.getBillingStatus.mockResolvedValue({
      ...inactiveStatus,
      accountLocked: true,
      trialStatus: 'expired',
    });

    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getByTestId('badge-subscription-status')).toHaveTextContent('Locked');
    });
  });

  it('shows error state when loading billing status fails', async () => {
    mockBillingService.getBillingStatus.mockRejectedValueOnce(new Error('API Error'));

    render(<BillingPage />);

    await waitFor(() => {
      expect(screen.getByTestId('error-billing')).toBeInTheDocument();
      expect(ErrorHandler.showErrorToast).toHaveBeenCalled();
    });
  });
});
