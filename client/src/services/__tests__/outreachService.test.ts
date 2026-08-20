/**
 * @jest-environment jsdom
 *
 * Outreach Service Tests
 *
 * Tests unified outreach functionality (email/notification) following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic (URL construction, parameter handling, error handling)
 */

import outreachService, { SendOutreachRequest, SendOutreachResponse } from '../outreachService';
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

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('OutreachService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const clubId = 1;

  // Mock response data
  const mockEmailOutreachResponse: SendOutreachResponse = {
    success: true,
    sentCount: 25,
    message: 'Email sent to all 25 members',
    communicationLogId: 123,
    errors: [],
  };

  const mockNotificationOutreachResponse: SendOutreachResponse = {
    success: true,
    sentCount: 30,
    message: 'Push notification sent to 30 members',
    communicationLogId: 125,
    errors: [],
  };

  const mockPartialSuccessResponse: SendOutreachResponse = {
    success: true,
    sentCount: 15,
    message: 'Email sent to 15 of 20 members',
    communicationLogId: 126,
    errors: ['Failed to send to user1@test.com', 'Failed to send to user2@test.com'],
  };

  describe('sendOutreach', () => {
    describe('email outreach', () => {
      const emailRequest: SendOutreachRequest = {
        selectedMemberIds: [1, 2, 3, 4, 5],
        subject: 'Important Update',
        message: 'Hello members, we have an important update...',
        type: 'email',
      };

      it('should send email outreach to selected members', async () => {
        mockApiClient.post.mockResolvedValueOnce({ data: mockEmailOutreachResponse });

        const result = await outreachService.sendOutreach(clubId, emailRequest);

        expect(mockApiClient.post).toHaveBeenCalledWith(
          `/api/v1/clubs/${clubId}/communications/outreach`,
          emailRequest
        );
        expect(result).toEqual(mockEmailOutreachResponse);
      });

      it('should include subject for email type', async () => {
        mockApiClient.post.mockResolvedValueOnce({ data: mockEmailOutreachResponse });

        await outreachService.sendOutreach(clubId, emailRequest);

        expect(mockApiClient.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            subject: 'Important Update',
            type: 'email',
          })
        );
      });
    });

    describe('notification outreach', () => {
      const notificationRequest: SendOutreachRequest = {
        selectedMemberIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        subject: 'New Event Available',
        message: 'Check out our new event!',
        type: 'notification',
      };

      it('should send push notification outreach to selected members', async () => {
        mockApiClient.post.mockResolvedValueOnce({ data: mockNotificationOutreachResponse });

        const result = await outreachService.sendOutreach(clubId, notificationRequest);

        expect(mockApiClient.post).toHaveBeenCalledWith(
          `/api/v1/clubs/${clubId}/communications/outreach`,
          notificationRequest
        );
        expect(result).toEqual(mockNotificationOutreachResponse);
      });
    });

    describe('partial success handling', () => {
      it('should return partial success with error details', async () => {
        mockApiClient.post.mockResolvedValueOnce({ data: mockPartialSuccessResponse });

        const request: SendOutreachRequest = {
          selectedMemberIds: [1, 2, 3, 4, 5],
          subject: 'Test',
          message: 'Test message',
          type: 'email',
        };

        const result = await outreachService.sendOutreach(clubId, request);

        expect(result.success).toBe(true);
        expect(result.sentCount).toBe(15);
        expect(result.errors).toHaveLength(2);
      });
    });

    describe('error handling', () => {
      const request: SendOutreachRequest = {
        selectedMemberIds: [1, 2, 3],
        message: 'Test message',
        type: 'email',
      };

      it('should handle empty members list error (400)', async () => {
        const error = {
          response: {
            status: 400,
            data: { message: 'At least one member must be selected' },
          },
        };
        mockApiClient.post.mockRejectedValueOnce(error);

        await expect(outreachService.sendOutreach(clubId, request)).rejects.toEqual(error);
      });

      it('should handle invalid type error (400)', async () => {
        const invalidRequest = { ...request, type: 'invalid' } as unknown as SendOutreachRequest;
        const error = {
          response: {
            status: 400,
            data: { message: 'Invalid outreach type' },
          },
        };
        mockApiClient.post.mockRejectedValueOnce(error);

        await expect(outreachService.sendOutreach(clubId, invalidRequest)).rejects.toEqual(error);
      });

      it('should handle unauthorized error (401)', async () => {
        const error = { response: { status: 401 } };
        mockApiClient.post.mockRejectedValueOnce(error);

        await expect(outreachService.sendOutreach(clubId, request)).rejects.toEqual(error);
      });

      it('should handle forbidden error (403)', async () => {
        const error = { response: { status: 403 } };
        mockApiClient.post.mockRejectedValueOnce(error);

        await expect(outreachService.sendOutreach(clubId, request)).rejects.toEqual(error);
      });

      it('should handle server error (500)', async () => {
        const error = { response: { status: 500 } };
        mockApiClient.post.mockRejectedValueOnce(error);

        await expect(outreachService.sendOutreach(clubId, request)).rejects.toEqual(error);
      });

      it('should handle network error', async () => {
        const error = new Error('Network Error');
        mockApiClient.post.mockRejectedValueOnce(error);

        await expect(outreachService.sendOutreach(clubId, request)).rejects.toEqual(error);
      });
    });

    describe('parameter validation', () => {
      it('should pass correct clubId to API endpoint', async () => {
        mockApiClient.post.mockResolvedValueOnce({ data: mockEmailOutreachResponse });

        const request: SendOutreachRequest = {
          selectedMemberIds: [1],
          message: 'Test',
          type: 'email',
        };

        await outreachService.sendOutreach(456, request);

        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/api/v1/clubs/456/communications/outreach',
          expect.any(Object)
        );
      });

      it('should include all member IDs in request', async () => {
        mockApiClient.post.mockResolvedValueOnce({ data: mockEmailOutreachResponse });

        const memberIds = [1, 5, 10, 15, 20, 25, 30];
        const request: SendOutreachRequest = {
          selectedMemberIds: memberIds,
          message: 'Test',
          type: 'email',
        };

        await outreachService.sendOutreach(clubId, request);

        expect(mockApiClient.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            selectedMemberIds: memberIds,
          })
        );
      });
    });
  });
});
