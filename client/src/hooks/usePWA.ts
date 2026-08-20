/**
 * PERFECT PWA HOOK
 * Provides comprehensive PWA state management and utilities
 */

import { useState, useEffect, useCallback } from 'react';
import { pwaManager, NotificationOptions, BackgroundSyncOptions } from '@/lib/pwa';
import { logger } from '@/lib/logger';

export interface PWAState {
  isOnline: boolean;
  canInstall: boolean;
  isStandalone: boolean;
  hasUpdate: boolean;
  isSupported: boolean;
  installationStatus: 'not-supported' | 'available' | 'installed';
}

export interface PWAActions {
  install: () => Promise<boolean>;
  update: () => Promise<void>;
  showNotification: (options: NotificationOptions) => Promise<void>;
  scheduleSync: (options: BackgroundSyncOptions) => Promise<void>;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  subscribeToPush: (vapidKey: string) => Promise<PushSubscription | null>;
}

/**
 * Perfect PWA hook with comprehensive functionality
 */
export const usePWA = () => {
  const [state, setState] = useState<PWAState>({
    isOnline: true,
    canInstall: false,
    isStandalone: false,
    hasUpdate: false,
    isSupported: false,
    installationStatus: 'not-supported'
  });

  const [isInstalling, setIsInstalling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize PWA state
  useEffect(() => {
    const initializePWAState = () => {
      setState({
        isOnline: pwaManager.getOnlineStatus(),
        canInstall: pwaManager.canInstall(),
        isStandalone: pwaManager.isStandalone(),
        hasUpdate: false, // Will be updated by service worker events
        isSupported: 'serviceWorker' in navigator,
        installationStatus: pwaManager.getInstallationStatus()
      });
    };

    initializePWAState();

    // Subscribe to online status changes
    const unsubscribeOnline = pwaManager.onlineStatusSubscribe((isOnline) => {
      setState(prev => ({ ...prev, isOnline }));
    });

    // Listen for service worker events
    // BUG FIX: Store message handler reference for cleanup
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'UPDATE_AVAILABLE') {
        setState(prev => ({ ...prev, hasUpdate: true }));
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

      // Check for waiting service worker
      // BUG FIX: Added .catch() handler for unhandled promise rejection
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          if (registration.waiting) {
            setState(prev => ({ ...prev, hasUpdate: true }));
          }
        });
      }).catch(error => {
        logger.error('pwa', 'Failed to get service worker registrations', { error });
      });
    }

    // Listen for install prompt events
    const handleBeforeInstallPrompt = () => {
      setState(prev => ({ 
        ...prev, 
        canInstall: true,
        installationStatus: 'available'
      }));
    };

    const handleAppInstalled = () => {
      setState(prev => ({ 
        ...prev, 
        canInstall: false,
        isStandalone: true,
        installationStatus: 'installed'
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      unsubscribeOnline();
      // BUG FIX: Also remove service worker message listener to prevent memory leaks
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Install PWA
  const install = useCallback(async (): Promise<boolean> => {
    if (!state.canInstall) {
      return false;
    }

    setIsInstalling(true);
    
    try {
      const result = await pwaManager.promptInstall();
      
      if (result?.outcome === 'accepted') {
        setState(prev => ({ 
          ...prev, 
          canInstall: false,
          installationStatus: 'installed'
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('pwa', 'PWA installation failed', { error });
      return false;
    } finally {
      setIsInstalling(false);
    }
  }, [state.canInstall]);

  // Update service worker
  const update = useCallback(async (): Promise<void> => {
    if (!state.hasUpdate) {
      return;
    }

    setIsUpdating(true);
    
    try {
      await pwaManager.activateServiceWorker();
      setState(prev => ({ ...prev, hasUpdate: false }));
    } catch (error) {
      logger.error('pwa', 'PWA update failed', { error });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [state.hasUpdate]);

  // Show notification
  const showNotification = useCallback(async (options: NotificationOptions): Promise<void> => {
    try {
      await pwaManager.showNotification(options);
    } catch (error) {
      logger.error('pwa', 'Notification failed', { error, options });
      throw error;
    }
  }, []);

  // Schedule background sync
  const scheduleSync = useCallback(async (options: BackgroundSyncOptions): Promise<void> => {
    try {
      await pwaManager.scheduleBackgroundSync(options);
    } catch (error) {
      logger.error('pwa', 'Background sync scheduling failed', { error, options });
      throw error;
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      return await pwaManager.requestNotificationPermission();
    } catch (error) {
      logger.error('pwa', 'Notification permission request failed', { error });
      throw error;
    }
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (vapidKey: string): Promise<PushSubscription | null> => {
    try {
      return await pwaManager.subscribeToPushNotifications(vapidKey);
    } catch (error) {
      logger.error('pwa', 'Push subscription failed', { error, vapidKey: vapidKey.substring(0, 20) + '...' });
      throw error;
    }
  }, []);

  const actions: PWAActions = {
    install,
    update,
    showNotification,
    scheduleSync,
    requestNotificationPermission,
    subscribeToPush
  };

  return {
    ...state,
    isInstalling,
    isUpdating,
    actions
  };
};

/**
 * Hook for offline state management
 */
export const useOfflineStatus = () => {
  // BUG FIX: Add SSR check before accessing navigator.onLine
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = pwaManager.onlineStatusSubscribe((online) => {
      if (!online && isOnline) {
        setWasOffline(true);
      }
      setIsOnline(online);
    });

    return unsubscribe;
  }, [isOnline]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    hasReconnected: wasOffline && isOnline
  };
};

/**
 * Hook for PWA installation state
 */
export const useInstallPrompt = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setCanInstall(pwaManager.canInstall());
    setIsStandalone(pwaManager.isStandalone());

    const handleBeforeInstallPrompt = () => setCanInstall(true);
    const handleAppInstalled = () => {
      setCanInstall(false);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!canInstall) return false;
    
    try {
      const result = await pwaManager.promptInstall();
      return result?.outcome === 'accepted';
    } catch (error) {
      logger.error('pwa', 'Install prompt failed', { error });
      return false;
    }
  }, [canInstall]);

  return {
    canInstall,
    isStandalone,
    isInstallable: canInstall && !isStandalone,
    promptInstall
  };
};

export default usePWA;