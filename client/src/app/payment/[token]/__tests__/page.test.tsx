import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentPage from '../page';
import { paymentService } from '@/services/paymentService';
import { loadStripe } from '@stripe/stripe-js';

// Mock dependencies
jest.mock('next/navigation', () => {
  const mockUseParams = jest.fn();
  return {
    useParams: () => mockUseParams(),
    __setMockParams: (params: any) => mockUseParams.mockReturnValue(params),
  };
});

jest.mock('@/services/paymentService');
jest.mock('@stripe/stripe-js');

// Mock Stripe React components
const mockCreatePaymentMethod = jest.fn();
const mockGetElement = jest.fn();

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
  CardElement: () => <div data-testid="card-element">Card Element</div>,
  useStripe: () => ({
    createPaymentMethod: mockCreatePaymentMethod,
  }),
  useElements: () => ({
    getElement: mockGetElement,
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertCircle: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="alert-circle-icon"><path /></svg>
  ),
  CheckCircle: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="check-circle-icon"><path /></svg>
  ),
  CreditCard: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="credit-card-icon"><path /></svg>
  ),
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardFooter: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 className={className}>{children}</h3>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, className }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={className}
      data-testid="button"
    >
      {children}
    </button>
  ),
}));

const mockPaymentService = paymentService as jest.Mocked<typeof paymentService>;
const mockLoadStripe = loadStripe as jest.MockedFunction<typeof loadStripe>;
const { __setMockParams } = require('next/navigation');

const mockPaymentDetails = {
  isValid: true,
  clubName: 'Test Club',
  memberName: 'John Doe',
  membershipType: 'Premium',
  amount: 99.99,
  description: 'Monthly membership dues',
  stripePublishableKey: 'pk_test_123',
};

describe('PaymentPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __setMockParams({ token: 'test-token-123' });
    mockLoadStripe.mockResolvedValue(null);
    mockGetElement.mockReturnValue({} as any);
  });

  describe('Loading State', () => {
    it('should render loading state initially', () => {
      mockPaymentService.getPaymentPage.mockReturnValue(new Promise(() => {}));

      render(<PaymentPage />);

      expect(screen.getByText('Loading payment details...')).toBeInTheDocument();
    });

    it('should render loading spinner', () => {
      mockPaymentService.getPaymentPage.mockReturnValue(new Promise(() => {}));

      const { container } = render(<PaymentPage />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Payment Details', () => {
    beforeEach(() => {
      mockPaymentService.getPaymentPage.mockResolvedValue(mockPaymentDetails);
    });

    it('should load and display payment details', async () => {
      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Club')).toBeInTheDocument();
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.getByText('Monthly membership dues')).toBeInTheDocument();
    });

    it('should display member information', async () => {
      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Member:')).toBeInTheDocument();
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display membership type', async () => {
      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Membership:')).toBeInTheDocument();
      });

      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('should display amount', async () => {
      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Amount:')).toBeInTheDocument();
      });

      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });

    it('should display description', async () => {
      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Description:')).toBeInTheDocument();
      });

      expect(screen.getByText('Monthly membership dues')).toBeInTheDocument();
    });

    it('should call getPaymentPage with token', async () => {
      render(<PaymentPage />);

      await waitFor(() => {
        expect(mockPaymentService.getPaymentPage).toHaveBeenCalledWith('test-token-123');
      });
    });
  });

  describe('Stripe Integration', () => {
    beforeEach(() => {
      mockPaymentService.getPaymentPage.mockResolvedValue(mockPaymentDetails);
    });

    it('should load Stripe with publishable key', async () => {
      render(<PaymentPage />);

      await waitFor(() => {
        expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_123');
      });
    });

    it('should render Stripe Elements', async () => {
      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
      });
    });

    it('should render CardElement', async () => {
      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByTestId('card-element')).toBeInTheDocument();
      });
    });

    it('should not load Stripe if no publishable key', async () => {
      mockPaymentService.getPaymentPage.mockResolvedValue({
        ...mockPaymentDetails,
        stripePublishableKey: '',
      });

      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Club')).toBeInTheDocument();
      });

      expect(mockLoadStripe).not.toHaveBeenCalled();
    });
  });

  describe('Payment Form', () => {
    beforeEach(() => {
      mockPaymentService.getPaymentPage.mockResolvedValue(mockPaymentDetails);
    });

    it('should render payment button with amount', async () => {
      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Pay $99.99')).toBeInTheDocument();
      });
    });

    it('should render CreditCard icon', async () => {
      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByTestId('credit-card-icon')).toBeInTheDocument();
      });
    });

    it('should render card details label', async () => {
      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Card Details')).toBeInTheDocument();
      });
    });
  });

  describe('Payment Processing', () => {
    beforeEach(() => {
      mockPaymentService.getPaymentPage.mockResolvedValue(mockPaymentDetails);
      mockPaymentService.processPayment.mockResolvedValue({} as any);
      mockCreatePaymentMethod.mockResolvedValue({
        paymentMethod: { id: 'pm_123' },
      });
    });

    it('should process payment on form submit', async () => {
      const user = userEvent.setup();
      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Pay $99.99')).toBeInTheDocument();
      });

      const button = screen.getByText('Pay $99.99');
      await user.click(button);

      await waitFor(() => {
        expect(mockCreatePaymentMethod).toHaveBeenCalled();
      });
    });

    it('should show processing state', async () => {
      const user = userEvent.setup();
      mockCreatePaymentMethod.mockReturnValue(new Promise(() => {}));

      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Pay $99.99')).toBeInTheDocument();
      });

      const button = screen.getByText('Pay $99.99');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Processing...')).toBeInTheDocument();
      });
    });

    it('should call processPayment with correct data', async () => {
      const user = userEvent.setup();
      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Pay $99.99')).toBeInTheDocument();
      });

      const button = screen.getByText('Pay $99.99');
      await user.click(button);

      await waitFor(() => {
        expect(mockPaymentService.processPayment).toHaveBeenCalledWith('test-token-123', {
          paymentMethodId: 'pm_123',
        });
      });
    });
  });

  describe('Payment Success', () => {
    beforeEach(() => {
      mockPaymentService.getPaymentPage.mockResolvedValue(mockPaymentDetails);
      mockPaymentService.processPayment.mockResolvedValue({} as any);
      mockCreatePaymentMethod.mockResolvedValue({
        paymentMethod: { id: 'pm_123' },
      });
    });

    it('should show success message after payment', async () => {
      const user = userEvent.setup();
      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Pay $99.99')).toBeInTheDocument();
      });

      const button = screen.getByText('Pay $99.99');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
      });
    });

    it('should render CheckCircle icon on success', async () => {
      const user = userEvent.setup();
      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Pay $99.99')).toBeInTheDocument();
      });

      const button = screen.getByText('Pay $99.99');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      });
    });

    it('should show confirmation message', async () => {
      const user = userEvent.setup();
      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Pay $99.99')).toBeInTheDocument();
      });

      const button = screen.getByText('Pay $99.99');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/confirmation will be sent to your email/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error States', () => {
    it('should show error if payment details fail to load', async () => {
      mockPaymentService.getPaymentPage.mockRejectedValue(new Error('Network error'));

      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Payment Unavailable')).toBeInTheDocument();
      });

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should show error if payment link is invalid', async () => {
      mockPaymentService.getPaymentPage.mockResolvedValue({
        ...mockPaymentDetails,
        isValid: false,
      });

      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Payment Link Expired')).toBeInTheDocument();
      });
    });

    it('should render AlertCircle icon on error', async () => {
      mockPaymentService.getPaymentPage.mockRejectedValue(new Error('Test error'));

      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      });
    });

    it('should show payment processing error', async () => {
      const user = userEvent.setup();
      mockPaymentService.getPaymentPage.mockResolvedValue(mockPaymentDetails);
      mockCreatePaymentMethod.mockResolvedValue({
        error: { message: 'Card declined' },
      });

      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Pay $99.99')).toBeInTheDocument();
      });

      const button = screen.getByText('Pay $99.99');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Payment Unavailable')).toBeInTheDocument();
      });

      expect(screen.getByText('Card declined')).toBeInTheDocument();
    });

    it('should handle missing card element error', async () => {
      const user = userEvent.setup();
      mockPaymentService.getPaymentPage.mockResolvedValue(mockPaymentDetails);
      mockGetElement.mockReturnValue(null);

      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Pay $99.99')).toBeInTheDocument();
      });

      const button = screen.getByText('Pay $99.99');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Payment Unavailable')).toBeInTheDocument();
      });

      expect(screen.getByText('Card element not found')).toBeInTheDocument();
    });
  });

  describe('Security', () => {
    it('should display Stripe security message', async () => {
      mockPaymentService.getPaymentPage.mockResolvedValue(mockPaymentDetails);

      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText(/secure payment processed by Stripe/i)).toBeInTheDocument();
      });
    });

    it('should mention card details are not stored', async () => {
      mockPaymentService.getPaymentPage.mockResolvedValue(mockPaymentDetails);

      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText(/card details are never stored/i)).toBeInTheDocument();
      });
    });
  });

  describe('Layout', () => {
    beforeEach(() => {
      mockPaymentService.getPaymentPage.mockResolvedValue(mockPaymentDetails);
    });

    it('should have min-h-screen class', async () => {
      const { container } = render(<PaymentPage />);

      await waitFor(() => {
        const mainDiv = container.querySelector('.min-h-screen');
        expect(mainDiv).toBeInTheDocument();
      });
    });

    it('should render card component', async () => {
      render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByTestId('card')).toBeInTheDocument();
      });
    });
  });

  describe('Export', () => {
    it('should export default function', () => {
      expect(PaymentPage).toBeDefined();
      expect(typeof PaymentPage).toBe('function');
    });
  });

  describe('Component Type', () => {
    it('should be a functional component', () => {
      const component = <PaymentPage />;
      expect(typeof component.type).toBe('function');
    });
  });

  describe('Integration', () => {
    it('should integrate payment service and Stripe', async () => {
      mockPaymentService.getPaymentPage.mockResolvedValue(mockPaymentDetails);

      render(<PaymentPage />);

      await waitFor(() => {
        expect(mockPaymentService.getPaymentPage).toHaveBeenCalled();
        expect(mockLoadStripe).toHaveBeenCalled();
      });
    });

    it('should handle complete payment flow', async () => {
      const user = userEvent.setup();
      mockPaymentService.getPaymentPage.mockResolvedValue(mockPaymentDetails);
      mockPaymentService.processPayment.mockResolvedValue({} as any);
      mockCreatePaymentMethod.mockResolvedValue({
        paymentMethod: { id: 'pm_123' },
      });

      render(<PaymentPage />);

      // Wait for loading
      await waitFor(() => {
        expect(screen.getByText('Test Club')).toBeInTheDocument();
      });

      // Submit payment
      const button = screen.getByText('Pay $99.99');
      await user.click(button);

      // Verify success
      await waitFor(() => {
        expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing token', () => {
      __setMockParams({});

      render(<PaymentPage />);

      expect(mockPaymentService.getPaymentPage).not.toHaveBeenCalled();
    });

    it('should render consistently', async () => {
      mockPaymentService.getPaymentPage.mockResolvedValue(mockPaymentDetails);

      const { container: container1 } = render(<PaymentPage />);
      const { container: container2 } = render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Test Club').length).toBeGreaterThan(0);
      });

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it('should handle multiple renders', async () => {
      mockPaymentService.getPaymentPage.mockResolvedValue(mockPaymentDetails);

      const { rerender } = render(<PaymentPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Club')).toBeInTheDocument();
      });

      rerender(<PaymentPage />);

      expect(screen.getByText('Test Club')).toBeInTheDocument();
    });
  });
});
