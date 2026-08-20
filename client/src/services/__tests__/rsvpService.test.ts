/**
 * @jest-environment jsdom
 *
 * RSVP Service Tests
 *
 * Tests RSVP via email link functionality following boundary mocking pattern:
 * - Mock ONLY the apiClient boundary (HTTP layer)
 * - Test REAL service logic (URL construction, token encoding)
 *
 * Note: Error handling is tested at a high level. The ErrorHandler integration
 * transforms errors which is tested in ErrorHandler's own tests.
 */

import RsvpService from '../rsvpService';
import apiClient from '../apiClient';
import { RsvpViaLinkResponse } from '@/types/rsvp';

// Mock the apiClient module at the HTTP boundary
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

describe('RsvpService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processRsvpViaLink', () => {
    const mockSuccessResponse: RsvpViaLinkResponse = {
      success: true,
      message: 'Your RSVP has been recorded successfully',
      memberName: 'John Doe',
      eventName: 'Monthly Meeting',
      rsvpStatus: 'Attending',
    };

    it('should process RSVP successfully with valid token', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockSuccessResponse });

      const result = await RsvpService.processRsvpViaLink('valid-token-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/rsvps/via-link?token=valid-token-123');
      expect(result).toEqual(mockSuccessResponse);
      expect(result.success).toBe(true);
      expect(result.memberName).toBe('John Doe');
      expect(result.eventName).toBe('Monthly Meeting');
      expect(result.rsvpStatus).toBe('Attending');
    });

    it('should encode special characters in token', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockSuccessResponse });

      await RsvpService.processRsvpViaLink('token+with&special=chars');

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/rsvps/via-link?token=token%2Bwith%26special%3Dchars'
      );
    });

    it('should encode spaces in token', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockSuccessResponse });

      await RsvpService.processRsvpViaLink('token with spaces');

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/rsvps/via-link?token=token%20with%20spaces'
      );
    });

    it('should handle NotAttending RSVP status', async () => {
      const notAttendingResponse: RsvpViaLinkResponse = {
        ...mockSuccessResponse,
        rsvpStatus: 'NotAttending',
        message: 'Your decline has been recorded',
      };
      mockApiClient.get.mockResolvedValue({ data: notAttendingResponse });

      const result = await RsvpService.processRsvpViaLink('decline-token');

      expect(result.rsvpStatus).toBe('NotAttending');
      expect(result.success).toBe(true);
    });

    it('should handle Maybe RSVP status', async () => {
      const maybeResponse: RsvpViaLinkResponse = {
        ...mockSuccessResponse,
        rsvpStatus: 'Maybe',
        message: 'Your tentative RSVP has been recorded',
      };
      mockApiClient.get.mockResolvedValue({ data: maybeResponse });

      const result = await RsvpService.processRsvpViaLink('maybe-token');

      expect(result.rsvpStatus).toBe('Maybe');
    });

    describe('error handling', () => {
      // Note: The ErrorHandler transforms errors with custom messages.
      // These tests verify the service properly propagates errors.
      // The specific error messages are defined in the service and tested via ErrorHandler.

      it('should reject with error for invalid RSVP link (400)', async () => {
        const error = {
          response: {
            status: 400,
            data: { message: 'Invalid token format' },
          },
        };
        mockApiClient.get.mockRejectedValue(error);

        await expect(RsvpService.processRsvpViaLink('invalid')).rejects.toBeDefined();
      });

      it('should reject with error when RSVP link not found (404)', async () => {
        const error = {
          response: {
            status: 404,
            data: { message: 'Token not found' },
          },
        };
        mockApiClient.get.mockRejectedValue(error);

        await expect(RsvpService.processRsvpViaLink('nonexistent-token')).rejects.toBeDefined();
      });

      it('should reject with error when RSVP link has expired (410)', async () => {
        const error = {
          response: {
            status: 410,
            data: { message: 'Link expired' },
          },
        };
        mockApiClient.get.mockRejectedValue(error);

        await expect(RsvpService.processRsvpViaLink('expired-token')).rejects.toBeDefined();
      });

      it('should reject with error when RSVP already submitted (409)', async () => {
        const error = {
          response: {
            status: 409,
            data: { message: 'Already RSVP\'d' },
          },
        };
        mockApiClient.get.mockRejectedValue(error);

        await expect(RsvpService.processRsvpViaLink('already-used-token')).rejects.toBeDefined();
      });

      it('should reject with error when RSVP no longer available (423)', async () => {
        const error = {
          response: {
            status: 423,
            data: { message: 'Event locked' },
          },
        };
        mockApiClient.get.mockRejectedValue(error);

        await expect(RsvpService.processRsvpViaLink('locked-event-token')).rejects.toBeDefined();
      });

      it('should reject with error on network failure', async () => {
        mockApiClient.get.mockRejectedValue(new Error('Network Error'));

        await expect(RsvpService.processRsvpViaLink('any-token')).rejects.toBeDefined();
      });

      it('should reject with error on server error (500)', async () => {
        const error = {
          response: {
            status: 500,
            data: { message: 'Internal Server Error' },
          },
        };
        mockApiClient.get.mockRejectedValue(error);

        await expect(RsvpService.processRsvpViaLink('any-token')).rejects.toBeDefined();
      });
    });

    describe('token handling', () => {
      it('should handle empty token', async () => {
        mockApiClient.get.mockResolvedValue({ data: mockSuccessResponse });

        await RsvpService.processRsvpViaLink('');

        expect(mockApiClient.get).toHaveBeenCalledWith('/rsvps/via-link?token=');
      });

      it('should handle UUID-style tokens', async () => {
        mockApiClient.get.mockResolvedValue({ data: mockSuccessResponse });
        const uuidToken = '550e8400-e29b-41d4-a716-446655440000';

        await RsvpService.processRsvpViaLink(uuidToken);

        expect(mockApiClient.get).toHaveBeenCalledWith(`/rsvps/via-link?token=${uuidToken}`);
      });

      it('should handle base64-encoded tokens', async () => {
        mockApiClient.get.mockResolvedValue({ data: mockSuccessResponse });
        const base64Token = 'YWJjMTIzIT8kKiYoKSctPUB+';

        await RsvpService.processRsvpViaLink(base64Token);

        // Base64 characters that need encoding: + / =
        expect(mockApiClient.get).toHaveBeenCalledWith(
          `/rsvps/via-link?token=${encodeURIComponent(base64Token)}`
        );
      });

      it('should handle tokens with hash symbols', async () => {
        mockApiClient.get.mockResolvedValue({ data: mockSuccessResponse });

        await RsvpService.processRsvpViaLink('token#with#hashes');

        expect(mockApiClient.get).toHaveBeenCalledWith(
          '/rsvps/via-link?token=token%23with%23hashes'
        );
      });
    });
  });

  describe('class export', () => {
    it('should export RsvpService as default', () => {
      expect(RsvpService).toBeDefined();
      expect(typeof RsvpService.processRsvpViaLink).toBe('function');
    });

    it('should have static processRsvpViaLink method', () => {
      expect(RsvpService.processRsvpViaLink).toBeDefined();
    });
  });
});
