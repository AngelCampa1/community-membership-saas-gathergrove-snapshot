/**
 * PWA Service - Manages Progressive Web App features
 * Handles installation prompts, updates, and app-like experience
 */

import { Platform } from 'react-native';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAServiceEvents {
  'install-available': () => void;
  'install-completed': () => void;
  'update-available': () => void;
  'update-applied': () => void;
  'offline-ready': () => void;
  'cache-cleared': () => void;
}

// Extended Navigator interface for iOS standalone mode
interface ExtendedNavigator extends Navigator {
  standalone?: boolean;
}

// Extended ServiceWorkerRegistration for Background Sync API
interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  };
}

// Cache statistics returned from service worker
interface CacheStats {
  cacheNames: string[];
  totalSize?: number;
  itemCount?: number;
  lastUpdated?: string;
}

// Google Analytics gtag interface
interface GtagFunction {
  (command: 'event', action: string, params: Record<string, unknown>): void;
  (command: 'config', targetId: string, params?: Record<string, unknown>): void;
}

// Type for window with gtag (using Pick to avoid extending Window)
type WindowWithGtag = Pick<Window, never> & {
  gtag?: GtagFunction;
}

class PWAServiceClass {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstallable = false;
  private isInstalled = false;
  private updateAvailable = false;
  private eventListeners: Partial<PWAServiceEvents> = {};
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  // MEM-08 fix: Store listener references for cleanup
  private beforeInstallPromptHandler: ((e: Event) => void) | null = null;
  private appInstalledHandler: (() => void) | null = null;
  private visibilityChangeHandler: (() => void) | null = null;
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;
  private focusHandler: (() => void) | null = null;
  private controllerChangeHandler: (() => void) | null = null;

  constructor() {
    if (Platform.OS === 'web') {
      this.initializePWA();
    }
  }

  /**
   * Initialize PWA functionality for web platform
   */
  private async initializePWA(): Promise<void> {
    try {
      // Register service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        });
        
        this.serviceWorkerRegistration = registration;
        
        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          this.handleServiceWorkerUpdate(registration);
        });
        
        // Check if there's already an update available
        if (registration.waiting) {
          this.updateAvailable = true;
          this.emit('update-available');
        }
      }

      // Handle install prompts
      this.setupInstallPrompt();
      
      // Check if already installed
      this.checkIfInstalled();
      
      // Setup app lifecycle events
      this.setupAppLifecycleEvents();
      
      // Setup push notifications
      this.setupPushNotifications();
      
      // Setup periodic sync
      this.setupPeriodicSync();
      
    } catch (_err) { /* Error handled */ }
  }

  /**
   * Setup install prompt handling
   * MEM-08 fix: Store handler references for cleanup
   */
  private setupInstallPrompt(): void {
    this.beforeInstallPromptHandler = (event: Event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.isInstallable = true;
      this.emit('install-available');
    };
    window.addEventListener('beforeinstallprompt', this.beforeInstallPromptHandler);

    this.appInstalledHandler = () => {
      this.isInstalled = true;
      this.isInstallable = false;
      this.deferredPrompt = null;
      this.emit('install-completed');

      // Track installation
      this.trackInstallation();
    };
    window.addEventListener('appinstalled', this.appInstalledHandler);
  }

  /**
   * Check if app is already installed
   */
  private checkIfInstalled(): void {
    // Check for iOS standalone _mode
    const isIOSStandalone = (window.navigator as ExtendedNavigator).standalone === true;
    
    // QUAL-06 fix: Correct CSS media query syntax (was display-_mode)
    // Check for display mode
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

    // Check for minimal-ui mode
    const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
    
    this.isInstalled = isIOSStandalone || isStandaloneMode || isMinimalUI;

    if (this.isInstalled) {
      // PWA is installed - track installation status
      // Log: ('[PWA] Application is running in standalone mode');
    }
  }

  /**
   * Setup app lifecycle events
   * MEM-08 fix: Store handler references for cleanup
   */
  private setupAppLifecycleEvents(): void {
    // Handle page visibility changes
    this.visibilityChangeHandler = () => {
      if (document.visibilityState === 'visible') {
        // App became visible - good time to sync data
        this.triggerBackgroundSync();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);

    // Handle online/offline events
    this.onlineHandler = () => {
      this.triggerBackgroundSync();
    };
    window.addEventListener('online', this.onlineHandler);

    this.offlineHandler = () => {
      this.emit('offline-ready');
    };
    window.addEventListener('offline', this.offlineHandler);

    // Handle app focus/blur on mobile
    this.focusHandler = () => {
      this.triggerBackgroundSync();
    };
    window.addEventListener('focus', this.focusHandler);
  }

  /**
   * Handle service worker updates
   */
  private handleServiceWorkerUpdate(registration: ServiceWorkerRegistration): void {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        this.updateAvailable = true;
        this.emit('update-available');
      }
    });
  }

  /**
   * Setup push notifications
   */
  private async setupPushNotifications(): Promise<void> {
    try {
      if ('Notification' in window && 'serviceWorker' in navigator) {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          // You would setup push subscription here
          await this.subscribeToPushNotifications();
        }
      }
    } catch (_err) { /* Error handled */ }
  }

  /**
   * Setup periodic background sync
   */
  private async setupPeriodicSync(): Promise<void> {
    try {
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready as ServiceWorkerRegistrationWithSync;

        // Register background sync
        await registration.sync?.register('background-sync');
      }
    } catch (_err) { /* Error handled */ }
  }

  /**
   * Subscribe to push notifications
   * SEC-02 fix: Validate VAPID key before attempting subscription
   */
  private async subscribeToPushNotifications(): Promise<void> {
    try {
      // SEC-02 fix: Don't attempt subscription without valid VAPID key
      const vapidKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        if (__DEV__) {
          console.warn('[PWA] VAPID public key not configured. Push notifications disabled.');
        }
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
    } catch (_err) { /* Error handled */ }
  }

  /**
   * Send push subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (subscriptionError) {
      /* Error sending subscription to server */
    }
  }

  /**
   * Show install prompt to user
   */
  async showInstallPrompt(): Promise<{ outcome: 'accepted' | 'dismissed' } | null> {
    if (!this.deferredPrompt) {
      return null;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      this.deferredPrompt = null;
      this.isInstallable = false;
      
      return choiceResult;
    } catch (error) {
      return null;
    }
  }

  /**
   * Apply available update
   * MEM-08 fix: Use { once: true } for one-time listeners
   */
  async applyUpdate(): Promise<void> {
    if (!this.serviceWorkerRegistration?.waiting) {
      throw new Error('No update available');
    }

    // Tell the waiting service worker to skip waiting and become active
    this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Wait for the new service worker to control the page
    // MEM-08 fix: Use { once: true } to auto-remove listener after first call
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      this.updateAvailable = false;
      this.emit('update-applied');

      // Reload the page to show the new version
      window.location.reload();
    }, { once: true });
  }

  /**
   * Trigger background sync
   */
  private async triggerBackgroundSync(): Promise<void> {
    try {
      if (this.serviceWorkerRegistration) {
        const registrationWithSync = this.serviceWorkerRegistration as ServiceWorkerRegistrationWithSync;
        await registrationWithSync.sync?.register('background-sync');
      }
    } catch (_err) { /* Error handled */ }
  }

  /**
   * Get PWA capabilities and status
   */
  getCapabilities(): {
    isInstallable: boolean;
    isInstalled: boolean;
    updateAvailable: boolean;
    supportsNotifications: boolean;
    supportsBackgroundSync: boolean;
    supportsPeriodicSync: boolean;
    isOnline: boolean;
    standalone: boolean;
  } {
    return {
      isInstallable: this.isInstallable,
      isInstalled: this.isInstalled,
      updateAvailable: this.updateAvailable,
      supportsNotifications: 'Notification' in window,
      supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      supportsPeriodicSync: 'serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype,
      isOnline: navigator.onLine,
      standalone: window.matchMedia('(display-mode: standalone)').matches,
    };
  }

  /**
   * Get cache statistics
   * MEM-09 fix: Close MessageChannel ports after use
   */
  async getCacheStats(): Promise<CacheStats | null> {
    try {
      if (!this.serviceWorkerRegistration) {
        return null;
      }

      const messageChannel = new MessageChannel();

      return new Promise<CacheStats | null>((resolve) => {
        messageChannel.port1.onmessage = (event: MessageEvent<CacheStats>) => {
          // MEM-09 fix: Close ports after receiving message
          messageChannel.port1.close();
          resolve(event.data);
        };

        this.serviceWorkerRegistration!.active?.postMessage(
          { type: 'GET_CACHE_STATS' },
          [messageChannel.port2]
        );

        // MEM-09 fix: Timeout to ensure port is closed
        setTimeout(() => {
          messageChannel.port1.close();
          resolve(null);
        }, 5000);
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear all caches
   * MEM-09 fix: Close MessageChannel ports after use
   */
  async clearCache(): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not available');
    }

    const messageChannel = new MessageChannel();
    let resolved = false;

    return new Promise((resolve, reject) => {
      messageChannel.port1.onmessage = (event) => {
        if (resolved) return;
        resolved = true;
        // MEM-09 fix: Close port after receiving message
        messageChannel.port1.close();
        if (event.data.success) {
          this.emit('cache-cleared');
          resolve();
        } else {
          reject(new Error('Failed to clear cache'));
        }
      };

      this.serviceWorkerRegistration!.active?.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );

      // MEM-09 fix: Timeout with port cleanup
      setTimeout(() => {
        if (resolved) return;
        resolved = true;
        messageChannel.port1.close();
        reject(new Error('Cache clear timeout'));
      }, 5000);
    });
  }

  /**
   * Track installation analytics
   */
  private trackInstallation(): void {
    // Track install event with analytics service
    const windowWithGtag = window as WindowWithGtag;
    if (typeof windowWithGtag.gtag !== 'undefined' && windowWithGtag.gtag) {
      windowWithGtag.gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: 'App Installed',
      });
    }
  }

  /**
   * Event listener management
   */
  on<K extends keyof PWAServiceEvents>(event: K, listener: PWAServiceEvents[K]): void {
    this.eventListeners[event] = listener;
  }

  off<K extends keyof PWAServiceEvents>(event: K): void {
    delete this.eventListeners[event];
  }

  private emit<K extends keyof PWAServiceEvents>(event: K): void {
    const listener = this.eventListeners[event];
    if (listener) {
      listener();
    }
  }

  /**
   * Utility function to convert VAPID key
   */
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

  /**
   * Check if running in PWA _mode
   */
  isPWAMode(): boolean {
    return this.isInstalled;
  }

  /**
   * Get installation instructions for current platform
   */
  getInstallInstructions(): string {
    const userAgent = navigator.userAgent;

    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return 'Tap the Share button and select "Add to Home Screen"';
    } else if (/Android/.test(userAgent)) {
      return 'Tap the menu button and select "Add to Home screen" or "Install app"';
    } else {
      return 'Look for the install button in your browser\'s address bar';
    }
  }

  /**
   * MEM-08 fix: Cleanup all listeners and resources
   */
  destroy(): void {
    if (Platform.OS !== 'web') return;

    // Remove install prompt listeners
    if (this.beforeInstallPromptHandler) {
      window.removeEventListener('beforeinstallprompt', this.beforeInstallPromptHandler);
      this.beforeInstallPromptHandler = null;
    }
    if (this.appInstalledHandler) {
      window.removeEventListener('appinstalled', this.appInstalledHandler);
      this.appInstalledHandler = null;
    }

    // Remove lifecycle listeners
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
      this.onlineHandler = null;
    }
    if (this.offlineHandler) {
      window.removeEventListener('offline', this.offlineHandler);
      this.offlineHandler = null;
    }
    if (this.focusHandler) {
      window.removeEventListener('focus', this.focusHandler);
      this.focusHandler = null;
    }

    // Clear references
    this.deferredPrompt = null;
    this.serviceWorkerRegistration = null;
    this.eventListeners = {};
  }
}

// Export singleton instance
export const pwaService = new PWAServiceClass();
export default pwaService;