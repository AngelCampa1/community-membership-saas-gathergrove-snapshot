/**
 * Tests for EventInvitationDialog.tsx - Event invitation dialog component (smoke tests)
 * Note: This component has complex member selection, invitation methods, and API integration
 * Full interaction testing deferred due to complexity
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventInvitationDialog } from '../EventInvitationDialog';
import { EventResponse } from '@/types/event';
import { eventService } from '@/services/eventService';
import { ErrorHandler } from '@/lib/errorHandler';
import memberService from '@/services/memberService';

// Mock hooks
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: 'test@example.com',
      clubId: 1,
    },
    isAuthenticated: true,
  }),
}));

jest.mock('@/hooks/useClubTier', () => ({
  useClubTier: () => ({
    canSendInvitations: true,
    tier: 'premium',
  }),
}));

// Mock services
jest.mock('@/services/eventService', () => ({
  eventService: {
    sendEventInvitations: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('@/services/memberService', () => ({
  __esModule: true,
  default: {
    getMembers: jest.fn(() => Promise.resolve([])),
  },
}));

// Mock error handler
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleApiError: jest.fn((error) => error),
    showErrorToast: jest.fn(),
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock UI components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: (props: any) => <input type="checkbox" {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div data-testid="scroll-area">{children}</div>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Mail: () => <div data-testid="mail-icon">Mail</div>,
  Bell: () => <div data-testid="bell-icon">Bell</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  UserCheck: () => <div data-testid="usercheck-icon">UserCheck</div>,
  User: () => <div data-testid="user-icon">User</div>,
}));

describe('EventInvitationDialog', () => {
  const mockEvent: EventResponse = {
    id: 1,
    name: 'Test Event',
    eventDateTime: '2025-12-31T19:00:00Z',
    location: 'Test Location',
    description: 'Test Description',
    isFree: true,
    memberPrice: null,
    nonMemberPrice: null,
    attendeeCount: 0,
    totalRsvpCount: 0,
    clubId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockHandlers = {
    onClose: jest.fn(),
    onInvitationsSent: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smoke tests', () => {
    it('renders without crashing when closed', () => {
      expect(() => render(
        <EventInvitationDialog open={false} onClose={mockHandlers.onClose} event={mockEvent} />
      )).not.toThrow();
    });

    it('renders without crashing when open', () => {
      expect(() => render(
        <EventInvitationDialog open={true} onClose={mockHandlers.onClose} event={mockEvent} />
      )).not.toThrow();
    });

    it('accepts open prop', () => {
      expect(() => render(
        <EventInvitationDialog open={true} onClose={mockHandlers.onClose} event={mockEvent} />
      )).not.toThrow();
    });

    it('accepts onClose callback prop', () => {
      expect(() => render(
        <EventInvitationDialog open={true} onClose={jest.fn()} event={mockEvent} />
      )).not.toThrow();
    });

    it('accepts event prop', () => {
      expect(() => render(
        <EventInvitationDialog open={true} onClose={mockHandlers.onClose} event={mockEvent} />
      )).not.toThrow();
    });

    it('accepts onInvitationsSent callback prop', () => {
      expect(() => render(
        <EventInvitationDialog
          open={true}
          onClose={mockHandlers.onClose}
          event={mockEvent}
          onInvitationsSent={jest.fn()}
        />
      )).not.toThrow();
    });

    it('renders with all props combined', () => {
      expect(() => render(
        <EventInvitationDialog
          open={true}
          onClose={mockHandlers.onClose}
          event={mockEvent}
          onInvitationsSent={mockHandlers.onInvitationsSent}
        />
      )).not.toThrow();
    });
  });

  describe('Send invitations error handling (M-002)', () => {
    // Regression guard: previously the `request` object was declared inside the
    // try block but referenced in the catch's logger.error call. On any send
    // failure the catch threw a ReferenceError BEFORE ErrorHandler ran, so the
    // user never saw an error toast. The request is now hoisted above the try.
    it('surfaces an error toast when sending invitations fails', async () => {
      (memberService.getMembers as jest.Mock).mockResolvedValue([]);
      (eventService.sendEventInvitations as jest.Mock).mockRejectedValueOnce(
        new Error('network down')
      );

      render(
        <EventInvitationDialog
          open={true}
          onClose={mockHandlers.onClose}
          event={mockEvent}
          onInvitationsSent={mockHandlers.onInvitationsSent}
        />
      );

      // Default state: inviteAllMembers=true, invitationMethods=['email'],
      // so the Send button is enabled without further interaction.
      const sendButton = screen.getByRole('button', { name: /send invitations/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(eventService.sendEventInvitations).toHaveBeenCalledTimes(1);
      });

      // The catch block must reach ErrorHandler (it would have thrown a
      // ReferenceError on `request` before the fix).
      await waitFor(() => {
        expect(ErrorHandler.handleApiError).toHaveBeenCalled();
        expect(ErrorHandler.showErrorToast).toHaveBeenCalled();
      });

      // A failed send must NOT report success or close the dialog.
      expect(mockHandlers.onInvitationsSent).not.toHaveBeenCalled();
      expect(mockHandlers.onClose).not.toHaveBeenCalled();
    });
  });
});
