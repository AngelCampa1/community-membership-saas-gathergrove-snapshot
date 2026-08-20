/**
 * Tests for LazyLoadWrapper.tsx - Intelligent lazy loading wrapper (smoke tests)
 * Note: This component uses IntersectionObserver and Suspense
 * Full lazy loading and intersection observer testing deferred due to complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import LazyLoadWrapper from '../LazyLoadWrapper';

// Mock ErrorBoundary
jest.mock('../ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => <div data-testid="error-boundary">{children}</div>,
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver as any;

describe('LazyLoadWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smoke tests', () => {
    it('exports the LazyLoadWrapper component', () => {
      expect(LazyLoadWrapper).toBeDefined();
      expect(typeof LazyLoadWrapper).toBe('function');
    });

    it('has correct displayName', () => {
      expect(LazyLoadWrapper.name).toBe('LazyLoadWrapper');
    });
  });
});
