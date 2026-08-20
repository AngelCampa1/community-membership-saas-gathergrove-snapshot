'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { SecurityUtils } from '@/utils/security';

// Replace with your actual Google Analytics Measurement ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

// Enhanced ecommerce event types
export interface EcommerceItem {
  item_id: string;
  item_name: string;
  category: string;
  quantity?: number;
  price?: number;
  currency?: string;
}

export interface EcommerceEvent {
  currency?: string;
  value?: number;
  items?: EcommerceItem[];
  transaction_id?: string;
}

// Custom parameters interface
export interface CustomParameters {
  [key: string]: string | number | boolean | undefined;
}

// Helper to send page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      custom_map: {
        custom_parameter_1: 'page_category',
        custom_parameter_2: 'user_type',
      },
    });
  }
};

// Helper to track events
export const event = ({
  action,
  category,
  label,
  value,
  customParameters,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
  customParameters?: CustomParameters;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...customParameters,
    });
  }
};

// Enhanced ecommerce tracking helpers
export const trackConversion = (eventName: string, data: EcommerceEvent) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      currency: data.currency || 'USD',
      value: data.value || 0,
      items: data.items || [],
      transaction_id: data.transaction_id,
    });
  }
};

// Conversion funnel tracking
export const trackFunnelStep = (stepName: string, stepNumber: number, additionalData?: CustomParameters) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'funnel_step', {
      event_category: 'Conversion Funnel',
      event_label: stepName,
      custom_parameters: {
        step_number: stepNumber,
        step_name: stepName,
        page_url: window.location.pathname,
        ...additionalData,
      },
    });
  }
};

// CTA tracking
export const trackCTA = (ctaName: string, location: string, additionalData?: CustomParameters) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'cta_click', {
      event_category: 'engagement',
      event_label: ctaName,
      custom_parameters: {
        cta_name: ctaName,
        cta_location: location,
        page_url: window.location.pathname,
        ...additionalData,
      },
    });
  }
};

// Feature interaction tracking
export const trackFeatureInteraction = (featureName: string, interactionType: string, additionalData?: CustomParameters) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'feature_interaction', {
      event_category: 'engagement',
      event_label: `${featureName}_${interactionType}`,
      custom_parameters: {
        feature_name: featureName,
        interaction_type: interactionType,
        page_url: window.location.pathname,
        ...additionalData,
      },
    });
  }
};

function GoogleAnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && GA_MEASUREMENT_ID) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      pageview(url);
    }
  }, [pathname, searchParams]);

  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={SecurityUtils.createSafeHTML(`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              custom_map: {
                custom_parameter_1: 'page_category',
                custom_parameter_2: 'user_type',
                custom_parameter_3: 'conversion_step',
              },
              allow_enhanced_conversions: true,
              send_page_view: true,
            });
            
            // Enhanced ecommerce setup
            gtag('config', '${GA_MEASUREMENT_ID}', {
              currency: 'USD',
              send_page_view: false, // We'll handle this manually
            });
            
            // Initialize session tracking
            const sessionId = sessionStorage.getItem('analytics-session-id') || 
                             Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem('analytics-session-id', sessionId);
            
            gtag('event', 'session_start', {
              session_id: sessionId,
              page_category: 'marketing',
              user_type: 'visitor',
            });
          `)}
      />
    </>
  );
}

export default function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsInner />
    </Suspense>
  );
}