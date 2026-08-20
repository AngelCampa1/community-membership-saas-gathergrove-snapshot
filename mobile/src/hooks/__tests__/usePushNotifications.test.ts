// Mock React Native components first - CRITICAL ORDER
const mockAddEventListener = jest.fn();
const mockRemoveListener = jest.fn();
const mockSubscription = { remove: mockRemoveListener };

// Mock React Native AppState BEFORE other imports
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: mockAddEventListener,
    currentState: 'active',
  },
}));

// Since the hook has a try-catch that might use the fallback,
// we need to ensure the mock is properly set up
beforeAll(() => {
  mockAddEventListener.mockReturnValue(mockSubscription);
});

// Mock the service completely BEFORE hook import
jest.mock('../../services/pushNotificationService', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    requestPermissions: jest.fn(),
    hasPermission: jest.fn(),
    isServiceInitialized: jest.fn(),
    cleanup: jest.fn(),
    resetBadgeCount: jest.fn(),
    getDeviceToken: jest.fn().mockResolvedValue('mock-token'),
    registerDevice: jest.fn().mockResolvedValue(true),
    unregisterDevice: jest.fn().mockResolvedValue(true),
    getCurrentToken: jest.fn().mockResolvedValue('mock-token'),
    getConfigurationStatus: jest.fn().mockReturnValue({ initialized: true }),
    manualRegister: jest.fn().mockResolvedValue(true),
    addNotificationReceivedListener: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn(),
    removeNotificationListener: jest.fn(),
    removeAllNotificationListeners: jest.fn(),
  },
}));

import { renderHook, act } from '@testing-library/react-native';
import { usePushNotifications } from '../usePushNotifications';
import pushNotificationService from '../../services/pushNotificationService';

// Cast to jest mocks for type safety
const mockService = pushNotificationService as jest.Mocked<typeof pushNotificationService>;

describe('usePushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup AppState mock return
    mockAddEventListener.mockReturnValue(mockSubscription);
    
    // Setup service mock defaults
    mockService.initialize.mockResolvedValue({ success: true });
    mockService.isServiceInitialized.mockReturnValue(false);
    mockService.hasPermission.mockResolvedValue(false);
    mockService.requestPermissions.mockResolvedValue({ 
      granted: false, 
      canAskAgain: true, 
      status: 'denied' 
    });
    mockService.cleanup.mockResolvedValue(undefined);
    mockService.resetBadgeCount.mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => usePushNotifications());

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.hasPermission).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('initializePushNotifications', () => {
    it('should initialize successfully', async () => {
      mockService.initialize.mockResolvedValue({ success: true });
      mockService.isServiceInitialized.mockReturnValue(true);
      mockService.hasPermission.mockResolvedValue(true);

      const { result } = renderHook(() => usePushNotifications());

      await act(async () => {
        const success = await result.current.initializePushNotifications();
        expect(success).toBe(true);
      });

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.hasPermission).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle initialization failure', async () => {
      mockService.initialize.mockResolvedValue({ success: true });
      mockService.isServiceInitialized.mockReturnValue(false);
      mockService.hasPermission.mockResolvedValue(false);

      const { result } = renderHook(() => usePushNotifications());

      await act(async () => {
        const success = await result.current.initializePushNotifications();
        expect(success).toBe(false);
      });

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.hasPermission).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle initialization error', async () => {
      const errorMessage = 'Initialization failed';
      mockService.initialize.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePushNotifications());

      await act(async () => {
        const success = await result.current.initializePushNotifications();
        expect(success).toBe(false);
      });

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.hasPermission).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should show loading state during initialization', async () => {
      let resolveInitialize: (value: { success: boolean; token?: string; error?: string } | PromiseLike<{ success: boolean; token?: string; error?: string }>) => void;
      const initializePromise = new Promise<{ success: boolean; token?: string; error?: string }>((resolve) => {
        resolveInitialize = resolve;
      });
      mockService.initialize.mockReturnValue(initializePromise);
      mockService.isServiceInitialized.mockReturnValue(false);

      const { result } = renderHook(() => usePushNotifications());

      act(() => {
        result.current.initializePushNotifications();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveInitialize({ success: true });
        mockService.isServiceInitialized.mockReturnValue(true);
        await initializePromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('requestPermission', () => {
    it('should request permission successfully', async () => {
      mockService.requestPermissions.mockResolvedValue({ 
        granted: true, 
        canAskAgain: true, 
        status: 'granted' 
      });

      const { result } = renderHook(() => usePushNotifications());

      await act(async () => {
        const success = await result.current.requestPermission();
        expect(success).toBe(true);
      });

      expect(result.current.hasPermission).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle permission denial', async () => {
      mockService.requestPermissions.mockResolvedValue({ 
        granted: false, 
        canAskAgain: true, 
        status: 'denied' 
      });

      const { result } = renderHook(() => usePushNotifications());

      await act(async () => {
        const success = await result.current.requestPermission();
        expect(success).toBe(false);
      });

      expect(result.current.hasPermission).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle permission request error', async () => {
      const errorMessage = 'Permission request failed';
      mockService.requestPermissions.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePushNotifications());

      await act(async () => {
        const success = await result.current.requestPermission();
        expect(success).toBe(false);
      });

      expect(result.current.hasPermission).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('checkPermission', () => {
    it('should check permission successfully', async () => {
      mockService.hasPermission.mockResolvedValue(true);

      const { result } = renderHook(() => usePushNotifications());

      await act(async () => {
        const hasPermission = await result.current.checkPermission();
        expect(hasPermission).toBe(true);
      });

      expect(result.current.hasPermission).toBe(true);
    });

    it('should handle permission check failure', async () => {
      mockService.hasPermission.mockResolvedValue(false);

      const { result } = renderHook(() => usePushNotifications());

      await act(async () => {
        const hasPermission = await result.current.checkPermission();
        expect(hasPermission).toBe(false);
      });

      expect(result.current.hasPermission).toBe(false);
    });

    it('should handle permission check error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockService.hasPermission.mockRejectedValue(new Error('Permission check error'));

      const { result } = renderHook(() => usePushNotifications());

      await act(async () => {
        const hasPermission = await result.current.checkPermission();
        expect(hasPermission).toBe(false);
      });

      expect(result.current.hasPermission).toBe(false);
      
      consoleSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should cleanup successfully', async () => {
      // First initialize
      mockService.initialize.mockResolvedValue({ success: true });
      mockService.isServiceInitialized.mockReturnValue(true);
      mockService.hasPermission.mockResolvedValue(true);

      const { result } = renderHook(() => usePushNotifications());

      await act(async () => {
        await result.current.initializePushNotifications();
      });

      expect(result.current.isInitialized).toBe(true);

      // Then cleanup
      mockService.cleanup.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.cleanup();
      });

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.hasPermission).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockService.cleanup).toHaveBeenCalled();
    });

    it('should handle cleanup error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockService.cleanup.mockRejectedValue(new Error('Cleanup error'));

      const { result } = renderHook(() => usePushNotifications());

      await act(async () => {
        await result.current.cleanup();
      });

      // State should still be reset even if cleanup fails
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.hasPermission).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      
      consoleSpy.mockRestore();
    });
  });

  describe('resetBadgeCount', () => {
    it('should reset badge count successfully', async () => {
      mockService.resetBadgeCount.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePushNotifications());

      await act(async () => {
        await result.current.resetBadgeCount();
      });

      expect(mockService.resetBadgeCount).toHaveBeenCalled();
    });

    it('should handle badge reset error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockService.resetBadgeCount.mockRejectedValue(new Error('Badge reset error'));

      const { result } = renderHook(() => usePushNotifications());

      await act(async () => {
        await result.current.resetBadgeCount();
      });

      // Should not throw error
      expect(mockService.resetBadgeCount).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('AppState handling', () => {
    it('should have basic functionality', () => {
      const { result } = renderHook(() => usePushNotifications());
      
      // Verify hook returns expected interface
      expect(result.current).toHaveProperty('isInitialized');
      expect(result.current).toHaveProperty('hasPermission');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('initializePushNotifications');
      expect(result.current).toHaveProperty('requestPermission');
      expect(result.current).toHaveProperty('checkPermission');
      expect(result.current).toHaveProperty('cleanup');
      expect(result.current).toHaveProperty('resetBadgeCount');
    });

    it('should handle component lifecycle correctly', () => {
      const { unmount } = renderHook(() => usePushNotifications());
      
      // Test should not throw during unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle non-Error objects in catch blocks', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockService.initialize.mockRejectedValue('String error');

      const { result } = renderHook(() => usePushNotifications());

      await act(async () => {
        const success = await result.current.initializePushNotifications();
        expect(success).toBe(false);
      });

      expect(result.current.error).toBe('Failed to initialize push notifications');
      
      consoleSpy.mockRestore();
    });
  });
});