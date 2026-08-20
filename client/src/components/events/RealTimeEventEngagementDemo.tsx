'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealTimeEventEngagement } from '@/hooks/useRealTimeEventEngagement';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  Star, 
  Calendar,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';

// TypeScript interfaces
interface EventAttendanceData {
  eventId: number;
  eventName: string;
  totalRsvps: number;
  attendeeCount: number;
  checkedIn: number;
  noShows: number;
  attendanceRate: number;
  lastUpdated: string;
}

interface EventEngagementScore {
  eventId: number;
  eventName: string;
  overallScore: number;
  previousScore: number;
  trend: 'up' | 'down' | 'stable';
  participationRate: number;
  interactionLevel: 'low' | 'medium' | 'high';
  satisfactionScore: number;
  lastUpdated: string;
  breakdown: Record<string, number>;
}

interface EventFeedback {
  id: string;
  eventId: number;
  eventName: string;
  memberName: string;
  rating: number;
  comment: string;
  category: string;
  timestamp: string;
  isPublic: boolean;
}

interface EventRecommendation {
  id: string;
  eventId: number;
  eventName: string;
  eventDateTime: string;
  recommendationScore: number;
  reasons: string[];
  targetAudience: string[];
  confidence: number;
  lastUpdated: string;
}

interface LiveEventUpdate {
  id: string;
  type: 'attendance' | 'engagement_score' | 'feedback' | 'recommendation' | 'rsvp';
  eventId: number;
  eventName: string;
  message: string;
  timestamp: string;
  data: any;
}

interface RsvpUpdate {
  id: string;
  eventId: number;
  eventName: string;
  memberId: number;
  memberName: string;
  rsvpStatus: 'attending' | 'not_attending' | 'maybe' | 'pending';
  previousStatus: string;
  timestamp: string;
}

interface _RealTimeEventEngagementHookReturn {
  // Connection state
  isConnected: boolean;
  connectionStatus: 'Connected' | 'Connecting' | 'Reconnecting' | 'Disconnected' | 'Failed';
  isLoading: boolean;
  error: string | null;

  // Event data
  eventAttendance: Record<number, EventAttendanceData>;
  eventEngagementScores: Record<number, EventEngagementScore>;
  eventFeedback: EventFeedback[];
  eventRecommendations: EventRecommendation[];
  liveEventUpdates: LiveEventUpdate[];
  rsvpUpdates: RsvpUpdate[];

  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  subscribeToEvent: (eventId: number) => Promise<void>;
  refreshEventEngagement: (eventId?: number) => Promise<void>;
  clearEventFeedback: () => void;
  clearRecommendations: () => void;
  clearLiveUpdates: () => void;
  clearRsvpUpdates: () => void;
  clearAllData: () => void;

  // Utility methods
  getEventAttendance: (eventId: number) => EventAttendanceData | null;
  getEventEngagementScore: (eventId: number) => EventEngagementScore | null;
  getEventFeedback: (eventId: number) => EventFeedback[];
  getLiveUpdatesForEvent: (eventId: number) => LiveEventUpdate[];

  // Computed values
  hasNewFeedback: boolean;
  hasNewRecommendations: boolean;
  hasLiveUpdates: boolean;
  totalMonitoredEvents: number;
  activeEventsCount: number;
}

interface RealTimeEventEngagementDemoProps {
  clubId?: number;
}

/**
 * Demo component showcasing the useRealTimeEventEngagement hook
 * This demonstrates real-time event engagement monitoring with live updates
 */
const RealTimeEventEngagementDemo: React.FC<RealTimeEventEngagementDemoProps> = ({ clubId: _clubId = 123 }) => {
  // All hooks must be called first
  const [_selectedEventId, _setSelectedEventId] = useState<number | null>(null);
  
  // Initialize the real-time event engagement hook before any early returns
  const {
    // Connection state
    isConnected,
    connectionStatus,
    isLoading,
    error,

    // Event data
    eventAttendance,
    eventEngagementScores,
    eventFeedback,
    eventRecommendations,
    liveEventUpdates,
    rsvpUpdates,

    // Actions
    connect,
    disconnect,
    subscribeToEvent: _subscribeToEvent,
    refreshEventEngagement,
    clearEventFeedback,
    clearRecommendations,
    clearLiveUpdates,
    clearAllData,

    // Utility methods
    getEventAttendance: _getEventAttendance,
    getEventEngagementScore: _getEventEngagementScore,
    getEventFeedback: _getEventFeedback,
    getLiveUpdatesForEvent: _getLiveUpdatesForEvent,

    // Computed values
    hasNewFeedback,
    hasNewRecommendations,
    hasLiveUpdates,
    totalMonitoredEvents,
    activeEventsCount
  } = useRealTimeEventEngagement(Number(_clubId), _selectedEventId, {
    autoConnect: true,
    showToastNotifications: true,
    enableAttendanceUpdates: true,
    enableEngagementScoring: true,
    enableFeedbackNotifications: true,
    enableRecommendationUpdates: true
  });

  // Parameter validation after hooks
  if (typeof _clubId !== 'number' || _clubId <= 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <WifiOff className="h-12 w-12 mx-auto mb-4" />
            <p className="font-semibold">Invalid Club ID</p>
            <p className="text-sm mt-2">Please provide a valid numeric club ID greater than 0</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Connection status indicator
  const getConnectionStatusColor = (): string => {
    switch (connectionStatus as any) {
      case 'Connected': return 'bg-success';
      case 'Connecting':
      case 'Reconnecting': return 'bg-warning';
      case 'Disconnected':
      case 'Failed': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  // Format timestamp for display
  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Get engagement score trend icon
  const getTrendIcon = (trend: 'up' | 'down' | 'stable'): React.ReactNode => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-success" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  // Render star rating
  const renderStarRating = (rating: number): React.ReactNode => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-warning text-warning' : 'text-muted'}`}
      />
    ));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Connecting to real-time event engagement...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <WifiOff className="h-12 w-12 mx-auto mb-4" />
            <p className="font-semibold">Connection Error</p>
            <p className="text-sm mt-2">{error}</p>
            <Button onClick={connect} className="mt-4">
              Retry Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {isConnected ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
              Real-Time Event Engagement Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}></div>
              <span className="text-sm text-muted-foreground">{connectionStatus}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalMonitoredEvents}</div>
              <div className="text-sm text-muted-foreground">Monitored Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{activeEventsCount}</div>
              <div className="text-sm text-muted-foreground">Active Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{liveEventUpdates.length}</div>
              <div className="text-sm text-muted-foreground">Live Updates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{eventFeedback.length}</div>
              <div className="text-sm text-muted-foreground">Recent Feedback</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="live-updates" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="live-updates" className="relative">
            Live Updates
            {hasLiveUpdates && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                {liveEventUpdates.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="feedback" className="relative">
            Feedback
            {hasNewFeedback && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                {eventFeedback.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="relative">
            Recommendations
            {hasNewRecommendations && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                {eventRecommendations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rsvps">RSVPs</TabsTrigger>
        </TabsList>

        {/* Live Updates Tab */}
        <TabsContent value="live-updates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Event Updates
              </CardTitle>
              <Button variant="outline" size="sm" onClick={clearLiveUpdates}>
                Clear All
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {liveEventUpdates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No live updates yet. Updates will appear here in real-time.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {liveEventUpdates.map((update) => (
                      <div key={update.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <Badge variant={
                          update.type === 'attendance' ? 'default' :
                          update.type === 'engagement_score' ? 'secondary' :
                          update.type === 'feedback' ? 'outline' :
                          update.type === 'recommendation' ? 'destructive' : 'default'
                        }>
                          {update.type}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{update.eventName}</p>
                          <p className="text-sm text-muted-foreground">{update.message}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {formatTime(update.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Event Attendance Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Event Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {Object.values(eventAttendance).map((attendance) => (
                  <div key={attendance.eventId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{attendance.eventName}</h4>
                      <Badge variant="secondary">
                        {attendance.attendanceRate}% attendance
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total RSVPs:</span>
                        <div className="font-medium">{attendance.totalRsvps}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Checked In:</span>
                        <div className="font-medium text-success">{attendance.checkedIn}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">No Shows:</span>
                        <div className="font-medium text-destructive">{attendance.noShows}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Updated:</span>
                        <div className="font-medium">{formatTime(attendance.lastUpdated)}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {Object.keys(eventAttendance).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No attendance data available yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Event Engagement Scores Tab */}
        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Engagement Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {Object.values(eventEngagementScores).map((score) => (
                  <div key={score.eventId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{score.eventName}</h4>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(score.trend)}
                        <Badge variant={
                          score.overallScore >= 80 ? 'default' :
                          score.overallScore >= 60 ? 'secondary' : 'destructive'
                        }>
                          {score.overallScore}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Participation:</span>
                        <div className="font-medium">{score.participationRate}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Interaction:</span>
                        <div className="font-medium capitalize">{score.interactionLevel}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Satisfaction:</span>
                        <div className="font-medium">{score.satisfactionScore}/10</div>
                      </div>
                    </div>
                  </div>
                ))}
                {Object.keys(eventEngagementScores).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No engagement scores available yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Event Feedback Tab */}
        <TabsContent value="feedback">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Event Feedback
              </CardTitle>
              <Button variant="outline" size="sm" onClick={clearEventFeedback}>
                Clear All
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {eventFeedback.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No feedback received yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {eventFeedback.map((feedback) => (
                      <div key={feedback.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm">{feedback.eventName}</p>
                            <p className="text-sm text-muted-foreground">by {feedback.memberName}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {renderStarRating(feedback.rating)}
                          </div>
                        </div>
                        {feedback.comment && (
                          <p className="text-sm mb-2">{feedback.comment}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground/70">
                          <Badge variant="outline">{feedback.category}</Badge>
                          <span>{formatTime(feedback.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Event Recommendations Tab */}
        <TabsContent value="recommendations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Recommendations
              </CardTitle>
              <Button variant="outline" size="sm" onClick={clearRecommendations}>
                Clear All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {eventRecommendations.map((rec) => (
                  <div key={rec.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{rec.eventName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(rec.eventDateTime).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={
                        rec.recommendationScore >= 80 ? 'default' :
                        rec.recommendationScore >= 60 ? 'secondary' : 'outline'
                      }>
                        {rec.recommendationScore}% match
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Reasons:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rec.reasons?.map((reason, idx) => (
                            <Badge key={idx} variant="outline">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target Audience:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rec.targetAudience?.map((audience, idx) => (
                            <Badge key={idx} variant="secondary">
                              {audience}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {eventRecommendations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recommendations available yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RSVP Updates Tab */}
        <TabsContent value="rsvps">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                RSVP Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {rsvpUpdates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No RSVP updates yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rsvpUpdates.map((update) => (
                      <div key={update.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Badge variant={
                          update.rsvpStatus === 'attending' ? 'default' :
                          update.rsvpStatus === 'not_attending' ? 'destructive' : 'secondary'
                        }>
                          {update.rsvpStatus}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {update.memberName} → {update.eventName}
                          </p>
                          {update.previousStatus && (
                            <p className="text-xs text-muted-foreground">
                              Changed from {update.previousStatus}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground/70">
                          {formatTime(update.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          onClick={() => refreshEventEngagement()}
          disabled={!isConnected}
        >
          Refresh All Data
        </Button>
        <Button 
          variant="outline" 
          onClick={clearAllData}
        >
          Clear All Data
        </Button>
        <Button 
          variant={isConnected ? "destructive" : "default"} 
          onClick={isConnected ? disconnect : connect}
        >
          {isConnected ? "Disconnect" : "Connect"}
        </Button>
      </div>
    </div>
  );
};

export default RealTimeEventEngagementDemo;