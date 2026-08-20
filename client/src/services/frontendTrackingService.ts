/**
 * Central analytics dispatch layer — sends events to both GA4 and PostHog.
 * All frontend analytics should go through this service to keep tracking consistent.
 */
import posthog from 'posthog-js';
import {
  event as gaEvent,
  pageview as gaPageview,
  trackCTA as gaTrackCTA,
  trackFunnelStep as gaTrackFunnelStep,
  trackConversion as gaTrackConversion,
  trackFeatureInteraction as gaTrackFeatureInteraction,
  type EcommerceEvent,
  type EcommerceItem,
  type CustomParameters,
} from '@/components/GoogleAnalytics';

export type { EcommerceEvent, EcommerceItem, CustomParameters };

function ph() {
  return typeof window !== 'undefined' ? posthog : null;
}

export function trackEvent(
  action: string,
  params: {
    category?: string;
    label?: string;
    value?: number;
    customParameters?: CustomParameters;
  } = {}
) {
  gaEvent({
    action,
    category: params.category || 'general',
    label: params.label,
    value: params.value,
    customParameters: params.customParameters,
  });

  ph()?.capture(action, {
    category: params.category,
    label: params.label,
    value: params.value,
    ...params.customParameters,
  });
}

export function trackPageView(url: string) {
  gaPageview(url);
  ph()?.capture('$pageview', { $current_url: url });
}

export function trackCTA(
  ctaName: string,
  location: string,
  additionalData?: CustomParameters
) {
  gaTrackCTA(ctaName, location, additionalData);
  ph()?.capture('cta_click', {
    cta_name: ctaName,
    cta_location: location,
    ...additionalData,
  });
}

export function trackFunnelStep(
  stepName: string,
  stepNumber: number,
  additionalData?: CustomParameters
) {
  gaTrackFunnelStep(stepName, stepNumber, additionalData);
  ph()?.capture('funnel_step', {
    step_name: stepName,
    step_number: stepNumber,
    ...additionalData,
  });
}

export function trackConversion(eventName: string, data: EcommerceEvent) {
  gaTrackConversion(eventName, data);
  ph()?.capture(eventName, {
    currency: data.currency || 'USD',
    value: data.value || 0,
    items: data.items,
    transaction_id: data.transaction_id,
  });
}

export function trackFeatureInteraction(
  featureName: string,
  interactionType: string,
  additionalData?: CustomParameters
) {
  gaTrackFeatureInteraction(featureName, interactionType, additionalData);
  ph()?.capture('feature_interaction', {
    feature_name: featureName,
    interaction_type: interactionType,
    ...additionalData,
  });
}

export function identifyUser(
  userId: string,
  traits: Record<string, string | number | boolean>
) {
  ph()?.identify(userId, traits);

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('set', 'user_properties', traits);
  }
}

export function resetUser() {
  ph()?.reset();
}
