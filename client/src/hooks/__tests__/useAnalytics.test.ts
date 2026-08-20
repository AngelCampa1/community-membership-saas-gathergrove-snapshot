/**
 * @jest-environment jsdom
 *
 * useAnalytics hook tests
 *
 * Boundary-mocking strategy (CLAUDE.md rules):
 *   - posthog-js         → external SDK boundary  ✅ mocked
 *   - @/components/GoogleAnalytics → external GA4 boundary ✅ mocked
 *   - frontendTrackingService   → internal module  ❌ NOT mocked (runs for real)
 *   - useAnalytics hook         → internal module  ❌ NOT mocked (runs for real)
 *
 * By mocking only the two external leaves the full internal call chain
 * (useAnalytics → frontendTrackingService → posthog / GA) is exercised.
 */

import { renderHook, act } from '@testing-library/react';
import posthog from 'posthog-js';
import * as GA from '@/components/GoogleAnalytics';

// ── External boundary: PostHog SDK ────────────────────────────────────────────
jest.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    capture: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
  },
}));

// ── External boundary: GoogleAnalytics helper functions ───────────────────────
jest.mock('@/components/GoogleAnalytics', () => ({
  event: jest.fn(),
  pageview: jest.fn(),
  trackCTA: jest.fn(),
  trackFunnelStep: jest.fn(),
  trackConversion: jest.fn(),
  trackFeatureInteraction: jest.fn(),
}));

// Typed references (resolved after mock declarations)
const mockPosthog = posthog as jest.Mocked<typeof posthog>;
const mockGaEvent = GA.event as jest.Mock;
const mockGaPageview = GA.pageview as jest.Mock;
const mockGaTrackCTA = GA.trackCTA as jest.Mock;
const mockGaTrackFunnelStep = GA.trackFunnelStep as jest.Mock;
const mockGaTrackConversion = GA.trackConversion as jest.Mock;
const mockGaTrackFeatureInteraction = GA.trackFeatureInteraction as jest.Mock;

// Import after mocks are set up
import { useAnalytics, CONVERSION_FUNNEL_STEPS } from '@/hooks/useAnalytics';

// ── Test suite ────────────────────────────────────────────────────────────────

describe('useAnalytics', () => {
  let mockGtag: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // window.gtag external boundary
    mockGtag = jest.fn();
    Object.defineProperty(window, 'gtag', {
      value: mockGtag,
      writable: true,
      configurable: true,
    });
  });

  // ── CONVERSION_FUNNEL_STEPS constant ────────────────────────────────────────

  describe('CONVERSION_FUNNEL_STEPS', () => {
    it('has exactly 10 steps', () => {
      expect(Object.keys(CONVERSION_FUNNEL_STEPS)).toHaveLength(10);
    });

    it('steps are numbered 1-10 in order', () => {
      const steps = Object.values(CONVERSION_FUNNEL_STEPS).map((s) => s.step);
      expect(steps).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('has correct step names', () => {
      expect(CONVERSION_FUNNEL_STEPS.LANDING_PAGE_VIEW.name).toBe('Landing Page View');
      expect(CONVERSION_FUNNEL_STEPS.HERO_CTA_CLICK.name).toBe('Hero CTA Click');
      expect(CONVERSION_FUNNEL_STEPS.FEATURE_EXPLORATION.name).toBe('Feature Exploration');
      expect(CONVERSION_FUNNEL_STEPS.PRICING_VIEW.name).toBe('Pricing Section View');
      expect(CONVERSION_FUNNEL_STEPS.PRICING_INTERACTION.name).toBe('Pricing Interaction');
      expect(CONVERSION_FUNNEL_STEPS.TRIAL_SIGNUP_START.name).toBe('Trial Signup Start');
      expect(CONVERSION_FUNNEL_STEPS.FORM_COMPLETION.name).toBe('Form Completion');
      expect(CONVERSION_FUNNEL_STEPS.ACCOUNT_CREATION.name).toBe('Account Creation');
      expect(CONVERSION_FUNNEL_STEPS.EMAIL_CONFIRMATION.name).toBe('Email Confirmation');
      expect(CONVERSION_FUNNEL_STEPS.FIRST_LOGIN.name).toBe('First Login');
    });
  });

  // ── trackHeroInteraction ────────────────────────────────────────────────────

  describe('trackHeroInteraction', () => {
    it('tracks hero_interaction event with correct properties', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackHeroInteraction('video_play');
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'hero_interaction',
          category: 'engagement',
          label: 'video_play',
        })
      );
      expect(mockPosthog.capture).toHaveBeenCalledWith(
        'hero_interaction',
        expect.objectContaining({
          category: 'engagement',
          label: 'video_play',
        })
      );
    });

    it('also tracks HERO_CTA_CLICK funnel step when action is cta_click', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackHeroInteraction('cta_click');
      });

      // Should have fired: hero_interaction event + HERO_CTA_CLICK funnel step
      expect(mockGaTrackFunnelStep).toHaveBeenCalledWith(
        'Hero CTA Click',
        2,
        undefined
      );
      expect(mockPosthog.capture).toHaveBeenCalledWith(
        'funnel_step',
        expect.objectContaining({
          step_name: 'Hero CTA Click',
          step_number: 2,
        })
      );
    });

    it('does NOT track funnel step for non-cta actions', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackHeroInteraction('scroll');
      });

      // funnel_step capture should not have been called with HERO_CTA_CLICK
      const funnelCalls = (mockPosthog.capture as jest.Mock).mock.calls.filter(
        ([name]) => name === 'funnel_step'
      );
      expect(funnelCalls).toHaveLength(0);
      expect(mockGaTrackFunnelStep).not.toHaveBeenCalled();
    });

    it('passes additionalData through to cta_click funnel step', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackHeroInteraction('cta_click', { variant: 'B' });
      });

      expect(mockGaTrackFunnelStep).toHaveBeenCalledWith(
        'Hero CTA Click',
        2,
        { variant: 'B' }
      );
    });
  });

  // ── trackPricingInteraction ─────────────────────────────────────────────────

  describe('trackPricingInteraction', () => {
    it('tracks pricing_interaction event with all parameters', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackPricingInteraction('billing_toggle', 'grow', 5);
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'pricing_interaction',
          category: 'engagement',
          label: 'billing_toggle',
          value: 5,
          customParameters: expect.objectContaining({
            section: 'pricing',
            interaction: 'billing_toggle',
            plan_type: 'grow',
            member_count: 5,
          }),
        })
      );
    });

    it('captures pricing_interaction in posthog', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackPricingInteraction('billing_toggle', 'grow', 5);
      });

      expect(mockPosthog.capture).toHaveBeenCalledWith(
        'pricing_interaction',
        expect.objectContaining({
          category: 'engagement',
          label: 'billing_toggle',
          value: 5,
        })
      );
    });

    it('also tracks PRICING_INTERACTION funnel step', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackPricingInteraction('plan_click', 'starter');
      });

      expect(mockGaTrackFunnelStep).toHaveBeenCalledWith(
        'Pricing Interaction',
        5,
        expect.objectContaining({ interaction: 'plan_click', plan_type: 'starter' })
      );
    });

    it('omits plan_type and member_count when not provided', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackPricingInteraction('view');
      });

      // customParameters should not contain plan_type or member_count keys
      const call = mockGaEvent.mock.calls[0][0];
      expect(call.customParameters).not.toHaveProperty('plan_type');
      expect(call.customParameters).not.toHaveProperty('member_count');
    });
  });

  // ── trackFunnel (generic) ───────────────────────────────────────────────────

  describe('trackFunnel', () => {
    it('tracks PRICING_VIEW funnel step (step 4)', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackFunnel('PRICING_VIEW');
      });

      expect(mockGaTrackFunnelStep).toHaveBeenCalledWith(
        'Pricing Section View',
        4,
        undefined
      );
      expect(mockPosthog.capture).toHaveBeenCalledWith(
        'funnel_step',
        expect.objectContaining({
          step_name: 'Pricing Section View',
          step_number: 4,
        })
      );
    });

    it('passes additionalData to the funnel step', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackFunnel('LANDING_PAGE_VIEW', { referrer: 'google' });
      });

      expect(mockGaTrackFunnelStep).toHaveBeenCalledWith(
        'Landing Page View',
        1,
        { referrer: 'google' }
      );
    });

    it('can track every defined funnel key without throwing', () => {
      const { result } = renderHook(() => useAnalytics());

      Object.keys(CONVERSION_FUNNEL_STEPS).forEach((key) => {
        expect(() => {
          act(() => {
            result.current.trackFunnel(key as keyof typeof CONVERSION_FUNNEL_STEPS);
          });
        }).not.toThrow();
      });
    });
  });

  // ── trackSignup ─────────────────────────────────────────────────────────────

  describe('trackSignup', () => {
    it('tracks sign_up event with method', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackSignup('email');
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'sign_up',
          category: 'engagement',
          label: 'email',
        })
      );
      expect(mockPosthog.capture).toHaveBeenCalledWith(
        'sign_up',
        expect.objectContaining({ category: 'engagement', label: 'email' })
      );
    });

    it('tracks ACCOUNT_CREATION funnel step (step 8)', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackSignup('google');
      });

      expect(mockGaTrackFunnelStep).toHaveBeenCalledWith(
        'Account Creation',
        8,
        { method: 'google' }
      );
      expect(mockPosthog.capture).toHaveBeenCalledWith(
        'funnel_step',
        expect.objectContaining({
          step_name: 'Account Creation',
          step_number: 8,
          method: 'google',
        })
      );
    });
  });

  // ── trackLogin ──────────────────────────────────────────────────────────────

  describe('trackLogin', () => {
    it('tracks login event with method', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackLogin('google');
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login',
          category: 'engagement',
          label: 'google',
        })
      );
      expect(mockPosthog.capture).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({ category: 'engagement', label: 'google' })
      );
    });

    it('tracks FIRST_LOGIN funnel step (step 10)', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackLogin('email');
      });

      expect(mockGaTrackFunnelStep).toHaveBeenCalledWith(
        'First Login',
        10,
        { method: 'email' }
      );
      expect(mockPosthog.capture).toHaveBeenCalledWith(
        'funnel_step',
        expect.objectContaining({
          step_name: 'First Login',
          step_number: 10,
          method: 'email',
        })
      );
    });
  });

  // ── trackScrollDepth ────────────────────────────────────────────────────────

  describe('trackScrollDepth', () => {
    it('fires scroll_depth event at 50% milestone when depth is 60', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackScrollDepth(60, '/pricing');
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'scroll_depth',
          category: 'engagement',
          label: '50%',
          value: 50,
          customParameters: expect.objectContaining({
            page: '/pricing',
            depth: 50,
          }),
        })
      );
      expect(mockPosthog.capture).toHaveBeenCalledWith(
        'scroll_depth',
        expect.objectContaining({ value: 50 })
      );
    });

    it('does NOT fire any event when depth is below 25%', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackScrollDepth(20, '/pricing');
      });

      expect(mockGaEvent).not.toHaveBeenCalled();
      expect(mockPosthog.capture).not.toHaveBeenCalled();
    });

    it('fires at 25% milestone when depth is exactly 25', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackScrollDepth(25, '/home');
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({ value: 25 })
      );
    });

    it('fires at 75% milestone when depth is 80', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackScrollDepth(80, '/home');
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({ value: 75 })
      );
    });

    it('fires at 100% milestone when depth is 100', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackScrollDepth(100, '/home');
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({ value: 100 })
      );
    });

    it('does not fire when depth is 24 (just below 25 threshold)', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackScrollDepth(24, '/home');
      });

      expect(mockGaEvent).not.toHaveBeenCalled();
    });
  });

  // ── trackTimeOnPage ─────────────────────────────────────────────────────────

  describe('trackTimeOnPage', () => {
    // Implementation uses [...milestones].reverse().find(m => seconds >= m) on [30, 60, 120, 300],
    // which returns the HIGHEST milestone reached.
    // So 90s → 60s milestone, 150s → 120s milestone, 350s → 300s milestone.

    it('fires time_on_page at 60s milestone when seconds is 90', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackTimeOnPage(90, '/home');
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'time_on_page',
          category: 'engagement',
          label: '60s',
          value: 60,
          customParameters: expect.objectContaining({
            page: '/home',
            time_spent: 60,
          }),
        })
      );
      expect(mockPosthog.capture).toHaveBeenCalledWith(
        'time_on_page',
        expect.objectContaining({ value: 60 })
      );
    });

    it('fires at 30s milestone when seconds is exactly 30', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackTimeOnPage(30, '/pricing');
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({ value: 30, label: '30s' })
      );
    });

    it('fires at 120s milestone when seconds is 150', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackTimeOnPage(150, '/features');
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({ value: 120, label: '120s' })
      );
    });

    it('fires at 300s milestone when seconds is 350', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackTimeOnPage(350, '/home');
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({ value: 300, label: '300s' })
      );
    });

    it('does NOT fire when seconds is below 30', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackTimeOnPage(10, '/home');
      });

      expect(mockGaEvent).not.toHaveBeenCalled();
      expect(mockPosthog.capture).not.toHaveBeenCalled();
    });

    it('does NOT fire when seconds is 29', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackTimeOnPage(29, '/home');
      });

      expect(mockGaEvent).not.toHaveBeenCalled();
    });
  });

  // ── identifyCurrentUser ─────────────────────────────────────────────────────

  describe('identifyCurrentUser', () => {
    it('delegates to posthog.identify with userId and traits', () => {
      const { result } = renderHook(() => useAnalytics());
      const traits = { plan: 'grow', role: 'admin' as const };

      act(() => {
        result.current.identifyCurrentUser('user-42', traits);
      });

      expect(mockPosthog.identify).toHaveBeenCalledWith('user-42', traits);
    });

    it('also calls window.gtag set user_properties', () => {
      const { result } = renderHook(() => useAnalytics());
      const traits = { plan: 'starter' as const };

      act(() => {
        result.current.identifyCurrentUser('u-1', traits);
      });

      expect(mockGtag).toHaveBeenCalledWith('set', 'user_properties', traits);
    });
  });

  // ── resetCurrentUser ────────────────────────────────────────────────────────

  describe('resetCurrentUser', () => {
    it('delegates to posthog.reset()', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.resetCurrentUser();
      });

      expect(mockPosthog.reset).toHaveBeenCalledTimes(1);
    });
  });

  // ── Method reference stability ──────────────────────────────────────────────

  describe('method stability across re-renders', () => {
    it('callback references are stable (useCallback)', () => {
      const { result, rerender } = renderHook(() => useAnalytics());

      const first = { ...result.current };
      rerender();
      const second = { ...result.current };

      const methods = [
        'trackEvent',
        'trackPageView',
        'trackCTAClick',
        'trackFeature',
        'trackFunnel',
        'trackConversionEvent',
        'trackHeroInteraction',
        'trackPricingInteraction',
        'trackROICalculatorInteraction',
        'trackFeatureSectionView',
        'trackFormInteraction',
        'trackScrollDepth',
        'trackTimeOnPage',
        'trackSignup',
        'trackLogin',
        'trackSubscriptionStart',
        'trackPurchase',
        'trackFeatureUse',
        'trackError',
        'trackSearch',
        'trackShare',
        'trackTiming',
        'identifyCurrentUser',
        'resetCurrentUser',
      ] as const;

      methods.forEach((method) => {
        expect(first[method]).toBe(second[method]);
      });
    });
  });

  // ── Additional coverage: remaining public methods ───────────────────────────

  describe('trackPageView', () => {
    it('calls gaPageview with url', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackPageView('/home');
      });

      expect(mockGaPageview).toHaveBeenCalledWith('/home');
      expect(mockPosthog.capture).toHaveBeenCalledWith('$pageview', {
        $current_url: '/home',
      });
    });
  });

  describe('trackCTAClick', () => {
    it('calls GA trackCTA with name, location and additionalData', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackCTAClick('get_started', 'navbar', { variant: 'primary' });
      });

      expect(mockGaTrackCTA).toHaveBeenCalledWith(
        'get_started',
        'navbar',
        { variant: 'primary' }
      );
      expect(mockPosthog.capture).toHaveBeenCalledWith(
        'cta_click',
        expect.objectContaining({
          cta_name: 'get_started',
          cta_location: 'navbar',
        })
      );
    });
  });

  describe('trackFeature', () => {
    it('calls gaTrackFeatureInteraction', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackFeature('events_list', 'click', { source: 'dashboard' });
      });

      expect(mockGaTrackFeatureInteraction).toHaveBeenCalledWith(
        'events_list',
        'click',
        { source: 'dashboard' }
      );
    });
  });

  describe('trackConversionEvent', () => {
    it('calls gaTrackConversion with purchase event and items', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackConversionEvent('purchase', 99, [
          {
            item_id: 'grow',
            item_name: 'GatherGrove Grow Plan',
            category: 'subscription',
            quantity: 1,
            price: 99,
            currency: 'USD',
          },
        ]);
      });

      expect(mockGaTrackConversion).toHaveBeenCalledWith(
        'purchase',
        expect.objectContaining({ currency: 'USD', value: 99 })
      );
      expect(mockPosthog.capture).toHaveBeenCalledWith(
        'purchase',
        expect.objectContaining({ currency: 'USD', value: 99 })
      );
    });

    it('uses empty items array when none provided', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackConversionEvent('begin_checkout', 49);
      });

      expect(mockGaTrackConversion).toHaveBeenCalledWith(
        'begin_checkout',
        expect.objectContaining({ items: [] })
      );
    });
  });

  describe('trackROICalculatorInteraction', () => {
    it('calls trackFeatureInteraction for roi_calculator', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackROICalculatorInteraction(50, 1200);
      });

      expect(mockGaTrackFeatureInteraction).toHaveBeenCalledWith(
        'roi_calculator',
        'calculation',
        { current_member_count: 50, projected_savings: 1200 }
      );
    });
  });

  describe('trackFeatureSectionView', () => {
    it('tracks feature_section_view and FEATURE_EXPLORATION funnel step', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackFeatureSectionView('payments', 40);
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'feature_section_view',
          label: 'payments',
        })
      );
      expect(mockGaTrackFunnelStep).toHaveBeenCalledWith(
        'Feature Exploration',
        3,
        expect.objectContaining({ feature_name: 'payments' })
      );
    });
  });

  describe('trackFormInteraction', () => {
    it('tracks form_interaction for start step and TRIAL_SIGNUP_START funnel', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackFormInteraction('signup', 'start');
      });

      expect(mockGaTrackFunnelStep).toHaveBeenCalledWith(
        'Trial Signup Start',
        6,
        expect.objectContaining({ form_name: 'signup' })
      );
    });

    it('tracks FORM_COMPLETION funnel for complete step', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackFormInteraction('signup', 'complete');
      });

      expect(mockGaTrackFunnelStep).toHaveBeenCalledWith(
        'Form Completion',
        7,
        expect.objectContaining({ form_name: 'signup' })
      );
    });

    it('does not track any funnel step for other steps', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackFormInteraction('signup', 'field_focus');
      });

      expect(mockGaTrackFunnelStep).not.toHaveBeenCalled();
    });
  });

  describe('trackSubscriptionStart', () => {
    it('tracks begin_checkout and TRIAL_SIGNUP_START funnel', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackSubscriptionStart('grow', 99);
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'begin_checkout',
          category: 'ecommerce',
          label: 'grow',
          value: 99,
        })
      );
      expect(mockGaTrackFunnelStep).toHaveBeenCalledWith(
        'Trial Signup Start',
        6,
        expect.objectContaining({ tier: 'grow', value: 99 })
      );
    });
  });

  describe('trackPurchase', () => {
    it('calls trackConversionEvent with purchase and correct item', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackPurchase('grow', 99);
      });

      expect(mockGaTrackConversion).toHaveBeenCalledWith(
        'purchase',
        expect.objectContaining({
          currency: 'USD',
          value: 99,
          items: expect.arrayContaining([
            expect.objectContaining({
              item_id: 'grow',
              item_name: 'GatherGrove grow Plan',
              category: 'subscription',
              quantity: 1,
              price: 99,
            }),
          ]),
        })
      );
    });
  });

  describe('trackFeatureUse', () => {
    it('calls trackFeatureInteraction', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackFeatureUse('bulk_invite', 'submit');
      });

      expect(mockGaTrackFeatureInteraction).toHaveBeenCalledWith(
        'bulk_invite',
        'submit',
        undefined
      );
    });
  });

  describe('trackError', () => {
    it('tracks exception event with fatal flag', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackError('Network timeout', true);
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'exception',
          category: 'error',
          label: 'Network timeout',
          value: 1,
        })
      );
    });

    it('uses value 0 for non-fatal errors', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackError('Minor issue');
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({ value: 0 })
      );
    });
  });

  describe('trackSearch', () => {
    it('tracks search event with term and resultsCount', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackSearch('event management', 12);
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'search',
          label: 'event management',
          value: 12,
        })
      );
    });
  });

  describe('trackShare', () => {
    it('tracks share event with method and contentType', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackShare('twitter', 'event');
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'share',
          category: 'social',
          label: 'twitter_event',
        })
      );
    });
  });

  describe('trackTiming', () => {
    it('tracks timing_complete with rounded value', () => {
      const { result } = renderHook(() => useAnalytics());

      act(() => {
        result.current.trackTiming('api', 'list_members', 123.7);
      });

      expect(mockGaEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'timing_complete',
          category: 'api',
          label: 'list_members',
          value: 124,
        })
      );
    });
  });

  // ── Returned CONVERSION_FUNNEL_STEPS from hook ──────────────────────────────

  describe('CONVERSION_FUNNEL_STEPS exported from hook', () => {
    it('hook return includes CONVERSION_FUNNEL_STEPS reference', () => {
      const { result } = renderHook(() => useAnalytics());
      expect(result.current.CONVERSION_FUNNEL_STEPS).toBeDefined();
      expect(Object.keys(result.current.CONVERSION_FUNNEL_STEPS)).toHaveLength(10);
    });
  });
});
