"use client";

import { useState, useEffect, useRef } from "react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Check, AlertTriangle } from "lucide-react";
import memberService, { PayMyDuesRequest, MemberResponse } from "@/services/memberService";
import membershipTypeService, { MembershipTypeResponse } from "@/services/membershipTypeService";
import { stripeConnectService, StripeConnectStatusResponse } from "@/services/stripeConnectService";
import { ErrorHandler } from "@/lib/errorHandler";
import { LoadingError } from "@/components/ui/loading-error";
import { FormError } from "@/components/ui/form-error";
import { logger } from "@/lib/logger";
import { CHART_SEMANTIC, CHART_BACKGROUNDS, CHART_BORDERS } from "@/utils/chartColors";

// Initialize Stripe (should come from environment variable)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface PayDuesFormProps {
  memberProfile: MemberResponse;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

function PayDuesForm({ memberProfile, onPaymentSuccess, onCancel }: PayDuesFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [membershipType, setMembershipType] = useState<MembershipTypeResponse | null>(null);
  const [isLoadingMembershipType, setIsLoadingMembershipType] = useState(true);
  const [membershipTypeError, setMembershipTypeError] = useState<unknown>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isStripeReady, setIsStripeReady] = useState(false);
  
  // Stripe Connect status
  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatusResponse | null>(null);
  const [isLoadingStripeStatus, setIsLoadingStripeStatus] = useState(true);
  const [stripeStatusError, setStripeStatusError] = useState<unknown>(null);
  
  // Ref to store the latest onPaymentSuccess callback to avoid stale closures
  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  onPaymentSuccessRef.current = onPaymentSuccess;

  // Get actual dues amount from membership type data
  const duesAmount = membershipType?.duesAmount || 0;
  const membershipTypeName = memberProfile.membershipTypeName || "Standard Membership";

  // Check when Stripe is ready
  useEffect(() => {
    if (stripe && elements) {
      setIsStripeReady(true);
    }
  }, [stripe, elements]);

  // Check if club has Stripe configured
  useEffect(() => {
    const checkStripeStatus = async () => {
      try {
        setIsLoadingStripeStatus(true);
        setStripeStatusError(null);
        const status = await stripeConnectService.getConnectStatus();
        setStripeStatus(status);
      } catch (error) {
        logger.error('billing', 'Error checking Stripe Connect status', { error });
        setStripeStatusError(error);
      } finally {
        setIsLoadingStripeStatus(false);
      }
    };

    checkStripeStatus();
  }, []);

  // Fetch membership type details to get the actual dues amount
  useEffect(() => {
    const fetchMembershipType = async () => {
      try {
        setIsLoadingMembershipType(true);
        setMembershipTypeError(null);
        const membershipTypes = await membershipTypeService.getMembershipTypes(memberProfile.clubId);
        const currentMembershipType = membershipTypes.find(mt => mt.id === memberProfile.membershipTypeId);
        
        if (currentMembershipType) {
          setMembershipType(currentMembershipType);
        } else {
          const error = new Error("Membership type not found. Please contact your club administrator.");
          setMembershipTypeError(error);
        }
      } catch (error) {
        logger.error('billing', 'Error fetching membership type', { error, clubId: memberProfile.clubId, membershipTypeId: memberProfile.membershipTypeId });
        setMembershipTypeError(error);
      } finally {
        setIsLoadingMembershipType(false);
      }
    };

    fetchMembershipType();
  }, [memberProfile.clubId, memberProfile.membershipTypeId]);

  const retryFetchMembershipType = () => {
    setMembershipTypeError(null);
    const fetchMembershipType = async () => {
      try {
        setIsLoadingMembershipType(true);
        const membershipTypes = await membershipTypeService.getMembershipTypes(memberProfile.clubId);
        const currentMembershipType = membershipTypes.find(mt => mt.id === memberProfile.membershipTypeId);
        
        if (currentMembershipType) {
          setMembershipType(currentMembershipType);
        } else {
          const error = new Error("Membership type not found. Please contact your club administrator.");
          setMembershipTypeError(error);
        }
      } catch (error) {
        logger.error('billing', 'Error fetching membership type on retry', { error, clubId: memberProfile.clubId, membershipTypeId: memberProfile.membershipTypeId });
        setMembershipTypeError(error);
      } finally {
        setIsLoadingMembershipType(false);
      }
    };
    fetchMembershipType();
  };

  const retryStripeStatus = () => {
    setStripeStatusError(null);
    const checkStripeStatus = async () => {
      try {
        setIsLoadingStripeStatus(true);
        const status = await stripeConnectService.getConnectStatus();
        setStripeStatus(status);
      } catch (error) {
        logger.error('billing', 'Error checking Stripe Connect status on retry', { error });
        setStripeStatusError(error);
      } finally {
        setIsLoadingStripeStatus(false);
      }
    };
    checkStripeStatus();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      ErrorHandler.showErrorToast(new Error("Payment system not ready"), "Payment system not ready. Please try again.");
      return;
    }

    if (!membershipType || duesAmount <= 0) {
      ErrorHandler.showErrorToast(new Error("Invalid dues amount"), "Unable to process payment. Invalid dues amount.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      ErrorHandler.showErrorToast(new Error("Card element not found"), "Card information not found. Please refresh and try again.");
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Create payment method with Stripe
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: memberProfile.fullName,
          email: memberProfile.email,
        },
      });

      if (error) {
        logger.error('billing', 'Stripe payment method error', { error, memberEmail: memberProfile.email });
        const errorMessage = error.message || "Failed to process payment information";
        setPaymentError(errorMessage);
        ErrorHandler.showErrorToast(error, errorMessage);
        return;
      }

      if (!paymentMethod) {
        const errorMessage = "Failed to create payment method";
        setPaymentError(errorMessage);
        ErrorHandler.showErrorToast(new Error(errorMessage));
        return;
      }

      // Call our backend API to process the payment
      const paymentRequest: PayMyDuesRequest = {
        paymentMethodId: paymentMethod.id,
        membershipTypeId: memberProfile.membershipTypeId
      };

      await memberService.payMyDues(paymentRequest);

      // Payment successful
      setPaymentCompleted(true);
      ErrorHandler.showSuccessToast("Payment successful! Your dues have been updated.");
      
      // Don't automatically close - let user click Continue button

    } catch (error) {
      logger.error('billing', 'Dues payment processing error', { error, memberEmail: memberProfile.email, amount: duesAmount, membershipTypeId: memberProfile.membershipTypeId });
      const errorMessage = ErrorHandler.handlePaymentError(error, 'processing your dues payment').message;
      setPaymentError(errorMessage);
      ErrorHandler.showErrorToast(error, errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const textColor = '#000000';
  const placeholderColor = '#6b7280';
  
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: textColor,
        fontFamily: 'Arial, sans-serif',
        '::placeholder': {
          color: placeholderColor,
        },
        backgroundColor: 'transparent',
      },
      invalid: {
        color: CHART_SEMANTIC.negative,
        iconColor: CHART_SEMANTIC.negative,
      },
    },
    hidePostalCode: false,
  };

  // Show loading state while fetching data
  if (isLoadingMembershipType || isLoadingStripeStatus) {
    return (
      <LoadingError
        isLoading={true}
        loadingMessage="Loading payment information..."
        className="w-full max-w-md mx-auto"
      >
        <div></div>
      </LoadingError>
    );
  }

  // Show error state if membership type fetch failed
  if (membershipTypeError) {
    return (
      <LoadingError
        isLoading={false}
        error={membershipTypeError}
        onRetry={retryFetchMembershipType}
        errorTitle="Payment Setup Error"
        className="w-full max-w-md mx-auto"
      >
        <div></div>
      </LoadingError>
    );
  }

  // Show error state if Stripe status fetch failed
  if (stripeStatusError) {
    return (
      <LoadingError
        isLoading={false}
        error={stripeStatusError}
        onRetry={retryStripeStatus}
        errorTitle="Payment System Error"
        className="w-full max-w-md mx-auto"
      >
        <div></div>
      </LoadingError>
    );
  }

  // Show Stripe not configured message
  if (!stripeStatus || !stripeStatus.isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full p-3" style={{ backgroundColor: CHART_BACKGROUNDS.amber }}>
              <AlertTriangle className="h-8 w-8" style={{ color: CHART_SEMANTIC.warning }} />
            </div>
          </div>
          <CardTitle style={{ color: CHART_SEMANTIC.warning }}>Online Payments Not Available</CardTitle>
          <CardDescription>
            Your club administrator hasn&apos;t set up online payments yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Membership:</span> {membershipTypeName}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Amount Due:</span> ${duesAmount.toFixed(2)} ({membershipType?.duesFrequency || 'Monthly'})
            </p>
          </div>
          
          <div className="rounded-lg p-4 border" style={{ backgroundColor: CHART_BACKGROUNDS.blue, borderColor: CHART_BORDERS.blue }}>
            <p className="text-sm mb-2" style={{ color: CHART_SEMANTIC.info }}>
              <strong>How to pay your dues:</strong>
            </p>
            <ul className="text-xs space-y-1 text-left" style={{ color: CHART_SEMANTIC.info }}>
              <li>• Pay in person at your next club meeting</li>
              <li>• Contact your club administrator for payment options</li>
              <li>• Check if your club accepts checks or cash payments</li>
            </ul>
          </div>

          <Button
            onClick={onCancel}
            variant="outline"
            className="w-full"
          >
            Back to Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (paymentCompleted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full p-3" style={{ backgroundColor: CHART_BACKGROUNDS.success }}>
              <Check className="h-8 w-8" style={{ color: CHART_SEMANTIC.positive }} />
            </div>
          </div>
          <CardTitle style={{ color: CHART_SEMANTIC.positive }}>Payment Successful!</CardTitle>
          <CardDescription>
            Your dues payment has been processed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Amount Paid: <strong>${duesAmount.toFixed(2)}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Frequency: {membershipType?.duesFrequency || 'Monthly'}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            You will receive a confirmation email shortly.
          </p>
          <Button
            onClick={() => onPaymentSuccessRef.current()}
            className="w-full"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Pay Dues
        </CardTitle>
        <CardDescription>
          Pay your {membershipTypeName} dues securely with Stripe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Payment Details</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Membership:</span> {membershipTypeName}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Amount:</span> ${duesAmount.toFixed(2)} ({membershipType?.duesFrequency || 'Monthly'})
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="card-element" className="block text-sm font-medium">
              Card Information
            </label>
            <div className="p-3 border rounded-md bg-card" style={{ minHeight: '56px' }}>
              {!isStripeReady ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading payment form...</span>
                </div>
              ) : (
                <CardElement
                  id="card-element"
                  options={cardElementOptions}
                  onChange={(event) => {
                    // Clear payment error when user starts typing
                    if (paymentError && !event.error) {
                      setPaymentError(null);
                    }
                  }}
                  className="w-full"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your card details. Your payment info is secure and encrypted.
            </p>
          </div>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!stripe || isProcessing || duesAmount <= 0}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Pay $${duesAmount.toFixed(2)}`
              )}
            </Button>
          </div>

          {paymentError && (
            <FormError message={paymentError} variant="card" />
          )}
        </form>
      </CardContent>
    </Card>
  );
}

interface PayDuesProps {
  memberProfile: MemberResponse;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export default function PayDues({ memberProfile, onPaymentSuccess, onCancel }: PayDuesProps) {
  return (
    <Elements stripe={stripePromise}>
      <PayDuesForm 
        memberProfile={memberProfile}
        onPaymentSuccess={onPaymentSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
} 
