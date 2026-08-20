/**
 * Enhanced EventService Tests - Mocking apiClient for Maximum Coverage
 *
 * Strategy: Mock apiClient directly (not MSW) to ensure all code paths execute.
 * Goal: Increase coverage from 40% to 85%+ by testing all methods and error paths.
 */

import { eventService } from '../eventService';
import apiClient from '../apiClient';

// Mock apiClient at the HTTP boundary
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock ErrorHandler to avoid side effects
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleApiError: (error: unknown) => error,
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('EventService - Enhanced Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const clubId = 1;
  const eventId = 1;
  const memberId = 1;

  describe('Event CRUD Operations', () => {
    it('should get events by club', async () => {
      const mockEvents = [{ id: 1, name: 'Test Event', clubId: 1 }];
      mockApiClient.get.mockResolvedValue({ data: mockEvents });

      const result = await eventService.getEventsByClub(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/clubs/1/events', expect.any(Object));
      expect(result).toEqual(mockEvents);
    });

    it('should get events with upcoming filter', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      await eventService.getEventsByClub(clubId, 'upcoming');

      expect(mockApiClient.get).toHaveBeenCalledWith('/clubs/1/events', {
        params: { filter: 'upcoming' },
      });
    });

    it('should get events with past filter', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      await eventService.getEventsByClub(clubId, 'past');

      expect(mockApiClient.get).toHaveBeenCalledWith('/clubs/1/events', {
        params: { filter: 'past' },
      });
    });

    it('should get event by ID', async () => {
      const mockEvent = { id: 1, name: 'Test Event', clubId: 1 };
      mockApiClient.get.mockResolvedValue({ data: mockEvent });

      const result = await eventService.getEventById(clubId, eventId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/clubs/1/events/1');
      expect(result).toEqual(mockEvent);
    });

    it('should create event', async () => {
      const newEvent = { name: 'New Event', eventDateTime: '2024-01-15T18:00:00Z' };
      const createdEvent = { id: 1, ...newEvent, clubId: 1 };
      mockApiClient.post.mockResolvedValue({ data: createdEvent });

      const result = await eventService.createEvent(clubId, newEvent as any);

      expect(mockApiClient.post).toHaveBeenCalledWith('/clubs/1/events', newEvent);
      expect(result).toEqual(createdEvent);
    });

    it('should update event', async () => {
      const updates = { name: 'Updated Event' };
      const updatedEvent = { id: 1, ...updates, clubId: 1 };
      mockApiClient.put.mockResolvedValue({ data: updatedEvent });

      const result = await eventService.updateEvent(clubId, eventId, updates as any);

      expect(mockApiClient.put).toHaveBeenCalledWith('/clubs/1/events/1', updates);
      expect(result).toEqual(updatedEvent);
    });

    it('should delete event', async () => {
      mockApiClient.delete.mockResolvedValue({ data: null });

      await eventService.deleteEvent(clubId, eventId);

      expect(mockApiClient.delete).toHaveBeenCalledWith('/clubs/1/events/1');
    });
  });

  describe('RSVP Operations', () => {
    it('should update RSVP', async () => {
      const rsvp = { status: 'attending' as const };
      const mockRsvp = { id: 1, eventId: 1, memberId: 1, status: 'attending' };
      mockApiClient.put.mockResolvedValue({ data: mockRsvp });

      const result = await eventService.updateRsvp(clubId, eventId, memberId, rsvp);

      expect(mockApiClient.put).toHaveBeenCalledWith('/clubs/1/events/1/rsvps/1', rsvp);
      expect(result).toEqual(mockRsvp);
    });

    it('should get event RSVPs', async () => {
      const mockRsvps = [{ id: 1, eventId: 1, memberId: 1, status: 'attending' }];
      mockApiClient.get.mockResolvedValue({ data: mockRsvps });

      const result = await eventService.getEventRsvps(clubId, eventId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/clubs/1/events/1/rsvps');
      expect(result).toEqual(mockRsvps);
    });

    it('should get member RSVP', async () => {
      const mockRsvp = { id: 1, eventId: 1, memberId: 1, status: 'attending' };
      mockApiClient.get.mockResolvedValue({ data: mockRsvp });

      const result = await eventService.getMemberRsvp(clubId, eventId, memberId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/clubs/1/events/1/rsvps/1');
      expect(result).toEqual(mockRsvp);
    });

    it('should return null for 404 on getMemberRsvp', async () => {
      mockApiClient.get.mockRejectedValue({ response: { status: 404 } });

      const result = await eventService.getMemberRsvp(clubId, eventId, memberId);

      expect(result).toBeNull();
    });

    it('should send event invitations', async () => {
      const request = { memberIds: [1, 2, 3], message: 'Join us!' };
      const response = { sent: 3, failed: 0 };
      mockApiClient.post.mockResolvedValue({ data: response });

      const result = await eventService.sendEventInvitations(clubId, eventId, request as any);

      expect(mockApiClient.post).toHaveBeenCalledWith('/clubs/1/events/1/invitations', request);
      expect(result).toEqual(response);
    });
  });

  describe('Event Series Operations', () => {
    it('should get event series', async () => {
      const mockSeries = [{ id: 1, name: 'Weekly Meetup', recurrence: 'weekly' }];
      mockApiClient.get.mockResolvedValue({ data: mockSeries });

      const result = await eventService.getEventSeries(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/clubs/1/event-series');
      expect(result).toEqual(mockSeries);
    });

    it('should create event series', async () => {
      const seriesData = { name: 'Monthly Lunch', recurrence: 'monthly' };
      const createdSeries = { id: 1, ...seriesData, clubId: 1 };
      mockApiClient.post.mockResolvedValue({ data: createdSeries });

      const result = await eventService.createEventSeries(clubId, seriesData as any);

      expect(mockApiClient.post).toHaveBeenCalledWith('/clubs/1/event-series', seriesData);
      expect(result).toEqual(createdSeries);
    });

    it('should delete event series', async () => {
      mockApiClient.delete.mockResolvedValue({ data: null });

      await eventService.deleteEventSeries(clubId, 1);

      expect(mockApiClient.delete).toHaveBeenCalledWith('/clubs/1/event-series/1');
    });
  });

  describe('Waitlist Operations', () => {
    it('should get event waitlist', async () => {
      const mockWaitlist = [{ id: 1, eventId: 1, memberId: 1, position: 1, status: 'waiting' }];
      mockApiClient.get.mockResolvedValue({ data: mockWaitlist });

      const result = await eventService.getEventWaitlist(clubId, eventId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/clubs/1/events/1/waitlist');
      expect(result).toEqual(mockWaitlist);
    });

    it('should add to waitlist', async () => {
      const memberData = { memberId: 1, email: 'test@example.com' };
      const entry = { id: 1, ...memberData, eventId: 1, position: 1, status: 'waiting' };
      mockApiClient.post.mockResolvedValue({ data: entry });

      const result = await eventService.addToWaitlist(clubId, eventId, memberData as any);

      expect(mockApiClient.post).toHaveBeenCalledWith('/clubs/1/events/1/waitlist', memberData);
      expect(result).toEqual(entry);
    });

    it('should remove from waitlist', async () => {
      mockApiClient.delete.mockResolvedValue({ data: null });

      await eventService.removeFromWaitlist(clubId, eventId, 1);

      expect(mockApiClient.delete).toHaveBeenCalledWith('/clubs/1/events/1/waitlist/1');
    });

    it('should promote from waitlist', async () => {
      mockApiClient.post.mockResolvedValue({ data: null });

      await eventService.promoteFromWaitlist(clubId, eventId, 1);

      expect(mockApiClient.post).toHaveBeenCalledWith('/clubs/1/events/1/waitlist/1/promote');
    });

    it('should reorder waitlist', async () => {
      const reorderData = [{ entryId: 1, newPosition: 2 }];
      mockApiClient.put.mockResolvedValue({ data: null });

      await eventService.reorderWaitlist(clubId, eventId, reorderData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/clubs/1/events/1/waitlist/reorder', { entries: reorderData });
    });

    it('should notify waitlist', async () => {
      const notificationData = { message: 'Spots available!' };
      const response = { sent: 5, failed: 0 };
      mockApiClient.post.mockResolvedValue({ data: response });

      const result = await eventService.notifyWaitlist(clubId, eventId, notificationData as any);

      expect(mockApiClient.post).toHaveBeenCalledWith('/clubs/1/events/1/waitlist/notify', notificationData);
      expect(result).toEqual(response);
    });
  });

  describe('Multi-Session Event Operations', () => {
    it('should create multi-session event', async () => {
      const eventData = { name: 'Workshop Series', sessions: [] };
      const createdEvent = { id: 1, ...eventData, clubId: 1 };
      mockApiClient.post.mockResolvedValue({ data: createdEvent });

      const result = await eventService.createMultiSessionEvent(clubId, eventData as any);

      expect(mockApiClient.post).toHaveBeenCalledWith('/clubs/1/multi-session-events', eventData);
      expect(result).toEqual(createdEvent);
    });

    it('should update multi-session event', async () => {
      const updates = { name: 'Updated Workshop' };
      const updatedEvent = { id: 1, ...updates, clubId: 1 };
      mockApiClient.put.mockResolvedValue({ data: updatedEvent });

      const result = await eventService.updateMultiSessionEvent(clubId, eventId, updates as any);

      expect(mockApiClient.put).toHaveBeenCalledWith('/clubs/1/multi-session-events/1', updates);
      expect(result).toEqual(updatedEvent);
    });

    it('should get multi-session event', async () => {
      const mockEvent = { id: 1, name: 'Workshop', sessions: [], clubId: 1 };
      mockApiClient.get.mockResolvedValue({ data: mockEvent });

      const result = await eventService.getMultiSessionEvent(clubId, eventId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/clubs/1/multi-session-events/1');
      expect(result).toEqual(mockEvent);
    });
  });

  describe('QR Code Operations', () => {
    it('should generate QR code', async () => {
      const options = { type: 'check-in' as const };
      const qrData = { id: '123', eventId: 1, qrData: 'data', imageUrl: 'url' };
      mockApiClient.post.mockResolvedValue({ data: qrData });

      const result = await eventService.generateQRCode(clubId, eventId, options as any);

      expect(mockApiClient.post).toHaveBeenCalledWith('/clubs/1/events/1/qr-code', options);
      expect(result).toEqual(qrData);
    });

    it('should generate bulk QR codes', async () => {
      const request = { eventIds: [1, 2, 3], type: 'check-in' };
      const qrCodes = [{ id: '1', qrData: 'data1' }, { id: '2', qrData: 'data2' }];
      mockApiClient.post.mockResolvedValue({ data: qrCodes });

      const result = await eventService.generateBulkQRCodes(clubId, request as any);

      expect(mockApiClient.post).toHaveBeenCalledWith('/clubs/1/events/qr-codes/bulk', request);
      expect(result).toEqual(qrCodes);
    });

    it('should get QR code analytics', async () => {
      const analytics = { totalScans: 100, uniqueScans: 80 };
      mockApiClient.get.mockResolvedValue({ data: analytics });

      const result = await eventService.getQRCodeAnalytics(clubId, eventId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/clubs/1/events/1/qr-code/analytics');
      expect(result).toEqual(analytics);
    });

    it('should get QR code history', async () => {
      const history = [{ id: '1', scannedAt: '2024-01-01T00:00:00Z', action: 'check-in' }];
      mockApiClient.get.mockResolvedValue({ data: history });

      const result = await eventService.getQRCodeHistory(clubId, eventId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/clubs/1/events/1/qr-code/history');
      expect(result).toEqual(history);
    });
  });

  describe('Analytics Operations', () => {
    it('should get event metrics without options', async () => {
      const metrics = { totalEvents: 10, totalAttendees: 500 };
      mockApiClient.get.mockResolvedValue({ data: metrics });

      const result = await eventService.getEventMetrics(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/clubs/1/analytics/metrics?'));
      expect(result).toEqual(metrics);
    });

    it('should get event metrics with options', async () => {
      mockApiClient.get.mockResolvedValue({ data: {} });

      await eventService.getEventMetrics(clubId, { timeRange: '30d', eventId: 5 });

      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/clubs/1/analytics/metrics?'));
      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('timeRange=30d'));
      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('eventId=5'));
    });

    it('should get event analytics', async () => {
      const analytics = [{ eventId: 1, attendees: 50 }];
      mockApiClient.get.mockResolvedValue({ data: analytics });

      const result = await eventService.getEventAnalytics(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/clubs/1/analytics/events?'));
      expect(result).toEqual(analytics);
    });

    it('should get comparative analysis', async () => {
      const comparison = { currentPeriod: { events: 10 }, previousPeriod: { events: 8 } };
      mockApiClient.get.mockResolvedValue({ data: comparison });

      const result = await eventService.getComparativeAnalysis(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/clubs/1/analytics/comparison?'));
      expect(result).toEqual(comparison);
    });

    it('should get predictive insights', async () => {
      const insights = { predictedAttendance: 100 };
      mockApiClient.get.mockResolvedValue({ data: insights });

      const result = await eventService.getPredictiveInsights(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/clubs/1/analytics/insights?'));
      expect(result).toEqual(insights);
    });

    it('should get performance benchmarks', async () => {
      const benchmarks = [{ metric: 'attendance', value: 75 }];
      mockApiClient.get.mockResolvedValue({ data: benchmarks });

      const result = await eventService.getPerformanceBenchmarks(clubId);

      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/clubs/1/analytics/benchmarks?'));
      expect(result).toEqual(benchmarks);
    });
  });

  describe('Error Handling - All Methods', () => {
    it('should handle errors in getEventsByClub', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(eventService.getEventsByClub(clubId)).rejects.toBeDefined();
    });

    it('should handle errors in getEventById', async () => {
      mockApiClient.get.mockRejectedValue({ response: { status: 404 } });

      await expect(eventService.getEventById(clubId, eventId)).rejects.toBeDefined();
    });

    it('should handle errors in createEvent', async () => {
      mockApiClient.post.mockRejectedValue({ response: { status: 400 } });

      await expect(eventService.createEvent(clubId, {} as any)).rejects.toBeDefined();
    });

    it('should handle errors in updateEvent', async () => {
      mockApiClient.put.mockRejectedValue({ response: { status: 403 } });

      await expect(eventService.updateEvent(clubId, eventId, {} as any)).rejects.toBeDefined();
    });

    it('should handle errors in deleteEvent', async () => {
      mockApiClient.delete.mockRejectedValue({ response: { status: 409 } });

      await expect(eventService.deleteEvent(clubId, eventId)).rejects.toBeDefined();
    });

    it('should handle errors in updateRsvp', async () => {
      mockApiClient.put.mockRejectedValue(new Error('Server error'));

      await expect(eventService.updateRsvp(clubId, eventId, memberId, {} as any)).rejects.toBeDefined();
    });

    it('should handle errors in createEventSeries', async () => {
      mockApiClient.post.mockRejectedValue({ response: { status: 400 } });

      await expect(eventService.createEventSeries(clubId, {} as any)).rejects.toBeDefined();
    });

    it('should handle errors in deleteEventSeries', async () => {
      mockApiClient.delete.mockRejectedValue({ response: { status: 404 } });

      await expect(eventService.deleteEventSeries(clubId, 1)).rejects.toBeDefined();
    });

    it('should handle errors in addToWaitlist', async () => {
      mockApiClient.post.mockRejectedValue({ response: { status: 409 } });

      await expect(eventService.addToWaitlist(clubId, eventId, {} as any)).rejects.toBeDefined();
    });

    it('should handle errors in createMultiSessionEvent', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Validation error'));

      await expect(eventService.createMultiSessionEvent(clubId, {} as any)).rejects.toBeDefined();
    });

    it('should handle errors in generateQRCode', async () => {
      mockApiClient.post.mockRejectedValue({ response: { status: 500 } });

      await expect(eventService.generateQRCode(clubId, eventId, {} as any)).rejects.toBeDefined();
    });

    it('should handle errors in getEventMetrics', async () => {
      mockApiClient.get.mockRejectedValue({ response: { status: 403 } });

      await expect(eventService.getEventMetrics(clubId)).rejects.toBeDefined();
    });
  });
});
