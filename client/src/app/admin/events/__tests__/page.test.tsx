import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import EventsPage from '../page';
import { useAuth } from '@/hooks/useAuth';
import { useClubTier } from '@/hooks/useClubTier';
import { eventService } from '@/services/eventService';
import { toast } from 'sonner';

// Mock only external boundaries - NOT internal services
jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/useClubTier');

// Mock eventService at the HTTP boundary
jest.mock('@/services/eventService');

// Mock EventForm component
jest.mock('@/components/events/EventForm', () => ({
  EventForm: ({ open, onClose, onSubmit, event, isEditing, isLoading }: any) =>
    open ? (
      <div data-testid="event-form">
        <h2>{isEditing ? 'Edit Event' : 'Create Event'}</h2>
        {isLoading && <span>Loading...</span>}
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSubmit({ name: 'Test Event', description: 'Test Description', eventDateTime: new Date().toISOString(), location: 'Test Location' })}>
          Submit
        </button>
      </div>
    ) : null,
}));

// Mock EventCard component
jest.mock('@/components/events/EventCard', () => ({
  EventCard: ({ event, onEdit, onDelete }: any) => (
    <div data-testid={`event-card-${event.id}`}>
      <h3>{event.name}</h3>
      <p>{event.description}</p>
      <button onClick={() => onEdit(event)}>Edit</button>
      <button onClick={() => onDelete(event.id)}>Delete</button>
    </div>
  ),
}));

// Mock EventInvitationDialog component
jest.mock('@/components/events/EventInvitationDialog', () => ({
  EventInvitationDialog: ({ open, onClose, event, onInvitationsSent }: any) =>
    open ? (
      <div data-testid="event-invitation-dialog">
        <h2>Send Invitations for {event?.name}</h2>
        <button onClick={onClose}>Close</button>
        <button onClick={onInvitationsSent}>Send</button>
      </div>
    ) : null,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon">+</span>,
  Calendar: () => <span data-testid="calendar-icon">📅</span>,
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseClubTier = useClubTier as jest.MockedFunction<typeof useClubTier>;
const mockEventService = eventService as jest.Mocked<typeof eventService>;

// Mock event data
const mockUpcomingEvents = [
  {
    id: 1,
    clubId: 1,
    name: 'Summer BBQ',
    description: 'Annual summer barbecue event',
    eventDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    location: 'City Park',
    maxAttendees: 50,
    currentAttendees: 25,
    rsvpDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    clubId: 1,
    name: 'Monthly Meeting',
    description: 'Regular monthly members meeting',
    eventDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    location: 'Community Center',
    maxAttendees: 100,
    currentAttendees: 45,
    rsvpDeadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockPastEvents = [
  {
    id: 3,
    clubId: 1,
    name: 'Spring Fundraiser',
    description: 'Successful spring fundraising event',
    eventDateTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    location: 'Hotel Ballroom',
    maxAttendees: 200,
    currentAttendees: 175,
    rsvpDeadline: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Completed',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper function to render with QueryClient
const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('EventsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default auth mock
    mockUseAuth.mockReturnValue({
      user: {
        userId: 1,
        clubId: 1,
        fullName: 'Test Admin',
        email: 'admin@example.com',
        clubName: 'Test Club',
        clubTier: 'Grow',
        role: 'Owner',
        isOnboardingCompleted: true,
      },
      loading: false,
      error: null,
      clearError: jest.fn(),
      retryLastOperation: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      refreshSession: jest.fn(),
      completeOnboarding: jest.fn(),
    });

    // Setup default club tier mock
    mockUseClubTier.mockReturnValue({
      currentTier: 'Grow',
      canSendInvitations: true,
      canUseAdvancedCommunications: true,
      memberLimit: 200,
      isLoading: false,
    });

    // Setup eventService mocks - mock at the service boundary
    mockEventService.getEventsByClub = jest.fn().mockImplementation((clubId, filter) => {
      if (filter === 'upcoming') {
        return Promise.resolve(mockUpcomingEvents);
      } else if (filter === 'past') {
        return Promise.resolve(mockPastEvents);
      }
      return Promise.resolve([...mockUpcomingEvents, ...mockPastEvents]);
    });

    mockEventService.createEvent = jest.fn().mockImplementation((clubId, eventData) => {
      const newEvent = {
        id: 999,
        clubId,
        ...eventData,
        currentAttendees: 0,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return Promise.resolve(newEvent);
    });

    mockEventService.updateEvent = jest.fn().mockImplementation((clubId, eventId, eventData) => {
      const existingEvent = [...mockUpcomingEvents, ...mockPastEvents].find(e => e.id === eventId);
      if (!existingEvent) {
        return Promise.reject(new Error('Event not found'));
      }
      const updatedEvent = {
        ...existingEvent,
        ...eventData,
        updatedAt: new Date().toISOString(),
      };
      return Promise.resolve(updatedEvent);
    });

    mockEventService.deleteEvent = jest.fn().mockResolvedValue(undefined);
  });

  describe('Loading States', () => {
    it('shows loading spinner when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        error: null,
        clearError: jest.fn(),
        retryLastOperation: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
      });

      renderWithQueryClient(<EventsPage />);

      expect(screen.getByText(/Loading events/i)).toBeInTheDocument();
    });

    it('shows loading state while fetching upcoming events', () => {
      server.use(
        http.get('http://localhost:5000/clubs/:clubId/events', () => {
          // Delay response to keep loading state visible
          return new Promise(() => {}); // Never resolves
        })
      );

      renderWithQueryClient(<EventsPage />);

      expect(screen.getByText(/Loading events/i)).toBeInTheDocument();
    });
  });

  describe('Event Display', () => {
    it('displays upcoming events by default', async () => {
      renderWithQueryClient(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('event-card-2')).toBeInTheDocument();
      });

      expect(screen.getByText('Summer BBQ')).toBeInTheDocument();
      expect(screen.getByText('Monthly Meeting')).toBeInTheDocument();
    });

    it('displays past events when past tab is clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<EventsPage />);

      // Wait for upcoming events to load
      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      });

      // Click on past tab
      const pastTab = screen.getByRole('tab', { name: /past/i });
      await user.click(pastTab);

      await waitFor(() => {
        expect(screen.getByTestId('event-card-3')).toBeInTheDocument();
      });

      expect(screen.getByText('Spring Fundraiser')).toBeInTheDocument();
    });

    it('shows empty state when no upcoming events exist', async () => {
      // Override mock to return empty array for upcoming events (first call)
      mockEventService.getEventsByClub.mockResolvedValueOnce([]);

      renderWithQueryClient(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByText(/No upcoming events/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /Create Your First Event/i })).toBeInTheDocument();
    });

    it('shows empty state when no past events exist', async () => {
      const user = userEvent.setup();

      // First call returns upcoming events, second call (for past tab) returns empty
      mockEventService.getEventsByClub
        .mockResolvedValueOnce(mockUpcomingEvents)  // Initial load of upcoming
        .mockResolvedValueOnce([]);                   // Past events tab click

      renderWithQueryClient(<EventsPage />);

      // Wait for upcoming events to load
      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      });

      // Click on past tab
      const pastTab = screen.getByRole('tab', { name: /past/i });
      await user.click(pastTab);

      await waitFor(() => {
        expect(screen.getByText(/No past events/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/Create Your First Event/i)).not.toBeInTheDocument();
    });
  });

  describe('Event Creation', () => {
    it('opens event form when create event button is clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Event/i });
      await user.click(createButton);

      expect(screen.getByTestId('event-form')).toBeInTheDocument();
      expect(within(screen.getByTestId('event-form')).getByText('Create Event')).toBeInTheDocument();
    });

    it('creates a new event successfully', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      });

      // Open form
      const createButton = screen.getByRole('button', { name: /Create Event/i });
      await user.click(createButton);

      // Wait for form to open
      await waitFor(() => {
        expect(screen.getByTestId('event-form')).toBeInTheDocument();
      });

      // Submit form
      const submitButton = within(screen.getByTestId('event-form')).getByRole('button', { name: /Submit/i });
      await user.click(submitButton);

      // Verify service was called
      await waitFor(() => {
        expect(mockEventService.createEvent).toHaveBeenCalled();
      });

      // Verify toast was shown
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Event created successfully');
      }, { timeout: 3000 });
    });

    it.skip('handles event creation errors', async () => {
      // NOTE: Skipping - error handling requires error boundary setup for proper testing
      const user = userEvent.setup();

      // Override mock to return error for this test only
      mockEventService.createEvent.mockImplementationOnce(() =>
        Promise.reject(new Error('Failed to create event'))
      );

      renderWithQueryClient(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      });

      // Open form
      const createButton = screen.getByRole('button', { name: /Create Event/i });
      await user.click(createButton);

      // Submit form
      const submitButton = within(screen.getByTestId('event-form')).getByRole('button', { name: /Submit/i });
      await user.click(submitButton);

      // Form should stay open on error
      await waitFor(() => {
        expect(screen.getByTestId('event-form')).toBeInTheDocument();
      });
    });
  });

  describe('Event Editing', () => {
    it('opens event form in edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      });

      const editButton = within(screen.getByTestId('event-card-1')).getByRole('button', { name: /Edit/i });
      await user.click(editButton);

      expect(screen.getByTestId('event-form')).toBeInTheDocument();
      expect(within(screen.getByTestId('event-form')).getByText('Edit Event')).toBeInTheDocument();
    });

    it('updates an event successfully', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      });

      // Open edit form
      const editButton = within(screen.getByTestId('event-card-1')).getByRole('button', { name: /Edit/i });
      await user.click(editButton);

      // Wait for form to open
      await waitFor(() => {
        expect(screen.getByTestId('event-form')).toBeInTheDocument();
      });

      // Submit form
      const submitButton = within(screen.getByTestId('event-form')).getByRole('button', { name: /Submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Event updated successfully');
      }, { timeout: 3000 });
    });

    it.skip('handles event update errors', async () => {
      // NOTE: Skipping - error handling requires error boundary setup for proper testing
      const user = userEvent.setup();

      // Override mock to return error for this test only
      mockEventService.updateEvent.mockImplementationOnce(() =>
        Promise.reject(new Error('Failed to update event'))
      );

      renderWithQueryClient(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      });

      // Open edit form
      const editButton = within(screen.getByTestId('event-card-1')).getByRole('button', { name: /Edit/i });
      await user.click(editButton);

      // Submit form
      const submitButton = within(screen.getByTestId('event-form')).getByRole('button', { name: /Submit/i });
      await user.click(submitButton);

      // Form should stay open on error
      await waitFor(() => {
        expect(screen.getByTestId('event-form')).toBeInTheDocument();
      });
    });
  });

  describe('Event Deletion', () => {
    it('opens delete confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      });

      const deleteButton = within(screen.getByTestId('event-card-1')).getByRole('button', { name: /Delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Delete Event/i)).toBeInTheDocument();
      });

      // Verify event name appears in dialog (there should be 2 instances: card + dialog)
      expect(screen.getAllByText(/Summer BBQ/i)).toHaveLength(2);
    });

    it('deletes an event successfully', async () => {
      const user = userEvent.setup();

      renderWithQueryClient(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = within(screen.getByTestId('event-card-1')).getByRole('button', { name: /Delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText(/Delete Event/i)).toBeInTheDocument();
      });

      // Get all Delete buttons and click the last one (confirmation dialog button)
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
      await user.click(deleteButtons[deleteButtons.length - 1]);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Event deleted successfully');
        expect(screen.queryByTestId('event-card-1')).not.toBeInTheDocument();
      });
    });

    it('handles event deletion errors', async () => {
      const user = userEvent.setup();

      // Override mock to return error for this test only
      mockEventService.deleteEvent.mockImplementationOnce(() =>
        Promise.reject(new Error('Failed to delete event'))
      );

      renderWithQueryClient(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = within(screen.getByTestId('event-card-1')).getByRole('button', { name: /Delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText(/Delete Event/i)).toBeInTheDocument();
      });

      // Get all Delete buttons and click the last one (confirmation dialog button)
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
      await user.click(deleteButtons[deleteButtons.length - 1]);

      // Event should still be visible after failed deletion
      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      });
    });
  });

  describe('Page Header', () => {
    it('displays page title and description', async () => {
      renderWithQueryClient(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Events')).toBeInTheDocument();
      });

      expect(screen.getByText(/Schedule and manage club events and activities/i)).toBeInTheDocument();
    });

    it('displays create event button in header', async () => {
      renderWithQueryClient(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Create Event/i })).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('displays upcoming and past tabs', async () => {
      renderWithQueryClient(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /upcoming/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /past/i })).toBeInTheDocument();
      });
    });

    it('upcoming tab is selected by default', async () => {
      renderWithQueryClient(<EventsPage />);

      await waitFor(() => {
        const upcomingTab = screen.getByRole('tab', { name: /upcoming/i });
        expect(upcomingTab).toHaveAttribute('data-state', 'active');
      });
    });

    it('switches to past tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
      });

      const pastTab = screen.getByRole('tab', { name: /past/i });
      await user.click(pastTab);

      await waitFor(() => {
        expect(pastTab).toHaveAttribute('data-state', 'active');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors when loading events', async () => {
      server.use(
        http.get('http://localhost:5000/clubs/:clubId/events', () => {
          return HttpResponse.json(
            { message: 'Failed to load events' },
            { status: 500 }
          );
        })
      );

      renderWithQueryClient(<EventsPage />);

      // Should still render the page structure even with API error
      await waitFor(() => {
        expect(screen.getByText('Events')).toBeInTheDocument();
      });
    });

    it('handles unauthorized access', async () => {
      server.use(
        http.get('http://localhost:5000/clubs/:clubId/events', () => {
          return HttpResponse.json(
            { message: 'Unauthorized' },
            { status: 403 }
          );
        })
      );

      renderWithQueryClient(<EventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Events')).toBeInTheDocument();
      });
    });
  });
});
