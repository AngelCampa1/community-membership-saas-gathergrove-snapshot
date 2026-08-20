/**
 * Tests for RouteProtection.tsx - Global route protection wrapper
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { RouteProtection } from '../RouteProtection';

// Mutable state so individual tests can override defaults
let mockPathname = '/';
let mockAuthState = { user: null as { role: string; clubTier?: string } | null, loading: false };
const mockPush = jest.fn();
const mockGetBillingStatus = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  usePathname: () => mockPathname,
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

jest.mock('@/services/billingService', () => ({
  billingService: {
    getBillingStatus: () => mockGetBillingStatus(),
  },
}));

jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader">Loading...</div>,
}));

describe('RouteProtection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/';
    mockAuthState = { user: null, loading: false };
    mockGetBillingStatus.mockResolvedValue({ canAccessApp: true, accountLocked: false });
  });

  describe('Smoke tests', () => {
    it('renders without crashing', () => {
      expect(() => render(
        <RouteProtection><div>Test Content</div></RouteProtection>
      )).not.toThrow();
    });

    it('renders children when not loading', () => {
      const { getByText } = render(
        <RouteProtection><div>Protected Content</div></RouteProtection>
      );
      expect(getByText('Protected Content')).toBeInTheDocument();
    });

    it('accepts children prop', () => {
      expect(() => render(
        <RouteProtection><div><h1>Title</h1><p>Content</p></div></RouteProtection>
      )).not.toThrow();
    });

    it('renders route protection wrapper', () => {
      const { container } = render(
        <RouteProtection><div>Test Content</div></RouteProtection>
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('Loading state — generic spinner', () => {
    beforeEach(() => {
      mockAuthState = { user: null, loading: true };
      mockPathname = '/app/dashboard';
    });

    it('shows spinner on non-admin loading routes', () => {
      render(<RouteProtection><div>Protected</div></RouteProtection>);
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.queryByText('Protected')).not.toBeInTheDocument();
    });

    it('renders generic GatherGrove title during loading to prevent title leaks', () => {
      render(<RouteProtection><div>Protected</div></RouteProtection>);
      // The <title> element is hoisted to <head> by React 19 Document Metadata API
      expect(document.title).toBe('GatherGrove');
    });
  });

  describe('Loading state — admin skeleton', () => {
    beforeEach(() => {
      mockAuthState = { user: null, loading: true };
      mockPathname = '/admin/dashboard';
    });

    it('shows admin skeleton (not generic spinner) on /admin/ routes', () => {
      render(<RouteProtection><div>Admin Content</div></RouteProtection>);
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('renders sidebar skeleton structure on admin routes', () => {
      const { container } = render(
        <RouteProtection><div>Admin Content</div></RouteProtection>
      );
      // Skeleton has animated pulse elements
      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it('does not render children during admin loading', () => {
      render(<RouteProtection><div>Admin Content</div></RouteProtection>);
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });

  describe('Loaded state', () => {
    it('renders children and not skeleton after loading completes', () => {
      mockAuthState = { user: null, loading: false };
      mockPathname = '/';
      render(<RouteProtection><div>Visible Content</div></RouteProtection>);
      expect(screen.getByText('Visible Content')).toBeInTheDocument();
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });
  });

  describe('Billing lockout', () => {
    it('redirects locked admins from protected admin routes to billing', async () => {
      mockPathname = '/admin/dashboard';
      mockAuthState = { user: { role: 'Admin' }, loading: false };
      mockGetBillingStatus.mockResolvedValue({
        canAccessApp: false,
        accountLocked: true,
        trialStatus: 'expired',
      });

      render(<RouteProtection><div>Admin Dashboard</div></RouteProtection>);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/billing?reason=trial-ended');
      });
    });

    it('allows locked admins to stay on the billing page', async () => {
      mockPathname = '/admin/billing';
      mockAuthState = { user: { role: 'Admin' }, loading: false };
      mockGetBillingStatus.mockResolvedValue({
        canAccessApp: false,
        accountLocked: true,
        trialStatus: 'expired',
      });

      render(<RouteProtection><div>Billing Page</div></RouteProtection>);

      expect(screen.getByText('Billing Page')).toBeInTheDocument();
      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalledWith('/admin/billing?reason=trial-ended');
      });
    });
  });
});
