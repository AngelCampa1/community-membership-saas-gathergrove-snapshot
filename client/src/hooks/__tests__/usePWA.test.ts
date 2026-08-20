/**
 * usePWA Tests - Full Coverage
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePWA, useOfflineStatus, useInstallPrompt } from '../usePWA';
import { pwaManager } from '@/lib/pwa';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/lib/pwa', () => ({
  pwaManager: {
    getOnlineStatus: jest.fn().mockReturnValue(true),
    canInstall: jest.fn().mockReturnValue(false),
    isStandalone: jest.fn().mockReturnValue(false),
    getInstallationStatus: jest.fn().mockReturnValue('not-supported'),
    onlineStatusSubscribe: jest.fn().mockReturnValue(() => {}),
    promptInstall: jest.fn().mockResolvedValue({ outcome: 'accepted' }),
    activateServiceWorker: jest.fn().mockResolvedValue(undefined),
    showNotification: jest.fn().mockResolvedValue(undefined),
    scheduleBackgroundSync: jest.fn().mockResolvedValue(undefined),
    requestNotificationPermission: jest.fn().mockResolvedValue('granted'),
    subscribeToPushNotifications: jest.fn().mockResolvedValue(null),
  },
}));
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('usePWA', () => {
  let serviceWorkerListeners: Map<string, EventListener> = new Map();
  let windowListeners: Map<string, EventListener> = new Map();
  let onlineStatusSubscribers: Array<(status: boolean) => void> = [];

  const mockNavigatorServiceWorker = () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: {
        addEventListener: jest.fn((event: string, listener: EventListener) => {
          serviceWorkerListeners.set(event, listener);
        }),
        removeEventListener: jest.fn((event: string, listener: EventListener) => {
          serviceWorkerListeners.delete(event);
        }),
        getRegistrations: jest.fn().mockResolvedValue([]),
      },
    });
  };

  beforeEach(() => {
    serviceWorkerListeners = new Map();
    windowListeners = new Map();
    onlineStatusSubscribers = [];

    // Reset all mocks to ensure clean state
    jest.resetAllMocks();

    // Mock window.addEventListener
    jest.spyOn(window, 'addEventListener').mockImplementation((event, listener) => {
      windowListeners.set(event as string, listener as EventListener);
    });

    // Mock window.removeEventListener
    jest.spyOn(window, 'removeEventListener').mockImplementation((event) => {
      windowListeners.delete(event as string);
    });

    // Mock pwaManager with default implementations
    (pwaManager.getOnlineStatus as jest.Mock).mockReturnValue(true);
    (pwaManager.canInstall as jest.Mock).mockReturnValue(false);
    (pwaManager.isStandalone as jest.Mock).mockReturnValue(false);
    (pwaManager.getInstallationStatus as jest.Mock).mockReturnValue('not-supported');
    (pwaManager.promptInstall as jest.Mock).mockResolvedValue({ outcome: 'accepted' });
    (pwaManager.activateServiceWorker as jest.Mock).mockResolvedValue(undefined);
    (pwaManager.showNotification as jest.Mock).mockResolvedValue(undefined);
    (pwaManager.scheduleBackgroundSync as jest.Mock).mockResolvedValue(undefined);
    (pwaManager.requestNotificationPermission as jest.Mock).mockResolvedValue('granted');
    (pwaManager.subscribeToPushNotifications as jest.Mock).mockResolvedValue(null);
    (pwaManager.onlineStatusSubscribe as jest.Mock).mockImplementation((callback) => {
      onlineStatusSubscribers.push(callback);
      return () => {
        onlineStatusSubscribers = onlineStatusSubscribers.filter(cb => cb !== callback);
      };
    });

    mockNavigatorServiceWorker();
  });

  afterEach(() => {
    // Clear call history and reset implementations
    jest.clearAllMocks();
  });

  // Helper to wait for effects to run and get message listener
  const waitForMessageListener = async (): Promise<(event: any) => void> => {
    await waitFor(() => {
      expect(serviceWorkerListeners.get('message')).toBeDefined();
    });
    return serviceWorkerListeners.get('message') as (event: any) => void;
  };

  describe('Initial State', () => {
    it('should initialize with PWA state from pwaManager', () => {
      (pwaManager.getOnlineStatus as jest.Mock).mockReturnValue(true);
      (pwaManager.canInstall as jest.Mock).mockReturnValue(true);
      (pwaManager.isStandalone as jest.Mock).mockReturnValue(false);
      (pwaManager.getInstallationStatus as jest.Mock).mockReturnValue('available');

      const { result } = renderHook(() => usePWA());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.canInstall).toBe(true);
      expect(result.current.isStandalone).toBe(false);
      expect(result.current.hasUpdate).toBe(false);
      expect(result.current.isSupported).toBe(true); // serviceWorker in navigator
      expect(result.current.installationStatus).toBe('available');
      expect(result.current.isInstalling).toBe(false);
      expect(result.current.isUpdating).toBe(false);
    });

    it('should have all action methods', () => {
      const { result } = renderHook(() => usePWA());

      expect(result.current.actions.install).toBeDefined();
      expect(result.current.actions.update).toBeDefined();
      expect(result.current.actions.showNotification).toBeDefined();
      expect(result.current.actions.scheduleSync).toBeDefined();
      expect(result.current.actions.requestNotificationPermission).toBeDefined();
      expect(result.current.actions.subscribeToPush).toBeDefined();
    });
  });

  describe('Online Status Management', () => {
    it('should subscribe to online status changes', () => {
      const { result } = renderHook(() => usePWA());

      expect(pwaManager.onlineStatusSubscribe).toHaveBeenCalled();

      // Simulate going offline
      act(() => {
        onlineStatusSubscribers.forEach(cb => cb(false));
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('should update status when going back online', () => {
      const { result } = renderHook(() => usePWA());

      act(() => {
        onlineStatusSubscribers.forEach(cb => cb(false));
      });
      expect(result.current.isOnline).toBe(false);

      act(() => {
        onlineStatusSubscribers.forEach(cb => cb(true));
      });
      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('Service Worker Events', () => {
    it('should handle UPDATE_AVAILABLE message', async () => {
      const { result } = renderHook(() => usePWA());

      expect(result.current.hasUpdate).toBe(false);

      const messageListener = await waitForMessageListener();
      act(() => {
        messageListener({ data: { type: 'UPDATE_AVAILABLE' } });
      });

      expect(result.current.hasUpdate).toBe(true);
    });

    it('should check for waiting service workers on mount', async () => {
      const mockRegistration = { waiting: {} };
      (navigator.serviceWorker.getRegistrations as jest.Mock).mockResolvedValue([mockRegistration]);

      const { result } = renderHook(() => usePWA());

      await waitFor(() => {
        expect(result.current.hasUpdate).toBe(true);
      });
    });

    it('should handle getRegistrations error gracefully', async () => {
      const mockError = new Error('Registration error');
      (navigator.serviceWorker.getRegistrations as jest.Mock).mockRejectedValue(mockError);

      renderHook(() => usePWA());

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith(
          'pwa',
          'Failed to get service worker registrations',
          { error: mockError }
        );
      });
    });
  });

  describe('Install Prompt Events', () => {
    it('should handle beforeinstallprompt event', () => {
      const { result } = renderHook(() => usePWA());

      const beforeInstallPromptListener = windowListeners.get('beforeinstallprompt');
      act(() => {
        beforeInstallPromptListener?.(new Event('beforeinstallprompt'));
      });

      expect(result.current.canInstall).toBe(true);
      expect(result.current.installationStatus).toBe('available');
    });

    it('should handle appinstalled event', () => {
      const { result } = renderHook(() => usePWA());

      const appInstalledListener = windowListeners.get('appinstalled');
      act(() => {
        appInstalledListener?.(new Event('appinstalled'));
      });

      expect(result.current.canInstall).toBe(false);
      expect(result.current.isStandalone).toBe(true);
      expect(result.current.installationStatus).toBe('installed');
    });
  });

  describe('install()', () => {
    it('should return false if cannot install', async () => {
      (pwaManager.canInstall as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => usePWA());

      let success;
      await act(async () => {
        success = await result.current.actions.install();
      });

      expect(success).toBe(false);
      expect(pwaManager.promptInstall).not.toHaveBeenCalled();
    });

    it('should install PWA successfully', async () => {
      (pwaManager.canInstall as jest.Mock).mockReturnValue(true);
      (pwaManager.promptInstall as jest.Mock).mockResolvedValue({ outcome: 'accepted' });

      const { result } = renderHook(() => usePWA());

      // Trigger beforeinstallprompt to set canInstall to true
      const beforeInstallPromptListener = windowListeners.get('beforeinstallprompt');
      act(() => {
        beforeInstallPromptListener?.(new Event('beforeinstallprompt'));
      });

      let success;
      await act(async () => {
        success = await result.current.actions.install();
      });

      expect(success).toBe(true);
      expect(result.current.canInstall).toBe(false);
      expect(result.current.installationStatus).toBe('installed');
    });

    it('should return false when installation is dismissed', async () => {
      (pwaManager.canInstall as jest.Mock).mockReturnValue(true);
      (pwaManager.promptInstall as jest.Mock).mockResolvedValue({ outcome: 'dismissed' });

      const { result } = renderHook(() => usePWA());

      const beforeInstallPromptListener = windowListeners.get('beforeinstallprompt');
      act(() => {
        beforeInstallPromptListener?.(new Event('beforeinstallprompt'));
      });

      let success;
      await act(async () => {
        success = await result.current.actions.install();
      });

      expect(success).toBe(false);
    });

    it('should handle installation error', async () => {
      (pwaManager.canInstall as jest.Mock).mockReturnValue(true);
      const mockError = new Error('Install error');
      (pwaManager.promptInstall as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => usePWA());

      const beforeInstallPromptListener = windowListeners.get('beforeinstallprompt');
      act(() => {
        beforeInstallPromptListener?.(new Event('beforeinstallprompt'));
      });

      let success;
      await act(async () => {
        success = await result.current.actions.install();
      });

      expect(success).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('pwa', 'PWA installation failed', { error: mockError });
    });

    it('should set isInstalling during installation', async () => {
      jest.useFakeTimers();

      (pwaManager.canInstall as jest.Mock).mockReturnValue(true);
      let resolvePrompt: (value: any) => void;
      (pwaManager.promptInstall as jest.Mock).mockImplementation(() => new Promise(resolve => {
        resolvePrompt = resolve;
      }));

      const { result } = renderHook(() => usePWA());

      const beforeInstallPromptListener = windowListeners.get('beforeinstallprompt');
      act(() => {
        beforeInstallPromptListener?.(new Event('beforeinstallprompt'));
      });

      // Start install without awaiting
      let installPromise: Promise<void>;
      act(() => {
        installPromise = result.current.actions.install().then();
      });

      // Should be installing
      expect(result.current.isInstalling).toBe(true);

      // Resolve the prompt
      await act(async () => {
        resolvePrompt!({ outcome: 'accepted' });
        await installPromise;
      });

      // Should finish installing
      expect(result.current.isInstalling).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('update()', () => {
    it('should return early if no update available', async () => {
      const { result } = renderHook(() => usePWA());

      expect(result.current.hasUpdate).toBe(false);

      await act(async () => {
        await result.current.actions.update();
      });

      expect(pwaManager.activateServiceWorker).not.toHaveBeenCalled();
    });

    it('should activate service worker when update available', async () => {
      const { result } = renderHook(() => usePWA());

      // Set hasUpdate to true
      const messageListener = await waitForMessageListener();
      act(() => {
        messageListener({ data: { type: 'UPDATE_AVAILABLE' } });
      });

      expect(result.current.hasUpdate).toBe(true);

      await act(async () => {
        await result.current.actions.update();
      });

      expect(pwaManager.activateServiceWorker).toHaveBeenCalled();
      expect(result.current.hasUpdate).toBe(false);
    });

    it('should handle update error', async () => {
      const mockError = new Error('Update error');
      (pwaManager.activateServiceWorker as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => usePWA());

      const messageListener = await waitForMessageListener();
      act(() => {
        messageListener({ data: { type: 'UPDATE_AVAILABLE' } });
      });

      try {
        await act(async () => {
          await result.current.actions.update();
        });
        fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toBe('Update error');
      }

      expect(logger.error).toHaveBeenCalledWith('pwa', 'PWA update failed', { error: mockError });
    });
  });

  describe('showNotification()', () => {
    it('should show notification successfully', async () => {
      const { result } = renderHook(() => usePWA());

      const notificationOptions = { title: 'Test', body: 'Test notification' };

      await act(async () => {
        await result.current.actions.showNotification(notificationOptions);
      });

      expect(pwaManager.showNotification).toHaveBeenCalledWith(notificationOptions);
    });

    it('should handle notification error', async () => {
      const mockError = new Error('Notification error');
      (pwaManager.showNotification as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => usePWA());

      const notificationOptions = { title: 'Test' };

      try {
        await act(async () => {
          await result.current.actions.showNotification(notificationOptions);
        });
        fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toBe('Notification error');
      }

      expect(logger.error).toHaveBeenCalledWith('pwa', 'Notification failed', { error: mockError, options: notificationOptions });
    });
  });

  describe('scheduleSync()', () => {
    it('should schedule background sync successfully', async () => {
      const { result } = renderHook(() => usePWA());

      const syncOptions = { tag: 'sync-data' };

      await act(async () => {
        await result.current.actions.scheduleSync(syncOptions);
      });

      expect(pwaManager.scheduleBackgroundSync).toHaveBeenCalledWith(syncOptions);
    });

    it('should handle sync scheduling error', async () => {
      const mockError = new Error('Sync error');
      (pwaManager.scheduleBackgroundSync as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => usePWA());

      const syncOptions = { tag: 'sync-data' };

      try {
        await act(async () => {
          await result.current.actions.scheduleSync(syncOptions);
        });
        fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toBe('Sync error');
      }

      expect(logger.error).toHaveBeenCalledWith('pwa', 'Background sync scheduling failed', { error: mockError, options: syncOptions });
    });
  });

  describe('requestNotificationPermission()', () => {
    it('should request permission successfully', async () => {
      (pwaManager.requestNotificationPermission as jest.Mock).mockResolvedValue('granted');

      const { result } = renderHook(() => usePWA());

      let permission;
      await act(async () => {
        permission = await result.current.actions.requestNotificationPermission();
      });

      expect(permission).toBe('granted');
      expect(pwaManager.requestNotificationPermission).toHaveBeenCalled();
    });

    it('should handle permission request error', async () => {
      const mockError = new Error('Permission error');
      (pwaManager.requestNotificationPermission as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => usePWA());

      try {
        await act(async () => {
          await result.current.actions.requestNotificationPermission();
        });
        fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toBe('Permission error');
      }

      expect(logger.error).toHaveBeenCalledWith('pwa', 'Notification permission request failed', { error: mockError });
    });
  });

  describe('subscribeToPush()', () => {
    it('should subscribe to push notifications successfully', async () => {
      const mockSubscription = { endpoint: 'https://example.com/push' };
      (pwaManager.subscribeToPushNotifications as jest.Mock).mockResolvedValue(mockSubscription);

      const { result } = renderHook(() => usePWA());

      let subscription;
      await act(async () => {
        subscription = await result.current.actions.subscribeToPush('test-vapid-key-1234567890');
      });

      expect(subscription).toBe(mockSubscription);
      expect(pwaManager.subscribeToPushNotifications).toHaveBeenCalledWith('test-vapid-key-1234567890');
    });

    it('should handle push subscription error', async () => {
      const mockError = new Error('Push error');
      (pwaManager.subscribeToPushNotifications as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => usePWA());

      const vapidKey = 'test-vapid-key-1234567890';

      try {
        await act(async () => {
          await result.current.actions.subscribeToPush(vapidKey);
        });
        fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toBe('Push error');
      }

      expect(logger.error).toHaveBeenCalledWith('pwa', 'Push subscription failed', { error: mockError, vapidKey: 'test-vapid-key-12345...' });
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe from online status on unmount', () => {
      const unsubscribeSpy = jest.fn();
      (pwaManager.onlineStatusSubscribe as jest.Mock).mockReturnValue(unsubscribeSpy);

      const { unmount } = renderHook(() => usePWA());

      unmount();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should remove service worker message listener on unmount', () => {
      const { unmount } = renderHook(() => usePWA());

      unmount();

      expect(navigator.serviceWorker.removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should remove window event listeners on unmount', () => {
      const { unmount } = renderHook(() => usePWA());

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('appinstalled', expect.any(Function));
    });
  });
});

describe('useOfflineStatus', () => {
  let onlineStatusSubscribers: Array<(status: boolean) => void> = [];

  beforeEach(() => {
    onlineStatusSubscribers = [];

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });

    (pwaManager.onlineStatusSubscribe as jest.Mock).mockImplementation((callback) => {
      onlineStatusSubscribers.push(callback);
      return () => {
        onlineStatusSubscribers = onlineStatusSubscribers.filter(cb => cb !== callback);
      };
    });
  });

  it('should initialize with online status', () => {
    const { result } = renderHook(() => useOfflineStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
    expect(result.current.wasOffline).toBe(false);
    expect(result.current.hasReconnected).toBe(false);
  });

  it('should track offline state', () => {
    const { result } = renderHook(() => useOfflineStatus());

    act(() => {
      onlineStatusSubscribers.forEach(cb => cb(false));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
    expect(result.current.wasOffline).toBe(true);
  });

  it('should track reconnection', () => {
    const { result } = renderHook(() => useOfflineStatus());

    // Go offline
    act(() => {
      onlineStatusSubscribers.forEach(cb => cb(false));
    });

    expect(result.current.wasOffline).toBe(true);

    // Go back online
    act(() => {
      onlineStatusSubscribers.forEach(cb => cb(true));
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.hasReconnected).toBe(true);
  });

  it('should unsubscribe on unmount', () => {
    const unsubscribeSpy = jest.fn();
    (pwaManager.onlineStatusSubscribe as jest.Mock).mockReturnValue(unsubscribeSpy);

    const { unmount } = renderHook(() => useOfflineStatus());

    unmount();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});

describe('useInstallPrompt', () => {
  let windowListeners: Map<string, EventListener> = new Map();

  beforeEach(() => {
    windowListeners = new Map();

    jest.spyOn(window, 'addEventListener').mockImplementation((event, listener) => {
      windowListeners.set(event as string, listener as EventListener);
    });

    jest.spyOn(window, 'removeEventListener').mockImplementation((event) => {
      windowListeners.delete(event as string);
    });

    (pwaManager.canInstall as jest.Mock).mockReturnValue(false);
    (pwaManager.isStandalone as jest.Mock).mockReturnValue(false);
  });

  it('should initialize with install state', () => {
    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.canInstall).toBe(false);
    expect(result.current.isStandalone).toBe(false);
    expect(result.current.isInstallable).toBe(false);
  });

  it('should handle beforeinstallprompt event', () => {
    const { result } = renderHook(() => useInstallPrompt());

    const listener = windowListeners.get('beforeinstallprompt');
    act(() => {
      listener?.(new Event('beforeinstallprompt'));
    });

    expect(result.current.canInstall).toBe(true);
  });

  it('should handle appinstalled event', () => {
    const { result } = renderHook(() => useInstallPrompt());

    const listener = windowListeners.get('appinstalled');
    act(() => {
      listener?.(new Event('appinstalled'));
    });

    expect(result.current.canInstall).toBe(false);
    expect(result.current.isStandalone).toBe(true);
  });

  it('should calculate isInstallable correctly', () => {
    (pwaManager.canInstall as jest.Mock).mockReturnValue(true);
    (pwaManager.isStandalone as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => useInstallPrompt());

    const listener = windowListeners.get('beforeinstallprompt');
    act(() => {
      listener?.(new Event('beforeinstallprompt'));
    });

    expect(result.current.isInstallable).toBe(true);
  });

  it('should prompt install successfully', async () => {
    (pwaManager.promptInstall as jest.Mock).mockResolvedValue({ outcome: 'accepted' });

    const { result } = renderHook(() => useInstallPrompt());

    const listener = windowListeners.get('beforeinstallprompt');
    act(() => {
      listener?.(new Event('beforeinstallprompt'));
    });

    let success;
    await act(async () => {
      success = await result.current.promptInstall();
    });

    expect(success).toBe(true);
  });

  it('should return false when promptInstall fails', async () => {
    const mockError = new Error('Install error');
    (pwaManager.promptInstall as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useInstallPrompt());

    const listener = windowListeners.get('beforeinstallprompt');
    act(() => {
      listener?.(new Event('beforeinstallprompt'));
    });

    let success;
    await act(async () => {
      success = await result.current.promptInstall();
    });

    expect(success).toBe(false);
    expect(logger.error).toHaveBeenCalledWith('pwa', 'Install prompt failed', { error: mockError });
  });

  it('should return false when cannot install', async () => {
    const { result } = renderHook(() => useInstallPrompt());

    let success;
    await act(async () => {
      success = await result.current.promptInstall();
    });

    expect(success).toBe(false);
    expect(pwaManager.promptInstall).not.toHaveBeenCalled();
  });

  it('should cleanup event listeners on unmount', () => {
    const { unmount } = renderHook(() => useInstallPrompt());

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('appinstalled', expect.any(Function));
  });
});
