"use client";

import { useState, useEffect } from "react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Check, Calendar, MapPin } from "lucide-react";
import { eventService } from "@/services/eventService";
import { EventResponse, EventPaymentResponse } from "@/types/event";
import { ErrorHandler } from "@/lib/errorHandler";
import { LoadingError } from "@/components/ui/loading-error";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";
import { CHART_SEMANTIC, CHART_BACKGROUNDS } from "@/utils/chartColors";
import posthog from "posthog-js";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface PayEventFormProps {
  eventId: number;
  onPaymentSuccess: (response: EventPaymentResponse) => void;
  onCancel: () => void;
}

interface PayEventFormContentProps {
  event: EventResponse;
  memberPrice: number;
  onPaymentSuccess: (response: EventPaymentResponse) => void;
  onCancel: () => void;
}

function PayEventFormContent({ event, memberPrice, onPaymentSuccess, onCancel }: PayEventFormContentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isStripeReady, setIsStripeReady] = useState(false);
  const [confirmationData, setConfirmationData] = useState<EventPaymentResponse | null>(null);

  // Format event date
  const eventDate = new Date(event.eventDateTime);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  // Track form mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      posthog.capture('event_payment_started', { event_id: event.id });
    }
  }, []);

  // Check when Stripe is ready
  useEffect(() => {
    if (stripe && elements) {
      setIsStripeReady(true);
    }
  }, [stripe, elements]);

  const handleSubmit = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();

    if (!stripe || !elements) {
      ErrorHandler.showErrorToast(new Error("Payment system not ready"), "Payment system not ready. Please try again.");
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
          name: '', // Could get from user profile if needed
        },
      });

      if (error) {
        logger.error('billing', 'Stripe payment method error for event payment', { error, eventId: event.id });
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

      // Call our backend API to process the event payment
      const response = await eventService.payForEvent({
        eventId: event.id,
        paymentMethodId: paymentMethod.id
      });

      // Payment successful
      setPaymentCompleted(true);
      setConfirmationData(response);
      if (typeof window !== 'undefined') {
        posthog.capture('event_payment_completed', { event_id: event.id });
      }
      ErrorHandler.showSuccessToast("Payment successful! You're registered for the event.");

      // Call success callback after short delay
      setTimeout(() => {
        onPaymentSuccess(response);
      }, 2000);

    } catch (error) {
      logger.error('billing', 'Event payment processing failed', { error, eventId: event.id, memberPrice });
      const errorMessage = error instanceof Error ? error.message : "Payment processing failed";
      setPaymentError(errorMessage);
      ErrorHandler.showErrorToast(error, errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentCompleted && confirmationData) {
    return (
      <Card data-testid="payment-success">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: CHART_BACKGROUNDS.success }}>
            <Check className="h-8 w-8" style={{ color: CHART_SEMANTIC.positive }} data-testid="icon-success" />
          </div>
          <CardTitle className="text-2xl" style={{ color: CHART_SEMANTIC.positive }}>Payment Successful!</CardTitle>
          <CardDescription>
            You're all set for {event.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg p-4 text-center" style={{ backgroundColor: CHART_BACKGROUNDS.success }} data-testid="confirmation-box">
            <p className="text-sm font-medium text-muted-foreground">Confirmation Number</p>
            <p className="text-2xl font-bold text-foreground" data-testid="confirmation-number">
              {confirmationData.confirmationNumber}
            </p>
          </div>
          
          <div className="space-y-2 text-sm">
            <p className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span className="font-semibold" data-testid="amount-paid">${confirmationData.amountPaid.toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted-foreground">Transaction ID:</span>
              <span className="font-mono text-xs" data-testid="transaction-id">{confirmationData.paymentId}</span>
            </p>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent with your event details and receipt.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="pay-event-form">
      <CardHeader>
        <CardTitle>Pay for Event</CardTitle>
        <CardDescription>
          Complete your registration with payment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Event Details */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3" data-testid="event-details">
            <h3 className="font-semibold text-lg">{event.name}</h3>
            
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p>{formattedDate}</p>
                <p>{formattedTime}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>{event.location}</p>
            </div>

            <div className="border-t pt-3 mt-3">
              <p className="flex justify-between items-center">
                <span className="text-muted-foreground">Member Price:</span>
                <span className="text-2xl font-bold" style={{ color: CHART_SEMANTIC.positive }} data-testid="member-price">
                  ${memberPrice.toFixed(2)}
                </span>
              </p>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Card Details
              </label>
              <div className="border rounded-md p-3" data-testid="card-element-container">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: CHART_SEMANTIC.negative,
                      },
                    },
                  }}
                />
              </div>
            </div>

            {paymentError && (
              <div className="rounded-md bg-destructive/10 p-3" data-testid="error-payment">
                <p className="text-sm text-destructive">{paymentError}</p>
              </div>
            )}

            {!isStripeReady && (
              <LoadingError
                isLoading={true}
                loadingMessage="Initializing payment system..."
              >
                <div />
              </LoadingError>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isStripeReady || isProcessing}
                className="flex-1"
                data-testid="button-pay"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay ${memberPrice.toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="text-xs text-muted-foreground text-center">
            <p>Your payment is secured by Stripe.</p>
            <p>You will receive a confirmation email after successful payment.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PayEventForm({ eventId, onPaymentSuccess, onCancel }: PayEventFormProps) {
  const { user, loading: authLoading } = useAuth();
  const [eventDetails, setEventDetails] = useState<EventResponse | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState<unknown>(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!user?.clubId) {
        setEventError(new Error("User not authenticated or club ID missing."));
        setIsLoadingEvent(false);
        return;
      }
      try {
        setIsLoadingEvent(true);
        setEventError(null);
        const event = await eventService.getEventById(user.clubId, eventId);
        setEventDetails(event);
      } catch (error) {
        logger.error('events', 'Error fetching event details for payment', { error, eventId, clubId: user.clubId });
        setEventError(error);
      } finally {
        setIsLoadingEvent(false);
      }
    };

    if (user && !authLoading) {
      fetchEventDetails();
    }
  }, [user, authLoading, eventId]);

  if (authLoading || isLoadingEvent) {
    return <LoadingError isLoading={true} loadingMessage="Loading event details..." ><div /></LoadingError>;
  }

  if (eventError || !eventDetails) {
    return <LoadingError isLoading={false} error={eventError || new Error("Event not found")} ><div /></LoadingError>;
  }

  const memberPrice = eventDetails.memberPrice || 0;

  return (
    <Elements stripe={stripePromise}>
      <PayEventFormContent 
        event={eventDetails}
        memberPrice={memberPrice}
        onPaymentSuccess={onPaymentSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}

