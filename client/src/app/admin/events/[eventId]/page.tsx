"use client";

import { useState, useEffect, useCallback } from"react";
import { SecurityUtils } from"@/utils/security";
import { useParams, useRouter } from"next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { Calendar, Clock, MapPin, Edit, ArrowLeft, Users, Mail } from"lucide-react";
import { toast } from"sonner";
import { ErrorHandler } from"@/lib/errorHandler";
import { useAuth } from"@/hooks/useAuth";
import { useClubTier } from"@/hooks/useClubTier";
import { eventService } from"@/services/eventService";
import { EventForm } from"@/components/events/EventForm";
import { EventRsvpManager } from"@/components/events/EventRsvpManager";
import { EventInvitationDialog } from"@/components/events/EventInvitationDialog";
import { EventResponse, UpdateEventRequest } from"@/types/event";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from"@/components/ui/alert-dialog";
import CopyButton from"@/components/common/CopyButton";
import { Link, ExternalLink } from"lucide-react";
import { logger } from"@/lib/logger";

export default function EventDetailPage() {
  const { user, loading } = useAuth() || {};
  const { canSendInvitations } = useClubTier() || { canSendInvitations: false };
  const params = useParams();
  const router = useRouter();
  const eventId = parseInt(params?.eventId as string);

  const [event, setEvent] = useState<EventResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [rsvpCounts, setRsvpCounts] = useState<{
    attending: number;
    notAttending: number;
    invited: number;
  }>({ attending: 0, notAttending: 0, invited: 0 });
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Send invitations state
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);

  // Payment link state
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const loadEvent = useCallback(async () => {
    if (!user?.clubId || !eventId) return;

    try {
      setIsLoading(true);
      const eventData = await eventService.getEventById(user.clubId, eventId);
      setEvent(eventData);
    } catch (error) {
      logger.error('events','Failed to load event', { error, eventId, clubId: user.clubId });
      const apiError = ErrorHandler.handleApiError(error, { context:'loading event details' });
      ErrorHandler.showErrorToast(apiError);
      router.push("/admin/events");
    } finally {
      setIsLoading(false);
    }
  }, [eventId, user?.clubId, router]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleUpdateEvent = async (eventData: UpdateEventRequest) => {
    if (!user?.clubId || !event) return;

    try {
      setFormLoading(true);
      const updatedEvent = await eventService.updateEvent(user.clubId, event.id, eventData);
      setEvent(updatedEvent);
      setShowEditForm(false);
      toast.success("Event updated successfully");
    } catch (error) {
      logger.error('events','Failed to update event', { error, eventId: event.id, clubId: user.clubId });
      const apiError = ErrorHandler.handleApiError(error, { context:'updating event' });
      ErrorHandler.showErrorToast(apiError);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!user?.clubId || !event) return;

    try {
      setIsDeleting(true);
      await eventService.deleteEvent(user.clubId, event.id);
      toast.success("Event deleted successfully");
      router.push("/admin/events");
    } catch (error) {
      logger.error('events','Failed to delete event', { error, eventId: event.id, clubId: user.clubId });
      const apiError = ErrorHandler.handleApiError(error, { context:'deleting event' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleInvitationsSent = () => {
    // Reload event data to update RSVP list
    loadEvent();
  };

  const handleGeneratePaymentLink = async () => {
    if (!user?.clubId || !event) return;

    try {
      setIsGeneratingLink(true);
      const response = await eventService.generatePaymentLink(user.clubId, event.id);

      // Update event with the payment token from the response
      setEvent({
        ...event,
        paymentToken: response.paymentToken
      });

      toast.success("Payment link generated successfully");
    } catch (error) {
      logger.error('events','Failed to generate payment link', { error, eventId: event.id, clubId: user.clubId });
      const apiError = ErrorHandler.handleApiError(error, { context:'generating payment link' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const getPaymentLinkUrl = () => {
    if (!event?.paymentToken) return'';
    return `${window.location.origin}/events/pay/${event.paymentToken}`;
  };

  const formatEventDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday:'long',
      year:'numeric',
      month:'long',
      day:'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour:'numeric',
      minute:'2-digit',
      hour12: true
    });
    return { formattedDate, formattedTime };
  };

  if (loading || isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
              <p className="text-muted-foreground">Loading event details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Event Not Found
            </h3>
            <p className="text-muted-foreground mb-6">
              The requested event could not be found.
            </p>
            <Button onClick={() => router.push("/admin/events")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { formattedDate, formattedTime } = formatEventDateTime(event.eventDateTime);
  const isPastEvent = new Date(event.eventDateTime) < new Date();

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6 glass border border-border/50 rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/events")}
              className="flex items-center gap-2 glass-soft hover:glass transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Events
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {event.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Event Details & RSVP Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canSendInvitations && (
              <Button
                variant="secondary"
                onClick={() => setShowInvitationDialog(true)}
                className="flex items-center gap-2 glass-soft border-border/50 hover:glass transition-all duration-200"
              >
                <Mail className="h-4 w-4" />
                Send Invitations
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowEditForm(true)}
              className="flex items-center gap-2 glass-soft border-border/50 hover:glass transition-all duration-200"
            >
              <Edit className="h-4 w-4" />
              Edit Event
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="bg-gradient-to-r from-destructive to-destructive hover:from-destructive/90 hover:to-destructive/90 text-destructive-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:opacity-95"
            >
              Delete Event
            </Button>
          </div>
        </div>

        {/* Event Details Card */}
        <Card className="glass border-border/50 shadow-lg hover:glass-strong transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-success/20">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <span>{event.name}</span>
                </CardTitle>
                <CardDescription className="mt-2">
                  Event information and details
                </CardDescription>
              </div>
              {isPastEvent && (
                <Badge variant="secondary" className="text-warning">
                  Past Event
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">
                    {formattedDate}
                  </p>
                  <p className="text-sm text-muted-foreground">Date</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {formattedTime}
                  </p>
                  <p className="text-sm text-muted-foreground">Time</p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-success/10 to-success/10">
                <MapPin className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {event.location}
                </p>
                <p className="text-sm text-muted-foreground">Location</p>
              </div>
            </div>

            {/* RSVP Summary */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-secondary/10 to-secondary/10">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium text-foreground">
                    {rsvpCounts.attending} attending
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total RSVPs: {rsvpCounts.attending + rsvpCounts.notAttending + rsvpCounts.invited}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="default">
                    {rsvpCounts.attending} Attending
                  </Badge>
                  {rsvpCounts.notAttending > 0 && (
                    <Badge variant="destructive">
                      {rsvpCounts.notAttending} Not Attending
                    </Badge>
                  )}
                  {rsvpCounts.invited > 0 && (
                    <Badge variant="secondary">
                      {rsvpCounts.invited} Invited
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div>
                <h4 className="font-medium text-foreground mb-2">
                  Description
                </h4>
                <div
                  className="text-foreground prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={SecurityUtils.createSafeHTML(event.description, ['p','br','strong','em','u','i','b','ul','ol','li','blockquote'])}
                />
              </div>
            )}

            {/* Payment Link Section - Only show for paid events */}
            {event.isPaid && (
              <div className="pt-4 border-t border-border/50">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/10">
                    <Link className="h-5 w-5 text-primary" />
                  </div>
                  Public Registration Link
                </h4>

                {event.paymentToken ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
                      <input
                        type="text"
                        value={getPaymentLinkUrl()}
                        readOnly
                        className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-foreground"
                      />
                      <CopyButton
                        text={getPaymentLinkUrl()}
                        buttonText="Copy"
                        variant="secondary"
                        size="sm"
                        onCopySuccess={() => toast.success("Payment link copied to clipboard")}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getPaymentLinkUrl(),'_blank')}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Share this link with attendees to register and pay for the event
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Generate a public payment link to allow attendees to register and pay for this event.
                    </p>
                    <Button
                      onClick={handleGeneratePaymentLink}
                      disabled={isGeneratingLink}
                      variant="default"
                      className="flex items-center gap-2"
                    >
                      <Link className="h-4 w-4" />
                      {isGeneratingLink ?"Generating..." :"Generate Payment Link"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RSVP Management */}
        <EventRsvpManager 
          event={event} 
          onRsvpUpdate={loadEvent}
          onRsvpCountsUpdate={setRsvpCounts}
        />

        {/* Edit Event Form Modal */}
        <EventForm
          open={showEditForm}
          onClose={() => setShowEditForm(false)}
          onSubmit={handleUpdateEvent}
          event={event}
          isEditing={true}
          isLoading={formLoading}
        />

        {/* Enhanced Invitation Dialog */}
        {event && (
          <EventInvitationDialog
            open={showInvitationDialog}
            onClose={() => setShowInvitationDialog(false)}
            event={event}
            onInvitationsSent={handleInvitationsSent}
          />
        )}

        {/* Delete Event Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{event?.name}&rdquo;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteEvent}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ?'Deleting...' :'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
} 