import apiClient from './apiClient';
import { ErrorHandler } from '@/lib/errorHandler';

export interface BillingStatus {
  currentTier: string; // "Grow", "Expand", or legacy "Unlimited"
  hasActiveSubscription: boolean;
  memberCount: number;
  memberLimit: number;
  nextBillingDate?: string;
  canUpgrade: boolean;
  subscriptionId?: string;
  subscriptionStatus?: string;
  billingCycle?: string;
  appliedPromotionName?: string;
  activeDiscountDescription?: string;
  trialStatus?: 'inactive' | 'trialing' | 'expired' | 'active';
  trialEndsAt?: string;
  requiresPaymentSetup?: boolean;
  accountLocked?: boolean;
  canAccessApp?: boolean;
}

export interface UpgradeSubscriptionRequest {
  planId: string;
  paymentMethodId: string;
  targetTier: string;
  billingCycle: string;
  promoCode?: string;
}

export interface UpgradeSubscriptionResponse {
  subscriptionId: string;
  newTier: string;
  nextBillingDate: string;
  status: string;
  message: string;
  appliedPromotionName?: string;
  appliedDiscountDescription?: string;
}

export interface ClaimTrialRequest {
  paymentMethodId: string;
  targetTier: string;
  billingCycle?: string;
}

export interface ClaimTrialResponse {
  success: boolean;
  message: string;
  subscriptionId?: string;
  trialEndsAt?: string;
}

export interface CustomerPortalSessionResponse {
  url: string;
}

export interface PromotionInfo {
  promotionId: number;
  name: string;
  description?: string;
  promoCode?: string;
  discountType?: string;
  percentOff?: number;
  amountOff?: number;
  currency?: string;
  duration?: string;
  durationInMonths?: number;
  discountDescription: string;
}

export interface ActivePromotionResponse {
  hasActivePromotion: boolean;
  promotion?: PromotionInfo;
  redemptionsRemaining?: number;
}

export interface ValidatePromoCodeResponse {
  isValid: boolean;
  errorMessage?: string;
  promotion?: PromotionInfo;
}

class BillingService {
  private readonly baseUrl = '/billing';

  /**
   * Get member limit for a specific tier
   * Get member limit for a specific tier.
   */
  getMemberLimitForTier(tier: string): number {
    switch (tier) {
      case 'Seed':
        return 100;
      case 'Grow':
        return 200;
      case 'Unlimited':
      case 'Expand':
        return 2000;
      default:
        return 200; // Default to Grow limits
    }
  }

  /**
   * Check if tier is the top paid plan.
   */
  isUnlimitedTier(tier: string): boolean {
    return tier === 'Unlimited' || tier === 'Expand';
  }

  /**
   * Validate member count against tier limits
   * US-002: Enforce top-plan member limit.
   */
  canAddMembers(currentCount: number, tier: string, additionalMembers: number = 1): boolean {
    const limit = this.getMemberLimitForTier(tier);
    return (currentCount + additionalMembers) <= limit;
  }

  async getBillingStatus(): Promise<BillingStatus> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/status`);
      const data = response.data;
      
      // US-002: Ensure member limit is correct for the tier
      if (data.currentTier) {
        data.memberLimit = this.getMemberLimitForTier(data.currentTier);
      }
      
      return data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading billing information',
        action: 'Please try refreshing the page or contact support@gathergrove.club',
        customMessages: {
          403: 'You do not have permission to view billing information',
          404: 'Billing information not found for your account'
        }
      });
    }
  }

  async upgradeSubscription(request: UpgradeSubscriptionRequest): Promise<UpgradeSubscriptionResponse> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/upgrade`, request);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'upgrading subscription',
        action: 'Please check your payment method and try again',
        customMessages: {
          400: 'Invalid subscription plan or payment method',
          402: 'Payment failed. Please check your payment method and try again',
          403: 'You do not have permission to upgrade the subscription',
          409: 'A subscription change is already in progress. Please wait and try again'
        }
      });
    }
  }

  async claimTrial(request: ClaimTrialRequest): Promise<ClaimTrialResponse> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/claim-trial`, request);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'claiming trial',
        action: 'Please add a payment method and try again',
        customMessages: {
          400: 'Unable to claim trial. Please ensure a payment method is provided.',
          403: 'You do not have permission to claim this trial'
        }
      });
    }
  }

  async createCustomerPortalSession(): Promise<CustomerPortalSessionResponse> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/customer-portal-session`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'opening billing portal',
        action: 'Please try again',
        customMessages: {
          403: 'You do not have permission to manage billing',
        }
      });
    }
  }

  async cancelSubscription(): Promise<{ message: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/cancel`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'cancelling subscription',
        action: 'Please try again or contact support@gathergrove.club if you need assistance',
        customMessages: {
          403: 'You do not have permission to cancel the subscription',
          404: 'No active subscription found to cancel',
          409: 'Subscription cannot be cancelled at this time'
        }
      });
    }
  }

  // Method to get Stripe publishable key (this would typically come from environment variables)
  getStripePublishableKey(): string {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  }

  /**
   * Get the current active auto-apply promotion if one exists
   */
  async getActivePromotion(): Promise<ActivePromotionResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/active-promotion`);
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'loading promotion information',
        action: 'Please try refreshing the page'
      });
    }
  }

  /**
   * Validate a promo code and get the associated promotion details
   */
  async validatePromoCode(promoCode: string): Promise<ValidatePromoCodeResponse> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/validate-promo`, { promoCode });
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error, {
        context: 'validating promo code',
        action: 'Please check the code and try again'
      });
    }
  }
}

export const billingService = new BillingService(); 
