"use client";

import { useState, useEffect, useCallback } from "react";
import { SecurityUtils } from "@/utils/security";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  User,
  CreditCard,
  DollarSign
} from "lucide-react";
import { EventResponse, EventRsvpResponse, EventPaymentResponse } from "@/types/event";
import { eventService } from "@/services/eventService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ErrorHandler } from "@/lib/errorHandler";
import dynamic from "next/dynamic";
import { logger } from "@/lib/logger";

// Dynamically import PayEventForm to avoid SSR issues with Stripe
const PayEventForm = dynamic(() => import("@/components/events/PayEventForm"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
});

export default function EventDetailsPage() {
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [memberRsvp, setMemberRsvp] = useState<EventRsvpResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingRsvp, setUpdatingRsvp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = parseInt(params?.eventId as string, 10);

  const fetchEventDetails = useCallback(async () => {
    try {
      setError(null);
      
      if (user?.clubId) {
        const eventData = await eventService.getEventById(user.clubId, eventId);
        setEvent(eventData);
        
        // Only fetch RSVP data if user is a member (has memberId)
        if (user.memberId) {
          const rsvpData = await eventService.getMemberRsvp(user.clubId, eventId, user.memberId);
          setMemberRsvp(rsvpData);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load event details';
      setError(errorMessage);
      const apiError = ErrorHandler.handleApiError(err, { context: 'loading event details' });
      ErrorHandler.showErrorToast(apiError);
      logger.error('events', 'Error fetching event details', { error: err, eventId, clubId: user?.clubId });
    } finally {
      setLoading(false);
    }
  }, [user?.clubId, eventId, user?.memberId]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  const formatEventDate = (eventDateTime: string) => {
    const date = new Date(eventDateTime);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatEventTime = (eventDateTime: string) => {
    const date = new Date(eventDateTime);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleRsvpUpdate = async (rsvpStatus: 'Attending' | 'NotAttending') => {
    if (!user || !event || !user.memberId) return;

    setUpdatingRsvp(true);
    try {
      const updatedRsvp = await eventService.updateRsvp(
        user.clubId, 
        eventId, 
        user.memberId, 
        { rsvpStatus }
      );
      
      setMemberRsvp(updatedRsvp);
      
      // Update event attendee count
      const refreshedEvent = await eventService.getEventById(user.clubId, eventId);
      setEvent(refreshedEvent);
      
      const message = rsvpStatus === 'Attending' 
        ? 'Successfully RSVP&apos;d as attending!' 
        : 'Successfully RSVP&apos;d as not attending.';
      toast.success(message);
    } catch (err) {
      const apiError = ErrorHandler.handleApiError(err, { context: 'updating RSVP' });
      ErrorHandler.showErrorToast(apiError);
      logger.error('events', 'Error updating event RSVP', { error: err, eventId, clubId: user.clubId, rsvpStatus });
    } finally {
      setUpdatingRsvp(false);
    }
  };

  const handleGoBack = () => {
    router.push('/app/events');
  };

  const handlePaymentSuccess = async (_paymentResponse: EventPaymentResponse) => {
    setShowPaymentDialog(false);
    toast.success("Payment successful! You're now registered for this event.");
    
    // Refresh event details and RSVP to show updated status
    await fetchEventDetails();
  };

  const handlePaymentCancel = () => {
    setShowPaymentDialog(false);
  };

  const needsPayment = () => {
    // Check if event requires payment and member hasn't paid yet
    return (
      event && 
      !event.isFree && 
      event.memberPrice !== null &&
      event.memberPrice !== undefined &&
      event.memberPrice > 0 &&
      (!memberRsvp || !memberRsvp.paidAmount || memberRsvp.paidAmount === 0)
    );
  };

  const hasAlreadyPaid = () => {
    return memberRsvp && memberRsvp.paidAmount && memberRsvp.paidAmount > 0;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading event details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Event</h2>
            <p className="text-muted-foreground text-center mb-4">
              {error || 'Event not found'}
            </p>
            <div className="flex gap-2">
              <Button onClick={handleGoBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Button>
              <Button onClick={fetchEventDetails} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPastEvent = new Date(event.eventDateTime) < new Date();

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={handleGoBack}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Button>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
            {isPastEvent && (
              <Badge variant="secondary" className="mb-2">
                Past Event
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Event Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date and Time */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Date:</span>
                  <span>{formatEventDate(event.eventDateTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Time:</span>
                  <span>{formatEventTime(event.eventDateTime)}</span>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Location:</span>
                <span>{event.location}</span>
              </div>

              {/* Attendees */}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Attendees:</span>
                <span>{event.attendeeCount || 0} attending</span>
                <Badge variant="secondary" className="ml-2">
                  {event.totalRsvpCount || 0} total RSVPs
                </Badge>
              </div>

              {/* Pricing Info */}
              {!event.isFree && event.memberPrice !== null && event.memberPrice !== undefined && event.memberPrice > 0 && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Member Price:</span>
                  <span className="text-success font-semibold">${event.memberPrice.toFixed(2)}</span>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">Description</h3>
                    <div 
                      className="text-muted-foreground prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={SecurityUtils.createSafeHTML(event.description, ['p', 'br', 'strong', 'em', 'u', 'i', 'b', 'ul', 'ol', 'li', 'blockquote'])}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RSVP Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your RSVP
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user?.role === 'Admin' ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    As an admin, you can view this event but cannot RSVP. Use the admin panel to manage RSVPs for club members.
                  </p>
                  {!event.isFree && event.memberPrice && event.memberPrice > 0 && (
                    <>
                      <Separator className="my-4" />
                      <Button
                        onClick={() => router.push(`/app/events/${eventId}/payments`)}
                        variant="outline"
                        className="w-full"
                        data-testid="button-manage-payments"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Manage Event Payments
                      </Button>
                    </>
                  )}
                </div>
              ) : user?.memberId ? (
                <>
                  {/* Payment Status */}
                  {needsPayment() && !isPastEvent && (
                    <div className="space-y-4 mb-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <span className="font-medium">Payment Required</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        This event requires payment of ${(event?.memberPrice !== undefined && event?.memberPrice !== null) ? event.memberPrice.toFixed(2) : '0.00'} (member rate) to register.
                      </p>
                      <Button
                        onClick={() => setShowPaymentDialog(true)}
                        className="w-full"
                        data-testid="button-pay-and-register"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay & Register
                      </Button>
                    </div>
                  )}

                  {/* Already Paid Status */}
                  {hasAlreadyPaid() && (
                    <div className="space-y-2 mb-4 p-4 border border-success/20 rounded-lg bg-success/5">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-success" />
                        <span className="font-medium text-success">Payment Confirmed</span>
                      </div>
                      <p className="text-sm text-success/90">
                        You paid ${memberRsvp?.paidAmount?.toFixed(2)} for this event.
                      </p>
                      {memberRsvp?.stripePaymentIntentId && (
                        <p className="text-xs text-muted-foreground">
                          Payment ID: {memberRsvp.stripePaymentIntentId}
                        </p>
                      )}
                    </div>
                  )}

                  {memberRsvp ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {memberRsvp.rsvpStatus === 'Attending' ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                        <span className="font-medium">
                          {memberRsvp.rsvpStatus === 'Attending' ? 'Attending' : 'Not Attending'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        You can change your RSVP at any time{isPastEvent ? ' (though this event has already occurred)' : ''}.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {needsPayment() 
                          ? 'Please complete payment to register for this event.'
                          : 'Please let us know if you\'ll be attending this event.'}
                      </p>
                    </div>
                  )}

                  {!isPastEvent && !needsPayment() && (
                    <div className="flex flex-col gap-2 mt-4">
                      <Button
                        onClick={() => handleRsvpUpdate('Attending')}
                        disabled={updatingRsvp}
                        variant={memberRsvp?.rsvpStatus === 'Attending' ? 'default' : 'outline'}
                        className="w-full"
                        data-testid="button-rsvp-attending"
                      >
                        {updatingRsvp ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        {memberRsvp?.rsvpStatus === 'Attending' ? 'Attending' : 'Mark as Attending'}
                      </Button>
                      
                      <Button
                        onClick={() => handleRsvpUpdate('NotAttending')}
                        disabled={updatingRsvp}
                        variant={memberRsvp?.rsvpStatus === 'NotAttending' ? 'default' : 'outline'}
                        className="w-full"
                        data-testid="button-rsvp-not-attending"
                      >
                        {updatingRsvp ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        {memberRsvp?.rsvpStatus === 'NotAttending' ? 'Not Attending' : 'Mark as Not Attending'}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Unable to load RSVP information. Please try refreshing the page.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Pay for Event</DialogTitle>
            <DialogDescription>
              Complete payment to register for {event?.name}
            </DialogDescription>
          </DialogHeader>
          {event && (
            <PayEventForm
              eventId={event.id}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 