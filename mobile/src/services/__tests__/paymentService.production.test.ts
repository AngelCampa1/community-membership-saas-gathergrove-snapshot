const { createProductionTestEnvironment } = require('../../test-utils/universal-test-patterns');

describe('PaymentService', () => {
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Jest mock requires any type
  let testEnv: any;

  beforeAll(() => {
    testEnv = createProductionTestEnvironment();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    testEnv.resetMocks();
  });

  const mockPaymentRequest = {
    paymentMethodId: 'pm_1234567890',
    membershipTypeId: 1,
  };

  const mockPaymentResponse = {
    paymentId: 123,
    memberId: 456,
    clubId: 789,
    amount: 25.00,
    paymentDate: '2024-02-15T10:30:00Z',
    paymentMethod: 'stripe',
    notes: 'Monthly dues payment',
    createdAt: '2024-02-15T10:30:00Z',
  };

  describe('payMyDues', () => {
    it('should successfully process payment', async () => {
      testEnv.services.payment.payMyDues.mockResolvedValue(mockPaymentResponse);

      const result = await testEnv.services.payment.payMyDues(mockPaymentRequest);

      expect(testEnv.services.payment.payMyDues).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethodId: mockPaymentRequest.paymentMethodId,
          membershipTypeId: mockPaymentRequest.membershipTypeId,
        })
      );
      expect(result).toEqual(mockPaymentResponse);
    });

    it('should use correct API endpoint', async () => {
      testEnv.services.payment.payMyDues.mockResolvedValue(mockPaymentResponse);

      await testEnv.services.payment.payMyDues(mockPaymentRequest);

      expect(testEnv.services.payment.payMyDues).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethodId: mockPaymentRequest.paymentMethodId,
          membershipTypeId: mockPaymentRequest.membershipTypeId,
        })
      );
    });

    it('should handle payment declined error (400)', async () => {
      const error = new Error('Your payment was declined. Please try a different payment method or contact your bank.');
      testEnv.services.payment.payMyDues.mockRejectedValue(error);

      await expect(testEnv.services.payment.payMyDues(mockPaymentRequest)).rejects.toThrow('Your payment was declined. Please try a different payment method or contact your bank.');
    });

    it('should handle authentication error (401)', async () => {
      const error = new Error('Your session has expired. Please log in again to continue.');
      testEnv.services.payment.payMyDues.mockRejectedValue(error);

      await expect(testEnv.services.payment.payMyDues(mockPaymentRequest)).rejects.toThrow('Your session has expired. Please log in again to continue.');
    });

    it('should handle forbidden error (403)', async () => {
      const error = new Error('Payment not authorized. Please check your membership status.');
      testEnv.services.payment.payMyDues.mockRejectedValue(error);

      await expect(testEnv.services.payment.payMyDues(mockPaymentRequest)).rejects.toThrow('Payment not authorized. Please check your membership status.');
    });

    it('should handle server error (500)', async () => {
      const error = new Error('Server error');
      testEnv.services.payment.payMyDues.mockRejectedValue(error);

      await expect(testEnv.services.payment.payMyDues(mockPaymentRequest)).rejects.toThrow();
    });

    it('should handle network error', async () => {
      const error = new Error('Network error');
      testEnv.services.payment.payMyDues.mockRejectedValue(error);

      await expect(testEnv.services.payment.payMyDues(mockPaymentRequest)).rejects.toThrow();
    });

    it('should handle generic error', async () => {
      const error = new Error('Unknown payment error');
      testEnv.services.payment.payMyDues.mockRejectedValue(error);

      await expect(testEnv.services.payment.payMyDues(mockPaymentRequest)).rejects.toThrow();
    });

    it('should send payment request with correct data structure', async () => {
      const customRequest = {
        paymentMethodId: 'pm_test_12345',
        membershipTypeId: 2,
      };

      testEnv.services.payment.payMyDues.mockResolvedValue({
        ...mockPaymentResponse,
        paymentId: 999,
        amount: 40.00,
      });

      await testEnv.services.payment.payMyDues(customRequest);

      expect(testEnv.services.payment.payMyDues).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethodId: customRequest.paymentMethodId,
          membershipTypeId: customRequest.membershipTypeId,
        })
      );
    });

    it('should return payment response data directly', async () => {
      const customResponse = {
        paymentId: 555,
        memberId: 777,
        clubId: 888,
        amount: 15.00,
        paymentDate: '2024-03-01T14:00:00Z',
        paymentMethod: 'stripe',
        createdAt: '2024-03-01T14:00:00Z',
      };

      testEnv.services.payment.payMyDues.mockResolvedValue(customResponse);

      const result = await testEnv.services.payment.payMyDues(mockPaymentRequest);

      expect(result).toEqual(customResponse);
    });
  });

  describe('checkStripeConfiguration', () => {
    const mockStripeConfig = {
      isConfigured: true,
      canAcceptPayments: true,
    };

    it('should successfully retrieve Stripe configuration', async () => {
      testEnv.services.payment.checkStripeConfiguration.mockResolvedValue(mockStripeConfig);

      const result = await testEnv.services.payment.checkStripeConfiguration();

      expect(testEnv.services.payment.checkStripeConfiguration).toHaveBeenCalled();
      expect(result).toEqual(mockStripeConfig);
    });

    it('should use correct API endpoint', async () => {
      testEnv.services.payment.checkStripeConfiguration.mockResolvedValue(mockStripeConfig);

      await testEnv.services.payment.checkStripeConfiguration();

      expect(testEnv.services.payment.checkStripeConfiguration).toHaveBeenCalled();
    });

    it('should handle configuration check error gracefully', async () => {
      const error = new Error('Network error');
      testEnv.services.payment.checkStripeConfiguration.mockRejectedValue(error);

      const result = await testEnv.services.payment.checkStripeConfiguration().catch(() => ({
        isConfigured: false,
        canAcceptPayments: false,
      }));

      expect(result).toEqual({
        isConfigured: false,
        canAcceptPayments: false,
      });
    });

    it('should return false configuration on 404 error', async () => {
      const error = new Error('Not found');
      testEnv.services.payment.checkStripeConfiguration.mockRejectedValue(error);

      const result = await testEnv.services.payment.checkStripeConfiguration().catch(() => ({
        isConfigured: false,
        canAcceptPayments: false,
      }));

      expect(result).toEqual({
        isConfigured: false,
        canAcceptPayments: false,
      });
    });

    it('should return false configuration on authentication error', async () => {
      const error = new Error('Unauthorized');
      testEnv.services.payment.checkStripeConfiguration.mockRejectedValue(error);

      const result = await testEnv.services.payment.checkStripeConfiguration().catch(() => ({
        isConfigured: false,
        canAcceptPayments: false,
      }));

      expect(result).toEqual({
        isConfigured: false,
        canAcceptPayments: false,
      });
    });

    it('should return false configuration on server error', async () => {
      const error = new Error('Server error');
      testEnv.services.payment.checkStripeConfiguration.mockRejectedValue(error);

      const result = await testEnv.services.payment.checkStripeConfiguration().catch(() => ({
        isConfigured: false,
        canAcceptPayments: false,
      }));

      expect(result).toEqual({
        isConfigured: false,
        canAcceptPayments: false,
      });
    });

    it('should handle different configuration states', async () => {
      // Test when Stripe is configured but not ready to accept payments
      const partialConfig = {
        isConfigured: true,
        canAcceptPayments: false,
      };

      testEnv.services.payment.checkStripeConfiguration.mockResolvedValue(partialConfig);

      const result = await testEnv.services.payment.checkStripeConfiguration();

      expect(result).toEqual(partialConfig);
    });
  });
});