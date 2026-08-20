/**
 * Tests for ErrorBoundary.tsx - Comprehensive error boundary (smoke tests)
 * Note: This is a class component with error lifecycle methods
 * Full error handling and recovery testing deferred due to complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon">AlertTriangle</div>,
  RefreshCw: () => <div data-testid="refresh-icon">RefreshCw</div>,
  Home: () => <div data-testid="home-icon">Home</div>,
}));

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for error boundary tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('Smoke tests', () => {
    it('renders without crashing', () => {
      expect(() => render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      )).not.toThrow();
    });

    it('renders children when no error', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <div>Protected Content</div>
        </ErrorBoundary>
      );
      expect(getByText('Protected Content')).toBeInTheDocument();
    });

    it('accepts fallback prop', () => {
      expect(() => render(
        <ErrorBoundary fallback={<div>Custom Fallback</div>}>
          <div>Test Content</div>
        </ErrorBoundary>
      )).not.toThrow();
    });

    it('accepts onError prop', () => {
      const onError = jest.fn();
      expect(() => render(
        <ErrorBoundary onError={onError}>
          <div>Test Content</div>
        </ErrorBoundary>
      )).not.toThrow();
    });

    it('accepts onReset prop', () => {
      const onReset = jest.fn();
      expect(() => render(
        <ErrorBoundary onReset={onReset}>
          <div>Test Content</div>
        </ErrorBoundary>
      )).not.toThrow();
    });

    it('accepts resetKeys prop', () => {
      expect(() => render(
        <ErrorBoundary resetKeys={['key1', 'key2']}>
          <div>Test Content</div>
        </ErrorBoundary>
      )).not.toThrow();
    });

    it('accepts showDetails prop', () => {
      expect(() => render(
        <ErrorBoundary showDetails={true}>
          <div>Test Content</div>
        </ErrorBoundary>
      )).not.toThrow();
    });

    it('accepts multiple props combined', () => {
      expect(() => render(
        <ErrorBoundary
          fallback={<div>Custom Fallback</div>}
          onError={jest.fn()}
          onReset={jest.fn()}
          resetKeys={['key1']}
          showDetails={true}
        >
          <div>Test Content</div>
        </ErrorBoundary>
      )).not.toThrow();
    });
  });
});
