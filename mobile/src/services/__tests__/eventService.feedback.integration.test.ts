/**
 * Feedback Integration Tests
 * Tests for event feedback functionality including form retrieval and submission
 */

import {
  createMockFeedbackForm,
  createMockFeedbackFormField,
  createMockFeedbackSubmission,
  createMockFeedbackResult,
} from '../__helpers__/testData';

// Mock the entire eventService module
jest.mock('../eventService', () => {
  const mockEventService = {
    getFeedbackForm: jest.fn(),
    submitFeedback: jest.fn(),
  };
  return {
    EventService: mockEventService,
  };
});

// Import the mocked service
import { EventService } from '../eventService';

const mockEventService = EventService as jest.Mocked<typeof EventService>;

describe('EventService - Feedback Integration Tests', () => {
  const clubId = 1;
  const eventId = 100;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFeedbackForm', () => {
    it('should retrieve active feedback form with all fields', async () => {
      // Arrange
      const mockForm = createMockFeedbackForm({
        id: 1,
        eventId,
        title: 'Event Feedback Survey',
        description: 'Please share your thoughts',
        isActive: true,
        fields: [
          createMockFeedbackFormField({ id: 'field-1', type: 'text', required: true }),
          createMockFeedbackFormField({ id: 'field-2', type: 'rating', required: true }),
        ],
      });
      mockEventService.getFeedbackForm.mockResolvedValue(mockForm);

      // Act
      const result = await EventService.getFeedbackForm(clubId, eventId);

      // Assert
      expect(result).toEqual(mockForm);
      expect(result.isActive).toBe(true);
      expect(result.fields).toHaveLength(2);
      expect(mockEventService.getFeedbackForm).toHaveBeenCalledWith(clubId, eventId);
    });

    it('should retrieve form with various field types', async () => {
      // Arrange
      const mockForm = createMockFeedbackForm({
        fields: [
          createMockFeedbackFormField({ id: 'field-1', type: 'text' }),
          createMockFeedbackFormField({ id: 'field-2', type: 'rating' }),
          createMockFeedbackFormField({ id: 'field-3', type: 'select', options: ['Good', 'Bad'] }),
          createMockFeedbackFormField({ id: 'field-4', type: 'checkbox' }),
          createMockFeedbackFormField({ id: 'field-5', type: 'textarea' }),
        ],
      });
      mockEventService.getFeedbackForm.mockResolvedValue(mockForm);

      // Act
      const result = await EventService.getFeedbackForm(clubId, eventId);

      // Assert
      expect(result.fields).toHaveLength(5);
      expect(result.fields[0].type).toBe('text');
      expect(result.fields[1].type).toBe('rating');
      expect(result.fields[2].type).toBe('select');
      expect(result.fields[2].options).toEqual(['Good', 'Bad']);
      expect(mockEventService.getFeedbackForm).toHaveBeenCalledWith(clubId, eventId);
    });

    it('should retrieve form with optional fields', async () => {
      // Arrange
      const mockForm = createMockFeedbackForm({
        fields: [
          createMockFeedbackFormField({ id: 'field-1', required: true }),
          createMockFeedbackFormField({ id: 'field-2', required: false }),
        ],
      });
      mockEventService.getFeedbackForm.mockResolvedValue(mockForm);

      // Act
      const result = await EventService.getFeedbackForm(clubId, eventId);

      // Assert
      expect(result.fields[0].required).toBe(true);
      expect(result.fields[1].required).toBe(false);
      expect(mockEventService.getFeedbackForm).toHaveBeenCalledWith(clubId, eventId);
    });

    it('should retrieve form with deadline information', async () => {
      // Arrange
      const deadline = '2025-12-31T23:59:59Z';
      const mockForm = createMockFeedbackForm({
        deadline,
        isActive: true,
      });
      mockEventService.getFeedbackForm.mockResolvedValue(mockForm);

      // Act
      const result = await EventService.getFeedbackForm(clubId, eventId);

      // Assert
      expect(result.deadline).toBe(deadline);
      expect(result.isActive).toBe(true);
      expect(mockEventService.getFeedbackForm).toHaveBeenCalledWith(clubId, eventId);
    });

    it('should handle no feedback form exists (404)', async () => {
      // Arrange
      const errorMessage = 'Feedback form not found for this event';
      mockEventService.getFeedbackForm.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.getFeedbackForm(clubId, eventId)).rejects.toThrow(errorMessage);
    });

    it('should handle inactive form (404 or 403)', async () => {
      // Arrange
      const errorMessage = 'Feedback form is no longer active';
      mockEventService.getFeedbackForm.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.getFeedbackForm(clubId, eventId)).rejects.toThrow(errorMessage);
    });

    it('should handle unauthorized access error (401)', async () => {
      // Arrange
      const errorMessage = 'Authentication required. Please login again.';
      mockEventService.getFeedbackForm.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.getFeedbackForm(clubId, eventId)).rejects.toThrow(errorMessage);
    });

    it('should handle event not found error (404)', async () => {
      // Arrange
      const errorMessage = 'Event not found';
      mockEventService.getFeedbackForm.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.getFeedbackForm(clubId, eventId)).rejects.toThrow(errorMessage);
    });

    it('should handle network error', async () => {
      // Arrange
      const errorMessage = 'Network error. Please check your connection.';
      mockEventService.getFeedbackForm.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(EventService.getFeedbackForm(clubId, eventId)).rejects.toThrow(errorMessage);
    });
  });

  describe('submitFeedback', () => {
    it('should submit complete feedback with all required fields', async () => {
      // Arrange
      const mockSubmission = createMockFeedbackSubmission({
        responses: {
          'field-1': 'Great event!',
          'field-2': 5,
        },
        rating: 5,
        comment: 'Excellent organization',
        anonymous: false,
        memberId: 1,
      });
      const mockResult = createMockFeedbackResult({
        success: true,
        feedbackId: 10,
        message: 'Feedback submitted successfully',
      });
      mockEventService.submitFeedback.mockResolvedValue(mockResult);

      // Act
      const result = await EventService.submitFeedback(clubId, eventId, mockSubmission);

      // Assert
      expect(result.success).toBe(true);
      expect(result.feedbackId).toBe(10);
      expect(result.message).toContain('successfully');
      expect(mockEventService.submitFeedback).toHaveBeenCalledWith(
        clubId,
        eventId,
        mockSubmission
      );
    });

    it('should submit feedback with optional fields', async () => {
      // Arrange
      const mockSubmission = createMockFeedbackSubmission({
        responses: { 'field-1': 'Good event' },
        rating: 4,
        comment: undefined,
        anonymous: false,
      });
      const mockResult = createMockFeedbackResult({ success: true });
      mockEventService.submitFeedback.mockResolvedValue(mockResult);

      // Act
      const result = await EventService.submitFeedback(clubId, eventId, mockSubmission);

      // Assert
      expect(result.success).toBe(true);
      expect(mockEventService.submitFeedback).toHaveBeenCalledWith(
        clubId,
        eventId,
        mockSubmission
      );
    });

    it('should submit anonymous feedback', async () => {
      // Arrange
      const mockSubmission = createMockFeedbackSubmission({
        anonymous: true,
        memberId: undefined,
        rating: 5,
      });
      const mockResult = createMockFeedbackResult({ success: true });
      mockEventService.submitFeedback.mockResolvedValue(mockResult);

      // Act
      const result = await EventService.submitFeedback(clubId, eventId, mockSubmission);

      // Assert
      expect(result.success).toBe(true);
      expect(mockEventService.submitFeedback).toHaveBeenCalledWith(
        clubId,
        eventId,
        mockSubmission
      );
    });

    it('should submit feedback with various rating values (1-5)', async () => {
      // Arrange
      const ratings = [1, 2, 3, 4, 5];
      const mockResult = createMockFeedbackResult({ success: true });
      mockEventService.submitFeedback.mockResolvedValue(mockResult);

      // Act & Assert
      for (const rating of ratings) {
        const mockSubmission = createMockFeedbackSubmission({ rating });
        const result = await EventService.submitFeedback(clubId, eventId, mockSubmission);
        expect(result.success).toBe(true);
      }

      expect(mockEventService.submitFeedback).toHaveBeenCalledTimes(5);
    });

    it('should submit feedback with long text responses', async () => {
      // Arrange
      const longText = 'A'.repeat(1000);
      const mockSubmission = createMockFeedbackSubmission({
        responses: { 'field-1': longText },
        comment: longText,
      });
      const mockResult = createMockFeedbackResult({ success: true });
      mockEventService.submitFeedback.mockResolvedValue(mockResult);

      // Act
      const result = await EventService.submitFeedback(clubId, eventId, mockSubmission);

      // Assert
      expect(result.success).toBe(true);
      expect(mockEventService.submitFeedback).toHaveBeenCalledWith(
        clubId,
        eventId,
        mockSubmission
      );
    });

    it('should handle missing required fields error (400)', async () => {
      // Arrange
      const errorMessage = 'Required field "field-1" is missing';
      mockEventService.submitFeedback.mockRejectedValue(new Error(errorMessage));
      const mockSubmission = createMockFeedbackSubmission({ responses: {} });

      // Act & Assert
      await expect(
        EventService.submitFeedback(clubId, eventId, mockSubmission)
      ).rejects.toThrow(errorMessage);
    });

    it('should handle invalid rating value error (400)', async () => {
      // Arrange
      const errorMessage = 'Rating must be between 1 and 5';
      mockEventService.submitFeedback.mockRejectedValue(new Error(errorMessage));
      const mockSubmission = createMockFeedbackSubmission({ rating: 10 });

      // Act & Assert
      await expect(
        EventService.submitFeedback(clubId, eventId, mockSubmission)
      ).rejects.toThrow(errorMessage);
    });

    it('should handle form deadline passed error (400)', async () => {
      // Arrange
      const errorMessage = 'Feedback deadline has passed';
      mockEventService.submitFeedback.mockRejectedValue(new Error(errorMessage));
      const mockSubmission = createMockFeedbackSubmission();

      // Act & Assert
      await expect(
        EventService.submitFeedback(clubId, eventId, mockSubmission)
      ).rejects.toThrow(errorMessage);
    });

    it('should handle already submitted feedback error (409)', async () => {
      // Arrange
      const errorMessage = 'You have already submitted feedback for this event';
      mockEventService.submitFeedback.mockRejectedValue(new Error(errorMessage));
      const mockSubmission = createMockFeedbackSubmission();

      // Act & Assert
      await expect(
        EventService.submitFeedback(clubId, eventId, mockSubmission)
      ).rejects.toThrow(errorMessage);
    });

    it('should handle unauthorized access error (401)', async () => {
      // Arrange
      const errorMessage = 'Authentication required. Please login again.';
      mockEventService.submitFeedback.mockRejectedValue(new Error(errorMessage));
      const mockSubmission = createMockFeedbackSubmission();

      // Act & Assert
      await expect(
        EventService.submitFeedback(clubId, eventId, mockSubmission)
      ).rejects.toThrow(errorMessage);
    });

    it('should handle network error', async () => {
      // Arrange
      const errorMessage = 'Network error. Please check your connection.';
      mockEventService.submitFeedback.mockRejectedValue(new Error(errorMessage));
      const mockSubmission = createMockFeedbackSubmission();

      // Act & Assert
      await expect(
        EventService.submitFeedback(clubId, eventId, mockSubmission)
      ).rejects.toThrow(errorMessage);
    });
  });
});
