/**
 * Analytics Service
 *
 * This is a stub implementation for analytics tracking.
 * Firebase Analytics has been removed due to missing configuration files.
 *
 * To enable Firebase Analytics:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Download GoogleService-Info.plist (iOS) and google-services.json (Android)
 * 3. Add the files to the mobile project
 * 4. Re-add @react-native-firebase/app and @react-native-firebase/analytics
 * 5. Update this service to use the Firebase SDK
 *
 * Alternatively, integrate with Azure Application Insights for mobile analytics.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
class GoogleAnalyticsService {
  /**
   * Track screen views
   */
  async trackScreenView(screenName: string, screenClass?: string): Promise<void> {
    // Analytics disabled - Firebase not configured
  }

  /**
   * Track user signup
   */
  async trackSignUp(method: string): Promise<void> {
    // Analytics disabled - Firebase not configured
  }

  /**
   * Track user login
   */
  async trackLogin(method: string): Promise<void> {
    // Analytics disabled - Firebase not configured
  }

  /**
   * Track purchase/subscription
   */
  async trackPurchase(tier: string, value: number, currency: string = 'USD'): Promise<void> {
    // Analytics disabled - Firebase not configured
  }

  /**
   * Track custom events
   */
  async trackEvent(eventName: string, parameters?: Record<string, string | number | boolean | null>): Promise<void> {
    // Analytics disabled - Firebase not configured
  }

  /**
   * Track feature usage
   */
  async trackFeatureUse(feature: string, action: string): Promise<void> {
    // Analytics disabled - Firebase not configured
  }

  /**
   * Track errors
   */
  async trackError(error: string, fatal: boolean = false): Promise<void> {
    // Analytics disabled - Firebase not configured
  }

  /**
   * Track search
   */
  async trackSearch(searchTerm: string): Promise<void> {
    // Analytics disabled - Firebase not configured
  }

  /**
   * Track share
   */
  async trackShare(contentType: string, itemId: string, method: string): Promise<void> {
    // Analytics disabled - Firebase not configured
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: Record<string, string | null>): Promise<void> {
    // Analytics disabled - Firebase not configured
  }

  /**
   * Set user ID (for logged in users)
   */
  async setUserId(userId: string | null): Promise<void> {
    // Analytics disabled - Firebase not configured
  }

  /**
   * Track app open
   */
  async trackAppOpen(): Promise<void> {
    // Analytics disabled - Firebase not configured
  }

  /**
   * Enable/disable analytics collection
   */
  async setAnalyticsCollectionEnabled(enabled: boolean): Promise<void> {
    // Analytics disabled - Firebase not configured
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

export const googleAnalytics = new GoogleAnalyticsService();
