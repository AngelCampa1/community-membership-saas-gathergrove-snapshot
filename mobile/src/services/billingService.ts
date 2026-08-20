import axios, { AxiosInstance } from 'axios';
import { authService } from './authService';
import { API_CONFIG, ERROR_MESSAGES } from '@/constants';
import { NetworkSecurity } from '@/utils/security';
import * as Sentry from '@sentry/react-native';

export interface BillingStatus {
  currentTier: string;
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
  private axiosInstance: AxiosInstance;
  private readonly baseUrl = '/api/v1/billing';

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...NetworkSecurity.getSecureHeaders(),
      },
    });

    this.setupRequestInterceptor();
  }

  private setupRequestInterceptor(): void {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await authService.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Track billing events to Application Insights
   * @private
   */
  private trackBillingEvent(eventName: string, properties: Record<string, unknown>): void {
    if (__DEV__) return;

    try {
      Sentry.addBreadcrumb({
        category: 'billing',
        message: eventName,
        data: properties,
        level: 'info',
      });
    } catch {
      // Never let telemetry crash the app
    }
  }

  /**
   * Track billing exceptions to Sentry
   * @private
   */
  private trackBillingException(error: unknown, context: string, additionalProps?: Record<string, unknown>): void {
    if (__DEV__) return;

    try {
      Sentry.withScope((scope) => {
        scope.setContext('billing', { context: `billing.${context}`, ...additionalProps });
        const errorToTrack = error instanceof Error ? error : new Error(String(error));
        Sentry.captureException(errorToTrack);
      });
    } catch {
      // Never let telemetry crash the app
    }
  }

  /**
   * Get member limit for a specific tier
   */
  getMemberLimitForTier(tier: string): number {
    switch (tier) {
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
   * Check if tier is the top paid plan
   */
  isUnlimitedTier(tier: string): boolean {
    return tier === 'Unlimited' || tier === 'Expand';
  }

  /**
   * Validate member count against tier limits
   */
  canAddMembers(currentCount: number, tier: string, additionalMembers: number = 1): boolean {
    const limit = this.getMemberLimitForTier(tier);
    return (currentCount + additionalMembers) <= limit;
  }

  /**
   * Get current billing status
   */
  async getBillingStatus(): Promise<BillingStatus> {
    try {
      const response = await this.axiosInstance.get<BillingStatus>(`${this.baseUrl}/status`);
      const data = response.data;

      // Ensure member limit is correct for the tier
      if (data.currentTier) {
        data.memberLimit = this.getMemberLimitForTier(data.currentTier);
      }

      // Track billing status retrieval
      this.trackBillingEvent('billing.status_retrieved', {
        currentTier: data.currentTier,
        hasActiveSubscription: data.hasActiveSubscription,
        memberCount: data.memberCount,
        memberLimit: data.memberLimit,
        canUpgrade: data.canUpgrade,
        ...(data.subscriptionStatus && { subscriptionStatus: data.subscriptionStatus }),
        ...(data.billingCycle && { billingCycle: data.billingCycle }),
      });

      return data;
    } catch (error) {
      // Track status retrieval failure
      this.trackBillingException(error, 'status_retrieval_failed');

      throw this.handleApiError(error, 'loading billing information');
    }
  }

  /**
   * Upgrade subscription to a new plan
   */
  async upgradeSubscription(request: UpgradeSubscriptionRequest): Promise<UpgradeSubscriptionResponse> {
    try {
      const response = await this.axiosInstance.post<UpgradeSubscriptionResponse>(
        `${this.baseUrl}/upgrade`,
        request
      );

      const data = response.data;

      // Track successful subscription upgrade
      this.trackBillingEvent('billing.subscription_upgrade', {
        targetTier: request.targetTier,
        billingCycle: request.billingCycle,
        planId: request.planId,
        newTier: data.newTier,
        subscriptionId: data.subscriptionId,
        ...(request.promoCode && { promoCode: request.promoCode }),
        ...(data.appliedPromotionName && { appliedPromotionName: data.appliedPromotionName }),
        ...(data.appliedDiscountDescription && { appliedDiscountDescription: data.appliedDiscountDescription }),
      });

      return data;
    } catch (error) {
      // Track upgrade failure
      this.trackBillingException(error, 'upgrade_failed', {
        targetTier: request.targetTier,
        billingCycle: request.billingCycle,
      });

      throw this.handleApiError(error, 'upgrading subscription');
    }
  }

  /**
   * Cancel current subscription
   */
  async cancelSubscription(): Promise<{ message: string }> {
    try {
      const response = await this.axiosInstance.post<{ message: string }>(`${this.baseUrl}/cancel`);

      const data = response.data;

      // Track successful cancellation
      // Note: We don't have subscriptionId or tier in the response,
      // but this event still tracks that a cancellation occurred
      this.trackBillingEvent('billing.subscription_cancelled', {
        message: data.message,
      });

      return data;
    } catch (error) {
      // Track cancellation failure
      this.trackBillingException(error, 'cancellation_failed');

      throw this.handleApiError(error, 'cancelling subscription');
    }
  }

  /**
   * Get the current active auto-apply promotion if one exists
   */
  async getActivePromotion(): Promise<ActivePromotionResponse> {
    try {
      const response = await this.axiosInstance.get<ActivePromotionResponse>(
        `${this.baseUrl}/active-promotion`
      );

      const data = response.data;

      // Track active promotion retrieval
      this.trackBillingEvent('billing.active_promotion_retrieved', {
        hasActivePromotion: data.hasActivePromotion,
        ...(data.redemptionsRemaining !== undefined && { redemptionsRemaining: data.redemptionsRemaining }),
        ...(data.promotion && {
          promotionName: data.promotion.name,
          discountType: data.promotion.discountType,
          percentOff: data.promotion.percentOff,
          amountOff: data.promotion.amountOff,
          duration: data.promotion.duration,
        }),
      });

      return data;
    } catch (error) {
      // Track promotion retrieval failure
      this.trackBillingException(error, 'promotion_retrieval_failed');

      throw this.handleApiError(error, 'loading promotion information');
    }
  }

  /**
   * Validate a promo code and get the associated promotion details
   */
  async validatePromoCode(promoCode: string): Promise<ValidatePromoCodeResponse> {
    try {
      // Normalize promo code: trim whitespace and convert to uppercase
      const normalizedCode = promoCode.trim().toUpperCase();

      const response = await this.axiosInstance.post<ValidatePromoCodeResponse>(
        `${this.baseUrl}/validate-promo`,
        { promoCode: normalizedCode }
      );

      const data = response.data;

      // Track promo code validation result
      if (data.isValid && data.promotion) {
        // Valid promo code
        this.trackBillingEvent('billing.promo_code_validated', {
          promoCode: normalizedCode,
          discountType: data.promotion.discountType,
          percentOff: data.promotion.percentOff,
          amountOff: data.promotion.amountOff,
          duration: data.promotion.duration,
          durationInMonths: data.promotion.durationInMonths,
          promotionName: data.promotion.name,
        });
      } else {
        // Invalid promo code
        this.trackBillingEvent('billing.promo_code_invalid', {
          promoCode: normalizedCode,
          errorMessage: data.errorMessage || 'Promo code is invalid',
        });
      }

      return data;
    } catch (error) {
      // Track validation failure (API error)
      this.trackBillingException(error, 'promo_validation_failed', {
        promoCode: promoCode.trim().toUpperCase(),
      });

      throw this.handleApiError(error, 'validating promo code');
    }
  }

  /**
   * Handle API errors and convert to user-friendly messages
   */
  private handleApiError(error: unknown, context: string): Error {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } } };
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message;

      switch (status) {
        case 400:
          return new Error(message || 'Invalid request. Please check your information.');
        case 401:
          return new Error('Your session has expired. Please log in again.');
        case 402:
          return new Error('Payment failed. Please check your payment method and try again.');
        case 403:
          return new Error(`You do not have permission for ${context}.`);
        case 404:
          return new Error('Resource not found.');
        case 409:
          return new Error('A subscription change is already in progress. Please wait and try again.');
        case 500:
        default:
          return new Error(message || ERROR_MESSAGES.GENERIC_ERROR);
      }
    }

    return new Error(ERROR_MESSAGES.GENERIC_ERROR);
  }
}

export const billingService = new BillingService();
