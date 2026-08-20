/**
 * Platform-compatible Stripe hooks
 * Provides Stripe functionality on native platforms and web-compatible alternatives
 */
import { useCallback, useMemo } from 'react';
import { isStripeNativeAvailable, shouldUseWebPayments } from '@/utils/platformUtils';

// Import types from Stripe React Native
type CreatePaymentMethodResult = {
  paymentMethod: { id: string } | null;
  error: { message: string } | null;
};

type PaymentMethodCreateParams = {
  paymentMethodType?: string;
  paymentMethodData?: Record<string, unknown>;
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      city?: string;
      country?: string;
      line1?: string;
      line2?: string;
      postalCode?: string;
      state?: string;
    };
  };
  [key: string]: unknown;
};

// Define the return type of useStripe from @stripe/stripe-react-native
type StripeNativeHook = {
  createPaymentMethod: (params: PaymentMethodCreateParams) => Promise<CreatePaymentMethodResult>;
  [key: string]: unknown;
};

// MOCK-01 fix: Web payment method creation - requires Stripe.js integration
const createWebPaymentMethod = async (): Promise<CreatePaymentMethodResult> => {
  // Web payments require Stripe.js integration
  // This is not a mock - web payments are genuinely not supported without Stripe.js
  if (__DEV__) {
    console.warn('[StripeCompat] Web payments require Stripe.js integration. See: https://stripe.com/docs/js');
  }

  return {
    paymentMethod: null,
    error: {
      message: 'Web payments are not yet supported. Please use the mobile app for payment processing, or contact support for assistance.',
    },
  };
};

// Native Stripe hook (lazy-loaded)
let useStripeNative: (() => StripeNativeHook) | null = null;

if (isStripeNativeAvailable()) {
  try {
    const { useStripe } = require('@stripe/stripe-react-native');
    useStripeNative = useStripe;
  } catch (error) {
    // Native Stripe hooks not available
    useStripeNative = null;
  }
}

/**
 * Platform-compatible useStripe hook
 */
export const useStripeCompat = () => {
  const nativeStripe = useStripeNative?.() || null;

  const createPaymentMethod = useCallback(
    async (params: PaymentMethodCreateParams): Promise<CreatePaymentMethodResult> => {
      if (shouldUseWebPayments()) {
        // Web-compatible implementation
        // Using web payment method creation
        return createWebPaymentMethod();
      }

      // Use native Stripe implementation
      if (nativeStripe?.createPaymentMethod) {
        return nativeStripe.createPaymentMethod(params);
      }

      // Fallback error
      return {
        paymentMethod: null,
        error: {
          message: 'Payment method creation not available on this platform',
        },
      };
    },
    [nativeStripe]
  );

  const isAvailable = useMemo(() => {
    return shouldUseWebPayments() || (nativeStripe !== null);
  }, [nativeStripe]);

  return {
    createPaymentMethod,
    isAvailable,
    platform: shouldUseWebPayments() ? 'web' : 'native',
    nativeStripe,
  };
};