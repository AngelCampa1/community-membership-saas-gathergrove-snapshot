// Azure Notification Hubs with Expo Push Notifications
import { Platform, AppState, AppStateStatus } from 'react-native';
import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '@/constants';
import { authService } from './authService';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AZURE_CONFIG from '../config/azure.config';
// Define event interface locally
interface AppEvent {
  id: number;
  name: string;
  // Add other properties as needed
}

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});


export interface DeviceTokenRequest {
  token: string;
  platform: string;
  userId: number;
  clubId: number;
}

export interface DeviceTokenResponse {
  success: boolean;
  message: string;
}

export interface NotificationData {
  eventId?: string;
  clubId?: string;
  screen?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface NotificationPreferences {
  waitlistUpdates: boolean;
  eventReminders: boolean;
  clubAnnouncements: boolean;
  checkInReminders: boolean;
}

export interface WaitlistNotificationData extends Record<string, unknown> {
  type: 'waitlist_promotion' | 'waitlist_reminder' | 'waitlist_update';
  eventId: number;
  eventName?: string;
  position?: number;
  expiresAt?: number;
  status?: 'promoted' | 'moved_up' | 'added';
}

interface NotificationPermissions {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

class PushNotificationService {
  private axiosInstance: AxiosInstance;
  private isInitialized = false;
  private currentToken: string | null = null;
  private activeSubscriptions: Notifications.Subscription[] = [];
  private notificationPreferences: NotificationPreferences | null = null;
  // PUSH-04 fix: Guard flag to prevent multiple handler setups
  private handlersSetup = false;
  // PUSH-03 fix: Track last registered token to prevent duplicate registrations
  private lastRegisteredToken: string | null = null;
  // PUSH-06 fix: AppState subscription
  private appStateSubscription: { remove: () => void } | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupRequestInterceptor();
  }

  /**
   * Set up axios request interceptor to include JWT token
   */
  private setupRequestInterceptor(): void {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await authService.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Initialize push notifications
   * Should be called after successful login
   */
  async initialize(): Promise<{ success: boolean; token?: string; error?: string }> {
    if (this.isInitialized) {
      return { success: true, token: this.currentToken || undefined };
    }

    try {
      // Check if Azure is properly configured
      if (!AZURE_CONFIG.isConfigured) {
        const error = 'Azure Notification Hub not configured';
        if (__DEV__) // Warning: ('PushNotifications:', error);
        return { success: false, error };
      }

      // Check if user is authenticated
      const currentSession = await authService.validateStoredSession();
      if (!currentSession) {
        const error = 'User not authenticated';
        if (__DEV__) // Warning: ('PushNotifications:', error);
        return { success: false, error };
      }

      // Request permissions
      const permissions = await this.requestPermissions();
      const granted = typeof permissions === 'boolean' ? permissions : permissions?.granted;
      if (!granted) {
        const error = 'Push notification permission denied';
        if (__DEV__) // Warning: ('PushNotifications:', error);
        return { success: false, error };
      }

      // Get device token
      const token = await this.getDeviceToken();
      if (token) {
        this.currentToken = token;

        // Auto-register the device for the current user
        const registered = await this.registerDevice(currentSession.user.userId, currentSession.user.clubId);
        if (registered) {
          // PUSH-01 fix: Clear existing listeners before setting up new ones
          this.removeAllNotificationListeners();
          this.handlersSetup = false;
          this.setupNotificationHandlers();

          // PUSH-05 fix: Handle any notification that launched the app
          try {
            const lastResponse = await Notifications.getLastNotificationResponseAsync();
            if (lastResponse) {
              this.handleNotificationResponse(lastResponse);
            }
          } catch (_err) {
            // Silent fail - non-critical
          }

          // PUSH-06 fix: Set up AppState listener for managing handlers on background/foreground
          this.setupAppStateListener();

          this.isInitialized = true;
          if (__DEV__) // Log: ('PushNotifications: Initialized successfully');
          return { success: true, token };
        } else {
          const error = 'Failed to register device with backend';
          if (__DEV__) // Error: ('PushNotifications:', error);
          return { success: false, error };
        }
      } else {
        const error = 'Failed to get device token';
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Initialization failed';
      if (__DEV__) // Error: ('PushNotifications initialization error:', error);
      return { success: false, error: errorMessage };
    }
  }

  async requestPermissions(): Promise<boolean | NotificationPermissions> {
    try {
      const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      let canAsk = canAskAgain;
      
      if (existingStatus !== 'granted') {
        // PLAT-01 fix: Use Platform.select for platform-specific permission options
        const permissionOptions = Platform.select({
          ios: {
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              allowDisplayInCarPlay: false,
              allowCriticalAlerts: false,
              provideAppNotificationSettings: false,
              allowProvisional: false,
            },
          },
          android: {
            // Android handles permissions differently - no special options needed
            // Notifications permission is handled at the OS level on Android 13+
          },
          default: {},
        });

        const { status, canAskAgain: newCanAsk } = await Notifications.requestPermissionsAsync(permissionOptions);
        finalStatus = status;
        canAsk = newCanAsk ?? true;
      }
      
      const granted = finalStatus === 'granted';
      
      // Return boolean for backward compatibility, or object for detailed response
      if (typeof finalStatus === 'string') {
        return {
          granted,
          canAskAgain: canAsk,
          status: finalStatus,
        };
      }
      
      return granted;
    } catch (error) {
      // Error: ('Error requesting permissions:', error);
      return {
        granted: false,
        canAskAgain: true,
        status: 'denied',
      };
    }
  }

  async getDeviceToken(): Promise<string | null> {
    try {
      if (!AZURE_CONFIG.expoProjectId) {
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: AZURE_CONFIG.expoProjectId,
      });
      
      return token.data;
    } catch (error) {
      // Error: ('Error getting device token:', error);
      return null;
    }
  }

  /**
   * Get Expo push token directly
   */
  async getExpoPushToken(): Promise<string> {
    const token = await this.getDeviceToken();
    if (!token) {
      throw new Error('Failed to get Expo push token');
    }
    return token;
  }

  /**
   * Register push token with backend
   */
  async registerPushToken(
    token: string,
    user: { user: { id: number; clubId: number } }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/push-notifications/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await authService.getStoredToken()}`,
        },
        body: JSON.stringify({
          pushToken: token,
          userId: user.user.id,
          clubId: user.user.clubId,
        }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Registration failed' };
      }
    } catch (error) {
      // Error: ('Error registering push token:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  /**
   * Register device token with backend API
   * PUSH-07/PUSH-08 fix: Added retry logic and better error reporting
   */
  async registerDevice(userId: number, clubId: number, retryCount: number = 0): Promise<boolean> {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second base delay

    try {
      if (!this.currentToken) {
        if (__DEV__) {
          console.warn('[PushNotifications] Registration failed: No device token available');
        }
        return false;
      }

      // PUSH-03 fix: Skip registration if same token already registered
      if (this.lastRegisteredToken === this.currentToken) {
        return true; // Already registered with this token
      }

      // Get authentication token
      const authToken = await authService.getStoredToken();
      if (!authToken) {
        if (__DEV__) {
          console.warn('[PushNotifications] Registration failed: No auth token available');
        }
        return false;
      }

      const deviceTokenRequest: DeviceTokenRequest = {
        token: this.currentToken,
        platform: Platform.OS,
        userId,
        clubId,
      };

      // Send to backend API with authentication
      const response = await fetch(`${AZURE_CONFIG.apiBaseUrl}/api/notifications/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(deviceTokenRequest),
      });

      if (response.ok) {
        // PUSH-03 fix: Track successful registration
        this.lastRegisteredToken = this.currentToken;
        return true;
      } else {
        // PUSH-08 fix: Log error details
        const errorText = await response.text();
        if (__DEV__) {
          console.warn(`[PushNotifications] Registration failed: ${response.status} - ${errorText}`);
        }

        // PUSH-07 fix: Retry on server errors (5xx)
        if (response.status >= 500 && retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAY * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.registerDevice(userId, clubId, retryCount + 1);
        }

        return false;
      }
    } catch (error) {
      // PUSH-08 fix: Log error details
      if (__DEV__) {
        console.warn('[PushNotifications] Registration error:', error);
      }

      // PUSH-07 fix: Retry on network errors
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.registerDevice(userId, clubId, retryCount + 1);
      }

      return false;
    }
  }

  /**
   * Remove device token from backend API
   */
  async unregisterDevice(): Promise<boolean> {
    try {
      if (!this.currentToken) {
        return true; // Consider it success if there's nothing to unregister
      }

      // Get authentication token
      const authToken = await authService.getStoredToken();
      if (!authToken) {
        return false;
      }

      const response = await fetch(`${AZURE_CONFIG.apiBaseUrl}/api/notifications/unregister`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token: this.currentToken }),
      });

      if (response.ok) {
        this.currentToken = null;
        return true;
      } else {
        // Error response received
        await response.text();
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  // Listen for incoming notifications while app is foregrounded
  addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
    const subscription = Notifications.addNotificationReceivedListener(listener);
    this.activeSubscriptions.push(subscription);
    return subscription;
  }

  // Listen for user tapping on notifications
  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ) {
    const subscription = Notifications.addNotificationResponseReceivedListener(listener);
    this.activeSubscriptions.push(subscription);
    return subscription;
  }

  /**
   * Remove a specific notification listener
   */
  removeNotificationListener(subscription: Notifications.Subscription): void {
    subscription.remove();
    this.activeSubscriptions = this.activeSubscriptions.filter(s => s !== subscription);
  }

  /**
   * Remove all notification listeners
   */
  removeAllNotificationListeners(): void {
    this.activeSubscriptions.forEach(subscription => {
      subscription.remove();
    });
    this.activeSubscriptions = [];
  }

  /**
   * Check if notifications are enabled
   */
  async hasPermission(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleanup when user logs out
   * PUSH-02 fix: Unregister device BEFORE removing listeners to avoid race condition
   */
  async cleanup(): Promise<void> {
    try {
      // Unregister device FIRST (while listeners still active)
      await this.unregisterDevice();

      // THEN remove listeners
      this.removeAllNotificationListeners();

      // PUSH-06 fix: Remove AppState listener
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }

      this.isInitialized = false;
      this.currentToken = null;
      // Reset handler flag so they can be set up again on next login
      this.handlersSetup = false;
      // PUSH-03 fix: Clear last registered token
      this.lastRegisteredToken = null;
    } catch (_err) { /* Error handled */ }
  }

  /**
   * Reset notification badge count
   * Note: Badge management is handled automatically by Firebase
   */
  async resetBadgeCount(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (_err) { /* Error handled */ }
  }

  getCurrentToken(): string | null {
    return this.currentToken;
  }

  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  getConfigurationStatus() {
    return {
      isConfigured: AZURE_CONFIG.isConfigured,
      hasConnectionString: !!AZURE_CONFIG.connectionString,
      hasHubName: !!AZURE_CONFIG.hubName,
      hasExpoProjectId: !!AZURE_CONFIG.expoProjectId,
      apiBaseUrl: AZURE_CONFIG.apiBaseUrl,
    };
  }

  /**
   * Manual registration method for cases where automatic registration fails
   * or when user wants to re-register after changing permissions
   */
  async manualRegister(): Promise<boolean> {
    try {
      const currentSession = await authService.validateStoredSession();
      if (!currentSession) {
        return false;
      }

      return await this.registerDevice(currentSession.user.userId, currentSession.user.clubId);
    } catch (error) {
      return false;
    }
  }

  // ========== WAITLIST NOTIFICATION METHODS ==========

  /**
   * Send immediate waitlist promotion notification
   */
  async sendWaitlistPromotionNotification(event: AppEvent, timeoutMinutes: number = 5): Promise<void> {
    try {
      const expiresAt = Date.now() + (timeoutMinutes * 60 * 1000);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 You\'re off the waitlist!',
          body: `A spot opened up for "${event.name}"! Confirm your attendance within ${timeoutMinutes} minutes.`,
          data: {
            type: 'waitlist_promotion',
            eventId: event.id,
            expiresAt,
          } as WaitlistNotificationData,
          sound: 'default',
          priority: 'high',
        },
        trigger: null, // Immediate notification
      });
    } catch (error) {
      // Error: ('Error sending waitlist promotion notification:', error);
    }
  }

  /**
   * Schedule a waitlist reminder notification
   */
  async scheduleWaitlistReminder(event: AppEvent, position: number): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Waitlist Update',
          body: `You're #${position} on the waitlist for "${event.name}". We'll notify you if a spot opens up!`,
          data: {
            type: 'waitlist_reminder',
            eventId: event.id,
            position,
          } as WaitlistNotificationData,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 3600, // 1 hour
        },
      });
    } catch (error) {
      // Error: ('Error scheduling waitlist reminder:', error);
    }
  }

  /**
   * Handle local waitlist notifications
   */
  async handleLocalWaitlistNotification(
    event: AppEvent, 
    status: 'promoted' | 'moved_up' | 'added'
  ): Promise<void> {
    try {
      let title = '🎪 Waitlist Update';
      let body = '';
      
      switch (status) {
        case 'promoted':
          title = '🎉 Waitlist Update';
          body = `Great news! You've been promoted from the waitlist for "${event.name}"`;
          break;
        case 'moved_up':
          body = `You've moved up on the waitlist for "${event.name}"`;
          break;
        case 'added':
          body = `You've been added to the waitlist for "${event.name}"`;
          break;
      }
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'waitlist_update',
            eventId: event.id,
            status,
          } as WaitlistNotificationData,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
        },
      });
    } catch (error) {
      // Error: ('Error handling local waitlist notification:', error);
    }
  }

  // ========== BADGE MANAGEMENT METHODS ==========

  /**
   * Update badge count
   */
  async updateBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      // Error: ('Error updating badge count:', error);
    }
  }

  /**
   * Clear all badges and notifications
   */
  async clearBadges(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      // Error: ('Error clearing badges:', error);
    }
  }

  /**
   * Get current badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      // Error: ('Error getting badge count:', error);
      return 0;
    }
  }

  // ========== NOTIFICATION PREFERENCES ==========

  /**
   * Save notification preferences
   */
  async saveNotificationPreferences(userId: number, preferences: NotificationPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `notification_preferences_${userId}`,
        JSON.stringify(preferences)
      );
      this.notificationPreferences = preferences;
    } catch (error) {
      // Error: ('Error saving notification preferences:', error);
    }
  }

  /**
   * Load notification preferences
   */
  async getNotificationPreferences(userId: number): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem(`notification_preferences_${userId}`);
      if (stored) {
        this.notificationPreferences = JSON.parse(stored);
        return this.notificationPreferences!;
      }
    } catch (error) {
      // Error: ('Error loading notification preferences:', error);
    }
    
    // Return default preferences
    const defaultPreferences: NotificationPreferences = {
      waitlistUpdates: true,
      eventReminders: true,
      clubAnnouncements: true,
      checkInReminders: true,
    };
    
    this.notificationPreferences = defaultPreferences;
    return defaultPreferences;
  }

  // ========== NOTIFICATION HANDLERS ==========

  /**
   * Setup notification handlers
   * PUSH-04 fix: Guard against multiple setups
   */
  setupNotificationHandlers(): void {
    // Prevent multiple handler setups
    if (this.handlersSetup) {
      return;
    }
    this.handlersSetup = true;

    // Handle notifications received in foreground
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data as WaitlistNotificationData;
        
        // Show alert for waitlist promotions
        if (data?.type === 'waitlist_promotion') {
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          };
        }
        
        return {
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });

    // Handle notification responses (user tapped notification)
    this.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const waitlistData = data as WaitlistNotificationData;
      
      if (waitlistData?.type === 'waitlist_promotion') {
        // Navigate to event details to confirm attendance
        // This would typically be handled by the navigation service
        // Log: ('Navigate to event:', waitlistData.eventId);
      }
    });
  }

  // Note: shouldSendNotification method can be implemented when needed
  // for checking notification preferences

  /**
   * PUSH-05 fix: Handle notification response (from background launch or tap)
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    try {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const waitlistData = data as WaitlistNotificationData;

      if (waitlistData?.type === 'waitlist_promotion') {
        // Navigate to event details to confirm attendance
        // This would typically be handled by the navigation service
        if (__DEV__) {
          console.log('[PushNotifications] App launched from notification:', waitlistData.eventId);
        }
      }
    } catch (_err) {
      // Silent fail - non-critical
    }
  }

  /**
   * PUSH-06 fix: Set up AppState listener to manage notification handlers
   * Removes listeners when app goes to background, re-adds when returning to foreground
   */
  private setupAppStateListener(): void {
    // Remove existing subscription if any
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        // Remove listeners when going to background to prevent leaks
        this.removeAllNotificationListeners();
        this.handlersSetup = false;
      } else if (nextAppState === 'active' && this.isInitialized) {
        // Re-setup handlers when returning to foreground
        this.setupNotificationHandlers();
      }
    });
  }
}

const pushNotificationService = new PushNotificationService();

export { pushNotificationService as PushNotificationService };
export default pushNotificationService; 