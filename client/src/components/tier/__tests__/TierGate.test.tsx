/**
 * Tests for TierGate.tsx - Tier-based feature gating (smoke tests)
 * Note: This component uses useTierValidation hook and complex tier logic
 * Full integration testing deferred due to hook mocking complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import { TierGate, withTierGate, useTierGate } from '../TierGate';
import { renderHook } from '@testing-library/react';

// Mock useTierValidation hook
jest.mock('@/hooks/useTierValidation', () => ({
  useTierValidation: () => ({
    currentTier: 'Grow',
    isLoading: false,
    error: null,
    validateFeatureAccess: jest.fn(() => Promise.resolve(true)),
    trackBlockedFeature: jest.fn(),
  }),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('TierGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  describe('Smoke tests', () => {
    it('renders without crashing', () => {
      expect(() =>
        render(
          <TierGate requiredTier="Basic">
            <div>Content</div>
          </TierGate>
        )
      ).not.toThrow();
    });

    it('accepts Seed as requiredTier', () => {
      expect(() =>
        render(
          <TierGate requiredTier="Seed">
            <div>Seed Content</div>
          </TierGate>
        )
      ).not.toThrow();
    });

    it('accepts requiredTier prop', () => {
      expect(() =>
        render(
          <TierGate requiredTier="Unlimited">
            <div>Content</div>
          </TierGate>
        )
      ).not.toThrow();
    });

    it('accepts feature prop', () => {
      expect(() =>
        render(
          <TierGate requiredTier="Grow" feature="Advanced Analytics">
            <div>Content</div>
          </TierGate>
        )
      ).not.toThrow();
    });

    it('accepts fallback prop', () => {
      expect(() =>
        render(
          <TierGate requiredTier="Grow" fallback={<div>Upgrade required</div>}>
            <div>Content</div>
          </TierGate>
        )
      ).not.toThrow();
    });

    it('accepts showUpgrade prop', () => {
      expect(() =>
        render(
          <TierGate requiredTier="Grow" showUpgrade={false}>
            <div>Content</div>
          </TierGate>
        )
      ).not.toThrow();
    });

    it('accepts blockRendering prop', () => {
      expect(() =>
        render(
          <TierGate requiredTier="Grow" blockRendering={false}>
            <div>Content</div>
          </TierGate>
        )
      ).not.toThrow();
    });

    it('accepts className prop', () => {
      expect(() =>
        render(
          <TierGate requiredTier="Grow" className="custom-class">
            <div>Content</div>
          </TierGate>
        )
      ).not.toThrow();
    });
  });

  describe('Higher-order component', () => {
    it('withTierGate wraps component without crashing', () => {
      const TestComponent = () => <div>Test</div>;
      const WrappedComponent = withTierGate(TestComponent, 'Grow');

      expect(() => render(<WrappedComponent />)).not.toThrow();
    });

    it('withTierGate sets display name', () => {
      const TestComponent = () => <div>Test</div>;
      TestComponent.displayName = 'TestComponent';
      const WrappedComponent = withTierGate(TestComponent, 'Grow');

      expect(WrappedComponent.displayName).toBe('withTierGate(TestComponent)');
    });
  });

  describe('Hook', () => {
    it('useTierGate returns hasAccess and isChecking', () => {
      const { result } = renderHook(() => useTierGate('Basic'));

      expect(result.current).toHaveProperty('hasAccess');
      expect(result.current).toHaveProperty('isChecking');
    });

    it('useTierGate accepts Seed as requiredTier', () => {
      const { result } = renderHook(() => useTierGate('Seed'));

      expect(result.current).toHaveProperty('hasAccess');
      expect(result.current).toHaveProperty('isChecking');
    });
  });
});
