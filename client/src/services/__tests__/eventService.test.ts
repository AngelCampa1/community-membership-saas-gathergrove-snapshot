/**
 * @jest-environment jsdom
 *
 * Event Service Tests
 *
 * Comprehensive test suite for event management operations.
 * Uses apiClient mock pattern - mock only HTTP boundary, test real service logic.
 */

import apiClient from '../apiClient';
import { eventService } from '../eventService';

// Mock apiClient
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

// Mock ErrorHandler
jest.mock('@/lib/errorHandler', () => ({
  ErrorHandler: {
    handleApiError: (error: unknown) => {
      throw error;
    },
  },
}));

describe('EventService', () => {
  const clubId = 1;
  const eventId = 1;
  const memberId = 1;

  // Mock response data
  const mockEvent = {
    id: 1,
    name: 'Test Event',
    clubId: 1,
    eventDateTime: '2024-01-15T18:00:00Z',
    location: 'Test Location',
    description: 'Test description',
  };

  const mockEvents = [mockEvent, { ...mockEvent, id: 2, name: 'Event 2' }];

  const mockRsvp = {
    id: 1,
    eventId: 1,
    memberId: 1,
    status: 'attending',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventsByClub', () => {
    it('should fetch all events for a club', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockEvents });

      const result = await eventService.getEventsByClub(clubId);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Test Event');
      expect(apiClient.get).toHaveBeenCalledWith(`/clubs/${clubId}/events`, { params: undefined });
    });

    it('should fetch upcoming events when filter is specified', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockEvents });

      await eventService.getEventsByClub(clubId, 'upcoming');

      expect(apiClient.get).toHaveBeenCalledWith(`/clubs/${clubId}/events`, { params: { filter: 'upcoming' } });
    });

    it('should fetch past events when filter is specified', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockEvents });

      await eventService.getEventsByClub(clubId, 'past');

      expect(apiClient.get).toHaveBeenCalledWith(`/clubs/${clubId}/events`, { params: { filter: 'past' } });
    });

    it('should throw error on network failure', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(eventService.getEventsByClub(clubId)).rejects.toThrow();
    });
  });

  describe('getEventById', () => {
    it('should fetch a single event by ID', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockEvent });

      const result = await eventService.getEventById(clubId, eventId);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Test Event');
      expect(apiClient.get).toHaveBeenCalledWith(`/clubs/${clubId}/events/${eventId}`);
    });

    it('should throw error when event not found', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Event not found' } },
      });

      await expect(eventService.getEventById(clubId, 999)).rejects.toBeDefined();
    });
  });

  describe('createEvent', () => {
    it('should create a new event', async () => {
      const newEvent = { name: 'New Event', eventDateTime: '2024-02-01T18:00:00Z', location: 'New Location' };
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { id: 3, ...newEvent } });

      const result = await eventService.createEvent(clubId, newEvent as any);

      expect(result.id).toBe(3);
      expect(result.name).toBe('New Event');
      expect(apiClient.post).toHaveBeenCalledWith(`/clubs/${clubId}/events`, newEvent);
    });

    it('should throw error on validation failure', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        response: { status: 400, data: { message: 'Validation error' } },
      });

      await expect(eventService.createEvent(clubId, {} as any)).rejects.toBeDefined();
    });
  });

  describe('updateEvent', () => {
    it('should update an existing event', async () => {
      const updates = { name: 'Updated Event' };
      (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: { ...mockEvent, ...updates } });

      const result = await eventService.updateEvent(clubId, eventId, updates as any);

      expect(result.name).toBe('Updated Event');
      expect(apiClient.put).toHaveBeenCalledWith(`/clubs/${clubId}/events/${eventId}`, updates);
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });

      await eventService.deleteEvent(clubId, eventId);

      expect(apiClient.delete).toHaveBeenCalledWith(`/clubs/${clubId}/events/${eventId}`);
    });
  });

  describe('RSVP Methods', () => {
    describe('updateRsvp', () => {
      it('should update member RSVP', async () => {
        (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: mockRsvp });

        const result = await eventService.updateRsvp(clubId, eventId, memberId, { status: 'attending' });

        expect(result.status).toBe('attending');
        expect(apiClient.put).toHaveBeenCalledWith(
          `/clubs/${clubId}/events/${eventId}/rsvps/${memberId}`,
          { status: 'attending' }
        );
      });
    });

    describe('getEventRsvps', () => {
      it('should fetch all RSVPs for an event', async () => {
        const mockRsvps = [mockRsvp, { ...mockRsvp, id: 2, memberId: 2 }];
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockRsvps });

        const result = await eventService.getEventRsvps(clubId, eventId);

        expect(result).toHaveLength(2);
        expect(apiClient.get).toHaveBeenCalledWith(`/clubs/${clubId}/events/${eventId}/rsvps`);
      });

      it('should handle errors when fetching RSVPs', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.getEventRsvps(clubId, eventId)).rejects.toThrow();
      });
    });

    describe('getMemberRsvp', () => {
      it('should fetch member RSVP', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockRsvp });

        const result = await eventService.getMemberRsvp(clubId, eventId, memberId);

        expect(result?.status).toBe('attending');
      });

      it('should return null when RSVP not found (404)', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce({
          response: { status: 404 },
        });

        const result = await eventService.getMemberRsvp(clubId, eventId, 999);

        expect(result).toBeNull();
      });

      it('should throw error for non-404 errors', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce({
          response: { status: 403, data: { message: 'Forbidden' } },
        });

        await expect(eventService.getMemberRsvp(clubId, eventId, memberId)).rejects.toBeDefined();
      });
    });
  });

  describe('Event Series Methods', () => {
    const mockSeries = { id: 1, clubId: 1, name: 'Weekly Meetup', recurrence: 'weekly' };

    describe('getEventSeries', () => {
      it('should fetch event series for club', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [mockSeries] });

        const result = await eventService.getEventSeries(clubId);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Weekly Meetup');
      });

      it('should handle errors when fetching series', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.getEventSeries(clubId)).rejects.toThrow();
      });
    });

    describe('createEventSeries', () => {
      it('should create event series', async () => {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockSeries });

        const result = await eventService.createEventSeries(clubId, {
          name: 'Weekly Meetup',
          recurrence: 'weekly',
        } as any);

        expect(result.name).toBe('Weekly Meetup');
      });
    });

    describe('deleteEventSeries', () => {
      it('should delete event series', async () => {
        (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });

        await eventService.deleteEventSeries(clubId, 1);

        expect(apiClient.delete).toHaveBeenCalledWith(`/clubs/${clubId}/event-series/1`);
      });
    });
  });

  describe('Waitlist Methods', () => {
    const mockWaitlistEntry = { id: 1, eventId: 1, memberId: 1, position: 1, status: 'waiting' };

    describe('getEventWaitlist', () => {
      it('should fetch waitlist for event', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [mockWaitlistEntry] });

        const result = await eventService.getEventWaitlist(clubId, eventId);

        expect(result).toHaveLength(1);
        expect(result[0].position).toBe(1);
      });

      it('should handle errors when fetching waitlist', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.getEventWaitlist(clubId, eventId)).rejects.toThrow();
      });
    });

    describe('addToWaitlist', () => {
      it('should add member to waitlist', async () => {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockWaitlistEntry });

        const result = await eventService.addToWaitlist(clubId, eventId, { memberId: 1 } as any);

        expect(result.status).toBe('waiting');
      });

      it('should handle errors when adding to waitlist', async () => {
        (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.addToWaitlist(clubId, eventId, { memberId: 1 } as any)).rejects.toThrow();
      });
    });

    describe('removeFromWaitlist', () => {
      it('should remove entry from waitlist', async () => {
        (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });

        await eventService.removeFromWaitlist(clubId, eventId, 1);

        expect(apiClient.delete).toHaveBeenCalledWith(`/clubs/${clubId}/events/${eventId}/waitlist/1`);
      });

      it('should handle errors when removing from waitlist', async () => {
        (apiClient.delete as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.removeFromWaitlist(clubId, eventId, 1)).rejects.toThrow();
      });
    });

    describe('promoteFromWaitlist', () => {
      it('should promote waitlist entry', async () => {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: {} });

        await eventService.promoteFromWaitlist(clubId, eventId, 1);

        expect(apiClient.post).toHaveBeenCalledWith(`/clubs/${clubId}/events/${eventId}/waitlist/1/promote`);
      });

      it('should handle errors when promoting from waitlist', async () => {
        (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.promoteFromWaitlist(clubId, eventId, 1)).rejects.toThrow();
      });
    });

    describe('reorderWaitlist', () => {
      it('should reorder waitlist', async () => {
        (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: {} });

        await eventService.reorderWaitlist(clubId, eventId, [{ entryId: 1, newPosition: 2 }]);

        expect(apiClient.put).toHaveBeenCalledWith(
          `/clubs/${clubId}/events/${eventId}/waitlist/reorder`,
          { entries: [{ entryId: 1, newPosition: 2 }] }
        );
      });

      it('should handle errors when reordering waitlist', async () => {
        (apiClient.put as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.reorderWaitlist(clubId, eventId, [{ entryId: 1, newPosition: 2 }])).rejects.toThrow();
      });
    });

    describe('notifyWaitlist', () => {
      it('should send notifications to waitlist', async () => {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { sent: 5, failed: 0 } });

        const result = await eventService.notifyWaitlist(clubId, eventId, { message: 'Spots available!' } as any);

        expect(result.sent).toBe(5);
        expect(result.failed).toBe(0);
      });

      it('should handle errors when notifying waitlist', async () => {
        (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.notifyWaitlist(clubId, eventId, { message: 'Spots available!' } as any)).rejects.toThrow();
      });
    });
  });

  describe('Multi-Session Event Methods', () => {
    const mockMultiSession = { id: 1, clubId: 1, name: 'Workshop Series', sessions: [] };

    describe('createMultiSessionEvent', () => {
      it('should create multi-session event', async () => {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockMultiSession });

        const result = await eventService.createMultiSessionEvent(clubId, {
          name: 'Workshop Series',
          sessions: [],
        } as any);

        expect(result.name).toBe('Workshop Series');
      });

      it('should handle errors when creating multi-session event', async () => {
        (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.createMultiSessionEvent(clubId, { name: 'Test', sessions: [] } as any)).rejects.toThrow();
      });
    });

    describe('updateMultiSessionEvent', () => {
      it('should update multi-session event', async () => {
        (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: { ...mockMultiSession, name: 'Updated' } });

        const result = await eventService.updateMultiSessionEvent(clubId, eventId, { name: 'Updated' } as any);

        expect(result.name).toBe('Updated');
      });

      it('should handle errors when updating multi-session event', async () => {
        (apiClient.put as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.updateMultiSessionEvent(clubId, eventId, { name: 'Updated' } as any)).rejects.toThrow();
      });
    });

    describe('getMultiSessionEvent', () => {
      it('should fetch multi-session event', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockMultiSession });

        const result = await eventService.getMultiSessionEvent(clubId, eventId);

        expect(result.name).toBe('Workshop Series');
      });

      it('should handle errors when fetching multi-session event', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.getMultiSessionEvent(clubId, eventId)).rejects.toThrow();
      });
    });
  });

  describe('QR Code Methods', () => {
    const mockQRCode = { id: '123', eventId: 1, qrData: 'data', imageUrl: 'url' };

    describe('generateQRCode', () => {
      it('should generate QR code for event', async () => {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockQRCode });

        const result = await eventService.generateQRCode(clubId, eventId, { type: 'check-in' } as any);

        expect(result.id).toBe('123');
      });

      it('should handle errors when generating QR code', async () => {
        (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.generateQRCode(clubId, eventId, { type: 'check-in' } as any)).rejects.toThrow();
      });
    });

    describe('generateBulkQRCodes', () => {
      it('should generate multiple QR codes', async () => {
        const mockQRCodes = [mockQRCode, { ...mockQRCode, id: '456' }];
        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockQRCodes });

        const result = await eventService.generateBulkQRCodes(clubId, { eventIds: [1, 2] } as any);

        expect(result).toHaveLength(2);
      });

      it('should handle errors when generating bulk QR codes', async () => {
        (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.generateBulkQRCodes(clubId, { eventIds: [1, 2] } as any)).rejects.toThrow();
      });
    });

    describe('getQRCodeAnalytics', () => {
      it('should fetch QR code analytics', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { totalScans: 100, uniqueScans: 80 } });

        const result = await eventService.getQRCodeAnalytics(clubId, eventId);

        expect(result.totalScans).toBe(100);
        expect(result.uniqueScans).toBe(80);
      });

      it('should handle errors when fetching QR code analytics', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.getQRCodeAnalytics(clubId, eventId)).rejects.toThrow();
      });
    });

    describe('getQRCodeHistory', () => {
      it('should fetch QR code scan history', async () => {
        const mockHistory = [{ id: '1', scannedAt: '2024-01-01T00:00:00Z', action: 'check-in' }];
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockHistory });

        const result = await eventService.getQRCodeHistory(clubId, eventId);

        expect(result).toHaveLength(1);
      });

      it('should handle errors when fetching QR code history', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.getQRCodeHistory(clubId, eventId)).rejects.toThrow();
      });
    });
  });

  describe('Analytics Methods', () => {
    describe('getEventMetrics', () => {
      it('should fetch event metrics', async () => {
        const mockMetrics = { totalEvents: 10, totalAttendees: 500, averageAttendance: 50 };
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockMetrics });

        const result = await eventService.getEventMetrics(clubId);

        expect(result.totalEvents).toBe(10);
      });

      it('should include options in query', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: {} });

        await eventService.getEventMetrics(clubId, { timeRange: '30d', eventId: 1 });

        expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('timeRange=30d'));
        expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('eventId=1'));
      });

      it('should handle undefined options', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: {} });

        await eventService.getEventMetrics(clubId, undefined);

        expect(apiClient.get).toHaveBeenCalled();
      });

      it('should handle partial options with only timeRange', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: {} });

        await eventService.getEventMetrics(clubId, { timeRange: '7d' });

        expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('timeRange=7d'));
      });

      it('should handle partial options with only eventId', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: {} });

        await eventService.getEventMetrics(clubId, { eventId: 5 });

        expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('eventId=5'));
      });

      it('should handle errors when fetching metrics', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.getEventMetrics(clubId)).rejects.toThrow();
      });
    });

    describe('getEventAnalytics', () => {
      it('should fetch event analytics', async () => {
        const mockAnalytics = [{ eventId: 1, attendees: 50, engagement: 0.8 }];
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockAnalytics });

        const result = await eventService.getEventAnalytics(clubId);

        expect(result).toHaveLength(1);
      });

      it('should include options in query', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });

        await eventService.getEventAnalytics(clubId, { timeRange: '30d', eventId: 2 });

        expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('timeRange=30d'));
        expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('eventId=2'));
      });

      it('should handle partial options with only timeRange', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });

        await eventService.getEventAnalytics(clubId, { timeRange: '7d' });

        expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('timeRange=7d'));
      });

      it('should handle partial options with only eventId', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });

        await eventService.getEventAnalytics(clubId, { eventId: 3 });

        expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('eventId=3'));
      });

      it('should handle errors when fetching analytics', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.getEventAnalytics(clubId)).rejects.toThrow();
      });
    });

    describe('getComparativeAnalysis', () => {
      it('should fetch comparative analysis', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { comparison: [] } });

        const result = await eventService.getComparativeAnalysis(clubId);

        expect(result).toBeDefined();
      });

      it('should include timeRange in query when provided', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: {} });

        await eventService.getComparativeAnalysis(clubId, { timeRange: '90d' });

        expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('timeRange=90d'));
      });

      it('should handle errors when fetching comparative analysis', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.getComparativeAnalysis(clubId)).rejects.toThrow();
      });
    });

    describe('getPredictiveInsights', () => {
      it('should fetch predictive insights', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { predictions: [] } });

        const result = await eventService.getPredictiveInsights(clubId);

        expect(result).toBeDefined();
      });

      it('should include eventId in query when provided', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: {} });

        await eventService.getPredictiveInsights(clubId, { eventId: 5 });

        expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('eventId=5'));
      });

      it('should handle errors when fetching predictive insights', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.getPredictiveInsights(clubId)).rejects.toThrow();
      });
    });

    describe('getPerformanceBenchmarks', () => {
      it('should fetch performance benchmarks', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [{ metric: 'attendance', value: 50 }] });

        const result = await eventService.getPerformanceBenchmarks(clubId);

        expect(result).toHaveLength(1);
      });

      it('should include timeRange in query when provided', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [] });

        await eventService.getPerformanceBenchmarks(clubId, { timeRange: '60d' });

        expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('timeRange=60d'));
      });

      it('should handle errors when fetching benchmarks', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.getPerformanceBenchmarks(clubId)).rejects.toThrow();
      });
    });

    describe('exportAnalyticsReport', () => {
      it('should export analytics report as blob', async () => {
        const mockBlob = new Blob(['report data'], { type: 'application/pdf' });
        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockBlob });

        const result = await eventService.exportAnalyticsReport(clubId, { format: 'pdf' } as any);

        expect(result).toBeInstanceOf(Blob);
        expect(apiClient.post).toHaveBeenCalledWith(
          `/clubs/${clubId}/analytics/export`,
          { format: 'pdf' },
          { responseType: 'blob' }
        );
      });

      it('should handle errors when exporting report', async () => {
        (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.exportAnalyticsReport(clubId, { format: 'pdf' } as any)).rejects.toThrow();
      });
    });
  });

  describe('Feedback Methods', () => {
    const surveyId = 'survey-1';
    const mockSurvey = { id: surveyId, eventId: 1, title: 'Event Feedback', questions: [] };

    describe('getFeedbackSurveys', () => {
      it('should fetch feedback surveys', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [mockSurvey] });

        const result = await eventService.getFeedbackSurveys(clubId, eventId);

        expect(result).toHaveLength(1);
      });

      it('should handle errors when fetching surveys', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.getFeedbackSurveys(clubId, eventId)).rejects.toThrow();
      });
    });

    describe('createFeedbackSurvey', () => {
      it('should create feedback survey', async () => {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockSurvey });

        const result = await eventService.createFeedbackSurvey(clubId, eventId, {
          title: 'Event Feedback',
          questions: [],
        } as any);

        expect(result.title).toBe('Event Feedback');
      });

      it('should handle errors when creating survey', async () => {
        (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.createFeedbackSurvey(clubId, eventId, { title: 'Test', questions: [] } as any)).rejects.toThrow();
      });
    });

    describe('updateFeedbackSurvey', () => {
      it('should update feedback survey', async () => {
        (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: { ...mockSurvey, title: 'Updated' } });

        const result = await eventService.updateFeedbackSurvey(clubId, eventId, surveyId, { title: 'Updated' } as any);

        expect(result.title).toBe('Updated');
      });

      it('should handle errors when updating survey', async () => {
        (apiClient.put as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.updateFeedbackSurvey(clubId, eventId, surveyId, { title: 'Updated' } as any)).rejects.toThrow();
      });
    });

    describe('deleteFeedbackSurvey', () => {
      it('should delete feedback survey', async () => {
        (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });

        await eventService.deleteFeedbackSurvey(clubId, eventId, surveyId);

        expect(apiClient.delete).toHaveBeenCalled();
      });

      it('should handle errors when deleting survey', async () => {
        (apiClient.delete as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.deleteFeedbackSurvey(clubId, eventId, surveyId)).rejects.toThrow();
      });
    });

    describe('getFeedbackResponses', () => {
      it('should fetch feedback responses', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [{ id: '1', answers: [] }] });

        const result = await eventService.getFeedbackResponses(clubId, eventId, surveyId);

        expect(result).toHaveLength(1);
      });

      it('should handle errors when fetching responses', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.getFeedbackResponses(clubId, eventId, surveyId)).rejects.toThrow();
      });
    });

    describe('submitFeedbackResponse', () => {
      it('should submit feedback response', async () => {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { id: '1', answers: [] } });

        const result = await eventService.submitFeedbackResponse(clubId, eventId, surveyId, { answers: [] } as any);

        expect(result.id).toBe('1');
      });

      it('should handle errors when submitting response', async () => {
        (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.submitFeedbackResponse(clubId, eventId, surveyId, { answers: [] } as any)).rejects.toThrow();
      });
    });

    describe('getFeedbackAnalytics', () => {
      it('should fetch feedback analytics', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { responseRate: 0.75 } });

        const result = await eventService.getFeedbackAnalytics(clubId, eventId, surveyId);

        expect(result.responseRate).toBe(0.75);
      });

      it('should handle errors when fetching feedback analytics', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.getFeedbackAnalytics(clubId, eventId, surveyId)).rejects.toThrow();
      });
    });

    describe('exportFeedbackData', () => {
      it('should export feedback data as blob', async () => {
        const mockBlob = new Blob(['csv data']);
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBlob });

        const result = await eventService.exportFeedbackData(clubId, eventId, surveyId, 'csv');

        expect(result).toBeInstanceOf(Blob);
      });

      it('should handle errors when exporting feedback data', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.exportFeedbackData(clubId, eventId, surveyId, 'csv')).rejects.toThrow();
      });
    });

    describe('sendFeedbackInvitations', () => {
      it('should send feedback invitations', async () => {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { sent: 10, failed: 1 } });

        const result = await eventService.sendFeedbackInvitations(clubId, eventId, surveyId, { recipients: [] } as any);

        expect(result.sent).toBe(10);
      });

      it('should handle errors when sending invitations', async () => {
        (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.sendFeedbackInvitations(clubId, eventId, surveyId, { recipients: [] } as any)).rejects.toThrow();
      });
    });

    describe('getFeedbackTemplates', () => {
      it('should fetch feedback templates', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [{ id: '1', name: 'Default' }] });

        const result = await eventService.getFeedbackTemplates(clubId);

        expect(result).toHaveLength(1);
      });

      it('should handle errors when fetching templates', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.getFeedbackTemplates(clubId)).rejects.toThrow();
      });
    });
  });

  describe('Legacy QR Code Methods', () => {
    const qrCodeId = '123';

    describe('getEventQRCodes', () => {
      it('should fetch QR codes for event', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: [{ id: '1', qrData: 'data' }] });

        const result = await eventService.getEventQRCodes(eventId);

        expect(result).toHaveLength(1);
      });

      it('should handle errors when fetching QR codes', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.getEventQRCodes(eventId)).rejects.toThrow();
      });
    });

    describe('generateEventQRCode', () => {
      it('should generate QR code', async () => {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { id: '1', qrData: 'data' } });

        const result = await eventService.generateEventQRCode(eventId, { type: 'check-in' } as any);

        expect(result.id).toBe('1');
      });

      it('should handle errors when generating QR code', async () => {
        (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.generateEventQRCode(eventId, { type: 'check-in' } as any)).rejects.toThrow();
      });
    });

    describe('downloadQRCode', () => {
      it('should download QR code as blob', async () => {
        const mockBlob = new Blob(['image data']);
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockBlob });

        const result = await eventService.downloadQRCode(qrCodeId, 'png');

        expect(result).toBeInstanceOf(Blob);
      });

      it('should handle errors when downloading QR code', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.downloadQRCode(qrCodeId, 'png')).rejects.toThrow();
      });
    });

    describe('getQRCodeShareUrl', () => {
      it('should get share URL', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { url: 'https://share.example.com' } });

        const result = await eventService.getQRCodeShareUrl(qrCodeId);

        expect(result).toBe('https://share.example.com');
      });

      it('should handle errors when getting share URL', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.getQRCodeShareUrl(qrCodeId)).rejects.toThrow();
      });
    });

    describe('updateQRCodeStatus', () => {
      it('should update QR code status', async () => {
        (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: { id: qrCodeId, isActive: false } });

        const result = await eventService.updateQRCodeStatus(qrCodeId, false);

        expect(result.isActive).toBe(false);
      });

      it('should handle errors when updating QR code status', async () => {
        (apiClient.put as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.updateQRCodeStatus(qrCodeId, false)).rejects.toThrow();
      });
    });

    describe('deleteQRCode', () => {
      it('should delete QR code', async () => {
        (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });

        await eventService.deleteQRCode(qrCodeId);

        expect(apiClient.delete).toHaveBeenCalled();
      });

      it('should handle errors when deleting QR code', async () => {
        (apiClient.delete as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.deleteQRCode(qrCodeId)).rejects.toThrow();
      });
    });

    describe('bulkDownloadQRCodes', () => {
      it('should bulk download QR codes', async () => {
        const mockBlob = new Blob(['zip data']);
        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockBlob });

        const result = await eventService.bulkDownloadQRCodes(['1', '2']);

        expect(result).toBeInstanceOf(Blob);
      });

      it('should handle errors when bulk downloading QR codes', async () => {
        (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.bulkDownloadQRCodes(['1', '2'])).rejects.toThrow();
      });
    });

    describe('validateQRCheckIn', () => {
      it('should validate QR check-in', async () => {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { valid: true, message: 'Success', attendee: { id: 1, name: 'John' } },
        });

        const result = await eventService.validateQRCheckIn(eventId, 'qr-data');

        expect(result.valid).toBe(true);
      });

      it('should handle errors when validating QR check-in', async () => {
        (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.validateQRCheckIn(eventId, 'qr-data')).rejects.toThrow();
      });
    });

    describe('processQRAction', () => {
      it('should process QR action', async () => {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { success: true, message: 'Processed' },
        });

        const result = await eventService.processQRAction(eventId, 'check-in', { memberId: 1 });

        expect(result.success).toBe(true);
      });

      it('should handle errors when processing QR action', async () => {
        (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.processQRAction(eventId, 'check-in', { memberId: 1 })).rejects.toThrow();
      });
    });
  });

  describe('sendEventInvitations', () => {
    it('should send event invitations', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { sent: 50, failed: 2 } });

      const result = await eventService.sendEventInvitations(clubId, eventId, { memberIds: [1, 2, 3] } as any);

      expect(result.sent).toBe(50);
      expect(result.failed).toBe(2);
    });

    it('should handle errors when sending invitations', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(eventService.sendEventInvitations(clubId, eventId, { memberIds: [1, 2, 3] } as any)).rejects.toThrow();
    });
  });

  describe('Payment Link Methods', () => {
    describe('generatePaymentLink', () => {
      it('should generate payment link for event', async () => {
        const mockResponse = { paymentUrl: 'https://pay.example.com/abc123', token: 'abc123' };
        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

        const result = await eventService.generatePaymentLink(clubId, eventId);

        expect(result.paymentUrl).toBe('https://pay.example.com/abc123');
        expect(apiClient.post).toHaveBeenCalledWith(`/clubs/${clubId}/events/${eventId}/payment-link`);
      });

      it('should handle errors when generating payment link', async () => {
        (apiClient.post as jest.Mock).mockRejectedValueOnce({
          response: { status: 400, data: { message: 'Event must have pricing configured' } },
        });

        await expect(eventService.generatePaymentLink(clubId, eventId)).rejects.toBeDefined();
      });
    });

    describe('getPublicEventByToken', () => {
      it('should fetch public event by token', async () => {
        const mockEvent = { id: 1, name: 'Public Event', price: 25 };
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockEvent });

        const result = await eventService.getPublicEventByToken('token123');

        expect(result.name).toBe('Public Event');
        expect(apiClient.get).toHaveBeenCalledWith('/events/public/token123');
      });

      it('should handle errors when fetching public event', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce({
          response: { status: 404, data: { message: 'Event not found' } },
        });

        await expect(eventService.getPublicEventByToken('invalid')).rejects.toBeDefined();
      });
    });

    describe('payForEventAsGuest', () => {
      it('should process guest payment', async () => {
        const mockResponse = { success: true, confirmationNumber: 'CONF-123' };
        (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

        const request = { eventId: 1, email: 'guest@example.com', paymentMethodId: 'pm_123' };
        const result = await eventService.payForEventAsGuest(request as any);

        expect(result.success).toBe(true);
        expect(apiClient.post).toHaveBeenCalledWith('/public/events/pay', request);
      });

      it('should handle errors when processing guest payment', async () => {
        (apiClient.post as jest.Mock).mockRejectedValueOnce({
          response: { status: 402, data: { message: 'Payment failed' } },
        });

        await expect(eventService.payForEventAsGuest({ eventId: 1 } as any)).rejects.toBeDefined();
      });
    });

    describe('getAvailableMembershipTypes', () => {
      it('should fetch membership types for event', async () => {
        const mockTypes = [{ id: 1, name: 'Standard', price: 50 }];
        (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockTypes });

        const result = await eventService.getAvailableMembershipTypes(eventId);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Standard');
      });

      it('should handle errors when fetching membership types', async () => {
        (apiClient.get as jest.Mock).mockRejectedValueOnce({
          response: { status: 404, data: { message: 'Event not found' } },
        });

        await expect(eventService.getAvailableMembershipTypes(eventId)).rejects.toBeDefined();
      });
    });
  });

  describe('Additional error handling tests', () => {
    describe('createEventSeries', () => {
      it('should handle errors when creating series', async () => {
        (apiClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.createEventSeries(clubId, { name: 'Test', recurrence: 'weekly' } as any)).rejects.toThrow();
      });
    });

    describe('deleteEventSeries', () => {
      it('should handle errors when deleting series', async () => {
        (apiClient.delete as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.deleteEventSeries(clubId, 1)).rejects.toThrow();
      });
    });

    describe('updateRsvp', () => {
      it('should handle errors when updating RSVP', async () => {
        (apiClient.put as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        await expect(eventService.updateRsvp(clubId, eventId, memberId, { status: 'attending' })).rejects.toThrow();
      });
    });
  });
});
