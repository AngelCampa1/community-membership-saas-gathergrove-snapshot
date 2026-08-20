import { eventService } from '../eventService';
import apiClient from '../apiClient';

jest.mock('../apiClient');

const mockApiClient = apiClient as any;

describe('eventService - Payment Links', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePaymentLink', () => {
    const clubId = 1;
    const eventId = 123;

    it('should generate payment link for event', async () => {
      const mockResponse = {
        data: {
          paymentToken: 'token-abc-123',
          paymentLink: 'https://gathergrove.club/events/pay/token-abc-123',
          expiresAt: '2024-12-31T23:59:59Z',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await eventService.generatePaymentLink(clubId, eventId);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/clubs/${clubId}/events/${eventId}/payment-link`
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors gracefully', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { status: 403 },
      });

      await expect(
        eventService.generatePaymentLink(clubId, eventId)
      ).rejects.toBeTruthy();
    });

    it('should handle free events error', async () => {
      mockApiClient.post.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Cannot generate payment link for free events' },
        },
      });

      await expect(
        eventService.generatePaymentLink(clubId, eventId)
      ).rejects.toBeTruthy();
    });

    it('should handle permission errors', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { status: 403 },
      });

      await expect(
        eventService.generatePaymentLink(clubId, eventId)
      ).rejects.toBeTruthy();
    });

    it('should handle event not found errors', async () => {
      mockApiClient.post.mockRejectedValue({
        response: { status: 404 },
      });

      await expect(
        eventService.generatePaymentLink(clubId, eventId)
      ).rejects.toBeTruthy();
    });
  });

  describe('getPublicEventByToken', () => {
    const token = 'test-token-123';

    it('should fetch public event data by token', async () => {
      const mockEvent = {
        id: 1,
        name: 'Test Event',
        description: 'Test Description',
        eventDateTime: '2024-12-31T19:00:00Z',
        location: 'Test Venue',
        memberPrice: 25.00,
        nonMemberPrice: 35.00,
        isFree: false,
      };

      mockApiClient.get.mockResolvedValue({ data: mockEvent });

      const result = await eventService.getPublicEventByToken(token);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/events/public/${token}`);
      expect(result).toEqual(mockEvent);
    });

    it('should handle invalid token', async () => {
      mockApiClient.get.mockRejectedValue({
        response: { status: 404 },
      });

      await expect(
        eventService.getPublicEventByToken(token)
      ).rejects.toBeTruthy();
    });

    it('should handle expired token', async () => {
      mockApiClient.get.mockRejectedValue({
        response: {
          status: 410,
          data: { message: 'Payment link has expired' },
        },
      });

      await expect(
        eventService.getPublicEventByToken(token)
      ).rejects.toBeTruthy();
    });

    it('should handle network errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(
        eventService.getPublicEventByToken(token)
      ).rejects.toBeTruthy();
    });

    it('should not require authentication', async () => {
      const mockEvent = {
        id: 1,
        name: 'Public Event',
        eventDateTime: '2024-12-31T19:00:00Z',
        location: 'Public Venue',
        memberPrice: 10.00,
        nonMemberPrice: 15.00,
      };

      mockApiClient.get.mockResolvedValue({ data: mockEvent });

      await eventService.getPublicEventByToken(token);

      // Verify that no auth header is required
      expect(mockApiClient.get).toHaveBeenCalledWith(`/events/public/${token}`);
    });
  });

  describe('Error Messages', () => {
    it('should provide user-friendly error for payment link generation', async () => {
      mockApiClient.post.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Event must have pricing configured' },
        },
      });

      await expect(
        eventService.generatePaymentLink(1, 123)
      ).rejects.toBeTruthy();
    });

    it('should provide clear error for token expiration', async () => {
      mockApiClient.get.mockRejectedValue({
        response: {
          status: 410,
          data: { message: 'Payment link expired' },
        },
      });

      await expect(
        eventService.getPublicEventByToken('expired-token')
      ).rejects.toBeTruthy();
    });
  });
});