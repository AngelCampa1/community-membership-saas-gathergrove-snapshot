import { billingService } from '../billingService';
import apiClient from '../apiClient';
import type { BillingStatus, UpgradeSubscriptionRequest, UpgradeSubscriptionResponse } from '../billingService';

// Mock the apiClient
jest.mock('../apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('billingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMemberLimitForTier', () => {
    it('should default unknown tiers to Grow limits', () => {
      expect(billingService.getMemberLimitForTier('Unknown')).toBe(200);
    });

    it('should return 100 for Seed tier', () => {
      expect(billingService.getMemberLimitForTier('Seed')).toBe(100);
    });

    it('should return 200 for Grow tier', () => {
      expect(billingService.getMemberLimitForTier('Grow')).toBe(200);
    });

    it('should return 2,000 for Expand and legacy Unlimited tiers', () => {
      expect(billingService.getMemberLimitForTier('Expand')).toBe(2000);
      expect(billingService.getMemberLimitForTier('Unlimited')).toBe(2000);
    });

    it('should return 200 for unknown tier (default)', () => {
      expect(billingService.getMemberLimitForTier('Unknown')).toBe(200);
      expect(billingService.getMemberLimitForTier('')).toBe(200);
    });
  });

  describe('isUnlimitedTier', () => {
    it('should return true for Expand and legacy Unlimited tiers', () => {
      expect(billingService.isUnlimitedTier('Expand')).toBe(true);
      expect(billingService.isUnlimitedTier('Unlimited')).toBe(true);
    });

    it('should return false for non-Unlimited tiers', () => {
      expect(billingService.isUnlimitedTier('Grow')).toBe(false);
      expect(billingService.isUnlimitedTier('Unknown')).toBe(false);
      expect(billingService.isUnlimitedTier('')).toBe(false);
    });
  });

  describe('canAddMembers', () => {
    it('should enforce the Expand cap for Expand and legacy Unlimited tiers', () => {
      expect(billingService.canAddMembers(1000, 'Expand', 1000)).toBe(true);
      expect(billingService.canAddMembers(2000, 'Expand', 1)).toBe(false);
      expect(billingService.canAddMembers(0, 'Unlimited', 1)).toBe(true);
      expect(billingService.canAddMembers(1999, 'Unlimited', 2)).toBe(false);
    });

    it('should apply Grow-equivalent limits for unknown tier', () => {
      expect(billingService.canAddMembers(199, 'Unknown', 1)).toBe(true);
      expect(billingService.canAddMembers(200, 'Unknown', 1)).toBe(false);
      expect(billingService.canAddMembers(195, 'Unknown', 5)).toBe(true);
      expect(billingService.canAddMembers(196, 'Unknown', 5)).toBe(false);
    });

    it('should check limits for Grow tier', () => {
      expect(billingService.canAddMembers(199, 'Grow', 1)).toBe(true);
      expect(billingService.canAddMembers(200, 'Grow', 1)).toBe(false);
    });

    it('should default to 1 additional member if not specified', () => {
      expect(billingService.canAddMembers(199, 'Grow')).toBe(true);
      expect(billingService.canAddMembers(200, 'Grow')).toBe(false);
    });
  });

  describe('getStripePublishableKey', () => {
    const originalEnv = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = originalEnv;
      } else {
        delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      }
    });

    it('should return the Stripe publishable key from env', () => {
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
      expect(billingService.getStripePublishableKey()).toBe('pk_test_123');
    });

    it('should return empty string if env variable is not set', () => {
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      expect(billingService.getStripePublishableKey()).toBe('');
    });
  });

  describe('getActivePromotion', () => {
    it('should fetch active promotion successfully', async () => {
      const mockResponse = {
        hasActivePromotion: true,
        promotion: {
          promotionId: 1,
          name: 'Test Promo',
          discountDescription: '20% off'
        }
      };
      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await billingService.getActivePromotion();

      expect(result).toEqual(mockResponse);
      expect(mockApiClient.get).toHaveBeenCalledWith('/billing/active-promotion');
    });

    it('should handle errors when fetching active promotion', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(billingService.getActivePromotion()).rejects.toThrow('Network error');
    });
  });

  describe('validatePromoCode', () => {
    it('should validate promo code successfully', async () => {
      const mockResponse = {
        isValid: true,
        promotion: {
          promotionId: 1,
          name: 'Test Promo',
          discountDescription: '20% off'
        }
      };
      mockApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await billingService.validatePromoCode('TESTCODE');

      expect(result).toEqual(mockResponse);
      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/validate-promo', { promoCode: 'TESTCODE' });
    });

    it('should return invalid for bad promo code', async () => {
      const mockResponse = {
        isValid: false,
        errorMessage: 'Invalid promo code'
      };
      mockApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await billingService.validatePromoCode('BADCODE');

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Invalid promo code');
    });

    it('should handle errors when validating promo code', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      await expect(billingService.validatePromoCode('CODE')).rejects.toThrow('Network error');
    });
  });

  describe('getBillingStatus', () => {
    it('should return billing status successfully', async () => {
      // Arrange
      const mockResponse: BillingStatus = {
        currentTier: 'Grow',
        hasActiveSubscription: false,
        memberCount: 5,
        memberLimit: 200,
        nextBillingDate: undefined,
        canUpgrade: true,
        subscriptionId: undefined,
        subscriptionStatus: undefined,
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      // Act
      const result = await billingService.getBillingStatus();

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockApiClient.get).toHaveBeenCalledWith('/billing/status');
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      const networkError = new Error('Network error');
      mockApiClient.get.mockRejectedValue(networkError);

      // Act & Assert
      await expect(billingService.getBillingStatus()).rejects.toThrow('Network error');
      expect(mockApiClient.get).toHaveBeenCalledWith('/billing/status');
    });

    it('should handle API errors with proper error message', async () => {
      // Arrange
      const apiError = {
        response: {
          status: 400,
          data: { message: 'Club not found' }
        }
      };
      mockApiClient.get.mockRejectedValue(apiError);

      // Act & Assert
      await expect(billingService.getBillingStatus()).rejects.toThrow('Error loading billing information: Club not found');
      expect(mockApiClient.get).toHaveBeenCalledWith('/billing/status');
    });

    it('should return correct status for Grow tier', async () => {
      // Arrange
      const mockResponse: BillingStatus = {
        currentTier: 'Grow',
        hasActiveSubscription: true,
        memberCount: 75,
        memberLimit: 2147483647, // int.MaxValue
        nextBillingDate: '2024-02-01T00:00:00Z',
        canUpgrade: false,
        subscriptionId: 'sub_test123',
        subscriptionStatus: 'active',
      };

      mockApiClient.get.mockResolvedValue({ data: mockResponse });

      // Act
      const result = await billingService.getBillingStatus();

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.currentTier).toBe('Grow');
      expect(result.hasActiveSubscription).toBe(true);
      expect(result.canUpgrade).toBe(false);
      expect(result.subscriptionId).toBe('sub_test123');
    });
  });

  describe('upgradeSubscription', () => {
    it('should upgrade subscription successfully', async () => {
      // Arrange
      const request: UpgradeSubscriptionRequest = {
        planId: 'price_grow_monthly',
        paymentMethodId: 'pm_test123',
        targetTier: 'Grow',
        billingCycle: 'monthly',
      };

      const mockResponse: UpgradeSubscriptionResponse = {
        subscriptionId: 'sub_new123',
        newTier: 'Grow',
        nextBillingDate: '2024-02-01T00:00:00Z',
        status: 'active',
        message: 'Subscription upgraded successfully',
      };

      mockApiClient.post.mockResolvedValue({ data: mockResponse });

      // Act
      const result = await billingService.upgradeSubscription(request);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/upgrade', request);
      expect(mockApiClient.post).toHaveBeenCalledTimes(1);
    });

    it('should handle payment method errors', async () => {
      // Arrange
      const request: UpgradeSubscriptionRequest = {
        planId: 'price_grow_monthly',
        paymentMethodId: 'pm_invalid',
        targetTier: 'Grow',
        billingCycle: 'monthly',
      };

      const paymentError = {
        response: {
          status: 400,
          data: { message: 'Invalid payment method' }
        }
      };
      mockApiClient.post.mockRejectedValue(paymentError);

      // Act & Assert
      await expect(billingService.upgradeSubscription(request)).rejects.toThrow('Error upgrading subscription: Invalid subscription plan or payment method');
      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/upgrade', request);
    });

    it('should handle subscription already exists error', async () => {
      // Arrange
      const request: UpgradeSubscriptionRequest = {
        planId: 'price_grow_monthly',
        paymentMethodId: 'pm_test123',
        targetTier: 'Grow',
        billingCycle: 'monthly',
      };

      const subscriptionError = {
        response: {
          status: 400,
          data: { message: 'Club is already on the Grow tier' }
        }
      };
      mockApiClient.post.mockRejectedValue(subscriptionError);

      // Act & Assert
      await expect(billingService.upgradeSubscription(request)).rejects.toThrow('Error upgrading subscription: Invalid subscription plan or payment method');
      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/upgrade', request);
    });

    it('should handle server errors during upgrade', async () => {
      // Arrange
      const request: UpgradeSubscriptionRequest = {
        planId: 'price_grow_monthly',
        paymentMethodId: 'pm_test123',
        targetTier: 'Grow',
        billingCycle: 'monthly',
      };

      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };
      mockApiClient.post.mockRejectedValue(serverError);

      // Act & Assert
      await expect(billingService.upgradeSubscription(request)).rejects.toThrow('Internal server error');
      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/upgrade', request);
    });

    it('should handle Stripe API errors', async () => {
      // Arrange
      const request: UpgradeSubscriptionRequest = {
        planId: 'price_grow_monthly',
        paymentMethodId: 'pm_test123',
        targetTier: 'Grow',
        billingCycle: 'monthly',
      };

      const stripeError = {
        response: {
          status: 402,
          data: { message: 'Your card was declined' }
        }
      };
      mockApiClient.post.mockRejectedValue(stripeError);

      // Act & Assert
      await expect(billingService.upgradeSubscription(request)).rejects.toThrow('Error upgrading subscription: Payment failed. Please check your payment method and try again');
      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/upgrade', request);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      // Arrange
      mockApiClient.post.mockResolvedValue({ data: {} });

      // Act
      await billingService.cancelSubscription();

      // Assert
      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/cancel');
      expect(mockApiClient.post).toHaveBeenCalledTimes(1);
    });

    it('should handle no active subscription error', async () => {
      // Arrange
      const noSubscriptionError = {
        response: {
          status: 400,
          data: { message: 'No active subscription to cancel' }
        }
      };
      mockApiClient.post.mockRejectedValue(noSubscriptionError);

      // Act & Assert
      await expect(billingService.cancelSubscription()).rejects.toThrow('Error cancelling subscription: No active subscription to cancel');
      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/cancel');
    });

    it('should handle Stripe cancellation errors', async () => {
      // Arrange
      const stripeError = {
        response: {
          status: 500,
          data: { message: 'Failed to cancel subscription in Stripe' }
        }
      };
      mockApiClient.post.mockRejectedValue(stripeError);

      // Act & Assert
      await expect(billingService.cancelSubscription()).rejects.toThrow('Failed to cancel subscription in Stripe');
      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/cancel');
    });

    it('should handle unauthorized access during cancellation', async () => {
      // Arrange
      const unauthorizedError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };
      mockApiClient.post.mockRejectedValue(unauthorizedError);

      // Act & Assert
      await expect(billingService.cancelSubscription()).rejects.toThrow('Error cancelling subscription: Unauthorized');
      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/cancel');
    });
  });

  describe('claimTrial', () => {
    it('posts paymentMethodId and targetTier to claim-trial endpoint', async () => {
      const mockResponse = {
        success: true,
        message: '30-day trial claimed',
        subscriptionId: 'sub_123',
        trialEndsAt: '2026-04-15T00:00:00Z'
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const request = { paymentMethodId: 'pm_test_abc', targetTier: 'Grow', billingCycle: 'monthly' };
      const result = await billingService.claimTrial(request);

      expect(apiClient.post).toHaveBeenCalledWith('/billing/claim-trial', request);
      expect(result).toEqual(mockResponse);
    });

    it('posts with Expand tier when specified', async () => {
      const mockResponse = { success: true, message: 'trial claimed', subscriptionId: 'sub_456', trialEndsAt: null };
      (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const request = { paymentMethodId: 'pm_test_xyz', targetTier: 'Expand', billingCycle: 'annual' };
      await billingService.claimTrial(request);

      expect(apiClient.post).toHaveBeenCalledWith('/billing/claim-trial', request);
    });
  });

  describe('API integration', () => {
    it('should use correct base URL for all requests', async () => {
      // Arrange
      mockApiClient.get.mockResolvedValue({ data: {} });
      mockApiClient.post.mockResolvedValue({ data: {} });

      // Act
      await billingService.getBillingStatus();
      await billingService.upgradeSubscription({ planId: 'test', paymentMethodId: 'test', targetTier: 'Grow', billingCycle: 'monthly' });
      await billingService.cancelSubscription();

      // Assert
      expect(mockApiClient.get).toHaveBeenCalledWith('/billing/status');
      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/upgrade', { planId: 'test', paymentMethodId: 'test', targetTier: 'Grow', billingCycle: 'monthly' });
      expect(mockApiClient.post).toHaveBeenCalledWith('/billing/cancel');
    });

    it('should handle concurrent API calls correctly', async () => {
      // Arrange
      const mockBillingStatus: BillingStatus = {
        currentTier: 'Grow',
        hasActiveSubscription: false,
        memberCount: 5,
        memberLimit: 200,
        canUpgrade: true,
      };

      mockApiClient.get.mockResolvedValue({ data: mockBillingStatus });

      // Act
      const promises = [
        billingService.getBillingStatus(),
        billingService.getBillingStatus(),
        billingService.getBillingStatus(),
      ];
      
      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toEqual(mockBillingStatus);
      });
      expect(mockApiClient.get).toHaveBeenCalledTimes(3);
    });
  });
}); 
