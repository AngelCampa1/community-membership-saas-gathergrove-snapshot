'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentService, PaymentPageResponse } from '../../../services/paymentService';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import { CHART_SEMANTIC } from '@/utils/chartColors';

interface PaymentFormProps {
  paymentDetails: PaymentPageResponse;
  token: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function PaymentForm({ paymentDetails, token, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setIsProcessing(true);

    try {
      if (!stripe || !elements) {
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Process payment through our API
      await paymentService.processPayment(token, {
        paymentMethodId: paymentMethod.id,
      });

      onSuccess();
    } catch (err) {
      // SECURITY FIX: Log payment errors to backend for tracking and analytics
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';

      try {
        // Log payment failure to backend (fire and forget)
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8050/api/v1'}/payments/log-error`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            error: errorMessage,
            timestamp: new Date().toISOString(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
          })
        }).catch(() => {}); // Silently fail if logging fails
      } catch {
        // Logging is best-effort, don't let it affect user experience
      }

      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Card Details
          </label>
          <div className="border rounded-md p-3 bg-background">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: 'hsl(var(--foreground))', // Use CSS custom property for proper theme support
                    fontFamily: 'Arial, sans-serif',
                    '::placeholder': {
                      color: '#9ca3af', // Fallback placeholder color
                    },
                    backgroundColor: 'transparent',
                  },
                  invalid: {
                    color: CHART_SEMANTIC.negative,
                    iconColor: CHART_SEMANTIC.negative,
                  },
                },
                hidePostalCode: false,
              }}
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay ${paymentDetails.amount.toFixed(2)}
          </>
        )}
      </Button>
    </form>
  );
}

export default function PaymentPage() {
  const params = useParams();
  const token = params?.token as string;

  const [paymentDetails, setPaymentDetails] = useState<PaymentPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [stripePromise, setStripePromise] = useState<Promise<import('@stripe/stripe-js').Stripe | null> | null>(null);

  useEffect(() => {
    if (isLoading) {
      document.title = 'Loading... | GatherGrove';
    } else if (error || (paymentDetails && !paymentDetails.isValid)) {
      document.title = 'Payment Unavailable | GatherGrove';
    } else if (paymentSuccess) {
      document.title = 'Payment Successful | GatherGrove';
    } else if (paymentDetails?.isValid) {
      document.title = 'Complete Payment | GatherGrove';
    }
  }, [isLoading, error, paymentDetails, paymentSuccess]);

  useEffect(() => {
    async function loadPaymentDetails() {
      try {
        const details = await paymentService.getPaymentPage(token);
        setPaymentDetails(details);

        if (details.isValid && details.stripePublishableKey) {
          setStripePromise(loadStripe(details.stripePublishableKey));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payment details');
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      loadPaymentDetails();
    }
  }, [token]);

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <CardTitle className="text-success">Payment Successful!</CardTitle>
            <CardDescription>
              Your payment has been processed successfully. Your dues are now up to date.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            <p>You can close this page. A confirmation will be sent to your email.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !paymentDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Payment Unavailable</CardTitle>
            <CardDescription>
              {error || 'This payment link is invalid or has expired.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!paymentDetails.isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-warning" />
            </div>
            <CardTitle className="text-warning">Payment Link Expired</CardTitle>
            <CardDescription>
              This payment link has expired or has already been used. Please contact your club administrator for a new payment link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{paymentDetails.clubName}</CardTitle>
          <CardDescription>
            Payment request for {paymentDetails.memberName}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Member:</span>
              <span className="font-medium">{paymentDetails.memberName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Membership:</span>
              <span className="font-medium">{paymentDetails.membershipType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Amount:</span>
              <span className="font-bold text-lg">${paymentDetails.amount.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t">
              <span className="text-sm text-muted-foreground">Description:</span>
              <p className="font-medium">{paymentDetails.description}</p>
            </div>
          </div>

          {stripePromise && (
            <Elements stripe={stripePromise}>
              <PaymentForm
                paymentDetails={paymentDetails}
                token={token}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          )}
        </CardContent>

        <CardFooter className="text-center">
          <p className="text-xs text-muted-foreground">
            This is a secure payment processed by Stripe. Your card details are never stored by {paymentDetails.clubName}.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 