/**
 * Platform-aware Stripe provider wrapper
 * Provides Stripe functionality on native platforms and graceful degradation on web
 */
import React, { ReactNode } from 'react';
import { isStripeNativeAvailable } from '@/utils/platformUtils';

interface StripeProviderWrapperProps {
  children: ReactNode;
  publishableKey?: string;
  merchantIdentifier?: string;
}

// Web-compatible fallback provider
const WebStripeProvider: React.FC<StripeProviderWrapperProps> = ({ children }) => {
  return <>{children}</>;
};

// Native Stripe provider (lazy-loaded to avoid web import issues)
let NativeStripeProvider: React.ComponentType<StripeProviderWrapperProps> | null = null;

if (isStripeNativeAvailable()) {
  try {
    const { StripeProvider } = require('@stripe/stripe-react-native');
    NativeStripeProvider = StripeProvider;
  } catch (error) {
    NativeStripeProvider = null;
  }
}

export const StripeProviderWrapper: React.FC<StripeProviderWrapperProps> = ({
  children,
  publishableKey,
  merchantIdentifier,
}) => {
  // Use native provider if available and we have a publishable key
  if (NativeStripeProvider && publishableKey && isStripeNativeAvailable()) {
    return (
      <NativeStripeProvider
        publishableKey={publishableKey}
        merchantIdentifier={merchantIdentifier}
      >
        {children}
      </NativeStripeProvider>
    );
  }

  // Fall back to web-compatible provider
  return <WebStripeProvider>{children}</WebStripeProvider>;
};