import { eventPaymentAdminService } from '../eventPaymentAdminService';
import apiClient from '../apiClient';
import type {
  EventPaymentOverview,
  IssueRefundRequest,
  RecordManualPaymentRequest,
  EventRefundResponse,
  ManualPaymentResponse,
} from '@/types/eventPayment';

// Mock apiClient
jest.mock('../apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('eventPaymentAdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPaymentOverview', () => {
    it('should call GET endpoint with correct URL', async () => {
      const mockOverview: EventPaymentOverview = {
        eventId: 1,
        eventName: 'Test Event',
        totalRevenue: 1500.00,
        totalAttendees: 25,
        paymentSummary: {
          completed: 20,
          pending: 3,
          failed: 1,
          refunded: 1,
          manualPayments: 5,
        },
        attendees: [],
      };

      mockApiClient.get.mockResolvedValue({ data: mockOverview });

      const result = await eventPaymentAdminService.getPaymentOverview(1, 10);

      expect(mockApiClient.get).toHaveBeenCalledWith('/clubs/1/events/10/payments/admin/overview');
      expect(result).toEqual(mockOverview);
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      mockApiClient.get.mockRejectedValue(error);

      await expect(eventPaymentAdminService.getPaymentOverview(1, 10)).rejects.toThrow('Network error');
    });
  });

  describe('issueRefund', () => {
    it('should call POST endpoint with correct URL and data', async () => {
      const request: IssueRefundRequest = {
        eventId: 10,
        rsvpId: 5,
        amount: 50.00,
        reason: 'Event cancelled',
      };

      const mockResponse: EventRefundResponse = {
        success: true,
        refundId: 're_1234567890',
        message: 'Refund of $50.00 processed successfully',
      };

      mockApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await eventPaymentAdminService.issueRefund(1, 10, request);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/clubs/1/events/10/payments/admin/refund',
        request
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle refund failures', async () => {
      const request: IssueRefundRequest = {
        eventId: 10,
        rsvpId: 5,
        amount: 50.00,
        reason: 'Test',
      };

      const error = new Error('Refund failed');
      mockApiClient.post.mockRejectedValue(error);

      await expect(eventPaymentAdminService.issueRefund(1, 10, request)).rejects.toThrow('Refund failed');
    });
  });

  describe('recordManualPayment', () => {
    it('should call POST endpoint with correct URL and data', async () => {
      const request: RecordManualPaymentRequest = {
        eventId: 10,
        memberId: 25,
        amountPaid: 50.00,
        paymentMethod: 'cash',
        notes: 'Paid at event check-in',
      };

      const mockResponse: ManualPaymentResponse = {
        success: true,
        rsvpId: 100,
        message: 'Manual payment recorded successfully',
      };

      mockApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await eventPaymentAdminService.recordManualPayment(1, 10, request);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/clubs/1/events/10/payments/admin/manual-payment',
        request
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle manual payment recording failures', async () => {
      const request: RecordManualPaymentRequest = {
        eventId: 10,
        memberId: 25,
        amountPaid: 50.00,
        paymentMethod: 'cash',
      };

      const error = new Error('Payment recording failed');
      mockApiClient.post.mockRejectedValue(error);

      await expect(eventPaymentAdminService.recordManualPayment(1, 10, request)).rejects.toThrow(
        'Payment recording failed'
      );
    });
  });

  describe('exportPaymentData', () => {
    it('should call GET endpoint with correct URL and query params', async () => {
      const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
      mockApiClient.get.mockResolvedValue({ data: mockBlob });

      const result = await eventPaymentAdminService.exportPaymentData(1, 10, 'csv');

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/clubs/1/events/10/payments/admin/export?format=csv',
        { responseType: 'blob' }
      );
      expect(result).toBe(mockBlob);
    });

    it('should default to csv format if not specified', async () => {
      const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
      mockApiClient.get.mockResolvedValue({ data: mockBlob });

      await eventPaymentAdminService.exportPaymentData(1, 10);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/clubs/1/events/10/payments/admin/export?format=csv',
        { responseType: 'blob' }
      );
    });

    it('should handle export failures', async () => {
      const error = new Error('Export failed');
      mockApiClient.get.mockRejectedValue(error);

      await expect(eventPaymentAdminService.exportPaymentData(1, 10, 'csv')).rejects.toThrow('Export failed');
    });
  });
});

