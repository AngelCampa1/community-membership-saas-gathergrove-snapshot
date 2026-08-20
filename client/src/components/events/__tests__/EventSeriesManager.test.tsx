import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventSeriesManager } from '../EventSeriesManager';
import { eventService } from '@/services/eventService';

// Mock dependencies
jest.mock('@/services/eventService');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));
// Create a mock toast object that we can spy on
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};

// Mock the useToast hook
jest.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

const mockEventService = eventService as jest.Mocked<typeof eventService>;

const mockEventSeries = {
  id: 1,
  name: 'Weekly Team Meeting',
  description: 'Regular team sync meetings',
  startDate: '2024-01-01T10:00:00Z',
  endDate: '2024-12-31T10:00:00Z',
  recurrencePattern: 'weekly',
  recurrenceInterval: 1,
  daysOfWeek: [1], // Monday
  events: [
    {
      id: 101,
      seriesId: 1,
      name: 'Weekly Team Meeting - Week 1',
      eventDateTime: '2024-01-01T10:00:00Z',
      location: 'Conference Room A',
      description: 'Weekly team sync',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      clubId: 1,
      attendeeCount: 0,
      totalRsvpCount: 0,
    },
  ],
  clubId: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Export mockToast so we can reference it in tests
export { mockToast };

describe('EventSeriesManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear mock toast calls
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.warning.mockClear();
    mockToast.info.mockClear();
    // Default mock to return empty array
    mockEventService.getEventSeries = jest.fn().mockResolvedValue([]);
  });

  test('renders event series manager with basic elements', async () => {
    render(<EventSeriesManager clubId={1} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading event series...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Event Series Management')).toBeInTheDocument();
    expect(screen.getByText('Create New Series')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search event series...')).toBeInTheDocument();
  });

  test('shows create series form when create button clicked', async () => {
    render(<EventSeriesManager clubId={1} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading event series...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create New Series'));

    await waitFor(() => {
      expect(screen.getByText('Create Event Series')).toBeInTheDocument();
      expect(screen.getByLabelText(/Series Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Recurrence Pattern/i)).toBeInTheDocument();
    });
  });

  test('displays event series list when data is loaded', async () => {
    mockEventService.getEventSeries = jest.fn().mockResolvedValue([mockEventSeries]);

    render(<EventSeriesManager clubId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Weekly Team Meeting')).toBeInTheDocument();
      expect(screen.getByText('Regular team sync meetings')).toBeInTheDocument();
      // Use getAllByText since "Weekly" appears multiple times (in the recurrence badge and pattern)
      const weeklyElements = screen.getAllByText('Weekly');
      expect(weeklyElements.length).toBeGreaterThan(0);
    });
  });

  test('handles series creation successfully', async () => {
    mockEventService.createEventSeries = jest.fn().mockResolvedValue(mockEventSeries);
    mockEventService.getEventSeries = jest.fn().mockResolvedValue([]);

    render(<EventSeriesManager clubId={1} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading event series...')).not.toBeInTheDocument();
    });

    // Open create form
    fireEvent.click(screen.getByText('Create New Series'));

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText('Create Event Series')).toBeInTheDocument();
    });

    // Fill form
    const nameInput = screen.getByLabelText(/Series Name/i);
    const descriptionInput = screen.getByLabelText(/Description/i);

    fireEvent.change(nameInput, { target: { value: 'Test Series' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

    // Submit form
    fireEvent.click(screen.getByText('Create Series'));

    await waitFor(() => {
      expect(mockEventService.createEventSeries).toHaveBeenCalledWith(1, {
        name: 'Test Series',
        description: 'Test description',
        startDate: '',
        endDate: '',
        recurrencePattern: 'weekly',
        recurrenceInterval: 1,
        daysOfWeek: [1],
        location: '',
        duration: 60,
      });
    });
  });

  test('shows error message on series creation failure', async () => {
    mockEventService.createEventSeries = jest.fn().mockRejectedValue(new Error('Creation failed'));
    mockEventService.getEventSeries = jest.fn().mockResolvedValue([]);

    render(<EventSeriesManager clubId={1} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading event series...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create New Series'));

    await waitFor(() => {
      expect(screen.getByText('Create Event Series')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Series Name/i);
    const descriptionInput = screen.getByLabelText(/Description/i);

    fireEvent.change(nameInput, { target: { value: 'Test Series' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

    fireEvent.click(screen.getByText('Create Series'));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to create event series');
    });
  });

  test('filters event series based on search input', async () => {
    const multipleSeries = [
      mockEventSeries,
      {
        ...mockEventSeries,
        id: 2,
        name: 'Monthly Board Meeting',
        description: 'Board meeting sessions',
      },
    ];
    
    mockEventService.getEventSeries = jest.fn().mockResolvedValue(multipleSeries);
    
    render(<EventSeriesManager clubId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Weekly Team Meeting')).toBeInTheDocument();
      expect(screen.getByText('Monthly Board Meeting')).toBeInTheDocument();
    });
    
    // Search for "Weekly"
    fireEvent.change(screen.getByPlaceholderText('Search event series...'), {
      target: { value: 'Weekly' },
    });
    
    await waitFor(() => {
      expect(screen.getByText('Weekly Team Meeting')).toBeInTheDocument();
      expect(screen.queryByText('Monthly Board Meeting')).not.toBeInTheDocument();
    });
  });

  test('handles series deletion', async () => {
    mockEventService.getEventSeries = jest.fn().mockResolvedValue([mockEventSeries]);
    mockEventService.deleteEventSeries = jest.fn().mockResolvedValue(undefined);

    render(<EventSeriesManager clubId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Weekly Team Meeting')).toBeInTheDocument();
    });

    // Click delete button (no confirmation dialog in current implementation)
    fireEvent.click(screen.getByLabelText('Delete series'));

    await waitFor(() => {
      expect(mockEventService.deleteEventSeries).toHaveBeenCalledWith(1, 1);
    });
  });

  test('shows upcoming events for a series', async () => {
    mockEventService.getEventSeries = jest.fn().mockResolvedValue([mockEventSeries]);
    
    render(<EventSeriesManager clubId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Weekly Team Meeting')).toBeInTheDocument();
    });
    
    // Click to view events
    fireEvent.click(screen.getByLabelText('View events'));
    
    await waitFor(() => {
      expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
      expect(screen.getByText('Weekly Team Meeting - Week 1')).toBeInTheDocument();
    });
  });

  test('handles mobile responsive design', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<EventSeriesManager clubId={1} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading event series...')).not.toBeInTheDocument();
    });

    const container = screen.getByTestId('event-series-container');
    expect(container).toHaveClass('flex-col');
  });

  test('shows loading state while fetching data', () => {
    mockEventService.getEventSeries = jest.fn().mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    
    render(<EventSeriesManager clubId={1} />);
    
    expect(screen.getByText('Loading event series...')).toBeInTheDocument();
  });

  test('handles recurring pattern validation', async () => {
    render(<EventSeriesManager clubId={1} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading event series...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create New Series'));

    await waitFor(() => {
      expect(screen.getByText('Create Event Series')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Series Name/i);

    // Only fill name, not description
    fireEvent.change(nameInput, { target: { value: 'Test Series' } });

    // Try to submit without description
    fireEvent.click(screen.getByText('Create Series'));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Please fill in all required fields');
    });
  });
});