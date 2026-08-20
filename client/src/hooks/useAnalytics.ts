import { useCallback } from 'react';
import {
  trackEvent as dispatchEvent,
  trackPageView as dispatchPageView,
  trackCTA,
  trackFunnelStep as dispatchFunnelStep,
  trackConversion as dispatchConversion,
  trackFeatureInteraction as dispatchFeatureInteraction,
  identifyUser,
  resetUser,
  type EcommerceItem,
} from '@/services/frontendTrackingService';

// Conversion funnel steps definition
export const CONVERSION_FUNNEL_STEPS = {
  LANDING_PAGE_VIEW: { name: 'Landing Page View', step: 1 },
  HERO_CTA_CLICK: { name: 'Hero CTA Click', step: 2 },
  FEATURE_EXPLORATION: { name: 'Feature Exploration', step: 3 },
  PRICING_VIEW: { name: 'Pricing Section View', step: 4 },
  PRICING_INTERACTION: { name: 'Pricing Interaction', step: 5 },
  TRIAL_SIGNUP_START: { name: 'Trial Signup Start', step: 6 },
  FORM_COMPLETION: { name: 'Form Completion', step: 7 },
  ACCOUNT_CREATION: { name: 'Account Creation', step: 8 },
  EMAIL_CONFIRMATION: { name: 'Email Confirmation', step: 9 },
  FIRST_LOGIN: { name: 'First Login', step: 10 },
} as const;

interface TrackingParameters {
  category?: string;
  label?: string;
  value?: number;
  customParameters?: Record<string, string | number | boolean>;
}

export function useAnalytics() {
  const trackEvent = useCallback((eventName: string, parameters?: TrackingParameters) => {
    dispatchEvent(eventName, {
      category: parameters?.category || 'general',
      label: parameters?.label,
      value: parameters?.value,
      customParameters: parameters?.customParameters,
    });
  }, []);

  const trackPageView = useCallback((url: string) => {
    dispatchPageView(url);
  }, []);

  const trackCTAClick = useCallback((ctaName: string, location: string, additionalData?: Record<string, string | number | boolean>) => {
    trackCTA(ctaName, location, additionalData);
  }, []);

  const trackFeature = useCallback((featureName: string, interactionType: string, additionalData?: Record<string, string | number | boolean>) => {
    dispatchFeatureInteraction(featureName, interactionType, additionalData);
  }, []);

  const trackFunnel = useCallback((stepKey: keyof typeof CONVERSION_FUNNEL_STEPS, additionalData?: Record<string, string | number | boolean>) => {
    const step = CONVERSION_FUNNEL_STEPS[stepKey];
    dispatchFunnelStep(step.name, step.step, additionalData);
  }, []);

  const trackConversionEvent = useCallback((eventName: string, value: number, items?: EcommerceItem[]) => {
    const transactionId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : undefined;

    dispatchConversion(eventName, {
      currency: 'USD',
      value,
      items: items || [],
      transaction_id: transactionId || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    });
  }, []);

  const trackHeroInteraction = useCallback((action: string, additionalData?: Record<string, string | number | boolean>) => {
    trackEvent('hero_interaction', {
      category: 'engagement',
      label: action,
      customParameters: { section: 'hero', action, ...additionalData },
    });
    if (action === 'cta_click') {
      trackFunnel('HERO_CTA_CLICK', additionalData);
    }
  }, [trackEvent, trackFunnel]);

  const trackPricingInteraction = useCallback((interaction: string, planType?: string, memberCount?: number) => {
    trackEvent('pricing_interaction', {
      category: 'engagement',
      label: interaction,
      value: memberCount,
      customParameters: {
        section: 'pricing',
        interaction,
        ...(planType && { plan_type: planType }),
        ...(memberCount && { member_count: memberCount }),
      },
    });
    trackFunnel('PRICING_INTERACTION', {
      interaction,
      ...(planType && { plan_type: planType }),
      ...(memberCount && { member_count: memberCount }),
    });
  }, [trackEvent, trackFunnel]);

  const trackROICalculatorInteraction = useCallback((currentMemberCount: number, projectedSavings: number) => {
    trackFeature('roi_calculator', 'calculation', {
      current_member_count: currentMemberCount,
      projected_savings: projectedSavings,
    });
  }, [trackFeature]);

  const trackFeatureSectionView = useCallback((featureName: string, scrollDepth?: number) => {
    trackEvent('feature_section_view', {
      category: 'engagement',
      label: featureName,
      customParameters: {
        feature_name: featureName,
        ...(scrollDepth !== undefined && { scroll_depth: scrollDepth }),
      },
    });
    trackFunnel('FEATURE_EXPLORATION', {
      feature_name: featureName,
      ...(scrollDepth !== undefined && { scroll_depth: scrollDepth }),
    });
  }, [trackEvent, trackFunnel]);

  const trackFormInteraction = useCallback((formName: string, step: string, additionalData?: Record<string, string | number | boolean>) => {
    trackEvent('form_interaction', {
      category: 'engagement',
      label: `${formName}_${step}`,
      customParameters: { form_name: formName, step, ...additionalData },
    });
    if (step === 'start') {
      trackFunnel('TRIAL_SIGNUP_START', { form_name: formName, ...additionalData });
    } else if (step === 'complete') {
      trackFunnel('FORM_COMPLETION', { form_name: formName, ...additionalData });
    }
  }, [trackEvent, trackFunnel]);

  const trackScrollDepth = useCallback((depth: number, page: string) => {
    const milestones = [25, 50, 75, 100];
    const milestone = milestones.find(m => depth >= m && depth < (milestones[milestones.indexOf(m) + 1] || 101));
    if (milestone) {
      trackEvent('scroll_depth', {
        category: 'engagement',
        label: `${milestone}%`,
        value: milestone,
        customParameters: { page, depth: milestone },
      });
    }
  }, [trackEvent]);

  const trackTimeOnPage = useCallback((seconds: number, page: string) => {
    const milestones = [30, 60, 120, 300];
    const milestone = [...milestones].reverse().find(m => seconds >= m);
    if (milestone) {
      trackEvent('time_on_page', {
        category: 'engagement',
        label: `${milestone}s`,
        value: milestone,
        customParameters: { page, time_spent: milestone },
      });
    }
  }, [trackEvent]);

  const trackSignup = useCallback((method: string) => {
    trackEvent('sign_up', { category: 'engagement', label: method });
    trackFunnel('ACCOUNT_CREATION', { method });
  }, [trackEvent, trackFunnel]);

  const trackLogin = useCallback((method: string) => {
    trackEvent('login', { category: 'engagement', label: method });
    trackFunnel('FIRST_LOGIN', { method });
  }, [trackEvent, trackFunnel]);

  const trackSubscriptionStart = useCallback((tier: string, value: number) => {
    trackEvent('begin_checkout', { category: 'ecommerce', label: tier, value });
    trackFunnel('TRIAL_SIGNUP_START', { tier, value });
  }, [trackEvent, trackFunnel]);

  const trackPurchase = useCallback((tier: string, value: number) => {
    trackConversionEvent('purchase', value, [{
      item_id: tier,
      item_name: `GatherGrove ${tier} Plan`,
      category: 'subscription',
      quantity: 1,
      price: value,
      currency: 'USD',
    }]);
  }, [trackConversionEvent]);

  const trackFeatureUse = useCallback((feature: string, action: string) => {
    trackFeature(feature, action);
  }, [trackFeature]);

  const trackError = useCallback((error: string, fatal: boolean = false) => {
    trackEvent('exception', { category: 'error', label: error, value: fatal ? 1 : 0 });
  }, [trackEvent]);

  const trackSearch = useCallback((searchTerm: string, resultsCount?: number) => {
    trackEvent('search', { category: 'engagement', label: searchTerm, value: resultsCount });
  }, [trackEvent]);

  const trackShare = useCallback((method: string, contentType: string) => {
    trackEvent('share', { category: 'social', label: `${method}_${contentType}` });
  }, [trackEvent]);

  const trackTiming = useCallback((category: string, variable: string, value: number) => {
    trackEvent('timing_complete', { category, label: variable, value: Math.round(value) });
  }, [trackEvent]);

  const identifyCurrentUser = useCallback((userId: string, traits: Record<string, string | number | boolean>) => {
    identifyUser(userId, traits);
  }, []);

  const resetCurrentUser = useCallback(() => {
    resetUser();
  }, []);

  return {
    trackEvent,
    trackPageView,
    trackCTAClick,
    trackFeature,
    trackFunnel,
    trackConversionEvent,
    trackHeroInteraction,
    trackPricingInteraction,
    trackROICalculatorInteraction,
    trackFeatureSectionView,
    trackFormInteraction,
    trackScrollDepth,
    trackTimeOnPage,
    trackSignup,
    trackLogin,
    trackSubscriptionStart,
    trackPurchase,
    trackFeatureUse,
    trackError,
    trackSearch,
    trackShare,
    trackTiming,
    identifyCurrentUser,
    resetCurrentUser,
    CONVERSION_FUNNEL_STEPS,
  };
}
