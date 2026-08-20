import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { EventRsvpManager } from '../EventRsvpManager';
import { eventService } from '@/services/eventService';
import { EventResponse, EventRsvpResponse } from '@/types/event';
import { useAuth } from '@/hooks/useAuth';

// Import universal RadixUI mocking setup

// Mock the useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the event service
jest.mock('@/services/eventService', () => ({
  eventService: {
    getEventRsvps: jest.fn(),
    updateRsvp: jest.fn(),
  },
}));

// Mock the toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock RadixUI components
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
  Root: React.forwardRef(({ orientation = 'horizontal', decorative = true, ...props }: any, ref) => (
    <div ref={ref} role={decorative ? "none" : "separator"} aria-orientation={orientation} {...props} />
  ))
}));

// Mock UI components
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

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, defaultValue }: {
    children: React.ReactNode;
    onValueChange: (value: string) => void;
    defaultValue?: string;
  }) => (
    <div data-testid="select" data-default-value={defaultValue}>
      <button 
        onClick={() => onValueChange('Attending')} 
        data-testid="select-trigger"
      >
        Select Status
      </button>
      {children}
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => 
    <div data-testid="select-item" data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => 
    <div data-testid="select-value">{placeholder}</div>,
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon" />,
  UserCheck: () => <div data-testid="usercheck-icon" />,
  UserX: () => <div data-testid="userx-icon" />,
  UserPlus: () => <div data-testid="userplus-icon" />,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockEventService = eventService as jest.Mocked<typeof eventService>;

describe('EventRsvpManager', () => {
  const mockUser = {
    userId: 1,
    fullName: 'Test Admin',
    email: 'admin@testclub.com',
    clubId: 1,
    clubName: 'Test Club',
    clubTier: 'Grow',
    role: 'Admin',
    isOnboardingCompleted: true,
  };

  const mockEvent: EventResponse = {
    id: 1,
    clubId: 1,
    name: 'Annual Plant Sale',
    eventDateTime: '2030-12-25T10:00:00Z',
    location: 'Town Hall Park',
    description: 'Our biggest sale of the year!',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
    attendeeCount: 2,
    totalRsvpCount: 4,
  };

  const mockRsvps: EventRsvpResponse[] = [
    {
      id: 1,
      eventId: 1,
      memberId: 1,
      memberName: 'John Smith',
      memberEmail: 'john@example.com',
      rsvpStatus: 'Attending',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    },
    {
      id: 2,
      eventId: 1,
      memberId: 2,
      memberName: 'Jane Doe',
      memberEmail: 'jane@example.com',
      rsvpStatus: 'NotAttending',
      createdAt: '2024-01-01T11:00:00Z',
      updatedAt: '2024-01-01T11:00:00Z',
    },
    {
      id: 3,
      eventId: 1,
      memberId: 3,
      memberName: 'Bob Wilson',
      memberEmail: 'bob@example.com',
      rsvpStatus: 'Invited',
      createdAt: '2024-01-01T12:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
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
  });

  describe('Component Rendering', () => {
    it('should render RSVP manager with event information', async () => {
      mockEventService.getEventRsvps.mockResolvedValue(mockRsvps);

      render(<EventRsvpManager event={mockEvent} />);

      expect(screen.getByTestId('card-title')).toHaveTextContent('RSVP Management');
      
      await waitFor(() => {
        expect(mockEventService.getEventRsvps).toHaveBeenCalledWith(1, 1);
      });
    });

    it('should show loading state initially', () => {
      mockEventService.getEventRsvps.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<EventRsvpManager event={mockEvent} />);

      expect(screen.getByText('Loading RSVPs...')).toBeInTheDocument();
    });
  });

  describe('RSVP Summary', () => {
    beforeEach(() => {
      mockEventService.getEventRsvps.mockResolvedValue(mockRsvps);
    });

    it('should display correct RSVP counts in summary', async () => {
      render(<EventRsvpManager event={mockEvent} />);

      await waitFor(() => {
        expect(screen.getByText('1 Attending')).toBeInTheDocument();
        expect(screen.getByText('1 Not Attending')).toBeInTheDocument();
        expect(screen.getByText('1 Invited')).toBeInTheDocument();
      });

      const badges = screen.getAllByTestId('badge');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should display icons for each RSVP status', async () => {
      render(<EventRsvpManager event={mockEvent} />);

      await waitFor(() => {
        expect(screen.getAllByTestId('usercheck-icon').length).toBeGreaterThan(0);
        expect(screen.getAllByTestId('userx-icon').length).toBeGreaterThan(0);
        expect(screen.getAllByTestId('userplus-icon').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Member List', () => {
    beforeEach(() => {
      mockEventService.getEventRsvps.mockResolvedValue(mockRsvps);
    });

    it('should display all members with their RSVP status', async () => {
      render(<EventRsvpManager event={mockEvent} />);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
        expect(screen.getByText('bob@example.com')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no RSVPs exist', async () => {
      mockEventService.getEventRsvps.mockResolvedValue([]);

      render(<EventRsvpManager event={mockEvent} />);

      await waitFor(() => {
        expect(screen.getByText('No RSVPs Yet')).toBeInTheDocument();
        expect(screen.getByText("Members haven't responded to this event yet.")).toBeInTheDocument();
      });
    });
  });
});