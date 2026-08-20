"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/components/ui/card";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { Calendar, Clock, MapPin, Edit, Trash2, Users, Eye, DollarSign } from"lucide-react";
import { EventResponse } from"@/types/event";
import { useRouter } from"next/navigation";
import { SecurityUtils } from"@/utils/security";

interface EventCardProps {
  event: EventResponse;
  onEdit: (event: EventResponse) => void;
  onDelete: (eventId: number) => void;
}

export function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const router = useRouter();

  // Format the date and time for display
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

  const { formattedDate, formattedTime } = formatEventDateTime(event.eventDateTime);

  // Check if event is in the past
  const isPastEvent = new Date(event.eventDateTime) < new Date();

  // Format pricing for display
  const formatPriceDisplay = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return'';
    // Add comma separators for thousands
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const hasMemberPrice = event.memberPrice !== null && event.memberPrice !== undefined;
  const hasNonMemberPrice = event.nonMemberPrice !== null && event.nonMemberPrice !== undefined;
  const showPricing = !event.isFree && (hasMemberPrice || hasNonMemberPrice);

  return (
    <Card className={`glass border-border/50 hover:glass-strong hover:opacity-95 hover:shadow-xl group transition-all duration-200 ${isPastEvent ?'opacity-75' :''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary/80 transition-all duration-200 line-clamp-2">
              {event.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(event)}
              className="h-9 w-9 p-0 min-h-[44px] min-w-[44px] glass-soft border-border/50 hover:glass transition-all duration-200"
              aria-label={`Edit ${event.name}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(event.id)}
              className="h-9 w-9 p-0 min-h-[44px] min-w-[44px] glass-soft border-destructive/30 text-destructive hover:text-destructive hover:bg-destructive/5  transition-all duration-200"
              aria-label={`Delete ${event.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="p-1 rounded-md bg-gradient-to-br from-accent/10 to-info/10">
              <Clock className="h-4 w-4 text-accent-foreground" />
            </div>
            <span>{formattedTime}</span>
            {isPastEvent && (
              <span className="text-warning  font-medium ml-2">
                (Past Event)
              </span>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="p-1 rounded-md bg-gradient-to-br from-success/10 to-success/5">
              <MapPin className="h-4 w-4 text-success" />
            </div>
            <span className="truncate max-w-[250px]" title={event.location}>
              {event.location}
            </span>
          </div>

          {/* Pricing */}
          {event.isFree ? (
            <div className="flex items-center gap-2 text-sm">
              <div className="p-1 rounded-md bg-gradient-to-br from-success/10 to-success/5">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <Badge
                variant="secondary"
                className="bg-success/10 text-success   free-event"
                data-testid="free-event-badge"
                aria-label="Free event"
              >
                FREE
              </Badge>
            </div>
          ) : showPricing ? (
            <div className="space-y-2" data-testid="event-pricing">
              <div className="flex items-center gap-2 text-sm">
                <div className="p-1 rounded-md bg-gradient-to-br from-warning/10 to-chart-4/10">
                  <DollarSign className="h-4 w-4 text-warning" data-testid="pricing-icon" />
                </div>
                <span className="font-medium text-muted-foreground">Pricing:</span>
              </div>
              {hasMemberPrice && (
                <div className="flex items-center gap-2 text-sm ml-7">
                  <span className="text-muted-foreground">Members:</span>
                  <span
                    className="font-semibold text-foreground"
                    data-testid="member-price"
                    aria-label={`Member price: $${formatPriceDisplay(event.memberPrice)}`}
                  >
                    ${formatPriceDisplay(event.memberPrice)}
                  </span>
                </div>
              )}
              {hasNonMemberPrice && (
                <div className="flex items-center gap-2 text-sm ml-7">
                  <span className="text-muted-foreground">Non-members:</span>
                  <span
                    className="font-semibold text-foreground"
                    data-testid="non-member-price"
                    aria-label={`Non-member price: $${formatPriceDisplay(event.nonMemberPrice)}`}
                  >
                    ${formatPriceDisplay(event.nonMemberPrice)}
                  </span>
                </div>
              )}
            </div>
          ) : null}

          {/* RSVP Status */}
          <div className="flex items-center gap-2 text-sm">
            <div className="p-1 rounded-md bg-gradient-to-br from-secondary/20 to-chart-1/10">
              <Users className="h-4 w-4 text-secondary-foreground" />
            </div>
            <span className="text-muted-foreground">
              {event.attendeeCount || 0} attending
            </span>
            {event.totalRsvpCount > event.attendeeCount && (event.totalRsvpCount - event.attendeeCount) > 0 && (
              <span className="text-muted-foreground">
                • {event.totalRsvpCount - event.attendeeCount} not attending
              </span>
            )}
            <Badge variant="secondary" className="ml-auto">
              {event.totalRsvpCount || 0} total RSVPs
            </Badge>
          </div>

          {/* Description */}
          {event.description ? (
            <div className="text-sm text-foreground/80">
              <div
                className="line-clamp-3 overflow-hidden break-words"
                dangerouslySetInnerHTML={SecurityUtils.createSafeHTML(
                  event.description.length > 150
                    ? event.description.substring(0, 150) +'...'
                    : event.description,
                  ['p','br','strong','em','i','b'] // Only allow basic formatting
                )}
              />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic">
              No description provided
            </div>
          )}

          {/* View Details Button */}
          <div className="pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/events/${event.id}`)}
              className="w-full flex items-center gap-2 glass-soft border-border/50 hover:glass transition-all duration-200 group-hover:bg-primary/5"
            >
            <Eye className="h-4 w-4" />
            View Details & Manage RSVPs
          </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 