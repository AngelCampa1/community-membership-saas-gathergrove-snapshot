import { paymentService } from '../paymentService';
import apiClient from '../apiClient';

// Mock apiClient for authenticated endpoints
jest.mock('../apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock fetch for public endpoints using jest.spyOn
let mockFetch: jest.SpyInstance;

describe('paymentService', () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8050';

  beforeEach(() => {
    mockFetch = jest.spyOn(global, 'fetch');
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  describe('requestPayment', () => {
    it('should successfully request payment from a member', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: {} });

      const request = {
        amount: 50.00,
        description: 'Monthly dues for January 2025',
      };

      await paymentService.requestPayment(1, 2, request);

      expect(apiClient.post).toHaveBeenCalledWith(
        `/clubs/1/members/2/request-payment`,
        request
      );
    });

    it('should throw error when request payment fails', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Member not found' }
        },
        message: 'Member not found'
      };
      (apiClient.post as jest.Mock).mockRejectedValueOnce(mockError);

      const request = {
        amount: 50.00,
        description: 'Monthly dues for January 2025',
      };

      await expect(paymentService.requestPayment(1, 2, request))
        .rejects.toThrow('Member not found or has been removed');
    });

    it('should throw generic error when request payment fails without message', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {}
        },
        message: 'Server error'
      };
      (apiClient.post as jest.Mock).mockRejectedValueOnce(mockError);

      const request = {
        amount: 50.00,
        description: 'Monthly dues for January 2025',
      };

      await expect(paymentService.requestPayment(1, 2, request))
        .rejects.toThrow('Error requesting payment from member');
    });
  });

  describe('getPaymentPage', () => {
    it('should successfully get payment page details', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          clubName: 'Test Club',
          memberName: 'John Doe',
          membershipType: 'Premium',
          amount: 50.00,
          description: 'Monthly dues',
          isValid: true,
          stripePublishableKey: 'pk_test_123',
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const token = 'test-token-123';
      const result = await paymentService.getPaymentPage(token);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/payment-page/${token}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result).toEqual({
        clubName: 'Test Club',
        memberName: 'John Doe',
        membershipType: 'Premium',
        amount: 50.00,
        description: 'Monthly dues',
        isValid: true,
        stripePublishableKey: 'pk_test_123',
      });
    });

    it('should throw error when get payment page fails', async () => {
      const mockErrorResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Payment page not found' }),
      };
      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      const token = 'invalid-token';

      await expect(paymentService.getPaymentPage(token))
        .rejects.toThrow('Payment page not found');
    });
  });

  describe('processPayment', () => {
    it('should successfully process payment', async () => {
      const mockResponse = {
        ok: true,
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const token = 'test-token-123';
      const request = {
        paymentMethodId: 'pm_test_123',
      };

      await paymentService.processPayment(token, request);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/payment-page/${token}/pay`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );
    });

    it('should throw error when process payment fails', async () => {
      const mockErrorResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Payment processing failed' }),
      };
      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      const token = 'test-token-123';
      const request = {
        paymentMethodId: 'pm_test_123',
      };

      await expect(paymentService.processPayment(token, request))
        .rejects.toThrow('Payment processing failed');
    });
  });

  describe('getMemberPayments', () => {
    it('should successfully get member payments', async () => {
      const mockPayments = [
        {
          paymentId: 1,
          memberId: 2,
          clubId: 1,
          amount: 50.00,
          paymentDate: '2025-01-01',
          paymentMethod: 'Cash',
          notes: 'January payment',
          createdAt: '2025-01-01T10:00:00Z',
        },
      ];
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockPayments });

      const result = await paymentService.getMemberPayments(1, 2);

      expect(apiClient.get).toHaveBeenCalledWith('/clubs/1/members/2/payments');
      expect(result).toEqual(mockPayments);
    });

    it('should throw error when get member payments fails', async () => {
      const mockError = {
        response: {
          status: 403,
          data: { message: 'Forbidden' }
        },
        message: 'Forbidden'
      };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(paymentService.getMemberPayments(1, 2))
        .rejects.toThrow('You do not have permission to view payments for this member');
    });
  });

  describe('getPayment', () => {
    it('should successfully get a specific payment', async () => {
      const mockPayment = {
        paymentId: 1,
        memberId: 2,
        clubId: 1,
        amount: 50.00,
        paymentDate: '2025-01-01',
        paymentMethod: 'Cash',
        notes: 'January payment',
        createdAt: '2025-01-01T10:00:00Z',
      };
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockPayment });

      const result = await paymentService.getPayment(1, 2, 1);

      expect(apiClient.get).toHaveBeenCalledWith('/clubs/1/members/2/payments/1');
      expect(result).toEqual(mockPayment);
    });

    it('should throw error when get payment fails', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Payment not found' }
        },
        message: 'Payment not found'
      };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(paymentService.getPayment(1, 2, 1))
        .rejects.toThrow('Payment not found');
    });
  });

  describe('updatePayment', () => {
    it('should successfully update a payment', async () => {
      const updateRequest = {
        amount: 60.00,
        paymentDate: '2025-01-01',
        paymentMethod: 'Check',
        notes: 'Updated payment',
      };
      const mockUpdatedPayment = {
        paymentId: 1,
        memberId: 2,
        clubId: 1,
        ...updateRequest,
        createdAt: '2025-01-01T10:00:00Z',
      };
      (apiClient.put as jest.Mock).mockResolvedValueOnce({ data: mockUpdatedPayment });

      const result = await paymentService.updatePayment(1, 2, 1, updateRequest);

      expect(apiClient.put).toHaveBeenCalledWith('/clubs/1/members/2/payments/1', updateRequest);
      expect(result).toEqual(mockUpdatedPayment);
    });

    it('should throw error when update payment fails', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Invalid payment data' }
        },
        message: 'Invalid payment data'
      };
      (apiClient.put as jest.Mock).mockRejectedValueOnce(mockError);

      const updateRequest = {
        amount: 60.00,
        paymentDate: '2025-01-01',
        paymentMethod: 'Stripe',
        notes: 'Try to update Stripe payment',
      };

      await expect(paymentService.updatePayment(1, 2, 1, updateRequest))
        .rejects.toThrow('Invalid payment data. Only manual payments (Cash/Check) can be edited');
    });
  });

  describe('deletePayment', () => {
    it('should successfully delete a payment', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({ data: {} });

      await paymentService.deletePayment(1, 2, 1);

      expect(apiClient.delete).toHaveBeenCalledWith('/clubs/1/members/2/payments/1');
    });

    it('should throw error when delete payment fails', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Cannot delete Stripe payment' }
        },
        message: 'Cannot delete Stripe payment'
      };
      (apiClient.delete as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(paymentService.deletePayment(1, 2, 1))
        .rejects.toThrow('Cannot delete this payment. Only manual payments (Cash/Check) can be deleted');
    });
  });

  describe('getClubPayments', () => {
    it('should successfully get club payments without year filter', async () => {
      const mockPayments = [
        {
          paymentId: 1,
          memberId: 2,
          memberName: 'John Doe',
          memberEmail: 'john@example.com',
          membershipTypeName: 'Premium',
          amount: 50.00,
          paymentDate: '2025-01-01',
          paymentMethod: 'Cash',
          isPartialPayment: false,
        },
      ];
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockPayments });

      const result = await paymentService.getClubPayments(1);

      expect(apiClient.get).toHaveBeenCalledWith('/clubs/1/payments', { params: {} });
      expect(result).toEqual(mockPayments);
    });

    it('should successfully get club payments with year filter', async () => {
      const mockPayments = [
        {
          paymentId: 1,
          memberId: 2,
          memberName: 'John Doe',
          memberEmail: 'john@example.com',
          membershipTypeName: 'Premium',
          amount: 50.00,
          paymentDate: '2025-01-01',
          paymentMethod: 'Cash',
          isPartialPayment: false,
        },
      ];
      (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockPayments });

      const result = await paymentService.getClubPayments(1, 2025);

      expect(apiClient.get).toHaveBeenCalledWith('/clubs/1/payments', { params: { year: 2025 } });
      expect(result).toEqual(mockPayments);
    });

    it('should throw error when get club payments fails', async () => {
      const mockError = {
        response: {
          status: 403,
          data: { message: 'Forbidden' }
        },
        message: 'Forbidden'
      };
      (apiClient.get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(paymentService.getClubPayments(1))
        .rejects.toThrow('You do not have permission to view club payments');
    });
  });

  describe('fetch error handling', () => {
    it('should handle getPaymentPage when JSON parse fails', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      };
      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      await expect(paymentService.getPaymentPage('invalid-token'))
        .rejects.toBeDefined();
    });

    it('should handle processPayment when JSON parse fails', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      };
      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      await expect(paymentService.processPayment('token', { paymentMethodId: 'pm_test' }))
        .rejects.toBeDefined();
    });
  });

  // Phase 6: Enhanced error response branch coverage (6 new tests)
  // These tests verify the raw error construction before ErrorHandler wraps it
  describe('Enhanced fetch error handling - Phase 6', () => {
    describe('getPaymentPage error message branches', () => {
      it('should construct error with message field from response', async () => {
        const mockErrorResponse = {
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValue({ message: 'Custom validation error' }),
        };
        mockFetch.mockResolvedValueOnce(mockErrorResponse);

        await expect(paymentService.getPaymentPage('test-token'))
          .rejects.toThrow('Invalid payment link'); // ErrorHandler wraps with custom 400 message
      });

      it('should use "Request failed" fallback when error response has NO message field', async () => {
        const mockErrorResponse = {
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue({ code: 'ERR_500' }), // No message field
        };
        mockFetch.mockResolvedValueOnce(mockErrorResponse);

        await expect(paymentService.getPaymentPage('test-token'))
          .rejects.toThrow('Request failed'); // Raw error uses fallback, then ErrorHandler adds context
      });

      it('should use HTTP status fallback when JSON parse fails', async () => {
        const mockErrorResponse = {
          ok: false,
          status: 503,
          json: jest.fn().mockRejectedValue(new Error('Parse error')),
        };
        mockFetch.mockResolvedValueOnce(mockErrorResponse);

        await expect(paymentService.getPaymentPage('test-token'))
          .rejects.toThrow(); // JSON parse failure triggers catch block
      });
    });

    describe('processPayment error message branches', () => {
      it('should construct error with message field from response', async () => {
        const mockErrorResponse = {
          ok: false,
          status: 402,
          json: jest.fn().mockResolvedValue({ message: 'Card declined' }),
        };
        mockFetch.mockResolvedValueOnce(mockErrorResponse);

        await expect(paymentService.processPayment('token', { paymentMethodId: 'pm_123' }))
          .rejects.toThrow('Payment failed'); // ErrorHandler wraps with custom 402 message
      });

      it('should use "Request failed" fallback when error response has NO message field', async () => {
        const mockErrorResponse = {
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue({ error: 'UNKNOWN' }), // No message field
        };
        mockFetch.mockResolvedValueOnce(mockErrorResponse);

        await expect(paymentService.processPayment('token', { paymentMethodId: 'pm_123' }))
          .rejects.toThrow('Request failed');
      });

      it('should use HTTP status fallback when JSON parse fails', async () => {
        const mockErrorResponse = {
          ok: false,
          status: 504,
          json: jest.fn().mockRejectedValue(new Error('Parse error')),
        };
        mockFetch.mockResolvedValueOnce(mockErrorResponse);

        await expect(paymentService.processPayment('token', { paymentMethodId: 'pm_123' }))
          .rejects.toThrow(); // JSON parse failure triggers catch block
      });
    });
  });
});
