import { CTAPerformanceMetrics, ABTestConfig } from '@/types/cta';
import { marketingService } from './marketingService';
import { logger } from '@/lib/logger';
import posthog from 'posthog-js';

// SSR-safe PostHog accessor — consistent with frontendTrackingService pattern
function ph() {
  return typeof window !== 'undefined' ? posthog : null;
}

export interface CTAClickEvent {
  ctaId: string;
  ctaText: string;
  ctaType: string;
  location: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  variant?: string;
  engagementStage?: string;
  timeOnPage: number;
  scrollDepth: number;
  deviceType: string;
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface CTAConversionEvent {
  ctaId: string;
  conversionType: 'signup' | 'demo_request' | 'download' | 'consultation';
  conversionValue: number;
  timestamp: number;
  timeToConversion: number; // milliseconds from CTA click to conversion
  touchpoints: string[]; // Array of CTA IDs that led to this conversion
}

class CTAAnalyticsService {
  private readonly STORAGE_KEY = 'gathergrove-cta-analytics';
  private impressions: Map<string, number> = new Map();
  private clicks: Map<string, number> = new Map();
  private conversions: Map<string, number> = new Map();
  private sessionStartTime: number = Date.now();
  private clickHistory: CTAClickEvent[] = [];
  // BUG FIX: Store event handler references for proper cleanup
  private visibilityChangeHandler: (() => void) | null = null;
  private beforeUnloadHandler: (() => void) | null = null;

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      this.loadStoredData();
      this.initializeTracking();
    }
  }

  private loadStoredData() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.clickHistory = data.clickHistory || [];
      }
    } catch (error) {
      logger.error('Failed to load CTA analytics data', error);
    }
  }

  private saveData() {
    if (typeof window === 'undefined') return;
    
    try {
      const data = {
        clickHistory: this.clickHistory,
        timestamp: Date.now()
      };
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save CTA analytics data', error);
    }
  }

  private initializeTracking() {
    if (typeof window === 'undefined') return;

    // BUG FIX: Clean up any existing listeners before adding new ones
    this.cleanupTracking();

    // Track page visibility changes
    this.visibilityChangeHandler = () => {
      if (document.hidden) {
        this.saveData();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);

    // Track before page unload
    this.beforeUnloadHandler = () => {
      this.saveData();
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  /**
   * BUG FIX: Clean up event listeners to prevent memory leaks
   * Call this before re-initializing or when destroying the service
   */
  private cleanupTracking() {
    if (typeof window === 'undefined') return;

    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }

    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
  }

  /**
   * BUG FIX: Public cleanup method for proper resource disposal
   */
  public destroy() {
    this.saveData(); // Save any pending data
    this.cleanupTracking();
    this.impressions.clear();
    this.clicks.clear();
    this.conversions.clear();
    this.clickHistory = [];
  }

  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'ssr-session';
    
    const sessionKey = 'gathergrove-session-id';
    let sessionId = sessionStorage.getItem(sessionKey);
    
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem(sessionKey, sessionId);
    }
    
    return sessionId;
  }

  private getUTMParameters(): { utmSource?: string; utmMedium?: string; utmCampaign?: string } {
    if (typeof window === 'undefined') return {};
    
    const urlParams = new URLSearchParams(window.location.search);
    return {
      utmSource: urlParams.get('utm_source') || undefined,
      utmMedium: urlParams.get('utm_medium') || undefined,
      utmCampaign: urlParams.get('utm_campaign') || undefined
    };
  }

  // Track CTA impression
  recordImpression(ctaId: string, location: string, variant?: string) {
    const currentCount = this.impressions.get(ctaId) || 0;
    this.impressions.set(ctaId, currentCount + 1);

    // Send to analytics service
    marketingService.trackEvent('cta_impression', {
      cta_id: ctaId,
      location,
      variant,
      session_id: this.getSessionId(),
      device_type: this.getDeviceType(),
      timestamp: Date.now()
    });

    ph()?.capture('cta_impression', { cta_id: ctaId, location, variant });
  }

  // Track CTA click
  recordClick(
    ctaId: string,
    ctaText: string,
    ctaType: string,
    location: string,
    variant?: string,
    engagementStage?: string
  ) {
    const currentCount = this.clicks.get(ctaId) || 0;
    this.clicks.set(ctaId, currentCount + 1);

    const scrollTop = typeof window !== 'undefined' ? window.pageYOffset : 0;
    const docHeight = typeof document !== 'undefined' 
      ? document.documentElement.scrollHeight - window.innerHeight 
      : 1000;
    const scrollDepth = Math.round((scrollTop / docHeight) * 100);

    const clickEvent: CTAClickEvent = {
      ctaId,
      ctaText,
      ctaType,
      location,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      variant,
      engagementStage,
      timeOnPage: Date.now() - this.sessionStartTime,
      scrollDepth,
      deviceType: this.getDeviceType(),
      referrer: document.referrer,
      ...this.getUTMParameters()
    };

    this.clickHistory.push(clickEvent);

    // Send to analytics service
    marketingService.trackEvent('cta_click', clickEvent as unknown as Record<string, unknown>);

    ph()?.capture('cta_click', {
      cta_id: ctaId,
      cta_text: ctaText,
      cta_type: ctaType,
      location,
      variant,
      engagement_stage: engagementStage,
      scroll_depth: scrollDepth,
      device_type: clickEvent.deviceType,
      utm_source: clickEvent.utmSource,
      utm_medium: clickEvent.utmMedium,
      utm_campaign: clickEvent.utmCampaign,
    });

    this.saveData();
  }

  // Track conversion
  recordConversion(
    ctaId: string,
    conversionType: CTAConversionEvent['conversionType'],
    conversionValue: number = 1
  ) {
    const currentCount = this.conversions.get(ctaId) || 0;
    this.conversions.set(ctaId, currentCount + 1);

    // Find the original click event
    const clickEvent = this.clickHistory.find(event => event.ctaId === ctaId);
    const timeToConversion = clickEvent 
      ? Date.now() - clickEvent.timestamp 
      : 0;

    // Get all touchpoints leading to this conversion
    const touchpoints = this.clickHistory
      .filter(event => event.timestamp <= Date.now())
      .map(event => event.ctaId);

    const conversionEvent: CTAConversionEvent = {
      ctaId,
      conversionType,
      conversionValue,
      timestamp: Date.now(),
      timeToConversion,
      touchpoints
    };

    // Send to analytics service
    marketingService.trackEvent('cta_conversion', conversionEvent as unknown as Record<string, unknown>);

    ph()?.capture('cta_conversion', {
      cta_id: ctaId,
      conversion_type: conversionType,
      conversion_value: conversionValue,
      time_to_conversion: timeToConversion,
    });

    this.saveData();
  }

  // Get performance metrics for a specific CTA
  getPerformanceMetrics(ctaId: string): CTAPerformanceMetrics {
    const impressions = this.impressions.get(ctaId) || 0;
    const clicks = this.clicks.get(ctaId) || 0;
    const conversions = this.conversions.get(ctaId) || 0;

    return {
      ctaId,
      impressions,
      clicks,
      conversions,
      clickThroughRate: impressions > 0 ? (clicks / impressions) * 100 : 0,
      conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      lastUpdated: new Date().toISOString()
    };
  }

  // Get all performance metrics
  getAllMetrics(): CTAPerformanceMetrics[] {
    const allCtaIds = new Set([
      ...this.impressions.keys(),
      ...this.clicks.keys(),
      ...this.conversions.keys()
    ]);

    return Array.from(allCtaIds).map(ctaId => this.getPerformanceMetrics(ctaId));
  }

  // A/B test functionality
  selectVariantForTest(testConfig: ABTestConfig): string {
    // Validate variants exist before accessing
    if (!testConfig.variants || testConfig.variants.length === 0) {
      throw new Error('A/B test configuration requires at least one variant');
    }

    if (typeof window === 'undefined') {
      return testConfig.variants[0].id; // Return first variant for SSR
    }
    
    const { variants, trafficSplit, testId } = testConfig;
    
    // Check if user already has a variant assigned for this test
    const storageKey = `ab-test-${testId}`;
    const existingVariant = sessionStorage.getItem(storageKey);
    
    if (existingVariant && variants.some(v => v.id === existingVariant)) {
      return existingVariant;
    }

    // Assign new variant based on traffic split
    const random = Math.random() * 100;
    let cumulativeWeight = 0;

    for (let i = 0; i < variants.length; i++) {
      cumulativeWeight += trafficSplit[i] || (100 / variants.length);
      if (random <= cumulativeWeight) {
        const selectedVariant = variants[i].id;
        sessionStorage.setItem(storageKey, selectedVariant);
        
        // Track variant assignment
        marketingService.trackEvent('ab_test_assignment', {
          test_id: testId,
          variant: selectedVariant,
          session_id: this.getSessionId()
        });

        return selectedVariant;
      }
    }

    // Fallback to first variant
    // SECURITY FIX: Validate variants array has elements before accessing
    const fallbackVariant = variants?.[0]?.id ?? 'default';
    sessionStorage.setItem(storageKey, fallbackVariant);
    return fallbackVariant;
  }

  // Generate analytics report
  generateReport(): {
    summary: {
      totalImpressions: number;
      totalClicks: number;
      totalConversions: number;
      overallCTR: number;
      overallConversionRate: number;
    };
    byLocation: Record<string, CTAPerformanceMetrics[]>;
    byType: Record<string, CTAPerformanceMetrics[]>;
    topPerforming: CTAPerformanceMetrics[];
  } {
    const allMetrics = this.getAllMetrics();
    
    const totalImpressions = allMetrics.reduce((sum, m) => sum + m.impressions, 0);
    const totalClicks = allMetrics.reduce((sum, m) => sum + m.clicks, 0);
    const totalConversions = allMetrics.reduce((sum, m) => sum + m.conversions, 0);

    // Group by location and type (would need CTA config data)
    const byLocation: Record<string, CTAPerformanceMetrics[]> = {};
    const byType: Record<string, CTAPerformanceMetrics[]> = {};

    // Top performing CTAs by conversion rate
    const topPerforming = allMetrics
      .filter(m => m.clicks > 0)
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 10);

    return {
      summary: {
        totalImpressions,
        totalClicks,
        totalConversions,
        overallCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        overallConversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
      },
      byLocation,
      byType,
      topPerforming
    };
  }

  // Clear analytics data
  clearData() {
    this.impressions.clear();
    this.clicks.clear();
    this.conversions.clear();
    this.clickHistory = [];
    
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }
}

// Export singleton instance
export const ctaAnalyticsService = new CTAAnalyticsService();