/**
 * Tests for ProtectedRoute.tsx - Route protection with authentication (smoke tests)
 * Note: This component uses useAuth and useAuthorization hooks with Next.js navigation
 * Full integration testing deferred due to routing and redirect complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ProtectedRoute } from '../ProtectedRoute';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/test',
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User', role: 'Admin' },
    loading: false,
    isAuthenticated: true,
  }),
}));

// Mock useAuthorization hook
jest.mock('@/hooks/useAuthorization', () => ({
  useAuthorization: () => ({
    hasRole: jest.fn(() => true),
    hasAnyRole: jest.fn(() => true),
    hasTier: jest.fn(() => true),
    isAdmin: jest.fn(() => true),
    isMember: false,
    tier: 'Unlimited',
  }),
  UserRole: {
    Admin: 'Admin',
    Member: 'Member',
  },
  ClubTier: {
    Grow: 'Grow',
    Unlimited: 'Unlimited',
  },
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader">Loading...</div>,
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smoke tests', () => {
    it('renders without crashing', () => {
      expect(() => render(
        <ProtectedRoute>
          <div>Test Content</div>
        </ProtectedRoute>
      )).not.toThrow();
    });

    it('renders children when authenticated', () => {
      const { getByText } = render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      expect(getByText('Protected Content')).toBeInTheDocument();
    });

    it('accepts requiredRole prop', () => {
      expect(() => render(
        <ProtectedRoute requiredRole="Admin" as any>
          <div>Test Content</div>
        </ProtectedRoute>
      )).not.toThrow();
    });

    it('accepts requiredRoles prop', () => {
      expect(() => render(
        <ProtectedRoute requiredRoles={['Admin', 'Member'] as any}>
          <div>Test Content</div>
        </ProtectedRoute>
      )).not.toThrow();
    });

    it('accepts requiredTier prop', () => {
      expect(() => render(
        <ProtectedRoute requiredTier="Unlimited" as any>
          <div>Test Content</div>
        </ProtectedRoute>
      )).not.toThrow();
    });

    it('accepts requireAuth prop', () => {
      expect(() => render(
        <ProtectedRoute requireAuth={false}>
          <div>Test Content</div>
        </ProtectedRoute>
      )).not.toThrow();
    });

    it('accepts allowUnauthenticated prop', () => {
      expect(() => render(
        <ProtectedRoute allowUnauthenticated={true}>
          <div>Test Content</div>
        </ProtectedRoute>
      )).not.toThrow();
    });

    it('accepts redirectTo prop', () => {
      expect(() => render(
        <ProtectedRoute redirectTo="/custom-login">
          <div>Test Content</div>
        </ProtectedRoute>
      )).not.toThrow();
    });

    it('accepts loadingComponent prop', () => {
      expect(() => render(
        <ProtectedRoute loadingComponent={<div>Custom Loading...</div>}>
          <div>Test Content</div>
        </ProtectedRoute>
      )).not.toThrow();
    });

    it('accepts unauthorizedComponent prop', () => {
      expect(() => render(
        <ProtectedRoute unauthorizedComponent={<div>Unauthorized</div>}>
          <div>Test Content</div>
        </ProtectedRoute>
      )).not.toThrow();
    });
  });
});
