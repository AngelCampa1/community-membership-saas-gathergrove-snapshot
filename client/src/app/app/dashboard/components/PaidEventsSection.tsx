"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { eventService } from "@/services/eventService";
import { EventResponse } from "@/types/event";
import { ErrorHandler } from "@/lib/errorHandler";
import Link from "next/link";
import { logger } from "@/lib/logger";

export function PaidEventsSection() {
  const { user } = useAuth();
  const [paidEvents, setPaidEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaidEvents = async () => {
      if (!user?.clubId || !user?.memberId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch all events for the club (upcoming and past)
        const upcomingEvents = await eventService.getEventsByClub(user.clubId, "upcoming");
        const pastEvents = await eventService.getEventsByClub(user.clubId, "past");
        const allEvents = [...upcomingEvents, ...pastEvents];
        
        // Filter for paid events where member has an RSVP
        // Note: In a real implementation, we'd have a dedicated endpoint
        // For now, we'll fetch events and check RSVPs
        const eventsWithRsvps = await Promise.all(
          allEvents
            .filter((event: EventResponse) => !event.isFree && event.memberPrice !== null)
            .map(async (event: EventResponse) => {
              try {
                const rsvp = await eventService.getMemberRsvp(
                  user.clubId,
                  event.id,
                  user.memberId!
                );
                // Only include if member has paid
                if (rsvp && rsvp.paidAmount && rsvp.paidAmount > 0) {
                  return { ...event, memberRsvp: rsvp };
                }
                return null;
              } catch {
                return null;
              }
            })
        );

        type EventWithRsvp = EventResponse & { memberRsvp: any };
        const paid = eventsWithRsvps.filter((e): e is EventWithRsvp => e !== null);
        
        // Sort by event date (upcoming first)
        paid.sort((a: EventWithRsvp, b: EventWithRsvp) => 
          new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime()
        );

        setPaidEvents(paid);
      } catch (err) {
        logger.error('events', 'Error fetching paid events for dashboard', { error: err, clubId: user.clubId, memberId: user.memberId });
        const apiError = ErrorHandler.handleApiError(err, {
          context: 'loading paid events',
        });
        setError(apiError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPaidEvents();
  }, [user?.clubId, user?.memberId]);

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isPastEvent = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return (
      <Card data-testid="paid-events-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            My Paid Events
          </CardTitle>
          <CardDescription>Events you've registered and paid for</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-testid="paid-events-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            My Paid Events
          </CardTitle>
          <CardDescription>Events you've registered and paid for</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="paid-events-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          My Paid Events
        </CardTitle>
        <CardDescription>
          {paidEvents.length === 0
            ? "No paid event registrations yet"
            : `${paidEvents.length} paid event${paidEvents.length === 1 ? '' : 's'}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paidEvents.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2">You haven't registered for any paid events yet.</p>
            <p className="text-sm text-muted-foreground mb-4">
              When you pay for events, they'll appear here with your confirmation details.
            </p>
            <Link href="/app/events">
              <Button variant="outline" size="sm">
                Browse Events
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {paidEvents.map((event: any) => (
              <div
                key={event.id}
                className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                data-testid={`paid-event-${event.id}`}
              >
                {/* Event Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg">{event.name}</h3>
                    {isPastEvent(event.eventDateTime) ? (
                      <Badge variant="secondary">Past</Badge>
                    ) : (
                      <Badge className="bg-success hover:bg-success/90">Paid</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatEventDate(event.eventDateTime)}</span>
                    <span>•</span>
                    <span>{formatEventTime(event.eventDateTime)}</span>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}

                  {event.memberRsvp && (
                    <div className="flex flex-wrap gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Paid:</span>
                        <span className="font-semibold text-success">
                          ${event.memberRsvp.paidAmount?.toFixed(2)}
                        </span>
                      </div>
                      {event.memberRsvp.stripePaymentIntentId && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {event.memberRsvp.stripePaymentIntentId.substring(0, 20)}...
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="flex items-center">
                  <Link href={`/app/events/${event.id}`}>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

