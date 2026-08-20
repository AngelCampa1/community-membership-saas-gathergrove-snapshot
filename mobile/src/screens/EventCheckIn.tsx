import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  Share,
  Platform,
} from 'react-native';
import { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { EventService, EventAttendee, CheckInStats } from '@/services/eventService';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { getTouchTargetStyle, createAccessibilityLabel } from '../utils/accessibility';
import { LIGHT_THEME } from '../constants/colors';

interface EventCheckInParams {
  eventId: number;
  clubId: number;
}

interface Event {
  id: number;
  clubId: number;
  name: string;
  eventDateTime: string;
  location: string;
  description: string;
  maxAttendees?: number;
  attendeeCount: number;
  totalRsvpCount: number;
}

type FilterType = 'all' | 'checked_in' | 'not_checked_in';

export const EventCheckIn: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId, clubId } = route.params as EventCheckInParams;
  useAuth();
  const { colors } = useTheme();

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<EventAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingIn, setCheckingIn] = useState<Set<number>>(new Set());
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedAttendees, setSelectedAttendees] = useState<Set<number>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  // MEM-13 fix: Track mounted state to prevent state updates on unmounted component
  const isMountedRef = useRef(true);
  const styles = createStyles(colors);

  // MEM-13 fix: Added isMounted check to prevent state updates on unmounted component
  const loadEventData = useCallback(async () => {
    try {
      if (!isMountedRef.current) return;
      setError(null);
      const [eventData, attendeeData] = await Promise.all([
        EventService.getEventById(clubId, eventId),
        EventService.getEventAttendees(clubId, eventId),
      ]);

      if (!isMountedRef.current) return;
      setEvent({
        ...eventData,
        attendeeCount: eventData.attendeeCount || 0,
        totalRsvpCount: eventData.totalRsvpCount || 0
      });
      setAttendees(attendeeData);
      setFilteredAttendees(attendeeData);
    } catch (err) {
      if (!isMountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : 'Failed to load event data';
      setError(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [clubId, eventId]);

  const loadStats = useCallback(async () => {
    try {
      const statsData = await EventService.getCheckInStats(clubId, eventId);
      setStats(statsData);
    } catch (err) {
      const { logger } = await import('../utils/logger');
      logger.error('events', 'Failed to load check-in stats', err as Error, { clubId: String(clubId), eventId: String(eventId) });
    }
  }, [clubId, eventId]);

  // MEM-13 fix: Track mounted state and clean up properly on unmount
  useEffect(() => {
    isMountedRef.current = true;
    loadEventData();

    // Set up auto-refresh every 30 seconds
    refreshInterval.current = setInterval(loadEventData, 30000);

    return () => {
      isMountedRef.current = false;
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [loadEventData]);

  const handleExport = useCallback(async () => {
    try {
      const result = await EventService.exportAttendanceData(clubId, eventId, {
        format: 'csv',
        includeCheckInTimes: true,
      });
      
      if (Platform.OS === 'ios') {
        await Share.share({
          url: result.downloadUrl,
          title: 'Export Attendance Data',
        });
      } else {
        await Share.share({
          message: result.downloadUrl,
          title: 'Export Attendance Data',
        });
      }
    } catch (err) {
      Alert.alert(
        'Export Error',
        'Failed to export attendance data. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [eventId]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Event Check-In',
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowQRScanner(true)}
            style={styles.headerButton}
            testID="qr-scanner-button"
          >
            <Icon name="qr-code-scanner" size={24} color={colors.interactive.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleExport}
            style={styles.headerButton}
          >
            <Icon name="file-download" size={24} color={colors.interactive.primary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, colors, handleExport, styles.headerActions, styles.headerButton]);

  useEffect(() => {
    // Filter attendees based on search and filter
    let filtered = attendees;
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(attendee =>
        attendee.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attendee.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filter !== 'all') {
      filtered = filtered.filter(attendee =>
        filter === 'checked_in' ? attendee.checkedIn : !attendee.checkedIn
      );
    }
    
    setFilteredAttendees(filtered);
  }, [attendees, searchQuery, filter]);

  const handleCheckIn = useCallback(async (memberId: number, fromQR = false) => {
    try {
      setCheckingIn(prev => new Set(prev).add(memberId));
      
      const result = await EventService.checkInAttendee(clubId, eventId, memberId);
      
      if (result.success) {
        // Update local state
        setAttendees(prev => prev.map(attendee =>
          attendee.memberId === memberId
            ? { ...attendee, checkedIn: true, checkInTime: result.checkInTime }
            : attendee
        ));
        
        // Haptic feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        // Show success notification
        const attendee = attendees.find(a => a.memberId === memberId);
        if (attendee && !fromQR) {
          Alert.alert(
            'Check-In Successful',
            `${attendee.memberName} has been checked in\nTime: ${new Date(result.checkInTime).toLocaleTimeString()}`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (err) {
      // Handle offline mode
      if (err instanceof Error && err.message.includes('Network')) {
        setOfflineQueue(prev => [...prev, memberId]);
        Alert.alert(
          'Offline Mode',
          'Check-in saved locally. Will sync when connection is restored.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Check-In Error',
          'Failed to check in attendee. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setCheckingIn(prev => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
    }
  }, [clubId, eventId, attendees]);

  const handleQRScan = useCallback(async ({ data }: { data: string }) => {
    try {
      const qrData = JSON.parse(data);

      const validation = await EventService.validateQRCheckIn(clubId, eventId, qrData);
      
      if (validation.valid && validation.memberId) {
        await handleCheckIn(validation.memberId, true);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowQRScanner(false);
        
        Alert.alert(
          'Check-In Successful',
          `${validation.memberName} has been checked in via QR code`,
          [{ text: 'OK' }]
        );
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Invalid QR Code',
          validation.error || 'This QR code is not valid for this event',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Scan Error',
        'Failed to process QR code. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [eventId, handleCheckIn]);

  const handleBulkCheckIn = useCallback(async () => {
    try {
      const memberIds = Array.from(selectedAttendees);
      const result = await EventService.bulkCheckIn(clubId, eventId, memberIds);
      
      if (result.success) {
        // Update local state
        setAttendees(prev => prev.map(attendee =>
          memberIds.includes(attendee.memberId)
            ? { ...attendee, checkedIn: true, checkInTime: new Date().toISOString() }
            : attendee
        ));
        
        Alert.alert(
          'Bulk Check-In Complete',
          `Successfully checked in ${result.checkedInCount} attendees`,
          [{ text: 'OK' }]
        );
        
        setSelectedAttendees(new Set());
        setBulkMode(false);
      }
    } catch (err) {
      Alert.alert(
        'Bulk Check-In Error',
        'Failed to check in attendees. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [clubId, eventId, selectedAttendees]);

  

  const toggleAttendeeSelection = useCallback((memberId: number) => {
    setSelectedAttendees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  }, []);

  const renderAttendeeItem = useCallback(({ item: attendee }: { item: EventAttendee }) => {
    const isSelected = selectedAttendees.has(attendee.memberId);
    const isCheckingIn = checkingIn.has(attendee.memberId);
    
    return (
      <View style={[
        styles.attendeeItem,
        attendee.checkedIn && styles.checkedInItem,
        isSelected && styles.selectedItem,
      ]}>
        {bulkMode && (
          <TouchableOpacity
            onPress={() => toggleAttendeeSelection(attendee.memberId)}
            style={styles.selectionButton}
            testID={`select-attendee-${attendee.memberId}`}
          >
            <Icon
              name={isSelected ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={colors.interactive.primary}
            />
          </TouchableOpacity>
        )}
        
        <View style={styles.attendeeInfo}>
          <Text style={styles.attendeeName}>{attendee.memberName}</Text>
          <Text style={styles.attendeeEmail}>{attendee.email}</Text>
          {attendee.checkInTime && (
            <Text style={styles.checkInTime}>
              Checked in: {new Date(attendee.checkInTime).toLocaleTimeString()}
            </Text>
          )}
        </View>
        
        <View style={styles.attendeeActions}>
          {attendee.checkedIn ? (
            <View style={styles.checkedInBadge}>
              <Icon name="check-circle" size={20} color={colors.status.success} />
              <Text style={styles.checkedInText}>Checked In</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.checkInButton, isCheckingIn && styles.checkInButtonDisabled]}
              onPress={() => handleCheckIn(attendee.memberId)}
              disabled={isCheckingIn}
              testID={`check-in-button-${attendee.memberId}`}
              {...createAccessibilityLabel(
                `Check in ${attendee.memberName}`,
                `Double tap to check in ${attendee.memberName} for the event`,
                'button'
              )}
            >
              {isCheckingIn ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <>
                  <Icon name="how-to-reg" size={18} color={colors.text.inverse} />
                  <Text style={styles.checkInButtonText}>Check In</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps -- styles object is stable
  }, [
    selectedAttendees,
    checkingIn,
    bulkMode,
    colors,
    handleCheckIn,
    toggleAttendeeSelection,
  ]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- styles object is stable
  const renderHeader = useCallback(() => {
    if (!event) return null;
    
    const checkedInCount = attendees.filter(a => a.checkedIn).length;
    const totalCount = event.maxAttendees || attendees.length;
    
    return (
      <View style={styles.header}>
        <Text style={styles.eventTitle}>{event.name}</Text>
        <Text style={styles.eventLocation}>{event.location}</Text>
        <Text style={styles.eventDateTime}>
          {new Date(event.eventDateTime).toLocaleString()}
        </Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{checkedInCount} / {totalCount}</Text>
            <Text style={styles.statLabel}>checked in</Text>
          </View>
          <TouchableOpacity
            style={styles.viewStatsButton}
            onPress={() => {
              loadStats();
              setShowStats(true);
            }}
          >
            <Text style={styles.viewStatsText}>View Stats</Text>
          </TouchableOpacity>
        </View>
        
        {offlineQueue.length > 0 && (
          <View style={styles.offlineIndicator} testID="sync-status-indicator">
            <Icon name="sync-problem" size={16} color={colors.status.warning} />
            <Text style={styles.offlineText}>
              Offline - Will sync when connected ({offlineQueue.length} pending)
            </Text>
          </View>
        )}
      </View>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps -- styles object is stable
  }, [event, attendees, offlineQueue, colors, loadStats]);

  const renderControls = useCallback(() => (
    <View style={styles.controls}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search attendees..."
        placeholderTextColor={colors.text.secondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        testID="attendee-search"
      />
      
      <View style={styles.filterButtons}>
        {(['all', 'checked_in', 'not_checked_in'] as FilterType[]).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterButton,
              filter === filterType && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text style={[
              styles.filterButtonText,
              filter === filterType && styles.filterButtonTextActive,
            ]}>
              {filterType === 'all' ? 'All' :
               filterType === 'checked_in' ? 'Checked In' : 'Not Checked In'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.bulkModeButton}
          onPress={() => setBulkMode(!bulkMode)}
        >
          <Icon name="checklist" size={20} color={colors.interactive.primary} />
          <Text style={styles.bulkModeText}>
            {bulkMode ? 'Exit Bulk' : 'Bulk Mode'}
          </Text>
        </TouchableOpacity>
        
        {bulkMode && selectedAttendees.size > 0 && (
          <TouchableOpacity
            style={styles.bulkCheckInButton}
            onPress={handleBulkCheckIn}
          >
            <Text style={styles.bulkCheckInText}>
              Check In ({selectedAttendees.size})
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  // eslint-disable-next-line react-hooks/exhaustive-deps -- styles object is stable
  ), [
    searchQuery,
    filter,
    bulkMode,
    selectedAttendees.size,
    colors,
    handleBulkCheckIn,
  ]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.interactive.primary} />
        <Text style={styles.loadingText}>Loading event data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color={colors.status.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadEventData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderControls()}
      
      <FlatList
        data={filteredAttendees}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAttendeeItem}
        style={styles.attendeeList}
        testID="attendee-list"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadEventData();
            }}
            tintColor={colors.interactive.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No attendees match your search' : 'No attendees registered'}
            </Text>
          </View>
        }
      />

      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <View style={styles.scannerContainer} testID="qr-scanner-modal">
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => setShowQRScanner(false)}>
              <Icon name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan QR Code</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <CameraView
            onBarcodeScanned={handleQRScan}
            style={styles.scanner}
            testID="qr-scanner"
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'pdf417'],
            }}
          />
          
          <View style={styles.scannerOverlay}>
            <Text style={styles.scannerInstructions}>
              Position the QR code within the frame
            </Text>
          </View>
        </View>
      </Modal>

      {/* Stats Modal */}
      <Modal
        visible={showStats}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStats(false)}
      >
        <View style={styles.statsModal}>
          <View style={styles.statsHeader}>
            <TouchableOpacity onPress={() => setShowStats(false)}>
              <Icon name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.statsTitle}>Check-In Statistics</Text>
            <View style={{ width: 24 }} />
          </View>
          
          {stats && (
            <View style={styles.statsContent}>
              <View style={styles.statsGrid}>
                <View style={styles.statsCard}>
                  <Text style={styles.statsCardValue}>{stats.checkInRate}%</Text>
                  <Text style={styles.statsCardLabel}>check-in rate</Text>
                </View>
                <View style={styles.statsCard}>
                  <Text style={styles.statsCardValue}>{stats.pendingCheckIns}</Text>
                  <Text style={styles.statsCardLabel}>pending</Text>
                </View>
                <View style={styles.statsCard}>
                  <Text style={styles.statsCardValue}>{stats.lastCheckInTime || 'N/A'}</Text>
                  <Text style={styles.statsCardLabel}>last check-in</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background.primary,
  },
  errorText: {
    fontSize: 16,
    color: colors.status.error,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: colors.interactive.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
    ...getTouchTargetStyle(),
  },
  header: {
    padding: 20,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  eventLocation: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  eventDateTime: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  viewStatsButton: {
    backgroundColor: colors.interactive.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewStatsText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: colors.status.warningBackground,
    borderRadius: 6,
  },
  offlineText: {
    fontSize: 12,
    color: colors.status.warning,
    marginLeft: 6,
  },
  controls: {
    padding: 16,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border.primary,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.interactive.primary,
    borderColor: colors.interactive.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: colors.text.inverse,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bulkModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.interactive.primary,
  },
  bulkModeText: {
    fontSize: 14,
    color: colors.interactive.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
  bulkCheckInButton: {
    backgroundColor: colors.interactive.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  bulkCheckInText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  attendeeList: {
    flex: 1,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  checkedInItem: {
    backgroundColor: colors.status.successBackground,
  },
  selectedItem: {
    backgroundColor: colors.interactive.primary + '20',
  },
  selectionButton: {
    marginRight: 12,
    ...getTouchTargetStyle(),
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  attendeeEmail: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  checkInTime: {
    fontSize: 12,
    color: colors.status.success,
    fontStyle: 'italic',
  },
  attendeeActions: {
    marginLeft: 12,
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  checkedInText: {
    fontSize: 12,
    color: colors.status.success,
    marginLeft: 4,
    fontWeight: '500',
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.interactive.primary,
    borderRadius: 6,
    ...getTouchTargetStyle(),
  },
  checkInButtonDisabled: {
    opacity: 0.6,
  },
  checkInButtonText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 12,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.background.primary,
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scannerInstructions: {
    fontSize: 16,
    color: colors.text.inverse,
    backgroundColor: LIGHT_THEME.background.overlay,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  statsModal: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statsContent: {
    flex: 1,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    width: '48%',
    backgroundColor: colors.background.secondary,
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  statsCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statsCardLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});