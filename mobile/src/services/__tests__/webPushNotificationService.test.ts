// CRITICAL: Set up global browser API mocks BEFORE importing service
// Service is singleton and runs constructor at import time

// NOTE: Cannot override Platform.OS with jest.mock because moduleNameMapper takes precedence
// Will set Platform.OS = 'web' at module level after import

// Set up global mocks before service import
// Mock PushSubscription
const mockPushSubscription: Partial<PushSubscription> = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
  unsubscribe: jest.fn().mockResolvedValue(true),
  getKey: jest.fn((name: string) => {
    if (name === 'p256dh') return new Uint8Array([1, 2, 3]).buffer;
    if (name === 'auth') return new Uint8Array([4, 5, 6]).buffer;
    return null;
  }),
  options: { applicationServerKey: null, userVisibleOnly: true } as PushSubscriptionOptions,
  expirationTime: null,
  toJSON: jest.fn(),
};

// Mock ServiceWorkerRegistration
const mockServiceWorkerRegistration: Partial<ServiceWorkerRegistration> = {
  active: {
    postMessage: jest.fn(),
  } as unknown as ServiceWorker,
  pushManager: {
    getSubscription: jest.fn().mockResolvedValue(null),
    subscribe: jest.fn().mockResolvedValue(mockPushSubscription),
    permissionState: jest.fn().mockResolvedValue('granted'),
  } as unknown as PushManager,
  showNotification: jest.fn().mockResolvedValue(undefined),
  getNotifications: jest.fn().mockResolvedValue([]),
};

// Mock ServiceWorker API
Object.defineProperty(global.navigator, 'serviceWorker', {
  value: {
    ready: Promise.resolve(mockServiceWorkerRegistration),
    register: jest.fn(),
    addEventListener: jest.fn(),
  },
  writable: true,
  configurable: true,
});

// Create ServiceWorkerRegistration class BEFORE Notification mock
// Service checkSupport() checks for 'showNotification' in ServiceWorkerRegistration.prototype
(global as any).ServiceWorkerRegistration = class ServiceWorkerRegistration {};
// CRITICAL: Set showNotification on the PROTOTYPE, not as instance property
// Use Object.defineProperty to ensure it survives jest.clearAllMocks()
Object.defineProperty(ServiceWorkerRegistration.prototype, 'showNotification', {
  value: jest.fn().mockResolvedValue(undefined),
  writable: true,
  configurable: true,
});

// Mock Notification API
const mockNotification: jest.Mock = jest.fn().mockImplementation((title: string, options?: NotificationOptions) => {
  // Return a mock notification object when called as constructor
  return {
    title,
    body: options?.body,
    icon: options?.icon,
    onclick: null,
    onclose: null,
    onerror: null,
    close: jest.fn(),
  };
});
Object.defineProperty(global, 'Notification', {
  value: mockNotification,
  writable: true,
  configurable: true,
});
Object.defineProperty(mockNotification, 'permission', {
  value: 'default',
  writable: true,
});
(mockNotification as any).requestPermission = jest.fn().mockResolvedValue('granted');

// Mock window properties
Object.defineProperty(global.window, 'PushManager', {
  value: class PushManager {},
  writable: true,
  configurable: true,
});

// Mock window methods
global.window.atob = jest.fn((str: string) => Buffer.from(str, 'base64').toString('binary'));
global.window.btoa = jest.fn((str: string) => Buffer.from(str, 'binary').toString('base64'));

// Mock process.env
process.env.REACT_APP_VAPID_PUBLIC_KEY = 'BNkTEQz1234567890abcdefghijklmnopqrstuvwxyz';

// Mock __DEV__ global
(global as any).__DEV__ = false;

// Mock navigator properties
Object.defineProperty(global.navigator, 'userAgent', {
  value: 'Mozilla/5.0 Test Browser',
  writable: true,
});
Object.defineProperty(global.navigator, 'language', {
  value: 'en-US',
  writable: true,
});
Object.defineProperty(global.navigator, 'onLine', {
  value: true,
  writable: true,
});

// Mock fetch for server communication
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({}),
  status: 200,
} as unknown as Response);

// NOW import Platform and set OS to 'web' BEFORE importing service
import { Platform } from 'react-native';
// CRITICAL: Override Platform.OS to 'web' before service imports
// The global __mocks__/react-native.js sets it to 'ios' by default
(Platform as any).OS = 'web';

// Use require() instead of import to ensure it loads AFTER Platform.OS is set
const { webPushNotificationService } = require('../webPushNotificationService');

describe('WebPushNotificationService', () => {

  beforeEach(async () => {
    // Clear mock call history but keep implementations
    jest.clearAllMocks();

    // CRITICAL: Reset Platform.OS to 'web' in case any test changed it
    (Platform as any).OS = 'web';

    // CRITICAL: resetMocks: true in jest.config.js means clearAllMocks() resets implementations
    // Must re-set all mock implementations in beforeEach

    // Re-implement ALL mockPushSubscription methods (all jest.fn() are reset)
    (mockPushSubscription.getKey as jest.Mock).mockImplementation((name: string) => {
      if (name === 'p256dh') return new Uint8Array([1, 2, 3]).buffer;
      if (name === 'auth') return new Uint8Array([4, 5, 6]).buffer;
      return null;
    });
    (mockPushSubscription.unsubscribe as jest.Mock).mockResolvedValue(true);
    (mockPushSubscription.toJSON as jest.Mock).mockReturnValue({
      endpoint: mockPushSubscription.endpoint,
      keys: {}
    });

    // Re-implement ALL mockServiceWorkerRegistration methods
    ((mockServiceWorkerRegistration.active as any).postMessage as jest.Mock).mockImplementation(() => {});
    (mockServiceWorkerRegistration.pushManager!.getSubscription as jest.Mock).mockResolvedValue(null);
    (mockServiceWorkerRegistration.pushManager!.subscribe as jest.Mock).mockResolvedValue(mockPushSubscription);
    (mockServiceWorkerRegistration.pushManager!.permissionState as jest.Mock).mockResolvedValue('granted');
    (mockServiceWorkerRegistration.showNotification as jest.Mock).mockResolvedValue(undefined);
    (mockServiceWorkerRegistration.getNotifications as jest.Mock).mockResolvedValue([]);
    (mockNotification as any).requestPermission.mockResolvedValue('granted');
    Object.defineProperty(mockNotification, 'permission', {
      value: 'default',
      writable: true,
    });

    // CRITICAL: Restore global browser API mocks that clearAllMocks() removes
    // Re-define ServiceWorker API with getter for 'ready' to ensure fresh promise
    Object.defineProperty(global.navigator, 'serviceWorker', {
      value: {
        get ready() {
          return Promise.resolve(mockServiceWorkerRegistration);
        },
        register: jest.fn(),
        addEventListener: jest.fn(),
      },
      writable: true,
      configurable: true,
    });

    // Re-define window.PushManager (required by checkSupport())
    Object.defineProperty(global.window, 'PushManager', {
      value: class PushManager {},
      writable: true,
      configurable: true,
    });

    // Re-define window.Notification (required by checkSupport())
    Object.defineProperty(global, 'Notification', {
      value: mockNotification,
      writable: true,
      configurable: true,
    });

    // Re-define ServiceWorkerRegistration.prototype.showNotification
    // CRITICAL: Always redefine because jest.clearAllMocks() clears the mock function
    // Use Object.defineProperty for more robust mock that survives clearAllMocks()
    Object.defineProperty(ServiceWorkerRegistration.prototype, 'showNotification', {
      value: jest.fn().mockResolvedValue(undefined),
      writable: true,
      configurable: true,
    });

    // Reset fetch mock
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
      status: 200,
    } as unknown as Response);

    // Reset navigator.onLine
    Object.defineProperty(global.navigator, 'onLine', {
      value: true,
      writable: true,
    });

    // CRITICAL: Reset window.atob and window.btoa (required by urlBase64ToUint8Array)
    global.window.atob = jest.fn((str: string) => Buffer.from(str, 'base64').toString('binary'));
    global.window.btoa = jest.fn((str: string) => Buffer.from(str, 'binary').toString('base64'));

    // Reset VAPID key
    process.env.REACT_APP_VAPID_PUBLIC_KEY = 'BNkTEQz1234567890abcdefghijklmnopqrstuvwxyz';

    // CRITICAL: Reinitialize service to ensure isSupported is set
    // The service constructor calls async initializeWebPush() but doesn't await it
    // Tests need to wait for initialization to complete
    await webPushNotificationService.reinitialize();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize on web platform', async () => {
      await webPushNotificationService.reinitialize();
      const status = webPushNotificationService.getStatus();
      expect(status.supported).toBe(true);
    });

    it('should not initialize on non-web platform', () => {
      jest.isolateModules(() => {
        // Set Platform.OS to ios BEFORE importing service
        const { Platform: IsolatePlatform } = require('react-native');
        (IsolatePlatform as any).OS = 'ios';

        const { webPushNotificationService: newService } = require('../webPushNotificationService');
        const status = newService.getStatus();

        expect(status.supported).toBe(false);
      });
    });

    it('should check notification permission on init', async () => {
      await webPushNotificationService.reinitialize();
      const status = webPushNotificationService.getStatus();
      expect(status.permission).toBeDefined();
    });

    it('should load existing subscription on init', async () => {
      // Set up mock to return existing subscription
      (mockServiceWorkerRegistration.pushManager!.getSubscription as jest.Mock)
        .mockResolvedValue(mockPushSubscription);

      // Reinitialize to pick up the existing subscription
      await webPushNotificationService.reinitialize();

      const status = webPushNotificationService.getStatus();
      expect(status.subscribed).toBe(true);
    });

    it('should warn when VAPID key is missing in dev mode', async () => {
      // Set up for VAPID warning test
      const originalDev = (global as any).__DEV__;
      const originalVapid = process.env.REACT_APP_VAPID_PUBLIC_KEY;

      (global as any).__DEV__ = true;
      delete process.env.REACT_APP_VAPID_PUBLIC_KEY;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Reinitialize with __DEV__ = true and no VAPID key
      await webPushNotificationService.reinitialize();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('VAPID public key not configured')
      );

      consoleSpy.mockRestore();
      (global as any).__DEV__ = originalDev;
      process.env.REACT_APP_VAPID_PUBLIC_KEY = originalVapid;
    });

    it('should handle initialization errors gracefully', () => {
      jest.isolateModules(() => {
        // Remove serviceWorker to cause checkSupport to return false
        const navigatorBackup = global.navigator.serviceWorker;
        delete (global.navigator as any).serviceWorker;

        const { webPushNotificationService: newService } = require('../webPushNotificationService');
        const status = newService.getStatus();

        expect(status.supported).toBe(false);

        // Restore serviceWorker
        Object.defineProperty(global.navigator, 'serviceWorker', {
          value: navigatorBackup,
          writable: true,
          configurable: true,
        });
      });
    });
  });

  describe('Permission Request', () => {
    beforeEach(async () => {
      await webPushNotificationService.reinitialize();
    });

    it('should request notification permission', async () => {
      const result = await webPushNotificationService.requestPermission();

      expect((mockNotification as any).requestPermission).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when permission denied', async () => {
      (mockNotification as any).requestPermission = jest.fn().mockResolvedValue('denied');

      const result = await webPushNotificationService.requestPermission();

      expect(result).toBe(false);
    });

    it('should subscribe after permission granted', async () => {
      await webPushNotificationService.requestPermission();

      expect(mockServiceWorkerRegistration.pushManager!.subscribe).toHaveBeenCalled();
    });

    it('should throw error when not supported', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true });

      const { webPushNotificationService: newService } = jest.requireActual('../webPushNotificationService');

      await expect(newService.requestPermission()).rejects.toThrow('not supported');
    });

    it('should handle permission request failure', async () => {
      (mockNotification as any).requestPermission = jest.fn().mockRejectedValue(new Error('Permission denied'));

      const result = await webPushNotificationService.requestPermission();

      expect(result).toBe(false);
    });
  });

  describe('Subscription Management', () => {
    beforeEach(async () => {
      Object.defineProperty(mockNotification, 'permission', { value: 'granted' });
      // Reinitialize after setting permission to pick up 'granted' status
      await webPushNotificationService.reinitialize();
    });

    it('should subscribe to push notifications', async () => {
      const subscription = await webPushNotificationService.subscribe();

      expect(mockServiceWorkerRegistration.pushManager!.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: expect.any(Uint8Array),
      });
      expect(subscription).toBeDefined();
    });

    it('should send subscription to server', async () => {
      await webPushNotificationService.subscribe();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/push/subscribe',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('endpoint'),
        })
      );
    });

    it('should unsubscribe from existing subscription before creating new one', async () => {
      // Set up existing subscription and reinitialize to pick it up
      (mockServiceWorkerRegistration.pushManager!.getSubscription as jest.Mock)
        .mockResolvedValue(mockPushSubscription);
      await webPushNotificationService.reinitialize();

      // Now subscribe again - should unsubscribe from existing first
      await webPushNotificationService.subscribe();

      expect(mockPushSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should throw error when not supported', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', writable: true });

      const { webPushNotificationService: newService } = jest.requireActual('../webPushNotificationService');

      await expect(newService.subscribe()).rejects.toThrow('not available');
    });

    it('should throw error when permission not granted', async () => {
      Object.defineProperty(mockNotification, 'permission', { value: 'denied' });
      await webPushNotificationService.reinitialize();

      await expect(webPushNotificationService.subscribe()).rejects.toThrow('permission not granted');
    });

    it('should throw error when VAPID key missing', async () => {
      delete process.env.REACT_APP_VAPID_PUBLIC_KEY;

      const { webPushNotificationService: newService } = jest.requireActual('../webPushNotificationService');

      await expect(newService.subscribe()).rejects.toThrow();
    });

    it('should handle server communication failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await expect(webPushNotificationService.subscribe()).rejects.toThrow('Failed to send subscription');
    });
  });

  describe('Unsubscription', () => {
    beforeEach(async () => {
      Object.defineProperty(mockNotification, 'permission', { value: 'granted' });
      await webPushNotificationService.reinitialize();
      await webPushNotificationService.subscribe();
    });

    it('should unsubscribe from push notifications', async () => {
      const result = await webPushNotificationService.unsubscribe();

      expect(mockPushSubscription.unsubscribe).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should remove subscription from server', async () => {
      await webPushNotificationService.unsubscribe();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/push/unsubscribe',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('endpoint'),
        })
      );
    });

    it('should clear local subscription on success', async () => {
      await webPushNotificationService.unsubscribe();

      const status = webPushNotificationService.getStatus();
      expect(status.subscribed).toBe(false);
    });

    it('should return true when no subscription exists', async () => {
      await webPushNotificationService.unsubscribe(); // First unsubscribe
      const result = await webPushNotificationService.unsubscribe(); // Second unsubscribe

      expect(result).toBe(true);
    });

    it('should handle unsubscribe failure', async () => {
      (mockPushSubscription.unsubscribe as jest.Mock).mockRejectedValue(new Error('Unsubscribe failed'));

      const result = await webPushNotificationService.unsubscribe();

      expect(result).toBe(false);
    });

    it('should handle server removal failure gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const result = await webPushNotificationService.unsubscribe();

      expect(result).toBe(true); // Still succeeds locally
    });
  });

  describe('Notification Display', () => {
    beforeEach(async () => {
      Object.defineProperty(mockNotification, 'permission', { value: 'granted' });
      await webPushNotificationService.reinitialize();
    });

    it('should show notification via service worker', async () => {
      const payload = {
        title: 'Test Notification',
        body: 'Test body',
        icon: '/test-icon.png',
      };

      await webPushNotificationService.showNotification(payload);

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'Test Notification',
        expect.objectContaining({
          body: 'Test body',
          icon: '/test-icon.png',
        })
      );
    });

    it('should use default icons when not provided', async () => {
      const payload = {
        title: 'Test',
        body: 'Body',
      };

      await webPushNotificationService.showNotification(payload);

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        })
      );
    });

    it('should include additional properties for service worker', async () => {
      const payload = {
        title: 'Test',
        body: 'Body',
        image: '/test-image.png',
        vibrate: [200, 100, 200],
        actions: [{ action: 'open', title: 'Open' }],
      };

      await webPushNotificationService.showNotification(payload);

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          image: '/test-image.png',
          vibrate: [200, 100, 200],
          actions: [{ action: 'open', title: 'Open' }],
        })
      );
    });

    it('should track analytics when enabled', async () => {
      const mockGtag = jest.fn();
      (global.window as unknown as { gtag: jest.Mock }).gtag = mockGtag;

      const payload = {
        title: 'Test',
        body: 'Body',
      };

      await webPushNotificationService.showNotification(payload, { analytics: true });

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'notification_shown',
        expect.objectContaining({
          event_category: 'Notification',
        })
      );

      delete (global.window as any).gtag;
    });

    it('should queue notification when offline and persist enabled', async () => {
      Object.defineProperty(global.navigator, 'onLine', { value: false });
      mockServiceWorkerRegistration.showNotification = jest.fn().mockRejectedValue(new Error('Offline'));

      const payload = {
        title: 'Test',
        body: 'Body',
      };

      await webPushNotificationService.showNotification(payload, { persistWhenOffline: true });

      const status = webPushNotificationService.getStatus();
      expect(status.pendingNotifications).toBe(1);
    });

    it('should throw error when offline and persist disabled', async () => {
      Object.defineProperty(global.navigator, 'onLine', { value: false });
      mockServiceWorkerRegistration.showNotification = jest.fn().mockRejectedValue(new Error('Offline'));

      const payload = {
        title: 'Test',
        body: 'Body',
      };

      await expect(
        webPushNotificationService.showNotification(payload, { persistWhenOffline: false })
      ).rejects.toThrow();
    });

    it('should fallback to basic Notification when service worker unavailable', async () => {
      delete (global.navigator as any).serviceWorker;
      // Set permission to granted so fallback notification can be shown
      Object.defineProperty(mockNotification, 'permission', { value: 'granted', writable: true });

      const { webPushNotificationService: newService } = jest.requireActual('../webPushNotificationService');

      // Manually set permissionStatus since initialization may not complete before test
      (newService as any).permissionStatus = 'granted';

      const payload = {
        title: 'Test',
        body: 'Body',
      };

      await newService.showNotification(payload);

      expect(mockNotification).toHaveBeenCalled();
    });
  });

  describe('Test Notification', () => {
    beforeEach(async () => {
      Object.defineProperty(mockNotification, 'permission', { value: 'granted' });
      await webPushNotificationService.reinitialize();
    });

    it('should send test notification', async () => {
      await webPushNotificationService.sendTestNotification();

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        expect.stringContaining('Test'),
        expect.objectContaining({
          body: expect.stringContaining('test notification'),
        })
      );
    });

    it('should include actions in test notification', async () => {
      await webPushNotificationService.sendTestNotification();

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          actions: expect.arrayContaining([
            expect.objectContaining({ action: 'open' }),
            expect.objectContaining({ action: 'dismiss' }),
          ]),
        })
      );
    });

    it('should track test notification analytics', async () => {
      const mockGtag = jest.fn();
      (global.window as unknown as { gtag: jest.Mock }).gtag = mockGtag;

      await webPushNotificationService.sendTestNotification();

      expect(mockGtag).toHaveBeenCalled();

      delete (global.window as any).gtag;
    });
  });

  describe('Pending Notifications', () => {
    beforeEach(async () => {
      Object.defineProperty(mockNotification, 'permission', { value: 'granted' });
      await webPushNotificationService.reinitialize();
      Object.defineProperty(global.navigator, 'onLine', { value: false });
      (mockServiceWorkerRegistration.showNotification as jest.Mock).mockRejectedValue(new Error('Offline'));
    });

    it('should process pending notifications', async () => {
      const payload1 = { title: 'Test 1', body: 'Body 1' };
      const payload2 = { title: 'Test 2', body: 'Body 2' };

      await webPushNotificationService.showNotification(payload1, { persistWhenOffline: true });
      await webPushNotificationService.showNotification(payload2, { persistWhenOffline: true });

      // Come back online
      Object.defineProperty(global.navigator, 'onLine', { value: true });
      mockServiceWorkerRegistration.showNotification = jest.fn().mockResolvedValue(undefined);

      await webPushNotificationService.processPendingNotifications();

      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledTimes(2);
    });

    it('should clear pending notifications after processing', async () => {
      const payload = { title: 'Test', body: 'Body' };
      await webPushNotificationService.showNotification(payload, { persistWhenOffline: true });

      Object.defineProperty(global.navigator, 'onLine', { value: true });
      mockServiceWorkerRegistration.showNotification = jest.fn().mockResolvedValue(undefined);

      await webPushNotificationService.processPendingNotifications();

      const status = webPushNotificationService.getStatus();
      expect(status.pendingNotifications).toBe(0);
    });

    it('should handle pending notification failures', async () => {
      const payload = { title: 'Test', body: 'Body' };
      await webPushNotificationService.showNotification(payload, { persistWhenOffline: true });

      Object.defineProperty(global.navigator, 'onLine', { value: true });
      mockServiceWorkerRegistration.showNotification = jest.fn().mockRejectedValue(new Error('Failed'));

      await webPushNotificationService.processPendingNotifications();

      // Should complete without throwing
    });

    it('should use lock to prevent concurrent processing', async () => {
      const payload1 = { title: 'Test 1', body: 'Body 1' };
      const payload2 = { title: 'Test 2', body: 'Body 2' };

      await webPushNotificationService.showNotification(payload1, { persistWhenOffline: true });
      await webPushNotificationService.showNotification(payload2, { persistWhenOffline: true });

      Object.defineProperty(global.navigator, 'onLine', { value: true });
      mockServiceWorkerRegistration.showNotification = jest.fn().mockResolvedValue(undefined);

      // Trigger multiple concurrent processings
      await Promise.all([
        webPushNotificationService.processPendingNotifications(),
        webPushNotificationService.processPendingNotifications(),
      ]);

      // Should only process once due to lock
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledTimes(2);
    });
  });

  describe('Subscription Preferences', () => {
    it('should update subscription preferences', async () => {
      const preferences = {
        events: true,
        messages: true,
        reminders: false,
        marketing: false,
      };

      await webPushNotificationService.updateSubscriptionPreferences(preferences);

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/push/preferences',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('events'),
        })
      );
    });

    it('should throw error when server update fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await expect(
        webPushNotificationService.updateSubscriptionPreferences({})
      ).rejects.toThrow('Failed to update preferences');
    });
  });

  describe('Status and Utilities', () => {
    it('should return current status', () => {
      const status = webPushNotificationService.getStatus();

      expect(status).toHaveProperty('supported');
      expect(status).toHaveProperty('permission');
      expect(status).toHaveProperty('subscribed');
      expect(status).toHaveProperty('pendingNotifications');
    });

    it('should include endpoint in status when subscribed', async () => {
      Object.defineProperty(mockNotification, 'permission', { value: 'granted' });
      await webPushNotificationService.reinitialize();
      await webPushNotificationService.subscribe();

      const status = webPushNotificationService.getStatus();

      expect(status.endpoint).toBeDefined();
    });

    it('should convert URL-safe base64 to Uint8Array', async () => {
      Object.defineProperty(mockNotification, 'permission', { value: 'granted' });
      await webPushNotificationService.reinitialize();

      await webPushNotificationService.subscribe();

      // Verify subscribe was called with Uint8Array (conversion worked)
      expect(mockServiceWorkerRegistration.pushManager!.subscribe).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationServerKey: expect.any(Uint8Array),
        })
      );
    });

    it('should convert ArrayBuffer to base64', async () => {
      Object.defineProperty(mockNotification, 'permission', { value: 'granted' });
      await webPushNotificationService.reinitialize();

      await webPushNotificationService.subscribe();

      // Verify fetch was called with base64 keys (conversion worked)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/push/subscribe',
        expect.objectContaining({
          body: expect.stringContaining('p256dh'),
        })
      );
    });
  });

  describe('Memory Management', () => {
    it('should cleanup resources on destroy', () => {
      webPushNotificationService.destroy();

      const status = webPushNotificationService.getStatus();
      expect(status.pendingNotifications).toBe(0);
      expect(status.subscribed).toBe(false);
    });

    it('should handle multiple destroy calls', () => {
      webPushNotificationService.destroy();
      webPushNotificationService.destroy();

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Server Synchronization', () => {
    it('should sync subscription with server on init', async () => {
      (mockServiceWorkerRegistration.pushManager!.getSubscription as jest.Mock)
        .mockResolvedValue(mockPushSubscription);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: jest.fn() } as unknown as Response);

      // Reinitialize with existing subscription to trigger sync
      await webPushNotificationService.reinitialize();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/push/verify',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should resubscribe if server verification fails', async () => {
      (mockServiceWorkerRegistration.pushManager!.getSubscription as jest.Mock)
        .mockResolvedValue(mockPushSubscription);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 } as Response) // Verify fails
        .mockResolvedValueOnce({ ok: true } as Response); // Resubscribe succeeds

      // Reinitialize to trigger sync and resubscribe
      await webPushNotificationService.reinitialize();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/push/subscribe',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });
});
