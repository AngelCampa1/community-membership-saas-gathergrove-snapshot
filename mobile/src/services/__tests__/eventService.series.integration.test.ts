/**
 * Event Series Integration Tests
 * Tests for event series functionality including retrieval and bulk registration
 */

import {
  createMockEventSeries,
  createMockEventSeriesEvent,
  createMockBulkRegistrationResult,
} from '../__helpers__/testData';

// Mock the entire eventService module
jest.mock('../eventService', () => {
  const mockEventService = {
    getEventSeries: jest.fn(),
    bulkRegisterForSeries: jest.fn(),
  };
  return {
    EventService: mockEventService,
  };
});

// Import the mocked service
import { EventService } from '../eventService';

const mockEventService = EventService as jest.Mocked<typeof EventService>;

describe('EventService - Event Series Integration Tests', () => {
  const clubId = 1;
  const seriesId = 10;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventSeries', () => {
    it('should retrieve series with all upcoming events', async () => {
      // Arrange
      const mockSeries = createMockEventSeries({
        id: seriesId,
        name: 'Weekly Book Club',
        events: [
          createMockEventSeriesEvent({ id: 1, isUpcoming: true }),
          createMockEventSeriesEvent({ id: 2, isUpcoming: true }),
          createMockEventSeriesEvent({ id: 3, isUpcoming: true }),
        ],
        totalEvents: 52,
        upcomingEvents: 3,
      });
      mockEventService.getEventSeries.mockResolvedValue(mockSeries);

      // Act
      const result = await EventService.getEventSeries(clubId, seriesId);

      // Assert
      expect(result).toEqual(mockSeries);
      expect(result.events).toHaveLength(3);
      expect(result.upcomingEvents).toBe(3);
      expect(mockEventService.getEventSeries).toHaveBeenCalledWith(clubId, seriesId);
    });

    it('should retrieve series with various registration statuses', async () => {
      // Arrange
      const mockSeries = createMockEventSeries({
        events: [
          createMockEventSeriesEvent({ id: 1, registrationStatus: 'open' }),
          createMockEventSeriesEvent({ id: 2, registrationStatus: 'closed' }),
          createMockEventSeriesEvent({ id: 3, registrationStatus: 'full' }),
        ],
      });
      mockEventService.getEventSeries.mockResolvedValue(mockSeries);

      // Act
      const result = await EventService.getEventSeries(clubId, seriesId);

      // Assert
      expect(result.events[0].registrationStatus).toBe('open');
      expect(result.events[1].registrationStatus).toBe('closed');
      expect(result.events[2].registrationStatus).toBe('full');
      expect(mockEventService.getEventSeries).toHaveBeenCalledWith(clubId, seriesId);
    });

    it('should retrieve series with partial past events', async () => {
      // Arrange
      const mockSeries = createMockEventSeries({
        events: [
          createMockEventSeriesEvent({ id: 1, isUpcoming: false }),
          createMockEventSeriesEvent({ id: 2, isUpcoming: true }),
          createMockEventSeriesEvent({ id: 3, isUpcoming: true }),
        ],
        totalEvents: 3,
        upcomingEvents: 2,
      });
      mockEventService.getEventSeries.mockResolvedValue(mockSeries);

      // Act
      const result = await EventService.getEventSeries(clubId, seriesId);

      // Assert
      expect(result.upcomingEvents).toBe(2);
      expect(result.totalEvents).toBe(3);
      expect(mockEventService.getEventSeries).toHaveBeenCalledWith(clubId, seriesId);
    });

    it('should retrieve series with location information', async () => {
      // Arrange
      const mockSeries = createMockEventSeries({
        location: 'Community Center Room 101',
        events: [
          createMockEventSeriesEvent({ location: 'Community Center Room 101' }),
        ],
      });
      mockEventService.getEventSeries.mockResolvedValue(mockSeries);

      // Act
      const result = await EventService.getEventSeries(clubId, seriesId);

      // Assert
      expect(result.location).toBe('Community Center Room 101');
      expect(result.events[0].location).toBe('Community Center Room 101');
      expect(mockEventService.getEventSeries).toHaveBeenCalledWith(clubId, seriesId);
    });

    it('should retrieve series with numeric ID', async () => {
      // Arrange
      const numericSeriesId = 123;
      const mockSeries = createMockEventSeries({ id: numericSeriesId });
      mockEventService.getEventSeries.mockResolvedValue(mockSeries);

      // Act
      const result = await EventService.getEventSeries(clubId, numericSeriesId);

      // Assert
      expect(result.id).toBe(numericSeriesId);
      expect(mockEventService.getEventSeries).toHaveBeenCalledWith(clubId, numericSeriesId);
    });

    it('should retrieve series with string ID', async () => {
      // Arrange
      const stringSeriesId = 'series-abc-123';
      const mockSeries = createMockEventSeries({ id: 1 });
      mockEventService.getEventSeries.mockResolvedValue(mockSeries);

      // Act
      const result = await EventService.getEventSeries(clubId, stringSeriesId as any);

      // Assert
      expect(result).toEqual(mockSeries);
      expect(mockEventService.getEventSeries).toHaveBeenCalledWith(clubId, stringSeriesId);
    });

    it('should handle series does not exist error (404)', async () => {
      // Arrange
      const errorMessage = 'Event series not found';
      mockEventService.getEventSeries.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.getEventSeries(clubId, seriesId)).rejects.toThrow(errorMessage);
    });

    it('should handle unauthorized access error (401)', async () => {
      // Arrange
      const errorMessage = 'Authentication required. Please login again.';
      mockEventService.getEventSeries.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.getEventSeries(clubId, seriesId)).rejects.toThrow(errorMessage);
    });

    it('should handle invalid series ID format error (400)', async () => {
      // Arrange
      const errorMessage = 'Invalid series ID format';
      mockEventService.getEventSeries.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.getEventSeries(clubId, seriesId)).rejects.toThrow(errorMessage);
    });

    it('should handle network error', async () => {
      // Arrange
      const errorMessage = 'Network error. Please check your connection.';
      mockEventService.getEventSeries.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.getEventSeries(clubId, seriesId)).rejects.toThrow(errorMessage);
    });
  });

  describe('bulkRegisterForSeries', () => {
    it('should register for all upcoming events successfully', async () => {
      // Arrange
      const mockResult = createMockBulkRegistrationResult({
        success: true,
        registeredCount: 5,
        failedCount: 0,
        results: [
          { eventId: 1, success: true },
          { eventId: 2, success: true },
          { eventId: 3, success: true },
          { eventId: 4, success: true },
          { eventId: 5, success: true },
        ],
      });
      mockEventService.bulkRegisterForSeries.mockResolvedValue(mockResult);

      // Act
      const result = await EventService.bulkRegisterForSeries(clubId, seriesId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.registeredCount).toBe(5);
      expect(result.failedCount).toBe(0);
      expect(result.results).toHaveLength(5);
      expect(mockEventService.bulkRegisterForSeries).toHaveBeenCalledWith(clubId, seriesId);
    });

    it('should register with explicit member ID', async () => {
      // Arrange
      const memberId = 42;
      const mockResult = createMockBulkRegistrationResult({ success: true });
      mockEventService.bulkRegisterForSeries.mockResolvedValue(mockResult);

      // Act
      const result = await EventService.bulkRegisterForSeries(clubId, seriesId, memberId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockEventService.bulkRegisterForSeries).toHaveBeenCalledWith(
        clubId,
        seriesId,
        memberId
      );
    });

    it('should register without member ID (use authenticated user)', async () => {
      // Arrange
      const mockResult = createMockBulkRegistrationResult({ success: true });
      mockEventService.bulkRegisterForSeries.mockResolvedValue(mockResult);

      // Act
      const result = await EventService.bulkRegisterForSeries(clubId, seriesId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockEventService.bulkRegisterForSeries).toHaveBeenCalledWith(clubId, seriesId);
    });

    it('should handle partial success - some registered, some failed', async () => {
      // Arrange
      const mockResult = createMockBulkRegistrationResult({
        success: false,
        registeredCount: 3,
        failedCount: 2,
        results: [
          { eventId: 1, success: true },
          { eventId: 2, success: true },
          { eventId: 3, success: true },
          { eventId: 4, success: false },
          { eventId: 5, success: false },
        ],
      });
      mockEventService.bulkRegisterForSeries.mockResolvedValue(mockResult);

      // Act
      const result = await EventService.bulkRegisterForSeries(clubId, seriesId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.registeredCount).toBe(3);
      expect(result.failedCount).toBe(2);
      expect(mockEventService.bulkRegisterForSeries).toHaveBeenCalledWith(clubId, seriesId);
    });

    it('should handle series does not exist error (404)', async () => {
      // Arrange
      const errorMessage = 'Event series not found';
      mockEventService.bulkRegisterForSeries.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.bulkRegisterForSeries(clubId, seriesId)).rejects.toThrow(
        errorMessage
      );
    });

    it('should handle no upcoming events to register for error (400)', async () => {
      // Arrange
      const errorMessage = 'No upcoming events available for registration';
      mockEventService.bulkRegisterForSeries.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.bulkRegisterForSeries(clubId, seriesId)).rejects.toThrow(
        errorMessage
      );
    });

    it('should handle already registered for all events error (409)', async () => {
      // Arrange
      const errorMessage = 'You are already registered for all events in this series';
      mockEventService.bulkRegisterForSeries.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.bulkRegisterForSeries(clubId, seriesId)).rejects.toThrow(
        errorMessage
      );
    });

    it('should handle unauthorized access error (401)', async () => {
      // Arrange
      const errorMessage = 'Authentication required. Please login again.';
      mockEventService.bulkRegisterForSeries.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.bulkRegisterForSeries(clubId, seriesId)).rejects.toThrow(
        errorMessage
      );
    });

    it('should handle network error', async () => {
      // Arrange
      const errorMessage = 'Network error. Please check your connection.';
      mockEventService.bulkRegisterForSeries.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.bulkRegisterForSeries(clubId, seriesId)).rejects.toThrow(
        errorMessage
      );
    });

    it('should handle concurrent registration attempts', async () => {
      // Arrange
      const errorMessage = 'Another registration is in progress. Please try again.';
      mockEventService.bulkRegisterForSeries.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.bulkRegisterForSeries(clubId, seriesId)).rejects.toThrow(
        errorMessage
      );
    });
  });
});
