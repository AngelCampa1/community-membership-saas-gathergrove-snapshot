import { useState, useEffect, useCallback } from 'react';
import pushNotificationService from '../services/pushNotificationService';
import type { AppStateStatus } from 'react-native';

// Define AppState type interface for safe imports and test fallbacks
interface AppStateModule {
  addEventListener: (type: string, listener: (state: AppStateStatus) => void) => { remove: () => void };
  currentState: AppStateStatus;
}

// Safely import AppState with fallback for tests
let AppState: AppStateModule;

try {
  const ReactNative = require('react-native');
  AppState = ReactNative?.AppState;
} catch (error) {
  // Fallback for test environments
  AppState = {
    addEventListener: () => ({ remove: () => {} }),
    currentState: 'active' as AppStateStatus
  };
}

export interface PushNotificationState {
  isInitialized: boolean;
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    isInitialized: false,
    hasPermission: false,
    isLoading: false,
    error: null,
  });

  /**
   * Initialize push notifications
   */
  const initializePushNotifications = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await pushNotificationService.initialize();
      const hasPermission = await pushNotificationService.hasPermission();
      const initialized = pushNotificationService.isServiceInitialized();
      
      setState({
        isInitialized: initialized,
        hasPermission,
        isLoading: false,
        error: null,
      });

      return initialized;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize push notifications';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, []);

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const permissions = await pushNotificationService.requestPermissions();
      const hasPermission = typeof permissions === 'boolean' ? permissions : permissions?.granted || false;
      
      setState(prev => ({
        ...prev,
        hasPermission,
        isLoading: false,
        error: null,
      }));

      return hasPermission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request permission';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, []);

  /**
   * Check permission status
   */
  const checkPermission = useCallback(async () => {
    try {
      const hasPermission = await pushNotificationService.hasPermission();
      setState(prev => ({ ...prev, hasPermission }));
      return hasPermission;
    } catch (error) {
      return false;
    }
  }, []);

  /**
   * Cleanup push notifications (call on logout)
   */
  const cleanup = useCallback(async () => {
    try {
      await pushNotificationService.cleanup();
      setState({
        isInitialized: false,
        hasPermission: false,
        isLoading: false,
        error: null,
      });
    } catch (_err) { /* Error handled */ }
  }, []);

  /**
   * Reset badge count
   */
  const resetBadgeCount = useCallback(async () => {
    try {
      await pushNotificationService.resetBadgeCount();
    } catch (_err) { /* Error handled */ }
  }, []);

  /**
   * Handle app state changes to check permission status
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Check permission when app becomes active
        checkPermission();
      }
    };

    const subscription = AppState?.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [checkPermission]);

  return {
    ...state,
    initializePushNotifications,
    requestPermission,
    checkPermission,
    cleanup,
    resetBadgeCount,
  };
}; 