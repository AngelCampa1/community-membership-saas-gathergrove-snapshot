/**
 * Tests for LoadingSpinner.tsx - Advanced loading component (smoke tests)
 * Note: This component has multiple variants (spinner, dots, pulse, bars, skeleton)
 * Full animation and accessibility testing deferred due to complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smoke tests', () => {
    it('renders without crashing', () => {
      expect(() => render(<LoadingSpinner />)).not.toThrow();
    });

    it('accepts size prop', () => {
      expect(() => render(<LoadingSpinner size="sm" />)).not.toThrow();
      expect(() => render(<LoadingSpinner size="md" />)).not.toThrow();
      expect(() => render(<LoadingSpinner size="lg" />)).not.toThrow();
      expect(() => render(<LoadingSpinner size="xl" />)).not.toThrow();
    });

    it('accepts variant prop', () => {
      expect(() => render(<LoadingSpinner variant="spinner" />)).not.toThrow();
      expect(() => render(<LoadingSpinner variant="dots" />)).not.toThrow();
      expect(() => render(<LoadingSpinner variant="pulse" />)).not.toThrow();
      expect(() => render(<LoadingSpinner variant="bars" />)).not.toThrow();
      expect(() => render(<LoadingSpinner variant="skeleton" />)).not.toThrow();
    });

    it('accepts color prop', () => {
      expect(() => render(<LoadingSpinner color="primary" />)).not.toThrow();
      expect(() => render(<LoadingSpinner color="secondary" />)).not.toThrow();
      expect(() => render(<LoadingSpinner color="accent" />)).not.toThrow();
      expect(() => render(<LoadingSpinner color="muted" />)).not.toThrow();
    });

    it('accepts label prop', () => {
      expect(() => render(<LoadingSpinner label="Loading..." />)).not.toThrow();
    });

    it('accepts delay prop', () => {
      expect(() => render(<LoadingSpinner delay={500} />)).not.toThrow();
    });

    it('accepts className prop', () => {
      expect(() => render(<LoadingSpinner className="custom-class" />)).not.toThrow();
    });

    it('accepts data-testid prop', () => {
      const { getByTestId } = render(<LoadingSpinner data-testid="custom-spinner" />);
      expect(getByTestId('custom-spinner')).toBeInTheDocument();
    });

    it('renders with multiple props combined', () => {
      expect(() => render(
        <LoadingSpinner
          size="lg"
          variant="dots"
          color="primary"
          label="Loading data..."
          delay={300}
          className="my-custom-spinner"
          data-testid="combined-spinner"
        />
      )).not.toThrow();
    });
  });
});
