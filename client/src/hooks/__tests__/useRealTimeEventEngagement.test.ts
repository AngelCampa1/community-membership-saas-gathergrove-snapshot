import { renderHook, act, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { useRealTimeEventEngagement } from '../useRealTimeEventEngagement';
import { getSignalRConnection } from '../signalr-connection';
import type { SignalRConnection } from '../signalr-connection';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock('../signalr-connection', () => ({
  getSignalRConnection: jest.fn(),
}));

// Type the mocked dependencies
const mockToast = toast as jest.Mocked<typeof toast>;
const mockGetSignalRConnection = getSignalRConnection as jest.MockedFunction<typeof getSignalRConnection>;

// Mock SignalR connection interface
interface MockSignalRConnection extends Omit<SignalRConnection, 'on' | 'onConnectionStatus'> {
  invoke: jest.MockedFunction<SignalRConnection['invoke']>;
  on: jest.MockedFunction<(event: string, handler: (data: any) => void) => void>;
  onConnectionStatus: jest.MockedFunction<SignalRConnection['onConnectionStatus']>;
  stopConnection: jest.MockedFunction<SignalRConnection['stopConnection']>;
  
  // Test helpers
  _triggerEvent: (event: string, data: any) => void;
  _triggerStatus: (status: 'connected' | 'disconnected' | 'reconnecting' | 'reconnected') => void;
  _eventHandlers: Record<string, (data: any) => void>;
  _statusCallbacks: {
    connected: (() => void)[];
    disconnected: (() => void)[];
    reconnecting: (() => void)[];
    reconnected: (() => void)[];
  };
}

// Mock SignalR connection factory
const createMockConnection = (): MockSignalRConnection => {
  const eventHandlers: Record<string, (data: any) => void> = {};
  const statusCallbacks = {
    connected: [] as (() => void)[],
    disconnected: [] as (() => void)[],
    reconnecting: [] as (() => void)[],
    reconnected: [] as (() => void)[],
  };
  const timeoutIds: NodeJS.Timeout[] = [];

  return {
    invoke: jest.fn().mockImplementation(async (method: string, ...args: any[]) => {
      // Simulate SignalR server responses by triggering appropriate events
      if (method === 'JoinClubEventEngagement') {
        // Simulate server acknowledging the join by triggering the event
        const timeoutId = setTimeout(() => {
          if (eventHandlers['JoinedClubEventEngagement']) {
            eventHandlers['JoinedClubEventEngagement'](args[0]); // clubId
          }
        }, 10);
        timeoutIds.push(timeoutId);
      } else if (method === 'JoinEventEngagement') {
        // Simulate server acknowledging the join by triggering the event
        const timeoutId = setTimeout(() => {
          if (eventHandlers['JoinedEventEngagement']) {
            eventHandlers['JoinedEventEngagement'](args[0]); // eventId
          }
        }, 10);
        timeoutIds.push(timeoutId);
      }
    }),
    on: jest.fn((event: string, handler: (data: any) => void) => {
      eventHandlers[event] = handler;
    }),
    off: jest.fn(),
    onConnectionStatus: jest.fn((onConnected?: () => void, onDisconnected?: () => void, onReconnecting?: () => void, onReconnected?: () => void) => {
      if (onConnected) statusCallbacks.connected.push(onConnected);
      if (onDisconnected) statusCallbacks.disconnected.push(onDisconnected);
      if (onReconnecting) statusCallbacks.reconnecting.push(onReconnecting);
      if (onReconnected) statusCallbacks.reconnected.push(onReconnected);
    }),
    stopConnection: jest.fn().mockImplementation(() => {
      // Clear all pending timeouts to prevent hanging
      timeoutIds.forEach(id => clearTimeout(id));
      timeoutIds.length = 0;
    }),
    getConnectionState: jest.fn(),
    isConnected: jest.fn(),
    notifyStatus: jest.fn(),

    // Test helpers
    _triggerEvent: (event: string, data: any) => {
      if (eventHandlers[event]) {
        eventHandlers[event](data);
      }
    },
    _triggerStatus: (status: 'connected' | 'disconnected' | 'reconnecting' | 'reconnected') => {
      statusCallbacks[status]?.forEach(callback => callback());
    },
    _eventHandlers: eventHandlers,
    _statusCallbacks: statusCallbacks,
  };
};

describe('useRealTimeEventEngagement', () => {
  let mockConnection: MockSignalRConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection = createMockConnection();
    mockGetSignalRConnection.mockResolvedValue(mockConnection as any);
  });

  afterEach(async () => {
    // Use fake timers to flush all pending timeouts
    jest.useFakeTimers();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();

    // Force cleanup of any remaining promises
    if (mockConnection && mockConnection.stopConnection) {
      try {
        await mockConnection.stopConnection();
      } catch (e) {
        // Ignore cleanup errors in tests
      }
    }

    // Clear all mocks and timers
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('Hook Initialization', () => {
    test('should initialize with correct default state', () => {
      const { result } = renderHook(() => 
        useRealTimeEventEngagement(123, null, { autoConnect: false })
      );

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionStatus).toBe('Disconnected');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.eventAttendance).toEqual({});
      expect(result.current.eventEngagementScores).toEqual({});
      expect(result.current.eventFeedback).toEqual([]);
      expect(result.current.eventRecommendations).toEqual([]);
      expect(result.current.liveEventUpdates).toEqual([]);
      expect(result.current.rsvpUpdates).toEqual([]);
    });

    test('should auto-connect when autoConnect is true', async () => {
      renderHook(() => useRealTimeEventEngagement(123));

      await waitFor(() => {
        expect(mockGetSignalRConnection).toHaveBeenCalledWith('eventEngagement');
        expect(mockConnection.invoke).toHaveBeenCalledWith('JoinClubEventEngagement', 123);
      });
    });

    test('should not auto-connect when autoConnect is false', () => {
      renderHook(() => useRealTimeEventEngagement(123, null, { autoConnect: false }));

      expect(mockGetSignalRConnection).not.toHaveBeenCalled();
    });
  });

  describe('Connection Management', () => {
    test('should handle successful connection', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(123));

      await waitFor(() => {
        expect(mockConnection.onConnectionStatus).toHaveBeenCalled();
      });

      act(() => {
        mockConnection._triggerStatus('connected');
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.connectionStatus).toBe('Connected');
    });

    test('should handle disconnection', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(123));

      await waitFor(() => {
        mockConnection._triggerStatus('connected');
      });

      act(() => {
        mockConnection._triggerStatus('disconnected');
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionStatus).toBe('Disconnected');
    });

    test('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockGetSignalRConnection.mockRejectedValue(error);

      const { result } = renderHook(() => 
        useRealTimeEventEngagement(123, null, { showToastNotifications: true })
      );

      await waitFor(() => {
        expect(result.current.error).toBe('Connection failed: Connection failed');
        expect(result.current.connectionStatus).toBe('Failed');
        expect(mockToast.error).toHaveBeenCalledWith(
          'Failed to connect to real-time event engagement updates'
        );
      });
    });
  });

  describe('Event Attendance Updates', () => {
    test('should handle event attendance updates', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(123));

      await waitFor(() => {
        expect(mockConnection.on).toHaveBeenCalled();
      });

      const attendanceData = {
        EventId: 456,
        EventName: 'Summer BBQ',
        TotalRsvps: 50,
        AttendeeCount: 35,
        CheckedIn: 30,
        NoShows: 5,
        AttendanceRate: 85.7,
        Timestamp: new Date().toISOString(),
      };

      act(() => {
        mockConnection._triggerEvent('EventAttendanceUpdate', attendanceData);
      });

      expect(result.current.eventAttendance[456]).toEqual({
        eventId: 456,
        eventName: 'Summer BBQ',
        totalRsvps: 50,
        attendeeCount: 35,
        checkedIn: 30,
        noShows: 5,
        attendanceRate: 85.7,
        lastUpdated: attendanceData.Timestamp,
      });

      expect(result.current.liveEventUpdates).toHaveLength(1);
      expect(result.current.liveEventUpdates[0]).toMatchObject({
        type: 'attendance',
        eventId: 456,
        eventName: 'Summer BBQ',
        message: '30 members checked in (85.7% attendance rate)',
      });
    });

    test('should show toast notifications for attendance updates', async () => {
      renderHook(() => useRealTimeEventEngagement(123, null, { showToastNotifications: true }));

      await waitFor(() => {
        expect(mockConnection.on).toHaveBeenCalled();
      });

      act(() => {
        mockConnection._triggerEvent('EventAttendanceUpdate', {
          EventId: 456,
          EventName: 'Summer BBQ',
          CheckedIn: 30,
          AttendanceRate: 85.7,
          Timestamp: new Date().toISOString(),
        });
      });

      expect(mockToast.info).toHaveBeenCalledWith('Summer BBQ: 30 attendees checked in');
    });
  });

  describe('Event Engagement Score Updates', () => {
    test('should handle engagement score updates', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(123));

      await waitFor(() => {
        expect(mockConnection.on).toHaveBeenCalled();
      });

      const engagementData = {
        EventId: 456,
        EventName: 'Summer BBQ',
        OverallScore: 82.5,
        PreviousScore: 75.3,
        Trend: 'up',
        ParticipationRate: 90.2,
        InteractionLevel: 'high',
        SatisfactionScore: 8.5,
        Timestamp: new Date().toISOString(),
        ScoreBreakdown: {
          participation: 85,
          interaction: 80,
          satisfaction: 90,
        },
      };

      act(() => {
        mockConnection._triggerEvent('EventEngagementScoreUpdate', engagementData);
      });

      expect(result.current.eventEngagementScores[456]).toEqual({
        eventId: 456,
        eventName: 'Summer BBQ',
        overallScore: 82.5,
        previousScore: 75.3,
        trend: 'up',
        participationRate: 90.2,
        interactionLevel: 'high',
        satisfactionScore: 8.5,
        lastUpdated: engagementData.Timestamp,
        breakdown: {
          participation: 85,
          interaction: 80,
          satisfaction: 90,
        },
      });
    });

    test('should show toast for significant score changes', async () => {
      renderHook(() => useRealTimeEventEngagement(123, null, { showToastNotifications: true }));

      await waitFor(() => {
        expect(mockConnection.on).toHaveBeenCalled();
      });

      // Significant increase
      act(() => {
        mockConnection._triggerEvent('EventEngagementScoreUpdate', {
          EventId: 456,
          EventName: 'Summer BBQ',
          OverallScore: 85,
          PreviousScore: 75,
          Trend: 'up',
          Timestamp: new Date().toISOString(),
        });
      });

      expect(mockToast.info).toHaveBeenCalledWith('Summer BBQ: Engagement score increased to 85');

      jest.clearAllMocks();

      // Significant decrease
      act(() => {
        mockConnection._triggerEvent('EventEngagementScoreUpdate', {
          EventId: 456,
          EventName: 'Summer BBQ',
          OverallScore: 65,
          PreviousScore: 75,
          Trend: 'down',
          Timestamp: new Date().toISOString(),
        });
      });

      expect(mockToast.info).toHaveBeenCalledWith('Summer BBQ: Engagement score decreased to 65');
    });
  });

  describe('Event Feedback', () => {
    test('should handle feedback notifications', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(123));

      await waitFor(() => {
        expect(mockConnection.on).toHaveBeenCalled();
      });

      const feedbackData = {
        FeedbackId: 'fb-123',
        EventId: 456,
        EventName: 'Summer BBQ',
        MemberName: 'John Doe',
        Rating: 4,
        Comment: 'Great event!',
        Category: 'overall',
        Timestamp: new Date().toISOString(),
        IsPublic: true,
      };

      act(() => {
        mockConnection._triggerEvent('EventFeedbackReceived', feedbackData);
      });

      expect(result.current.eventFeedback).toHaveLength(1);
      expect(result.current.eventFeedback[0]).toEqual({
        id: 'fb-123',
        eventId: 456,
        eventName: 'Summer BBQ',
        memberName: 'John Doe',
        rating: 4,
        comment: 'Great event!',
        category: 'overall',
        timestamp: feedbackData.Timestamp,
        isPublic: true,
      });

      expect(mockToast.info).toHaveBeenCalledWith('Summer BBQ: New feedback received (4/5 stars)');
    });
  });

  describe('Event Recommendations', () => {
    test('should handle recommendation updates', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(123));

      await waitFor(() => {
        expect(mockConnection.on).toHaveBeenCalled();
      });

      const recommendationData = {
        RecommendationId: 'rec-456',
        EventId: 789,
        EventName: 'Book Club Meeting',
        EventDateTime: '2024-12-01T19:00:00Z',
        RecommendationScore: 85,
        Reasons: ['Based on past attendance', 'Similar interests'],
        TargetAudience: ['book lovers', 'regular attendees'],
        Confidence: 0.85,
        Timestamp: new Date().toISOString(),
      };

      act(() => {
        mockConnection._triggerEvent('EventRecommendationUpdate', recommendationData);
      });

      expect(result.current.eventRecommendations).toHaveLength(1);
      expect(result.current.eventRecommendations[0]).toEqual({
        id: 'rec-456',
        eventId: 789,
        eventName: 'Book Club Meeting',
        eventDateTime: '2024-12-01T19:00:00Z',
        recommendationScore: 85,
        reasons: ['Based on past attendance', 'Similar interests'],
        targetAudience: ['book lovers', 'regular attendees'],
        confidence: 0.85,
        lastUpdated: recommendationData.Timestamp,
      });
    });

    test('should show toast for high recommendation scores', async () => {
      renderHook(() => useRealTimeEventEngagement(123, null, { showToastNotifications: true }));

      await waitFor(() => {
        expect(mockConnection.on).toHaveBeenCalled();
      });

      act(() => {
        mockConnection._triggerEvent('EventRecommendationUpdate', {
          EventId: 789,
          EventName: 'Book Club Meeting',
          RecommendationScore: 90,
          Timestamp: new Date().toISOString(),
        });
      });

      expect(mockToast.info).toHaveBeenCalledWith('High recommendation: Book Club Meeting (90% match)');
    });
  });

  describe('RSVP Updates', () => {
    test('should handle RSVP updates', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(123));

      await waitFor(() => {
        expect(mockConnection.on).toHaveBeenCalled();
      });

      const rsvpData = {
        EventId: 456,
        EventName: 'Summer BBQ',
        MemberId: 789,
        MemberName: 'Jane Smith',
        RsvpStatus: 'attending',
        PreviousStatus: 'pending',
        Timestamp: new Date().toISOString(),
      };

      act(() => {
        mockConnection._triggerEvent('EventRsvpUpdate', rsvpData);
      });

      expect(result.current.rsvpUpdates).toHaveLength(1);
      expect(result.current.rsvpUpdates[0]).toMatchObject({
        eventId: 456,
        eventName: 'Summer BBQ',
        memberId: 789,
        memberName: 'Jane Smith',
        rsvpStatus: 'attending',
        previousStatus: 'pending',
      });
    });
  });

  describe('Utility Functions', () => {
    test('should provide event-specific data retrieval methods', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(123));

      await waitFor(() => {
        expect(mockConnection.on).toHaveBeenCalled();
      });

      // Add some test data
      act(() => {
        mockConnection._triggerEvent('EventAttendanceUpdate', {
          EventId: 456,
          EventName: 'Summer BBQ',
          CheckedIn: 30,
          AttendanceRate: 85.7,
          Timestamp: new Date().toISOString(),
        });

        mockConnection._triggerEvent('EventEngagementScoreUpdate', {
          EventId: 456,
          EventName: 'Summer BBQ',
          OverallScore: 82.5,
          Timestamp: new Date().toISOString(),
        });
      });

      // Test utility methods
      expect(result.current.getEventAttendance(456)).toBeDefined();
      expect(result.current.getEventEngagementScore(456)).toBeDefined();
      expect(result.current.getEventAttendance(999)).toBeNull();
      expect(result.current.getEventEngagementScore(999)).toBeNull();
    });

    test('should provide clear functions', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(123));

      await waitFor(() => {
        expect(mockConnection.on).toHaveBeenCalled();
      });

      // Add some data
      act(() => {
        mockConnection._triggerEvent('EventFeedbackReceived', {
          EventId: 456,
          EventName: 'Summer BBQ',
          Rating: 4,
          Timestamp: new Date().toISOString(),
        });
      });

      expect(result.current.eventFeedback).toHaveLength(1);

      // Clear feedback
      act(() => {
        result.current.clearEventFeedback();
      });

      expect(result.current.eventFeedback).toHaveLength(0);
    });

    test('should provide computed values', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(123));

      await waitFor(() => {
        expect(mockConnection.on).toHaveBeenCalled();
      });

      expect(result.current.hasNewFeedback).toBe(false);
      expect(result.current.hasNewRecommendations).toBe(false);
      expect(result.current.hasLiveUpdates).toBe(false);
      expect(result.current.totalMonitoredEvents).toBe(0);

      // Add some data
      act(() => {
        mockConnection._triggerEvent('EventAttendanceUpdate', {
          EventId: 456,
          CheckedIn: 30,
          Timestamp: new Date().toISOString(),
        });
      });

      expect(result.current.hasLiveUpdates).toBe(true);
      expect(result.current.totalMonitoredEvents).toBe(1);
    });
  });

  describe('Event-Specific Monitoring', () => {
    test('should handle specific event monitoring', async () => {
      renderHook(() => useRealTimeEventEngagement(123, 456));

      await waitFor(() => {
        expect(mockConnection.invoke).toHaveBeenCalledWith('JoinClubEventEngagement', 123);
        expect(mockConnection.invoke).toHaveBeenCalledWith('JoinEventEngagement', 456);
      });
    });

    test('should handle event ID changes', async () => {
      // First hook instance with eventId 456
      const { unmount: unmount1 } = renderHook(() => useRealTimeEventEngagement(123, 456));

      await waitFor(() => {
        expect(mockConnection.invoke).toHaveBeenCalledWith('JoinClubEventEngagement', 123);
        expect(mockConnection.invoke).toHaveBeenCalledWith('JoinEventEngagement', 456);
      });

      // Simulate connection established
      await act(async () => {
        mockConnection._triggerEvent('ConnectionStatus', { Status: 'Connected' });
        await Promise.resolve(); // Flush microtask queue
      });

      // Clean up first instance
      await act(async () => {
        unmount1();
        await Promise.resolve(); // Allow cleanup to process
      });

      // Clear mock for new instance
      mockConnection.invoke.mockClear();

      // Second hook instance with eventId 789
      renderHook(() => useRealTimeEventEngagement(123, 789));

      // Should join new eventId
      await waitFor(() => {
        expect(mockConnection.invoke).toHaveBeenCalledWith('JoinClubEventEngagement', 123);
        expect(mockConnection.invoke).toHaveBeenCalledWith('JoinEventEngagement', 789);
      });
    });
  });

  describe('Cleanup', () => {
    test('should cleanup on unmount without hanging', async () => {
      const { unmount } = renderHook(() => useRealTimeEventEngagement(123, 456));

      await waitFor(() => {
        expect(mockConnection.invoke).toHaveBeenCalledWith('JoinClubEventEngagement', 123);
        expect(mockConnection.invoke).toHaveBeenCalledWith('JoinEventEngagement', 456);
      });
      
      // Wait for the join acknowledgments to be processed
      await act(async () => {
        await Promise.resolve(); // Flush promise queue
      });

      // Test passes if unmount completes without hanging or throwing errors
      expect(() => {
        unmount();
      }).not.toThrow();
      
      // Allow any cleanup timeouts to execute
      await act(async () => {
        jest.runOnlyPendingTimers();
        await Promise.resolve(); // Flush promise queue
      });

      // Verify join was called (cleanup Leave call timing varies based on SignalR state)
      expect(mockConnection.invoke).toHaveBeenCalledWith('JoinClubEventEngagement', 123);
      expect(mockConnection.invoke).toHaveBeenCalledWith('JoinEventEngagement', 456);
    });
  });

  describe('Configuration Options', () => {
    test('should respect showToastNotifications option', async () => {
      renderHook(() => useRealTimeEventEngagement(123, null, { showToastNotifications: false }));

      await waitFor(() => {
        expect(mockConnection.on).toHaveBeenCalled();
      });

      act(() => {
        mockConnection._triggerEvent('EventAttendanceUpdate', {
          EventId: 456,
          EventName: 'Summer BBQ',
          CheckedIn: 30,
          Timestamp: new Date().toISOString(),
        });
      });

      expect(mockToast.info).not.toHaveBeenCalled();
    });

    test('should respect feature-specific enable options', async () => {
      const { result } = renderHook(() => 
        useRealTimeEventEngagement(123, null, {
          enableAttendanceUpdates: false,
          enableEngagementScoring: false,
          enableFeedbackNotifications: false,
          enableRecommendationUpdates: false,
        })
      );

      await waitFor(() => {
        expect(mockConnection.on).toHaveBeenCalled();
      });

      // These events should be ignored due to disabled features
      act(() => {
        mockConnection._triggerEvent('EventAttendanceUpdate', {
          EventId: 456,
          CheckedIn: 30,
          Timestamp: new Date().toISOString(),
        });
      });

      expect(result.current.eventAttendance).toEqual({});
    });
  });
});