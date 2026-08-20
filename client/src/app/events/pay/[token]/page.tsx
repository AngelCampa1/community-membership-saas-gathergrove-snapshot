'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { eventService } from '@/services/eventService';
import { PublicEventResponse, NonMemberEventPaymentResponse } from '@/types/event';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { logger } from '@/lib/logger';
import dynamic from 'next/dynamic';

// Dynamically import the payment component (it uses Stripe which needs client-side only)
const PayEventAsGuest = dynamic(() => import('@/components/events/PayEventAsGuest'), {
  ssr: false,
  loading: () => <div className="text-center py-8">Loading payment form...</div>,
});

export default function EventRegistrationPage() {
  const params = useParams();
  const _router = useRouter(); // Reserved for future navigation features
  const token = params?.token as string;

  const [event, setEvent] = useState<PublicEventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  useEffect(() => {
    if (loading) {
      document.title = 'Loading... | GatherGrove';
    } else if (error) {
      document.title = 'Payment Unavailable | GatherGrove';
    } else if (registrationComplete) {
      document.title = 'Payment Successful | GatherGrove';
    } else if (event) {
      document.title = 'Complete Payment | GatherGrove';
    }
  }, [loading, error, event, registrationComplete]);

  useEffect(() => {
    const loadEvent = async () => {
      if (!token) {
        setError('Invalid link - no event token provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const eventData = await eventService.getPublicEventByToken(token);
        setEvent(eventData);
        setError(null);
      } catch (err: any) {
        logger.error('events', 'Error loading event for payment', { error: err, token });

        // Handle different error types
        if (err.message?.toLowerCase().includes('expired')) {
          setError('This payment link has expired. Please contact the event organizer for a new link.');
        } else if (err.message?.toLowerCase().includes('not found')) {
          setError('Event not found. The link may be invalid or the event may have been cancelled.');
        } else {
          setError('Something went wrong loading this event. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [token]);

  const handlePaymentSuccess = (response: NonMemberEventPaymentResponse) => {
    logger.info('events', 'Payment successful for non-member event', { eventId: event?.id, token, paymentId: response.paymentId });
    setRegistrationComplete(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"
            data-testid="loading-spinner"
          />
          <p className="mt-4 text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const eventDate = new Date(event.eventDateTime);
  const formattedDate = format(eventDate, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(eventDate, 'h:mm a');

  return (
    <div
      className="min-h-screen bg-muted/50 py-8 px-4"
      data-testid="event-registration-container"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Event Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{event.name}</CardTitle>
            <CardDescription className="text-base mt-2">
              {event.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-foreground">
              <Calendar className="h-5 w-5" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="h-5 w-5" />
              <span>{formattedTime}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <MapPin className="h-5 w-5" />
              <span>{event.location}</span>
            </div>

            <Separator className="my-4" />

            {/* Pricing Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <DollarSign className="h-5 w-5" />
                <span>Pricing</span>
              </div>
              {event.isFree ? (
                <p className="text-lg font-bold text-success">Free Event</p>
              ) : (
                <div className="space-y-1 ml-7">
                  {event.memberPrice !== null && event.memberPrice !== undefined && (
                    <p className="text-foreground">
                      Member: <span className="font-semibold">${event.memberPrice.toFixed(2)}</span>
                    </p>
                  )}
                  {event.nonMemberPrice !== null && event.nonMemberPrice !== undefined && (
                    <p className="text-foreground">
                      Non-Member: <span className="font-semibold">${event.nonMemberPrice.toFixed(2)}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment/Registration Form */}
        {!registrationComplete && event && (
          <PayEventAsGuest
            event={event}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  );
}