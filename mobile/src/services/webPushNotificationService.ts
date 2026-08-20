/**
 * Web Push Notification Service
 * Handles push notifications for PWA with fallback support
 */

import { Platform } from 'react-native';

// Type for Google Analytics gtag function
interface GtagWindow extends Window {
  gtag?: (
    command: string,
    eventName: string,
    params?: {
      event_category?: string;
      event_label?: string;
      custom_map?: Record<string, string>;
    }
  ) => void;
}

// Create safe notification options that work with browser Notification API
function createNotification(title: string, payload: NotificationPayload): Notification {
  const options: globalThis.NotificationOptions = {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag,
    requireInteraction: payload.requireInteraction,
    silent: payload.silent,
    data: payload.data,
  };
  return new Notification(title, options);
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  deviceInfo?: {
    platform: string;
    userAgent: string;
    language: string;
  };
}

export interface NotificationData {
  type?: string;
  timestamp?: number;
  url?: string;
  route?: string;
  eventId?: string;
  messageId?: string;
  [key: string]: unknown;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: NotificationData;
}

export interface NotificationOptions {
  showWhenForeground?: boolean;
  persistWhenOffline?: boolean;
  retryOnFailure?: boolean;
  analytics?: boolean;
}

class WebPushNotificationService {
  private vapidPublicKey: string | null = null;
  private subscription: PushSubscription | null = null;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSupported = false;
  private permissionStatus: NotificationPermission = 'default';
  private pendingNotifications: Array<{ payload: NotificationPayload; options?: NotificationOptions }> = [];

  // RACE-03 fix: Use Promise-based lock for pending notifications processing
  private processingLock: Promise<void> = Promise.resolve();

  constructor() {
    if (Platform.OS === 'web') {
      this.initializeWebPush();
    }
  }

  /**
   * Initialize web push notification support
   */
  private async initializeWebPush(): Promise<void> {
    try {
      // Check for push notification support
      this.isSupported = this.checkSupport();

      // Check current permission status (even if not fully supported, we might fallback to basic Notification)
      if ('Notification' in window) {
        this.permissionStatus = Notification.permission;
      }

      if (!this.isSupported) {
        return;
      }

      // Get service worker registration
      if ('serviceWorker' in navigator) {
        this.swRegistration = await navigator.serviceWorker.ready;
      }

      // SEC-02 fix: Load VAPID public key from environment - no fallback to placeholder
      const vapidKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        if (__DEV__) {
          console.warn('[WebPush] VAPID public key not configured. Set REACT_APP_VAPID_PUBLIC_KEY in environment.');
        }
        // Don't set a placeholder - leave as null to prevent subscription with invalid key
        this.vapidPublicKey = null;
      } else {
        this.vapidPublicKey = vapidKey;
      }

      // Try to get existing subscription
      if (this.swRegistration) {
        this.subscription = await this.swRegistration.pushManager.getSubscription();
        
        if (this.subscription) {
          await this.syncSubscriptionWithServer();
        }
      }

    } catch (error) {
      // SILENT-03 fix: Log initialization errors in development
      if (__DEV__) {
        console.warn('[WebPush] Initialization failed:', error instanceof Error ? error.message : error);
      }
    }
  }

  /**
   * Check if push notifications are supported
   */
  private checkSupport(): boolean {
    return !!(
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window &&
      'showNotification' in ServiceWorkerRegistration.prototype
    );
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    try {
      this.permissionStatus = await Notification.requestPermission();
      
      if (this.permissionStatus === 'granted') {
        
        // Subscribe to push notifications if we have permission
        await this.subscribe();
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      // SILENT-03 fix: Log permission request failures
      if (__DEV__) {
        console.warn('[WebPush] Permission request failed:', error instanceof Error ? error.message : error);
      }
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.isSupported || !this.swRegistration || !this.vapidPublicKey) {
      throw new Error('Push notifications not available');
    }

    if (this.permissionStatus !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    // Unsubscribe from existing subscription first
    if (this.subscription) {
      await this.subscription.unsubscribe();
    }

    // Create new subscription
    this.subscription = await this.swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource,
    });


    // Send subscription to server
    await this.sendSubscriptionToServer(this.subscription);

    return this.subscription;
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      if (this.subscription) {
        const success = await this.subscription.unsubscribe();

        if (success) {
          // CRITICAL: Remove from server BEFORE nulling subscription (server needs endpoint)
          await this.removeSubscriptionFromServer();
          this.subscription = null;
        }

        return success;
      }

      return true;
    } catch (error) {
      // SILENT-03 fix: Log unsubscribe failures
      if (__DEV__) {
        console.warn('[WebPush] Unsubscribe failed:', error instanceof Error ? error.message : error);
      }
      return false;
    }
  }

  /**
   * Show local notification (fallback when service worker unavailable)
   */
  async showNotification(payload: NotificationPayload, options?: NotificationOptions): Promise<void> {
    try {
      // If service worker is available, use it
      if (this.swRegistration) {
        const swOptions = {
          body: payload.body,
          icon: payload.icon || '/icon-192x192.png',
          badge: payload.badge || '/badge-72x72.png',
          tag: payload.tag,
          requireInteraction: payload.requireInteraction,
          silent: payload.silent,
          data: payload.data,
          // Service worker notifications support additional properties
          ...(payload.image && { image: payload.image }),
          ...(payload.actions && { actions: payload.actions }),
          ...(payload.vibrate && { vibrate: payload.vibrate }),
        };
        await this.swRegistration.showNotification(payload.title, swOptions);
      } else {
        // Fallback to basic notification
        if (this.permissionStatus === 'granted') {
          const notification = createNotification(payload.title, {
            ...payload,
            icon: payload.icon || '/icon-192x192.png',
            badge: payload.badge || '/badge-72x72.png',
          });

          // Handle click events
          notification.onclick = () => {
            this.handleNotificationClick(payload.data || {});
          };
        }
      }


      // Track analytics if enabled
      if (options?.analytics) {
        this.trackNotificationEvent('shown', payload);
      }
    } catch (error) {
      // Queue for retry if offline persistence is enabled
      if (options?.persistWhenOffline && !navigator.onLine) {
        this.pendingNotifications.push({ payload, options });
      } else {
        // Re-throw error if not queuing for retry
        throw error;
      }
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<void> {
    const testPayload: NotificationPayload = {
      title: 'GatherGrove Test Notification',
      body: 'This is a test notification to verify push notifications are working correctly.',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'test-notification',
      data: {
        type: 'test',
        timestamp: Date.now(),
      },
      actions: [
        {
          action: 'open',
          title: 'Open App',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
        },
      ],
    };

    await this.showNotification(testPayload, { analytics: true });
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
        deviceInfo: {
          platform: 'web',
          userAgent: navigator.userAgent,
          language: navigator.language,
        },
      };

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

    } catch (error) {
      // Log error and re-throw with context
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to send subscription to server: ${errorMessage}`);
    }
  }

  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: this.subscription?.endpoint,
        }),
      });

      if (!response.ok) {
        // SILENT-03 fix: Log server response errors
        if (__DEV__) {
          console.warn('[WebPush] Failed to remove subscription from server:', response.status);
        }
      }
    } catch (error) {
      // SILENT-03 fix: Log network errors when removing subscription
      if (__DEV__) {
        console.warn('[WebPush] Error removing subscription:', error instanceof Error ? error.message : error);
      }
    }
  }

  /**
   * Sync subscription with server (check if still valid)
   */
  private async syncSubscriptionWithServer(): Promise<void> {
    if (!this.subscription) return;

    try {
      const response = await fetch('/api/push/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: this.subscription.endpoint,
        }),
      });

      if (!response.ok) {
        // Subscription not valid on server, resubscribe
        await this.sendSubscriptionToServer(this.subscription);
      }
    } catch (error) {
      // SILENT-03 fix: Log sync errors
      if (__DEV__) {
        console.warn('[WebPush] Sync subscription failed:', error instanceof Error ? error.message : error);
      }
    }
  }

  /**
   * Handle notification click
   */
  private handleNotificationClick(data: NotificationData): void {
    // Focus or open the app window
    if ('clients' in self) {
      // This would be handled in service worker context
      return;
    }

    // Handle in main thread
    window.focus();

    // Navigate based on notification data
    if (data.url) {
      window.location.href = data.url;
    } else if (data.route) {
      // Handle routing based on your app's router
    }

    // Track click analytics
    this.trackNotificationEvent('clicked', { data });
  }

  /**
   * Process pending notifications when connection is restored
   * RACE-03 fix: Use lock to prevent concurrent processing
   */
  processPendingNotifications(): Promise<void> {
    // RACE-03 fix: Chain onto lock to serialize notification processing
    this.processingLock = this.processingLock.then(async () => {
      if (this.pendingNotifications.length === 0) return;

      // Copy and clear atomically within the lock
      const notifications = [...this.pendingNotifications];
      this.pendingNotifications = [];

      for (const { payload, options } of notifications) {
        try {
          await this.showNotification(payload, options);
        } catch (error) {
          // SILENT-03 fix: Log pending notification processing failures
          if (__DEV__) {
            console.warn('[WebPush] Failed to show pending notification:', payload.title, error instanceof Error ? error.message : error);
          }
        }
      }
    }).catch((error) => {
      if (__DEV__) {
        console.warn('[WebPush] Pending notifications processing error:', error);
      }
    });

    return this.processingLock;
  }

  /**
   * Track notification analytics
   */
  private trackNotificationEvent(
    event: string,
    payload: NotificationPayload | { data: NotificationData }
  ): void {
    const gtagWindow = window as unknown as GtagWindow;
    if (typeof gtagWindow.gtag !== 'undefined') {
      gtagWindow.gtag('event', `notification_${event}`, {
        event_category: 'Notification',
        event_label: ('title' in payload ? payload.title : undefined) ||
                    ('tag' in payload ? payload.tag : undefined) ||
                    'Unknown',
        custom_map: {
          notification_type: payload.data?.type || 'general',
        },
      });
    }
  }

  /**
   * Get push notification status
   */
  getStatus(): {
    supported: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
    endpoint?: string;
    pendingNotifications: number;
  } {
    return {
      supported: this.isSupported,
      permission: this.permissionStatus,
      subscribed: !!this.subscription,
      endpoint: this.subscription?.endpoint,
      pendingNotifications: this.pendingNotifications.length,
    };
  }

  /**
   * Configure push notification topics/categories
   */
  async updateSubscriptionPreferences(preferences: {
    events?: boolean;
    messages?: boolean;
    reminders?: boolean;
    marketing?: boolean;
  }): Promise<void> {
    const response = await fetch('/api/push/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: this.subscription?.endpoint,
        preferences,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update preferences');
    }
  }

  // Utility methods

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    return window.btoa(binary);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.pendingNotifications = [];
    this.subscription = null;
    this.swRegistration = null;
  }

  /**
   * Reinitialize service (for testing purposes)
   * Resets all state and re-runs initialization if on web platform
   */
  async reinitialize(): Promise<void> {
    // Reset all state
    this.pendingNotifications = [];
    this.subscription = null;
    this.swRegistration = null;
    this.isSupported = false;
    this.permissionStatus = 'default';
    this.vapidPublicKey = null;
    this.processingLock = Promise.resolve();

    // Re-run initialization if on web
    if (Platform.OS === 'web') {
      await this.initializeWebPush();
    }
  }
}

// Export singleton instance
export const webPushNotificationService = new WebPushNotificationService();
export default webPushNotificationService;