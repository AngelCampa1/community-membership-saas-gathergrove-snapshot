/**
 * Tests for SmartCTABanner.tsx - Smart CTA banner component (smoke tests)
 * Note: This component has scroll-triggered CTAs with analytics
 * Full scroll behavior and timing testing deferred due to complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import { SmartCTABanner } from '../SmartCTABanner';

// Mock services
jest.mock('@/services/ctaAnalyticsService', () => ({
  ctaAnalyticsService: {
    trackView: jest.fn(),
    trackClick: jest.fn(),
    trackDismiss: jest.fn(),
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

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
  ArrowRight: () => <div data-testid="arrow-icon">ArrowRight</div>,
}));

describe('SmartCTABanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smoke tests', () => {
    it('renders without crashing', () => {
      expect(() => render(<SmartCTABanner />)).not.toThrow();
    });

    it('accepts onOpenDemoVideo prop', () => {
      expect(() => render(
        <SmartCTABanner onOpenDemoVideo={jest.fn()} />
      )).not.toThrow();
    });

    it('accepts onOpenLeadMagnet prop', () => {
      expect(() => render(
        <SmartCTABanner onOpenLeadMagnet={jest.fn()} />
      )).not.toThrow();
    });

    it('accepts onOpenConsultation prop', () => {
      expect(() => render(
        <SmartCTABanner onOpenConsultation={jest.fn()} />
      )).not.toThrow();
    });

    it('renders with all props combined', () => {
      expect(() => render(
        <SmartCTABanner
          onOpenDemoVideo={jest.fn()}
          onOpenLeadMagnet={jest.fn()}
          onOpenConsultation={jest.fn()}
        />
      )).not.toThrow();
    });

    it('exports the SmartCTABanner component', () => {
      expect(SmartCTABanner).toBeDefined();
      expect(typeof SmartCTABanner).toBe('function');
    });

    it('has correct component name', () => {
      expect(SmartCTABanner.name).toBe('SmartCTABanner');
    });
  });
});
