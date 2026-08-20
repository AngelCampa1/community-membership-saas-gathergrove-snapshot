import React from 'react';
import { render, screen } from '@testing-library/react';
import { EventCard } from '../EventCard';
import { EventResponse } from '@/types/event';

// Mock the useRouter hook from next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Calendar: (props: any) => <div {...props} data-testid={props['data-testid'] || "calendar-icon"} />,
  Clock: (props: any) => <div {...props} data-testid={props['data-testid'] || "clock-icon"} />,
  MapPin: (props: any) => <div {...props} data-testid={props['data-testid'] || "mappin-icon"} />,
  Edit: (props: any) => <div {...props} data-testid={props['data-testid'] || "edit-icon"} />,
  Trash2: (props: any) => <div {...props} data-testid={props['data-testid'] || "trash-icon"} />,
  Users: (props: any) => <div {...props} data-testid={props['data-testid'] || "users-icon"} />,
  Eye: (props: any) => <div {...props} data-testid={props['data-testid'] || "eye-icon"} />,
  DollarSign: (props: any) => <div {...props} data-testid={props['data-testid'] || "dollar-icon"} />,
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
  CardHeader: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
  CardContent: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
  CardTitle: ({ children, className, ...props }: any) => <h3 className={className} {...props}>{children}</h3>,
  CardDescription: ({ children, className, ...props }: any) => <p className={className} {...props}>{children}</p>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, ...props }: any) => (
    <span className={className} {...props}>{children}</span>
  ),
}));

// Mock SecurityUtils
jest.mock('@/utils/security', () => ({
  SecurityUtils: {
    createSafeHTML: (html: string) => ({ __html: html }),
  },
}));

describe('EventCard - Pricing Display', () => {
  const mockEvent: EventResponse = {
    id: 1,
    name: 'Test Event',
    eventDateTime: '2030-12-25T15:30:00Z',
    location: 'Test Location',
    description: 'Test Description',
    isFree: false,
    memberPrice: 10.00,
    nonMemberPrice: 15.00,
    sendInvitations: false,
    invitationMethods: [],
    attendeeCount: 5,
    totalRsvpCount: 8,
  };

  const mockHandlers = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Free Events', () => {
    it('should display FREE badge for free events', () => {
      const freeEvent: EventResponse = {
        ...mockEvent,
        isFree: true,
        memberPrice: null,
        nonMemberPrice: null,
      };

      render(<EventCard event={freeEvent} {...mockHandlers} />);

      const freeBadge = screen.getByTestId('free-event-badge');
      expect(freeBadge).toBeInTheDocument();
      expect(freeBadge).toHaveTextContent('FREE');
      expect(freeBadge).toHaveClass('free-event');
    });

    it('should NOT display pricing section for free events', () => {
      const freeEvent: EventResponse = {
        ...mockEvent,
        isFree: true,
        memberPrice: null,
        nonMemberPrice: null,
      };

      render(<EventCard event={freeEvent} {...mockHandlers} />);

      expect(screen.queryByTestId('event-pricing')).not.toBeInTheDocument();
      expect(screen.queryByTestId('member-price')).not.toBeInTheDocument();
      expect(screen.queryByTestId('non-member-price')).not.toBeInTheDocument();
    });
  });

  describe('Paid Events', () => {
    it('should display member price with currency symbol and formatting', () => {
      render(<EventCard event={mockEvent} {...mockHandlers} />);

      const memberPrice = screen.getByTestId('member-price');
      expect(memberPrice).toBeInTheDocument();
      expect(memberPrice).toHaveTextContent('$10.00');
    });

    it('should display non-member price with currency symbol and formatting', () => {
      render(<EventCard event={mockEvent} {...mockHandlers} />);

      const nonMemberPrice = screen.getByTestId('non-member-price');
      expect(nonMemberPrice).toBeInTheDocument();
      expect(nonMemberPrice).toHaveTextContent('$15.00');
    });

    it('should NOT display free badge for paid events', () => {
      render(<EventCard event={mockEvent} {...mockHandlers} />);

      expect(screen.queryByTestId('free-event-badge')).not.toBeInTheDocument();
    });

    it('should format decimal prices with two decimal places', () => {
      const eventWithDecimals: EventResponse = {
        ...mockEvent,
        memberPrice: 12.50,
        nonMemberPrice: 18.99,
      };

      render(<EventCard event={eventWithDecimals} {...mockHandlers} />);

      const memberPrice = screen.getByTestId('member-price');
      const nonMemberPrice = screen.getByTestId('non-member-price');

      expect(memberPrice).toHaveTextContent('$12.50');
      expect(nonMemberPrice).toHaveTextContent('$18.99');
    });

    it('should format prices with thousand separators', () => {
      const expensiveEvent: EventResponse = {
        ...mockEvent,
        memberPrice: 1250.00,
        nonMemberPrice: 1500.00,
      };

      render(<EventCard event={expensiveEvent} {...mockHandlers} />);

      const memberPrice = screen.getByTestId('member-price');
      const nonMemberPrice = screen.getByTestId('non-member-price');

      expect(memberPrice).toHaveTextContent('$1,250.00');
      expect(nonMemberPrice).toHaveTextContent('$1,500.00');
    });

    it('should display pricing icon for paid events', () => {
      render(<EventCard event={mockEvent} {...mockHandlers} />);

      const pricingIcon = screen.getByTestId('pricing-icon');
      expect(pricingIcon).toBeInTheDocument();
    });
  });

  describe('Partial Pricing', () => {
    it('should display only member price when non-member price is null', () => {
      const memberOnlyEvent: EventResponse = {
        ...mockEvent,
        isFree: false,
        memberPrice: 10.00,
        nonMemberPrice: null,
      };

      render(<EventCard event={memberOnlyEvent} {...mockHandlers} />);

      expect(screen.getByTestId('member-price')).toBeInTheDocument();
      expect(screen.queryByTestId('non-member-price')).not.toBeInTheDocument();
    });

    it('should display only non-member price when member price is null', () => {
      const nonMemberOnlyEvent: EventResponse = {
        ...mockEvent,
        isFree: false,
        memberPrice: null,
        nonMemberPrice: 15.00,
      };

      render(<EventCard event={nonMemberOnlyEvent} {...mockHandlers} />);

      expect(screen.queryByTestId('member-price')).not.toBeInTheDocument();
      expect(screen.getByTestId('non-member-price')).toBeInTheDocument();
    });

    it('should handle null prices gracefully when not free', () => {
      const noPriceEvent: EventResponse = {
        ...mockEvent,
        isFree: false,
        memberPrice: null,
        nonMemberPrice: null,
      };

      render(<EventCard event={noPriceEvent} {...mockHandlers} />);

      // Should not show pricing section if both prices are null and not marked as free
      expect(screen.queryByTestId('event-pricing')).not.toBeInTheDocument();
      expect(screen.queryByTestId('free-event-badge')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible aria-labels for prices', () => {
      render(<EventCard event={mockEvent} {...mockHandlers} />);

      const memberPrice = screen.getByTestId('member-price');
      const nonMemberPrice = screen.getByTestId('non-member-price');

      expect(memberPrice).toHaveAttribute('aria-label', 'Member price: $10.00');
      expect(nonMemberPrice).toHaveAttribute('aria-label', 'Non-member price: $15.00');
    });

    it('should have accessible aria-label for free event badge', () => {
      const freeEvent: EventResponse = {
        ...mockEvent,
        isFree: true,
        memberPrice: null,
        nonMemberPrice: null,
      };

      render(<EventCard event={freeEvent} {...mockHandlers} />);

      const freeBadge = screen.getByTestId('free-event-badge');
      expect(freeBadge).toHaveAttribute('aria-label', 'Free event');
    });
  });
});