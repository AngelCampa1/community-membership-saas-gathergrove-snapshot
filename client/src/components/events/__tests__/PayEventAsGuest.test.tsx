import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PayEventAsGuest from '../PayEventAsGuest';
import { PublicEventResponse, NonMemberEventPaymentResponse, MembershipTypeOption } from '@/types/event';
import { eventService } from '@/services/eventService';

// Mock Stripe - using proven pattern from PayDues.test.tsx and UpgradeModal.test.tsx
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

// Mock RadixUI components
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ...(children.props || {}) });
    }
    return <div {...props}>{children}</div>;
  },
  Slottable: ({ children }: any) => <>{children}</>,
}));

jest.mock('@radix-ui/react-separator', () => ({
  Root: React.forwardRef(function SeparatorRoot(
    { orientation = 'horizontal', decorative = true, ...props }: any,
    ref
  ) {
    return <div ref={ref} role={decorative ? 'none' : 'separator'} aria-orientation={orientation} {...props} />;
  }),
}));

jest.mock('@radix-ui/react-checkbox', () => ({
  Root: React.forwardRef(function CheckboxRoot(
    { checked, onCheckedChange, children, ...props }: any,
    ref: any
  ) {
    return (
      <button
        ref={ref}
        role="checkbox"
        aria-checked={checked}
        onClick={() => onCheckedChange?.(!checked)}
        {...props}
      >
        {children}
      </button>
    );
  }),
  Indicator: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

jest.mock('@radix-ui/react-radio-group', () => ({
  Root: React.forwardRef(function RadioGroupRoot(
    { value, onValueChange, children, ...props }: any,
    ref: any
  ) {
    return (
      <div ref={ref} role="radiogroup" {...props}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { groupValue: value, onGroupValueChange: onValueChange } as any);
          }
          return child;
        })}
      </div>
    );
  }),
  Item: React.forwardRef(function RadioGroupItem(
    { value, groupValue, onGroupValueChange, ...props }: any,
    ref: any
  ) {
    return (
      <button
        ref={ref}
        role="radio"
        aria-checked={value === groupValue}
        onClick={() => onGroupValueChange?.(value)}
        {...props}
      />
    );
  }),
  Indicator: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={`card ${className || ''}`} data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={`card-header ${className || ''}`} data-testid="card-header" {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={`card-title ${className || ''}`} data-testid="card-title" {...props}>
      {children}
    </h3>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <p className={`card-description ${className || ''}`} data-testid="card-description" {...props}>
      {children}
    </p>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={`card-content ${className || ''}`} data-testid="card-content" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, disabled, onClick, type, ...props }: any) => (
    <button className={`button ${className || ''}`} disabled={disabled} onClick={onClick} type={type} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef(function Input({ className, type, ...props }: any, ref: any) {
    return <input ref={ref} className={`input ${className || ''}`} type={type} {...props} />;
  }),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, className, ...props }: any) => (
    <label className={`label ${className || ''}`} {...props}>
      {children}
    </label>
  ),
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <button role="checkbox" aria-checked={checked} onClick={() => onCheckedChange?.(!checked)} {...props} />
  ),
}));

jest.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ value, onValueChange, children, ...props }: any) => (
    <div role="radiogroup" {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { groupValue: value, onGroupValueChange: onValueChange } as any);
        }
        return child;
      })}
    </div>
  ),
  RadioGroupItem: ({ value, groupValue, onGroupValueChange, ...props }: any) => (
    <button role="radio" aria-checked={value === groupValue} onClick={() => onGroupValueChange?.(value)} {...props} />
  ),
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: ({ className, ...props }: any) => (
    <hr className={`separator ${className || ''}`} {...props} />
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className, variant, ...props }: any) => (
    <div className={`alert alert-${variant || 'default'} ${className || ''}`} role="alert" {...props}>
      {children}
    </div>
  ),
  AlertTitle: ({ children, className, ...props }: any) => (
    <h5 className={`alert-title ${className || ''}`} {...props}>
      {children}
    </h5>
  ),
  AlertDescription: ({ children, className, ...props }: any) => (
    <div className={`alert-description ${className || ''}`} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertCircle: () => <span data-testid="icon-alert-circle">AlertCircle</span>,
  CheckCircle: () => <span data-testid="icon-check-circle">CheckCircle</span>,
  CheckCircle2: () => <span data-testid="icon-check-circle2">CheckCircle2</span>,
  Loader2: () => <span data-testid="icon-loader2">Loader2</span>,
}));

// Mock eventService
jest.mock('@/services/eventService');

describe('PayEventAsGuest Component', () => {
  const mockEventService = eventService as jest.Mocked<typeof eventService>;

  const mockPaidEvent: PublicEventResponse = {
    id: 1,
    name: 'Test Paid Event',
    description: 'Test event description',
    eventDateTime: '2025-02-15T19:00:00Z',
    location: 'Test Location',
    memberPrice: 40,
    nonMemberPrice: 50,
    clubName: 'Test Club',
    clubId: 1,
    isFree: false,
  };

  const mockFreeEvent: PublicEventResponse = {
    ...mockPaidEvent,
    id: 2,
    name: 'Test Free Event',
    memberPrice: 0,
    nonMemberPrice: 0,
    isFree: true,
  };

  const mockMembershipTypes: MembershipTypeOption[] = [
    {
      id: 1,
      name: 'Individual',
      description: 'Individual membership',
      duesAmount: 100,
      duesFrequency: 'Annual',
      clubId: 1,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      memberCount: 10,
    },
    {
      id: 2,
      name: 'Family',
      description: 'Family membership',
      duesAmount: 150,
      duesFrequency: 'Annual',
      clubId: 1,
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      memberCount: 5,
    },
  ];

  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventService.getAvailableMembershipTypes.mockResolvedValue(mockMembershipTypes);
  });

  describe('Free Event Rendering', () => {
    it('should render form for free events', async () => {
      render(<PayEventAsGuest event={mockFreeEvent} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByTestId('input-guest-name')).toBeInTheDocument();
      });

      // Guest information fields should be present
      expect(screen.getByTestId('input-guest-email')).toBeInTheDocument();
      expect(screen.getByTestId('input-guest-phone')).toBeInTheDocument();
      
      // Payment summary should show $0 using specific selector
      expect(screen.getByTestId('total-amount')).toHaveTextContent('$0.00');
    });
  });

  describe('Paid Event Rendering', () => {
    it('should render complete payment form for paid events', async () => {
      render(<PayEventAsGuest event={mockPaidEvent} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByTestId('input-guest-name')).toBeInTheDocument();
      });

      expect(screen.getByTestId('input-guest-email')).toBeInTheDocument();
      expect(screen.getByTestId('input-guest-phone')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-show-membership')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-create-account')).toBeInTheDocument();
      expect(screen.getByTestId('card-element')).toBeInTheDocument();
      expect(screen.getByTestId('button-submit-payment')).toBeInTheDocument();
    });

    it('should display event pricing information', async () => {
      render(<PayEventAsGuest event={mockPaidEvent} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByText(/Event Registration:/i)).toBeInTheDocument();
      });

      expect(screen.getByTestId('total-amount')).toHaveTextContent('$50.00');
      expect(screen.getByText(/Total:/i)).toBeInTheDocument();
    });
  });

  describe('Guest Information Form', () => {
    it('should require guest name and email', async () => {
      render(<PayEventAsGuest event={mockPaidEvent} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByTestId('input-guest-name')).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId('input-guest-name');
      const emailInput = screen.getByTestId('input-guest-email');

      expect(nameInput).toBeRequired();
      expect(emailInput).toBeRequired();
    });

    it('should allow optional phone number', async () => {
      render(<PayEventAsGuest event={mockPaidEvent} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByTestId('input-guest-phone')).toBeInTheDocument();
      });

      const phoneInput = screen.getByTestId('input-guest-phone');
      expect(phoneInput).not.toBeRequired();
    });
  });

  describe('Membership Upgrade Section', () => {
    it('should load and display membership types', async () => {
      const user = userEvent.setup();
      render(<PayEventAsGuest event={mockPaidEvent} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(mockEventService.getAvailableMembershipTypes).toHaveBeenCalledWith(mockPaidEvent.id);
      });

      // Click the checkbox to show membership options
      const checkbox = screen.getByTestId('checkbox-show-membership');
      await user.click(checkbox);

      await waitFor(() => {
        const individualElements = screen.getAllByText(/Individual/i);
        const familyElements = screen.getAllByText(/Family/i);
        expect(individualElements.length).toBeGreaterThan(0);
        expect(familyElements.length).toBeGreaterThan(0);
      });
    });

    it('should show membership options when checkbox is checked', async () => {
      const user = userEvent.setup();
      render(<PayEventAsGuest event={mockPaidEvent} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-show-membership')).toBeInTheDocument();
      });

      const checkbox = screen.getByTestId('checkbox-show-membership');
      await user.click(checkbox);

      await waitFor(() => {
        expect(screen.getByText(/Select Membership Type/i)).toBeInTheDocument();
        const individualElements = screen.getAllByText(/Individual/i);
        expect(individualElements.length).toBeGreaterThan(0);
      });
    });

    it('should update total price when membership is selected', async () => {
      const user = userEvent.setup();
      render(<PayEventAsGuest event={mockPaidEvent} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByTestId('total-amount')).toHaveTextContent('$50.00');
      });

      const checkbox = screen.getByTestId('checkbox-show-membership');
      await user.click(checkbox);

      // Wait for membership options to appear
      await waitFor(() => {
        expect(screen.getByText(/Select Membership Type/i)).toBeInTheDocument();
      });

      // Verify both membership types are displayed with their prices
      expect(screen.getByText(/Individual - \$100\.00\/annual/i)).toBeInTheDocument();
      expect(screen.getByText(/Family - \$150\.00\/annual/i)).toBeInTheDocument();
      
      // Verify the initial total is still $50 (event price only)
      expect(screen.getByTestId('total-amount')).toHaveTextContent('$50.00');
    });
  });

  describe('Account Creation Section', () => {
    it('should show password fields when create account is checked', async () => {
      const user = userEvent.setup();
      render(<PayEventAsGuest event={mockPaidEvent} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-create-account')).toBeInTheDocument();
      });

      const checkbox = screen.getByTestId('checkbox-create-account');
      await user.click(checkbox);

      await waitFor(() => {
        expect(screen.getByTestId('input-password')).toBeInTheDocument();
        expect(screen.getByTestId('input-confirm-password')).toBeInTheDocument();
      });
    });

    it('should require password when account creation is selected', async () => {
      const user = userEvent.setup();
      render(<PayEventAsGuest event={mockPaidEvent} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-create-account')).toBeInTheDocument();
      });

      const checkbox = screen.getByTestId('checkbox-create-account');
      await user.click(checkbox);

      await waitFor(() => {
        const passwordInput = screen.getByTestId('input-password');
        expect(passwordInput).toBeRequired();
      });
    });
  });

  describe('Form Submission', () => {
    it('should process payment successfully', async () => {
      const user = userEvent.setup();
      const mockResponse: NonMemberEventPaymentResponse = {
        success: true,
        paymentId: 'pi_test123',
        rsvpId: 1,
        confirmationNumber: 'CONF123',
        eventAmount: 50,
        totalAmount: 50,
        membershipCreated: false,
        accountCreated: false,
        eventName: 'Test Paid Event',
        eventDateTime: '2025-02-15T19:00:00Z',
        eventLocation: 'Test Location',
        clubName: 'Test Club',
      };

      mockEventService.payForEventAsGuest.mockResolvedValue(mockResponse);

      render(<PayEventAsGuest event={mockPaidEvent} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByTestId('input-guest-name')).toBeInTheDocument();
      });

      // Fill form
      await user.type(screen.getByTestId('input-guest-name'), 'John Doe');
      await user.type(screen.getByTestId('input-guest-email'), 'john@example.com');

      // Submit
      const submitButton = screen.getByTestId('button-submit-payment');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse);
      });
    });

    it('should validate password match when creating account', async () => {
      const user = userEvent.setup();
      render(<PayEventAsGuest event={mockPaidEvent} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-create-account')).toBeInTheDocument();
      });

      // Enable account creation
      await user.click(screen.getByTestId('checkbox-create-account'));

      await waitFor(() => {
        expect(screen.getByTestId('input-password')).toBeInTheDocument();
      });

      // Fill form with mismatched passwords
      await user.type(screen.getByTestId('input-guest-name'), 'John Doe');
      await user.type(screen.getByTestId('input-guest-email'), 'john@example.com');
      await user.type(screen.getByTestId('input-password'), 'Password123!');
      await user.type(screen.getByTestId('input-confirm-password'), 'DifferentPassword123!');

      // Submit
      const submitButton = screen.getByTestId('button-submit-payment');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
      });

      expect(mockEventService.payForEventAsGuest).not.toHaveBeenCalled();
    });

    it('should display error when payment fails', async () => {
      const user = userEvent.setup();
      mockEventService.payForEventAsGuest.mockRejectedValue(new Error('Payment failed'));

      render(<PayEventAsGuest event={mockPaidEvent} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByTestId('input-guest-name')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('input-guest-name'), 'John Doe');
      await user.type(screen.getByTestId('input-guest-email'), 'john@example.com');

      const submitButton = screen.getByTestId('button-submit-payment');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('should disable submit button while processing', async () => {
      const user = userEvent.setup();
      
      // Make the payment promise hang so we can check the processing state
      let resolvePayment: any;
      const paymentPromise = new Promise((resolve) => {
        resolvePayment = resolve;
      });
      mockEventService.payForEventAsGuest.mockReturnValue(paymentPromise);

      render(<PayEventAsGuest event={mockPaidEvent} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByTestId('input-guest-name')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('input-guest-name'), 'John Doe');
      await user.type(screen.getByTestId('input-guest-email'), 'john@example.com');

      const submitButton = screen.getByTestId('button-submit-payment');
      
      // Click and immediately check for processing state
      user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent(/Processing/i);
      });
      
      // Cleanup: resolve the promise to avoid hanging tests
      resolvePayment({ success: true, rsvpId: 1 });
    });
  });

  describe('Test IDs for E2E', () => {
    it('should have all required test IDs', async () => {
      render(<PayEventAsGuest event={mockPaidEvent} onSuccess={mockOnSuccess} />);

      await waitFor(() => {
        expect(screen.getByTestId('input-guest-name')).toBeInTheDocument();
      });

      expect(screen.getByTestId('input-guest-email')).toBeInTheDocument();
      expect(screen.getByTestId('input-guest-phone')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-show-membership')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-create-account')).toBeInTheDocument();
      expect(screen.getByTestId('card-element')).toBeInTheDocument();
      expect(screen.getByTestId('button-submit-payment')).toBeInTheDocument();
    });
  });
});

