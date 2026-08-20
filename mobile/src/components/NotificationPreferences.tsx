import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import pushNotificationService, { NotificationPreferences as NotificationPreferencesType } from '@/services/pushNotificationService';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { logger } from '../utils/logger';

// Type for MaterialIcons icon names
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const PREFERENCE_DESCRIPTIONS = {
  waitlistUpdates: 'Get notified when you move up or get promoted from event waitlists',
  eventReminders: 'Receive reminders about upcoming events you\'re registered for',
  clubAnnouncements: 'Stay updated with important club news and announcements',
  checkInReminders: 'Get reminded to check in to events you\'re registered for',
};

export const NotificationPreferences: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  
  const [preferences, setPreferences] = useState<NotificationPreferencesType>({
    waitlistUpdates: true,
    eventReminders: true,
    clubAnnouncements: true,
    checkInReminders: true,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [badgeCount, setBadgeCount] = useState(0);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load preferences
      if (!user?.user?.userId) {
        throw new Error('User not found');
      }
      
      const userPreferences = await pushNotificationService.getNotificationPreferences(user.user.userId);
      setPreferences(userPreferences);
      
      // Check permission status
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
      
      // Get badge count
      const count = await pushNotificationService.getBadgeCount();
      setBadgeCount(count);
    } catch (error) {
      logger.error('notifications', 'Error loading notification preferences', error as Error, { userId: String(user?.user?.userId || '') });
      Alert.alert(
        'Error',
        'Failed to load notification preferences. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  }, [user?.user?.userId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPreferences();
    setRefreshing(false);
  }, [loadPreferences]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const savePreferences = useCallback(async (newPreferences: NotificationPreferencesType) => {
    try {
      if (!user?.user?.userId) {
        throw new Error('User not found');
      }
      
      await pushNotificationService.saveNotificationPreferences(user.user.userId, newPreferences);
      setPreferences(newPreferences);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      logger.error('notifications', 'Error saving notification preferences', error as Error, { userId: String(user?.user?.userId || ''), preferences: newPreferences });
      Alert.alert(
        'Error',
        'Failed to save notification preferences. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [user?.user?.userId]);

  const togglePreference = useCallback((key: keyof NotificationPreferencesType) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  const requestPermissions = useCallback(async () => {
    try {
      const granted = await pushNotificationService.requestPermissions();
      
      if (granted) {
        setPermissionStatus('granted');
        const result = await pushNotificationService.initialize();
        
        if (result.success) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(
            'Permissions Granted',
            'You will now receive push notifications for your selected preferences.',
            [{ text: 'OK' }]
          );
        }
      } else {
        setPermissionStatus('denied');
        Alert.alert(
          'Permission Denied',
          'Please enable notifications in your device settings to receive updates.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      logger.error('notifications', 'Error requesting notification permissions', error);
    }
  }, []);

  const sendTestNotification = useCallback(async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: 'This is a test notification from GatherGrove!',
          data: { type: 'test' },
        },
        trigger: null,
      });
      
      setTestNotificationSent(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      setTimeout(() => setTestNotificationSent(false), 3000);
    } catch (error) {
      logger.error('notifications', 'Error sending test notification', error);
    }
  }, []);

  const clearBadges = useCallback(async () => {
    try {
      await pushNotificationService.clearBadges();
      setBadgeCount(0);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      logger.error('notifications', 'Error clearing notification badges', error);
    }
  }, []);

  const renderPreferenceToggle = (
    key: keyof NotificationPreferencesType,
    title: string,
    icon: MaterialIconName
  ) => (
    <View style={[styles.preferenceItem, { borderBottomColor: colors.border.primary }]}>
      <View style={styles.preferenceHeader}>
        <MaterialIcons name={icon} size={24} color={colors.text.primary} />
        <View style={styles.preferenceTextContainer}>
          <Text style={[styles.preferenceTitle, { color: colors.text.primary }]}>
            {title}
          </Text>
          <Text style={[styles.preferenceDescription, { color: colors.text.secondary }]}>
            {PREFERENCE_DESCRIPTIONS[key]}
          </Text>
        </View>
        <Switch
          testID={`${key}-toggle`}
          value={preferences[key]}
          onValueChange={() => togglePreference(key)}
          trackColor={{ false: colors.border.primary, true: colors.interactive.primary }}
          thumbColor={preferences[key] ? colors.background.primary : colors.text.secondary}
          accessibilityLabel={`${title} notifications`}
          accessibilityRole="switch"
          accessibilityHint="Double tap to toggle this notification type"
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.interactive.primary} testID="loading-indicator" />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Loading preferences...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.interactive.primary]}
          testID="preferences-list"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Notification Preferences
        </Text>
      </View>

      {/* Permission Status */}
      {permissionStatus !== 'granted' && (
        <View style={[styles.permissionCard, { backgroundColor: colors.background.secondary }]}>
          <MaterialIcons 
            name="notifications-off" 
            size={32} 
            color={colors.status.warning} 
            style={styles.permissionIcon}
          />
          <Text style={[styles.permissionTitle, { color: colors.text.primary }]}>
            Notifications Disabled
          </Text>
          <Text style={[styles.permissionText, { color: colors.text.secondary }]}>
            Enable push notifications to receive waitlist updates and event reminders.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.interactive.primary }]}
            onPress={requestPermissions}
            accessibilityLabel="Request notification permissions"
            accessibilityRole="button"
          >
            <Text style={[styles.permissionButtonText, { color: colors.text.inverse }]}>
              Request Permission
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notification Preferences */}
      <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Notification Types
        </Text>
        
        {renderPreferenceToggle('waitlistUpdates', 'Waitlist Updates', 'queue')}
        {renderPreferenceToggle('eventReminders', 'Event Reminders', 'event')}
        {renderPreferenceToggle('clubAnnouncements', 'Club Announcements', 'announcement')}
        {renderPreferenceToggle('checkInReminders', 'Check-in Reminders', 'location-on')}
      </View>

      {/* Badge Management */}
      <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Badge Management
        </Text>
        
        <View style={styles.badgeInfo}>
          <Text style={[styles.badgeText, { color: colors.text.secondary }]}>
            Badge Count: {badgeCount}
          </Text>
          {badgeCount > 0 && (
            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: colors.status.error }]}
              onPress={clearBadges}
              accessibilityLabel="Clear notification badges"
              accessibilityRole="button"
            >
              <Text style={[styles.clearButtonText, { color: colors.text.inverse }]}>
                Clear Badges
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Test Notification */}
      {permissionStatus === 'granted' && (
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Test Notifications
          </Text>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.interactive.secondary }]}
            onPress={sendTestNotification}
            disabled={testNotificationSent}
            accessibilityLabel="Send test notification"
            accessibilityRole="button"
          >
            <MaterialIcons 
              name="send" 
              size={20} 
              color={colors.text.inverse} 
              style={styles.testIcon}
            />
            <Text style={[styles.testButtonText, { color: colors.text.inverse }]}>
              {testNotificationSent ? 'Test notification sent!' : 'Send Test Notification'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info Section */}
      <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          About Notifications
        </Text>
        
        <Text style={[styles.infoText, { color: colors.text.secondary }]}>
          • Waitlist promotions are sent immediately when spots become available{'\n'}
          • Event reminders are sent 1 hour before events start{'\n'}
          • You can change these preferences anytime{'\n'}
          • Notifications respect your device&apos;s Do Not Disturb settings
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  permissionCard: {
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  permissionIcon: {
    marginBottom: 12,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
  },
  preferenceItem: {
    borderBottomWidth: 1,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  preferenceTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  badgeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  badgeText: {
    fontSize: 16,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  testIcon: {
    marginRight: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    padding: 16,
  },
});