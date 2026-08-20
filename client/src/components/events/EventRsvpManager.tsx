"use client";

import { useState, useEffect, useCallback } from"react";
import { Button } from"@/components/ui/button";
import { Badge } from"@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Users, UserCheck, UserX, UserPlus } from"lucide-react";
import { toast } from"sonner";
import { ErrorHandler } from"@/lib/errorHandler";
import { eventService } from"@/services/eventService";
import { logger } from"@/lib/logger";
import { EventResponse, EventRsvpResponse, UpdateRsvpRequest } from"@/types/event";
import { useAuth } from"@/hooks/useAuth";
import posthog from"posthog-js";

interface EventRsvpManagerProps {
  event: EventResponse;
  onRsvpUpdate?: () => void;
  onRsvpCountsUpdate?: (counts: { attending: number; notAttending: number; invited: number }) => void;
}

export function EventRsvpManager({ event, onRsvpUpdate, onRsvpCountsUpdate }: EventRsvpManagerProps) {
  const { user } = useAuth();
  const [rsvps, setRsvps] = useState<EventRsvpResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRsvp, setUpdatingRsvp] = useState<number | null>(null);

  const loadRsvps = useCallback(async () => {
    if (!user?.clubId) return;

    try {
      setLoading(true);
      const rsvpData = await eventService.getEventRsvps(user.clubId, event.id);
      setRsvps(rsvpData);
    } catch (error) {
      logger.error('events','Failed to load RSVPs', { error, clubId: user.clubId, eventId: event.id });
      const apiError = ErrorHandler.handleApiError(error, { context:'loading RSVPs' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setLoading(false);
    }
  }, [user?.clubId, event.id]);

  useEffect(() => {
    loadRsvps();
  }, [event.id, loadRsvps]);

  const handleRsvpUpdate = async (memberId: number, newStatus: string) => {
    if (!user?.clubId) return;

    try {
      setUpdatingRsvp(memberId);
      const updateRequest: UpdateRsvpRequest = { rsvpStatus: newStatus };
      
      await eventService.updateRsvp(user.clubId, event.id, memberId, updateRequest);
      
      // Update local state
      setRsvps(prev => prev.map(rsvp =>
        rsvp.memberId === memberId
          ? { ...rsvp, rsvpStatus: newStatus, updatedAt: new Date().toISOString() }
          : rsvp
      ));

      if (typeof window !=='undefined') {
        const action = newStatus.toLowerCase() ==='attending'
          ?'attending'
          : newStatus.toLowerCase() ==='notattending'
            ?'not_attending'
            :'waitlist';
        posthog.capture('event_rsvp_changed', { action, event_id: event.id });
      }

      toast.success(`RSVP updated to ${newStatus}`);
      onRsvpUpdate?.();
    } catch (error) {
      logger.error('events','Failed to update RSVP', { error, clubId: user.clubId, eventId: event.id, memberId, newStatus });
      const apiError = ErrorHandler.handleApiError(error, { context:'updating RSVP' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setUpdatingRsvp(null);
    }
  };

  const getRsvpBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case'attending':
        return'default';
      case'notattending':
        return'destructive';
      case'invited':
        return'secondary';
      default:
        return'outline';
    }
  };

  const getRsvpIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case'attending':
        return <UserCheck className="h-4 w-4" />;
      case'notattending':
        return <UserX className="h-4 w-4" />;
      case'invited':
        return <UserPlus className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const attendingCount = rsvps.filter(r => r.rsvpStatus.toLowerCase() ==='attending').length;
  const notAttendingCount = rsvps.filter(r => r.rsvpStatus.toLowerCase() ==='notattending').length;
  const invitedCount = rsvps.filter(r => r.rsvpStatus.toLowerCase() ==='invited').length;

  // Update parent component with RSVP counts whenever they change
  useEffect(() => {
    onRsvpCountsUpdate?.({
      attending: attendingCount,
      notAttending: notAttendingCount,
      invited: invitedCount
    });
  }, [attendingCount, notAttendingCount, invitedCount, onRsvpCountsUpdate]);

  if (loading) {
    return (
      <Card className="glass border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10">
              <Users className="h-5 w-5 text-secondary" />
            </div>
            <span>RSVP Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-pulse" />
              <p className="text-muted-foreground">Loading RSVPs...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-border/50 shadow-lg hover:glass-strong transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10">
            <Users className="h-5 w-5 text-secondary" />
          </div>
          <span>RSVP Management</span>
        </CardTitle>
        
        {/* Summary Stats */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-gradient-to-br from-success/10 to-success/5">
              <UserCheck className="h-4 w-4 text-success" />
            </div>
            <span className="text-sm font-medium">{attendingCount} Attending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-gradient-to-br from-destructive/10 to-destructive/5">
              <UserX className="h-4 w-4 text-destructive" />
            </div>
            <span className="text-sm font-medium">{notAttendingCount} Not Attending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-gradient-to-br from-primary/10 to-primary/5">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium">{invitedCount} Invited</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {rsvps.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No RSVPs Yet
            </h3>
            <p className="text-muted-foreground">
              Members haven&apos;t responded to this event yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rsvps.map((rsvp) => (
              <div key={rsvp.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getRsvpIcon(rsvp.rsvpStatus)}
                  <div>
                    <div className="font-medium text-foreground">
                      {rsvp.memberName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {rsvp.memberEmail}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={getRsvpBadgeVariant(rsvp.rsvpStatus)}>
                    {rsvp.rsvpStatus}
                  </Badge>
                  
                  <Select
                    value={rsvp.rsvpStatus}
                    onValueChange={(newStatus) => handleRsvpUpdate(rsvp.memberId, newStatus)}
                    disabled={updatingRsvp === rsvp.memberId}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Invited">Invited</SelectItem>
                      <SelectItem value="Attending">Attending</SelectItem>
                      <SelectItem value="NotAttending">Not Attending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t">
          <Button 
            onClick={() => {
              loadRsvps();
              onRsvpUpdate?.();
            }} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <Users className="h-4 w-4 mr-2" />
            Refresh RSVPs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 