/**
 * useGoogleAnalytics Tests - Full Coverage
 */

import { renderHook } from '@testing-library/react';
import { useGoogleAnalytics, CONVERSION_FUNNEL_STEPS } from '../useGoogleAnalytics';
import * as GA from '@/components/GoogleAnalytics';

// Mock Google Analytics module
jest.mock('@/components/GoogleAnalytics', () => ({
  event: jest.fn(),
  pageview: jest.fn(),
  trackCTA: jest.fn(),
  trackFeatureInteraction: jest.fn(),
  trackFunnelStep: jest.fn(),
  trackConversion: jest.fn(),
}));

describe('useGoogleAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Tracking Methods', () => {
    it('should track events with default category', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackEvent('test_event');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'test_event',
        category: 'general',
        label: undefined,
        value: undefined,
        customParameters: undefined,
      });
    });

    it('should track events with all parameters', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackEvent('test_event', {
        category: 'custom_category',
        label: 'test_label',
        value: 100,
        customParameters: { key1: 'value1', key2: 123 },
      });

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'test_event',
        category: 'custom_category',
        label: 'test_label',
        value: 100,
        customParameters: { key1: 'value1', key2: 123 },
      });
    });

    it('should track page views', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackPageView('/test-page');

      // Assert
      expect(GA.pageview).toHaveBeenCalledWith('/test-page');
    });

    it('should track CTA clicks', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackCTAClick('signup_button', 'hero_section', { variant: 'primary' });

      // Assert
      expect(GA.trackCTA).toHaveBeenCalledWith('signup_button', 'hero_section', { variant: 'primary' });
    });

    it('should track feature interactions', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackFeature('member_directory', 'filter_applied', { filter_type: 'role' });

      // Assert
      expect(GA.trackFeatureInteraction).toHaveBeenCalledWith('member_directory', 'filter_applied', { filter_type: 'role' });
    });
  });

  describe('Conversion Funnel Tracking', () => {
    it('should track funnel steps with step data', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackFunnel('LANDING_PAGE_VIEW');

      // Assert
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Landing Page View', 1, undefined);
    });

    it('should track funnel steps with additional data', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackFunnel('PRICING_VIEW', { source: 'navigation' });

      // Assert
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Pricing Section View', 4, { source: 'navigation' });
    });

    it('should track all funnel steps correctly', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act & Assert each step
      result.current.trackFunnel('LANDING_PAGE_VIEW');
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Landing Page View', 1, undefined);

      result.current.trackFunnel('HERO_CTA_CLICK');
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Hero CTA Click', 2, undefined);

      result.current.trackFunnel('FEATURE_EXPLORATION');
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Feature Exploration', 3, undefined);

      result.current.trackFunnel('PRICING_VIEW');
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Pricing Section View', 4, undefined);

      result.current.trackFunnel('PRICING_INTERACTION');
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Pricing Interaction', 5, undefined);

      result.current.trackFunnel('TRIAL_SIGNUP_START');
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Trial Signup Start', 6, undefined);

      result.current.trackFunnel('FORM_COMPLETION');
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Form Completion', 7, undefined);

      result.current.trackFunnel('ACCOUNT_CREATION');
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Account Creation', 8, undefined);

      result.current.trackFunnel('EMAIL_CONFIRMATION');
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Email Confirmation', 9, undefined);

      result.current.trackFunnel('FIRST_LOGIN');
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('First Login', 10, undefined);
    });
  });

  describe('Conversion Event Tracking', () => {
    it('should track conversion events with generated transaction ID', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());
      const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);

      // Act
      result.current.trackConversionEvent('purchase', 99.99);

      // Assert
      expect(GA.trackConversion).toHaveBeenCalledWith('purchase', expect.objectContaining({
        currency: 'USD',
        value: 99.99,
        items: [],
        transaction_id: expect.stringContaining('1234567890'),
      }));

      mockDateNow.mockRestore();
    });

    it('should track conversion events with items', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());
      const items = [
        { item_id: 'premium', item_name: 'Premium Plan', quantity: 1, price: 99.99 },
      ];

      // Act
      result.current.trackConversionEvent('purchase', 99.99, items);

      // Assert
      expect(GA.trackConversion).toHaveBeenCalledWith('purchase', expect.objectContaining({
        currency: 'USD',
        value: 99.99,
        items,
      }));
    });
  });

  describe('Hero Interaction Tracking', () => {
    it('should track hero interactions', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackHeroInteraction('video_play');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'hero_interaction',
        category: 'engagement',
        label: 'video_play',
        value: undefined,
        customParameters: {
          section: 'hero',
          action: 'video_play',
        },
      });
    });

    it('should track hero CTA click and funnel step', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackHeroInteraction('cta_click', { button_text: 'Get Started' });

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'hero_interaction',
        category: 'engagement',
        label: 'cta_click',
        value: undefined,
        customParameters: {
          section: 'hero',
          action: 'cta_click',
          button_text: 'Get Started',
        },
      });
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Hero CTA Click', 2, { button_text: 'Get Started' });
    });

    it('should track hero interactions without additional data', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackHeroInteraction('scroll');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'hero_interaction',
        category: 'engagement',
        label: 'scroll',
        value: undefined,
        customParameters: {
          section: 'hero',
          action: 'scroll',
        },
      });
    });
  });

  describe('Pricing Interaction Tracking', () => {
    it('should track pricing interactions with all parameters', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackPricingInteraction('plan_select', 'premium', 100);

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'pricing_interaction',
        category: 'engagement',
        label: 'plan_select',
        value: 100,
        customParameters: {
          section: 'pricing',
          interaction: 'plan_select',
          plan_type: 'premium',
          member_count: 100,
        },
      });
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Pricing Interaction', 5, {
        interaction: 'plan_select',
        plan_type: 'premium',
        member_count: 100,
      });
    });

    it('should track pricing interactions without optional parameters', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackPricingInteraction('calculator_open');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'pricing_interaction',
        category: 'engagement',
        label: 'calculator_open',
        value: undefined,
        customParameters: {
          section: 'pricing',
          interaction: 'calculator_open',
        },
      });
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Pricing Interaction', 5, {
        interaction: 'calculator_open',
      });
    });
  });

  describe('ROI Calculator Tracking', () => {
    it('should track ROI calculator interactions', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackROICalculatorInteraction(150, 5000);

      // Assert
      expect(GA.trackFeatureInteraction).toHaveBeenCalledWith('roi_calculator', 'calculation', {
        current_member_count: 150,
        projected_savings: 5000,
      });
    });
  });

  describe('Feature Section View Tracking', () => {
    it('should track feature section views with scroll depth', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackFeatureSectionView('member_management', 75);

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'feature_section_view',
        category: 'engagement',
        label: 'member_management',
        value: undefined,
        customParameters: {
          feature_name: 'member_management',
          scroll_depth: 75,
        },
      });
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Feature Exploration', 3, {
        feature_name: 'member_management',
        scroll_depth: 75,
      });
    });

    it('should track feature section views without scroll depth', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackFeatureSectionView('events');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'feature_section_view',
        category: 'engagement',
        label: 'events',
        value: undefined,
        customParameters: {
          feature_name: 'events',
        },
      });
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Feature Exploration', 3, {
        feature_name: 'events',
      });
    });
  });

  describe('Form Interaction Tracking', () => {
    it('should track form start and funnel step', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackFormInteraction('trial_signup', 'start', { source: 'hero' });

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'form_interaction',
        category: 'engagement',
        label: 'trial_signup_start',
        value: undefined,
        customParameters: {
          form_name: 'trial_signup',
          step: 'start',
          source: 'hero',
        },
      });
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Trial Signup Start', 6, {
        form_name: 'trial_signup',
        source: 'hero',
      });
    });

    it('should track form completion and funnel step', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackFormInteraction('trial_signup', 'complete');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'form_interaction',
        category: 'engagement',
        label: 'trial_signup_complete',
        value: undefined,
        customParameters: {
          form_name: 'trial_signup',
          step: 'complete',
        },
      });
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Form Completion', 7, {
        form_name: 'trial_signup',
      });
    });

    it('should track form middle steps without funnel tracking', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackFormInteraction('trial_signup', 'field_focus', { field_name: 'email' });

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'form_interaction',
        category: 'engagement',
        label: 'trial_signup_field_focus',
        value: undefined,
        customParameters: {
          form_name: 'trial_signup',
          step: 'field_focus',
          field_name: 'email',
        },
      });
      // Should only be called once for start/complete, not middle steps
      expect(GA.trackFunnelStep).not.toHaveBeenCalled();
    });
  });

  describe('Scroll Depth Tracking', () => {
    it('should track 25% scroll milestone', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackScrollDepth(25, '/home');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'scroll_depth',
        category: 'engagement',
        label: '25%',
        value: 25,
        customParameters: {
          page: '/home',
          depth: 25,
        },
      });
    });

    it('should track 50% scroll milestone', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackScrollDepth(60, '/pricing');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'scroll_depth',
        category: 'engagement',
        label: '50%',
        value: 50,
        customParameters: {
          page: '/pricing',
          depth: 50,
        },
      });
    });

    it('should track 75% scroll milestone', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackScrollDepth(80, '/features');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'scroll_depth',
        category: 'engagement',
        label: '75%',
        value: 75,
        customParameters: {
          page: '/features',
          depth: 75,
        },
      });
    });

    it('should track 100% scroll milestone', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackScrollDepth(100, '/about');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'scroll_depth',
        category: 'engagement',
        label: '100%',
        value: 100,
        customParameters: {
          page: '/about',
          depth: 100,
        },
      });
    });

    it('should not track between milestones', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackScrollDepth(15, '/home');

      // Assert
      expect(GA.event).not.toHaveBeenCalled();
    });
  });

  describe('Time On Page Tracking', () => {
    it('should track 30s milestone', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackTimeOnPage(35, '/home');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'time_on_page',
        category: 'engagement',
        label: '30s',
        value: 30,
        customParameters: {
          page: '/home',
          time_spent: 30,
        },
      });
    });

    it('should track 60s milestone', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackTimeOnPage(70, '/pricing');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'time_on_page',
        category: 'engagement',
        label: '60s',
        value: 60,
        customParameters: {
          page: '/pricing',
          time_spent: 60,
        },
      });
    });

    it('should track 120s milestone', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackTimeOnPage(150, '/features');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'time_on_page',
        category: 'engagement',
        label: '120s',
        value: 120,
        customParameters: {
          page: '/features',
          time_spent: 120,
        },
      });
    });

    it('should track 300s milestone', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackTimeOnPage(350, '/blog');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'time_on_page',
        category: 'engagement',
        label: '300s',
        value: 300,
        customParameters: {
          page: '/blog',
          time_spent: 300,
        },
      });
    });

    it('should not track below 30s', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackTimeOnPage(25, '/home');

      // Assert
      expect(GA.event).not.toHaveBeenCalled();
    });
  });

  describe('Legacy Methods', () => {
    it('should track signup', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackSignup('email');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'sign_up',
        category: 'engagement',
        label: 'email',
        value: undefined,
        customParameters: undefined,
      });
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Account Creation', 8, { method: 'email' });
    });

    it('should track login', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackLogin('google');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'login',
        category: 'engagement',
        label: 'google',
        value: undefined,
        customParameters: undefined,
      });
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('First Login', 10, { method: 'google' });
    });

    it('should track subscription start', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackSubscriptionStart('premium', 99.99);

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'begin_checkout',
        category: 'ecommerce',
        label: 'premium',
        value: 99.99,
        customParameters: undefined,
      });
      expect(GA.trackFunnelStep).toHaveBeenCalledWith('Trial Signup Start', 6, { tier: 'premium', value: 99.99 });
    });

    it('should track purchase', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackPurchase('premium', 99.99);

      // Assert
      expect(GA.trackConversion).toHaveBeenCalledWith('purchase', expect.objectContaining({
        currency: 'USD',
        value: 99.99,
        items: [{
          item_id: 'premium',
          item_name: 'GatherGrove premium Plan',
          category: 'subscription',
          quantity: 1,
          price: 99.99,
          currency: 'USD',
        }],
      }));
    });

    it('should track feature use', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackFeatureUse('member_export', 'export_csv');

      // Assert
      expect(GA.trackFeatureInteraction).toHaveBeenCalledWith('member_export', 'export_csv', undefined);
    });

    it('should track non-fatal errors', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackError('API timeout');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'exception',
        category: 'error',
        label: 'API timeout',
        value: 0,
        customParameters: undefined,
      });
    });

    it('should track fatal errors', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackError('Critical failure', true);

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'exception',
        category: 'error',
        label: 'Critical failure',
        value: 1,
        customParameters: undefined,
      });
    });

    it('should track search', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackSearch('member directory', 42);

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'search',
        category: 'engagement',
        label: 'member directory',
        value: 42,
        customParameters: undefined,
      });
    });

    it('should track search without results count', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackSearch('test query');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'search',
        category: 'engagement',
        label: 'test query',
        value: undefined,
        customParameters: undefined,
      });
    });

    it('should track share', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackShare('twitter', 'event');

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'share',
        category: 'social',
        label: 'twitter_event',
        value: undefined,
        customParameters: undefined,
      });
    });

    it('should track timing with rounded values', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Act
      result.current.trackTiming('api', 'get_members', 123.7);

      // Assert
      expect(GA.event).toHaveBeenCalledWith({
        action: 'timing_complete',
        category: 'api',
        label: 'get_members',
        value: 124,
        customParameters: undefined,
      });
    });
  });

  describe('Hook Stability', () => {
    it('should return stable function references', () => {
      // Arrange
      const { result, rerender } = renderHook(() => useGoogleAnalytics());

      // Act
      const firstRender = result.current;
      rerender();
      const secondRender = result.current;

      // Assert - all functions should be the same reference
      expect(firstRender.trackEvent).toBe(secondRender.trackEvent);
      expect(firstRender.trackPageView).toBe(secondRender.trackPageView);
      expect(firstRender.trackFunnel).toBe(secondRender.trackFunnel);
      expect(firstRender.trackHeroInteraction).toBe(secondRender.trackHeroInteraction);
    });

    it('should export CONVERSION_FUNNEL_STEPS constant', () => {
      // Arrange
      const { result } = renderHook(() => useGoogleAnalytics());

      // Assert
      expect(result.current.CONVERSION_FUNNEL_STEPS).toBe(CONVERSION_FUNNEL_STEPS);
      expect(result.current.CONVERSION_FUNNEL_STEPS.LANDING_PAGE_VIEW).toEqual({ name: 'Landing Page View', step: 1 });
    });
  });
});
