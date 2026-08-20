import { renderHook, waitFor, act } from '@testing-library/react';
import { useRealTimeEventEngagement } from '../useRealTimeEventEngagement';
import { getSignalRConnection, SignalRConnection } from '../signalr-connection';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('../signalr-connection');
jest.mock('sonner');
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockGetSignalRConnection = getSignalRConnection as jest.MockedFunction<typeof getSignalRConnection>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('useRealTimeEventEngagement - Enhanced Coverage', () => {
  let mockConnection: jest.Mocked<SignalRConnection>;
  let eventHandlers: Record<string, (data: any) => void>;

  beforeEach(() => {
    jest.clearAllMocks();
    eventHandlers = {};

    // Create mock SignalR connection
    mockConnection = {
      on: jest.fn((eventName: string, handler: (data: any) => void) => {
        eventHandlers[eventName] = handler;
      }),
      off: jest.fn(),
      invoke: jest.fn().mockResolvedValue(undefined),
      stopConnection: jest.fn().mockResolvedValue(undefined),
      onConnectionStatus: jest.fn((onConnected, onDisconnected, onReconnecting, onReconnected) => {
        // Immediately call onConnected to simulate successful connection
        setTimeout(() => onConnected(), 0);
      }),
    } as any;

    mockGetSignalRConnection.mockResolvedValue(mockConnection);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Bulk Updates - ClubEventEngagementUpdate', () => {
    it('should handle ClubEventEngagementUpdate with both attendance and engagement scores', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        eventHandlers['ClubEventEngagementUpdate']({
          AttendanceUpdates: [
            { EventId: 1, CheckedIn: 50, TotalRsvps: 100 },
            { EventId: 2, CheckedIn: 75, TotalRsvps: 150 },
            { EventId: 3, CheckedIn: 25, TotalRsvps: 50 },
          ],
          EngagementScores: [
            { EventId: 1, OverallScore: 85, Trend: 'up' },
            { EventId: 2, OverallScore: 90, Trend: 'stable' },
            { EventId: 3, OverallScore: 75, Trend: 'down' },
          ],
          Timestamp: '2024-01-01T10:00:00Z',
        });
      });

      // Verify attendance updates
      expect(result.current.eventAttendance[1]).toBeDefined();
      expect(result.current.eventAttendance[2]).toBeDefined();
      expect(result.current.eventAttendance[3]).toBeDefined();

      // Verify engagement scores
      expect(result.current.eventEngagementScores[1]).toBeDefined();
      expect(result.current.eventEngagementScores[2]).toBeDefined();
      expect(result.current.eventEngagementScores[3]).toBeDefined();
    });

    it('should handle ClubEventEngagementUpdate with only attendance updates', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        eventHandlers['ClubEventEngagementUpdate']({
          AttendanceUpdates: [
            { EventId: 1, CheckedIn: 50 },
            { EventId: 2, CheckedIn: 75 },
          ],
          Timestamp: '2024-01-01T10:00:00Z',
        });
      });

      expect(Object.keys(result.current.eventAttendance)).toHaveLength(2);
      expect(Object.keys(result.current.eventEngagementScores)).toHaveLength(0);
    });

    it('should handle ClubEventEngagementUpdate with only engagement scores', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        eventHandlers['ClubEventEngagementUpdate']({
          EngagementScores: [
            { EventId: 1, OverallScore: 85 },
            { EventId: 2, OverallScore: 90 },
          ],
          Timestamp: '2024-01-01T10:00:00Z',
        });
      });

      expect(Object.keys(result.current.eventAttendance)).toHaveLength(0);
      expect(Object.keys(result.current.eventEngagementScores)).toHaveLength(2);
    });

    it('should not handle bulk attendance when enableAttendanceUpdates is false', async () => {
      const { result } = renderHook(() =>
        useRealTimeEventEngagement(1, null, { enableAttendanceUpdates: false })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        eventHandlers['ClubEventEngagementUpdate']({
          AttendanceUpdates: [{ EventId: 1, CheckedIn: 50 }],
          Timestamp: '2024-01-01T10:00:00Z',
        });
      });

      expect(Object.keys(result.current.eventAttendance)).toHaveLength(0);
    });

    it('should not handle bulk engagement scores when enableEngagementScoring is false', async () => {
      const { result } = renderHook(() =>
        useRealTimeEventEngagement(1, null, { enableEngagementScoring: false })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        eventHandlers['ClubEventEngagementUpdate']({
          EngagementScores: [{ EventId: 1, OverallScore: 85 }],
          Timestamp: '2024-01-01T10:00:00Z',
        });
      });

      expect(Object.keys(result.current.eventEngagementScores)).toHaveLength(0);
    });
  });

  describe('Error and Access Denied Events', () => {
    it('should handle Error event', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        eventHandlers['Error']('Connection timeout');
      });

      expect(result.current.error).toBe('Connection timeout');
      expect(mockToast.error).toHaveBeenCalledWith('Event engagement monitoring error: Connection timeout');
    });

    it('should handle Error event without toast when showToastNotifications is false', async () => {
      const { result } = renderHook(() =>
        useRealTimeEventEngagement(1, null, { showToastNotifications: false })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      jest.clearAllMocks();

      act(() => {
        eventHandlers['Error']('Connection timeout');
      });

      expect(result.current.error).toBe('Connection timeout');
      expect(mockToast.error).not.toHaveBeenCalled();
    });

    it('should handle AccessDenied event', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        eventHandlers['AccessDenied']('Insufficient permissions for this event');
      });

      expect(result.current.error).toBe('Access denied: Insufficient permissions for this event');
      expect(mockToast.error).toHaveBeenCalledWith('Access denied: Insufficient permissions for this event');
    });

    it('should handle AccessDenied without toast when showToastNotifications is false', async () => {
      const { result } = renderHook(() =>
        useRealTimeEventEngagement(1, null, { showToastNotifications: false })
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      jest.clearAllMocks();

      act(() => {
        eventHandlers['AccessDenied']('Insufficient permissions');
      });

      expect(result.current.error).toBe('Access denied: Insufficient permissions');
      expect(mockToast.error).not.toHaveBeenCalled();
    });
  });

  describe('Subscription Events - Joined and Left', () => {
    it('should handle JoinedClubEventEngagement event', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        eventHandlers['JoinedClubEventEngagement'](1);
      });

      expect(logger.info).toHaveBeenCalledWith(
        'signalr',
        'Successfully joined event engagement monitoring for club 1'
      );
    });

    it('should handle JoinedEventEngagement event', async () => {
      renderHook(() => useRealTimeEventEngagement(1, 100));

      await waitFor(() => {
        expect(mockConnection.invoke).toHaveBeenCalled();
      });

      act(() => {
        eventHandlers['JoinedEventEngagement'](100);
      });

      expect(logger.info).toHaveBeenCalledWith(
        'signalr',
        'Successfully joined engagement monitoring for event 100'
      );
    });

    it('should handle LeftClubEventEngagement event', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        eventHandlers['LeftClubEventEngagement'](1);
      });

      expect(logger.info).toHaveBeenCalledWith('signalr', 'Left event engagement monitoring for club 1');
    });

    it('should handle LeftEventEngagement event', async () => {
      renderHook(() => useRealTimeEventEngagement(1, 100));

      await waitFor(() => {
        expect(mockConnection.invoke).toHaveBeenCalled();
      });

      act(() => {
        eventHandlers['LeftEventEngagement'](100);
      });

      expect(logger.info).toHaveBeenCalledWith('signalr', 'Left engagement monitoring for event 100');
    });
  });

  describe('ConnectionStatus Event', () => {
    it('should handle ConnectionStatus event updates', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        eventHandlers['ConnectionStatus']({ Status: 'Reconnecting' });
      });

      expect(result.current.connectionStatus).toBe('Reconnecting');
    });

    it('should handle multiple ConnectionStatus transitions', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        eventHandlers['ConnectionStatus']({ Status: 'Reconnecting' });
      });
      expect(result.current.connectionStatus).toBe('Reconnecting');

      act(() => {
        eventHandlers['ConnectionStatus']({ Status: 'Connected' });
      });
      expect(result.current.connectionStatus).toBe('Connected');

      act(() => {
        eventHandlers['ConnectionStatus']({ Status: 'Disconnected' });
      });
      expect(result.current.connectionStatus).toBe('Disconnected');
    });
  });

  describe('Reconnection Scenarios', () => {
    it('should rejoin club monitoring after reconnection', async () => {
      let onReconnected: () => void = () => {};
      mockConnection.onConnectionStatus.mockImplementation((onConnected, onDisc, onReconn, onReconnec) => {
        onReconnected = onReconnec;
        setTimeout(() => onConnected(), 0);
      });

      renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(mockConnection.invoke).toHaveBeenCalledWith('JoinClubEventEngagement', 1);
      });

      jest.clearAllMocks();

      act(() => {
        eventHandlers['JoinedClubEventEngagement'](1);
      });

      act(() => {
        onReconnected();
      });

      // Should rejoin after reconnection
      await waitFor(() => {
        expect(logger.info).toHaveBeenCalledWith('Event Engagement SignalR reconnected');
      });
    });

    it('should rejoin event monitoring after reconnection', async () => {
      let onReconnected: () => void = () => {};
      mockConnection.onConnectionStatus.mockImplementation((onConnected, onDisc, onReconn, onReconnec) => {
        onReconnected = onReconnec;
        setTimeout(() => onConnected(), 0);
      });

      renderHook(() => useRealTimeEventEngagement(1, 100));

      await waitFor(() => {
        expect(mockConnection.invoke).toHaveBeenCalledWith('JoinEventEngagement', 100);
      });

      jest.clearAllMocks();

      act(() => {
        eventHandlers['JoinedClubEventEngagement'](1);
        eventHandlers['JoinedEventEngagement'](100);
      });

      act(() => {
        onReconnected();
      });

      await waitFor(() => {
        expect(logger.info).toHaveBeenCalledWith('Event Engagement SignalR reconnected');
      });
    });
  });

  describe('Refresh and Subscribe Actions', () => {
    it('should refresh event engagement for specific event', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      await act(async () => {
        await result.current.refreshEventEngagement(100);
      });

      expect(mockConnection.invoke).toHaveBeenCalledWith('RefreshEventEngagement', 100);
    });

    it('should refresh club event engagement when no eventId provided', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate successful join
      act(() => {
        eventHandlers['JoinedClubEventEngagement'](1);
      });

      await act(async () => {
        await result.current.refreshEventEngagement();
      });

      expect(mockConnection.invoke).toHaveBeenCalledWith('RefreshClubEventEngagement', 1);
    });

    it('should handle refresh failure gracefully', async () => {
      mockConnection.invoke.mockRejectedValueOnce(new Error('Refresh failed'));

      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      await act(async () => {
        await result.current.refreshEventEngagement(100);
      });

      expect(logger.error).toHaveBeenCalled();
    });

    it('should subscribe to specific event', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      await act(async () => {
        await result.current.subscribeToEvent(200);
      });

      expect(mockConnection.invoke).toHaveBeenCalledWith('SubscribeToEventEngagement', 200);
    });

    it('should handle subscribe failure', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Now configure the next invoke (SubscribeToEventEngagement) to fail
      mockConnection.invoke.mockRejectedValueOnce(new Error('Subscribe failed'));

      await act(async () => {
        await result.current.subscribeToEvent(200);
      });

      expect(logger.error).toHaveBeenCalled();
      expect(mockToast.error).toHaveBeenCalledWith('Failed to subscribe to event updates');
    });

    it('should not do anything when refreshing without connection', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(null, null, { autoConnect: false }));

      await act(async () => {
        await result.current.refreshEventEngagement(100);
      });

      expect(mockConnection.invoke).not.toHaveBeenCalled();
    });
  });

  describe('Data Collection Limits', () => {
    it('should limit event feedback to 100 items', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Add 105 feedback items
      for (let i = 0; i < 105; i++) {
        act(() => {
          eventHandlers['EventFeedbackReceived']({
            EventId: 1,
            EventName: 'Test Event',
            Rating: 5,
            Comment: `Feedback ${i}`,
            Timestamp: `2024-01-01T10:${String(i).padStart(2, '0')}:00Z`,
          });
        });
      }

      expect(result.current.eventFeedback).toHaveLength(100);
    });

    it('should limit recommendations to 20 items', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Add 25 recommendations
      for (let i = 0; i < 25; i++) {
        act(() => {
          eventHandlers['EventRecommendationUpdate']({
            EventId: i + 1,
            EventName: `Event ${i}`,
            EventDateTime: '2024-02-01T18:00:00Z',
            RecommendationScore: 80,
            Timestamp: '2024-01-01T10:00:00Z',
          });
        });
      }

      expect(result.current.eventRecommendations).toHaveLength(20);
    });

    it('should limit live updates to 50 items', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Add 60 attendance updates (each creates a live update)
      for (let i = 0; i < 60; i++) {
        act(() => {
          eventHandlers['EventAttendanceUpdate']({
            EventId: 1,
            EventName: 'Test Event',
            TotalRsvps: 100,
            AttendeeCount: 80,
            CheckedIn: i,
            NoShows: 0,
            AttendanceRate: 93.75,
            Timestamp: `2024-01-01T10:${String(i).padStart(2, '0')}:00Z`,
          });
        });
      }

      expect(result.current.liveEventUpdates).toHaveLength(50);
    });

    it('should limit RSVP updates to 50 items', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Add 60 RSVP updates
      for (let i = 0; i < 60; i++) {
        act(() => {
          eventHandlers['EventRsvpUpdate']({
            EventId: 1,
            EventName: 'Test Event',
            MemberId: i,
            MemberName: `Member ${i}`,
            RsvpStatus: 'attending',
            PreviousStatus: 'pending',
            Timestamp: `2024-01-01T10:${String(i).padStart(2, '0')}:00Z`,
          });
        });
      }

      expect(result.current.rsvpUpdates).toHaveLength(50);
    });
  });

  describe('Club and Event ID Changes', () => {
    it('should leave old club and join new club on clubId change', async () => {
      const { rerender } = renderHook(
        ({ clubId }) => useRealTimeEventEngagement(clubId),
        { initialProps: { clubId: 1 } }
      );

      await waitFor(() => {
        expect(mockConnection.invoke).toHaveBeenCalledWith('JoinClubEventEngagement', 1);
      });

      // Simulate successful join and connected status
      act(() => {
        eventHandlers['JoinedClubEventEngagement'](1);
        eventHandlers['ConnectionStatus']({ Status: 'Connected' });
      });

      jest.clearAllMocks();

      // Change clubId
      rerender({ clubId: 2 });

      await waitFor(() => {
        expect(mockConnection.invoke).toHaveBeenCalledWith('LeaveClubEventEngagement', 1);
        expect(mockConnection.invoke).toHaveBeenCalledWith('JoinClubEventEngagement', 2);
      });
    });

    it('should leave old event and join new event on eventId change', async () => {
      const { rerender } = renderHook(
        ({ eventId }) => useRealTimeEventEngagement(1, eventId),
        { initialProps: { eventId: 100 } }
      );

      await waitFor(() => {
        expect(mockConnection.invoke).toHaveBeenCalledWith('JoinEventEngagement', 100);
      });

      // Simulate successful join and connected status
      act(() => {
        eventHandlers['JoinedEventEngagement'](100);
        eventHandlers['ConnectionStatus']({ Status: 'Connected' });
      });

      jest.clearAllMocks();

      // Change eventId
      rerender({ eventId: 200 });

      await waitFor(() => {
        expect(mockConnection.invoke).toHaveBeenCalledWith('LeaveEventEngagement', 100);
        expect(mockConnection.invoke).toHaveBeenCalledWith('JoinEventEngagement', 200);
      });
    });

    it('should handle club change errors gracefully', async () => {
      const { rerender } = renderHook(
        ({ clubId }) => useRealTimeEventEngagement(clubId),
        { initialProps: { clubId: 1 } }
      );

      await waitFor(() => {
        expect(mockConnection.invoke).toHaveBeenCalled();
      });

      // Simulate successful join and connected status
      act(() => {
        eventHandlers['JoinedClubEventEngagement'](1);
        eventHandlers['ConnectionStatus']({ Status: 'Connected' });
      });

      mockConnection.invoke.mockRejectedValueOnce(new Error('Leave failed'));

      // Change clubId
      rerender({ clubId: 2 });

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalled();
      });
    });
  });

  describe('Utility Method Edge Cases', () => {
    it('should return null for non-existent event attendance', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const attendance = result.current.getEventAttendance(999);
      expect(attendance).toBeNull();
    });

    it('should return null for non-existent event engagement score', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const score = result.current.getEventEngagementScore(999);
      expect(score).toBeNull();
    });

    it('should return empty array for non-existent event feedback', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const feedback = result.current.getEventFeedback(999);
      expect(feedback).toEqual([]);
    });

    it('should return empty array for non-existent live updates', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const updates = result.current.getLiveUpdatesForEvent(999);
      expect(updates).toEqual([]);
    });

    it('should filter feedback by eventId correctly', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Add feedback for multiple events
      act(() => {
        eventHandlers['EventFeedbackReceived']({
          EventId: 1,
          EventName: 'Event 1',
          Rating: 5,
          Comment: 'Great!',
          Timestamp: '2024-01-01T10:00:00Z',
        });
        eventHandlers['EventFeedbackReceived']({
          EventId: 2,
          EventName: 'Event 2',
          Rating: 4,
          Comment: 'Good',
          Timestamp: '2024-01-01T10:01:00Z',
        });
        eventHandlers['EventFeedbackReceived']({
          EventId: 1,
          EventName: 'Event 1',
          Rating: 3,
          Comment: 'OK',
          Timestamp: '2024-01-01T10:02:00Z',
        });
      });

      const event1Feedback = result.current.getEventFeedback(1);
      const event2Feedback = result.current.getEventFeedback(2);

      expect(event1Feedback).toHaveLength(2);
      expect(event2Feedback).toHaveLength(1);
      expect(event1Feedback.every(f => f.eventId === 1)).toBe(true);
      expect(event2Feedback.every(f => f.eventId === 2)).toBe(true);
    });

    it('should filter live updates by eventId correctly', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Add updates for multiple events
      act(() => {
        eventHandlers['EventAttendanceUpdate']({
          EventId: 1,
          EventName: 'Event 1',
          TotalRsvps: 100,
          AttendeeCount: 80,
          CheckedIn: 75,
          NoShows: 5,
          AttendanceRate: 93.75,
          Timestamp: '2024-01-01T10:00:00Z',
        });
        eventHandlers['EventAttendanceUpdate']({
          EventId: 2,
          EventName: 'Event 2',
          TotalRsvps: 50,
          AttendeeCount: 40,
          CheckedIn: 35,
          NoShows: 5,
          AttendanceRate: 87.5,
          Timestamp: '2024-01-01T10:01:00Z',
        });
      });

      const event1Updates = result.current.getLiveUpdatesForEvent(1);
      const event2Updates = result.current.getLiveUpdatesForEvent(2);

      expect(event1Updates).toHaveLength(1);
      expect(event2Updates).toHaveLength(1);
      expect(event1Updates[0].eventId).toBe(1);
      expect(event2Updates[0].eventId).toBe(2);
    });
  });

  describe('Computed Values - activeEventsCount', () => {
    it('should count only events updated within last 24 hours', async () => {
      jest.useFakeTimers();
      const now = new Date('2024-01-15T12:00:00Z');
      jest.setSystemTime(now);

      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Recent event (within 24 hours)
      act(() => {
        eventHandlers['EventAttendanceUpdate']({
          EventId: 1,
          EventName: 'Recent Event',
          TotalRsvps: 100,
          AttendeeCount: 80,
          CheckedIn: 75,
          NoShows: 5,
          AttendanceRate: 93.75,
          Timestamp: '2024-01-15T11:00:00Z', // 1 hour ago
        });
      });

      // Old event (more than 24 hours ago)
      act(() => {
        eventHandlers['EventAttendanceUpdate']({
          EventId: 2,
          EventName: 'Old Event',
          TotalRsvps: 50,
          AttendeeCount: 40,
          CheckedIn: 35,
          NoShows: 5,
          AttendanceRate: 87.5,
          Timestamp: '2024-01-13T10:00:00Z', // 2 days ago
        });
      });

      expect(result.current.activeEventsCount).toBe(1);
      expect(result.current.totalMonitoredEvents).toBe(2);

      jest.useRealTimers();
    });
  });

  describe('Disconnect with Timeout Protection', () => {
    it('should disconnect with timeout protection', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate successful join
      act(() => {
        eventHandlers['JoinedClubEventEngagement'](1);
      });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(mockConnection.off).toHaveBeenCalled();
      expect(mockConnection.stopConnection).toHaveBeenCalled();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.connectionStatus).toBe('Disconnected');
    });

    it('should handle disconnect errors gracefully', async () => {
      mockConnection.stopConnection.mockRejectedValueOnce(new Error('Stop failed'));

      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Cleanup on Unmount', () => {
    it('should call unmount cleanup without errors', async () => {
      const { result, unmount } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // Verify connection was established
      expect(mockConnection.on).toHaveBeenCalled();

      // Unmount should not throw
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Recommendation Update Replacement Logic', () => {
    it('should replace existing recommendation for same eventId', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      // First recommendation
      act(() => {
        eventHandlers['EventRecommendationUpdate']({
          RecommendationId: 'rec-1',
          EventId: 1,
          EventName: 'Test Event',
          EventDateTime: '2024-02-01T18:00:00Z',
          RecommendationScore: 75,
          Reasons: ['Reason 1'],
          Timestamp: '2024-01-01T10:00:00Z',
        });
      });

      expect(result.current.eventRecommendations).toHaveLength(1);
      expect(result.current.eventRecommendations[0].recommendationScore).toBe(75);

      // Updated recommendation for same event
      act(() => {
        eventHandlers['EventRecommendationUpdate']({
          RecommendationId: 'rec-2',
          EventId: 1,
          EventName: 'Test Event',
          EventDateTime: '2024-02-01T18:00:00Z',
          RecommendationScore: 85,
          Reasons: ['Reason 1', 'Reason 2'],
          Timestamp: '2024-01-01T11:00:00Z',
        });
      });

      expect(result.current.eventRecommendations).toHaveLength(1);
      expect(result.current.eventRecommendations[0].recommendationScore).toBe(85);
      expect(result.current.eventRecommendations[0].reasons).toEqual(['Reason 1', 'Reason 2']);
    });
  });

  describe('Default Values for Optional Fields', () => {
    it('should use default values for missing feedback fields', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        eventHandlers['EventFeedbackReceived']({
          EventId: 1,
          EventName: 'Test Event',
          Rating: 5,
          Comment: 'Great!',
          Timestamp: '2024-01-01T10:00:00Z',
          // Missing: FeedbackId, MemberName, Category, IsPublic
        });
      });

      const feedback = result.current.eventFeedback[0];
      expect(feedback.id).toMatch(/^feedback-/);
      expect(feedback.memberName).toBe('Anonymous');
      expect(feedback.category).toBe('general');
      expect(feedback.isPublic).toBe(false);
    });

    it('should use default values for missing recommendation fields', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        eventHandlers['EventRecommendationUpdate']({
          EventId: 1,
          EventName: 'Test Event',
          EventDateTime: '2024-02-01T18:00:00Z',
          RecommendationScore: 85,
          Timestamp: '2024-01-01T10:00:00Z',
          // Missing: RecommendationId, Reasons, TargetAudience, Confidence
        });
      });

      const recommendation = result.current.eventRecommendations[0];
      expect(recommendation.id).toMatch(/^rec-/);
      expect(recommendation.reasons).toEqual([]);
      expect(recommendation.targetAudience).toEqual([]);
      expect(recommendation.confidence).toBe(0);
    });

    it('should use default breakdown for missing score breakdown', async () => {
      const { result } = renderHook(() => useRealTimeEventEngagement(1));

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      act(() => {
        eventHandlers['EventEngagementScoreUpdate']({
          EventId: 1,
          EventName: 'Test Event',
          OverallScore: 85,
          PreviousScore: 80,
          Trend: 'up',
          ParticipationRate: 75,
          InteractionLevel: 'high',
          SatisfactionScore: 4.5,
          Timestamp: '2024-01-01T10:00:00Z',
          // Missing: ScoreBreakdown
        });
      });

      const score = result.current.eventEngagementScores[1];
      expect(score.breakdown).toEqual({});
    });
  });
});
