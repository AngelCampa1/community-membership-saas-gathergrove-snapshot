"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
// Separator not used as JSX component
import { 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  Clock, 
  MapPin, 
  Users, 
  ArrowUp, 
  ArrowDown,
  // Calendar,
  // BookOpen,
  // Award,
  AlertTriangle,
  // CheckCircle,
  // Settings,
  Play
} from "lucide-react";
import { eventService } from '@/services/eventService';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';

interface SessionResource {
  id: string;
  name: string;
  type: 'equipment' | 'material' | 'software' | 'other';
  required: boolean;
  quantity?: number;
  notes?: string;
}

interface EventSession {
  id?: number;
  sessionNumber: number;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  prerequisites: string[];
  resources: SessionResource[];
  attendeeCount?: number;
  maxCapacity?: number;
  instructorId?: number;
  instructorName?: string;
}

interface MultiSessionEvent {
  id?: number;
  clubId: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  totalSessions: number;
  sessionDuration: number;
  maxCapacity: number;
  currentRegistrations: number;
  sessions: EventSession[];
  trackingEnabled: boolean;
  progressRequirements: 'attendance' | 'completion' | 'assessment';
  certificateEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface MultiSessionEventBuilderProps {
  clubId: number;
  eventId?: number;
}

export function MultiSessionEventBuilder({ clubId, eventId }: MultiSessionEventBuilderProps) {
  const [event, setEvent] = useState<MultiSessionEvent>({
    clubId,
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    totalSessions: 0,
    sessionDuration: 120,
    maxCapacity: 50,
    currentRegistrations: 0,
    sessions: [],
    trackingEnabled: true,
    progressRequirements: 'attendance',
    certificateEnabled: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<EventSession | null>(null);
  const [conflictWarnings, setConflictWarnings] = useState<string[]>([]);
  const toast = useToast();
  
  // Session form state
  const [sessionForm, setSessionForm] = useState<EventSession>({
    sessionNumber: 1,
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    prerequisites: [],
    resources: [],
  });

  const loadEvent = async () => {
    if (!eventId) return;
    
    try {
      setLoading(true);
      const eventData = await eventService.getMultiSessionEvent(clubId, eventId);
      setEvent(eventData as unknown as MultiSessionEvent);
      setError(null);
    } catch (err) {
      setError('Failed to load event details');
      logger.error('events', 'Error loading multi-session event', { error: err, clubId, eventId });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only load when eventId changes
  }, [eventId]);

  const validateTimeConflicts = (newSession: EventSession): string[] => {
    const conflicts: string[] = [];
    const newStart = new Date(newSession.startTime);
    const newEnd = new Date(newSession.endTime);

    event.sessions.forEach((session, _index) => {
      if (editingSession && session.sessionNumber === editingSession.sessionNumber) return;
      
      const sessionStart = new Date(session.startTime);
      const sessionEnd = new Date(session.endTime);

      // Check for time overlap
      if (newStart < sessionEnd && newEnd > sessionStart) {
        conflicts.push(`Time conflict with Session ${session.sessionNumber}: ${session.name}`);
      }
    });

    return conflicts;
  };

  const handleAddSession = () => {
    const newSessionNumber = Math.max(0, ...event.sessions.map(s => s.sessionNumber)) + 1;
    setSessionForm({
      sessionNumber: newSessionNumber,
      name: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      prerequisites: [],
      resources: [],
    });
    setEditingSession(null);
    setShowSessionDialog(true);
  };

  const handleEditSession = (session: EventSession) => {
    setSessionForm({ ...session });
    setEditingSession(session);
    setShowSessionDialog(true);
  };

  const handleSaveSession = () => {
    // Validate required fields
    if (!sessionForm.name.trim() || !sessionForm.startTime || !sessionForm.endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check for time conflicts
    const conflicts = validateTimeConflicts(sessionForm);
    if (conflicts.length > 0) {
      setConflictWarnings(conflicts);
      toast.error(conflicts[0]);
      return;
    }

    if (editingSession) {
      // Update existing session
      setEvent(prev => ({
        ...prev,
        sessions: prev.sessions.map(session =>
          session.sessionNumber === editingSession.sessionNumber ? sessionForm : session
        ),
      }));
    } else {
      // Add new session
      setEvent(prev => ({
        ...prev,
        sessions: [...prev.sessions, sessionForm],
        totalSessions: prev.sessions.length + 1,
      }));
    }

    setShowSessionDialog(false);
    setConflictWarnings([]);
  };

  const handleDeleteSession = (sessionNumber: number) => {
    setEvent(prev => ({
      ...prev,
      sessions: prev.sessions.filter(session => session.sessionNumber !== sessionNumber),
      totalSessions: prev.sessions.length - 1,
    }));
  };

  const handleDuplicateSession = (session: EventSession) => {
    const newSessionNumber = Math.max(0, ...event.sessions.map(s => s.sessionNumber)) + 1;
    const duplicatedSession = {
      ...session,
      sessionNumber: newSessionNumber,
      name: `${session.name} (Copy)`,
      startTime: '',
      endTime: '',
    };
    
    setEvent(prev => ({
      ...prev,
      sessions: [...prev.sessions, duplicatedSession],
      totalSessions: prev.sessions.length + 1,
    }));
  };

  const handleReorderSession = (sessionNumber: number, direction: 'up' | 'down') => {
    const sessionIndex = event.sessions.findIndex(s => s.sessionNumber === sessionNumber);
    if (sessionIndex === -1) return;

    const newSessions = [...event.sessions];
    const targetIndex = direction === 'up' ? sessionIndex - 1 : sessionIndex + 1;

    if (targetIndex >= 0 && targetIndex < newSessions.length) {
      [newSessions[sessionIndex], newSessions[targetIndex]] = [newSessions[targetIndex], newSessions[sessionIndex]];
      setEvent(prev => ({ ...prev, sessions: newSessions }));
    }
  };

  const handleAddResource = () => {
    const newResource: SessionResource = {
      id: `resource_${Date.now()}`,
      name: '',
      type: 'equipment',
      required: true,
    };
    
    setSessionForm(prev => ({
      ...prev,
      resources: [...prev.resources, newResource],
    }));
  };

  const handleRemoveResource = (resourceId: string) => {
    setSessionForm(prev => ({
      ...prev,
      resources: prev.resources.filter(r => r.id !== resourceId),
    }));
  };

  const handleUpdateResource = (resourceId: string, updates: Partial<SessionResource>) => {
    setSessionForm(prev => ({
      ...prev,
      resources: prev.resources.map(r =>
        r.id === resourceId ? { ...r, ...updates } : r
      ),
    }));
  };

  const handleSaveEvent = async () => {
    try {
      // Validate event data
      if (!event.name.trim() || !event.description.trim()) {
        toast.error("Event name and description are required");
        return;
      }

      if (event.sessions.length === 0) {
        toast.error("At least one session is required");
        return;
      }

      setSaving(true);
      
      if (eventId) {
        await eventService.updateMultiSessionEvent(clubId, eventId, event as any);
        toast.success("Multi-session event updated successfully");
      } else {
        await eventService.createMultiSessionEvent(clubId, event as any);
        toast.success("Multi-session event created successfully");
      }
    } catch (err) {
      toast.error("Failed to create multi-session event");
      logger.error('events', 'Error saving multi-session event', { error: err, clubId, eventId, eventName: event.name, sessionsCount: event.sessions.length });
    } finally {
      setSaving(false);
    }
  };

  const calculateProgress = () => {
    if (event.sessions.length === 0) return 0;
    const completedFields = [
      event.name,
      event.description,
      event.startDate,
      event.endDate,
    ].filter(Boolean).length;
    return (completedFields / 4) * 100;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">Loading event builder...</div>
      </div>
    );
  }

  return (
    <div data-testid="multi-session-builder" className="p-6 space-y-6 flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Multi-Session Event Builder</h1>
            <p className="text-muted-foreground">Create comprehensive training programs and courses</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {/* Preview functionality */}}>
              <Play className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSaveEvent} disabled={saving}>
              {saving ? 'Saving...' : eventId ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Event Setup Progress</span>
                <span>{Math.round(calculateProgress())}%</span>
              </div>
              <Progress value={calculateProgress()} />
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
                <CardDescription>
                  Basic information about your multi-session event
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-name">Event Name *</Label>
                    <Input
                      id="event-name"
                      value={event.name}
                      onChange={(e) => setEvent(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Complete Web Development Bootcamp"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-capacity">Maximum Capacity</Label>
                    <Input
                      id="max-capacity"
                      type="number"
                      min="1"
                      max="1000"
                      value={event.maxCapacity}
                      onChange={(e) => setEvent(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) || 50 }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={event.description}
                    onChange={(e) => setEvent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the complete program, learning objectives, and outcomes"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Program Start Date *</Label>
                    <Input
                      id="start-date"
                      type="datetime-local"
                      value={event.startDate}
                      onChange={(e) => setEvent(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Program End Date *</Label>
                    <Input
                      id="end-date"
                      type="datetime-local"
                      value={event.endDate}
                      onChange={(e) => setEvent(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-duration">Default Session Duration (minutes)</Label>
                  <Input
                    id="session-duration"
                    type="number"
                    min="30"
                    max="480"
                    value={event.sessionDuration}
                    onChange={(e) => setEvent(prev => ({ ...prev, sessionDuration: parseInt(e.target.value) || 120 }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Session Management</CardTitle>
                    <CardDescription>
                      Create and organize individual sessions for your event
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddSession}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {event.sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No sessions created yet.</p>
                    <Button onClick={handleAddSession} className="mt-4">
                      Create First Session
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {event.sessions
                      .sort((a, b) => a.sessionNumber - b.sessionNumber)
                      .map((session, index) => (
                      <Card key={session.sessionNumber} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge>Session {session.sessionNumber}</Badge>
                                <CardTitle className="text-lg">{session.name}</CardTitle>
                              </div>
                              <CardDescription className="mt-1">
                                {session.description}
                              </CardDescription>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReorderSession(session.sessionNumber, 'up')}
                                disabled={index === 0}
                                aria-label="Move session up"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReorderSession(session.sessionNumber, 'down')}
                                disabled={index === event.sessions.length - 1}
                                aria-label="Move session down"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDuplicateSession(session)}
                                aria-label="Duplicate session"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSession(session)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSession(session.sessionNumber)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {session.startTime && new Date(session.startTime).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{session.location || 'TBD'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{session.attendeeCount || 0} attendees</span>
                            </div>
                          </div>
                          
                          {session.prerequisites.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm text-muted-foreground">
                                Requires: {session.prerequisites.join(', ')}
                              </p>
                            </div>
                          )}
                          
                          {session.resources.length > 0 && (
                            <div className="mt-3">
                              <div className="flex gap-2 flex-wrap">
                                {session.resources.map((resource) => (
                                  <Badge key={resource.id} variant="outline" className="text-xs">
                                    {resource.name} ({resource.type})
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress Tracking</CardTitle>
                <CardDescription>
                  Configure how participant progress is tracked
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable-tracking">Enable Attendance Tracking</Label>
                    <p className="text-sm text-muted-foreground">
                      Track which sessions participants attend
                    </p>
                  </div>
                  <Switch
                    id="enable-tracking"
                    checked={event.trackingEnabled}
                    onCheckedChange={(checked) => setEvent(prev => ({ ...prev, trackingEnabled: checked }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Progress Requirements</Label>
                  <Select 
                    value={event.progressRequirements} 
                    onValueChange={(value: MultiSessionEvent['progressRequirements']) => 
                      setEvent(prev => ({ ...prev, progressRequirements: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attendance">Attendance Only</SelectItem>
                      <SelectItem value="completion">Session Completion</SelectItem>
                      <SelectItem value="assessment">Pass Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable-certificates">Enable Certificates</Label>
                    <p className="text-sm text-muted-foreground">
                      Award certificates upon completion
                    </p>
                  </div>
                  <Switch
                    id="enable-certificates"
                    checked={event.certificateEnabled}
                    onCheckedChange={(checked) => setEvent(prev => ({ ...prev, certificateEnabled: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Overview</CardTitle>
                <CardDescription>
                  Preview of your complete multi-session event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">{event.name || 'Untitled Event'}</h3>
                    <p className="text-muted-foreground">{event.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Sessions:</span> {event.sessions.length}
                    </div>
                    <div>
                      <span className="font-medium">Capacity:</span> {event.maxCapacity} participants
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> {event.sessionDuration} min/session
                    </div>
                  </div>

                  {event.sessions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Session Schedule:</h4>
                      {event.sessions
                        .sort((a, b) => a.sessionNumber - b.sessionNumber)
                        .map((session) => (
                        <div key={session.sessionNumber} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                            {session.sessionNumber}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium">{session.name}</h5>
                            <p className="text-sm text-muted-foreground">
                              {session.startTime && new Date(session.startTime).toLocaleString()}
                              {session.location && ` • ${session.location}`}
                            </p>
                          </div>
                          {session.attendeeCount !== undefined && (
                            <Badge variant="outline">
                              {session.attendeeCount} attendees
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Session Dialog */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? 'Edit Session' : 'Add New Session'}
            </DialogTitle>
            <DialogDescription>
              Configure the session details, timing, and requirements.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Conflict Warnings */}
            {conflictWarnings.length > 0 && (
              <Card className="border-warning/30 bg-warning/10">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <h4 className="font-medium text-warning-foreground">Time Conflict Detected</h4>
                      <ul className="text-sm text-warning-foreground/80 mt-1">
                        {conflictWarnings.map((warning, index) => (
                          <li key={`warning-${index}-${warning.substring(0, 30)}`}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session-name">Session Name *</Label>
                <Input
                  id="session-name"
                  value={sessionForm.name}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Introduction to React"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-location">Location</Label>
                <Input
                  id="session-location"
                  value={sessionForm.location}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Training Room A"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-description">Session Description</Label>
              <Textarea
                id="session-description"
                value={sessionForm.description}
                onChange={(e) => setSessionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what will be covered in this session"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time *</Label>
                <Input
                  id="start-time"
                  type="datetime-local"
                  value={sessionForm.startTime}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time *</Label>
                <Input
                  id="end-time"
                  type="datetime-local"
                  value={sessionForm.endTime}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prerequisites</Label>
              <Input
                value={sessionForm.prerequisites.join(', ')}
                onChange={(e) => setSessionForm(prev => ({ 
                  ...prev, 
                  prerequisites: e.target.value.split(',').map(p => p.trim()).filter(Boolean)
                }))}
                placeholder="e.g., Session 1, Basic HTML knowledge"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple prerequisites with commas
              </p>
            </div>

            {/* Resources Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Required Resources</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddResource}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </Button>
              </div>
              
              {sessionForm.resources.length === 0 ? (
                <p className="text-sm text-muted-foreground">No resources specified</p>
              ) : (
                <div className="space-y-3">
                  {sessionForm.resources.map((resource) => (
                    <Card key={resource.id} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div className="space-y-2">
                          <Label htmlFor={`resource-name-${resource.id}`}>Resource Name</Label>
                          <Input
                            id={`resource-name-${resource.id}`}
                            value={resource.name}
                            onChange={(e) => handleUpdateResource(resource.id, { name: e.target.value })}
                            placeholder="e.g., Laptop"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`resource-type-${resource.id}`}>Resource Type</Label>
                          <Select 
                            value={resource.type} 
                            onValueChange={(value: SessionResource['type']) => 
                              handleUpdateResource(resource.id, { type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equipment">Equipment</SelectItem>
                              <SelectItem value="material">Material</SelectItem>
                              <SelectItem value="software">Software</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`resource-quantity-${resource.id}`}>Quantity</Label>
                          <Input
                            id={`resource-quantity-${resource.id}`}
                            type="number"
                            min="1"
                            value={resource.quantity || ''}
                            onChange={(e) => handleUpdateResource(resource.id, { 
                              quantity: parseInt(e.target.value) || undefined 
                            })}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={resource.required}
                            onCheckedChange={(checked) => handleUpdateResource(resource.id, { required: checked })}
                          />
                          <Label className="text-sm">Required</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveResource(resource.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSessionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSession}>
                {editingSession ? 'Update Session' : 'Add Session'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
