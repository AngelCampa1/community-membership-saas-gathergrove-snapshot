import { eventService } from '../eventService';
import { PayEventRequest, EventPaymentResponse } from '@/types/event';
import apiClient from '../apiClient';

// Mock apiClient
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

describe('eventService - Payment Methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('payForEvent', () => {
    const mockRequest: PayEventRequest = {
      eventId: 1,
      paymentMethodId: 'pm_test_123',
    };

    const mockSuccessResponse: EventPaymentResponse = {
      success: true,
      paymentId: 'pi_test_456',
      rsvpId: 10,
      confirmationNumber: 'CONF-ABC123',
      amountPaid: 25.00,
      eventName: 'Summer Gala',
      eventDateTime: '2025-07-15T18:00:00Z',
      eventLocation: 'Grand Hall',
      clubName: 'Test Club',
    };

    it('should call POST /users/me/events/pay with correct data', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockSuccessResponse });

      await eventService.payForEvent(mockRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/users/me/events/pay',
        mockRequest
      );
    });

    it('should return payment response on success', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockSuccessResponse });

      const result = await eventService.payForEvent(mockRequest);

      expect(result).toEqual(mockSuccessResponse);
      expect(result.success).toBe(true);
      expect(result.paymentId).toBe('pi_test_456');
      expect(result.rsvpId).toBe(10);
      expect(result.confirmationNumber).toBe('CONF-ABC123');
      expect(result.amountPaid).toBe(25.00);
    });

    it('should handle 400 Bad Request (invalid event)', async () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'This event does not require payment' },
        },
      };

      mockApiClient.post.mockRejectedValue(error);

      await expect(eventService.payForEvent(mockRequest)).rejects.toThrow();
    });

    it('should handle 401 Unauthorized', async () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'You must be logged in to pay for events' },
        },
      };

      mockApiClient.post.mockRejectedValue(error);

      await expect(eventService.payForEvent(mockRequest)).rejects.toThrow();
    });

    it('should handle 402 Payment Required (card declined)', async () => {
      const error = {
        response: {
          status: 402,
          data: { message: 'Payment failed: Card declined' },
        },
      };

      mockApiClient.post.mockRejectedValue(error);

      await expect(eventService.payForEvent(mockRequest)).rejects.toThrow();
    });

    it('should handle 403 Forbidden (not a member)', async () => {
      const error = {
        response: {
          status: 403,
          data: { message: 'You must be a member of this club to pay member pricing' },
        },
      };

      mockApiClient.post.mockRejectedValue(error);

      await expect(eventService.payForEvent(mockRequest)).rejects.toThrow();
    });

    it('should handle 404 Not Found (event not found)', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Event not found or has been cancelled' },
        },
      };

      mockApiClient.post.mockRejectedValue(error);

      await expect(eventService.payForEvent(mockRequest)).rejects.toThrow();
    });

    it('should handle 409 Conflict (already paid)', async () => {
      const error = {
        response: {
          status: 409,
          data: { message: 'You have already paid for this event' },
        },
      };

      mockApiClient.post.mockRejectedValue(error);

      await expect(eventService.payForEvent(mockRequest)).rejects.toThrow();
    });

    it('should handle 500 Internal Server Error', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'An unexpected error occurred' },
        },
      };

      mockApiClient.post.mockRejectedValue(error);

      await expect(eventService.payForEvent(mockRequest)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const error = new Error('Network Error');
      mockApiClient.post.mockRejectedValue(error);

      await expect(eventService.payForEvent(mockRequest)).rejects.toThrow();
    });

    it('should include eventId in request', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockSuccessResponse });

      const request: PayEventRequest = {
        eventId: 999,
        paymentMethodId: 'pm_test_999',
      };

      await eventService.payForEvent(request);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/users/me/events/pay',
        expect.objectContaining({ eventId: 999 })
      );
    });

    it('should include paymentMethodId in request', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockSuccessResponse });

      const request: PayEventRequest = {
        eventId: 1,
        paymentMethodId: 'pm_specific_id',
      };

      await eventService.payForEvent(request);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/users/me/events/pay',
        expect.objectContaining({ paymentMethodId: 'pm_specific_id' })
      );
    });

    it('should return all response fields', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockSuccessResponse });

      const result = await eventService.payForEvent(mockRequest);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('paymentId');
      expect(result).toHaveProperty('rsvpId');
      expect(result).toHaveProperty('confirmationNumber');
      expect(result).toHaveProperty('amountPaid');
      expect(result).toHaveProperty('eventName');
      expect(result).toHaveProperty('eventDateTime');
      expect(result).toHaveProperty('eventLocation');
      expect(result).toHaveProperty('clubName');
    });

    it('should handle successful payment with all details', async () => {
      const detailedResponse: EventPaymentResponse = {
        success: true,
        paymentId: 'pi_complete_789',
        rsvpId: 42,
        confirmationNumber: 'CONF-XYZ789',
        amountPaid: 50.00,
        eventName: 'Annual Conference',
        eventDateTime: '2025-09-20T09:00:00Z',
        eventLocation: 'Convention Center',
        clubName: 'Professional Club',
      };

      mockApiClient.post.mockResolvedValue({ data: detailedResponse });

      const result = await eventService.payForEvent(mockRequest);

      expect(result.amountPaid).toBe(50.00);
      expect(result.eventName).toBe('Annual Conference');
      expect(result.eventLocation).toBe('Convention Center');
      expect(result.clubName).toBe('Professional Club');
    });
  });
});

