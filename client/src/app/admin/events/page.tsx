"use client";

import { useState, useEffect, useCallback } from"react";
import { Button } from"@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from"@/components/ui/tabs";
import { Plus, Calendar } from"lucide-react";
import { toast } from"sonner";
import { ErrorHandler } from"@/lib/errorHandler";
import { useAuth } from"@/hooks/useAuth";
import { useClubTier } from"@/hooks/useClubTier";
import { eventService } from"@/services/eventService";
import { EventForm } from"@/components/events/EventForm";
import { EventCard } from"@/components/events/EventCard";
import { EventInvitationDialog } from"@/components/events/EventInvitationDialog";
import { CreateEventRequest, UpdateEventRequest, EventResponse } from"@/types/event";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from"@/components/ui/alert-dialog";
import { logger } from"@/lib/logger";

export default function EventsPage() {
  const { user, loading } = useAuth();
  const { canSendInvitations } = useClubTier() || { canSendInvitations: false };
  const [upcomingEvents, setUpcomingEvents] = useState<EventResponse[]>([]);
  const [pastEvents, setPastEvents] = useState<EventResponse[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [pastLoading, setPastLoading] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventResponse | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Post-creation invitation prompt state
  const [showInvitationPrompt, setShowInvitationPrompt] = useState(false);
  const [newlyCreatedEvent, setNewlyCreatedEvent] = useState<EventResponse | null>(null);

  const loadUpcomingEvents = useCallback(async () => {
    if (!user?.clubId) return;
    
    try {
      setUpcomingLoading(true);
      logger.debug('events','Loading upcoming events', { clubId: user.clubId });
      const eventsData = await eventService.getEventsByClub(user.clubId,'upcoming');
      logger.debug('events','Received upcoming events', { count: eventsData.length });
      setUpcomingEvents(eventsData);
    } catch (error) {
      logger.error('events','Failed to load upcoming events', { error, clubId: user.clubId });
      const apiError = ErrorHandler.handleApiError(error, { context:'loading upcoming events' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setUpcomingLoading(false);
    }
  }, [user?.clubId]);

  // Load upcoming events by default when component mounts
  useEffect(() => {
    loadUpcomingEvents();
  }, [user, loadUpcomingEvents]);

  const loadPastEvents = async () => {
    if (!user?.clubId || pastEvents.length > 0) return; // Only load once
    
    try {
      setPastLoading(true);
      const eventsData = await eventService.getEventsByClub(user.clubId,'past');
      setPastEvents(eventsData);
    } catch (error) {
      logger.error('events','Failed to load past events', { error, clubId: user.clubId });
      const apiError = ErrorHandler.handleApiError(error, { context:'loading past events' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setPastLoading(false);
    }
  };

  const handleCreateEvent = async (eventData: CreateEventRequest) => {
    if (!user?.clubId) return;

    try {
      setFormLoading(true);
      const newEvent = await eventService.createEvent(user.clubId, eventData);
      
      // Check if the new event is upcoming or past
      const eventDate = new Date(newEvent.eventDateTime);
      const now = new Date();
      
      if (eventDate >= now) {
        setUpcomingEvents(prev => [...prev, newEvent]);
      } else {
        setPastEvents(prev => [newEvent, ...prev]);
      }
      
      toast.success("Event created successfully");
      
      // Show invitation prompt if user can send invitations and event is in the future
      if (canSendInvitations && eventDate >= now) {
        setNewlyCreatedEvent(newEvent);
        setShowInvitationPrompt(true);
      }
    } catch (error) {
      logger.error('events','Failed to create event', { error, clubId: user.clubId });
      const apiError = ErrorHandler.handleApiError(error, { context:'creating event' });
      ErrorHandler.showErrorToast(apiError);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateEvent = async (eventData: UpdateEventRequest) => {
    if (!user?.clubId || !editingEvent) return;

    try {
      setFormLoading(true);
      const updatedEvent = await eventService.updateEvent(user.clubId, editingEvent.id, eventData);
      
      // Remove from both lists first
      setUpcomingEvents(prev => prev.filter(event => event.id !== editingEvent.id));
      setPastEvents(prev => prev.filter(event => event.id !== editingEvent.id));
      
      // Add to appropriate list based on updated date
      const eventDate = new Date(updatedEvent.eventDateTime);
      const now = new Date();
      
      if (eventDate >= now) {
        setUpcomingEvents(prev => [...prev, updatedEvent]);
      } else {
        setPastEvents(prev => [updatedEvent, ...prev]);
      }

      toast.success("Event updated successfully");
    } catch (error) {
      logger.error('events','Failed to update event', { error, eventId: editingEvent.id, clubId: user.clubId });
      const apiError = ErrorHandler.handleApiError(error, { context:'updating event' });
      ErrorHandler.showErrorToast(apiError);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!user?.clubId) return;

    try {
      setIsDeleting(true);
      await eventService.deleteEvent(user.clubId, eventId);
      setUpcomingEvents(prev => prev.filter(event => event.id !== eventId));
      setPastEvents(prev => prev.filter(event => event.id !== eventId));
      toast.success("Event deleted successfully");
    } catch (error) {
      logger.error('events','Failed to delete event', { error, eventId, clubId: user.clubId });
      const apiError = ErrorHandler.handleApiError(error, { context:'deleting event' });
      ErrorHandler.showErrorToast(apiError);
    } finally {
      setIsDeleting(false);
      setEventToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const initiateDeleteEvent = (eventId: number) => {
    // Find the event to show its name in the dialog
    const event = [...upcomingEvents, ...pastEvents].find(e => e.id === eventId);
    if (event) {
      setEventToDelete(event);
      setDeleteDialogOpen(true);
    }
  };

  const handleEditEvent = (event: EventResponse) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleCloseForm = () => {
    setShowEventForm(false);
    setEditingEvent(undefined);
  };

  const handleFormSubmit = async (eventData: CreateEventRequest | UpdateEventRequest) => {
    if (editingEvent) {
      await handleUpdateEvent(eventData as UpdateEventRequest);
    } else {
      await handleCreateEvent(eventData as CreateEventRequest);
    }
  };

  const renderEventGrid = (events: EventResponse[], isLoading: boolean, emptyMessage: string, showCreateButton: boolean = true) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        </div>
      );
    }

    if (events.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="mb-6">
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-success/20   rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-gradient-to-br from-background to-muted/20 rounded-full flex items-center justify-center">
                <Calendar className="h-10 w-10 text-primary animate-bounce" style={{ animationDelay:'0.5s' }} />
              </div>
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-4" role="heading" aria-level={3}>
            {emptyMessage}
          </h3>
          {showCreateButton ? (
            <div className="max-w-md mx-auto mb-8">
              <p className="text-muted-foreground leading-relaxed mb-8">
                Create your first event to get started with organizing exciting club activities and bringing members together.
              </p>
              <div className="space-y-4">
                <Button
                  onClick={() => setShowEventForm(true)}
                  className="bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-primary-foreground font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Event
                </Button>
                <p className="text-xs text-muted-foreground">
                  Organize meetings, social gatherings, workshops, and more
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <p className="text-muted-foreground leading-relaxed">
                Events that have already occurred will appear here for your records and reference.
              </p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onEdit={handleEditEvent}
            onDelete={initiateDeleteEvent}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
              <p className="text-muted-foreground">Loading events...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto glass border border-border/50 rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Events
            </h1>
            <p className="text-muted-foreground mt-2">
              Schedule and manage club events and activities
            </p>
          </div>
          <Button
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            onClick={() => setShowEventForm(true)}
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>

        {/* Tabbed Event Lists */}
        <div className="glass border-border/50 rounded-lg p-6 shadow-lg hover:glass-strong transition-all duration-300">
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50 backdrop-blur-sm border border-border/30 p-1">
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-card/90 data-[state=active]:backdrop-blur-lg data-[state=active]:shadow-sm transition-all duration-200">Upcoming</TabsTrigger>
              <TabsTrigger value="past" onClick={loadPastEvents} className="data-[state=active]:bg-card/90 data-[state=active]:backdrop-blur-lg data-[state=active]:shadow-sm transition-all duration-200">Past</TabsTrigger>
            </TabsList>
          
          <TabsContent value="upcoming" className="mt-6">
            {renderEventGrid(
              upcomingEvents, 
              upcomingLoading,"No upcoming events",
              true
            )}
          </TabsContent>
          
          <TabsContent value="past" className="mt-6">
            {renderEventGrid(
              pastEvents, 
              pastLoading,"No past events",
              false
            )}
          </TabsContent>
        </Tabs>
        </div>

        {/* Event Form Modal */}
        <EventForm
          open={showEventForm}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
          event={editingEvent}
          isEditing={!!editingEvent}
          isLoading={formLoading}
        />

        {/* Post-Creation Invitation Prompt */}
        <AlertDialog open={showInvitationPrompt} onOpenChange={setShowInvitationPrompt}>
          <AlertDialogContent className="glass border-border/50 backdrop-blur-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/20">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <span>Send Event Invitations?</span>
              </AlertDialogTitle>
              <AlertDialogDescription>
                Your event &ldquo;{newlyCreatedEvent?.name}&rdquo; has been created successfully! 
                Would you like to send invitations to your club members now?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="border-t border-border/50 pt-4">
              <AlertDialogCancel onClick={() => {
                setShowInvitationPrompt(false);
                setNewlyCreatedEvent(null);
              }} className="glass-soft border-border/50 hover:glass transition-all duration-200">
                Skip for now
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowInvitationPrompt(false);
                  // The invitation dialog will handle setting newlyCreatedEvent to null when closed
                }}
                className="bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                Send Invitations
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Enhanced Invitation Dialog */}
        {newlyCreatedEvent && !showInvitationPrompt && (
          <EventInvitationDialog
            open={!!newlyCreatedEvent}
            onClose={() => setNewlyCreatedEvent(null)}
            event={newlyCreatedEvent}
            onInvitationsSent={() => {
              // Reload events to reflect invitation updates
              loadUpcomingEvents();
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="glass border-border/50 backdrop-blur-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-destructive/20 to-destructive/10">
                  <Calendar className="h-5 w-5 text-destructive" />
                </div>
                <span>Delete Event</span>
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{eventToDelete?.name}&rdquo;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="border-t border-border/50 pt-4">
              <AlertDialogCancel disabled={isDeleting} className="glass-soft border-border/50 hover:glass transition-all duration-200">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (eventToDelete) {
                    handleDeleteEvent(eventToDelete.id);
                  }
                }}
                disabled={isDeleting}
                className="bg-gradient-to-r from-destructive to-destructive hover:from-destructive/90 hover:to-destructive/90 text-destructive-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
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