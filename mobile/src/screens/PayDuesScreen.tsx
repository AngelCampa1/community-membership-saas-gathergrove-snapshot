import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import { paymentService } from '@/services/paymentService';
import { useStripeCompat } from '@/hooks/useStripeCompat';
import { CardFieldWrapper } from '@/components/CardFieldWrapper';
import { shouldUseWebPayments } from '@/utils/platformUtils';
import type { PayMyDuesRequest, StripeConfigResponse } from '@/services/paymentService';

interface RouteParams {
  membershipType: {
    id: number;
    name: string;
    duesAmount: number;
    duesFrequency: string;
  };
  duesPaidUntil?: string;
}

interface CardDetails {
  complete: boolean;
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardNumber?: string;
  expiryDate?: string;
  cvc?: string;
  postalCode?: string;
}

interface ThemeColors {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  text: {
    primary: string;
    secondary: string;
    inverse: string;
  };
  interactive: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  border: {
    primary: string;
  };
  status: {
    success: string;
    error: string;
    warning: string;
    successBackground: string;
    errorBackground: string;
    warningBackground?: string;
  };
  shadow: {
    small: object;
  };
}

export const PayDuesScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  // Validate route parameters at runtime
  const validateRouteParams = (params: unknown): params is RouteParams => {
    return (
      params !== null &&
      typeof params === 'object' &&
      'membershipType' in params &&
      params.membershipType !== null &&
      typeof params.membershipType === 'object' &&
      'id' in params.membershipType &&
      typeof params.membershipType.id === 'number' &&
      'name' in params.membershipType &&
      typeof params.membershipType.name === 'string' &&
      'duesAmount' in params.membershipType &&
      typeof params.membershipType.duesAmount === 'number' &&
      'duesFrequency' in params.membershipType &&
      typeof params.membershipType.duesFrequency === 'string'
    );
  };

  const isValidParams = validateRouteParams(route.params);
  const { membershipType, duesPaidUntil } = isValidParams ? route.params : { membershipType: null, duesPaidUntil: null };
  const { user } = useAuth();
  const { createPaymentMethod } = useStripeCompat();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardDetails, setCardDetails] = useState<CardDetails | null>(null);
  const [stripeConfigLoading, setStripeConfigLoading] = useState(true);
  const [stripeConfig, setStripeConfig] = useState<StripeConfigResponse | null>(null);

  // Check Stripe configuration on component mount
  // MEM-01 fix: Added isMounted check to prevent state updates on unmounted component
  useEffect(() => {
    let isMounted = true;

    const checkStripeConfig = async () => {
      try {
        if (!isMounted) return;
        setStripeConfigLoading(true);
        const config = await paymentService.checkStripeConfiguration();
        if (!isMounted) return;
        setStripeConfig(config);
      } catch (error) {
        if (!isMounted) return;
        setStripeConfig({
          isConfigured: false,
          canAcceptPayments: false,
        });
      } finally {
        if (isMounted) {
          setStripeConfigLoading(false);
        }
      }
    };

    checkStripeConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  // Early return if required data is missing
  if (!membershipType || !user?.user?.clubId) {
    return (
      <View style={styles.container} testID="screen-pay-dues">
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} testID="text-pay-dues-title">
              Pay Membership Dues
            </Text>
            <Text style={styles.subtitle} testID="text-pay-dues-subtitle">
              Secure online payment
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Error</Text>
            <Text style={styles.summaryLabel}>
              {!membershipType ? 'Membership information is missing.' : 'User information is missing.'}
            </Text>
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => navigation.goBack()}
              testID="button-go-back"
            >
              <Text style={styles.payButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  /**
   * Format currency for display
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };


  /**
   * Get the dues status message
   */
  const getDuesStatusMessage = (): { text: string; color: string } => {
    // For $0 membership types, there are no dues to track
    if (membershipType.duesAmount === 0) {
      return { text: 'No dues required', color: colors.status.success };
    }

    if (!duesPaidUntil) {
      return { text: 'Dues payment required', color: colors.status.error };
    }

    const duesDate = new Date(duesPaidUntil);
    const today = new Date();
    const daysDiff = Math.ceil((duesDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
      return { text: 'Dues expired', color: colors.status.error };
    } else if (daysDiff <= 30) {
      return { text: 'Dues expiring soon', color: colors.status.warning };
    } else {
      return { text: 'Dues current', color: colors.status.success };
    }
  };

  /**
   * Calculate new dues expiration date (avoiding date mutation)
   */
  const getNewExpirationDate = (): string => {
    const today = new Date();
    const currentExpiration = duesPaidUntil ? new Date(duesPaidUntil) : today;
    const startDate = new Date(currentExpiration > today ? currentExpiration : today);

    switch (membershipType.duesFrequency.toLowerCase()) {
      case 'weekly':
        startDate.setDate(startDate.getDate() + 7);
        return startDate.toLocaleDateString();
      case 'biweekly':
        startDate.setDate(startDate.getDate() + 14);
        return startDate.toLocaleDateString();
      case 'monthly':
        startDate.setMonth(startDate.getMonth() + 1);
        return startDate.toLocaleDateString();
      case 'quarterly':
        startDate.setMonth(startDate.getMonth() + 3);
        return startDate.toLocaleDateString();
      case 'semiannually':
        startDate.setMonth(startDate.getMonth() + 6);
        return startDate.toLocaleDateString();
      case 'annually':
      case 'annual':
        startDate.setFullYear(startDate.getFullYear() + 1);
        return startDate.toLocaleDateString();
      case 'biennially':
        startDate.setFullYear(startDate.getFullYear() + 2);
        return startDate.toLocaleDateString();
      case 'onetime':
        // For one-time payments, extend by 10 years to mark as "lifetime paid"
        startDate.setFullYear(startDate.getFullYear() + 10);
        return startDate.toLocaleDateString();
      default:
        // Default to monthly for unknown frequencies
        startDate.setMonth(startDate.getMonth() + 1);
        return startDate.toLocaleDateString();
    }
  };

  /**
   * Handle payment processing
   */
  const handlePayment = async () => {
    if (!cardComplete || !cardDetails || !user?.user.clubId) {
      Alert.alert('Error', 'Please complete the card details');
      return;
    }

    // Double-check Stripe configuration before processing payment
    if (!stripeConfig?.canAcceptPayments) {
      Alert.alert(
        'Payment Unavailable', 
        'Online payments are not currently available. Your club administrator needs to set up payment processing.'
      );
      return;
    }

    try {
      setLoading(true);

      // Create payment method with platform-compatible Stripe implementation
      const { paymentMethod, error: paymentMethodError } = await createPaymentMethod({
        paymentMethodType: 'Card',
      });

        if (paymentMethodError) {
          const errorMessage = paymentMethodError.message || 'Failed to create payment method';
          
          // Check if this is a Stripe configuration issue
          if (errorMessage.toLowerCase().includes('api key') || 
              errorMessage.toLowerCase().includes('you did not provide an api key') ||
              errorMessage.toLowerCase().includes('no api key provided') ||
              errorMessage.toLowerCase().includes('invalid api key')) {
            Alert.alert(
              'Payment Configuration Error',
              'Payment processing is not properly configured. Your club administrator needs to set up Stripe payment credentials.\n\nPlease contact your club administrator to enable online payments.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert('Payment Error', errorMessage);
          }
          return;
        }

        if (!paymentMethod?.id) {
          Alert.alert('Payment Error', 'Failed to create payment method');
          return;
        }

      const paymentMethodId = paymentMethod.id;

      // Process payment through backend
      const paymentRequest: PayMyDuesRequest = {
        paymentMethodId,
        membershipTypeId: membershipType.id,
      };

      await paymentService.payMyDues(paymentRequest);

      // Show success message
      const successTitle = 'Payment Successful!';
      const successMessage = `Your ${membershipType.name} dues payment of ${formatCurrency(membershipType.duesAmount)} has been processed successfully.\n\nYour membership is now paid until ${getNewExpirationDate()}.`;

      Alert.alert(
        successTitle,
        successMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to profile and refresh
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      
      let errorMessage = 'Payment failed. Please try again.';
      let alertTitle = 'Payment Failed';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check if this is a Stripe configuration issue from the backend
        if (errorMessage.toLowerCase().includes('stripe') && 
            (errorMessage.toLowerCase().includes('api key') ||
             errorMessage.toLowerCase().includes('not configured') ||
             errorMessage.toLowerCase().includes('credentials'))) {
          alertTitle = 'Payment Configuration Error';
          errorMessage = 'Payment processing is not properly configured. Your club administrator needs to set up Stripe payment credentials.\n\nPlease contact your club administrator to enable online payments.';
        }
      }

      Alert.alert(alertTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle card field changes
   */
  const handleCardChange = (cardDetails: CardDetails) => {
    setCardDetails(cardDetails);
    setCardComplete(cardDetails?.complete || false);
  };

  const duesStatus = getDuesStatusMessage();

  // Show loading while checking Stripe configuration
  if (stripeConfigLoading) {
    return (
      <SafeAreaView style={styles.container} testID="screen-pay-dues">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.interactive.primary} />
          <Text style={styles.loadingText}>Checking payment configuration...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state for invalid parameters
  if (!isValidParams || !membershipType) {
    return (
      <SafeAreaView style={styles.container} testID="screen-pay-dues">
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Membership information is missing.</Text>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => navigation.goBack()}
            testID="button-go-back"
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show message if no payment is required ($0 membership)
  if (membershipType.duesAmount === 0) {
    return (
      <SafeAreaView style={styles.container} testID="screen-pay-dues">
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title} testID="text-pay-dues-title">
                Pay Membership Dues
              </Text>
              <Text style={styles.subtitle} testID="text-pay-dues-subtitle">
                No payment required
              </Text>
            </View>

            {/* Payment Summary Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Membership Type:</Text>
                <Text style={styles.summaryValue} testID="text-membership-type">
                  {membershipType.name}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount Due:</Text>
                <Text style={[styles.summaryValue, styles.amountText]} testID="text-amount-due">
                  {formatCurrency(membershipType.duesAmount)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Current Status:</Text>
                <Text style={[styles.summaryValue, { color: duesStatus.color }]} testID="text-dues-status">
                  {duesStatus.text}
                </Text>
              </View>
            </View>

            {/* No Payment Required Message */}
            <View style={styles.successCard}>
              <Text style={styles.successTitle}>No Payment Required</Text>
              <Text style={styles.successMessage}>
                Your membership type does not require dues payments. You&apos;re all set!
              </Text>
              
              <TouchableOpacity
                style={styles.successButton}
                onPress={() => navigation.goBack()}
                testID="button-go-back"
              >
                <Text style={styles.successButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show error if Stripe is not configured
  if (!stripeConfig?.canAcceptPayments) {
    return (
      <SafeAreaView style={styles.container} testID="screen-pay-dues">
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title} testID="text-pay-dues-title">
                Pay Membership Dues
              </Text>
              <Text style={styles.subtitle} testID="text-pay-dues-subtitle">
                Payment currently unavailable
              </Text>
            </View>

            {/* Payment Summary Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment Summary</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Membership Type:</Text>
                <Text style={styles.summaryValue} testID="text-membership-type">
                  {membershipType.name}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount Due:</Text>
                <Text style={[styles.summaryValue, styles.amountText]} testID="text-amount-due">
                  {formatCurrency(membershipType.duesAmount)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Frequency:</Text>
                <Text style={styles.summaryValue} testID="text-dues-frequency">
                  {membershipType.duesFrequency}
                </Text>
              </View>

              {duesPaidUntil && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Current Status:</Text>
                  <Text style={[styles.summaryValue, { color: duesStatus.color }]} testID="text-dues-status">
                    {duesStatus.text}
                  </Text>
                </View>
              )}
            </View>

            {/* Payment Not Available Message */}
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Payment Unavailable</Text>
              <Text style={styles.errorMessage}>
                Online payments are not currently available. Your club administrator needs to set up payment processing.
              </Text>
              <Text style={styles.errorSubMessage}>
                Please contact your club administrator to set up Stripe payment processing, or pay your dues using an alternative method.
              </Text>
              
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => navigation.goBack()}
                testID="button-go-back"
              >
                <Text style={styles.contactButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="screen-pay-dues">
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} testID="text-pay-dues-title">
            Pay Membership Dues
          </Text>
          <Text style={styles.subtitle} testID="text-pay-dues-subtitle">
            Secure online payment
          </Text>
        </View>

        {/* Payment Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Membership Type:</Text>
            <Text style={styles.summaryValue} testID="text-membership-type">
              {membershipType.name}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount Due:</Text>
            <Text style={[styles.summaryValue, styles.amountText]} testID="text-amount-due">
              {formatCurrency(membershipType.duesAmount)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frequency:</Text>
            <Text style={styles.summaryValue} testID="text-dues-frequency">
              {membershipType.duesFrequency}
            </Text>
          </View>

          {duesPaidUntil && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Current Status:</Text>
              <Text style={[styles.summaryValue, { color: duesStatus.color }]} testID="text-dues-status">
                {duesStatus.text}
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Paid Until (after payment):</Text>
            <Text style={styles.summaryValue} testID="text-new-expiration">
              {getNewExpirationDate()}
            </Text>
          </View>
        </View>

        {/* Payment Method Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          
          <>
              <CardFieldWrapper
                postalCodeEnabled={true}
                placeholders={{
                  number: '4242 4242 4242 4242',
                }}
                cardStyle={styles.cardField}
                style={styles.cardFieldContainer}
                onCardChange={handleCardChange}
                testID="card-field"
              />
              
              <Text style={styles.cardHint}>
                {shouldUseWebPayments() 
                  ? 'Your payment is processed securely. Demo _mode for web compatibility.'
                  : 'Your payment is processed securely through Stripe. We never store your card details.'
                }
              </Text>
              
              {shouldUseWebPayments() && (
                <Text style={styles.webNotice}>
                  💻 Web Mode: This is a demonstration of the payment interface. 
                  For real payments, use the mobile app.
                </Text>
              )}
          </>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={[
            styles.payButton,
            !cardComplete || loading ? styles.payButtonDisabled : {},
          ]}
          onPress={handlePayment}
          disabled={!cardComplete || loading}
          testID="button-pay-dues"
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.text.inverse} />
          ) : (
            <Text style={styles.payButtonText}>
              Pay {formatCurrency(membershipType.duesAmount)}
            </Text>
          )}
        </TouchableOpacity>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Text style={styles.securityText}>
            🔒 This payment is secured by Stripe, the same technology used by millions of businesses worldwide.
          </Text>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 16,
    textAlign: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    ...colors.shadow.small,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.status.success,
  },
  cardFieldContainer: {
    height: 50,
    marginVertical: 16,
  },
  cardField: {
    backgroundColor: colors.background.tertiary,
    borderColor: colors.border.primary,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  cardHint: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  webNotice: {
    fontSize: 12,
    color: colors.status.warning,
    textAlign: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.status.warningBackground,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.status.warning,
  },
  payButton: {
    backgroundColor: colors.interactive.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  payButtonDisabled: {
    backgroundColor: colors.interactive.disabled,
  },
  payButtonText: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: 'bold',
  },
  securityNotice: {
    backgroundColor: colors.status.successBackground,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.status.success,
  },
  securityText: {
    fontSize: 14,
    color: colors.status.success,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.status.error,
    marginBottom: 24,
    textAlign: 'center',
  },
  goBackButton: {
    backgroundColor: colors.interactive.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  goBackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: colors.status.errorBackground,
    borderRadius: 12,
    padding: 24,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.status.error,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.status.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorSubMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  contactButton: {
    backgroundColor: colors.interactive.secondary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  contactButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  successCard: {
    backgroundColor: colors.status.successBackground,
    borderRadius: 12,
    padding: 24,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.status.success,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.status.success,
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  successButton: {
    backgroundColor: colors.interactive.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  successButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
}); 