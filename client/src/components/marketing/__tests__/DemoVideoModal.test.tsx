/**
 * Tests for DemoVideoModal.tsx - Demo video modal (smoke tests)
 * Note: This component uses RadixUI Dialog and complex analytics tracking
 * Full integration testing deferred due to Dialog mock complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import { DemoVideoModal } from '../DemoVideoModal';

// Mock ctaAnalyticsService
jest.mock('@/services/ctaAnalyticsService', () => ({
  ctaAnalyticsService: {
    recordClick: jest.fn(),
    recordConversion: jest.fn(),
  },
}));

describe('DemoVideoModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  describe('Smoke tests', () => {
    it('renders when open', () => {
      const { getByRole } = render(
        <DemoVideoModal isOpen={true} onClose={jest.fn()} />
      );

      expect(getByRole('dialog')).toBeInTheDocument();
    });

    it('renders modal title', () => {
      const { getByText } = render(
        <DemoVideoModal isOpen={true} onClose={jest.fn()} />
      );

      expect(getByText(/gathergrove demo/i)).toBeInTheDocument();
    });

    it('renders without crashing', () => {
      expect(() =>
        render(<DemoVideoModal isOpen={true} onClose={jest.fn()} />)
      ).not.toThrow();
    });

    it('accepts ctaId prop', () => {
      expect(() =>
        render(
          <DemoVideoModal isOpen={true} onClose={jest.fn()} ctaId="test-id" />
        )
      ).not.toThrow();
    });

    it('accepts onClose prop', () => {
      const onClose = jest.fn();
      expect(() =>
        render(<DemoVideoModal isOpen={true} onClose={onClose} />)
      ).not.toThrow();
    });

    it('provides close button', () => {
      const { container } = render(
        <DemoVideoModal isOpen={true} onClose={jest.fn()} />
      );

      const closeButton = container.querySelector('button');
      expect(closeButton).toBeInTheDocument();
    });
  });
});
