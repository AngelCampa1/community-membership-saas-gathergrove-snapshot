/**
 * PERFECT PWA UTILITIES
 * Provides comprehensive PWA functionality including service worker registration,
 * push notifications, background sync, and offline detection
 */

import { logger } from './logger';

export interface PWAInstallPrompt extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface BackgroundSyncOptions {
  tag: string;
  data?: any;
  delay?: number;
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';

class PWAManager {
  private registration: ServiceWorkerRegistration | null = null;
  private installPrompt: PWAInstallPrompt | null = null;
  private isOnline = isBrowser ? navigator.onLine : true;
  private subscribers: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    // Only initialize in browser environment
    if (isBrowser) {
      this.init();
    }
  }

  /**
   * Initialize PWA functionality
   */
  private async init() {
    // Register service worker
    await this.registerServiceWorker();
    
    // Setup online/offline detection
    this.setupNetworkDetection();
    
    // Setup install prompt handling
    this.setupInstallPrompt();
    
    // Setup push notification handling
    this.setupPushNotifications();

    logger.info('pwa', 'PWA Manager initialized');
  }

  /**
   * Register service worker with perfect error handling
   */
  async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      logger.warn('pwa', 'Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      this.registration = registration;

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker installed, notify user
            this.notifyServiceWorkerUpdate();
          }
        });
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

      logger.info('pwa', 'Service Worker registered successfully');
    } catch (error) {
      logger.error('pwa', 'Service Worker registration failed', { error });
    }
  }

  /**
   * Setup perfect online/offline detection
   */
  private setupNetworkDetection(): void {
    // Check if window is available (not in SSR)
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
      const wasOffline = !this.isOnline;
      this.isOnline = navigator.onLine;

      // Notify subscribers
      this.subscribers.forEach(callback => callback(this.isOnline));

      if (wasOffline && this.isOnline) {
        logger.info('pwa', 'Connection restored');
        this.handleConnectionRestore();
      } else if (!this.isOnline) {
        logger.info('pwa', 'Connection lost');
        this.handleConnectionLost();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }

  /**
   * Setup PWA install prompt
   */
  private setupInstallPrompt(): void {
    // Check if window is available (not in SSR)
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event as PWAInstallPrompt;
      logger.info('pwa', 'PWA install prompt available');
    });

    window.addEventListener('appinstalled', () => {
      logger.info('pwa', 'PWA installed successfully');
      this.installPrompt = null;
    });
  }

  /**
   * Setup push notification handling
   */
  private setupPushNotifications(): void {
    // Check if window is available (not in SSR)
    if (typeof window === 'undefined') return;

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      logger.warn('pwa', 'Push notifications not supported');
      return;
    }

    // Handle notification clicks
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        this.handleNotificationClick(event.data);
      }
    });
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      throw new Error('Notifications are blocked');
    }

    const permission = await Notification.requestPermission();
    logger.info('pwa', 'Notification permission requested', { permission });
    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPushNotifications(vapidPublicKey: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    await this.requestNotificationPermission();

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey) as BufferSource
      });

      logger.info('pwa', 'Push subscription successful');
      return subscription;
    } catch (error) {
      logger.error('pwa', 'Push subscription failed', { error });
      return null;
    }
  }

  /**
   * Show local notification
   */
  async showNotification(options: NotificationOptions): Promise<void> {
    await this.requestNotificationPermission();

    if (!this.registration) {
      // Fallback to browser notification
      new Notification(options.title, options);
      return;
    }

    await this.registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || '/icon-192x192.png',
      badge: options.badge || '/icon-192x192.png',
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      actions: options.actions || []
    } as NotificationOptions);
  }

  /**
   * Schedule background sync
   */
  async scheduleBackgroundSync(options: BackgroundSyncOptions): Promise<void> {
    if (!this.registration || !('sync' in this.registration)) {
      logger.warn('pwa', 'Background Sync not supported');
      return;
    }

    try {
      // Store sync data for the service worker
      if (options.data) {
        await this.storeSyncData(options.tag, options.data);
      }

      await (this.registration as any).sync.register(options.tag);
      logger.info('pwa', 'Background sync scheduled', { tag: options.tag });
    } catch (error) {
      logger.error('pwa', 'Background sync failed', { error, tag: options.tag });
    }
  }

  /**
   * Check if PWA can be installed
   */
  canInstall(): boolean {
    return this.installPrompt !== null;
  }

  /**
   * Prompt PWA installation
   */
  async promptInstall(): Promise<{ outcome: 'accepted' | 'dismissed'; platform: string } | null> {
    if (!this.installPrompt) {
      logger.warn('pwa', 'Install prompt not available');
      return null;
    }

    try {
      await this.installPrompt.prompt();
      const choiceResult = await this.installPrompt.userChoice;
      this.installPrompt = null;
      return choiceResult;
    } catch (error) {
      logger.error('pwa', 'Install prompt failed', { error });
      return null;
    }
  }

  /**
   * Check if app is running in standalone mode
   */
  isStandalone(): boolean {
    if (!isBrowser) return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Get app installation status
   */
  getInstallationStatus(): 'not-supported' | 'available' | 'installed' {
    if (!this.isStandalone() && !this.installPrompt) {
      return 'not-supported';
    }
    
    if (this.isStandalone()) {
      return 'installed';
    }
    
    return 'available';
  }

  /**
   * Subscribe to online status changes
   */
  onlineStatusSubscribe(callback: (isOnline: boolean) => void): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get current online status
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Update service worker
   */
  async updateServiceWorker(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      logger.info('pwa', 'Service Worker updated');
    } catch (error) {
      logger.error('pwa', 'Service Worker update failed', { error });
    }
  }

  /**
   * Force service worker activation
   */
  async activateServiceWorker(): Promise<void> {
    if (!this.registration || !this.registration.waiting) return;

    // Set up listener BEFORE sending message to avoid race condition
    const controllerChangePromise = new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        resolve();
      }, { once: true });
    });

    // Send skip waiting message
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Wait for actual controller change, then reload
    await controllerChangePromise;
    window.location.reload();
  }

  /**
   * PRIVATE HELPER METHODS
   */

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  private async storeSyncData(tag: string, data: any): Promise<void> {
    // Store in IndexedDB for background sync
    const request = indexedDB.open('gathergrove-sync', 1);

    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);

      // Create object store if it doesn't exist (first time opening database)
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('pendingActions')) {
          db.createObjectStore('pendingActions', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['pendingActions'], 'readwrite');
        const store = transaction.objectStore('pendingActions');

        const syncData = {
          id: `${tag}-${Date.now()}`,
          tag,
          data,
          timestamp: Date.now()
        };

        store.add(syncData);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }

  private notifyServiceWorkerUpdate(): void {
    // Show update available notification
    this.showNotification({
      title: 'Update Available',
      body: 'A new version of GatherGrove is available. Tap to update.',
      tag: 'app-update',
      requireInteraction: true,
      actions: [
        { action: 'update', title: 'Update Now' },
        { action: 'dismiss', title: 'Later' }
      ]
    });
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { data } = event;
    
    if (data && data.type === 'UPDATE_AVAILABLE') {
      this.notifyServiceWorkerUpdate();
    }
  }

  private handleConnectionRestore(): void {
    // Trigger background sync for pending actions
    this.scheduleBackgroundSync({ tag: 'background-sync-members' });
    this.scheduleBackgroundSync({ tag: 'background-sync-events' });
    this.scheduleBackgroundSync({ tag: 'background-sync-analytics' });
  }

  private handleConnectionLost(): void {
    logger.info('pwa', 'App now running offline');
  }

  private handleNotificationClick(data: any): void {
    if (data.action === 'update') {
      this.activateServiceWorker();
    }
  }
}

// Create singleton instance
export const pwaManager = new PWAManager();

// Export utility functions
export const {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPushNotifications,
  showNotification,
  scheduleBackgroundSync,
  canInstall,
  promptInstall,
  isStandalone,
  getInstallationStatus,
  onlineStatusSubscribe,
  getOnlineStatus,
  updateServiceWorker,
  activateServiceWorker
} = pwaManager;