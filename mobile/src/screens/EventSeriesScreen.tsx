import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootStackParamList } from '@/types';
import { EventService, EventSeries, EventSeriesEvent } from '@/services/eventService';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { getTouchTargetStyle, createAccessibilityLabel } from '../utils/accessibility';

type EventSeriesRouteProp = RouteProp<RootStackParamList, 'EventSeries'>;

type FilterType = 'all' | 'registered' | 'upcoming';

export const EventSeriesScreen: React.FC = () => {
  const route = useRoute<EventSeriesRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { seriesId } = route.params;

  const [seriesData, setSeriesData] = useState<EventSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [registering, setRegistering] = useState<number | null>(null);

  const styles = createStyles(colors);

  const fetchSeriesData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      if (!user?.user?.clubId) {
        throw new Error('User session not found');
      }

      const data = await EventService.getEventSeries(user.user.clubId, seriesId);
      setSeriesData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load event series';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.user?.clubId, seriesId]);

  // MEM-01 fix: Added isMounted check to prevent state updates on unmounted component
  useEffect(() => {
    let isMounted = true;

    const loadSeriesData = async () => {
      if (!isMounted) return;
      await fetchSeriesData();
    };

    loadSeriesData();

    return () => {
      isMounted = false;
    };
  }, [fetchSeriesData]);

  const onRefresh = useCallback(() => {
    fetchSeriesData(true);
  }, [fetchSeriesData]);

  const handleEventPress = useCallback((event: EventSeriesEvent) => {
    (navigation as any).navigate('EventDetails', { eventId: event.id });
  }, [navigation]);

  const handleRegisterForEvent = useCallback(async (eventId: number) => {
    try {
      setRegistering(eventId);

      if (!user?.user?.clubId) {
        throw new Error('User session not found');
      }

      await EventService.updateMemberRsvp(
        user.user.clubId,
        eventId,
        user.user.userId,
        { rsvpStatus: 'Attending' }
      );

      // Refresh data to update registration status
      await fetchSeriesData(true);

      Alert.alert(
        'Registration Successful',
        'You have been registered for this event.',
        [{ text: 'OK' }]
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register for event';
      Alert.alert('Registration Failed', errorMessage, [{ text: 'OK' }]);
    } finally {
      setRegistering(null);
    }
  }, [user, fetchSeriesData]);

  const handleBulkRegister = useCallback(async () => {
    try {
      if (!user?.user?.clubId || !seriesData) return;

      Alert.alert(
        'Register for All Events',
        `This will register you for all ${seriesData.upcomingEvents} upcoming events in this series. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Register',
            onPress: async () => {
              try {
                await EventService.bulkRegisterForSeries(
                  user.user.clubId,
                  seriesId,
                  user.user.userId
                );

                await fetchSeriesData(true);

                Alert.alert(
                  'Registration Successful',
                  'You have been registered for all upcoming events in this series.',
                  [{ text: 'OK' }]
                );
              } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to register for events';
                Alert.alert('Registration Failed', errorMessage, [{ text: 'OK' }]);
              }
            },
          },
        ]
      );
    } catch (err) {
      const { logger } = await import('../utils/logger');
      logger.error('events', 'Bulk registration error', err as Error, { seriesId: String(seriesId), userId: String(user?.user?.userId || '') });
    }
  }, [user, seriesData, seriesId, fetchSeriesData]);

  const getFilteredEvents = useCallback(() => {
    if (!seriesData) return [];

    switch (filter) {
      case 'registered':
        return seriesData.events.filter(event => event.registrationStatus === 'registered');
      case 'upcoming':
        return seriesData.events.filter(event => event.isUpcoming);
      default:
        return seriesData.events;
    }
  }, [seriesData, filter]);

  const formatEventDate = (eventDateTime: string): string => {
    const date = new Date(eventDateTime);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  const renderSeriesHeader = () => {
    if (!seriesData) return null;

    return (
      <View style={styles.headerSection}>
        <Text style={styles.seriesTitle}>{seriesData.name}</Text>
        <Text style={styles.seriesDescription}>{seriesData.description}</Text>
        
        <View style={styles.seriesDetails}>
          <View style={styles.detailRow}>
            <Icon name="location-on" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{seriesData.location}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="repeat" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>
              {seriesData.recurrencePattern.charAt(0).toUpperCase() + seriesData.recurrencePattern.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer} testID="series-stats">
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{seriesData.totalEvents}</Text>
            <Text style={styles.statLabel}>Total Events</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{seriesData.upcomingEvents}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {seriesData.events.filter(e => e.registrationStatus === 'registered').length}
            </Text>
            <Text style={styles.statLabel}>Registered</Text>
          </View>
        </View>

        {seriesData.upcomingEvents > 0 && (
          <TouchableOpacity
            style={styles.bulkRegisterButton}
            onPress={handleBulkRegister}
            testID="bulk-register-button"
          >
            <Icon name="event-available" size={20} color={colors.text.inverse} />
            <Text style={styles.bulkRegisterText}>
              Register for All Upcoming Events
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
        onPress={() => setFilter('all')}
        testID="filter-all"
      >
        <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
          All
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterButton, filter === 'upcoming' && styles.activeFilter]}
        onPress={() => setFilter('upcoming')}
        testID="filter-upcoming"
      >
        <Text style={[styles.filterText, filter === 'upcoming' && styles.activeFilterText]}>
          Upcoming
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterButton, filter === 'registered' && styles.activeFilter]}
        onPress={() => setFilter('registered')}
        testID="filter-registered"
      >
        <Text style={[styles.filterText, filter === 'registered' && styles.activeFilterText]}>
          Registered
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEventItem = ({ item }: { item: EventSeriesEvent }) => {
    const isRegistering = registering === item.id;
    const statusIcon = item.registrationStatus === 'registered' ? 'check-circle' : 
                      item.registrationStatus === 'waitlisted' ? 'schedule' : 'add-circle';
    const statusColor = item.registrationStatus === 'registered' ? colors.status.success :
                       item.registrationStatus === 'waitlisted' ? colors.status.warning : colors.text.secondary;

    return (
      <TouchableOpacity
        style={[styles.eventCard, getTouchTargetStyle()]}
        onPress={() => handleEventPress(item)}
        testID={`event-item-${item.id}`}
        {...createAccessibilityLabel(
          `${item.name}, ${formatEventDate(item.eventDateTime)}`,
          `Tap to view event details. ${item.registrationStatus === 'registered' ? 'You are registered' : 'Not registered'}`,
          'button'
        )}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventInfo}>
            <Text style={styles.eventName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.eventDate}>
              {formatEventDate(item.eventDateTime)} at {formatEventTime(item.eventDateTime)}
            </Text>
            <Text style={styles.eventAttendees}>
              {item.attendeeCount} attending
            </Text>
          </View>
          
          <View style={styles.eventActions}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]} testID={`event-${item.id}-status`}>
              <Icon name={statusIcon} size={16} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.registrationStatus === 'registered' ? 'Registered' :
                 item.registrationStatus === 'waitlisted' ? 'Waitlisted' : 'Register'}
              </Text>
            </View>
            
            {item.registrationStatus === 'not_registered' && item.isUpcoming && (
              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => handleRegisterForEvent(item.id)}
                disabled={isRegistering}
                testID={`register-button-${item.id}`}
              >
                {isRegistering ? (
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                ) : (
                  <Text style={styles.registerButtonText}>Register</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState} testID="empty-events-state">
      <Icon name="event" size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>No Events in Series</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all' 
          ? 'This event series doesn\'t have any events yet.'
          : `No ${filter} events found in this series.`}
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer} testID="loading-series">
        <ActivityIndicator size="large" color={colors.interactive.primary} />
        <Text style={styles.loadingText}>Loading event series...</Text>
      </SafeAreaView>
    );
  }

  if (error && !seriesData) {
    return (
      <SafeAreaView style={styles.errorContainer} testID="error-series">
        <Icon name="error-outline" size={64} color={colors.status.error} />
        <Text style={styles.errorTitle}>Unable to Load Event Series</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchSeriesData()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const filteredEvents = getFilteredEvents();

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredEvents}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <>
            {renderSeriesHeader()}
            {renderFilterButtons()}
          </>
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.interactive.primary]}
            tintColor={colors.interactive.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        testID="series-list"
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  listContainer: {
    flexGrow: 1,
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
    padding: 20,
    backgroundColor: colors.background.primary,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
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
    padding: 20,
    backgroundColor: colors.background.secondary,
  },
  seriesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  seriesDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  seriesDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.interactive.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  bulkRegisterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.interactive.primary,
    paddingVertical: 16,
    borderRadius: 8,
  },
  bulkRegisterText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: colors.interactive.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  activeFilterText: {
    color: colors.text.inverse,
  },
  eventCard: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    ...colors.shadow.small,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventInfo: {
    flex: 1,
    marginRight: 12,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  eventAttendees: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  eventActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  registerButton: {
    backgroundColor: colors.interactive.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  registerButtonText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});