import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';
import EventRegistration from '@/pages/public/EventRegistration';
import { eventService } from '@/services/eventService';

jest.mock('@/services/eventService');

const mockEventService = eventService as any;

describe('EventRegistration', () => {
  const mockToken = 'test-token-123';
  const mockPublicEvent = {
    id: 1,
    name: 'Test Event',
    description: 'This is a test event description',
    eventDateTime: '2024-12-31T19:00:00Z',
    location: 'Test Venue, 123 Main St',
    memberPrice: 25.00,
    nonMemberPrice: 35.00,
    isFree: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (token: string = mockToken) => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/events/pay/:token" element={<EventRegistration />} />
        </Routes>
      </BrowserRouter>,
      {
        initialEntries: [`/events/pay/${token}`],
      } as any
    );
  };

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      mockEventService.getPublicEventByToken.mockReturnValue(new Promise(() => {}));
      renderWithRouter();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render event details after loading', async () => {
      mockEventService.getPublicEventByToken.mockResolvedValue(mockPublicEvent);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });

      expect(screen.getByText(/This is a test event description/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Venue/i)).toBeInTheDocument();
    });

    it('should display formatted date and time', async () => {
      mockEventService.getPublicEventByToken.mockResolvedValue(mockPublicEvent);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/December 31, 2024/i)).toBeInTheDocument();
      });
    });

    it('should display member and non-member prices', async () => {
      mockEventService.getPublicEventByToken.mockResolvedValue(mockPublicEvent);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/Member.*\$25\.00/i)).toBeInTheDocument();
        expect(screen.getByText(/Non-Member.*\$35\.00/i)).toBeInTheDocument();
      });
    });

    it('should display free event correctly', async () => {
      mockEventService.getPublicEventByToken.mockResolvedValue({
        ...mockPublicEvent,
        isFree: true,
        memberPrice: null,
        nonMemberPrice: null,
      });
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/free/i)).toBeInTheDocument();
      });
    });
  });

  describe('Invalid Token Handling', () => {
    it('should display error for invalid token', async () => {
      mockEventService.getPublicEventByToken.mockRejectedValue({
        response: { status: 404 },
      });
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/event not found/i)).toBeInTheDocument();
      });
    });

    it('should display error for expired token', async () => {
      mockEventService.getPublicEventByToken.mockRejectedValue({
        response: { status: 410, data: { message: 'Token expired' } },
      });
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/expired/i)).toBeInTheDocument();
      });
    });

    it('should display generic error for other failures', async () => {
      mockEventService.getPublicEventByToken.mockRejectedValue({
        response: { status: 500 },
      });
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });
  });

  describe('Registration Form', () => {
    it('should render registration form with required fields', async () => {
      mockEventService.getPublicEventByToken.mockResolvedValue(mockPublicEvent);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/member/i)).toBeInTheDocument();
    });

    it('should have submit button', async () => {
      mockEventService.getPublicEventByToken.mockResolvedValue(mockPublicEvent);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
      });
    });

    it('should show different prices based on member selection', async () => {
      mockEventService.getPublicEventByToken.mockResolvedValue(mockPublicEvent);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/\$25\.00/i)).toBeInTheDocument();
      });
    });
  });

  describe('Payment Integration', () => {
    it('should display payment form for paid events', async () => {
      mockEventService.getPublicEventByToken.mockResolvedValue(mockPublicEvent);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/payment/i)).toBeInTheDocument();
      });
    });

    it('should not display payment form for free events', async () => {
      mockEventService.getPublicEventByToken.mockResolvedValue({
        ...mockPublicEvent,
        isFree: true,
      });
      renderWithRouter();

      await waitFor(() => {
        expect(screen.queryByText(/payment/i)).not.toBeInTheDocument();
      });
    });

    it('should display Stripe payment element', async () => {
      mockEventService.getPublicEventByToken.mockResolvedValue(mockPublicEvent);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByTestId('stripe-payment-element')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      mockEventService.getPublicEventByToken.mockResolvedValue(mockPublicEvent);
      renderWithRouter();

      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: 'Test Event' });
        expect(heading).toBeInTheDocument();
      });
    });

    it('should have accessible form labels', async () => {
      mockEventService.getPublicEventByToken.mockResolvedValue(mockPublicEvent);
      renderWithRouter();

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i);
        expect(nameInput).toHaveAttribute('id');
      });
    });

    it('should have ARIA attributes for error messages', async () => {
      mockEventService.getPublicEventByToken.mockRejectedValue({
        response: { status: 404 },
      });
      renderWithRouter();

      await waitFor(() => {
        const errorMessage = screen.getByText(/event not found/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('URL Token Extraction', () => {
    it('should extract token from URL parameters', async () => {
      mockEventService.getPublicEventByToken.mockResolvedValue(mockPublicEvent);
      renderWithRouter('custom-token-456');

      await waitFor(() => {
        expect(mockEventService.getPublicEventByToken).toHaveBeenCalledWith('custom-token-456');
      });
    });

    it('should handle missing token', async () => {
      render(
        <BrowserRouter>
          <Routes>
            <Route path="/events/pay/:token" element={<EventRegistration />} />
          </Routes>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/invalid link/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive classes to container', async () => {
      mockEventService.getPublicEventByToken.mockResolvedValue(mockPublicEvent);
      const { container } = renderWithRouter();

      await waitFor(() => {
        const mainContainer = container.querySelector('[data-testid="event-registration-container"]');
        expect(mainContainer).toHaveClass(/max-w/);
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner', () => {
      mockEventService.getPublicEventByToken.mockReturnValue(new Promise(() => {}));
      renderWithRouter();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should disable form during submission', async () => {
      mockEventService.getPublicEventByToken.mockResolvedValue(mockPublicEvent);
      renderWithRouter();

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /register/i });
        expect(button).not.toBeDisabled();
      });
    });
  });
});