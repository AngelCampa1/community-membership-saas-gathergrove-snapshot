"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, CalendarDays, RefreshCw, AlertCircle } from "lucide-react";
import { EventResponse } from "@/types/event";
import { eventService } from "@/services/eventService";
import { useAuth } from "@/hooks/useAuth";
import { ErrorHandler } from "@/lib/errorHandler";
import { logger } from "@/lib/logger";

export default function MemberEventsPage() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const fetchEvents = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      setError(null);
      
      if (user?.clubId) {
        const upcomingEvents = await eventService.getEventsByClub(user.clubId, 'upcoming');
        setEvents(upcomingEvents);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load events';
      setError(errorMessage);
      if (!isRefresh) {
        const apiError = ErrorHandler.handleApiError(err, { context: 'loading events' });
        ErrorHandler.showErrorToast(apiError);
      }
      logger.error('events', 'Error fetching member events', { error: err, clubId: user?.clubId, isRefresh });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.clubId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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

  const handleEventClick = (event: EventResponse) => {
    router.push(`/app/events/${event.id}`);
  };

  const handleRefresh = () => {
    fetchEvents(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !refreshing) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Events</h2>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={handleRefresh} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground mt-1">
            Upcoming events in your club
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <CalendarDays className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Upcoming Events</h2>
            <p className="text-muted-foreground text-center">
              There are currently no upcoming events scheduled for your club.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card 
              key={event.id} 
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
              onClick={() => handleEventClick(event)}
              data-testid={`event-card-${event.id}`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold line-clamp-2">
                  {event.name}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatEventDate(event.eventDateTime)}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Time */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatEventTime(event.eventDateTime)}</span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>

                  {/* Attendee Count */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{event.attendeeCount || 0} attending</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {event.totalRsvpCount || 0} RSVPs
                    </Badge>
                  </div>

                  {/* Description Preview */}
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description.replace(/<[^>]*>/g, '')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 