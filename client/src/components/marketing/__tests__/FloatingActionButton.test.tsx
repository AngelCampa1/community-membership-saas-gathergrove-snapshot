/**
 * Tests for FloatingActionButton.tsx - Floating CTA (smoke tests)
 * Note: This component uses framer-motion and complex device detection
 * Full integration testing deferred due to mocking complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import { FloatingActionButton } from '../FloatingActionButton';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock useDeviceDetection
jest.mock('@/hooks/useDeviceDetection', () => ({
  useDeviceDetection: () => ({
    isMobile: false,
    isTouchDevice: false,
    isDesktop: true,
  }),
}));

// Mock MultiTierCTA
jest.mock('@/components/shared/MultiTierCTA', () => ({
  MultiTierCTA: ({ config }: any) => <button>{config?.text || 'CTA'}</button>,
}));

// Mock ctaConfig
jest.mock('@/lib/ctaConfig', () => ({
  CTA_CONFIGS: {
    'primary-start-free': { id: 'primary-start-free', text: 'Start Free', href: '/register' },
    'secondary-watch-demo': { id: 'secondary-watch-demo', text: 'Watch Demo' },
    'tertiary-download-guide': { id: 'tertiary-download-guide', text: 'Download Guide' },
  },
}));

describe('FloatingActionButton', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Smoke tests', () => {
    it('renders without crashing', () => {
      const { container } = render(<FloatingActionButton />);
      expect(container).toBeInTheDocument();
    });

    it('does not render initially', () => {
      const { container } = render(<FloatingActionButton showAfterTime={30000} />);

      // Should not be visible before time threshold
      expect(container.querySelector('button')).not.toBeInTheDocument();
    });

    it('accepts showAfterScroll prop', () => {
      expect(() => render(<FloatingActionButton showAfterScroll={50} />)).not.toThrow();
    });

    it('accepts showAfterTime prop', () => {
      expect(() => render(<FloatingActionButton showAfterTime={60000} />)).not.toThrow();
    });

    it('accepts className prop', () => {
      expect(() => render(<FloatingActionButton className="custom-class" />)).not.toThrow();
    });

    it('accepts position prop', () => {
      expect(() => render(<FloatingActionButton position="bottom-left" />)).not.toThrow();
    });
  });
});
