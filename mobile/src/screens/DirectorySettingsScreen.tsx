import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { directorySettingsService } from '@/services/directorySettingsService';
import {
  MemberDirectorySettingsResponse,
  AVAILABLE_MEMBER_DIRECTORY_FIELDS,
  RootStackParamList
} from '@/types';
import { ErrorDisplay, useErrorHandler } from '@/components/ErrorDisplay';
import { useTheme, useThemedStyles, ThemeColors } from '../contexts/ThemeContext';

interface DirectorySettingsScreenProps {
  navigation: NavigationProp<RootStackParamList>;
}

export const DirectorySettingsScreen: React.FC<DirectorySettingsScreenProps> = () => {
  const [settings, setSettings] = useState<MemberDirectorySettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { error, handleError, clearError, retry } = useErrorHandler();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  // Memoize field entries to avoid recalculating on every render
  const fieldEntries = useMemo(() => 
    Object.entries(AVAILABLE_MEMBER_DIRECTORY_FIELDS), 
    []
  );

  /**
   * Fetch directory settings from API
   */
  const fetchSettings = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      clearError();

      const data = await directorySettingsService.getDirectorySettings();
      setSettings(data);
    } catch (error) {
      handleError(error, 'Directory Settings Load');
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, [clearError, handleError]);

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSettings(true);
  };

  /**
   * Update directory listing status
   */
  const handleToggleDirectoryListing = async (isListed: boolean) => {
    if (!settings) return;

    const updatedSettings = { ...settings, isListed };
    setSettings(updatedSettings);

    // When turning on directory listing, use admin allowed fields as defaults if no fields are currently visible
    let visibleFields = settings.visibleFields;
    if (isListed && visibleFields.length === 0) {
      visibleFields = settings.adminAllowedSharableFields;
    }

    await saveSettings(isListed, visibleFields);
  };

  /**
   * Update field visibility
   */
  const handleToggleFieldVisibility = async (fieldKey: string, isVisible: boolean) => {
    if (!settings) return;

    let updatedVisibleFields: string[];
    if (isVisible) {
      updatedVisibleFields = [...settings.visibleFields, fieldKey];
    } else {
      updatedVisibleFields = settings.visibleFields.filter(field => field !== fieldKey);
    }

    const updatedSettings = { ...settings, visibleFields: updatedVisibleFields };
    setSettings(updatedSettings);

    await saveSettings(settings.isListed, updatedVisibleFields);
  };

  /**
   * Save settings to backend
   */
  const saveSettings = async (isListed: boolean, visibleFields: string[]) => {
    try {
      setSaving(true);
      clearError();

      const request = {
        isListed,
        visibleFields,
      };

      await directorySettingsService.updateDirectorySettings(request);
      
      // Refresh settings after successful update
      await fetchSettings(true);
    } catch (error) {
      handleError(error, 'Directory Settings Save');
      // Show alert for save errors as they are critical user actions
      const errorMessage = error instanceof Error ? error.message : 'Failed to save directory settings';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Check if a field is currently visible
   */
  const isFieldVisible = (fieldKey: string): boolean => {
    return settings?.visibleFields?.includes(fieldKey) || false;
  };

  /**
   * Check if a field is allowed by admin
   */
  const isFieldAllowed = (fieldKey: string): boolean => {
    return settings?.adminAllowedSharableFields?.includes(fieldKey) || false;
  };

  // Load settings on component mount
  // MEM-01 fix: Added isMounted check to prevent state updates on unmounted component
  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      if (!isMounted) return;
      await fetchSettings();
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [fetchSettings]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.interactive.primary} />
        <Text style={styles.loadingText}>Loading directory settings...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorDisplay
        error={error}
        context="Directory Settings"
        onRetry={() => retry(() => fetchSettings())}
        onDismiss={clearError}
        testID="directory-settings-error"
      />
    );
  }

  // No settings data
  if (!settings) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>No directory settings available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchSettings()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        testID="directory-settings-scroll-view"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Directory Privacy Settings</Text>
          <Text style={styles.subtitle}>
            Control your visibility in the club member directory
          </Text>
        </View>

        {/* Directory disabled message */}
        {!settings.clubDirectoryEnabled && (
          <View style={styles.disabledContainer}>
            <Text style={styles.disabledText}>
              The member directory is currently disabled for your club by your administrator.
            </Text>
          </View>
        )}

        {/* Directory enabled - show controls */}
        {settings.clubDirectoryEnabled && (
          <>
            {/* Main directory listing toggle */}
            <View style={styles.settingSection}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>List me in the club directory</Text>
                  <Text style={styles.settingDescription}>
                    Allow other members to find you in the directory
                  </Text>
                </View>
                <Switch
                  testID="directory-listing-switch"
                  value={settings.isListed}
                  onValueChange={handleToggleDirectoryListing}
                  disabled={saving}
                  trackColor={{ false: colors.background.tertiary, true: colors.interactive.primary }}
                  thumbColor={colors.background.secondary}
                />
              </View>
            </View>

            {/* Field visibility controls - only show if user opted in */}
            {settings.isListed && (
              <View style={styles.settingSection}>
                <Text style={styles.sectionTitle}>Information to Share</Text>
                <Text style={styles.sectionDescription}>
                  Choose which information to make visible to other members. Your name is always visible.
                </Text>

                {fieldEntries.map(([fieldKey, fieldInfo]) => {
                  const allowed = isFieldAllowed(fieldKey);
                  const visible = isFieldVisible(fieldKey);

                  if (!allowed) return null; // Don't show fields not allowed by admin

                  return (
                    <View key={fieldKey} style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>{fieldInfo.label}</Text>
                        <Text style={styles.settingDescription}>
                          {fieldInfo.description}
                        </Text>
                      </View>
                      <Switch
                        testID={`field-${fieldKey}-switch`}
                        value={visible}
                        onValueChange={(value) => handleToggleFieldVisibility(fieldKey, value)}
                        disabled={saving}
                        trackColor={{ false: colors.background.tertiary, true: colors.interactive.primary }}
                        thumbColor={colors.background.secondary}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Saving indicator */}
        {saving && (
          <View style={styles.savingContainer}>
            <ActivityIndicator size="small" color={colors.interactive.primary} />
            <Text style={styles.savingText}>Saving settings...</Text>
          </View>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.status.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.interactive.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  disabledContainer: {
    backgroundColor: colors.status.warningBackground,
    borderWidth: 1,
    borderColor: colors.status.warning,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  disabledText: {
    fontSize: 16,
    color: colors.status.warningText,
    textAlign: 'center',
    lineHeight: 22,
  },
  settingSection: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...colors.shadow.small,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  savingText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.text.secondary,
  },
}); 