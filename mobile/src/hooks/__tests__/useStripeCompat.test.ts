import { renderHook, act } from '@testing-library/react-native';

// Mock platform utilities to simulate web platform (most testable scenario)
jest.mock('@/utils/platformUtils', () => ({
  isStripeNativeAvailable: jest.fn(() => false),
  shouldUseWebPayments: jest.fn(() => true),
}));

// Mock Stripe React Native (not loaded in web mode but needed for module resolution)
jest.mock('@stripe/stripe-react-native', () => ({
  useStripe: jest.fn(() => null),
}), { virtual: true });

import { useStripeCompat } from '../useStripeCompat';
import * as platformUtils from '@/utils/platformUtils';

describe('useStripeCompat', () => {
  const mockIsStripeNativeAvailable = platformUtils.isStripeNativeAvailable as jest.Mock;
  const mockShouldUseWebPayments = platformUtils.shouldUseWebPayments as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Web Platform (Default Test Environment)', () => {
    beforeEach(() => {
      mockIsStripeNativeAvailable.mockReturnValue(false);
      mockShouldUseWebPayments.mockReturnValue(true);
    });

    it('should return web platform indicator', () => {
      const { result } = renderHook(() => useStripeCompat());
      expect(result.current.platform).toBe('web');
    });

    it('should indicate availability on web', () => {
      const { result } = renderHook(() => useStripeCompat());
      expect(result.current.isAvailable).toBe(true);
    });

    it('should not have native Stripe instance on web', () => {
      const { result } = renderHook(() => useStripeCompat());
      expect(result.current.nativeStripe).toBeNull();
    });

    it('should return web payment error message when creating payment method', async () => {
      const { result } = renderHook(() => useStripeCompat());

      let response;
      await act(async () => {
        response = await result.current.createPaymentMethod({
          paymentMethodType: 'card',
        });
      });

      expect(response.paymentMethod).toBeNull();
      expect(response.error?.message).toContain('Web payments are not yet supported');
      expect(response.error?.message).toContain('Please use the mobile app');
    });

    it('should return web error for payment method with billing details', async () => {
      const { result } = renderHook(() => useStripeCompat());

      let response;
      await act(async () => {
        response = await result.current.createPaymentMethod({
          paymentMethodType: 'card',
          billingDetails: {
            name: 'Test User',
            email: 'test@example.com',
            phone: '+1234567890',
            address: {
              city: 'San Francisco',
              country: 'US',
              line1: '123 Main St',
              postalCode: '94102',
              state: 'CA',
            },
          },
        });
      });

      expect(response.paymentMethod).toBeNull();
      expect(response.error).toBeTruthy();
    });
  });

  describe('Fallback Platform (Neither Web nor Native)', () => {
    beforeEach(() => {
      mockIsStripeNativeAvailable.mockReturnValue(false);
      mockShouldUseWebPayments.mockReturnValue(false);
    });

    it('should return native platform indicator by default', () => {
      const { result } = renderHook(() => useStripeCompat());
      expect(result.current.platform).toBe('native');
    });

    it('should indicate not available when no platform support', () => {
      const { result } = renderHook(() => useStripeCompat());
      expect(result.current.isAvailable).toBe(false);
    });

    it('should return fallback error when creating payment method', async () => {
      const { result } = renderHook(() => useStripeCompat());

      let response;
      await act(async () => {
        response = await result.current.createPaymentMethod({
          paymentMethodType: 'card',
        });
      });

      expect(response.paymentMethod).toBeNull();
      expect(response.error?.message).toBe('Payment method creation not available on this platform');
    });
  });

  describe('Hook Behavior', () => {
    beforeEach(() => {
      mockIsStripeNativeAvailable.mockReturnValue(false);
      mockShouldUseWebPayments.mockReturnValue(true);
    });

    it('should maintain stable createPaymentMethod reference across renders', () => {
      const { result, rerender } = renderHook(() => useStripeCompat());
      const firstRef = result.current.createPaymentMethod;

      rerender({});

      expect(result.current.createPaymentMethod).toBe(firstRef);
    });

    it('should maintain stable isAvailable value across renders', () => {
      const { result, rerender } = renderHook(() => useStripeCompat());
      const firstValue = result.current.isAvailable;

      rerender({});

      expect(result.current.isAvailable).toBe(firstValue);
    });

    it('should maintain stable platform value across renders', () => {
      const { result, rerender } = renderHook(() => useStripeCompat());
      const firstValue = result.current.platform;

      rerender({});

      expect(result.current.platform).toBe(firstValue);
    });
  });

  describe('Platform Detection Integration', () => {
    it('should integrate with platform detection utilities', () => {
      // This test verifies that platform detection utilities are integrated
      // by checking that the hook responds to their values
      mockShouldUseWebPayments.mockReturnValue(true);
      const { result } = renderHook(() => useStripeCompat());
      expect(result.current.platform).toBe('web');
    });

    it('should call shouldUseWebPayments during payment method creation', async () => {
      mockShouldUseWebPayments.mockClear();

      const { result } = renderHook(() => useStripeCompat());

      await act(async () => {
        await result.current.createPaymentMethod({
          paymentMethodType: 'card',
        });
      });

      expect(mockShouldUseWebPayments).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockIsStripeNativeAvailable.mockReturnValue(false);
      mockShouldUseWebPayments.mockReturnValue(true);
    });

    it('should always return an error object with message', async () => {
      const { result } = renderHook(() => useStripeCompat());

      let response;
      await act(async () => {
        response = await result.current.createPaymentMethod({});
      });

      expect(response).toHaveProperty('error');
      expect(response.error).toHaveProperty('message');
      expect(typeof response.error?.message).toBe('string');
    });

    it('should always have null paymentMethod on web', async () => {
      const { result } = renderHook(() => useStripeCompat());

      let response;
      await act(async () => {
        response = await result.current.createPaymentMethod({
          paymentMethodType: 'card',
        });
      });

      expect(response.paymentMethod).toBeNull();
    });
  });
});
