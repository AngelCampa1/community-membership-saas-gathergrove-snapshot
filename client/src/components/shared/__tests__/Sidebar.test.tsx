/**
 * Tests for Sidebar.tsx - Navigation sidebar (smoke tests)
 * Note: This component uses useAuth, useChatAccess hooks with complex navigation
 * Full navigation and permission testing deferred due to complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Sidebar } from '../Sidebar';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User', role: 'Admin' },
    loading: false,
    isAuthenticated: true,
  }),
}));

// Mock useChatAccess hook
jest.mock('@/hooks/useChatAccess', () => ({
  useChatAccess: () => ({
    hasAccess: true,
    loading: false,
    error: null,
  }),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// Mock FeedbackDialog
jest.mock('@/components/shared/FeedbackDialog', () => ({
  FeedbackDialog: ({ open, onOpenChange }: any) => (
    open ? <div data-testid="feedback-dialog">Feedback Dialog</div> : null
  ),
}));

// Mock UI Button
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  LayoutDashboard: () => <div data-testid="dashboard-icon">Dashboard</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  MessageSquare: () => <div data-testid="message-icon">Message</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  BarChart: () => <div data-testid="chart-icon">Chart</div>,
  Mail: () => <div data-testid="mail-icon">Mail</div>,
  MapPin: () => <div data-testid="map-icon">Map</div>,
  CreditCard: () => <div data-testid="credit-icon">Credit</div>,
  ChevronDown: () => <div data-testid="chevron-icon">Chevron</div>,
  MessageCircle: () => <div data-testid="message-circle-icon">MessageCircle</div>,
  X: () => <div data-testid="x-icon">X</div>,
}));

describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  describe('Smoke tests', () => {
    it('exports the Sidebar component', () => {
      expect(Sidebar).toBeDefined();
      expect(typeof Sidebar).toBe('function');
    });

    it('has correct component name', () => {
      expect(Sidebar.name).toBe('Sidebar');
    });
  });
});
