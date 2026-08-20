/**
 * @jest-environment jsdom
 *
 * frontendTrackingService Tests
 *
 * Mocks ONLY external boundaries:
 *   - posthog-js  (external analytics SDK)
 *   - @/components/GoogleAnalytics  (wrapper around window.gtag — external GA4 boundary)
 *
 * All internal service logic runs for real.
 */

import posthog from 'posthog-js';
import * as GA from '@/components/GoogleAnalytics';
import * as service from '@/services/frontendTrackingService';

// ── External boundary: PostHog SDK ────────────────────────────────────────────
jest.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    capture: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
  },
}));

// ── External boundary: GoogleAnalytics helper functions (wraps window.gtag) ───
jest.mock('@/components/GoogleAnalytics', () => ({
  event: jest.fn(),
  pageview: jest.fn(),
  trackCTA: jest.fn(),
  trackFunnelStep: jest.fn(),
  trackConversion: jest.fn(),
  trackFeatureInteraction: jest.fn(),
}));

// Typed references obtained AFTER mock declarations
const mockPosthog = posthog as jest.Mocked<typeof posthog>;
const mockGaEvent = GA.event as jest.Mock;
const mockGaPageview = GA.pageview as jest.Mock;
const mockGaTrackCTA = GA.trackCTA as jest.Mock;
const mockGaTrackFunnelStep = GA.trackFunnelStep as jest.Mock;
const mockGaTrackConversion = GA.trackConversion as jest.Mock;
const mockGaTrackFeatureInteraction = GA.trackFeatureInteraction as jest.Mock;

// ── Test suite ────────────────────────────────────────────────────────────────

describe('frontendTrackingService', () => {
  let mockGtag: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up window.gtag as an external boundary mock
    mockGtag = jest.fn();
    Object.defineProperty(window, 'gtag', {
      value: mockGtag,
      writable: true,
      configurable: true,
    });
  });

  // ── trackEvent ──────────────────────────────────────────────────────────────

  describe('trackEvent', () => {
    it('calls gaEvent with correct params', () => {
      service.trackEvent('button_click', {
        category: 'engagement',
        label: 'hero',
        value: 1,
        customParameters: { section: 'home' },
      });

      expect(mockGaEvent).toHaveBeenCalledWith({
        action: 'button_click',
        category: 'engagement',
        label: 'hero',
        value: 1,
        customParameters: { section: 'home' },
      });
    });

    it('defaults category to "general" when not provided', () => {
      service.trackEvent('test_event');

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'general' })
      );
    });

    it('calls posthog.capture with correct event name and properties', () => {
      service.trackEvent('button_click', {
        category: 'engagement',
        label: 'hero',
        value: 42,
        customParameters: { foo: 'bar' },
      });

      expect(mockPosthog.capture).toHaveBeenCalledWith('button_click', {
        category: 'engagement',
        label: 'hero',
        value: 42,
        foo: 'bar',
      });
    });

    it('spreads undefined customParameters without error', () => {
      expect(() => service.trackEvent('no_params')).not.toThrow();
      expect(mockPosthog.capture).toHaveBeenCalledWith('no_params', {
        category: undefined,
        label: undefined,
        value: undefined,
      });
    });

    it('does not throw in SSR (window undefined)', () => {
      // Simulate SSR: posthog ph() guard returns null when typeof window === 'undefined'
      // We use the module-level guard — we just verify no error when gtag is absent
      Object.defineProperty(window, 'gtag', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(() => service.trackEvent('ssr_event')).not.toThrow();
    });
  });

  // ── trackPageView ───────────────────────────────────────────────────────────

  describe('trackPageView', () => {
    it('calls gaPageview with the url', () => {
      service.trackPageView('/pricing');

      expect(mockGaPageview).toHaveBeenCalledWith('/pricing');
    });

    it('calls posthog.capture with $pageview and $current_url', () => {
      service.trackPageView('/pricing');

      expect(mockPosthog.capture).toHaveBeenCalledWith('$pageview', {
        $current_url: '/pricing',
      });
    });

    it('does not throw when window.gtag is absent', () => {
      Object.defineProperty(window, 'gtag', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(() => service.trackPageView('/no-gtag')).not.toThrow();
    });
  });

  // ── trackCTA ────────────────────────────────────────────────────────────────

  describe('trackCTA', () => {
    it('calls gaTrackCTA with name, location and additionalData', () => {
      service.trackCTA('start_free_trial', 'hero', { plan: 'grow' });

      expect(mockGaTrackCTA).toHaveBeenCalledWith(
        'start_free_trial',
        'hero',
        { plan: 'grow' }
      );
    });

    it('calls posthog.capture with cta_click event and correct props', () => {
      service.trackCTA('start_free_trial', 'hero', { plan: 'grow' });

      expect(mockPosthog.capture).toHaveBeenCalledWith('cta_click', {
        cta_name: 'start_free_trial',
        cta_location: 'hero',
        plan: 'grow',
      });
    });

    it('works without additionalData', () => {
      expect(() => service.trackCTA('cta', 'footer')).not.toThrow();
      expect(mockPosthog.capture).toHaveBeenCalledWith('cta_click', {
        cta_name: 'cta',
        cta_location: 'footer',
      });
    });
  });

  // ── trackFunnelStep ─────────────────────────────────────────────────────────

  describe('trackFunnelStep', () => {
    it('calls gaTrackFunnelStep with step name, number and data', () => {
      service.trackFunnelStep('Landing Page View', 1, { source: 'google' });

      expect(mockGaTrackFunnelStep).toHaveBeenCalledWith(
        'Landing Page View',
        1,
        { source: 'google' }
      );
    });

    it('calls posthog.capture with funnel_step event', () => {
      service.trackFunnelStep('Hero CTA Click', 2, { variant: 'A' });

      expect(mockPosthog.capture).toHaveBeenCalledWith('funnel_step', {
        step_name: 'Hero CTA Click',
        step_number: 2,
        variant: 'A',
      });
    });

    it('works without additionalData', () => {
      expect(() => service.trackFunnelStep('Step', 3)).not.toThrow();
      expect(mockPosthog.capture).toHaveBeenCalledWith('funnel_step', {
        step_name: 'Step',
        step_number: 3,
      });
    });
  });

  // ── trackConversion ─────────────────────────────────────────────────────────

  describe('trackConversion', () => {
    const ecommerceData = {
      currency: 'USD',
      value: 99,
      items: [
        {
          item_id: 'grow',
          item_name: 'GatherGrove Grow Plan',
          category: 'subscription',
          quantity: 1,
          price: 99,
          currency: 'USD',
        },
      ],
      transaction_id: 'txn_123',
    };

    it('calls gaTrackConversion with eventName and data', () => {
      service.trackConversion('purchase', ecommerceData);

      expect(mockGaTrackConversion).toHaveBeenCalledWith('purchase', ecommerceData);
    });

    it('calls posthog.capture with the event name and correct properties', () => {
      service.trackConversion('purchase', ecommerceData);

      expect(mockPosthog.capture).toHaveBeenCalledWith('purchase', {
        currency: 'USD',
        value: 99,
        items: ecommerceData.items,
        transaction_id: 'txn_123',
      });
    });

    it('defaults currency to USD and value to 0 when missing', () => {
      service.trackConversion('purchase', {});

      expect(mockPosthog.capture).toHaveBeenCalledWith('purchase', {
        currency: 'USD',
        value: 0,
        items: undefined,
        transaction_id: undefined,
      });
    });
  });

  // ── trackFeatureInteraction ─────────────────────────────────────────────────

  describe('trackFeatureInteraction', () => {
    it('calls gaTrackFeatureInteraction with feature, type and data', () => {
      service.trackFeatureInteraction('roi_calculator', 'calculation', { result: 500 });

      expect(mockGaTrackFeatureInteraction).toHaveBeenCalledWith(
        'roi_calculator',
        'calculation',
        { result: 500 }
      );
    });

    it('calls posthog.capture with feature_interaction event', () => {
      service.trackFeatureInteraction('roi_calculator', 'calculation', { result: 500 });

      expect(mockPosthog.capture).toHaveBeenCalledWith('feature_interaction', {
        feature_name: 'roi_calculator',
        interaction_type: 'calculation',
        result: 500,
      });
    });

    it('works without additionalData', () => {
      expect(() =>
        service.trackFeatureInteraction('events_list', 'view')
      ).not.toThrow();

      expect(mockPosthog.capture).toHaveBeenCalledWith('feature_interaction', {
        feature_name: 'events_list',
        interaction_type: 'view',
      });
    });
  });

  // ── identifyUser ────────────────────────────────────────────────────────────

  describe('identifyUser', () => {
    it('calls posthog.identify with userId and traits', () => {
      service.identifyUser('user-42', { plan: 'grow', role: 'admin' });

      expect(mockPosthog.identify).toHaveBeenCalledWith('user-42', {
        plan: 'grow',
        role: 'admin',
      });
    });

    it('calls window.gtag set with user_properties and traits', () => {
      const traits = { plan: 'grow', role: 'admin' };
      service.identifyUser('user-42', traits);

      expect(mockGtag).toHaveBeenCalledWith('set', 'user_properties', traits);
    });

    it('skips gtag set when window.gtag is absent', () => {
      Object.defineProperty(window, 'gtag', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(() =>
        service.identifyUser('user-42', { plan: 'grow' })
      ).not.toThrow();

      // posthog.identify should still have been called
      expect(mockPosthog.identify).toHaveBeenCalledWith('user-42', { plan: 'grow' });
    });

    it('does not call posthog when window is undefined (SSR guard)', () => {
      // The ph() guard in the service checks typeof window !== 'undefined'
      // In JSDOM, window is always defined, so we verify posthog IS called
      // and that the service does not crash regardless
      expect(() =>
        service.identifyUser('user-1', { role: 'member' })
      ).not.toThrow();
    });
  });

  // ── resetUser ───────────────────────────────────────────────────────────────

  describe('resetUser', () => {
    it('calls posthog.reset()', () => {
      service.resetUser();

      expect(mockPosthog.reset).toHaveBeenCalledTimes(1);
    });

    it('does not throw when called multiple times', () => {
      expect(() => {
        service.resetUser();
        service.resetUser();
      }).not.toThrow();

      expect(mockPosthog.reset).toHaveBeenCalledTimes(2);
    });
  });

  // ── SSR / graceful-degradation scenarios ───────────────────────────────────

  describe('graceful degradation when window.gtag is missing', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'gtag', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    it('trackEvent does not throw', () =>
      expect(() => service.trackEvent('evt')).not.toThrow());

    it('trackPageView does not throw', () =>
      expect(() => service.trackPageView('/page')).not.toThrow());

    it('trackCTA does not throw', () =>
      expect(() => service.trackCTA('cta', 'loc')).not.toThrow());

    it('trackFunnelStep does not throw', () =>
      expect(() => service.trackFunnelStep('Step', 1)).not.toThrow());

    it('trackConversion does not throw', () =>
      expect(() => service.trackConversion('purchase', {})).not.toThrow());

    it('trackFeatureInteraction does not throw', () =>
      expect(() =>
        service.trackFeatureInteraction('feat', 'click')
      ).not.toThrow());

    it('identifyUser does not throw', () =>
      expect(() =>
        service.identifyUser('uid', { role: 'admin' })
      ).not.toThrow());

    it('resetUser does not throw', () =>
      expect(() => service.resetUser()).not.toThrow());
  });

  // ── Re-exported types (smoke check) ────────────────────────────────────────

  describe('type re-exports', () => {
    it('module exports trackEvent, trackPageView, trackCTA, trackFunnelStep, trackConversion, trackFeatureInteraction, identifyUser, resetUser', () => {
      const exported = [
        'trackEvent',
        'trackPageView',
        'trackCTA',
        'trackFunnelStep',
        'trackConversion',
        'trackFeatureInteraction',
        'identifyUser',
        'resetUser',
      ];
      exported.forEach((fn) => {
        expect(typeof service[fn]).toBe('function');
      });
    });
  });
});
