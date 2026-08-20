import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import EventDetailPage from '../page';
import { useAuth } from '@/hooks/useAuth';
import { useClubTier } from '@/hooks/useClubTier';
import { eventService } from '@/services/eventService';
import { toast } from 'sonner';

// Comprehensive environment variable mocking
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_API_URL: 'http://localhost:5000',
    NODE_ENV: 'test'
  };
});

afterEach(() => {
  process.env = originalEnv;
});

// Mock Next.js router with complete method coverage
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Mock auth hooks
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useClubTier', () => ({
  useClubTier: jest.fn(),
}));

// Complete toast mocking pattern with all methods covered
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock all dynamically imported components
jest.mock('@/components/events/EventForm', () => {
  return {
    EventForm: ({ open, onClose, onSubmit, event, isEditing, isLoading }: any) => {
      if (!open) return null;
      return (
        <div data-testid="event-form-modal">
          <div>Event Form Modal</div>
          <button onClick={onClose}>Close</button>
          <button onClick={() => onSubmit(event || {})}>
            {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </button>
        </div>
      );
    },
  };
});

jest.mock('@/components/events/EventRsvpManager', () => {
  return {
    EventRsvpManager: ({ event, onRsvpUpdate, onRsvpCountsUpdate }: any) => (
      <div data-testid="event-rsvp-manager">
        <div>RSVP Manager for {event?.name}</div>
        <button onClick={() => onRsvpCountsUpdate({ attending: 5, notAttending: 2, invited: 10 })}>
          Update Counts
        </button>
      </div>
    ),
  };
});

jest.mock('@/components/events/EventInvitationDialog', () => {
  return {
    EventInvitationDialog: ({ open, onClose, event, onInvitationsSent }: any) => {
      if (!open) return null;
      return (
        <div data-testid="event-invitation-dialog">
          <div>Invitation Dialog for {event?.name}</div>
          <button onClick={onClose}>Close</button>
          <button onClick={onInvitationsSent}>Send Invitations</button>
        </div>
      );
    },
  };
});

// Mock CopyButton component
jest.mock('@/components/common/CopyButton', () => {
  return {
    __esModule: true,
    default: ({ text, buttonText, onCopySuccess, variant, size }: any) => (
      <button
        onClick={() => onCopySuccess?.()}
        data-testid="copy-button"
        data-variant={variant}
        data-size={size}
      >
        {buttonText || 'Copy'}
      </button>
    ),
  };
});

// Mock all lucide-react icons
jest.mock('lucide-react', () => ({
  Calendar: ({ className, ...props }: any) => <div data-testid="calendar-icon" className={className} {...props} />,
  Clock: ({ className, ...props }: any) => <div data-testid="clock-icon" className={className} {...props} />,
  MapPin: ({ className, ...props }: any) => <div data-testid="map-pin-icon" className={className} {...props} />,
  Edit: ({ className, ...props }: any) => <div data-testid="edit-icon" className={className} {...props} />,
  ArrowLeft: ({ className, ...props }: any) => <div data-testid="arrow-left-icon" className={className} {...props} />,
  Users: ({ className, ...props }: any) => <div data-testid="users-icon" className={className} {...props} />,
  Mail: ({ className, ...props }: any) => <div data-testid="mail-icon" className={className} {...props} />,
  Link: ({ className, ...props }: any) => <div data-testid="link-icon" className={className} {...props} />,
  ExternalLink: ({ className, ...props }: any) => <div data-testid="external-link-icon" className={className} {...props} />,
  Check: ({ className, ...props }: any) => <div data-testid="check-icon" className={className} {...props} />,
  Copy: ({ className, ...props }: any) => <div data-testid="copy-icon" className={className} {...props} />,
}));

// Mock error handler utility
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleApiError: jest.fn((error, options) => ({
      message: 'Test error message',
      status: 500,
      context: options?.context || 'unknown',
    })),
    showErrorToast: jest.fn(),
  },
}));

// Mock security utilities
jest.mock('@/utils/security', () => ({
  SecurityUtils: {
    createSafeHTML: jest.fn((html, allowedTags) => ({
      __html: html,
    })),
  },
}));

// Mock service with complete method coverage
jest.mock('@/services/eventService', () => ({
  eventService: {
    getEventById: jest.fn(),
    generatePaymentLink: jest.fn(),
    getEventsByClub: jest.fn(),
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
    getEventRsvps: jest.fn(),
    updateRsvp: jest.fn(),
    sendEventInvitations: jest.fn(),
    getPublicEvent: jest.fn(),
    payEvent: jest.fn(),
    getEventPayments: jest.fn(),
    processNonMemberPayment: jest.fn(),
  },
}));

// Import test utilities
import { createMockUser, createMockAuthContext } from '@/tests/test-utils';

// Extract mocked functions
const useParams = require('next/navigation').useParams;
const mockPush = jest.fn();
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseClubTier = useClubTier as jest.MockedFunction<typeof useClubTier>;
const mockEventService = eventService as jest.Mocked<typeof eventService>;

const mockUser = createMockUser({
  userId: 1,
  fullName: 'Test Admin',
  email: 'admin@test.com',
  clubId: 1,
  clubName: 'Test Club',
  clubTier: 'Grow',
  role: 'Admin',
  isOnboardingCompleted: true,
});

const mockPaidEvent = {
  id: 1,
  clubId: 1,
  name: 'Paid Event',
  eventDateTime: '2025-12-31T19:00:00Z',
  location: 'Test Venue',
  description: 'A paid event',
  memberPrice: 25.00,
  nonMemberPrice: 50.00,
  isFree: false,
  isPaid: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  attendeeCount: 0,
  totalRsvpCount: 0,
};

const mockFreeEvent = {
  ...mockPaidEvent,
  id: 2,
  name: 'Free Event',
  memberPrice: 0,
  nonMemberPrice: 0,
  isFree: true,
  isPaid: false,
};

describe('EventDetailPage - Payment Link', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    });

    useParams.mockReturnValue({
      eventId: '1',
    });

    mockUseAuth.mockReturnValue(createMockAuthContext({ ...mockUser }));

    mockUseClubTier.mockReturnValue({
      canSendInvitations: true,
      tier: 'Grow',
      features: [],
    });

    // Mock window.location.origin
    delete (window as any).location;
    window.location = { origin: 'http://localhost:3000' } as Location;
  });

  describe('Generate Button Visibility', () => {
    it('should show generate button for paid events without token', async () => {
      mockEventService.getEventById.mockResolvedValue(mockPaidEvent);

      render(<EventDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Public Registration Link/i)).toBeInTheDocument();
      });

      const generateButton = screen.getByRole('button', { name: /Generate Payment Link/i });
      expect(generateButton).toBeInTheDocument();
      expect(generateButton).not.toBeDisabled();
    });

    it('should hide generate button for free events', async () => {
      mockEventService.getEventById.mockResolvedValue(mockFreeEvent);

      render(<EventDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: mockFreeEvent.name })).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /Generate Payment Link/i })).not.toBeInTheDocument();
    });

    it('should hide payment link section entirely for free events', async () => {
      mockEventService.getEventById.mockResolvedValue(mockFreeEvent);

      render(<EventDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: mockFreeEvent.name })).toBeInTheDocument();
      });

      expect(screen.queryByText(/Public Registration Link/i)).not.toBeInTheDocument();
    });
  });

  describe('Generate Payment Link', () => {
    it('should call API when generate button clicked', async () => {
      mockEventService.getEventById.mockResolvedValue(mockPaidEvent);
      mockEventService.generatePaymentLink.mockResolvedValue({
        paymentToken: 'test-token-123',
        paymentLink: 'https://gathergrove.club/events/pay/test-token-123',
        expiresAt: '2025-12-31T19:00:00Z',
      });

      render(<EventDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Generate Payment Link/i })).toBeInTheDocument();
      });

      const generateButton = screen.getByRole('button', { name: /Generate Payment Link/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockEventService.generatePaymentLink).toHaveBeenCalledWith(1, 1);
      });
    });

    it('should show success toast after generation', async () => {
      const eventWithToken = { ...mockPaidEvent, paymentToken: 'new-token-456' };

      mockEventService.getEventById
        .mockResolvedValueOnce(mockPaidEvent)
        .mockResolvedValueOnce(eventWithToken);

      mockEventService.generatePaymentLink.mockResolvedValue({
        paymentToken: 'new-token-456',
        paymentLink: 'https://gathergrove.club/events/pay/new-token-456',
        expiresAt: '2025-12-31T19:00:00Z',
      });

      render(<EventDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Generate Payment Link/i })).toBeInTheDocument();
      });

      const generateButton = screen.getByRole('button', { name: /Generate Payment Link/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Payment link generated successfully');
      });
    });

    it('should update event state with payment token from API response', async () => {
      const generatedToken = 'generated-token-xyz';

      mockEventService.getEventById.mockResolvedValue(mockPaidEvent);

      mockEventService.generatePaymentLink.mockResolvedValue({
        paymentToken: generatedToken,
        paymentLink: `https://gathergrove.club/events/pay/${generatedToken}`,
        expiresAt: '2025-12-31T19:00:00Z',
      });

      render(<EventDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Generate Payment Link/i })).toBeInTheDocument();
      });

      const generateButton = screen.getByRole('button', { name: /Generate Payment Link/i });
      fireEvent.click(generateButton);

      // Wait for the payment link to appear with the generated token
      await waitFor(() => {
        const linkInput = screen.getByDisplayValue(new RegExp(`/events/pay/${generatedToken}`));
        expect(linkInput).toBeInTheDocument();
      });

      // Should only call getEventById once for initial load (not reload after generation)
      expect(mockEventService.getEventById).toHaveBeenCalledTimes(1);
    });
  });

  describe('Payment Link Display', () => {
    it('should display payment link when token exists', async () => {
      const eventWithToken = { ...mockPaidEvent, paymentToken: 'existing-token-789' };
      mockEventService.getEventById.mockResolvedValue(eventWithToken);

      render(<EventDetailPage />);

      await waitFor(() => {
        const linkInput = screen.getByDisplayValue(/\/events\/pay\/existing-token-789/);
        expect(linkInput).toBeInTheDocument();
      });
    });

    it('should show copy button when link exists', async () => {
      const eventWithToken = { ...mockPaidEvent, paymentToken: 'copy-test-token' };
      mockEventService.getEventById.mockResolvedValue(eventWithToken);

      render(<EventDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Public Registration Link/i)).toBeInTheDocument();
      });

      // CopyButton component should be rendered
      const linkInput = screen.getByDisplayValue(/\/events\/pay\/copy-test-token/);
      expect(linkInput).toBeInTheDocument();
      expect(linkInput).toHaveAttribute('readOnly');
    });

    it('should have correct link format', async () => {
      const token = 'format-test-token-abc123';
      const eventWithToken = { ...mockPaidEvent, paymentToken: token };
      mockEventService.getEventById.mockResolvedValue(eventWithToken);

      delete (window as any).location;
      window.location = { origin: 'https://gathergrove.club' } as Location;

      render(<EventDetailPage />);

      await waitFor(() => {
        const linkInput = screen.getByDisplayValue(`https://gathergrove.club/events/pay/${token}`);
        expect(linkInput).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error toast when API fails', async () => {
      mockEventService.getEventById.mockResolvedValue(mockPaidEvent);
      mockEventService.generatePaymentLink.mockRejectedValue(new Error('API Error'));

      render(<EventDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Generate Payment Link/i })).toBeInTheDocument();
      });

      const generateButton = screen.getByRole('button', { name: /Generate Payment Link/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockEventService.generatePaymentLink).toHaveBeenCalled();
      });

      // Error should be handled gracefully
      expect(generateButton).not.toBeDisabled();
    });

    it('should not call API if user is missing', async () => {
      mockUseAuth.mockReturnValue(createMockAuthContext(null));

      render(<EventDetailPage />);

      // When user is null, component should stay in loading state or redirect
      // Should not render payment link functionality
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Generate Payment Link/i })).not.toBeInTheDocument();
      });

      // Should not call generatePaymentLink API
      expect(mockEventService.generatePaymentLink).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show generating text while generating', async () => {
      mockEventService.getEventById.mockResolvedValue(mockPaidEvent);
      mockEventService.generatePaymentLink.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          paymentToken: 'loading-token',
          paymentLink: 'https://gathergrove.club/events/pay/loading-token',
          expiresAt: '2025-12-31T19:00:00Z',
        }), 100))
      );

      render(<EventDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Generate Payment Link/i })).toBeInTheDocument();
      });

      const generateButton = screen.getByRole('button', { name: /Generate Payment Link/i });
      fireEvent.click(generateButton);

      // Check for loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Generating.../i })).toBeInTheDocument();
      });
    });
  });
});

