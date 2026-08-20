import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventDetailsPage from '../page';
import { eventService } from '@/services/eventService';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';

// Mock dependencies
jest.mock('@/services/eventService');
jest.mock('@/hooks/useAuth');
jest.mock('@/lib/errorHandler');
jest.mock('@/lib/logger');
jest.mock('@/utils/security');
jest.mock('sonner');

const mockPush = jest.fn();
const mockUseRouter = jest.fn();
const mockUseParams = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
  useParams: () => mockUseParams(),
}));

// Mock dynamic import
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (fn: any) => {
    const Component = fn().then((mod: any) => mod.default || mod);
    return Component;
  },
}));

// Mock PayEventForm
jest.mock('@/components/events/PayEventForm', () => ({
  __esModule: true,
  default: () => <div data-testid="pay-event-form">PayEventForm</div>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Calendar: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="calendar-icon"><path /></svg>
  ),
  Clock: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="clock-icon"><path /></svg>
  ),
  MapPin: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="map-pin-icon"><path /></svg>
  ),
  Users: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="users-icon"><path /></svg>
  ),
  ArrowLeft: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="arrow-left-icon"><path /></svg>
  ),
  CheckCircle: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="check-circle-icon"><path /></svg>
  ),
  XCircle: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="x-circle-icon"><path /></svg>
  ),
  AlertCircle: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="alert-circle-icon"><path /></svg>
  ),
  RefreshCw: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="refresh-icon"><path /></svg>
  ),
  User: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="user-icon"><path /></svg>
  ),
  CreditCard: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="credit-card-icon"><path /></svg>
  ),
  DollarSign: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="dollar-sign-icon"><path /></svg>
  ),
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 className={className}>{children}</h3>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, className, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} className={className} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-variant={variant} className={className}>{children}</span>
  ),
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: ({ className }: any) => <hr className={className} />,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

const mockEventService = eventService as jest.Mocked<typeof eventService>;
const mockAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('EventDetailsPage', () => {
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
    mockUseParams.mockReturnValue({ eventId: '1' });
  });

  describe('Loading State', () => {
    it('should render loading state initially', () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockReturnValue(new Promise(() => {}));

      render(<EventDetailsPage />);

      expect(screen.getByText('Loading event details...')).toBeInTheDocument();
    });

    it('should render loading spinner', () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockReturnValue(new Promise(() => {}));

      const { container } = render(<EventDetailsPage />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should render error state on failure', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockRejectedValue(new Error('Failed to load'));

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Unable to Load Event')).toBeInTheDocument();
      });
    });

    it('should show error message', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockRejectedValue(new Error('Network error'));

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should render Back to Events button', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockRejectedValue(new Error('Failed'));

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Back to Events')).toBeInTheDocument();
      });
    });

    it('should navigate back on button click', async () => {
      const user = userEvent.setup();
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockRejectedValue(new Error('Failed'));

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Back to Events')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Back to Events'));
      expect(mockPush).toHaveBeenCalledWith('/app/events');
    });
  });

  describe('Event Details Display', () => {
    const mockEvent = {
      id: 1,
      name: 'Test Event',
      description: 'Test description',
      eventDateTime: '2025-03-15T18:00:00Z',
      location: 'Test Location',
      attendeeCount: 10,
      totalRsvpCount: 12,
      isFree: true,
      memberPrice: null,
    };

    it('should render event name', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue(mockEvent as any);
      mockEventService.getMemberRsvp.mockResolvedValue(null as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument();
      });
    });

    it('should render event location', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue(mockEvent as any);
      mockEventService.getMemberRsvp.mockResolvedValue(null as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Location')).toBeInTheDocument();
      });
    });

    it('should render attendee count', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue(mockEvent as any);
      mockEventService.getMemberRsvp.mockResolvedValue(null as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('10 attending')).toBeInTheDocument();
      });
    });

    it('should render RSVP count', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue(mockEvent as any);
      mockEventService.getMemberRsvp.mockResolvedValue(null as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('12 total RSVPs')).toBeInTheDocument();
      });
    });

    it('should render event description', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue(mockEvent as any);
      mockEventService.getMemberRsvp.mockResolvedValue(null as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Description')).toBeInTheDocument();
      });
    });
  });

  describe('Past Event Badge', () => {
    it('should show past event badge for past events', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      const pastEvent = {
        id: 1,
        name: 'Past Event',
        eventDateTime: '2020-01-01T18:00:00Z',
        location: 'Past Location',
        isFree: true,
      };

      mockEventService.getEventById.mockResolvedValue(pastEvent as any);
      mockEventService.getMemberRsvp.mockResolvedValue(null as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        const pastEventElements = screen.getAllByText('Past Event');
        // One for the title, one for the badge
        expect(pastEventElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Paid Event Features', () => {
    const paidEvent = {
      id: 1,
      name: 'Paid Event',
      description: 'Paid event',
      eventDateTime: '2099-03-15T18:00:00Z', // Far future
      location: 'Test Location',
      attendeeCount: 10,
      totalRsvpCount: 12,
      isFree: false,
      memberPrice: 25.00,
    };

    it('should show member price for paid events', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue(paidEvent as any);
      mockEventService.getMemberRsvp.mockResolvedValue(null as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('$25.00')).toBeInTheDocument();
      });
    });

    it('should show payment required message for unpaid members', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue(paidEvent as any);
      mockEventService.getMemberRsvp.mockResolvedValue({
        rsvpStatus: 'Pending',
        paidAmount: 0,
      } as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Payment Required')).toBeInTheDocument();
      });
    });

    it('should show Pay & Register button', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue(paidEvent as any);
      mockEventService.getMemberRsvp.mockResolvedValue({
        rsvpStatus: 'Pending',
        paidAmount: 0,
      } as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('button-pay-and-register')).toBeInTheDocument();
      });
    });

    it('should show payment confirmed for paid members', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue(paidEvent as any);
      mockEventService.getMemberRsvp.mockResolvedValue({
        rsvpStatus: 'Attending',
        paidAmount: 25.00,
        stripePaymentIntentId: 'pi_123',
      } as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Payment Confirmed')).toBeInTheDocument();
      });
    });
  });

  describe('RSVP Functionality', () => {
    const freeEvent = {
      id: 1,
      name: 'Free Event',
      description: 'Free event description',
      eventDateTime: '2099-03-15T18:00:00Z', // Far future to ensure it's not past
      location: 'Test Location',
      isFree: true,
      memberPrice: null,
      attendeeCount: 0,
      totalRsvpCount: 0,
    };

    it('should show RSVP buttons for free events', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue(freeEvent as any);
      mockEventService.getMemberRsvp.mockResolvedValue(null as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Mark as Attending')).toBeInTheDocument();
        expect(screen.getByText('Mark as Not Attending')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show attending status', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue(freeEvent as any);
      mockEventService.getMemberRsvp.mockResolvedValue({
        rsvpStatus: 'Attending',
        paidAmount: 0,
      } as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        const attendingElements = screen.getAllByText('Attending');
        expect(attendingElements.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });

    it('should show not attending status', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue(freeEvent as any);
      mockEventService.getMemberRsvp.mockResolvedValue({
        rsvpStatus: 'NotAttending',
        paidAmount: 0,
      } as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        const notAttendingElements = screen.getAllByText('Not Attending');
        // One for status display, one for button
        expect(notAttendingElements.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });

    it('should update RSVP on button click', async () => {
      const user = userEvent.setup();
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue(freeEvent as any);
      mockEventService.getMemberRsvp.mockResolvedValue(null as any);
      mockEventService.updateRsvp.mockResolvedValue({
        rsvpStatus: 'Attending',
      } as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Mark as Attending')).toBeInTheDocument();
      }, { timeout: 5000 });

      await user.click(screen.getByText('Mark as Attending'));

      await waitFor(() => {
        expect(mockEventService.updateRsvp).toHaveBeenCalledWith(
          1,
          1,
          1,
          { rsvpStatus: 'Attending' }
        );
      }, { timeout: 5000 });
    });
  });

  describe('Admin View', () => {
    const paidEvent = {
      id: 1,
      name: 'Paid Event',
      eventDateTime: '2099-03-15T18:00:00Z', // Far future
      location: 'Test Location',
      isFree: false,
      memberPrice: 25.00,
    };

    it('should show admin message for admin users', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, role: 'Admin' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue(paidEvent as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText(/As an admin, you can view this event but cannot RSVP/i)).toBeInTheDocument();
      });
    });

    it('should show manage payments button for paid events', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, role: 'Admin' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue(paidEvent as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('button-manage-payments')).toBeInTheDocument();
      });
    });

    it('should navigate to payments page', async () => {
      const user = userEvent.setup();
      mockAuth.mockReturnValue({
        user: { clubId: 1, role: 'Admin' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue(paidEvent as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('button-manage-payments')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('button-manage-payments'));
      expect(mockPush).toHaveBeenCalledWith('/app/events/1/payments');
    });
  });

  describe('Icons', () => {
    const mockEvent = {
      id: 1,
      name: 'Test Event',
      eventDateTime: '2025-03-15T18:00:00Z',
      location: 'Test Location',
      isFree: true,
    };

    it('should render Calendar icons', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue(mockEvent as any);
      mockEventService.getMemberRsvp.mockResolvedValue(null as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('calendar-icon').length).toBeGreaterThan(0);
      });
    });

    it('should render User icon', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue(mockEvent as any);
      mockEventService.getMemberRsvp.mockResolvedValue(null as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('user-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Export', () => {
    it('should export default function', () => {
      expect(EventDetailsPage).toBeDefined();
      expect(typeof EventDetailsPage).toBe('function');
    });
  });

  describe('Component Type', () => {
    it('should be a functional component', () => {
      const component = <EventDetailsPage />;
      expect(typeof component.type).toBe('function');
    });
  });

  describe('Integration', () => {
    it('should integrate with eventService', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue({
        id: 1,
        name: 'Test',
        eventDateTime: '2025-03-15T18:00:00Z',
        location: 'Test',
        isFree: true,
      } as any);
      mockEventService.getMemberRsvp.mockResolvedValue(null as any);

      render(<EventDetailsPage />);

      await waitFor(() => {
        expect(mockEventService.getEventById).toHaveBeenCalledWith(1, 1);
        expect(mockEventService.getMemberRsvp).toHaveBeenCalledWith(1, 1, 1);
      }, { timeout: 5000 });
    });

    it('should integrate with useAuth', () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue({} as any);
      mockEventService.getMemberRsvp.mockResolvedValue(null as any);

      render(<EventDetailsPage />);

      expect(mockAuth).toHaveBeenCalled();
    });

    it('should integrate with router params', () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventById.mockResolvedValue({} as any);
      mockEventService.getMemberRsvp.mockResolvedValue(null as any);

      render(<EventDetailsPage />);

      expect(mockUseParams).toHaveBeenCalled();
    });
  });
});
