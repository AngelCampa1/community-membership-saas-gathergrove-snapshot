import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getSignalRConnection, SignalRConnection } from './signalr-connection';
import { logger } from '@/lib/logger';

/**
 * Options for configuring the real-time event engagement hook
 */
export interface UseRealTimeEventEngagementOptions {
  autoConnect?: boolean;
  showToastNotifications?: boolean;
  enableAttendanceUpdates?: boolean;
  enableEngagementScoring?: boolean;
  enableFeedbackNotifications?: boolean;
  enableRecommendationUpdates?: boolean;
}

/**
 * Event attendance data structure
 */
export interface EventAttendanceData {
  eventId: number;
  eventName: string;
  totalRsvps: number;
  attendeeCount: number;
  checkedIn: number;
  noShows: number;
  attendanceRate: number;
  lastUpdated: string;
}

/**
 * Event engagement score data structure
 */
export interface EventEngagementScoreData {
  eventId: number;
  eventName: string;
  overallScore: number;
  previousScore: number;
  trend: 'up' | 'down' | 'stable';
  participationRate: number;
  interactionLevel: 'low' | 'medium' | 'high';
  satisfactionScore: number;
  lastUpdated: string;
  breakdown: Record<string, number>;
}

/**
 * Event feedback data structure
 */
export interface EventFeedbackData {
  id: string;
  eventId: number;
  eventName: string;
  memberName: string;
  rating: number;
  comment: string;
  category: string;
  timestamp: string;
  isPublic: boolean;
}

/**
 * Event recommendation data structure
 */
export interface EventRecommendationData {
  id: string;
  eventId: number;
  eventName: string;
  eventDateTime: string;
  recommendationScore: number;
  reasons: string[];
  targetAudience: string[];
  confidence: number;
  lastUpdated: string;
}

/**
 * Live event update data structure
 */
export interface LiveEventUpdateData {
  id: string;
  type: 'attendance' | 'engagement_score' | 'feedback' | 'recommendation' | 'rsvp';
  eventId: number;
  eventName: string;
  message: string;
  timestamp: string;
  data: any;
}

/**
 * RSVP update data structure
 */
export interface RsvpUpdateData {
  id: string;
  eventId: number;
  eventName: string;
  memberId: number;
  memberName: string;
  rsvpStatus: 'attending' | 'not_attending' | 'maybe' | 'pending';
  previousStatus: string;
  timestamp: string;
}

/**
 * Connection status type
 */
export type ConnectionStatus = 'Disconnected' | 'Connected' | 'Reconnecting' | 'Failed';

/**
 * SignalR event data types
 */
export interface EventAttendanceUpdateData {
  EventId: number;
  EventName: string;
  TotalRsvps: number;
  AttendeeCount: number;
  CheckedIn: number;
  NoShows: number;
  AttendanceRate: number;
  Timestamp: string;
}

export interface EventEngagementScoreUpdateData {
  EventId: number;
  EventName: string;
  OverallScore: number;
  PreviousScore: number;
  Trend: string;
  ParticipationRate: number;
  InteractionLevel: string;
  SatisfactionScore: number;
  Timestamp: string;
  ScoreBreakdown?: Record<string, number>;
}

export interface EventFeedbackReceivedData {
  FeedbackId?: string;
  EventId: number;
  EventName: string;
  MemberName?: string;
  Rating: number;
  Comment: string;
  Category?: string;
  Timestamp: string;
  IsPublic?: boolean;
}

export interface EventRecommendationUpdateData {
  RecommendationId?: string;
  EventId: number;
  EventName: string;
  EventDateTime: string;
  RecommendationScore: number;
  Reasons?: string[];
  TargetAudience?: string[];
  Confidence?: number;
  Timestamp: string;
}

export interface EventRsvpUpdateData {
  EventId: number;
  EventName: string;
  MemberId: number;
  MemberName: string;
  RsvpStatus: string;
  PreviousStatus: string;
  Timestamp: string;
}

export interface ClubEventEngagementUpdateData {
  AttendanceUpdates?: Partial<EventAttendanceUpdateData>[];
  EngagementScores?: Partial<EventEngagementScoreUpdateData>[];
  Timestamp: string;
}

/**
 * Hook return type
 */
export interface UseRealTimeEventEngagementReturn {
  // Connection state
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  error: string | null;

  // Event data
  eventAttendance: Record<number, EventAttendanceData>;
  eventEngagementScores: Record<number, EventEngagementScoreData>;
  eventFeedback: EventFeedbackData[];
  eventRecommendations: EventRecommendationData[];
  liveEventUpdates: LiveEventUpdateData[];
  rsvpUpdates: RsvpUpdateData[];

  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  subscribeToEvent: (eventId: number) => Promise<void>;
  refreshEventEngagement: (eventId?: number) => Promise<void>;
  clearEventFeedback: () => void;
  clearRecommendations: () => void;
  clearLiveUpdates: () => void;
  clearRsvpUpdates: () => void;
  clearAllData: () => void;

  // Utility methods
  getEventAttendance: (eventId: number) => EventAttendanceData | null;
  getEventEngagementScore: (eventId: number) => EventEngagementScoreData | null;
  getEventFeedback: (eventId: number) => EventFeedbackData[];
  getLiveUpdatesForEvent: (eventId: number) => LiveEventUpdateData[];

  // Computed values
  hasNewFeedback: boolean;
  hasNewRecommendations: boolean;
  hasLiveUpdates: boolean;
  totalMonitoredEvents: number;
  activeEventsCount: number;
}

/**
 * Custom hook for real-time event engagement updates
 * @param clubId - Club ID to monitor
 * @param eventId - Specific event ID to monitor (optional)
 * @param options - Configuration options
 * @returns Event engagement data and connection status
 */
export const useRealTimeEventEngagement = (
  clubId: number | null,
  eventId: number | null = null,
  options: UseRealTimeEventEngagementOptions = {}
): UseRealTimeEventEngagementReturn => {
  const {
    autoConnect = true,
    showToastNotifications = true,
    enableAttendanceUpdates = true,
    enableEngagementScoring = true,
    enableFeedbackNotifications = true,
    enableRecommendationUpdates = true
  } = options;

  // State management
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('Disconnected');
  const [eventAttendance, setEventAttendance] = useState<Record<number, EventAttendanceData>>({});
  const [eventEngagementScores, setEventEngagementScores] = useState<Record<number, EventEngagementScoreData>>({});
  const [eventFeedback, setEventFeedback] = useState<EventFeedbackData[]>([]);
  const [eventRecommendations, setEventRecommendations] = useState<EventRecommendationData[]>([]);
  const [liveEventUpdates, setLiveEventUpdates] = useState<LiveEventUpdateData[]>([]);
  const [rsvpUpdates, setRsvpUpdates] = useState<RsvpUpdateData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Refs for cleanup
  const connectionRef = useRef<SignalRConnection | null>(null);
  const subscribedClubRef = useRef<number | null>(null);
  const subscribedEventRef = useRef<number | null>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const cleanupListenersRef = useRef<(() => void) | null>(null);

  /**
   * Initialize SignalR connection
   */
  const initializeConnection = useCallback(async (): Promise<void> => {
    if (!clubId || connectionRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const connection = await getSignalRConnection('eventEngagement');
      connectionRef.current = connection;

      // Connection event handlers
      connection.onConnectionStatus(
        () => {
          setIsConnected(true);
          setConnectionStatus('Connected');
          logger.info('Event Engagement SignalR connected');
        },
        () => {
          setIsConnected(false);
          setConnectionStatus('Disconnected');
          logger.info('Event Engagement SignalR disconnected');
        },
        () => {
          setConnectionStatus('Reconnecting');
          logger.info('Event Engagement SignalR reconnecting...');
        },
        () => {
          setIsConnected(true);
          setConnectionStatus('Connected');
          logger.info('Event Engagement SignalR reconnected');

          // Rejoin club/event monitoring after reconnection
          if (subscribedClubRef.current) {
            joinClubEventEngagement(subscribedClubRef.current);
          }
          if (subscribedEventRef.current) {
            joinEventEngagement(subscribedEventRef.current);
          }
        }
      );

      // Set up event listeners and store cleanup function
      cleanupListenersRef.current = setupEventListeners(connection);

      // Join club event engagement monitoring
      if (clubId) {
        await joinClubEventEngagement(clubId);
      }

      // Join specific event monitoring if provided
      if (eventId) {
        await joinEventEngagement(eventId);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Failed to initialize event engagement SignalR connection', err);
      setError(`Connection failed: ${errorMessage}`);
      setConnectionStatus('Failed');

      if (showToastNotifications) {
        toast.error('Failed to connect to real-time event engagement updates');
      }
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setupEventListeners, joinClubEventEngagement, joinEventEngagement are stable functions defined below
  }, [clubId, eventId, showToastNotifications]);

  /**
   * Setup SignalR event listeners
   * BUG FIX: Now returns cleanup function to prevent memory leaks
   */
  const setupEventListeners = (connection: SignalRConnection): (() => void) => {
    // Connection status updates
    connection.on('ConnectionStatus', (status: { Status: string }) => {
      setConnectionStatus(status.Status as ConnectionStatus);
      logger.debug('Event engagement connection status:', status);
    });

    // Real-time event attendance updates
    connection.on('EventAttendanceUpdate', (data: EventAttendanceUpdateData) => {
      if (enableAttendanceUpdates) {
        setEventAttendance(prev => ({
          ...prev,
          [data.EventId]: {
            eventId: data.EventId,
            eventName: data.EventName,
            totalRsvps: data.TotalRsvps,
            attendeeCount: data.AttendeeCount,
            checkedIn: data.CheckedIn,
            noShows: data.NoShows,
            attendanceRate: data.AttendanceRate,
            lastUpdated: data.Timestamp
          }
        }));

        // Add to live updates feed
        setLiveEventUpdates(prev => [{
          id: `attendance-${data.EventId}-${Date.now()}`,
          type: 'attendance' as const,
          eventId: data.EventId,
          eventName: data.EventName,
          message: `${data.CheckedIn} members checked in (${data.AttendanceRate}% attendance rate)`,
          timestamp: data.Timestamp,
          data: data
        }, ...prev].slice(0, 50));

        if (showToastNotifications) {
          toast.info(`${data.EventName}: ${data.CheckedIn} attendees checked in`);
        }

        logger.debug('signalr', 'Received event attendance update', { eventId: data.EventId });
      }
    });

    // Live event engagement score changes
    connection.on('EventEngagementScoreUpdate', (data: EventEngagementScoreUpdateData) => {
      if (enableEngagementScoring) {
        setEventEngagementScores(prev => ({
          ...prev,
          [data.EventId]: {
            eventId: data.EventId,
            eventName: data.EventName,
            overallScore: data.OverallScore,
            previousScore: data.PreviousScore,
            trend: data.Trend as 'up' | 'down' | 'stable',
            participationRate: data.ParticipationRate,
            interactionLevel: data.InteractionLevel as 'low' | 'medium' | 'high',
            satisfactionScore: data.SatisfactionScore,
            lastUpdated: data.Timestamp,
            breakdown: data.ScoreBreakdown || {}
          }
        }));

        // Add to live updates feed
        setLiveEventUpdates(prev => [{
          id: `engagement-${data.EventId}-${Date.now()}`,
          type: 'engagement_score' as const,
          eventId: data.EventId,
          eventName: data.EventName,
          message: `Engagement score updated: ${data.OverallScore} (${data.Trend})`,
          timestamp: data.Timestamp,
          data: data
        }, ...prev].slice(0, 50));

        if (showToastNotifications && Math.abs(data.OverallScore - data.PreviousScore) > 5) {
          const direction = data.OverallScore > data.PreviousScore ? 'increased' : 'decreased';
          toast.info(`${data.EventName}: Engagement score ${direction} to ${data.OverallScore}`);
        }

        logger.debug('signalr', 'Received event engagement score update', { eventId: data.EventId, score: data.OverallScore });
      }
    });

    // Event feedback notifications
    connection.on('EventFeedbackReceived', (data: EventFeedbackReceivedData) => {
      if (enableFeedbackNotifications) {
        setEventFeedback(prev => [{
          id: data.FeedbackId || `feedback-${Date.now()}`,
          eventId: data.EventId,
          eventName: data.EventName,
          memberName: data.MemberName || 'Anonymous',
          rating: data.Rating,
          comment: data.Comment,
          category: data.Category || 'general',
          timestamp: data.Timestamp,
          isPublic: data.IsPublic || false
        }, ...prev].slice(0, 100));

        // Add to live updates feed
        setLiveEventUpdates(prev => [{
          id: `feedback-${data.EventId}-${Date.now()}`,
          type: 'feedback' as const,
          eventId: data.EventId,
          eventName: data.EventName,
          message: `New feedback received: ${data.Rating}/5 stars`,
          timestamp: data.Timestamp,
          data: data
        }, ...prev].slice(0, 50));

        if (showToastNotifications) {
          toast.info(`${data.EventName}: New feedback received (${data.Rating}/5 stars)`);
        }

        logger.debug('signalr', 'Received event feedback', { eventId: data.EventId });
      }
    });

    // Event recommendation updates
    connection.on('EventRecommendationUpdate', (data: EventRecommendationUpdateData) => {
      if (enableRecommendationUpdates) {
        setEventRecommendations(prev => {
          const updatedRecommendations = [...prev];
          const existingIndex = updatedRecommendations.findIndex(r => r.eventId === data.EventId);
          
          const newRecommendation: EventRecommendationData = {
            id: data.RecommendationId || `rec-${data.EventId}-${Date.now()}`,
            eventId: data.EventId,
            eventName: data.EventName,
            eventDateTime: data.EventDateTime,
            recommendationScore: data.RecommendationScore,
            reasons: data.Reasons || [],
            targetAudience: data.TargetAudience || [],
            confidence: data.Confidence || 0,
            lastUpdated: data.Timestamp
          };

          if (existingIndex >= 0) {
            updatedRecommendations[existingIndex] = newRecommendation;
          } else {
            updatedRecommendations.unshift(newRecommendation);
          }

          return updatedRecommendations.slice(0, 20);
        });

        // Add to live updates feed
        setLiveEventUpdates(prev => [{
          id: `recommendation-${data.EventId}-${Date.now()}`,
          type: 'recommendation' as const,
          eventId: data.EventId,
          eventName: data.EventName,
          message: `Recommendation updated: ${data.RecommendationScore}% match`,
          timestamp: data.Timestamp,
          data: data
        }, ...prev].slice(0, 50));

        if (showToastNotifications && data.RecommendationScore > 80) {
          toast.info(`High recommendation: ${data.EventName} (${data.RecommendationScore}% match)`);
        }

        logger.debug('signalr', 'Received event recommendation update', { eventId: data.EventId, score: data.RecommendationScore });
      }
    });

    // RSVP updates
    connection.on('EventRsvpUpdate', (data: EventRsvpUpdateData) => {
      setRsvpUpdates(prev => [{
        id: `rsvp-${data.EventId}-${data.MemberId}-${Date.now()}`,
        eventId: data.EventId,
        eventName: data.EventName,
        memberId: data.MemberId,
        memberName: data.MemberName,
        rsvpStatus: data.RsvpStatus as 'attending' | 'not_attending' | 'maybe' | 'pending',
        previousStatus: data.PreviousStatus,
        timestamp: data.Timestamp
      }, ...prev].slice(0, 50));

      // Add to live updates feed
      setLiveEventUpdates(prev => [{
        id: `rsvp-update-${data.EventId}-${Date.now()}`,
        type: 'rsvp' as const,
        eventId: data.EventId,
        eventName: data.EventName,
        message: `${data.MemberName} ${data.RsvpStatus} for ${data.EventName}`,
        timestamp: data.Timestamp,
        data: data
      }, ...prev].slice(0, 50));

      logger.debug('signalr', 'Received RSVP update', { eventId: data.EventId, memberId: data.MemberId });
    });

    // Bulk event updates
    connection.on('ClubEventEngagementUpdate', (data: ClubEventEngagementUpdateData) => {
      if (data.AttendanceUpdates && enableAttendanceUpdates) {
        data.AttendanceUpdates.forEach(update => {
          setEventAttendance(prev => ({
            ...prev,
            [update.EventId!]: {
              ...prev[update.EventId!],
              ...update,
              lastUpdated: data.Timestamp
            }
          }));
        });
      }

      if (data.EngagementScores && enableEngagementScoring) {
        data.EngagementScores.forEach(score => {
          setEventEngagementScores(prev => ({
            ...prev,
            [score.EventId!]: {
              ...prev[score.EventId!],
              ...score,
              lastUpdated: data.Timestamp
            }
          }));
        });
      }

      logger.debug('signalr', 'Received bulk club event engagement update', { attendanceUpdates: data.AttendanceUpdates?.length, engagementScores: data.EngagementScores?.length });
    });

    // Error handling
    connection.on('Error', (errorMessage: string) => {
      setError(errorMessage);
      if (showToastNotifications) {
        toast.error(`Event engagement monitoring error: ${errorMessage}`);
      }
      logger.error('signalr', 'Event engagement SignalR error', { errorMessage });
    });

    // Access denied
    connection.on('AccessDenied', (message: string) => {
      setError(`Access denied: ${message}`);
      if (showToastNotifications) {
        toast.error(`Access denied: ${message}`);
      }
      logger.error('signalr', 'Event engagement access denied', { message });
    });

    // Successfully joined club event monitoring
    connection.on('JoinedClubEventEngagement', (joinedClubId: number) => {
      subscribedClubRef.current = joinedClubId;
      logger.info('signalr', `Successfully joined event engagement monitoring for club ${joinedClubId}`);
    });

    // Successfully joined specific event monitoring
    connection.on('JoinedEventEngagement', (joinedEventId: number) => {
      subscribedEventRef.current = joinedEventId;
      logger.info('signalr', `Successfully joined engagement monitoring for event ${joinedEventId}`);
    });

    // Left monitoring
    connection.on('LeftClubEventEngagement', (leftClubId: number) => {
      if (subscribedClubRef.current === leftClubId) {
        subscribedClubRef.current = null;
      }
      logger.info('signalr', `Left event engagement monitoring for club ${leftClubId}`);
    });

    connection.on('LeftEventEngagement', (leftEventId: number) => {
      if (subscribedEventRef.current === leftEventId) {
        subscribedEventRef.current = null;
      }
      logger.info('signalr', `Left engagement monitoring for event ${leftEventId}`);
    });

    // BUG FIX: Return cleanup function to remove all event listeners
    // Note: We cannot use named functions for cleanup because the handlers reference
    // React state setters and options. Instead, we use connection.off() to remove all handlers
    // for each event name. This is safe because we only register one handler per event.
    return () => {
      connection.off('ConnectionStatus');
      connection.off('EventAttendanceUpdate');
      connection.off('EventEngagementScoreUpdate');
      connection.off('EventFeedbackReceived');
      connection.off('EventRecommendationUpdate');
      connection.off('EventRsvpUpdate');
      connection.off('ClubEventEngagementUpdate');
      connection.off('Error');
      connection.off('AccessDenied');
      connection.off('JoinedClubEventEngagement');
      connection.off('JoinedEventEngagement');
      connection.off('LeftClubEventEngagement');
      connection.off('LeftEventEngagement');

      logger.debug('signalr', 'Cleaned up event engagement event listeners');
    };
  };

  /**
   * Join club event engagement monitoring
   */
  const joinClubEventEngagement = async (targetClubId: number): Promise<void> => {
    if (!connectionRef.current || !targetClubId) return;

    try {
      await connectionRef.current.invoke('JoinClubEventEngagement', targetClubId);
      logger.info('signalr', `Joined event engagement monitoring for club ${targetClubId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('signalr', 'Failed to join club event engagement monitoring', { error: err, targetClubId });
      setError(`Failed to join club monitoring: ${errorMessage}`);

      if (showToastNotifications) {
        toast.error('Failed to join event engagement monitoring');
      }
    }
  };

  /**
   * Join specific event engagement monitoring
   */
  const joinEventEngagement = async (targetEventId: number): Promise<void> => {
    if (!connectionRef.current || !targetEventId) return;

    try {
      await connectionRef.current.invoke('JoinEventEngagement', targetEventId);
      logger.info('signalr', `Joined engagement monitoring for event ${targetEventId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('signalr', 'Failed to join event engagement monitoring', { error: err, targetEventId });
      setError(`Failed to join event monitoring: ${errorMessage}`);

      if (showToastNotifications) {
        toast.error('Failed to join specific event monitoring');
      }
    }
  };

  /**
   * Leave club event engagement monitoring
   */
  const leaveClubEventEngagement = async (targetClubId: number): Promise<void> => {
    if (!connectionRef.current || !targetClubId) return;

    try {
      await connectionRef.current.invoke('LeaveClubEventEngagement', targetClubId);
      logger.info('signalr', `Left event engagement monitoring for club ${targetClubId}`);
    } catch (err) {
      logger.error('signalr', 'Failed to leave club event engagement monitoring', { error: err, targetClubId });
    }
  };

  /**
   * Leave specific event engagement monitoring
   */
  const leaveEventEngagement = async (targetEventId: number): Promise<void> => {
    if (!connectionRef.current || !targetEventId) return;

    try {
      await connectionRef.current.invoke('LeaveEventEngagement', targetEventId);
      logger.info('signalr', `Left engagement monitoring for event ${targetEventId}`);
    } catch (err) {
      logger.error('signalr', 'Failed to leave event engagement monitoring', { error: err, targetEventId });
    }
  };

  /**
   * Subscribe to specific event updates
   */
  const subscribeToEvent = async (targetEventId: number): Promise<void> => {
    if (!connectionRef.current || !targetEventId) return;

    try {
      await connectionRef.current.invoke('SubscribeToEventEngagement', targetEventId);
      logger.info('signalr', `Subscribed to engagement updates for event ${targetEventId}`);
    } catch (err) {
      logger.error('signalr', 'Failed to subscribe to event engagement', { error: err, targetEventId });

      if (showToastNotifications) {
        toast.error('Failed to subscribe to event updates');
      }
    }
  };

  /**
   * Request immediate event engagement refresh
   */
  const refreshEventEngagement = async (targetEventId?: number): Promise<void> => {
    if (!connectionRef.current) return;

    try {
      if (targetEventId) {
        await connectionRef.current.invoke('RefreshEventEngagement', targetEventId);
      } else if (subscribedClubRef.current) {
        await connectionRef.current.invoke('RefreshClubEventEngagement', subscribedClubRef.current);
      }
      logger.info('signalr', 'Requested event engagement refresh');
    } catch (err) {
      logger.error('signalr', 'Failed to refresh event engagement', { error: err, targetEventId });
    }
  };

  /**
   * Clear data functions
   */
  const clearEventFeedback = useCallback((): void => {
    setEventFeedback([]);
  }, []);

  const clearRecommendations = useCallback((): void => {
    setEventRecommendations([]);
  }, []);

  const clearLiveUpdates = useCallback((): void => {
    setLiveEventUpdates([]);
  }, []);

  const clearRsvpUpdates = useCallback((): void => {
    setRsvpUpdates([]);
  }, []);

  const clearAllData = useCallback((): void => {
    setEventAttendance({});
    setEventEngagementScores({});
    setEventFeedback([]);
    setEventRecommendations([]);
    setLiveEventUpdates([]);
    setRsvpUpdates([]);
  }, []);

  /**
   * Disconnect from SignalR with proper cleanup
   */
  const disconnect = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;

    // Clear any pending cleanup timeouts
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    if (!connectionRef.current) return;

    try {
      // BUG FIX: Clean up event listeners before disconnecting
      if (cleanupListenersRef.current) {
        cleanupListenersRef.current();
        cleanupListenersRef.current = null;
      }

      // Leave current monitoring with timeout protection
      const cleanupPromises: Promise<void>[] = [];
      
      if (subscribedClubRef.current) {
        cleanupPromises.push(
          Promise.race([
            leaveClubEventEngagement(subscribedClubRef.current),
            new Promise<void>(resolve => setTimeout(resolve, 1000)) // 1s timeout
          ])
        );
      }
      
      if (subscribedEventRef.current) {
        cleanupPromises.push(
          Promise.race([
            leaveEventEngagement(subscribedEventRef.current),
            new Promise<void>(resolve => setTimeout(resolve, 1000)) // 1s timeout
          ])
        );
      }

      // Wait for cleanup with overall timeout
      await Promise.race([
        Promise.all(cleanupPromises),
        new Promise<void>(resolve => setTimeout(resolve, 2000)) // 2s max cleanup time
      ]);

      // Stop connection with timeout
      await Promise.race([
        connectionRef.current.stopConnection(),
        new Promise<void>(resolve => setTimeout(resolve, 1000)) // 1s timeout for stop
      ]);
      
      connectionRef.current = null;
      subscribedClubRef.current = null;
      subscribedEventRef.current = null;

      // Reset state only if still mounted
      if (isMountedRef.current) {
        setIsConnected(false);
        setConnectionStatus('Disconnected');
        setError(null);
      }
      
      logger.info('signalr', 'Event engagement SignalR disconnected');
    } catch (err) {
      logger.error('signalr', 'Error disconnecting from event engagement SignalR', { error: err });
      // Force cleanup even if error occurs
      connectionRef.current = null;
      subscribedClubRef.current = null;
      subscribedEventRef.current = null;
    }
  }, []);

  // Auto-connect on mount with proper cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    if (autoConnect && clubId) {
      initializeConnection();
    }

    return () => {
      isMountedRef.current = false;
      
      // Use timeout to prevent hanging on unmount
      cleanupTimeoutRef.current = setTimeout(() => {
        disconnect();
      }, 0);
    };
  }, [clubId, autoConnect, initializeConnection, disconnect]);

  // Handle club ID changes with timeout protection
  useEffect(() => {
    if (!connectionRef.current || !isConnected || !isMountedRef.current) return;

    const handleClubChange = async (): Promise<void> => {
      try {
        // Leave previous club monitoring with timeout
        if (subscribedClubRef.current && subscribedClubRef.current !== clubId) {
          await Promise.race([
            leaveClubEventEngagement(subscribedClubRef.current),
            new Promise<void>(resolve => setTimeout(resolve, 1000))
          ]);
        }

        // Join new club monitoring with timeout
        if (clubId && clubId !== subscribedClubRef.current && isMountedRef.current) {
          await Promise.race([
            joinClubEventEngagement(clubId),
            new Promise<void>(resolve => setTimeout(resolve, 1000))
          ]);
        }
      } catch (err) {
        logger.error('signalr', 'Error handling club change in event engagement', { error: err, clubId });
      }
    };

    handleClubChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- joinClubEventEngagement is stable, only react to clubId/isConnected changes
  }, [clubId, isConnected]);

  // Handle event ID changes with timeout protection
  useEffect(() => {
    if (!connectionRef.current || !isConnected || !isMountedRef.current) return;

    const handleEventChange = async (): Promise<void> => {
      try {
        // Leave previous event monitoring with timeout
        if (subscribedEventRef.current && subscribedEventRef.current !== eventId) {
          await Promise.race([
            leaveEventEngagement(subscribedEventRef.current),
            new Promise<void>(resolve => setTimeout(resolve, 1000))
          ]);
        }

        // Join new event monitoring with timeout
        if (eventId && eventId !== subscribedEventRef.current && isMountedRef.current) {
          await Promise.race([
            joinEventEngagement(eventId),
            new Promise<void>(resolve => setTimeout(resolve, 1000))
          ]);
        }
      } catch (err) {
        logger.error('signalr', 'Error handling event change in engagement monitoring', { error: err, eventId });
      }
    };

    handleEventChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- joinEventEngagement is stable, only react to eventId/isConnected changes
  }, [eventId, isConnected]);

  return {
    // Connection state
    isConnected,
    connectionStatus,
    isLoading,
    error,

    // Event data
    eventAttendance,
    eventEngagementScores,
    eventFeedback,
    eventRecommendations,
    liveEventUpdates,
    rsvpUpdates,

    // Actions
    connect: initializeConnection,
    disconnect,
    subscribeToEvent,
    refreshEventEngagement,
    clearEventFeedback,
    clearRecommendations,
    clearLiveUpdates,
    clearRsvpUpdates,
    clearAllData,

    // Utility methods
    getEventAttendance: (eventIdParam: number): EventAttendanceData | null => eventAttendance[eventIdParam] || null,
    getEventEngagementScore: (eventIdParam: number): EventEngagementScoreData | null => eventEngagementScores[eventIdParam] || null,
    getEventFeedback: (eventIdParam: number): EventFeedbackData[] => eventFeedback.filter(f => f.eventId === eventIdParam),
    getLiveUpdatesForEvent: (eventIdParam: number): LiveEventUpdateData[] => liveEventUpdates.filter(u => u.eventId === eventIdParam),

    // Computed values
    hasNewFeedback: eventFeedback.length > 0,
    hasNewRecommendations: eventRecommendations.length > 0,
    hasLiveUpdates: liveEventUpdates.length > 0,
    totalMonitoredEvents: Object.keys(eventAttendance).length,
    activeEventsCount: Object.values(eventAttendance).filter(
      att => att && new Date(att.lastUpdated) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length
  };
};

export default useRealTimeEventEngagement;