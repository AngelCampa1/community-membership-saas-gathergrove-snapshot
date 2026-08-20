import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { EventService, WaitlistStatus as WaitlistStatusType } from '@/services/eventService';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { createAccessibilityLabel } from '../utils/accessibility';

interface WaitlistStatusProps {
  eventId: number;
  onWaitlistChange?: () => void;
  onPromotion?: () => void;
  showPromotionNotification?: boolean;
  autoRefresh?: boolean;
}

export const WaitlistStatus: React.FC<WaitlistStatusProps> = ({
  eventId,
  onWaitlistChange,
  onPromotion,
  showPromotionNotification = false,
  autoRefresh = false,
}) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [waitlistData, setWaitlistData] = useState<WaitlistStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPromotion, setShowPromotion] = useState(showPromotionNotification);
  
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const styles = createStyles(colors);

  const fetchWaitlistStatus = useCallback(async () => {
    try {
      setError(null);
      
      if (!user?.user?.clubId) {
        throw new Error('User session not found');
      }

      const data = await EventService.getWaitlistStatus(user.user.clubId, eventId);
      
      // Check if user was promoted off waitlist
      if (waitlistData?.isOnWaitlist && !data.isOnWaitlist &&
          data.currentAttendees !== undefined && data.eventCapacity !== undefined &&
          data.currentAttendees < data.eventCapacity) {
        setShowPromotion(true);
        onPromotion?.();
      }
      
      setWaitlistData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load waitlist information';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.user?.clubId, eventId, waitlistData?.isOnWaitlist, onPromotion]);

  useEffect(() => {
    fetchWaitlistStatus();
  }, [fetchWaitlistStatus]);

  useEffect(() => {
    if (autoRefresh) {
      refreshInterval.current = setInterval(fetchWaitlistStatus, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [autoRefresh, fetchWaitlistStatus]);

  const handleDismissPromotion = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowPromotion(false);
    });
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (showPromotion) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide promotion notification after 5 seconds
      const timer = setTimeout(() => {
        handleDismissPromotion();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showPromotion, fadeAnim, slideAnim, handleDismissPromotion]);

  const handleJoinWaitlist = useCallback(async () => {
    try {
      setActionLoading(true);

      if (!user?.user?.clubId) {
        throw new Error('User session not found');
      }

      const result = await EventService.joinWaitlist(user.user.clubId, eventId);

      Alert.alert(
        'Joined Waitlist',
        result.message || 'You have been added to the waitlist.',
        [{ text: 'OK' }]
      );

      await fetchWaitlistStatus();
      onWaitlistChange?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join waitlist';
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setActionLoading(false);
    }
  }, [user?.user?.clubId, eventId, fetchWaitlistStatus, onWaitlistChange]);

  const handleLeaveWaitlist = useCallback(async () => {
    Alert.alert(
      'Leave Waitlist',
      'Are you sure you want to leave the waitlist? You will lose your current position.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);

              if (!user?.user?.clubId) {
                throw new Error('User session not found');
              }

              const result = await EventService.leaveWaitlist(user.user.clubId, eventId);

              Alert.alert(
                'Left Waitlist',
                result.message || 'You have been removed from the waitlist.',
                [{ text: 'OK' }]
              );

              await fetchWaitlistStatus();
              onWaitlistChange?.();
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Failed to leave waitlist';
              Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }, [user?.user?.clubId, eventId, fetchWaitlistStatus, onWaitlistChange]);

  const getPositionColor = useCallback((position?: number) => {
    if (!position) return colors.text.secondary;
    
    if (position <= 3) return colors.status.success;
    if (position <= 10) return colors.status.warning;
    return colors.text.secondary;
  }, [colors]);

  const getPositionStyle = useCallback((position?: number) => {
    const color = getPositionColor(position);
    return {
      backgroundColor: color + '20',
      borderColor: color,
    };
  }, [getPositionColor]);

  if (loading) {
    return (
      <View style={styles.loadingContainer} testID="waitlist-loading">
        <ActivityIndicator size="small" color={colors.interactive.primary} />
        <Text style={styles.loadingText}>Loading waitlist status...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer} testID="waitlist-error">
        <MaterialIcons name="error-outline" size={20} color={colors.status.error} />
        <Text style={styles.errorText}>Unable to load waitlist information</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchWaitlistStatus}
          testID="retry-button"
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!waitlistData) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Promotion Notification */}
      {showPromotion && (
        <Animated.View
          style={[
            styles.promotionNotification,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
          testID="promotion-notification"
        >
          <View style={styles.promotionContent}>
            <MaterialIcons name="celebration" size={24} color={colors.status.success} />
            <View style={styles.promotionText}>
              <Text style={styles.promotionTitle}>Great news!</Text>
              <Text style={styles.promotionMessage}>
                You&apos;ve been moved off the waitlist
              </Text>
            </View>
            <TouchableOpacity
              style={styles.promotionClose}
              onPress={handleDismissPromotion}
            >
              <MaterialIcons name="close" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Waitlist Status */}
      {waitlistData.isOnWaitlist ? (
        <View 
          style={[styles.waitlistContainer, getPositionStyle(waitlistData.position)]} 
          testID="waitlist-status"
        >
          <View style={styles.statusHeader}>
            <MaterialIcons name="schedule" size={20} color={getPositionColor(waitlistData.position)} />
            <Text style={[styles.statusTitle, { color: getPositionColor(waitlistData.position) }]}>
              You are on the waitlist
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={fetchWaitlistStatus}
              testID="refresh-waitlist"
              {...createAccessibilityLabel(
                'Refresh',
                'Refresh waitlist status',
                'button'
              )}
            >
              <MaterialIcons name="refresh" size={16} color={getPositionColor(waitlistData.position)} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.waitlistDetails}>
            <Text style={styles.positionText}>
              Position: {waitlistData.position} of {waitlistData.totalWaitlisted}
            </Text>
            {waitlistData.estimatedWaitTime && (
              <Text style={styles.estimateText}>
                Estimated wait: {waitlistData.estimatedWaitTime}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.actionButton, styles.leaveButton]}
            onPress={handleLeaveWaitlist}
            disabled={actionLoading}
            testID="leave-waitlist-button"
            {...createAccessibilityLabel(
              'Leave Waitlist',
              `Remove yourself from the waitlist. Current position: ${waitlistData.position}`,
              'button'
            )}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <Text style={styles.leaveButtonText}>Leave Waitlist</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : waitlistData.canJoinWaitlist ? (
        <View style={styles.joinContainer}>
          <View style={styles.statusHeader}>
            <MaterialIcons name="people" size={20} color={colors.status.warning} />
            <Text style={styles.fullEventTitle}>Event Full - Join Waitlist</Text>
          </View>
          
          <Text style={styles.waitlistInfo}>
            {waitlistData.totalWaitlisted} people on waitlist
          </Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.joinButton]}
            onPress={handleJoinWaitlist}
            disabled={actionLoading}
            testID="join-waitlist-button"
            {...createAccessibilityLabel(
              'Join Waitlist',
              `Join the waitlist for this event. ${waitlistData.totalWaitlisted} people currently waiting`,
              'button'
            )}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <>
                <MaterialIcons name="add" size={20} color={colors.text.inverse} />
                <Text style={styles.joinButtonText}>Join Waitlist</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.fullContainer} testID="event-full-message">
          <View style={styles.statusHeader}>
            <MaterialIcons name="block" size={20} color={colors.status.error} />
            <Text style={styles.fullEventTitle}>Event Full</Text>
          </View>
          <Text style={styles.fullEventMessage}>
            This event has reached capacity and the waitlist is closed.
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.status.errorBackground,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.status.error,
    marginLeft: 8,
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.status.error,
    borderRadius: 4,
    marginLeft: 8,
  },
  retryButtonText: {
    fontSize: 12,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  promotionNotification: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    backgroundColor: colors.status.successBackground,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.status.success,
    marginBottom: 12,
    zIndex: 1000,
    ...colors.shadow.medium,
  },
  promotionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  promotionText: {
    flex: 1,
    marginLeft: 12,
  },
  promotionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.status.success,
  },
  promotionMessage: {
    fontSize: 12,
    color: colors.status.success,
    opacity: 0.8,
  },
  promotionClose: {
    padding: 4,
  },
  waitlistContainer: {
    padding: 16,
    backgroundColor: colors.status.warningBackground,
    borderRadius: 8,
    borderWidth: 1,
  },
  joinContainer: {
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.status.warning,
  },
  fullContainer: {
    padding: 16,
    backgroundColor: colors.status.errorBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.status.error,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 4,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fullEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.status.warning,
    marginLeft: 8,
  },
  waitlistDetails: {
    marginBottom: 16,
  },
  positionText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  estimateText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  waitlistInfo: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  fullEventMessage: {
    fontSize: 14,
    color: colors.status.error,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    minHeight: 44, // Accessibility touch target
  },
  joinButton: {
    backgroundColor: colors.interactive.primary,
  },
  leaveButton: {
    backgroundColor: colors.status.error,
  },
  joinButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  leaveButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
});