"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Textarea not used in current implementation
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
// Separator not used in current implementation
import { 
  // Users, 
  Plus, 
  Search, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  UserPlus, 
  Bell, 
  Download,
  // Clock,
  // AlertCircle,
  // CheckCircle,
  Mail,
  Smartphone
} from "lucide-react";
import { eventService } from '@/services/eventService';
import { getSignalRConnection, HubName } from '@/hooks/signalr-connection';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';

interface WaitlistEntry {
  id: number;
  eventId: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  position: number;
  joinedAt: string;
  notificationPreferences: ('email' | 'push')[];
  estimatedWaitTime: string;
}

interface EventDetails {
  id: number;
  _clubId: number;
  name: string;
  eventDateTime: string;
  location: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  maxCapacity?: number;
  currentAttendees?: number;
  waitlistEnabled?: boolean;
  attendeeCount: number;
  totalRsvpCount: number;
}

interface WaitlistManagerProps {
  eventId: number;
  _clubId: number;
}

export function WaitlistManager({ eventId, _clubId: _clubId }: WaitlistManagerProps) {
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [_selectedMembers, _setSelectedMembers] = useState<number[]>([]);

  // Add member form
  const [memberToAdd, setMemberToAdd] = useState({
    memberId: '',
    notificationPreferences: ['email'] as ('email' | 'push')[],
  });

  // SignalR connection for real-time updates
  const [connection, setConnection] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadWaitlistData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadWaitlistData is defined below and depends on eventId and _clubId
  }, [eventId, _clubId]);

  useEffect(() => {
    const initializeSignalR = async () => {
      try {
        const signalRConnection = await getSignalRConnection('eventEngagement' as HubName);
        setConnection(signalRConnection);
        setIsConnected(signalRConnection.isConnected());
        
        // Set up real-time event listeners
        signalRConnection.on('WaitlistUpdated', (updatedWaitlist: WaitlistEntry[]) => {
          setWaitlistEntries(updatedWaitlist);
          toast.success("The waitlist has been updated in real-time");
        });

        signalRConnection.on('WaitlistPositionChanged', (data: { memberId: number, newPosition: number }) => {
          setWaitlistEntries(prev => 
            prev.map(entry => 
              entry.memberId === data.memberId 
                ? { ...entry, position: data.newPosition }
                : entry
            )
          );
        });

        // Join the event group for real-time updates
        await signalRConnection.invoke('JoinEventGroup', eventId);
      } catch (error) {
        logger.error('signalr', 'Failed to initialize SignalR for waitlist', { error, eventId });
      }
    };

    initializeSignalR();

    return () => {
      if (connection) {
        connection.off('WaitlistUpdated');
        connection.off('WaitlistPositionChanged');
        connection.invoke('LeaveEventGroup', eventId).catch((error: Error) =>
          logger.error('signalr', 'Failed to leave event group', { error, eventId })
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- connection and toast are stable, only reinitialize when eventId changes
  }, [eventId]);

  const loadWaitlistData = async () => {
    try {
      setLoading(true);
      const [waitlistData, eventData] = await Promise.all([
        eventService.getEventWaitlist(_clubId, eventId),
        eventService.getEventById(_clubId, eventId)
      ]);
      
      setWaitlistEntries(waitlistData as unknown as WaitlistEntry[]);
      setEvent(eventData as unknown as EventDetails);
      setError(null);
    } catch (err) {
      setError('Failed to load waitlist data');
      logger.error('events', 'Error loading waitlist data', { error: err, eventId, clubId: _clubId });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWaitlist = async () => {
    try {
      if (!memberToAdd.memberId) {
        toast.error("Please select a member to add");
        return;
      }

      const newEntry = await eventService.addToWaitlist(_clubId, eventId, {
        memberId: parseInt(memberToAdd.memberId),
        notificationPreferences: memberToAdd.notificationPreferences,
      } as any);

      setWaitlistEntries(prev => [...prev, newEntry as unknown as WaitlistEntry]);
      setShowAddDialog(false);
      setMemberToAdd({ memberId: '', notificationPreferences: ['email'] });

      toast.success("Member added to waitlist");
    } catch (err) {
      toast.error("Failed to add member to waitlist");
      logger.error('events', 'Error adding member to waitlist', { error: err, eventId, memberId: memberToAdd.memberId, clubId: _clubId });
    }
  };

  const handleRemoveFromWaitlist = async (entryId: number) => {
    try {
      await eventService.removeFromWaitlist(_clubId, eventId, entryId);
      setWaitlistEntries(prev => prev.filter(entry => entry.id !== entryId));

      toast.success("Member removed from waitlist");
    } catch (err) {
      toast.error("Failed to remove member from waitlist");
      logger.error('events', 'Error removing member from waitlist', { error: err, eventId, entryId, clubId: _clubId });
    }
  };

  const handlePromoteFromWaitlist = async (entryId: number) => {
    try {
      await eventService.promoteFromWaitlist(_clubId, eventId, entryId);
      await loadWaitlistData(); // Reload to get updated data

      toast.success("Member promoted to event");
    } catch (err) {
      toast.error("Failed to promote member");
      logger.error('events', 'Error promoting member from waitlist', { error: err, eventId, entryId, clubId: _clubId });
    }
  };

  const handleReorderWaitlist = async (entryId: number, direction: 'up' | 'down') => {
    const currentEntry = waitlistEntries.find(e => e.id === entryId);
    if (!currentEntry) return;

    const newPosition = direction === 'up' 
      ? Math.max(1, currentEntry.position - 1)
      : currentEntry.position + 1;

    try {
      const reorderedEntries = waitlistEntries.map(entry => {
        if (entry.id === entryId) {
          return { ...entry, position: newPosition };
        }
        if (direction === 'up' && entry.position === newPosition) {
          return { ...entry, position: currentEntry.position };
        }
        if (direction === 'down' && entry.position === newPosition) {
          return { ...entry, position: currentEntry.position };
        }
        return entry;
      });

      await eventService.reorderWaitlist(_clubId, eventId, 
        reorderedEntries.map(e => ({ id: e.id, position: e.position })) as any
      );

      setWaitlistEntries(reorderedEntries.sort((a, b) => a.position - b.position));
    } catch (err) {
      toast.error("Failed to reorder waitlist");
      logger.error('events', 'Error reordering waitlist', { error: err, eventId, entryId, direction, clubId: _clubId });
    }
  };

  const handleBulkNotify = async () => {
    try {
      const result = await eventService.notifyWaitlist(_clubId, eventId, {
        message: "Update regarding your waitlist position",
        methods: ['email', 'push'],
      } as any);

      toast.success(`Notifications sent to ${result.sent} members`);
    } catch (err) {
      toast.error("Failed to send notifications");
      logger.error('communications', 'Error sending waitlist notifications', { error: err, eventId, clubId: _clubId });
    }
  };

  const filteredEntries = waitlistEntries.filter(entry =>
    entry.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.memberEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const spotsAvailable = event && event.maxCapacity && event.currentAttendees !== undefined ? Math.max(0, event.maxCapacity - event.currentAttendees) : 0;
  const waitlistProgress = event && event.currentAttendees !== undefined && event.maxCapacity ? (event.currentAttendees / event.maxCapacity) * 100 : 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">Loading waitlist...</div>
      </div>
    );
  }

  return (
    <div data-testid="waitlist-container" className="p-6 space-y-6 flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Event Waitlist</h1>
            {event && (
              <p className="text-muted-foreground">{event.name}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddDialog(true)} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add to Waitlist
            </Button>
            <Button variant="outline" onClick={() => setShowBulkActions(!showBulkActions)}>
              Manage Waitlist
            </Button>
          </div>
        </div>

        {/* Event Capacity Status */}
        {event && event.maxCapacity && event.currentAttendees !== undefined && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Event Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span>Current attendance</span>
                  <span className="font-semibold">{event.currentAttendees}/{event.maxCapacity}</span>
                </div>
                <Progress value={waitlistProgress} className="h-2" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {spotsAvailable > 0 ? `${spotsAvailable} spots available` : 'Event at capacity'}
                  </span>
                  <span className="text-muted-foreground">
                    {waitlistEntries.length} on waitlist
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bulk Actions */}
        {showBulkActions && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Bulk Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleBulkNotify}>
                  <Bell className="h-4 w-4 mr-2" />
                  Notify All
                </Button>
                <Button variant="outline" onClick={() => {/* Export functionality */}}>
                  <Download className="h-4 w-4 mr-2" />
                  Export List
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search waitlist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
              <Button onClick={loadWaitlistData} variant="outline" className="mt-2">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Waitlist Entries */}
        <div className="space-y-3">
          {filteredEntries.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No members found matching your search.' : 'No members on waitlist.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredEntries.map((entry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {entry.position}
                        </div>
                        <div>
                          <h3 className="font-medium">{entry.memberName}</h3>
                          <p className="text-sm text-muted-foreground">{entry.memberEmail}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>Position: {entry.position}</span>
                            <span>Est. wait: {entry.estimatedWaitTime}</span>
                            <span>Joined: {new Date(entry.joinedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Notification preferences */}
                      <div className="flex gap-1">
                        {entry.notificationPreferences.includes('email') && (
                          <Badge variant="outline" className="text-xs">
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Badge>
                        )}
                        {entry.notificationPreferences.includes('push') && (
                          <Badge variant="outline" className="text-xs">
                            <Smartphone className="h-3 w-3 mr-1" />
                            Push
                          </Badge>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorderWaitlist(entry.id, 'up')}
                          disabled={entry.position === 1}
                          aria-label="Move up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorderWaitlist(entry.id, 'down')}
                          disabled={entry.position === waitlistEntries.length}
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        {spotsAvailable > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePromoteFromWaitlist(entry.id)}
                            aria-label="Promote to event"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromWaitlist(entry.id)}
                          aria-label="Remove from waitlist"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to Waitlist</DialogTitle>
            <DialogDescription>
              Select a member to add to the event waitlist.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Member</Label>
              <Select 
                value={memberToAdd.memberId} 
                onValueChange={(value) => setMemberToAdd(prev => ({ ...prev, memberId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="101">John Doe</SelectItem>
                  <SelectItem value="102">Jane Smith</SelectItem>
                  <SelectItem value="103">Bob Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notification Preferences</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="email-notifications"
                    checked={memberToAdd.notificationPreferences.includes('email')}
                    onCheckedChange={(checked) => {
                      const prefs = checked 
                        ? [...memberToAdd.notificationPreferences, 'email' as const]
                        : memberToAdd.notificationPreferences.filter(p => p !== 'email');
                      setMemberToAdd(prev => ({ ...prev, notificationPreferences: prefs }));
                    }}
                  />
                  <Label htmlFor="email-notifications">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="push-notifications"
                    checked={memberToAdd.notificationPreferences.includes('push')}
                    onCheckedChange={(checked) => {
                      const prefs = checked 
                        ? [...memberToAdd.notificationPreferences, 'push' as const]
                        : memberToAdd.notificationPreferences.filter(p => p !== 'push');
                      setMemberToAdd(prev => ({ ...prev, notificationPreferences: prefs }));
                    }}
                  />
                  <Label htmlFor="push-notifications">Push</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddToWaitlist}>
                Add to Waitlist
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Real-time status indicator */}
      {isConnected && (
        <div className="fixed bottom-4 right-4">
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse" />
            Live updates active
          </Badge>
        </div>
      )}
    </div>
  );
}
