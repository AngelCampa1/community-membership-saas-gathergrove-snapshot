import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { EventService } from '@/services/eventService';
import { EventResponse, RootStackParamList } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { getTouchTargetStyle, createAccessibilityLabel, getResponsiveStyle } from '../utils/accessibility';

// Icon component wrapper - typed as React.ComponentType to handle vector icons
const IconComponent = Icon as React.ComponentType<{
  name: string;
  size: number;
  color: string;
}>;

// Create styles function with theme colors
const createStyles = (colors: ThemeColors) => {
  const responsive = getResponsiveStyle();
  
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  eventsList: {
    flex: 1,
  },
  listContainer: {
    padding: responsive.containerPadding,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsive.containerPadding,
  },
  eventCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: responsive.spacing.md,
    marginBottom: responsive.spacing.md,
    minHeight: 120, // Accessibility touch target
    ...colors.shadow.medium,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: 12,
  },
  attendeeCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.successBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attendeeCount: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.status.success,
    marginLeft: 4,
  },
  eventDetails: {
    gap: responsive.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 8,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: responsive.spacing.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.interactive.primary,
    paddingHorizontal: responsive.spacing.lg,
    paddingVertical: responsive.spacing.md,
    borderRadius: 8,
    minHeight: 48, // Accessibility touch target
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 16,
  },
  });
};

type EventsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface EventsScreenProps {}

export const EventsScreen: React.FC<EventsScreenProps> = () => {
  const { colors } = useTheme();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigation = useNavigation<EventsScreenNavigationProp>();
  
  // Create styles with theme colors
  const styles = createStyles(colors);

  const fetchEvents = useCallback(async () => {
    try {
      setError(null);
      if (user?.user.clubId) {
        const upcomingEvents = await EventService.getUpcomingEvents(user.user.clubId);
        setEvents(upcomingEvents);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load events';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.user.clubId]);

  // MEM-01 fix: Added isMounted check to prevent state updates on unmounted component
  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      if (!isMounted) return;
      await fetchEvents();
    };

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, [fetchEvents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents();
  }, [fetchEvents]);

  const formatEventDate = (eventDateTime: string): string => {
    const date = new Date(eventDateTime);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatEventTime = (eventDateTime: string): string => {
    const date = new Date(eventDateTime);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleEventPress = useCallback((event: EventResponse) => {
    // Navigate to event details screen for M-09 story
    navigation.navigate('EventDetails', { eventId: event.id });
  }, [navigation]);

  const renderEventItem = useCallback(({ item }: { item: EventResponse }) => (
    <TouchableOpacity
      style={[styles.eventCard, getTouchTargetStyle()]}
      onPress={() => handleEventPress(item)}
      testID={`event-item-${item.id}`}
      {...createAccessibilityLabel(
        `${item.name}, ${formatEventDate(item.eventDateTime)} at ${formatEventTime(item.eventDateTime)}`,
        `Tap to view event details. ${item.attendeeCount ? `${item.attendeeCount} attendees` : ''}`,
        'button'
      )}
    >
      <View style={styles.eventHeader}>
        <Text style={styles.eventName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.attendeeCount !== undefined && (
          <View style={styles.attendeeCountContainer}>
            <IconComponent name="people" size={16} color={colors.status.success} />
            <Text style={styles.attendeeCount}>{item.attendeeCount}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.eventDetails}>
        <View style={styles.detailRow}>
          <IconComponent name="event" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>
            {formatEventDate(item.eventDateTime)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <IconComponent name="access-time" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>
            {formatEventTime(item.eventDateTime)}
          </Text>
        </View>
        
        {item.location && (
          <View style={styles.detailRow}>
            <IconComponent name="location-on" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  ), [colors, styles, handleEventPress]);

  const renderEmptyState = () => (
    <View style={styles.emptyState} testID="empty-state-events">
      <IconComponent name="event" size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyStateTitle}>No Upcoming Events</Text>
      <Text style={styles.emptyStateSubtitle}>
        There are currently no upcoming events scheduled for your club.
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <SafeAreaView style={styles.errorState} testID="error-state-events">
      <IconComponent name="error-outline" size={64} color={colors.status.error} />
      <Text style={styles.errorTitle}>Unable to Load Events</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity 
        style={[styles.retryButton, getTouchTargetStyle()]} 
        onPress={fetchEvents} 
        testID="button-retry"
        {...createAccessibilityLabel(
          'Try Again',
          'Retry loading events',
          'button'
        )}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer} testID="loading-events">
        <ActivityIndicator size="large" color={colors.interactive.primary} />
        <Text style={styles.loadingText}>Loading events...</Text>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return renderErrorState();
  }

  return (
    <SafeAreaView style={styles.container} testID="events-screen">
      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.eventsList}
        contentContainerStyle={events.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.interactive.primary]}
            tintColor={colors.interactive.primary}
            testID="refresh-control-events"
          />
        }
        showsVerticalScrollIndicator={false}
        testID="events-list"
      />
    </SafeAreaView>
  );
}; 
