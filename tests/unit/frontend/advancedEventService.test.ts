/**
 * TDD Tests for Advanced Event Service - US-009 Advanced Event Management
 * RED PHASE: Comprehensive test specifications for frontend event management
 * Tests cover recurring events, waitlists, QR codes, and real-time updates
 */

import { jest } from '@jest/globals';
import axios from 'axios';
import { advancedEventService } from '../../../mobile/src/services/advancedEventService';
import { authService } from '../../../mobile/src/services/authService';
import { ErrorHandler } from '../../../mobile/src/utils/errorHandler';
import {
  RecurrencePatternRequest,
  RecurringEventGenerationResult,
  WaitlistJoinRequest,
  WaitlistStatusResponse,
  QRCodeGenerationRequest,
  QRCodeValidationRequest,
  EventSeriesRequest,
  EventSeriesResponse
} from '../../../mobile/src/types/advanced-events';

// Mock dependencies
jest.mock('axios');
jest.mock('../../../mobile/src/services/authService');
jest.mock('../../../mobile/src/utils/errorHandler');

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockErrorHandler = ErrorHandler as jest.Mocked<typeof ErrorHandler>;

describe('AdvancedEventService - US-009 Features', () => {
  const clubId = 1;
  const eventId = 1;
  const memberId = 1;
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default auth mock
    mockAuthService.getStoredToken.mockResolvedValue(mockToken);
    
    // Setup axios instance mock
    mockAxios.create.mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    } as any);
  });

  describe('Recurring Event Generation', () => {
    const mockRecurrencePattern: RecurrencePatternRequest = {
      type: 'daily',
      interval: 1,
      startDate: '2024-01-01T10:00:00Z',
      endDate: '2024-01-07T10:00:00Z',
      count: null,
      weeklyDays: null,
      monthlyType: null
    };

    const mockBaseEvent = {
      name: 'Daily Standup',
      location: 'Conference Room A',
      description: 'Daily team meeting',
      eventDateTime: '2024-01-01T10:00:00Z',
      maxCapacity: 20
    };

    it('should generate daily recurring events successfully', async () => {
      // Arrange
      const expectedResponse: RecurringEventGenerationResult = {
        events: [
          {
            id: 1,
            clubId,
            name: 'Daily Standup',
            eventDateTime: '2024-01-01T10:00:00Z',
            location: 'Conference Room A',
            description: 'Daily team meeting',
            createdAt: '2024-01-01T09:00:00Z',
            updatedAt: '2024-01-01T09:00:00Z'
          },
          {
            id: 2,
            clubId,
            name: 'Daily Standup',
            eventDateTime: '2024-01-02T10:00:00Z',
            location: 'Conference Room A',
            description: 'Daily team meeting',
            createdAt: '2024-01-01T09:00:00Z',
            updatedAt: '2024-01-01T09:00:00Z'
          }
        ],
        totalGenerated: 2,
        seriesId: 'series-123',
        pattern: mockRecurrencePattern
      };

      const axiosInstance = {
        post: jest.fn().mockResolvedValue({ data: expectedResponse })
      } as any;
      mockAxios.create.mockReturnValue(axiosInstance);

      // Act
      const result = await advancedEventService.generateRecurringEvents(
        clubId,
        mockBaseEvent,
        mockRecurrencePattern
      );

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(axiosInstance.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/events/recurring`,
        {
          baseEvent: mockBaseEvent,
          recurrencePattern: mockRecurrencePattern
        }
      );
    });

    it('should handle invalid recurrence pattern', async () => {
      // Arrange
      const invalidPattern = {
        ...mockRecurrencePattern,
        interval: 0 // Invalid interval
      };

      const axiosInstance = {
        post: jest.fn().mockRejectedValue({
          response: {
            status: 400,
            data: { message: 'Invalid recurrence pattern: Interval must be greater than 0' }
          }
        })
      } as any;
      mockAxios.create.mockReturnValue(axiosInstance);

      mockErrorHandler.handleEventError.mockReturnValue({
        message: 'Invalid recurrence pattern: Interval must be greater than 0',
        code: 'INVALID_RECURRENCE_PATTERN'
      } as any);

      // Act & Assert
      await expect(
        advancedEventService.generateRecurringEvents(
          clubId,
          mockBaseEvent,
          invalidPattern
        )
      ).rejects.toThrow('Invalid recurrence pattern: Interval must be greater than 0');
    });

    it('should validate recurrence pattern locally before API call', () => {
      // Arrange
      const invalidPatterns = [
        { ...mockRecurrencePattern, type: null },
        { ...mockRecurrencePattern, interval: -1 },
        { ...mockRecurrencePattern, startDate: null },
        { ...mockRecurrencePattern, endDate: '2023-12-31T10:00:00Z' } // End before start
      ];

      // Act & Assert
      invalidPatterns.forEach(pattern => {
        expect(() => 
          advancedEventService.validateRecurrencePattern(pattern as any)
        ).toThrow();
      });
    });

    it('should generate weekly recurring events with specific days', async () => {
      // Arrange
      const weeklyPattern: RecurrencePatternRequest = {
        type: 'weekly',
        interval: 1,
        startDate: '2024-01-01T19:00:00Z',
        endDate: '2024-01-15T19:00:00Z',
        weeklyDays: ['monday', 'wednesday', 'friday']
      };

      const expectedResponse: RecurringEventGenerationResult = {
        events: [], // Would contain MWF events
        totalGenerated: 6,
        seriesId: 'weekly-series-456',
        pattern: weeklyPattern
      };

      const axiosInstance = {
        post: jest.fn().mockResolvedValue({ data: expectedResponse })
      } as any;
      mockAxios.create.mockReturnValue(axiosInstance);

      // Act
      const result = await advancedEventService.generateRecurringEvents(
        clubId,
        mockBaseEvent,
        weeklyPattern
      );

      // Assert
      expect(result.totalGenerated).toBe(6);
      expect(result.pattern.weeklyDays).toEqual(['monday', 'wednesday', 'friday']);
    });
  });

  describe('Waitlist Management', () => {
    it('should join waitlist successfully when event is full', async () => {
      // Arrange
      const waitlistRequest: WaitlistJoinRequest = {
        memberId,
        priority: 'standard',
        notificationPreferences: {
          email: true,
          push: true,
          sms: false
        }
      };

      const expectedResponse: WaitlistStatusResponse = {
        id: 1,
        eventId,
        memberId,
        position: 1,
        priority: 'standard',
        status: 'active',
        addedAt: '2024-01-01T10:00:00Z',
        estimatedPromotionTime: null,
        totalWaitlistSize: 1
      };

      const axiosInstance = {
        post: jest.fn().mockResolvedValue({ data: expectedResponse })
      } as any;
      mockAxios.create.mockReturnValue(axiosInstance);

      // Act
      const result = await advancedEventService.joinWaitlist(
        clubId,
        eventId,
        waitlistRequest
      );

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(axiosInstance.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/events/${eventId}/waitlist`,
        waitlistRequest
      );
    });

    it('should get current waitlist position', async () => {
      // Arrange
      const expectedResponse: WaitlistStatusResponse = {
        id: 1,
        eventId,
        memberId,
        position: 3,
        priority: 'standard',
        status: 'active',
        addedAt: '2024-01-01T10:00:00Z',
        estimatedPromotionTime: '2024-01-01T14:30:00Z',
        totalWaitlistSize: 8
      };

      const axiosInstance = {
        get: jest.fn().mockResolvedValue({ data: expectedResponse })
      } as any;
      mockAxios.create.mockReturnValue(axiosInstance);

      // Act
      const result = await advancedEventService.getWaitlistStatus(
        clubId,
        eventId,
        memberId
      );

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(result.position).toBe(3);
      expect(result.totalWaitlistSize).toBe(8);
    });

    it('should handle waitlist promotion notification', async () => {
      // Arrange
      const promotionData = {
        eventId,
        memberId,
        newRsvpStatus: 'attending',
        promotedAt: '2024-01-01T11:00:00Z'
      };

      const axiosInstance = {
        put: jest.fn().mockResolvedValue({ data: { success: true } })
      } as any;
      mockAxios.create.mockReturnValue(axiosInstance);

      // Act
      const result = await advancedEventService.handleWaitlistPromotion(
        clubId,
        promotionData
      );

      // Assert
      expect(result.success).toBe(true);
      expect(axiosInstance.put).toHaveBeenCalledWith(
        `/clubs/${clubId}/events/${eventId}/waitlist/${memberId}/promote`,
        promotionData
      );
    });

    it('should leave waitlist', async () => {
      // Arrange
      const axiosInstance = {
        delete: jest.fn().mockResolvedValue({ data: { success: true } })
      } as any;
      mockAxios.create.mockReturnValue(axiosInstance);

      // Act
      const result = await advancedEventService.leaveWaitlist(
        clubId,
        eventId,
        memberId
      );

      // Assert
      expect(result.success).toBe(true);
      expect(axiosInstance.delete).toHaveBeenCalledWith(
        `/clubs/${clubId}/events/${eventId}/waitlist/${memberId}`
      );
    });

    it('should handle member already on waitlist error', async () => {
      // Arrange
      const waitlistRequest: WaitlistJoinRequest = {
        memberId,
        priority: 'standard'
      };

      const axiosInstance = {
        post: jest.fn().mockRejectedValue({
          response: {
            status: 409,
            data: { message: 'Member is already on the waitlist' }
          }
        })
      } as any;
      mockAxios.create.mockReturnValue(axiosInstance);

      mockErrorHandler.handleEventError.mockReturnValue({
        message: 'Member is already on the waitlist',
        code: 'ALREADY_ON_WAITLIST'
      } as any);

      // Act & Assert
      await expect(
        advancedEventService.joinWaitlist(clubId, eventId, waitlistRequest)
      ).rejects.toThrow('Member is already on the waitlist');
    });
  });

  describe('QR Code Management', () => {
    it('should generate event QR code', async () => {
      // Arrange
      const qrRequest: QRCodeGenerationRequest = {
        eventId,
        qrCodeType: 'event_info',
        expirationMinutes: 60,
        usageLimit: null
      };

      const expectedResponse = {
        qrCodeId: 'qr-123-456',
        qrCodeData: 'encrypted-qr-data-string',
        qrCodeUrl: 'https://app.gathergrove.club/qr/qr-123-456',
        eventId,
        qrCodeType: 'event_info',
        expiresAt: '2024-01-01T11:00:00Z',
        isActive: true,
        scanCount: 0
      };

      const axiosInstance = {
        post: jest.fn().mockResolvedValue({ data: expectedResponse })
      } as any;
      mockAxios.create.mockReturnValue(axiosInstance);

      // Act
      const result = await advancedEventService.generateQRCode(
        clubId,
        qrRequest
      );

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(result.qrCodeType).toBe('event_info');
      expect(result.isActive).toBe(true);
    });

    it('should validate QR code', async () => {
      // Arrange
      const validationRequest: QRCodeValidationRequest = {
        qrCodeData: 'encrypted-qr-data-string',
        scannerMemberId: memberId,
        scanLocation: {
          latitude: 37.7749,
          longitude: -122.4194
        }
      };

      const expectedResponse = {
        isValid: true,
        eventDetails: {
          id: eventId,
          name: 'Tech Meetup',
          location: 'Conference Center',
          eventDateTime: '2024-01-01T18:00:00Z'
        },
        qrCodeType: 'event_info',
        validationMessage: 'QR code is valid',
        canMarkAttendance: false
      };

      const axiosInstance = {
        post: jest.fn().mockResolvedValue({ data: expectedResponse })
      } as any;
      mockAxios.create.mockReturnValue(axiosInstance);

      // Act
      const result = await advancedEventService.validateQRCode(
        clubId,
        validationRequest
      );

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.eventDetails?.id).toBe(eventId);
      expect(result.qrCodeType).toBe('event_info');
    });

    it('should handle expired QR code', async () => {
      // Arrange
      const validationRequest: QRCodeValidationRequest = {
        qrCodeData: 'expired-qr-data-string',
        scannerMemberId: memberId
      };

      const axiosInstance = {
        post: jest.fn().mockRejectedValue({
          response: {
            status: 410,
            data: { message: 'QR code has expired' }
          }
        })
      } as any;
      mockAxios.create.mockReturnValue(axiosInstance);

      mockErrorHandler.handleEventError.mockReturnValue({
        message: 'QR code has expired',
        code: 'QR_CODE_EXPIRED'
      } as any);

      // Act & Assert
      await expect(
        advancedEventService.validateQRCode(clubId, validationRequest)
      ).rejects.toThrow('QR code has expired');
    });

    it('should mark attendance via QR code scan', async () => {
      // Arrange
      const attendanceRequest = {
        qrCodeData: 'attendance-qr-data',
        memberId,
        scanLocation: {
          latitude: 37.7749,
          longitude: -122.4194
        },
        scanTimestamp: '2024-01-01T18:05:00Z'
      };

      const expectedResponse = {
        attendanceMarked: true,
        attendanceId: 123,
        eventId,
        memberId,
        attendanceTimestamp: '2024-01-01T18:05:00Z',
        isWalkIn: false
      };

      const axiosInstance = {
        post: jest.fn().mockResolvedValue({ data: expectedResponse })
      } as any;
      mockAxios.create.mockReturnValue(axiosInstance);

      // Act
      const result = await advancedEventService.markAttendanceWithQR(
        clubId,
        attendanceRequest
      );

      // Assert
      expect(result.attendanceMarked).toBe(true);
      expect(result.eventId).toBe(eventId);
      expect(result.memberId).toBe(memberId);
    });
  });

  describe('Event Series Management', () => {
    it('should create event series with multiple sessions', async () => {
      // Arrange
      const seriesRequest: EventSeriesRequest = {
        seriesName: 'Web Development Bootcamp',
        description: '4-week intensive bootcamp',
        sessions: [
          {
            name: 'HTML & CSS Fundamentals',
            eventDateTime: '2024-01-08T18:00:00Z',
            location: 'Room A',
            description: 'Learn the basics'
          },
          {
            name: 'JavaScript Essentials',
            eventDateTime: '2024-01-15T18:00:00Z',
            location: 'Room A',
            description: 'JavaScript fundamentals'
          }
        ],
        maxCapacity: 25,
        requiresSequentialAttendance: true
      };

      const expectedResponse: EventSeriesResponse = {
        seriesId: 'series-789',
        seriesName: 'Web Development Bootcamp',
        events: [
          {
            id: 10,
            clubId,
            name: 'HTML & CSS Fundamentals',
            eventDateTime: '2024-01-08T18:00:00Z',
            location: 'Room A',
            description: 'Learn the basics',
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-01T10:00:00Z'
          },
          {
            id: 11,
            clubId,
            name: 'JavaScript Essentials',
            eventDateTime: '2024-01-15T18:00:00Z',
            location: 'Room A',
            description: 'JavaScript fundamentals',
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-01T10:00:00Z'
          }
        ],
        totalSessions: 2,
        requiresSequentialAttendance: true
      };

      const axiosInstance = {
        post: jest.fn().mockResolvedValue({ data: expectedResponse })
      } as any;
      mockAxios.create.mockReturnValue(axiosInstance);

      // Act
      const result = await advancedEventService.createEventSeries(
        clubId,
        seriesRequest
      );

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(result.totalSessions).toBe(2);
      expect(result.requiresSequentialAttendance).toBe(true);
    });

    it('should get event series timeline', async () => {
      // Arrange
      const seriesId = 'series-789';
      const expectedTimeline = {
        seriesId,
        events: [
          {
            id: 10,
            name: 'Session 1',
            eventDateTime: '2024-01-08T18:00:00Z',
            isCompleted: false,
            attendanceCount: 0
          },
          {
            id: 11,
            name: 'Session 2',
            eventDateTime: '2024-01-15T18:00:00Z',
            isCompleted: false,
            attendanceCount: 0
          }
        ],
        completionPercentage: 0,
        nextUpcomingSession: {
          id: 10,
          name: 'Session 1',
          eventDateTime: '2024-01-08T18:00:00Z'
        }
      };

      const axiosInstance = {
        get: jest.fn().mockResolvedValue({ data: expectedTimeline })
      } as any;
      mockAxios.create.mockReturnValue(axiosInstance);

      // Act
      const result = await advancedEventService.getEventSeriesTimeline(
        clubId,
        seriesId
      );

      // Assert
      expect(result.seriesId).toBe(seriesId);
      expect(result.events).toHaveLength(2);
      expect(result.completionPercentage).toBe(0);
    });
  });

  describe('Real-time Event Updates', () => {
    it('should subscribe to event updates', () => {
      // Arrange
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      
      // Mock WebSocket or SignalR connection
      const mockConnection = {
        on: jest.fn(),
        off: jest.fn(),
        start: jest.fn().mockResolvedValue(undefined)
      };
      
      // Mock the connection creation
      jest.spyOn(advancedEventService, 'createConnection')
        .mockReturnValue(mockConnection as any);

      // Act
      const unsubscribe = advancedEventService.subscribeToEventUpdates(
        eventId,
        mockCallback
      );

      // Assert
      expect(mockConnection.on).toHaveBeenCalledWith(
        `event-${eventId}-update`,
        mockCallback
      );
      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle real-time waitlist position updates', () => {
      // Arrange
      const mockCallback = jest.fn();
      const waitlistUpdate = {
        eventId,
        memberId,
        newPosition: 2,
        totalWaitlistSize: 5,
        estimatedPromotionTime: '2024-01-01T15:00:00Z'
      };

      const mockConnection = {
        on: jest.fn((event, callback) => {
          if (event === `waitlist-${eventId}-update`) {
            // Simulate receiving update
            setTimeout(() => callback(waitlistUpdate), 0);
          }
        }),
        start: jest.fn().mockResolvedValue(undefined)
      };
      
      jest.spyOn(advancedEventService, 'createConnection')
        .mockReturnValue(mockConnection as any);

      // Act
      advancedEventService.subscribeToWaitlistUpdates(
        eventId,
        memberId,
        mockCallback
      );

      // Assert
      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalledWith(waitlistUpdate);
      }, 10);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      const axiosInstance = {
        get: jest.fn().mockRejectedValue(new Error('Network Error'))
      } as any;
      mockAxios.create.mockReturnValue(axiosInstance);

      mockErrorHandler.handleEventError.mockReturnValue({
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      } as any);

      // Act & Assert
      await expect(
        advancedEventService.getWaitlistStatus(clubId, eventId, memberId)
      ).rejects.toThrow('Network error. Please check your connection.');
    });

    it('should handle authentication errors', async () => {
      // Arrange
      const axiosInstance = {
        post: jest.fn().mockRejectedValue({
          response: {
            status: 401,
            data: { message: 'Authentication required' }
          }
        })
      } as any;
      mockAxios.create.mockReturnValue(axiosInstance);

      mockErrorHandler.handleEventError.mockReturnValue({
        message: 'Authentication required. Please login again.',
        code: 'AUTH_REQUIRED'
      } as any);

      // Act & Assert
      await expect(
        advancedEventService.generateQRCode(clubId, {
          eventId,
          qrCodeType: 'event_info'
        })
      ).rejects.toThrow('Authentication required. Please login again.');
    });
  });

  describe('Performance and Caching', () => {
    it('should cache recurring event patterns for performance', async () => {
      // Arrange
      const pattern = mockRecurrencePattern;
      const axiosInstance = {
        get: jest.fn().mockResolvedValue({ data: pattern })
      } as any;
      mockAxios.create.mockReturnValue(axiosInstance);

      // Act - First call
      await advancedEventService.getRecurrencePattern(clubId, 'pattern-123');
      // Act - Second call (should use cache)
      await advancedEventService.getRecurrencePattern(clubId, 'pattern-123');

      // Assert
      expect(axiosInstance.get).toHaveBeenCalledTimes(1); // Should only call API once
    });

    it('should debounce rapid waitlist position requests', async () => {
      // Arrange
      const axiosInstance = {
        get: jest.fn().mockResolvedValue({ data: { position: 1 } })
      } as any;
      mockAxios.create.mockReturnValue(axiosInstance);

      // Act - Make multiple rapid calls
      const promises = [
        advancedEventService.getWaitlistStatus(clubId, eventId, memberId),
        advancedEventService.getWaitlistStatus(clubId, eventId, memberId),
        advancedEventService.getWaitlistStatus(clubId, eventId, memberId)
      ];

      await Promise.all(promises);

      // Assert - Should debounce to single call
      expect(axiosInstance.get).toHaveBeenCalledTimes(1);
    });
  });
});

// Additional type definitions that would be in the actual implementation
export interface RecurrencePatternRequest {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  startDate: string;
  endDate?: string;
  count?: number;
  weeklyDays?: string[];
  monthlyType?: 'by_date' | 'by_day_of_week';
}

export interface RecurringEventGenerationResult {
  events: Array<{
    id: number;
    clubId: number;
    name: string;
    eventDateTime: string;
    location: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  }>;
  totalGenerated: number;
  seriesId: string;
  pattern: RecurrencePatternRequest;
}

export interface WaitlistJoinRequest {
  memberId: number;
  priority: 'low' | 'standard' | 'high' | 'vip';
  notificationPreferences?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
}

export interface WaitlistStatusResponse {
  id: number;
  eventId: number;
  memberId: number;
  position: number;
  priority: string;
  status: 'active' | 'promoted' | 'expired' | 'cancelled';
  addedAt: string;
  estimatedPromotionTime?: string;
  totalWaitlistSize: number;
}

export interface QRCodeGenerationRequest {
  eventId: number;
  qrCodeType: 'event_info' | 'attendance_tracking' | 'registration' | 'vip_access';
  expirationMinutes?: number;
  usageLimit?: number;
}

export interface QRCodeValidationRequest {
  qrCodeData: string;
  scannerMemberId: number;
  scanLocation?: {
    latitude: number;
    longitude: number;
  };
  scanTimestamp?: string;
}

export interface EventSeriesRequest {
  seriesName: string;
  description: string;
  sessions: Array<{
    name: string;
    eventDateTime: string;
    location: string;
    description: string;
  }>;
  maxCapacity?: number;
  requiresSequentialAttendance?: boolean;
}

export interface EventSeriesResponse {
  seriesId: string;
  seriesName: string;
  events: Array<{
    id: number;
    clubId: number;
    name: string;
    eventDateTime: string;
    location: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  }>;
  totalSessions: number;
  requiresSequentialAttendance: boolean;
}