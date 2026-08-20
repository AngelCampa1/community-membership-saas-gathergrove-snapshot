/**
 * Tests for ProgressiveEngagement.tsx - User engagement tracking (smoke tests)
 * Note: This component uses complex state management and localStorage
 * Full integration testing deferred due to timer/storage complexity
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ProgressiveEngagementProvider, useProgressiveEngagement } from '../ProgressiveEngagement';

// Mock marketingService
jest.mock('@/services/marketingService', () => ({
  marketingService: {
    trackEvent: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock engagement-timing config
jest.mock('@/config/engagement-timing', () => ({
  SESSION_STORAGE_KEYS: {
    lastVisit: 'gathergrove-last-visit',
    exitIntentShown: 'gathergrove-exit-intent-shown',
  },
}));

// Mock CTA configs
jest.mock('@/lib/ctaConfig', () => ({
  CTA_CONFIGS: {
    'primary-start-free': { id: 'primary-start-free', text: 'Start Free' },
    'primary-create-club': { id: 'primary-create-club', text: 'Create Club' },
    'primary-get-started': { id: 'primary-get-started', text: 'Get Started' },
    'secondary-watch-demo': { id: 'secondary-watch-demo', text: 'Watch Demo' },
    'tertiary-download-guide': { id: 'tertiary-download-guide', text: 'Download Guide' },
  },
}));

describe('ProgressiveEngagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Provider rendering', () => {
    it('renders children', () => {
      const { getByText } = render(
        <ProgressiveEngagementProvider>
          <div>Test Content</div>
        </ProgressiveEngagementProvider>
      );

      expect(getByText('Test Content')).toBeInTheDocument();
    });

    it('renders without crashing', () => {
      expect(() =>
        render(
          <ProgressiveEngagementProvider>
            <div>Test</div>
          </ProgressiveEngagementProvider>
        )
      ).not.toThrow();
    });
  });

  describe('Hook usage', () => {
    it('provides engagement context', () => {
      const TestComponent = () => {
        const { engagementData } = useProgressiveEngagement();
        return <div data-testid="stage">{engagementData.stage}</div>;
      };

      const { getByTestId } = render(
        <ProgressiveEngagementProvider>
          <TestComponent />
        </ProgressiveEngagementProvider>
      );

      expect(getByTestId('stage')).toHaveTextContent('awareness');
    });

    it('provides updateEngagement function', () => {
      const TestComponent = () => {
        const { updateEngagement } = useProgressiveEngagement();
        return <button onClick={() => updateEngagement({ ctaClicks: 1 })}>Update</button>;
      };

      expect(() =>
        render(
          <ProgressiveEngagementProvider>
            <TestComponent />
          </ProgressiveEngagementProvider>
        )
      ).not.toThrow();
    });

    it('provides getRecommendedCTA function', () => {
      const TestComponent = () => {
        const { getRecommendedCTA } = useProgressiveEngagement();
        const cta = getRecommendedCTA('hero');
        return <div>{cta?.text || 'No CTA'}</div>;
      };

      const { container } = render(
        <ProgressiveEngagementProvider>
          <TestComponent />
        </ProgressiveEngagementProvider>
      );

      expect(container).toBeInTheDocument();
    });

    it('provides recordInteraction function', () => {
      const TestComponent = () => {
        const { recordInteraction } = useProgressiveEngagement();
        return <button onClick={() => recordInteraction('click')}>Click</button>;
      };

      expect(() =>
        render(
          <ProgressiveEngagementProvider>
            <TestComponent />
          </ProgressiveEngagementProvider>
        )
      ).not.toThrow();
    });

    it('throws error when used outside provider', () => {
      const TestComponent = () => {
        try {
          useProgressiveEngagement();
          return <div>Should not render</div>;
        } catch (error) {
          return <div>Error caught</div>;
        }
      };

      const { getByText } = render(<TestComponent />);

      expect(getByText('Error caught')).toBeInTheDocument();
    });
  });
});
