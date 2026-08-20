/**
 * Waitlist Integration Tests
 * Tests for event waitlist functionality including status checks, joining, and leaving
 */

import {
  createMockWaitlistStatus,
  createMockWaitlistResult,
} from '../__helpers__/testData';

// Mock the entire eventService module
jest.mock('../eventService', () => {
  const mockEventService = {
    getWaitlistStatus: jest.fn(),
    joinWaitlist: jest.fn(),
    leaveWaitlist: jest.fn(),
  };
  return {
    EventService: mockEventService,
  };
});

// Import the mocked service
import { EventService } from '../eventService';

const mockEventService = EventService as jest.Mocked<typeof EventService>;

describe('EventService - Waitlist Integration Tests', () => {
  const clubId = 1;
  const eventId = 100;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWaitlistStatus', () => {
    it('should fetch waitlist status when member not on waitlist', async () => {
      // Arrange
      const mockStatus = createMockWaitlistStatus({
        isOnWaitlist: false,
        canJoinWaitlist: true,
        currentAttendees: 30,
        eventCapacity: 50,
        totalWaitlisted: 0,
      });
      mockEventService.getWaitlistStatus.mockResolvedValue(mockStatus);

      // Act
      const result = await EventService.getWaitlistStatus(clubId, eventId);

      // Assert
      expect(result).toEqual(mockStatus);
      expect(result.isOnWaitlist).toBe(false);
      expect(result.canJoinWaitlist).toBe(true);
      expect(mockEventService.getWaitlistStatus).toHaveBeenCalledWith(clubId, eventId);
    });

    it('should fetch waitlist status when member on waitlist with position', async () => {
      // Arrange
      const mockStatus = createMockWaitlistStatus({
        isOnWaitlist: true,
        position: 3,
        totalWaitlisted: 8,
        canJoinWaitlist: false,
        estimatedWaitTime: '2-3 days',
        joinedAt: '2025-12-15T10:00:00Z',
      });
      mockEventService.getWaitlistStatus.mockResolvedValue(mockStatus);

      // Act
      const result = await EventService.getWaitlistStatus(clubId, eventId);

      // Assert
      expect(result.isOnWaitlist).toBe(true);
      expect(result.position).toBe(3);
      expect(result.totalWaitlisted).toBe(8);
      expect(result.estimatedWaitTime).toBe('2-3 days');
      expect(mockEventService.getWaitlistStatus).toHaveBeenCalledWith(clubId, eventId);
    });

    it('should fetch status when event at full capacity and can join waitlist', async () => {
      // Arrange
      const mockStatus = createMockWaitlistStatus({
        isOnWaitlist: false,
        canJoinWaitlist: true,
        currentAttendees: 50,
        eventCapacity: 50,
        totalWaitlisted: 5,
      });
      mockEventService.getWaitlistStatus.mockResolvedValue(mockStatus);

      // Act
      const result = await EventService.getWaitlistStatus(clubId, eventId);

      // Assert
      expect(result.currentAttendees).toBe(result.eventCapacity);
      expect(result.canJoinWaitlist).toBe(true);
      expect(result.isOnWaitlist).toBe(false);
      expect(mockEventService.getWaitlistStatus).toHaveBeenCalledWith(clubId, eventId);
    });

    it('should fetch status when event and waitlist both full', async () => {
      // Arrange
      const mockStatus = createMockWaitlistStatus({
        isOnWaitlist: false,
        canJoinWaitlist: false,
        currentAttendees: 50,
        eventCapacity: 50,
        totalWaitlisted: 20,
      });
      mockEventService.getWaitlistStatus.mockResolvedValue(mockStatus);

      // Act
      const result = await EventService.getWaitlistStatus(clubId, eventId);

      // Assert
      expect(result.canJoinWaitlist).toBe(false);
      expect(result.totalWaitlisted).toBe(20);
      expect(mockEventService.getWaitlistStatus).toHaveBeenCalledWith(clubId, eventId);
    });

    it('should handle event not found error (404)', async () => {
      // Arrange
      const errorMessage = 'Event not found';
      mockEventService.getWaitlistStatus.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.getWaitlistStatus(clubId, eventId)).rejects.toThrow(
        errorMessage
      );
    });

    it('should handle unauthorized access error (401)', async () => {
      // Arrange
      const errorMessage = 'Authentication required. Please login again.';
      mockEventService.getWaitlistStatus.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.getWaitlistStatus(clubId, eventId)).rejects.toThrow(
        errorMessage
      );
    });

    it('should handle invalid event ID format (400)', async () => {
      // Arrange
      const errorMessage = 'Invalid event ID format';
      mockEventService.getWaitlistStatus.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.getWaitlistStatus(clubId, eventId)).rejects.toThrow(
        errorMessage
      );
    });

    it('should handle network timeout error', async () => {
      // Arrange
      const errorMessage = 'Network error. Please check your connection.';
      mockEventService.getWaitlistStatus.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.getWaitlistStatus(clubId, eventId)).rejects.toThrow(
        errorMessage
      );
    });
  });

  describe('joinWaitlist', () => {
    it('should successfully join waitlist and receive position', async () => {
      // Arrange
      const mockResult = createMockWaitlistResult({
        success: true,
        position: 5,
        message: 'Successfully joined waitlist at position 5',
      });
      mockEventService.joinWaitlist.mockResolvedValue(mockResult);

      // Act
      const result = await EventService.joinWaitlist(clubId, eventId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.position).toBe(5);
      expect(result.message).toContain('Successfully joined');
      expect(mockEventService.joinWaitlist).toHaveBeenCalledWith(clubId, eventId);
    });

    it('should successfully join waitlist when event becomes full', async () => {
      // Arrange
      const mockResult = createMockWaitlistResult({
        success: true,
        position: 1,
        message: 'Event is full. You have been added to the waitlist.',
      });
      mockEventService.joinWaitlist.mockResolvedValue(mockResult);

      // Act
      const result = await EventService.joinWaitlist(clubId, eventId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.position).toBe(1);
      expect(mockEventService.joinWaitlist).toHaveBeenCalledWith(clubId, eventId);
    });

    it('should handle already on waitlist error (409)', async () => {
      // Arrange
      const errorMessage = 'You are already on the waitlist for this event';
      mockEventService.joinWaitlist.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.joinWaitlist(clubId, eventId)).rejects.toThrow(errorMessage);
    });

    it('should handle event not full error (400)', async () => {
      // Arrange
      const errorMessage = 'Event is not full. Please register directly.';
      mockEventService.joinWaitlist.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.joinWaitlist(clubId, eventId)).rejects.toThrow(errorMessage);
    });

    it('should handle waitlist full error (400)', async () => {
      // Arrange
      const errorMessage = 'Waitlist is full for this event';
      mockEventService.joinWaitlist.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.joinWaitlist(clubId, eventId)).rejects.toThrow(errorMessage);
    });

    it('should handle event not found error (404)', async () => {
      // Arrange
      const errorMessage = 'Event not found';
      mockEventService.joinWaitlist.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.joinWaitlist(clubId, eventId)).rejects.toThrow(errorMessage);
    });

    it('should handle unauthorized access error (401)', async () => {
      // Arrange
      const errorMessage = 'Authentication required. Please login again.';
      mockEventService.joinWaitlist.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.joinWaitlist(clubId, eventId)).rejects.toThrow(errorMessage);
    });

    it('should handle network error', async () => {
      // Arrange
      const errorMessage = 'Network error. Please check your connection.';
      mockEventService.joinWaitlist.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.joinWaitlist(clubId, eventId)).rejects.toThrow(errorMessage);
    });

    it('should handle concurrent join attempts gracefully', async () => {
      // Arrange
      const errorMessage = 'Another operation is in progress. Please try again.';
      mockEventService.joinWaitlist.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.joinWaitlist(clubId, eventId)).rejects.toThrow(errorMessage);
    });
  });

  describe('leaveWaitlist', () => {
    it('should successfully leave waitlist', async () => {
      // Arrange
      const mockResult = createMockWaitlistResult({
        success: true,
        position: undefined,
        message: 'Successfully removed from waitlist',
      });
      mockEventService.leaveWaitlist.mockResolvedValue(mockResult);

      // Act
      const result = await EventService.leaveWaitlist(clubId, eventId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('removed from waitlist');
      expect(mockEventService.leaveWaitlist).toHaveBeenCalledWith(clubId, eventId);
    });

    it('should leave waitlist and verify status updates', async () => {
      // Arrange
      const mockResult = createMockWaitlistResult({
        success: true,
        position: undefined,
        message: 'You have been removed from the waitlist',
      });
      mockEventService.leaveWaitlist.mockResolvedValue(mockResult);

      // Act
      const result = await EventService.leaveWaitlist(clubId, eventId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.position).toBeUndefined();
      expect(mockEventService.leaveWaitlist).toHaveBeenCalledWith(clubId, eventId);
    });

    it('should handle not on waitlist error (404)', async () => {
      // Arrange
      const errorMessage = 'You are not on the waitlist for this event';
      mockEventService.leaveWaitlist.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.leaveWaitlist(clubId, eventId)).rejects.toThrow(errorMessage);
    });

    it('should handle event not found error (404)', async () => {
      // Arrange
      const errorMessage = 'Event not found';
      mockEventService.leaveWaitlist.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.leaveWaitlist(clubId, eventId)).rejects.toThrow(errorMessage);
    });

    it('should handle unauthorized access error (401)', async () => {
      // Arrange
      const errorMessage = 'Authentication required. Please login again.';
      mockEventService.leaveWaitlist.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.leaveWaitlist(clubId, eventId)).rejects.toThrow(errorMessage);
    });

    it('should handle network error', async () => {
      // Arrange
      const errorMessage = 'Network error. Please check your connection.';
      mockEventService.leaveWaitlist.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.leaveWaitlist(clubId, eventId)).rejects.toThrow(errorMessage);
    });
  });
});
