import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MemberEventsPage from '../page';
import { eventService } from '@/services/eventService';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/services/eventService');
jest.mock('@/hooks/useAuth');
jest.mock('@/lib/errorHandler');
jest.mock('@/lib/logger');

const mockPush = jest.fn();
const mockUseRouter = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
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
  CalendarDays: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="calendar-days-icon"><path /></svg>
  ),
  RefreshCw: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="refresh-icon"><path /></svg>
  ),
  AlertCircle: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="alert-circle-icon"><path /></svg>
  ),
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, onClick, ...props }: any) => (
    <div className={className} onClick={onClick} {...props}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
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
  Button: ({ children, onClick, disabled, variant, className }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} className={className}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-variant={variant} className={className}>{children}</span>
  ),
}));

const mockEventService = eventService as jest.Mocked<typeof eventService>;
const mockAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('MemberEventsPage', () => {
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
  });

  describe('Loading State', () => {
    it('should render loading state initially', () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockReturnValue(new Promise(() => {}));

      render(<MemberEventsPage />);

      expect(screen.getByText('Loading events...')).toBeInTheDocument();
    });

    it('should render loading spinner', () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockReturnValue(new Promise(() => {}));

      const { container } = render(<MemberEventsPage />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no events', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue([]);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('No Upcoming Events')).toBeInTheDocument();
      });
    });

    it('should render CalendarDays icon in empty state', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue([]);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('calendar-days-icon')).toBeInTheDocument();
      });
    });

    it('should show empty state message', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue([]);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByText(/There are currently no upcoming events/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should render error state on failure', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockRejectedValue(new Error('Failed to load'));

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Unable to Load Events')).toBeInTheDocument();
      });
    });

    it('should render AlertCircle icon in error state', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockRejectedValue(new Error('Failed to load'));

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      });
    });

    it('should show error message', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockRejectedValue(new Error('Network error'));

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should render Try Again button', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockRejectedValue(new Error('Failed'));

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should retry loading on Try Again click', async () => {
      const user = userEvent.setup();
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce([]);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(mockEventService.getEventsByClub).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Events List', () => {
    const mockEvents = [
      {
        id: 1,
        name: 'Test Event 1',
        description: 'Test description',
        eventDateTime: '2025-03-15T18:00:00Z',
        location: 'Test Location 1',
        attendeeCount: 10,
        totalRsvpCount: 12,
      },
      {
        id: 2,
        name: 'Test Event 2',
        description: '<p>HTML description</p>',
        eventDateTime: '2025-04-20T19:30:00Z',
        location: 'Test Location 2',
        attendeeCount: 5,
        totalRsvpCount: 8,
      },
    ];

    it('should render events list', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue(mockEvents as any);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Event 1')).toBeInTheDocument();
        expect(screen.getByText('Test Event 2')).toBeInTheDocument();
      });
    });

    it('should render event names', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue(mockEvents as any);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Event 1')).toBeInTheDocument();
      });
    });

    it('should render event locations', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue(mockEvents as any);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Location 1')).toBeInTheDocument();
        expect(screen.getByText('Test Location 2')).toBeInTheDocument();
      });
    });

    it('should render attendee counts', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue(mockEvents as any);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('10 attending')).toBeInTheDocument();
        expect(screen.getByText('5 attending')).toBeInTheDocument();
      });
    });

    it('should render RSVP counts in badges', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue(mockEvents as any);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('12 RSVPs')).toBeInTheDocument();
        expect(screen.getByText('8 RSVPs')).toBeInTheDocument();
      });
    });

    it('should render event descriptions', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue(mockEvents as any);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test description')).toBeInTheDocument();
      });
    });

    it('should strip HTML from descriptions', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue(mockEvents as any);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('HTML description')).toBeInTheDocument();
      });
    });

    it('should navigate to event details on card click', async () => {
      const user = userEvent.setup();
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue(mockEvents as any);

      const { container } = render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Event 1')).toBeInTheDocument();
      });

      const eventCard = container.querySelector('[data-testid="event-card-1"]');
      expect(eventCard).toBeInTheDocument();

      if (eventCard) {
        await user.click(eventCard);
        expect(mockPush).toHaveBeenCalledWith('/app/events/1');
      }
    });
  });

  describe('Page Header', () => {
    it('should render page title', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue([]);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Events')).toBeInTheDocument();
      });
    });

    it('should render page description', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue([]);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Upcoming events in your club')).toBeInTheDocument();
      });
    });

    it('should render Refresh button', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue([]);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
    });

    it('should call refresh on Refresh button click', async () => {
      const user = userEvent.setup();
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue([]);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Refresh'));

      expect(mockEventService.getEventsByClub).toHaveBeenCalledTimes(2);
    });
  });

  describe('Icons', () => {
    it('should render Calendar icons', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue([
        {
          id: 1,
          name: 'Test',
          eventDateTime: '2025-03-15T18:00:00Z',
          location: 'Test',
          attendeeCount: 10,
          totalRsvpCount: 12,
        },
      ] as any);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('calendar-icon').length).toBeGreaterThan(0);
      });
    });

    it('should render Clock icons', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue([
        {
          id: 1,
          name: 'Test',
          eventDateTime: '2025-03-15T18:00:00Z',
          location: 'Test',
          attendeeCount: 10,
          totalRsvpCount: 12,
        },
      ] as any);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
      });
    });

    it('should render MapPin icons', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue([
        {
          id: 1,
          name: 'Test',
          eventDateTime: '2025-03-15T18:00:00Z',
          location: 'Test',
          attendeeCount: 10,
          totalRsvpCount: 12,
        },
      ] as any);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument();
      });
    });

    it('should render Users icons', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue([
        {
          id: 1,
          name: 'Test',
          eventDateTime: '2025-03-15T18:00:00Z',
          location: 'Test',
          attendeeCount: 10,
          totalRsvpCount: 12,
        },
      ] as any);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('users-icon')).toBeInTheDocument();
      });
    });

    it('should render Refresh icon', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue([]);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId('refresh-icon').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Export', () => {
    it('should export default function', () => {
      expect(MemberEventsPage).toBeDefined();
      expect(typeof MemberEventsPage).toBe('function');
    });
  });

  describe('Component Type', () => {
    it('should be a functional component', () => {
      const component = <MemberEventsPage />;
      expect(typeof component.type).toBe('function');
    });
  });

  describe('Integration', () => {
    it('should integrate with eventService', async () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue([]);

      render(<MemberEventsPage />);

      await waitFor(() => {
        expect(mockEventService.getEventsByClub).toHaveBeenCalledWith(1, 'upcoming');
      });
    });

    it('should integrate with useAuth', () => {
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue([]);

      render(<MemberEventsPage />);

      expect(mockAuth).toHaveBeenCalled();
    });

    it('should integrate with router', async () => {
      const user = userEvent.setup();
      mockAuth.mockReturnValue({
        user: { clubId: 1, memberId: 1, role: 'Member' },
        loading: false,
      } as any);

      mockEventService.getEventsByClub.mockResolvedValue([
        {
          id: 1,
          name: 'Test',
          eventDateTime: '2025-03-15T18:00:00Z',
          location: 'Test',
        },
      ] as any);

      const { container } = render(<MemberEventsPage />);

      await waitFor(() => {
        const testElements = screen.getAllByText('Test');
        expect(testElements.length).toBeGreaterThan(0);
      });

      const eventCard = container.querySelector('[data-testid="event-card-1"]');
      if (eventCard) {
        await user.click(eventCard);
        expect(mockPush).toHaveBeenCalled();
      }
    });
  });
});
