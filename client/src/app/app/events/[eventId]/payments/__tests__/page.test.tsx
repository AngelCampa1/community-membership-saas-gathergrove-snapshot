import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventPaymentsPage from '../page';
import { useAuth } from '@/hooks/useAuth';
import { eventService } from '@/services/eventService';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/services/eventService');
jest.mock('@/lib/logger');

const mockPush = jest.fn();
const mockUseRouter = jest.fn();
const mockUseParams = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
  useParams: () => mockUseParams(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowLeft: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="arrow-left-icon"><path /></svg>
  ),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, className, 'data-testid': testId }: any) => (
    <button onClick={onClick} data-variant={variant} className={className} data-testid={testId}>
      {children}
    </button>
  ),
}));

// Mock EventPaymentManagement component
jest.mock('@/components/events/EventPaymentManagement', () => ({
  EventPaymentManagement: () => (
    <div data-testid="event-payment-management">Event Payment Management Component</div>
  ),
}));

const mockAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockEventService = eventService as jest.Mocked<typeof eventService>;
const mockLogger = logger as jest.Mocked<typeof logger>;

const mockEvent = {
  id: 123,
  name: 'Test Event',
  description: 'Test event description',
  eventDateTime: '2099-03-15T18:00:00Z',
  location: 'Test Location',
  capacity: 100,
  registeredCount: 50,
  waitlistCount: 0,
  isFree: false,
  price: 25.00,
  clubId: 1,
  clubName: 'Test Club',
};

describe('EventPaymentsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });
    mockUseParams.mockReturnValue({
      eventId: '123',
      clubId: '1',
    });
    mockAuth.mockReturnValue({
      user: { id: 1, clubId: 1, role: 'Admin' },
      loading: false,
    } as any);
    mockLogger.error = jest.fn();
  });

  describe('Loading State', () => {
    it('should render loading state initially', () => {
      mockEventService.getEventById.mockReturnValue(new Promise(() => {}));

      render(<EventPaymentsPage />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should have container class during loading', () => {
      mockEventService.getEventById.mockReturnValue(new Promise(() => {}));

      const { container } = render(<EventPaymentsPage />);

      const containerDiv = container.querySelector('.container');
      expect(containerDiv).toBeInTheDocument();
    });
  });

  describe('Event Fetching', () => {
    it('should fetch event by id', async () => {
      mockEventService.getEventById.mockResolvedValue(mockEvent as any);

      render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(mockEventService.getEventById).toHaveBeenCalledWith(1, 123);
      });
    });

    it('should use clubId from params', async () => {
      mockUseParams.mockReturnValue({
        eventId: '456',
        clubId: '789',
      });
      mockEventService.getEventById.mockResolvedValue(mockEvent as any);

      render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(mockEventService.getEventById).toHaveBeenCalledWith(789, 456);
      });
    });

    it('should use clubId from user if not in params', async () => {
      mockUseParams.mockReturnValue({
        eventId: '456',
      });
      mockAuth.mockReturnValue({
        user: { id: 1, clubId: 999, role: 'Admin' },
        loading: false,
      } as any);
      mockEventService.getEventById.mockResolvedValue(mockEvent as any);

      render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(mockEventService.getEventById).toHaveBeenCalledWith(999, 456);
      });
    });

    it('should handle fetch error', async () => {
      const error = new Error('Network error');
      mockEventService.getEventById.mockRejectedValue(error);

      render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          'events',
          'Error fetching event for payments page',
          expect.objectContaining({ error, clubId: 1, eventId: 123 })
        );
      });
    });
  });

  describe('Header', () => {
    beforeEach(() => {
      mockEventService.getEventById.mockResolvedValue(mockEvent as any);
    });

    it('should render event name in heading', async () => {
      render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Event - Payment Management')).toBeInTheDocument();
      });
    });

    it('should render default event name if event not loaded', async () => {
      mockEventService.getEventById.mockResolvedValue(null as any);

      render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Event - Payment Management')).toBeInTheDocument();
      });
    });

    it('should render description text', async () => {
      render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText(/View and manage event payments/i)).toBeInTheDocument();
      });
    });

    it('should mention refunds capability', async () => {
      render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText(/issue refunds/i)).toBeInTheDocument();
      });
    });

    it('should mention manual payments capability', async () => {
      render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText(/record manual payments/i)).toBeInTheDocument();
      });
    });
  });

  describe('Back Button', () => {
    beforeEach(() => {
      mockEventService.getEventById.mockResolvedValue(mockEvent as any);
    });

    it('should render back button', async () => {
      render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('button-back')).toBeInTheDocument();
      });
    });

    it('should render ArrowLeft icon', async () => {
      render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
      });
    });

    it('should render "Back to Event" text', async () => {
      render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Back to Event')).toBeInTheDocument();
      });
    });

    it('should navigate to event details on click', async () => {
      const user = userEvent.setup();
      render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('button-back')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('button-back'));

      expect(mockPush).toHaveBeenCalledWith('/app/events/123');
    });

    it('should have outline variant', async () => {
      render(<EventPaymentsPage />);

      await waitFor(() => {
        const button = screen.getByTestId('button-back');
        expect(button).toHaveAttribute('data-variant', 'outline');
      });
    });
  });

  describe('EventPaymentManagement Component', () => {
    beforeEach(() => {
      mockEventService.getEventById.mockResolvedValue(mockEvent as any);
    });

    it('should render EventPaymentManagement component', async () => {
      render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-payment-management')).toBeInTheDocument();
      });
    });

    it('should render after loading completes', async () => {
      render(<EventPaymentsPage />);

      expect(screen.queryByTestId('event-payment-management')).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('event-payment-management')).toBeInTheDocument();
      });
    });
  });

  describe('Layout', () => {
    beforeEach(() => {
      mockEventService.getEventById.mockResolvedValue(mockEvent as any);
    });

    it('should have container class', async () => {
      const { container } = render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-payment-management')).toBeInTheDocument();
      });

      const containerDiv = container.querySelector('.container');
      expect(containerDiv).toBeInTheDocument();
    });

    it('should have mx-auto class for centering', async () => {
      const { container } = render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-payment-management')).toBeInTheDocument();
      });

      const containerDiv = container.querySelector('.mx-auto');
      expect(containerDiv).toBeInTheDocument();
    });

    it('should have padding', async () => {
      const { container } = render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-payment-management')).toBeInTheDocument();
      });

      const containerDiv = container.querySelector('.p-6');
      expect(containerDiv).toBeInTheDocument();
    });
  });

  describe('Export', () => {
    it('should export default function', () => {
      expect(EventPaymentsPage).toBeDefined();
      expect(typeof EventPaymentsPage).toBe('function');
    });
  });

  describe('Component Type', () => {
    it('should be a functional component', () => {
      const component = <EventPaymentsPage />;
      expect(typeof component.type).toBe('function');
    });

    it('should render without errors', () => {
      mockEventService.getEventById.mockResolvedValue(mockEvent as any);
      expect(() => render(<EventPaymentsPage />)).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should integrate with useAuth', async () => {
      mockEventService.getEventById.mockResolvedValue(mockEvent as any);

      render(<EventPaymentsPage />);

      expect(mockAuth).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByTestId('event-payment-management')).toBeInTheDocument();
      });
    });

    it('should integrate with router', async () => {
      mockEventService.getEventById.mockResolvedValue(mockEvent as any);

      render(<EventPaymentsPage />);

      expect(mockUseRouter).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByTestId('event-payment-management')).toBeInTheDocument();
      });
    });

    it('should integrate with event service', async () => {
      mockEventService.getEventById.mockResolvedValue(mockEvent as any);

      render(<EventPaymentsPage />);

      expect(mockEventService.getEventById).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByTestId('event-payment-management')).toBeInTheDocument();
      });
    });

    it('should handle complete page load flow', async () => {
      mockEventService.getEventById.mockResolvedValue(mockEvent as any);

      render(<EventPaymentsPage />);

      // Loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Loaded state
      await waitFor(() => {
        expect(screen.getByText('Test Event - Payment Management')).toBeInTheDocument();
      });

      expect(screen.getByTestId('button-back')).toBeInTheDocument();
      expect(screen.getByTestId('event-payment-management')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing eventId', () => {
      mockUseParams.mockReturnValue({});

      render(<EventPaymentsPage />);

      // Component should not call getEventById if eventId is 0 (falsy)
      expect(mockEventService.getEventById).not.toHaveBeenCalled();
    });

    it('should handle missing clubId', () => {
      mockUseParams.mockReturnValue({ eventId: '123' });
      mockAuth.mockReturnValue({
        user: null,
        loading: false,
      } as any);

      render(<EventPaymentsPage />);

      // Component should not call getEventById if clubId is 0 (falsy)
      expect(mockEventService.getEventById).not.toHaveBeenCalled();
    });

    it('should render consistently', async () => {
      mockEventService.getEventById.mockResolvedValue(mockEvent as any);

      const { container: container1 } = render(<EventPaymentsPage />);
      const { container: container2 } = render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Test Event - Payment Management').length).toBeGreaterThan(0);
      });

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it('should handle multiple renders', async () => {
      mockEventService.getEventById.mockResolvedValue(mockEvent as any);

      const { rerender } = render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Event - Payment Management')).toBeInTheDocument();
      });

      rerender(<EventPaymentsPage />);

      expect(screen.getByText('Test Event - Payment Management')).toBeInTheDocument();
    });
  });

  describe('Navigation Context', () => {
    beforeEach(() => {
      mockEventService.getEventById.mockResolvedValue(mockEvent as any);
    });

    it('should preserve eventId in navigation', async () => {
      const user = userEvent.setup();
      render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('button-back')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('button-back'));

      expect(mockPush).toHaveBeenCalledWith('/app/events/123');
    });

    it('should navigate to correct event page', async () => {
      const user = userEvent.setup();
      mockUseParams.mockReturnValue({
        eventId: '999',
        clubId: '1',
      });

      render(<EventPaymentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('button-back')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('button-back'));

      expect(mockPush).toHaveBeenCalledWith('/app/events/999');
    });
  });
});
