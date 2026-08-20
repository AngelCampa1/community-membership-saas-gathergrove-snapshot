/**
 * Tests for PayEventForm.tsx - Stripe payment form for events (smoke tests)
 * Note: This component has complex Stripe Elements integration and payment processing
 * Full payment flow testing deferred due to Stripe complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import PayEventForm from '../PayEventForm';

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    elements: jest.fn(() => ({
      create: jest.fn(() => ({
        mount: jest.fn(),
        unmount: jest.fn(),
        on: jest.fn(),
      })),
    })),
  })),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: any) => <div data-testid="stripe-elements">{children}</div>,
  CardElement: () => <div data-testid="card-element">Card Element</div>,
  useStripe: () => ({
    confirmCardPayment: jest.fn(() => Promise.resolve({ error: null })),
  }),
  useElements: () => ({
    getElement: jest.fn(() => ({})),
  }),
}));

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

// Mock services
jest.mock('@/services/eventService', () => ({
  eventService: {
    getEvent: jest.fn(() => Promise.resolve({
      id: 1,
      name: 'Test Event',
      eventDateTime: '2025-12-31T19:00:00Z',
      location: 'Test Location',
      description: 'Test Description',
      isFree: false,
      memberPrice: 10.00,
      nonMemberPrice: 15.00,
      attendeeCount: 0,
      totalRsvpCount: 0,
      clubId: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    })),
    processEventPayment: jest.fn(() => Promise.resolve({ clientSecret: 'test-secret' })),
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

// Mock loading-error component
jest.mock('@/components/ui/loading-error', () => ({
  LoadingError: ({ error, onRetry }: any) => (
    <div data-testid="loading-error">
      <p>{error}</p>
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  ),
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
  CardDescription: ({ children }: any) => <p data-testid="card-description">{children}</p>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader-icon">Loader2</div>,
  CreditCard: () => <div data-testid="creditcard-icon">CreditCard</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  MapPin: () => <div data-testid="mappin-icon">MapPin</div>,
}));

// Mock chart colors
jest.mock('@/utils/chartColors', () => ({
  CHART_SEMANTIC: {
    success: '#00ff00',
    info: '#0000ff',
    warning: '#ffff00',
    error: '#ff0000',
  },
  CHART_BACKGROUNDS: {
    success: 'rgba(0,255,0,0.1)',
    info: 'rgba(0,0,255,0.1)',
    warning: 'rgba(255,255,0,0.1)',
    error: 'rgba(255,0,0,0.1)',
  },
}));

describe('PayEventForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smoke tests', () => {
    it('exports the PayEventForm component', () => {
      expect(PayEventForm).toBeDefined();
      expect(typeof PayEventForm).toBe('function');
    });

    it('has correct component name', () => {
      expect(PayEventForm.name).toBe('PayEventForm');
    });
  });
});
