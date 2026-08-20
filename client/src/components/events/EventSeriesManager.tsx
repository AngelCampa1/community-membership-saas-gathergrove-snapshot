"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Calendar, MapPin, Plus, Search, Edit, Trash2, Eye, RotateCcw, Users } from "lucide-react";
import { eventService } from '@/services/eventService';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/lib/logger';

interface EventSeries {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  recurrencePattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceInterval: number;
  daysOfWeek: number[];
  location: string;
  duration: number;
  events: SeriesEvent[];
  clubId: number;
  createdAt: string;
  updatedAt: string;
}

interface SeriesEvent {
  id: number;
  seriesId: number;
  name: string;
  eventDateTime: string;
  location: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  clubId: number;
  attendeeCount: number;
  totalRsvpCount: number;
}

interface EventSeriesManagerProps {
  clubId: number;
}

export function EventSeriesManager({ clubId }: EventSeriesManagerProps) {
  const [eventSeries, setEventSeries] = useState<EventSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<EventSeries | null>(null);
  const toast = useToast();
  const [showEventsDialog, setShowEventsDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    recurrencePattern: 'weekly' as EventSeries['recurrencePattern'],
    recurrenceInterval: 1,
    daysOfWeek: [1], // Monday
    location: '',
    duration: 60,
  });

  const loadEventSeries = useCallback(async () => {
    try {
      setLoading(true);
      const data = await eventService.getEventSeries(clubId);
      setEventSeries(data as unknown as EventSeries[]);
      setError(null);
    } catch (err) {
      setError('Failed to load event series');
      logger.error('events', 'Error loading event series', { error: err, clubId });
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    loadEventSeries();
  }, [clubId, loadEventSeries]);

  const handleCreateSeries = async () => {
    try {
      // Validate required fields
      if (!formData.name.trim() || !formData.description.trim()) {
        toast.error("Please fill in all required fields");
        return;
      }

      const newSeries = await eventService.createEventSeries(clubId, formData as any);
      setEventSeries(prev => [...prev, newSeries as unknown as EventSeries]);
      setShowCreateForm(false);
      resetForm();
      toast.success("Event series created successfully");
    } catch (err) {
      toast.error("Failed to create event series");
      logger.error('events', 'Error creating event series', { error: err, clubId, formData });
    }
  };

  const handleDeleteSeries = async (seriesId: number) => {
    try {
      await eventService.deleteEventSeries(clubId, seriesId);
      setEventSeries(prev => prev.filter(series => series.id !== seriesId));
      toast.success("Event series deleted successfully");
    } catch (err) {
      toast.error("Failed to delete event series");
      logger.error('events', 'Error deleting event series', { error: err, clubId, seriesId });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      recurrencePattern: 'weekly',
      recurrenceInterval: 1,
      daysOfWeek: [1],
      location: '',
      duration: 60,
    });
  };

  const filteredSeries = eventSeries.filter(series =>
    series.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    series.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatRecurrence = (series: EventSeries) => {
    const patterns = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
    };
    return patterns[series.recurrencePattern];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">Loading event series...</div>
      </div>
    );
  }

  return (
    <div data-testid="event-series-container" className="p-6 space-y-6 flex flex-col md:flex-row gap-6">
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Event Series Management</h1>
            <p className="text-muted-foreground">Create and manage recurring events</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create New Series
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search event series..."
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
              <Button onClick={loadEventSeries} variant="outline" className="mt-2">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Event Series List */}
        <div className="grid gap-4">
          {filteredSeries.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No event series found matching your search.' : 'No event series created yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSeries.map((series) => (
              <Card key={series.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{series.name}</CardTitle>
                      <CardDescription className="mt-1">{series.description}</CardDescription>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSeries(series);
                          setShowEventsDialog(true);
                        }}
                        aria-label="View events"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* Edit functionality */}}
                        aria-label="Edit series"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSeries(series.id)}
                        className="delete-series-button"
                        aria-label="Delete series"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-muted-foreground" />
                      <span>{formatRecurrence(series)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(series.startDate)} - {formatDate(series.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{series.events.length} events</span>
                    </div>
                  </div>
                  {series.location && (
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{series.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{formatRecurrence(series)}</Badge>
                    <Badge variant="outline">{series.duration} minutes</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create Series Form */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Event Series</DialogTitle>
            <DialogDescription>
              Set up a recurring event series with customizable patterns.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="series-name">Series Name *</Label>
                <Input
                  id="series-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Weekly Team Meeting"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Conference Room A"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose and content of this event series"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date *</Label>
                <Input
                  id="start-date"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date *</Label>
                <Input
                  id="end-date"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recurrence-pattern">Recurrence Pattern *</Label>
                <Select
                  value={formData.recurrencePattern}
                  onValueChange={(value: EventSeries['recurrencePattern']) =>
                    setFormData(prev => ({ ...prev, recurrencePattern: value }))
                  }
                >
                  <SelectTrigger id="recurrence-pattern">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interval">Every</Label>
                <Input
                  id="interval"
                  type="number"
                  min="1"
                  max="52"
                  value={formData.recurrenceInterval}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurrenceInterval: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="480"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                />
              </div>
            </div>

            {formData.recurrencePattern === 'weekly' && (
              <div className="space-y-2">
                <Label>Days of Week</Label>
                <div className="flex gap-2 flex-wrap">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                    <Button
                      key={day}
                      variant={formData.daysOfWeek.includes(index) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const newDays = formData.daysOfWeek.includes(index)
                          ? formData.daysOfWeek.filter(d => d !== index)
                          : [...formData.daysOfWeek, index];
                        setFormData(prev => ({ ...prev, daysOfWeek: newDays }));
                      }}
                    >
                      {day.substring(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSeries}>
                Create Series
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Events Dialog */}
      <Dialog open={showEventsDialog} onOpenChange={setShowEventsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upcoming Events</DialogTitle>
            <DialogDescription>
              Events in the series: {selectedSeries?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedSeries && (
            <div className="space-y-4">
              {selectedSeries.events.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No events scheduled yet.
                </p>
              ) : (
                selectedSeries.events.map((event) => (
                  <Card key={event.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                      <CardDescription>
                        {new Date(event.eventDateTime).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{event.attendeeCount} attendees</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{event.totalRsvpCount} RSVPs</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
