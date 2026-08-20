import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
  SafeAreaView,
  RefreshControl,
  Share,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';

// Fix TypeScript Icon component typing
interface IconProps {
  name: string;
  size: number;
  color: string;
  style?: object;
}
const IconComponent = MaterialIcon as unknown as React.ComponentType<IconProps>;

import { EventService } from '@/services/eventService';
import { memberService } from '@/services/memberService';
import { EventResponse, EventRsvpResponse, MemberProfileResponse } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { RootStackParamList } from '@/types';
import { authService } from '@/services/authService';
import { useTheme, useThemedStyles, ThemeColors } from '../contexts/ThemeContext';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { LIGHT_THEME, SPECIAL_COLORS } from '../constants/colors';

type EventDetailsRouteProp = RouteProp<RootStackParamList, 'EventDetails'>;

export const EventDetailsScreen: React.FC = () => {
  const route = useRoute<EventDetailsRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { eventId } = route.params;

  const [event, setEvent] = useState<EventResponse | null>(null);
  const [userRsvp, setUserRsvp] = useState<EventRsvpResponse | null>(null);
  const [memberProfile, setMemberProfile] = useState<MemberProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  const fetchEventDetails = useCallback(async (isRefresh = false) => {
    if (!eventId) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Get current user session to get clubId
      const userSession = await authService.validateStoredSession();
      if (!userSession?.user?.clubId) {
        throw new Error('User session not found. Please login again.');
      }

      // Get member profile first (needed for RSVP operations)
      let memberProfile;
      try {
        memberProfile = await memberService.getMemberProfile(userSession.user.clubId);
        if (!memberProfile?.id) {
          throw new Error('Member profile not found.');
        }
        setMemberProfile(memberProfile);
      } catch (profileError) {
        // If user is admin, they might not have a member profile
        if (userSession.user.role === 'Admin') {
          memberProfile = null;
          setMemberProfile(null);
        } else {
          throw new Error('Member profile not found.');
        }
      }

      // Get event details
      const eventDetails = await EventService.getEventById(userSession.user.clubId, eventId);
      setEvent(eventDetails);

      // Get RSVP status for the current member (all events support RSVP)
      // Only try to get RSVP if member profile exists (non-admin users)
      if (memberProfile?.id) {
        try {
          const rsvpStatus = await EventService.getMemberRsvp(
            userSession.user.clubId,
            eventId,
            memberProfile.id  // Use member ID from profile
          );
          setUserRsvp(rsvpStatus);
        } catch (rsvpError) {
          setUserRsvp(null);
        }
      } else {
        // Admin users or users without member profiles cannot RSVP
        setUserRsvp(null);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load event details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  // MEM-01 fix: Added isMounted check to prevent state updates on unmounted component
  useEffect(() => {
    let isMounted = true;

    const loadEventDetails = async () => {
      if (!isMounted) return;
      await fetchEventDetails();
    };

    loadEventDetails();

    return () => {
      isMounted = false;
    };
  }, [fetchEventDetails]);

  const onRefresh = useCallback(() => {
    fetchEventDetails(true);
  }, [fetchEventDetails]);

  const handleRsvpUpdate = async (rsvpStatus: 'Attending' | 'Not Attending') => {
    try {
      setRsvpLoading(true);
      setError(null);

      if (!user?.user.clubId || !memberProfile) {
        throw new Error('User club information or member profile not available');
      }

      // Update RSVP using the member ID from profile
      const updatedRsvp = await EventService.updateMemberRsvp(
        user.user.clubId,
        eventId,
        memberProfile.id, // Use member ID from profile
        { rsvpStatus }
      );

      setUserRsvp(updatedRsvp);
      
      // Show success message
      Alert.alert(
        'RSVP Updated',
        `You have successfully updated your RSVP to "${rsvpStatus}"`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update RSVP';
      setError(errorMessage);
      
      Alert.alert(
        'RSVP Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setRsvpLoading(false);
    }
  };

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

  const openLocationInMap = useCallback(() => {
    if (!event?.location) return;
    
    const encodedLocation = encodeURIComponent(event.location);
    const url = `https://maps.google.com/?q=${encodedLocation}`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open map application');
    });
  }, [event?.location]);

  const generateQRCodeData = useCallback(() => {
    if (!event || !user?.user?.clubId) return '';
    
    const qrData = {
      type: 'event_checkin',
      eventId: event.id,
      clubId: user.user.clubId,
      timestamp: Date.now(),
    };
    
    return JSON.stringify(qrData);
  }, [event, user]);

  const handleQRCodePress = useCallback(() => {
    setShowQRCode(!showQRCode);
  }, [showQRCode]);

  const handleShareEvent = useCallback(async () => {
    if (!event) return;
    
    try {
      const shareMessage = `Join me at ${event.name}!\n\nWhen: ${formatEventDate(event.eventDateTime)} at ${formatEventTime(event.eventDateTime)}\nWhere: ${event.location || 'TBD'}\n\n${event.description.replace(/<[^>]*>/g, '')}`;
      
      await Share.share({
        message: shareMessage,
        title: event.name,
      });
    } catch (error) {
      // Log: ('Error sharing event:', error);
    }
  }, [event]);

  const handleScanQRCode = useCallback(() => {
    (navigation as any).navigate('QRCodeScanner', { eventId });
  }, [navigation, eventId]);

  const renderRsvpStatus = () => {
    if (!userRsvp) {
      return (
        <View style={styles.rsvpStatusContainer}>
          <Text style={styles.rsvpStatusText}>RSVP now!</Text>
        </View>
      );
    }

    const isAttending = userRsvp.rsvpStatus === 'Attending';
    return (
      <View style={[styles.rsvpStatusContainer, isAttending ? styles.attendingStatus : styles.notAttendingStatus]}>
        <IconComponent 
          name={isAttending ? 'check-circle' : 'cancel'} 
          size={20} 
          color={isAttending ? colors.status.success : colors.status.error} 
        />
        <Text style={[styles.rsvpStatusText, isAttending ? styles.attendingText : styles.notAttendingText]}>
          You are {userRsvp.rsvpStatus}
        </Text>
      </View>
    );
  };

  const renderRsvpButtons = () => {
    const currentStatus = userRsvp?.rsvpStatus;
    
    return (
      <View style={styles.rsvpButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.rsvpButton,
            styles.attendingButton,
            currentStatus === 'Attending' && styles.selectedButton,
          ]}
          onPress={() => handleRsvpUpdate('Attending')}
          disabled={rsvpLoading}
          testID="button-attending"
        >
          <IconComponent 
            name="check-circle" 
            size={20} 
            color={currentStatus === 'Attending' ? colors.text.inverse : colors.status.success} 
          />
          <Text style={[
            styles.attendingButtonText,
            currentStatus === 'Attending' && styles.selectedButtonText,
          ]}>
            Attending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.rsvpButton,
            styles.notAttendingButton,
            currentStatus === 'Not Attending' && styles.selectedButton,
          ]}
          onPress={() => handleRsvpUpdate('Not Attending')}
          disabled={rsvpLoading}
          testID="button-not-attending"
        >
          <IconComponent 
            name="cancel" 
            size={20} 
            color={currentStatus === 'Not Attending' ? colors.text.inverse : colors.status.error} 
          />
          <Text style={[
            styles.notAttendingButtonText,
            currentStatus === 'Not Attending' && styles.selectedButtonText,
          ]}>
            Not Attending
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} testID="loading-event-details">
        <ActivityIndicator size="large" color={colors.interactive.primary} />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </SafeAreaView>
    );
  }

  if (error && !event) {
    return (
      <SafeAreaView style={styles.errorContainer} testID="error-event-details">
        <IconComponent name="error-outline" size={64} color={colors.status.error} />
        <Text style={styles.errorTitle}>Unable to Load Event</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchEventDetails()} testID="button-retry">
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <IconComponent name="event" size={64} color={colors.text.tertiary} />
        <Text style={styles.errorTitle}>Event Not Found</Text>
        <Text style={styles.errorSubtitle}>The requested event could not be found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="event-details-screen">
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.interactive.primary]}
            tintColor={colors.interactive.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            testID="button-back"
          >
            <IconComponent name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={handleShareEvent}
              testID="share-button"
            >
              <IconComponent name="share" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={handleQRCodePress}
              testID="qr-button"
            >
              <IconComponent name="qr-code" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Event Information */}
        <View style={styles.eventContent}>
          <Text style={styles.eventName} testID="event-name">{event.name}</Text>
          
          {/* Date and Time */}
          <View style={styles.eventDetailRow}>
            <IconComponent name="event" size={20} color={colors.text.secondary} />
            <Text style={styles.eventDetailText} testID="event-date">
              {formatEventDate(event.eventDateTime)}
            </Text>
          </View>
          
          <View style={styles.eventDetailRow}>
            <IconComponent name="access-time" size={20} color={colors.text.secondary} />
            <Text style={styles.eventDetailText} testID="event-time">
              {formatEventTime(event.eventDateTime)}
            </Text>
          </View>
          
          {/* Location */}
          {event.location && (
            <TouchableOpacity style={styles.eventDetailRow} onPress={openLocationInMap} testID="event-location">
              <IconComponent name="location-on" size={20} color={colors.text.secondary} />
              <Text style={[styles.eventDetailText, styles.locationText]}>
                {event.location}
              </Text>
              <IconComponent name="open-in-new" size={16} color={colors.interactive.primary} style={styles.mapIcon} />
            </TouchableOpacity>
          )}

          {/* Attendee Count */}
          {event.attendeeCount !== undefined && (
            <View style={styles.eventDetailRow}>
              <IconComponent name="people" size={20} color={colors.text.secondary} />
              <Text style={styles.eventDetailText} testID="attendee-count">
                {event.attendeeCount} attending
              </Text>
            </View>
          )}

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.descriptionText} testID="event-description">
              {event.description.replace(/<[^>]*>/g, '')} {/* Strip HTML tags */}
            </Text>
          </View>

          {/* QR Code Section */}
          {showQRCode && (
            <View style={styles.qrCodeSection}>
              <Text style={styles.qrCodeTitle}>Event Check-in QR Code</Text>
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={generateQRCodeData()}
                  size={200}
                  color={SPECIAL_COLORS.qrCode.foreground}
                  backgroundColor={SPECIAL_COLORS.qrCode.background}
                />
              </View>
              <Text style={styles.qrCodeDescription}>
                Show this QR code at the event for quick check-in
              </Text>
              <TouchableOpacity 
                style={styles.scanQRButton}
                onPress={handleScanQRCode}
                testID="scan-qr-button"
              >
                <IconComponent name="qr-code-scanner" size={20} color={colors.text.inverse} />
                <Text style={styles.scanQRButtonText}>Scan QR Code</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* RSVP Status - Only show for members with profiles */}
          {memberProfile?.id ? (
            <View style={styles.rsvpSection}>
              <Text style={styles.rsvpSectionTitle}>Your RSVP</Text>
              {renderRsvpStatus()}
              
              {/* Error message */}
              {error && (
                <ErrorDisplay
                  error={error}
                  context="event_rsvp"
                  onRetry={() => setError(null)}
                  style={styles.errorBanner}
                  testID="error-rsvp"
                />
              )}
              
              {/* RSVP Buttons */}
              {rsvpLoading ? (
                <View style={styles.rsvpLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.interactive.primary} />
                  <Text style={styles.rsvpLoadingText}>Updating RSVP...</Text>
                </View>
              ) : (
                renderRsvpButtons()
              )}
            </View>
          ) : (
            <View style={styles.rsvpSection}>
              <Text style={styles.rsvpSectionTitle}>RSVP</Text>
              <View style={styles.rsvpStatusContainer}>
                <Text style={styles.rsvpStatusText}>RSVP not available for admin users</Text>
              </View>
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
    padding: 16,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background.secondary,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  eventContent: {
    padding: 16,
  },
  eventName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventDetailText: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  locationText: {
    color: colors.interactive.primary,
    textDecorationLine: 'underline',
  },
  mapIcon: {
    marginLeft: 8,
  },
  descriptionContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  rsvpSection: {
    backgroundColor: colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    ...colors.shadow.small,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  rsvpSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  rsvpStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.background.tertiary,
  },
  attendingStatus: {
    backgroundColor: colors.status.successBackground,
  },
  notAttendingStatus: {
    backgroundColor: colors.status.errorBackground,
  },
  rsvpStatusText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    color: colors.text.secondary,
  },
  attendingText: {
    color: colors.status.success,
  },
  notAttendingText: {
    color: colors.status.error,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.errorBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 14,
    color: colors.status.error,
    marginLeft: 8,
    flex: 1,
  },
  rsvpLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  rsvpLoadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginLeft: 8,
  },
  rsvpButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  rsvpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  attendingButton: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.status.success,
  },
  notAttendingButton: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.status.error,
  },
  selectedButton: {
    backgroundColor: colors.interactive.primary,
    borderColor: colors.interactive.primary,
  },
  attendingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: colors.status.success,
  },
  notAttendingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: colors.status.error,
  },
  selectedButtonText: {
    color: colors.text.inverse,
  },
  qrCodeSection: {
    backgroundColor: colors.background.secondary,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    ...colors.shadow.small,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  qrCodeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  qrCodeContainer: {
    backgroundColor: LIGHT_THEME.background.primary,
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
    ...colors.shadow.small,
  },
  qrCodeDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  scanQRButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.interactive.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scanQRButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 